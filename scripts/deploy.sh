#!/bin/bash

# Discord Bot Dashboard Deployment Script
# This script handles the complete deployment process for production

set -e  # Exit on any error

echo "🚀 Starting Discord Bot Dashboard Deployment..."

# Configuration
NODE_ENV=${NODE_ENV:-production}
BUILD_DIR="dist"
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_VERSION="18.0.0"
    
    if ! node -e "process.exit(require('semver').gte('$NODE_VERSION', '$REQUIRED_VERSION') ? 0 : 1)" 2>/dev/null; then
        log_error "Node.js version $NODE_VERSION is not supported. Required: $REQUIRED_VERSION+"
        exit 1
    fi
    
    # Check pnpm
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm is not installed"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    # Install root dependencies
    pnpm install --frozen-lockfile
    
    # Install workspace dependencies
    pnpm install --filter client --frozen-lockfile
    pnpm install --filter server --frozen-lockfile
    pnpm install --filter shared --frozen-lockfile
    
    log_success "Dependencies installed"
}

# Run tests
run_tests() {
    log_info "Running tests..."
    
    # Run shared library tests
    log_info "Testing shared library..."
    pnpm --filter shared test --run
    
    # Run server tests
    log_info "Testing server..."
    pnpm --filter server test --run
    
    # Run client tests
    log_info "Testing client..."
    pnpm --filter client test --run
    
    log_success "All tests passed"
}

# Build shared library
build_shared() {
    log_info "Building shared library..."
    pnpm --filter shared build
    log_success "Shared library built"
}

# Build server
build_server() {
    log_info "Building server..."
    pnpm --filter server build
    log_success "Server built"
}

# Build client with production optimizations
build_client() {
    log_info "Building client with production optimizations..."
    
    # Use production Vite config
    cd client
    pnpm build --config vite.config.production.ts
    cd ..
    
    # Generate build report
    if [ -f "client/dist/stats.html" ]; then
        log_info "Build analysis report generated: client/dist/stats.html"
    fi
    
    log_success "Client built with optimizations"
}

# Optimize assets
optimize_assets() {
    log_info "Optimizing assets..."
    
    # Compress images if imagemin is available
    if command -v imagemin &> /dev/null; then
        find client/dist -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | xargs imagemin --out-dir=client/dist/img/
        log_info "Images optimized"
    fi
    
    # Generate service worker for caching
    if [ -f "client/dist/index.html" ]; then
        log_info "Generating service worker..."
        # This would typically use workbox or similar
        # For now, we'll create a simple service worker
        cat > client/dist/sw.js << 'EOF'
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
EOF
        log_info "Service worker generated"
    fi
    
    log_success "Assets optimized"
}

# Create backup
create_backup() {
    if [ -d "$BUILD_DIR" ]; then
        log_info "Creating backup of existing build..."
        mv "$BUILD_DIR" "$BACKUP_DIR"
        log_success "Backup created: $BACKUP_DIR"
    fi
}

# Deploy files
deploy_files() {
    log_info "Deploying files..."
    
    # Create deployment directory structure
    mkdir -p "$BUILD_DIR"
    
    # Copy server build
    if [ -d "server/dist" ]; then
        cp -r server/dist "$BUILD_DIR/server"
        cp server/package.json "$BUILD_DIR/server/"
        log_info "Server files deployed"
    fi
    
    # Copy client build
    if [ -d "client/dist" ]; then
        cp -r client/dist "$BUILD_DIR/client"
        log_info "Client files deployed"
    fi
    
    # Copy shared library
    if [ -d "shared/dist" ]; then
        cp -r shared/dist "$BUILD_DIR/shared"
        cp shared/package.json "$BUILD_DIR/shared/"
        log_info "Shared library deployed"
    fi
    
    # Copy configuration files
    cp package.json "$BUILD_DIR/"
    cp pnpm-workspace.yaml "$BUILD_DIR/"
    
    # Copy environment files (excluding sensitive data)
    if [ -f ".env.production" ]; then
        cp .env.production "$BUILD_DIR/"
    fi
    
    log_success "Files deployed to $BUILD_DIR"
}

# Generate deployment info
generate_deployment_info() {
    log_info "Generating deployment information..."
    
    cat > "$BUILD_DIR/deployment-info.json" << EOF
{
  "deploymentTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "nodeVersion": "$(node --version)",
  "pnpmVersion": "$(pnpm --version)",
  "gitCommit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "gitBranch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')",
  "buildEnvironment": "$NODE_ENV",
  "buildSize": {
    "client": "$(du -sh client/dist 2>/dev/null | cut -f1 || echo 'unknown')",
    "server": "$(du -sh server/dist 2>/dev/null | cut -f1 || echo 'unknown')",
    "total": "$(du -sh $BUILD_DIR 2>/dev/null | cut -f1 || echo 'unknown')"
  }
}
EOF
    
    log_success "Deployment information generated"
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    # Check if all required files exist
    REQUIRED_FILES=(
        "$BUILD_DIR/server/index.js"
        "$BUILD_DIR/client/index.html"
        "$BUILD_DIR/deployment-info.json"
    )
    
    for file in "${REQUIRED_FILES[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "Required file missing: $file"
            exit 1
        fi
    done
    
    log_success "Health check passed"
}

# Cleanup
cleanup() {
    log_info "Cleaning up temporary files..."
    
    # Remove node_modules from build directory
    find "$BUILD_DIR" -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # Remove source maps if they exist
    find "$BUILD_DIR" -name "*.map" -delete 2>/dev/null || true
    
    # Remove test files
    find "$BUILD_DIR" -name "*.test.*" -delete 2>/dev/null || true
    find "$BUILD_DIR" -name "__tests__" -type d -exec rm -rf {} + 2>/dev/null || true
    
    log_success "Cleanup completed"
}

# Main deployment process
main() {
    log_info "Environment: $NODE_ENV"
    
    check_prerequisites
    create_backup
    install_dependencies
    run_tests
    build_shared
    build_server
    build_client
    optimize_assets
    deploy_files
    generate_deployment_info
    health_check
    cleanup
    
    log_success "🎉 Deployment completed successfully!"
    log_info "Build location: $BUILD_DIR"
    log_info "Build size: $(du -sh $BUILD_DIR | cut -f1)"
    
    if [ -f "$BUILD_DIR/client/dist/stats.html" ]; then
        log_info "📊 Bundle analysis: $BUILD_DIR/client/dist/stats.html"
    fi
}

# Handle script interruption
trap 'log_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"