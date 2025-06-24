#!/bin/bash

# Convex + Cloudflare R2 Setup Script for Realigna Admin App
# This script helps configure your environment for the R2 integration example

set -e

echo "🚀 Setting up Convex + Cloudflare R2 Integration"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "This script must be run from the adm-app root directory"
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed. Please install pnpm first:"
    echo "npm install -g pnpm"
    exit 1
fi

print_status "Found pnpm installation"

# Check if Convex CLI is available
if ! command -v convex &> /dev/null; then
    print_warning "Convex CLI not found. Installing..."
    pnpm install -g convex
fi

print_status "Convex CLI is available"

# Install dependencies
print_info "Installing dependencies..."
pnpm install
print_status "Dependencies installed"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    print_warning ".env.local not found. Creating template..."
    cat > .env.local << EOF
# Convex Configuration
NEXT_PUBLIC_CONVEX_URL=your-convex-url-here

# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key

# Cloudflare R2 Configuration (for reference - set these in Convex)
# R2_BUCKET=your-bucket-name
# R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
# R2_ACCESS_KEY_ID=your-access-key-id
# R2_SECRET_ACCESS_KEY=your-secret-access-key
# R2_TOKEN=your-r2-token
EOF
    print_status "Created .env.local template"
else
    print_status ".env.local already exists"
fi

# Check if convex directory exists and is configured
if [ ! -d "convex" ]; then
    print_error "Convex directory not found. Please initialize Convex first:"
    echo "pnpm convex init"
    exit 1
fi

print_status "Convex directory found"

# Function to prompt for R2 configuration
setup_r2_config() {
    print_info "Setting up Cloudflare R2 configuration..."
    echo ""
    echo "Please provide your Cloudflare R2 credentials:"
    echo "You can find these in your Cloudflare dashboard → R2 Object Storage → Manage R2 API tokens"
    echo ""

    read -p "R2 Bucket Name: " R2_BUCKET
    read -p "R2 Endpoint (e.g., https://your-account-id.r2.cloudflarestorage.com): " R2_ENDPOINT
    read -p "R2 Access Key ID: " R2_ACCESS_KEY_ID
    read -s -p "R2 Secret Access Key (hidden): " R2_SECRET_ACCESS_KEY
    echo ""
    read -s -p "R2 Token (hidden): " R2_TOKEN
    echo ""

    if [ -z "$R2_BUCKET" ] || [ -z "$R2_ENDPOINT" ] || [ -z "$R2_ACCESS_KEY_ID" ] || [ -z "$R2_SECRET_ACCESS_KEY" ] || [ -z "$R2_TOKEN" ]; then
        print_warning "Some R2 credentials are missing. You can set them later using:"
        echo "pnpm convex env set R2_BUCKET your-bucket-name"
        echo "pnpm convex env set R2_ENDPOINT your-endpoint"
        echo "pnpm convex env set R2_ACCESS_KEY_ID your-access-key"
        echo "pnpm convex env set R2_SECRET_ACCESS_KEY your-secret-key"
        echo "pnpm convex env set R2_TOKEN your-token"
        return
    fi

    # Set Convex environment variables
    print_info "Setting Convex environment variables..."
    pnpm convex env set R2_BUCKET "$R2_BUCKET"
    pnpm convex env set R2_ENDPOINT "$R2_ENDPOINT"
    pnpm convex env set R2_ACCESS_KEY_ID "$R2_ACCESS_KEY_ID"
    pnpm convex env set R2_SECRET_ACCESS_KEY "$R2_SECRET_ACCESS_KEY"
    pnpm convex env set R2_TOKEN "$R2_TOKEN"

    print_status "R2 environment variables configured"
}

# Ask if user wants to configure R2
echo ""
read -p "Do you want to configure Cloudflare R2 credentials now? (y/n): " configure_r2

if [ "$configure_r2" = "y" ] || [ "$configure_r2" = "Y" ]; then
    setup_r2_config
else
    print_info "Skipping R2 configuration. You can run this later with:"
    echo "pnpm convex env set R2_BUCKET your-bucket-name"
fi

# Deploy Convex functions
echo ""
read -p "Do you want to deploy Convex functions now? (y/n): " deploy_convex

if [ "$deploy_convex" = "y" ] || [ "$deploy_convex" = "Y" ]; then
    print_info "Deploying Convex functions..."
    pnpm convex deploy
    print_status "Convex functions deployed"
else
    print_info "Skipping Convex deployment. Run 'pnpm convex dev' when ready"
fi

# Final instructions
echo ""
print_status "Setup complete!"
echo ""
print_info "Next steps:"
echo "1. Start the development server: pnpm dev"
echo "2. Visit http://localhost:3100/dashboard/examples/r2-integration"
echo "3. Configure your R2 bucket CORS policy (see README.md)"
echo ""
print_info "CORS Configuration for your R2 bucket:"
cat << EOF
[
  {
    "AllowedOrigins": ["http://localhost:3100", "https://adm-realigna.7thw.co"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["Content-Type", "Authorization"],
    "MaxAgeSeconds": 3600
  }
]
EOF
echo ""
print_info "For more information, check the README.md file in the r2-integration directory"

exit 0