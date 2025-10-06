# Discord Bot Dashboard Deployment Script (PowerShell)
# This script handles the complete deployment process for production

param(
    [string]$Environment = "production",
    [switch]$SkipTests = $false,
    [switch]$SkipBackup = $false
)

$ErrorActionPreference = "Stop"

# Configuration
$NODE_ENV = $Environment
$BUILD_DIR = "dist"
$BACKUP_DIR = "backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    White = "White"
}

# Logging functions
function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor $Colors.Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $Colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $Colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $Colors.Red
}

# Check prerequisites
function Test-Prerequisites {
    Write-Info "Checking prerequisites..."
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Info "Node.js version: $nodeVersion"
    }
    catch {
        Write-Error "Node.js is not installed or not in PATH"
        exit 1
    }
    
    # Check pnpm
    try {
        $pnpmVersion = pnpm --version
        Write-Info "pnpm version: $pnpmVersion"
    }
    catch {
        Write-Error "pnpm is not installed or not in PATH"
        exit 1
    }
    
    Write-Success "Prerequisites check passed"
}

# Install dependencies
function Install-Dependencies {
    Write-Info "Installing dependencies..."
    
    # Install root dependencies
    pnpm install --frozen-lockfile
    
    # Install workspace dependencies
    pnpm install --filter client --frozen-lockfile
    pnpm install --filter server --frozen-lockfile
    pnpm install --filter shared --frozen-lockfile
    
    Write-Success "Dependencies installed"
}

# Run tests
function Invoke-Tests {
    if ($SkipTests) {
        Write-Warning "Skipping tests as requested"
        return
    }
    
    Write-Info "Running tests..."
    
    try {
        # Run shared library tests
        Write-Info "Testing shared library..."
        pnpm --filter shared test --run
        
        # Run server tests
        Write-Info "Testing server..."
        pnpm --filter server test --run
        
        # Run client tests
        Write-Info "Testing client..."
        pnpm --filter client test --run
        
        Write-Success "All tests passed"
    }
    catch {
        Write-Error "Tests failed: $_"
        exit 1
    }
}

# Build shared library
function Build-Shared {
    Write-Info "Building shared library..."
    pnpm --filter shared build
    Write-Success "Shared library built"
}

# Build server
function Build-Server {
    Write-Info "Building server..."
    pnpm --filter server build
    Write-Success "Server built"
}

# Build client with production optimizations
function Build-Client {
    Write-Info "Building client with production optimizations..."
    
    # Use production Vite config
    Push-Location client
    try {
        pnpm build --config vite.config.production.ts
        
        # Check for build analysis report
        if (Test-Path "dist/stats.html") {
            Write-Info "Build analysis report generated: client/dist/stats.html"
        }
    }
    finally {
        Pop-Location
    }
    
    Write-Success "Client built with optimizations"
}

# Optimize assets
function Optimize-Assets {
    Write-Info "Optimizing assets..."
    
    # Generate service worker for caching
    if (Test-Path "client/dist/index.html") {
        Write-Info "Generating service worker..."
        
        $serviceWorkerContent = @"
const CACHE_NAME = 'discord-bot-dashboard-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
"@
        
        $serviceWorkerContent | Out-File -FilePath "client/dist/sw.js" -Encoding UTF8
        Write-Info "Service worker generated"
    }
    
    Write-Success "Assets optimized"
}

# Create backup
function New-Backup {
    if ($SkipBackup) {
        Write-Warning "Skipping backup as requested"
        return
    }
    
    if (Test-Path $BUILD_DIR) {
        Write-Info "Creating backup of existing build..."
        Move-Item $BUILD_DIR $BACKUP_DIR
        Write-Success "Backup created: $BACKUP_DIR"
    }
}

# Deploy files
function Deploy-Files {
    Write-Info "Deploying files..."
    
    # Create deployment directory structure
    New-Item -ItemType Directory -Path $BUILD_DIR -Force | Out-Null
    
    # Copy server build
    if (Test-Path "server/dist") {
        Copy-Item -Path "server/dist" -Destination "$BUILD_DIR/server" -Recurse -Force
        Copy-Item -Path "server/package.json" -Destination "$BUILD_DIR/server/" -Force
        Write-Info "Server files deployed"
    }
    
    # Copy client build
    if (Test-Path "client/dist") {
        Copy-Item -Path "client/dist" -Destination "$BUILD_DIR/client" -Recurse -Force
        Write-Info "Client files deployed"
    }
    
    # Copy shared library
    if (Test-Path "shared/dist") {
        Copy-Item -Path "shared/dist" -Destination "$BUILD_DIR/shared" -Recurse -Force
        Copy-Item -Path "shared/package.json" -Destination "$BUILD_DIR/shared/" -Force
        Write-Info "Shared library deployed"
    }
    
    # Copy configuration files
    Copy-Item -Path "package.json" -Destination "$BUILD_DIR/" -Force
    Copy-Item -Path "pnpm-workspace.yaml" -Destination "$BUILD_DIR/" -Force
    
    # Copy environment files (excluding sensitive data)
    if (Test-Path ".env.production") {
        Copy-Item -Path ".env.production" -Destination "$BUILD_DIR/" -Force
    }
    
    Write-Success "Files deployed to $BUILD_DIR"
}

# Generate deployment info
function New-DeploymentInfo {
    Write-Info "Generating deployment information..."
    
    $gitCommit = try { git rev-parse HEAD } catch { "unknown" }
    $gitBranch = try { git rev-parse --abbrev-ref HEAD } catch { "unknown" }
    
    $clientSize = if (Test-Path "client/dist") { 
        [math]::Round((Get-ChildItem "client/dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB, 2).ToString() + " MB"
    } else { "unknown" }
    
    $serverSize = if (Test-Path "server/dist") { 
        [math]::Round((Get-ChildItem "server/dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB, 2).ToString() + " MB"
    } else { "unknown" }
    
    $totalSize = if (Test-Path $BUILD_DIR) { 
        [math]::Round((Get-ChildItem $BUILD_DIR -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB, 2).ToString() + " MB"
    } else { "unknown" }
    
    $deploymentInfo = @{
        deploymentTime = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        nodeVersion = node --version
        pnpmVersion = pnpm --version
        gitCommit = $gitCommit
        gitBranch = $gitBranch
        buildEnvironment = $NODE_ENV
        buildSize = @{
            client = $clientSize
            server = $serverSize
            total = $totalSize
        }
    } | ConvertTo-Json -Depth 3
    
    $deploymentInfo | Out-File -FilePath "$BUILD_DIR/deployment-info.json" -Encoding UTF8
    
    Write-Success "Deployment information generated"
}

# Health check
function Test-Deployment {
    Write-Info "Performing health check..."
    
    # Check if all required files exist
    $requiredFiles = @(
        "$BUILD_DIR/server/index.js",
        "$BUILD_DIR/client/index.html",
        "$BUILD_DIR/deployment-info.json"
    )
    
    foreach ($file in $requiredFiles) {
        if (-not (Test-Path $file)) {
            Write-Error "Required file missing: $file"
            exit 1
        }
    }
    
    Write-Success "Health check passed"
}

# Cleanup
function Invoke-Cleanup {
    Write-Info "Cleaning up temporary files..."
    
    # Remove node_modules from build directory
    Get-ChildItem -Path $BUILD_DIR -Name "node_modules" -Recurse -Directory | ForEach-Object {
        Remove-Item -Path $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    # Remove source maps if they exist
    Get-ChildItem -Path $BUILD_DIR -Filter "*.map" -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue
    
    # Remove test files
    Get-ChildItem -Path $BUILD_DIR -Filter "*.test.*" -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path $BUILD_DIR -Name "__tests__" -Recurse -Directory | ForEach-Object {
        Remove-Item -Path $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    Write-Success "Cleanup completed"
}

# Main deployment process
function Start-Deployment {
    Write-Info "🚀 Starting Discord Bot Dashboard Deployment..."
    Write-Info "Environment: $NODE_ENV"
    
    try {
        Test-Prerequisites
        New-Backup
        Install-Dependencies
        Invoke-Tests
        Build-Shared
        Build-Server
        Build-Client
        Optimize-Assets
        Deploy-Files
        New-DeploymentInfo
        Test-Deployment
        Invoke-Cleanup
        
        Write-Success "🎉 Deployment completed successfully!"
        Write-Info "Build location: $BUILD_DIR"
        
        if (Test-Path $BUILD_DIR) {
            $buildSize = [math]::Round((Get-ChildItem $BUILD_DIR -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
            Write-Info "Build size: $buildSize MB"
        }
        
        if (Test-Path "$BUILD_DIR/client/dist/stats.html") {
            Write-Info "📊 Bundle analysis: $BUILD_DIR/client/dist/stats.html"
        }
    }
    catch {
        Write-Error "Deployment failed: $_"
        exit 1
    }
}

# Handle script interruption
trap {
    Write-Error "Deployment interrupted"
    exit 1
}

# Run main function
Start-Deployment