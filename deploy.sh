#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment process...${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if Docker Desktop is running
if ! docker info &> /dev/null; then
    echo -e "${RED}Docker Desktop is not running. Please start Docker Desktop and try again.${NC}"
    exit 1
fi

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}Terraform is not installed. Please install it first.${NC}"
    exit 1
fi

# Navigate to the Terraform directory
cd terraform/environments/dev

# Clean up any existing plan file
rm -f tfplan

# Initialize Terraform
echo -e "${YELLOW}Initializing Terraform...${NC}"
terraform init

# Plan the infrastructure changes
echo -e "${YELLOW}Planning infrastructure changes...${NC}"
terraform plan -out=tfplan

# Apply the infrastructure changes
echo -e "${YELLOW}Applying infrastructure changes...${NC}"
terraform apply tfplan

# Check if the apply was successful
if [ $? -ne 0 ]; then
    echo -e "${RED}Infrastructure deployment failed. Please check the errors above.${NC}"
    exit 1
fi

# Get the ECR repository URL and domain name
ECR_REPO_URL=$(terraform output -raw ecr_repository_url)
DOMAIN_NAME=$(terraform output -raw domain_name)

# Navigate back to the project root
cd ../../..

# Check if ECR repository exists
if ! aws ecr describe-repositories --repository-names feature-request-system &> /dev/null; then
    echo -e "${RED}ECR repository not found. Please ensure the infrastructure deployment was successful.${NC}"
    exit 1
fi

# Authenticate with ECR
echo -e "${YELLOW}Authenticating with ECR...${NC}"
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin $ECR_REPO_URL

# Build the Docker image
echo -e "${YELLOW}Building Docker image...${NC}"
docker build -t feature-request-system .

# Tag the image
echo -e "${YELLOW}Tagging Docker image...${NC}"
docker tag feature-request-system:latest $ECR_REPO_URL:latest

# Push the image to ECR
echo -e "${YELLOW}Pushing Docker image to ECR...${NC}"
docker push $ECR_REPO_URL:latest

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${YELLOW}Please update your domain's name servers with the following values:${NC}"
terraform -chdir=terraform/environments/dev output name_servers

echo -e "${YELLOW}Your application will be available at: https://$DOMAIN_NAME${NC}"
echo -e "${YELLOW}Note: DNS propagation may take up to 48 hours.${NC}" 