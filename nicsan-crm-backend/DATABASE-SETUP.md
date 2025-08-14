# Database Setup Guide for Nicsan CRM

## Prerequisites
- PostgreSQL 12+ installed on your system
- Node.js 18+ installed
- Basic knowledge of command line

## Step 1: Install PostgreSQL

### Windows
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run the installer
3. Set password for postgres user (remember this!)
4. Keep default port 5432
5. Complete installation

### macOS
```bash
# Using Homebrew
brew install postgresql
brew services start postgresql

# Or download from: https://www.postgresql.org/download/macosx/
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Step 2: Create Database and User

### Connect to PostgreSQL
```bash
# Windows: Use pgAdmin or command line
# macOS/Linux:
sudo -u postgres psql
```

### Create Database and User
```sql
-- Create database
CREATE DATABASE nicsan_crm;

-- Create user (optional, you can use postgres user)
CREATE USER nicsan_user WITH PASSWORD 'your_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE nicsan_crm TO nicsan_user;

-- Exit psql
\q
```

## Step 3: Update Environment File

Edit the `.env` file in the backend directory:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nicsan_crm
DB_USER=postgres          # or nicsan_user if you created one
DB_PASSWORD=your_password # the password you set during installation
DB_SSL=false
```

## Step 4: Run Database Setup Scripts

```bash
# Navigate to backend directory
cd nicsan-crm-backend

# Run the complete setup
node setup-project.js

# Set up database schema
node setup-schema.js

# Create test users
node create-test-user.js
```

## Step 5: Verify Setup

Check if everything is working:
```bash
# Start the backend server
npm run dev

# Check health endpoint
curl http://localhost:3001/health
```

## Troubleshooting

### Connection Issues
- Verify PostgreSQL is running
- Check port 5432 is not blocked
- Verify database name and credentials
- Try connecting with pgAdmin or psql

### Permission Issues
- Ensure user has proper privileges
- Check if database exists
- Verify user can connect

### Common Errors
- `ECONNREFUSED`: PostgreSQL not running
- `password authentication failed`: Wrong password
- `database "nicsan_crm" does not exist`: Database not created

## Test Credentials

After running the setup scripts, you can test with:
- **Founder Account**: admin@nicsan.in / admin123
- **Ops Account**: ops@nicsan.in / ops123

## Next Steps

1. Start the backend server: `npm run dev`
2. Start the frontend: `npm run dev` (from root directory)
3. Test the application with the provided credentials
4. Configure AWS services if needed for production

