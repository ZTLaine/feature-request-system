#!/bin/bash

# Exit on error
set -e

echo "Navigating to Terraform directory..."
cd terraform/environments/dev

# Initialize Terraform
echo "Initializing Terraform..."
terraform init

# Destroy just the RDS resources
echo "Destroying RDS resources..."
terraform destroy -target=module.rds -auto-approve

# Apply to recreate just the RDS resources
echo "Recreating RDS resources..."
terraform apply -target=module.rds -auto-approve

# Apply the full configuration to ensure all dependencies are connected
echo "Applying full configuration..."
terraform apply -auto-approve

echo "RDS recreation completed successfully!"

# Return to the original directory
cd ../../..

echo "Process completed!"
