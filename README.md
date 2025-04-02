# feature-request-system
 Next.js/Node project using Typescript with MySQL via Prisma

## Docker Setup

This project can be deployed using Docker. Follow these steps to get started:

### Prerequisites

- Docker
- Docker Compose
- External MySQL database

### External Database Setup

This application is configured to use an external MySQL database for data persistence. This ensures your data remains intact even when Docker containers are removed or rebuilt.

1. Set up your MySQL database server (either on a separate server, cloud service, or locally).
2. Create a database for the application (e.g., `feature-request-system`).
3. Make sure your database is accessible from the Docker container.
4. Copy `.env.docker.example` to `.env.docker` and update with your actual credentials.

Example connection string format:
```
DATABASE_URL="mysql://username:password@host.docker.internal:3306/feature-request-system"
```

### Running with Docker

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd feature-request-system
   ```

2. Create or update your `.env.docker` file with your environment variables:
   ```bash
   cp .env.docker.example .env.docker
   # Then edit .env.docker with your actual values
   ```

3. Build and start the Docker container:
   ```bash
   docker-compose up -d
   ```

4. Run database migrations (first-time setup):
   ```bash
   docker-compose exec app npx prisma migrate deploy
   ```

5. The application should now be running at http://localhost:3000.

### Stopping the Containers

```bash
docker-compose down
```

### Environment Variables

Your `.env.docker` file should contain these variables:
- `DATABASE_URL` - Connection string to your external MySQL database (using host.docker.internal)
- `NEXTAUTH_SECRET` - Secret for NextAuth
- `NEXTAUTH_URL` - URL for NextAuth
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

### Git and Environment Files

For security reasons, all `.env*` files are ignored in git (via .gitignore). When cloning this repository:
1. Copy `.env.docker.example` to `.env.docker`
2. Update with your actual credentials
3. NEVER commit your actual `.env` files with real credentials

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment to AWS ECS.

### CI/CD Workflow

The CI/CD pipeline automatically:
1. Builds the Docker image
2. Pushes it to Amazon ECR (Elastic Container Registry)
3. Updates the ECS task definition
4. Deploys the application to Amazon ECS (Elastic Container Service)

### Configuration

The workflow is configured to trigger on:
- Pushes to the `main` branch
- Manual triggers through the GitHub Actions interface

### Setting Up CI/CD

1. Ensure you have the required GitHub secrets configured:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `NEXTAUTH_SECRET` - **Important**: This must be the exact same secret used during local development to prevent JWT decryption errors

2. These credentials should belong to an IAM user with appropriate permissions for ECR and ECS operations.

For more detailed information about the CI/CD setup, see [.github/workflows/README.md](.github/workflows/README.md).
