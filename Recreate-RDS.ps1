# PowerShell script to recreate RDS database with Terraform

# Stop on error
$ErrorActionPreference = "Stop"

Write-Host "Navigating to Terraform directory..." -ForegroundColor Yellow
Push-Location -Path "terraform\environments\dev"

try {
    # Initialize Terraform
    Write-Host "Initializing Terraform..." -ForegroundColor Yellow
    terraform init

    # Destroy just the RDS resources
    Write-Host "Destroying RDS resources..." -ForegroundColor Yellow
    terraform destroy -target=module.rds -auto-approve

    # Apply to recreate just the RDS resources
    Write-Host "Recreating RDS resources..." -ForegroundColor Yellow
    terraform apply -target=module.rds -auto-approve

    # Apply the full configuration to ensure all dependencies are connected
    Write-Host "Applying full configuration..." -ForegroundColor Yellow
    terraform apply -auto-approve

    Write-Host "RDS recreation completed successfully!" -ForegroundColor Green
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
    throw
}
finally {
    # Return to the original directory
    Pop-Location
}

Write-Host "Process completed!" -ForegroundColor Green 