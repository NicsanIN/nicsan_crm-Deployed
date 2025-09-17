# Nicsan CRM Backend

A robust backend API for the Nicsan CRM system with **dual storage architecture** - primary storage on AWS S3 and secondary storage on PostgreSQL.

## 🏗️ Architecture

### Dual Storage Strategy
- **Primary Storage**: AWS S3 (for files, PDFs, and raw data)
- **Secondary Storage**: PostgreSQL (for structured data and queries)
- **Sync**: All data is saved to both storages simultaneously

### Key Features
- ✅ JWT Authentication with role-based access
- ✅ PDF upload with AWS Textract processing
- ✅ Policy management with dual storage
- ✅ Dashboard metrics and KPI calculations
- ✅ Sales explorer and leaderboard
- ✅ File upload with S3 integration

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create `.env` file:
```env
# Server
PORT=3001
NODE_ENV=development

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nicsan_crm
DB_USER=postgres
DB_PASSWORD=your_password

# AWS (S3 + Textract)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=nicsan-crm-uploads

# Environment Configuration
ENVIRONMENT=staging

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h
```

### 3. Database Setup
```bash
# Initialize database tables
npm run init-db

# Create default users
npm run init-users
```

### 4. Database Migrations
```bash
# For teammates (local development)
npm run migrate:latest          # Run all pending migrations
npm run migrate:rollback        # Rollback last migration
npm run migrate:status          # Check migration status
npm run migrate:make <name>     # Create new migration

# For staging environment (RDS)
npm run migrate:staging         # Run migrations on staging RDS
npm run migrate:staging:rollback # Rollback staging migration
npm run migrate:staging:status  # Check staging migration status

# For production environment (RDS)
npm run migrate:production      # Run migrations on production RDS
npm run migrate:production:rollback # Rollback production migration
npm run migrate:production:status  # Check production migration status
```

### 5. Start Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Policies
- `POST /api/policies` - Create policy (dual storage)
- `GET /api/policies` - Get all policies
- `GET /api/policies/:id` - Get policy by ID
- `PUT /api/policies/:id` - Update policy
- `DELETE /api/policies/:id` - Delete policy

### PDF Upload
- `POST /api/upload/pdf` - Upload PDF with manual extras
- `POST /api/upload/:id/process` - Process PDF with Textract
- `GET /api/upload/:id/status` - Get upload status
- `GET /api/upload` - Get all uploads

### Dashboard
- `GET /api/dashboard/metrics` - Get KPI metrics
- `GET /api/dashboard/explorer` - Sales explorer data
- `GET /api/dashboard/leaderboard` - Rep leaderboard

## 🔐 Default Users

After running `npm run init-users`, these users are created:

- **Ops User**: `ops@nicsan.in` / `ops123`
- **Founder User**: `admin@nicsan.in` / `admin123`

## 🗄️ Database Schema

### Tables
- `users` - User accounts and authentication
- `policies` - Policy data with all fields
- `pdf_uploads` - PDF upload metadata and processing status

## 🔧 Development

### Scripts
- `npm run dev` - Start with nodemon (auto-restart)
- `npm run init-db` - Initialize database tables
- `npm run init-users` - Create default users

### Health Check
- `GET /health` - Server health status

## 🌐 Frontend Integration

The backend is designed to work seamlessly with the React frontend:
- CORS enabled for `localhost:3000`
- JWT token authentication
- File upload support
- Real-time status updates

## 📝 Notes

- All data is saved to both S3 and PostgreSQL simultaneously
- PDFs are processed with AWS Textract for data extraction
- JWT tokens are used for authentication
- Role-based access control (ops/founder)
- File uploads are limited to PDFs only

## 🔒 Security

- Passwords are hashed with bcrypt
- JWT tokens for authentication
- Role-based access control
- Input validation and sanitization
- CORS configuration for frontend

## 🏞️ Environments: Staging vs Production

This backend runs in two AWS environments with nearly identical architecture. Differences are primarily in credentials, database names, S3 prefixes, and task definitions.

### Staging
- **Purpose**: Safe place to test features with realistic data without impacting business.
- **Compute**: ECS Fargate service (1+ tasks) behind an ALB.
- **Image Source**: ECR repository (`backend` image, tagged for staging).
- **Database**: Amazon RDS PostgreSQL (staging instance/db user).
- **Storage**: AWS S3 (same bucket as prod or a dedicated staging bucket), with a distinct `S3_PREFIX` (e.g., `staging/`).
- **Secrets/Config**: SSM Parameter Store for secrets (DB password, JWT secret, `S3_PREFIX`, etc.). IAM Task Role grants read access.
- **Auth to AWS**: IAM Role for Task (no static keys in env). Region is set via env `AWS_REGION`.
- **Migrations**: Run via `npm run migrate:staging*` (requires correct env/SSM access in the runtime context).

### Production
- **Purpose**: Customer-facing environment serving real data.
- **Compute**: ECS Fargate service (scaled as needed) behind ALB.
- **Image Source**: ECR repository (`backend` image, prod tag/sha).
- **Database**: Amazon RDS PostgreSQL (production instance/db user).
- **Storage**: AWS S3 bucket set by `AWS_S3_BUCKET` (primary for JSON, PDFs); PostgreSQL is secondary for structured queries.
- **Secrets/Config**: SSM Parameter Store (e.g., DB password, JWT secret, `S3_PREFIX` for prod like `production/`).
- **Auth to AWS**: IAM Role for Task (no static keys). Ensure role has S3 and SSM read permissions.
- **Migrations**: Run via `npm run migrate:production*` (preferably via a one-off task or deploy pipeline container with proper IAM).

## 🧩 Configuration Overview (must-know)

Environment variables used by the backend (set via ECS Task Definition):
- `NODE_ENV`: `staging` or `production` (affects logging/behavior)
- `AWS_REGION`: e.g., `ap-south-1`
- `AWS_S3_BUCKET`: S3 bucket name used by the app
- `S3_PREFIX` (SSM secret): logical prefix for all object keys, e.g., `staging/` or `production/`
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` (env)
- `DB_PASSWORD` (SSM secret)
- `JWT_SECRET` (SSM secret)

Important notes:
- We use `AWS_S3_BUCKET` (not `S3_BUCKET`) for the bucket name in ECS and code.
- Prefer IAM Task Role over `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`. If keys are ever used, keep them in SSM and rotate regularly; however, the recommended setup is role-only.
- `S3_PREFIX` is mandatory to separate environments within the same bucket.

## 📦 Build & Deploy Flow (ECR → ECS)

High-level steps used by both staging and production:
1. Build Docker image for backend and tag with version/commit SHA.
2. Push the image to ECR.
3. Update the ECS Task Definition to reference the new image and ensure env/SSM secrets are correct.
4. Deploy by updating the ECS Service to the new Task Definition revision.
5. Validate via health checks and CloudWatch logs.

Key AWS components involved:
- **ECR**: Stores versioned container images.
- **ECS Fargate**: Runs containers serverlessly.
- **ALB**: Routes traffic to the ECS service tasks.
- **SSM Parameter Store**: Securely stores secrets (retrieved at container start). ECS Task Execution Role needs `ssm:GetParameters`.
- **IAM Task Role**: Grants runtime access to S3 (put/get) and any other AWS APIs the app uses.

## 🪣 S3 Usage Model

- Primary write target for JSON data, PDFs, and aggregates.
- Keys are composed using `S3_PREFIX` to segregate environments, e.g., `production/data/policies/...`.
- The application writes to S3 and also persists metadata to PostgreSQL. If S3 temporarily fails, recent changes ensure the database save can still proceed and S3 is updated when available.

Minimum IAM permissions for Task Role (conceptual):
- `s3:PutObject`, `s3:GetObject`, `s3:ListBucket` on the bucket used by the app.
- `ssm:GetParameters` for the specific SSM parameters configured in the task definition (e.g., `/nicsan/production/S3_PREFIX`).

## 🗃️ Database Migrations in AWS

Run migrations against RDS per environment:
- Staging: `npm run migrate:staging`, `:rollback`, `:status`
- Production: `npm run migrate:production`, `:rollback`, `:status`

Best practice:
- Execute migrations from a container with the same network/IAM context as the app (e.g., ECS one-off task or CodeBuild), so it can resolve SSM and reach RDS.
- Avoid running directly from developer laptops unless VPN/allowlist and secrets management are in place.

## 🧾 Schema-Only Export (How to)

Goal: export table definitions (no data).

Options:
- Use `pg_dump --schema-only` from a machine with network access to RDS and credentials. This is the most reliable.
- Alternatively, run a one-off ECS task with `pg_dump` installed to export within the VPC and with credentials sourced from SSM.
- A Node script can introspect `information_schema`, but for 1:1 DDL fidelity, prefer `pg_dump`.

Common blocker:
- Local machines usually lack RDS network access and do not have SSM access, leading to auth failures. Prefer running the export inside AWS.

## 🔍 Observability & Troubleshooting

Where to look first:
- **CloudWatch Logs**: ECS task logs show startup, queries, S3 uploads, and errors.
- **ECS Events**: Service events show deployment/health issues.
- **ALB Target Health**: Confirms tasks are passing health checks.
- **RDS Performance Insights/Logs**: For slow queries or auth issues.

Common production issues and fixes:
- S3 writes failing but DB saves succeed:
  - Check Task Role permissions to S3.
  - Verify `AWS_REGION`, `AWS_S3_BUCKET`, and `S3_PREFIX` are present. Ensure `S3_PREFIX` resolves from SSM and the Task Execution Role can read it.
- Secrets not loading at start:
  - `AccessDeniedException` on SSM means the Execution Role lacks `ssm:GetParameters` for the referenced ARNs.
  - Ensure the parameter path and region exactly match the task definition.
- App hangs during metadata checks:
  - Use timeouts for introspection queries; avoid long `information_schema` checks in hot paths.
- Migrations fail from laptop:
  - Run from inside AWS (ECS one-off) or ensure your IP is allowed and you have the correct passwords.

## 🔐 IAM Roles (at a glance)

- **Task Execution Role**: Pulls images from ECR, reads SSM parameters at container start. Needs `ecr:GetAuthorizationToken`, `ecr:BatchCheckLayerAvailability`, `ecr:GetDownloadUrlForLayer`, `ssm:GetParameters`.
- **Task Role**: Used by the app at runtime. Needs `s3:PutObject`, `s3:GetObject`, `s3:ListBucket` (scoped to the target bucket/prefix). Add additional permissions as features expand.

## ✅ Deployment Checklist (per release)

- Image built and pushed to ECR.
- Task Definition updated to new image tag.
- `AWS_REGION` and `AWS_S3_BUCKET` present in environment.
- `S3_PREFIX`, DB password, and `JWT_SECRET` set via SSM and referenced in task definition.
- Task Execution Role has SSM and ECR permissions.
- Task Role has S3 permissions for the bucket.
- Service updated to new task definition; tasks healthy behind ALB.
- CloudWatch logs show successful startup and S3/DB operations.

