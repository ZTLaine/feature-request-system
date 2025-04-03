#!/bin/bash

# deploy-prisma.sh
# Runs Prisma generate and deploys migrations to the configured AWS RDS database.

# Script location check
if [ ! -f "package.json" ]; then
  echo "Error: This script must be run from the project root directory (where package.json is located)."
  exit 1
fi

# --- Configuration ---
# Try to load from .env.prod file first
if [ -f .env.prod ]; then
  export $(grep -v '^#' .env.prod | xargs)
  echo "Loaded DATABASE_URL from .env.prod file."
else
  echo "Warning: .env.prod file not found."
  
  # Prompt for values if .env.prod not available
  read -p "Enter RDS Endpoint: " RDS_ENDPOINT
  read -p "Enter RDS Database Name (default: feature_request_system): " RDS_DB_NAME
  RDS_DB_NAME=${RDS_DB_NAME:-feature_request_system}
  
  read -p "Enter RDS Username (default: root): " RDS_USERNAME
  RDS_USERNAME=${RDS_USERNAME:-root}
  
  read -sp "Enter RDS Password: " RDS_PASSWORD # -s hides input
  echo "" # Newline after hidden input

  if [ -z "$RDS_ENDPOINT" ] || [ -z "$RDS_PASSWORD" ]; then
    echo "Error: Missing required database connection details."
    exit 1
  fi

  export DATABASE_URL="mysql://${RDS_USERNAME}:${RDS_PASSWORD}@${RDS_ENDPOINT}/${RDS_DB_NAME}"
fi

# --- Validation ---
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL is not set. Configure it in .env.prod or ensure prompts are filled."
  exit 1
fi

echo "Using database endpoint: $(echo $DATABASE_URL | sed -E 's/(mysql:\/\/)[^:]+:.*@/\1<USERNAME>:<PASSWORD>@/') " # Hide credentials in output

# --- Prisma Commands ---
echo "Ensuring dependencies are installed..."
npm install

echo "Generating Prisma Client..."
npx prisma generate
if [ $? -ne 0 ]; then
  echo "Error: Prisma generate failed."
  exit 1
fi

echo "Deploying Prisma migrations..."
npx prisma migrate deploy
if [ $? -ne 0 ]; then
  echo "Error: Prisma migrate deploy failed."
  exit 1
fi

echo "Prisma generate and migrate deploy completed successfully."

exit 0 