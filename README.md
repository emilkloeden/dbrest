# Auto-Generated Fastify API

This project automatically generates a REST API from your SQL Server database using Fastify, Prisma, and Zod.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure your database:**
   Update the `DATABASE_URL` in `.env` with your SQL Server connection string:
   ```
   DATABASE_URL="sqlserver://username:password@localhost:1433/database_name?schema=dbo&encrypt=true&trustServerCertificate=true"
   ```

3. **Generate everything:**
   ```bash
   npm run generate:all
   ```
   This will:
   - Pull your database schema (`prisma db pull`)
   - Generate Prisma client (`prisma generate`)
   - Generate Zod schemas (`npm run generate:zod`)
   - Generate API routes (`npm run generate:routes`)

4. **Start the server:**
   ```bash
   npm run dev
   ```

## Features

- **Automatic model generation** from existing SQL Server tables
- **Type-safe APIs** with TypeScript and Zod validation
- **Full CRUD operations** for all discovered models
- **Pagination** support with skip/take parameters
- **Swagger documentation** at `/docs`
- **Error handling** with proper HTTP status codes
- **Input validation** using Zod schemas

## API Endpoints

For each table in your database, the following endpoints are automatically generated:

- `GET /{model}s` - List all records (with pagination)
- `GET /{model}s/:id` - Get single record
- `POST /{model}s` - Create new record
- `PUT /{model}s/:id` - Update record
- `DELETE /{model}s/:id` - Delete record

## Example Usage

```bash
# Get all users (with pagination)
curl "http://localhost:3000/users?skip=0&take=10"

# Get single user
curl "http://localhost:3000/users/1"

# Create new user
curl -X POST "http://localhost:3000/users" \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'

# Update user
curl -X PUT "http://localhost:3000/users/1" \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Doe"}'

# Delete user
curl -X DELETE "http://localhost:3000/users/1"
```

## Regenerating Code

Whenever your database schema changes, run:

```bash
npm run generate:all
```

This will regenerate all models, schemas, and routes to match your current database structure.
