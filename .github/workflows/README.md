# GitHub Actions CI/CD Setup Guide

This document explains how to set up the required GitHub Secrets for the CI/CD workflow in this repository.

## Required GitHub Secrets

The following secrets need to be configured in your GitHub repository:

1. `AWS_ACCESS_KEY_ID`: Your AWS IAM user's access key ID
2. `AWS_SECRET_ACCESS_KEY`: Your AWS IAM user's secret access key

## Setting Up GitHub Secrets

1. In your GitHub repository, go to **Settings** > **Secrets and variables** > **Actions**
2. Click on **New repository secret**
3. Add each secret mentioned above with its corresponding value

## AWS IAM User Configuration

The IAM user associated with the access keys should have the following permissions:

- `AmazonECR-FullAccess`: For managing ECR repositories and images
- `AmazonECS-FullAccess`: For ECS deployments
- Custom policy with permissions for:
  - Describing task definitions
  - Updating services
  - Creating task definitions

### Minimum IAM Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:BatchCheckLayerAvailability",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:GetAuthorizationToken"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:RegisterTaskDefinition",
        "ecs:DescribeTaskDefinition",
        "ecs:DescribeServices",
        "ecs:UpdateService"
      ],
      "Resource": "*"
    }
  ]
}
```

## Workflow Configuration

The GitHub Actions workflow is triggered on:
- Pushes to the `main` branch
- Manual trigger (workflow_dispatch)

The workflow automatically:
1. Builds the Docker image
2. Pushes it to Amazon ECR
3. Updates the ECS task definition
4. Deploys to Amazon ECS 