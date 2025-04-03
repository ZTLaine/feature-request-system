#!/usr/bin/env pwsh
# Deploy-Prisma.ps1
# Runs Prisma generate and deploys migrations to the configured AWS RDS database.

# Script location check
if (-not (Test-Path "package.json")) {
    Write-Error "Error: This script must be run from the project root directory (where package.json is located)."
    exit 1
}

# --- Configuration ---
# Try to load from .env.prod file first
if (Test-Path ".env.prod") {
    Get-Content .env.prod | ForEach-Object {
        if (-not $_.StartsWith('#') -and $_.Contains('=')) {
            $key, $value = $_.Split('=', 2)
            [Environment]::SetEnvironmentVariable($key, $value)
        }
    }
    Write-Host "Loaded DATABASE_URL from .env.prod file."
}
else {
    Write-Host "Warning: .env.prod file not found."
    
    # Prompt for values if .env.prod not available
    $RDS_ENDPOINT = Read-Host "Enter RDS Endpoint"
    $RDS_DB_NAME = Read-Host "Enter RDS Database Name (default: feature_request_system)"
    if ([string]::IsNullOrWhiteSpace($RDS_DB_NAME)) { $RDS_DB_NAME = "feature_request_system" }
    
    $RDS_USERNAME = Read-Host "Enter RDS Username (default: root)"
    if ([string]::IsNullOrWhiteSpace($RDS_USERNAME)) { $RDS_USERNAME = "root" }
    
    $RDS_PASSWORD = Read-Host "Enter RDS Password" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($RDS_PASSWORD)
    $RDS_PASSWORD_PLAIN = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)

    if ([string]::IsNullOrWhiteSpace($RDS_ENDPOINT) -or [string]::IsNullOrWhiteSpace($RDS_PASSWORD_PLAIN)) {
        Write-Error "Error: Missing required database connection details."
        exit 1
    }

    $DATABASE_URL = "mysql://${RDS_USERNAME}:${RDS_PASSWORD_PLAIN}@${RDS_ENDPOINT}/${RDS_DB_NAME}"
    [Environment]::SetEnvironmentVariable("DATABASE_URL", $DATABASE_URL)
}

# --- Validation ---
$DATABASE_URL = [Environment]::GetEnvironmentVariable("DATABASE_URL")
if ([string]::IsNullOrWhiteSpace($DATABASE_URL)) {
    Write-Error "Error: DATABASE_URL is not set. Configure it in .env.prod or ensure prompts are filled."
    exit 1
}

# Show endpoint without credentials
$MASKED_URL = $DATABASE_URL -replace "(mysql:\/\/)[^:]+:.*@", '$1<USERNAME>:<PASSWORD>@'
Write-Host "Using database endpoint: $MASKED_URL"

# --- Prisma Commands ---
Write-Host "Ensuring dependencies are installed..."
npm install

Write-Host "Generating Prisma Client..."
$generateResult = npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Error "Error: Prisma generate failed."
    exit 1
}

Write-Host "Deploying Prisma migrations..."
$migrateResult = npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Write-Error "Error: Prisma migrate deploy failed."
    exit 1
}

Write-Host "Prisma generate and migrate deploy completed successfully."
exit 0 