@echo off
setlocal enabledelayedexpansion

echo Starting deployment process...

REM Check if AWS CLI is installed
where aws >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo AWS CLI is not installed. Please install it first.
    exit /b 1
)

REM Check if Docker is installed
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Docker is not installed. Please install it first.
    exit /b 1
)

REM Check if Docker Desktop is running
docker info >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Docker Desktop is not running. Please start Docker Desktop and try again.
    exit /b 1
)

REM Check if Terraform is installed
where terraform >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Terraform is not installed. Please install it first.
    exit /b 1
)

REM Navigate to the Terraform directory
cd terraform\environments\dev

REM Clean up any existing plan file
if exist tfplan del tfplan

REM Initialize Terraform
echo Initializing Terraform...
terraform init

REM Plan the infrastructure changes
echo Planning infrastructure changes...
terraform plan -out=tfplan

REM Apply the infrastructure changes
echo Applying infrastructure changes...
terraform apply tfplan

REM Check if the apply was successful
if %ERRORLEVEL% NEQ 0 (
    echo Infrastructure deployment failed. Please check the errors above.
    exit /b 1
)

REM Get the ECR repository URL and domain name
for /f "tokens=*" %%a in ('terraform output -raw ecr_repository_url') do set ECR_REPO_URL=%%a
for /f "tokens=*" %%a in ('terraform output -raw domain_name') do set DOMAIN_NAME=%%a

REM Navigate back to the project root
cd ..\..\..

REM Check if ECR repository exists
aws ecr describe-repositories --repository-names feature-request-system >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ECR repository not found. Please ensure the infrastructure deployment was successful.
    exit /b 1
)

REM Authenticate with ECR
echo Authenticating with ECR...
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin %ECR_REPO_URL%

REM Build the Docker image
echo Building Docker image...
docker build -t feature-request-system .

REM Tag the image
echo Tagging Docker image...
docker tag feature-request-system:latest %ECR_REPO_URL%:latest

REM Push the image to ECR
echo Pushing Docker image to ECR...
docker push %ECR_REPO_URL%:latest

echo Deployment completed successfully!
echo Please update your domain's name servers with the following values:
terraform -chdir=terraform\environments\dev output name_servers

echo Your application will be available at: https://%DOMAIN_NAME%
echo Note: DNS propagation may take up to 48 hours. 