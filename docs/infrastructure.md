# Infrastructure & CI/CD Documentation

This document covers Docker containerization, Azure cloud deployment, and GitHub Actions CI/CD pipelines for the Down Under Discord Bot.

## Table of Contents

- [Docker](#docker)
- [Azure Infrastructure](#azure-infrastructure)
- [GitHub Actions](#github-actions)
- [Deployment Guide](#deployment-guide)
- [Secrets and Configuration](#secrets-and-configuration)

---

## Docker

### Bot Dockerfile (`infrastructure/docker/bot.Dockerfile`)

Multi-stage build optimized for production:

**Stage 1: Builder**
```
Base: node:22-alpine
Purpose: Build shared package, generate Prisma client, compile TypeScript
Tools: pnpm, python3, make, g++ (for native modules)
```

Steps:
1. Enable pnpm via corepack
2. Install native build tools
3. Copy package manifests and install dependencies (`--frozen-lockfile`)
4. Build the shared package (`packages/shared/`)
5. Generate Prisma client
6. Build the bot TypeScript to `dist/`

**Stage 2: Runner**
```
Base: node:22-alpine
Purpose: Minimal production runtime
Additions: FFmpeg (for audio processing)
```

Steps:
1. Copy built artifacts from builder (dist, prisma schema, generated client)
2. Install production-only dependencies
3. Regenerate Prisma client for the runtime environment
4. Expose port 3001
5. Run `node packages/bot/dist/index.js`

### Docker Compose (`infrastructure/docker/docker-compose.yml`)

Single-service setup for local deployment:

```yaml
services:
  bot:
    build:
      context: ../..                    # Repo root
      dockerfile: infrastructure/docker/bot.Dockerfile
    ports: ['3001:3001']
    restart: unless-stopped
```

**Environment variables** (passed from host `.env` or shell):

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_TOKEN` | Yes | Discord bot token |
| `DISCORD_CLIENT_ID` | Yes | Discord application client ID |
| `SPOTIFY_CLIENT_ID` | No | Spotify API client ID |
| `SPOTIFY_CLIENT_SECRET` | No | Spotify API client secret |

**Persistent volumes:**

| Volume | Container Path | Purpose |
|--------|---------------|---------|
| `bot-data` | `/app/packages/bot/prisma/data` | SQLite database file |
| `bot-logs` | `/app/packages/bot/logs` | Application logs |
| `music-uploads` | `/app/packages/bot/uploads` | Uploaded audio files |

**Health check:**
- Endpoint: `http://localhost:3001/api/health`
- Interval: 30s, timeout: 10s, retries: 3
- Start period: 15s (grace period for bot to initialize)

### Running with Docker

```bash
# Build and start
cd infrastructure/docker
DISCORD_TOKEN=your-token DISCORD_CLIENT_ID=your-id docker compose up -d

# View logs
docker compose logs -f bot

# Stop
docker compose down

# Rebuild after code changes
docker compose up -d --build
```

### Docker Tips

- The SQLite database persists in the `bot-data` volume. To reset, run `docker volume rm docker_bot-data`.
- FFmpeg is included in the image. No need to install it on the host.
- The container uses Alpine Linux for a small footprint (~250MB image).
- To use Spotify, pass `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` via environment.

---

## Azure Infrastructure

### Bicep Template (`infrastructure/azure/bicep/main.bicep`)

Infrastructure as Code using Azure Bicep. Deploys a complete bot hosting environment.

### Resources Created

| Resource | Type | SKU/Tier | Purpose |
|----------|------|----------|---------|
| Log Analytics Workspace | `Microsoft.OperationalInsights/workspaces` | PerGB2018 | Centralized logging, 30-day retention |
| Container Registry (ACR) | `Microsoft.ContainerRegistry/registries` | Basic | Store Docker images |
| Container App Environment | `Microsoft.App/managedEnvironments` | -- | Hosting environment for containers |
| Key Vault | `Microsoft.KeyVault/vaults` | Standard | Secure secret storage |
| Container App (Bot) | `Microsoft.App/containerApps` | 0.5 CPU, 1GB RAM | The bot itself |

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `environment` | string | `prod` | Environment name (dev, staging, prod) |
| `location` | string | Resource group location | Azure region |
| `discordToken` | secure string | -- | Discord bot token |
| `discordClientId` | string | -- | Discord application client ID |
| `spotifyClientId` | string | `''` | Optional Spotify client ID |
| `spotifyClientSecret` | secure string | `''` | Optional Spotify client secret |

### Outputs

| Output | Description |
|--------|-------------|
| `acrLoginServer` | ACR login URL (e.g., `downunderprodacr.azurecr.io`) |
| `botAppUrl` | Public bot URL (e.g., `https://downunder-prod-bot.azurecontainerapps.io`) |
| `keyVaultName` | Key Vault name for secret management |

### Container App Configuration

- **Ingress**: External, port 3001, auto transport (HTTP + WebSocket)
- **Scale**: Fixed at 1 replica (min and max). Music bots are stateful and shouldn't scale horizontally.
- **Resources**: 0.5 vCPU, 1 GB memory
- **Secrets**: Discord token, client ID, Spotify credentials stored as Container App secrets (sourced from parameters)
- **Environment variables**: NODE_ENV=production, PORT=3001, DATABASE_URL, FFMPEG_PATH

### Deploying to Azure

```bash
# Login to Azure
az login

# Create resource group
az group create --name rg-downunder-bot --location australiaeast

# Deploy infrastructure
az deployment group create \
  --resource-group rg-downunder-bot \
  --template-file infrastructure/azure/bicep/main.bicep \
  --parameters \
    environment=prod \
    discordToken='your-discord-token' \
    discordClientId='your-client-id'
```

### Key Vault

Secrets are stored in Key Vault with RBAC authorization and soft delete (7-day retention):

| Secret Name | Description |
|-------------|-------------|
| `discord-token` | Discord bot token |
| `discord-client-id` | Discord application client ID |

To access Key Vault secrets, assign the appropriate RBAC role to your identity:

```bash
az role assignment create \
  --assignee <your-principal-id> \
  --role "Key Vault Secrets User" \
  --scope /subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.KeyVault/vaults/<vault>
```

---

## GitHub Actions

### CI Workflow (`.github/workflows/ci.yml`)

**Triggers:** Pull requests and pushes to `main` or `develop`

**Concurrency:** Cancels previous runs for the same branch

#### Job: `lint-and-build`

1. Checkout code
2. Set up pnpm 10 and Node.js 22 (with cache)
3. `pnpm install --frozen-lockfile`
4. Build shared package
5. Generate Prisma client
6. Type-check bot package
7. Type-check desktop package
8. Build bot
9. Build desktop frontend (Vite)

#### Job: `test-bot` (depends on `lint-and-build`)

1. Same setup (checkout, pnpm, Node.js)
2. Build shared + generate Prisma
3. Run bot test suite (`pnpm --filter discord-bot test`)

### Bot Deploy Workflow (`.github/workflows/deploy-bot.yml`)

**Triggers:** Push to `main` when bot, shared, docker, or workflow files change

**Environment:** `production`

#### Job: `build-and-deploy`

1. Checkout code
2. Log in to Azure Container Registry (ACR)
3. Build Docker image with two tags:
   - `<acr>/down-under-bot:<commit-sha>` (immutable)
   - `<acr>/down-under-bot:latest` (rolling)
4. Push both tags to ACR
5. Log in to Azure (service principal)
6. Deploy to Azure Container Apps (`downunder-prod-bot`)

**Required secrets:**

| Secret | Description |
|--------|-------------|
| `ACR_LOGIN_SERVER` | ACR hostname (e.g., `downunderprodacr.azurecr.io`) |
| `ACR_USERNAME` | ACR admin username |
| `ACR_PASSWORD` | ACR admin password |
| `AZURE_CREDENTIALS` | Service principal JSON for Azure login |
| `AZURE_RESOURCE_GROUP` | Resource group name |

### Desktop Release Workflow (`.github/workflows/release-desktop.yml`)

**Triggers:** Git tags matching `v*` (e.g., `v2.0.0`)

**Permissions:** `contents: write` (to create GitHub Releases)

#### Job: `build-tauri` (matrix)

Runs on three platforms in parallel:

| Platform | Runner | Extra Args |
|----------|--------|-----------|
| Windows | `windows-latest` | -- |
| Linux | `ubuntu-22.04` | -- |
| macOS | `macos-latest` | `--target universal-apple-darwin` |

Steps per platform:
1. Checkout code
2. Set up pnpm 10 and Node.js 22
3. Install Rust stable (macOS adds aarch64 + x86_64 targets)
4. Install system dependencies (Linux only: libwebkit2gtk, libappindicator3, librsvg2, patchelf)
5. `pnpm install --frozen-lockfile`
6. Build with `tauri-apps/tauri-action`:
   - Creates a draft GitHub Release
   - Uploads platform-specific installers
   - Release name: `Down Under Bot Desktop v2.0.0`

**Output artifacts:**
- Windows: `.msi`, `.exe`
- macOS: `.dmg` (universal binary for Intel + Apple Silicon)
- Linux: `.deb`, `.AppImage`

### Creating a Release

```bash
# Tag the release
git tag v2.0.0
git push origin v2.0.0

# The workflow builds all platforms and creates a draft release
# Go to GitHub Releases to review and publish
```

---

## Deployment Guide

### Local Development

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp packages/bot/.env.example packages/bot/.env
# Edit .env with your Discord token and guild ID

# 3. Set up database
pnpm db:push

# 4. Start bot (with hot reload)
pnpm dev

# 5. Start desktop app (optional, separate terminal)
pnpm dev:desktop
```

### Docker (Self-Hosted)

```bash
# 1. Clone the repo on your server
git clone https://github.com/your-username/DownUnderDiscordBot.git
cd DownUnderDiscordBot

# 2. Create .env file with secrets
cat > .env << EOF
DISCORD_TOKEN=your-token
DISCORD_CLIENT_ID=your-client-id
SPOTIFY_CLIENT_ID=optional
SPOTIFY_CLIENT_SECRET=optional
EOF

# 3. Build and run
cd infrastructure/docker
docker compose --env-file ../../.env up -d

# 4. Check health
curl http://localhost:3001/api/health
```

### Azure (Cloud)

1. **Deploy infrastructure:**
   ```bash
   az deployment group create \
     --resource-group rg-downunder-bot \
     --template-file infrastructure/azure/bicep/main.bicep \
     --parameters discordToken='...' discordClientId='...'
   ```

2. **Configure GitHub secrets** (for CI/CD):
   - `ACR_LOGIN_SERVER`, `ACR_USERNAME`, `ACR_PASSWORD`
   - `AZURE_CREDENTIALS` (service principal JSON)
   - `AZURE_RESOURCE_GROUP`

3. **Push to main** -- the deploy workflow builds and deploys automatically.

4. **Verify:** Check the Container App logs in Azure Portal or:
   ```bash
   az containerapp logs show --name downunder-prod-bot --resource-group rg-downunder-bot
   ```

---

## Secrets and Configuration

### GitHub Repository Secrets

Set these in your GitHub repository under Settings > Secrets and variables > Actions:

| Secret | Used By | Description |
|--------|---------|-------------|
| `ACR_LOGIN_SERVER` | deploy-bot | Azure Container Registry hostname |
| `ACR_USERNAME` | deploy-bot | ACR admin username |
| `ACR_PASSWORD` | deploy-bot | ACR admin password |
| `AZURE_CREDENTIALS` | deploy-bot | Service principal JSON (`az ad sp create-for-rbac --sdk-auth`) |
| `AZURE_RESOURCE_GROUP` | deploy-bot | Azure resource group name |
| `GITHUB_TOKEN` | release-desktop | Auto-provided by GitHub Actions |

### Creating Azure Service Principal

```bash
az ad sp create-for-rbac \
  --name "github-downunder-bot" \
  --role contributor \
  --scopes /subscriptions/<subscription-id>/resourceGroups/<resource-group> \
  --sdk-auth
```

Copy the JSON output and save it as the `AZURE_CREDENTIALS` secret.

### Environment Isolation

Use the `environment` parameter in the Bicep template to create separate environments:

```bash
# Development
az deployment group create \
  --resource-group rg-downunder-dev \
  --template-file main.bicep \
  --parameters environment=dev discordToken='dev-token' discordClientId='dev-id'

# Production
az deployment group create \
  --resource-group rg-downunder-prod \
  --template-file main.bicep \
  --parameters environment=prod discordToken='prod-token' discordClientId='prod-id'
```

Each environment gets its own ACR, Container App, Key Vault, and Log Analytics workspace with a prefixed naming convention (`downunder-dev-*`, `downunder-prod-*`).
