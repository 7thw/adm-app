#!/bin/bash

# Script to push relevant environment variables from .env.local to Convex
# Only pushes backend-relevant variables, not frontend or dev-specific ones

ENV_FILE="/Users/macdadyo/_Clients/realigna/DEV/realigna-apps/adm-app/.env.local"

echo "🚀 Pushing environment variables to Convex..."
echo "📁 Reading from: $ENV_FILE"
echo ""

# Check if .env.local exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: .env.local not found at $ENV_FILE"
    exit 1
fi

# Function to set Convex environment variable
set_convex_env() {
    local key=$1
    local value=$2
    echo "Setting $key..."
    npx convex env set "$key" "$value"
}

# Read .env.local and process relevant variables
while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip empty lines and comments
    [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
    
    # Remove any leading/trailing whitespace
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)
    
    # Only process specific backend-relevant variables
    case "$key" in
        R2_BUCKET_NAME|R2_TOKEN|R2_ACCESS_KEY_ID|R2_SECRET_ACCESS_KEY|R2_ENDPOINT)
            set_convex_env "$key" "$value"
            ;;
        CLERK_SECRET_KEY)
            set_convex_env "$key" "$value"
            ;;
        # Add more backend variables here as needed
        # STRIPE_SECRET_KEY)
        #     set_convex_env "$key" "$value"
        #     ;;
        *)
            # Skip frontend and dev variables
            echo "⏭️  Skipping $key (frontend/dev variable)"
            ;;
    esac
done < "$ENV_FILE"

echo ""
echo "✅ Environment variables pushed to Convex!"
echo "🔍 Verify with: npx convex env list"
