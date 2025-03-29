# Feature Request System - Infrastructure

This directory contains the Terraform configuration for deploying the Feature Request System to AWS.

## Prerequisites

- AWS CLI installed and configured
- Terraform installed
- AWS account with appropriate permissions

## Setup Instructions

1. Navigate to the development environment directory:
   ```bash
   cd environments/dev
   ```

2. Create a `terraform.tfvars` file with your configuration:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

3. Edit `terraform.tfvars` with your values:
   - `aws_region`: AWS region to deploy to
   - `domain_name`: Your domain name
   - `db_password`: Database password
   - `nextauth_secret`: NextAuth secret key
   - `google_client_id`: Google OAuth client ID
   - `google_client_secret`: Google OAuth client secret

4. Initialize Terraform:
   ```bash
   terraform init
   ```

5. Review the planned changes:
   ```bash
   terraform plan
   ```

6. Apply the changes:
   ```bash
   terraform apply
   ```

## Security Notes

- Never commit `terraform.tfvars` to version control
- Keep your AWS credentials secure
- Use AWS Secrets Manager or similar services for production environments
- Consider using AWS KMS for encrypting sensitive values

## Infrastructure Components

- VPC with public and private subnets
- RDS MySQL instance
- ECS cluster with EC2 instances
- Application Load Balancer
- Route53 DNS configuration
- ACM SSL certificate
- CloudWatch logging

## Cleanup

To destroy the infrastructure:
```bash
terraform destroy
```

## Important Notes

- The RDS instance is placed in a public subnet for demo purposes
- The infrastructure uses t3.micro instances to stay within free tier limits
- The ECS cluster uses EC2 instances instead of Fargate
- All resources are tagged with the project name for easy identification 