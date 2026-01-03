#!/bin/sh
set -e

echo "🚀 Starting Chess application..."
echo "Waiting for MySQL to be ready..."

# Wait for MySQL to be ready
until nc -z mysql 3306; do
  echo "⏳ MySQL is unavailable - sleeping"
  sleep 2
done

echo "✅ MySQL is up - executing Prisma migrations"

# Run Prisma migrations
npx prisma migrate deploy

echo "✅ Migrations completed successfully"

# Start the Next.js application
echo "🎯 Starting Next.js server..."
exec node server.js
