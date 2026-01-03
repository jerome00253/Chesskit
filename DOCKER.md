# 🐳 Docker Setup for Chesskit

This guide explains how to run the Chesskit application using Docker with MySQL and phpMyAdmin.

## 📋 Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed
- [Git](https://git-scm.com/) (to clone the repository)

## 🚀 Quick Start

### 1. Configure Environment

Copy the example environment file and configure it:

```bash
cp .env.docker.example .env.docker
```

Edit `.env.docker` and update the following values:

- **NEXTAUTH_SECRET**: Generate one with `openssl rand -base64 32`
- **API Keys** (optional): Add your Chess.com, Lichess, OpenAI, and Google AI API keys

### 2. Build and Start

Build and start all services (MySQL, phpMyAdmin, and the app):

```bash
docker-compose up --build
```

Wait for the containers to start. You should see:
- ✅ MySQL is ready
- ✅ Prisma migrations completed
- ✅ Next.js server started

### 3. Access the Application

- **Application**: http://localhost:31312
- **phpMyAdmin**: http://localhost:1312
  - Username: `root`
  - Password: `chessmysql`

## 📦 Services

| Service | Port | Description |
|---------|------|-------------|
| **app** | 31312 → 3000 | Next.js application |
| **mysql** | 3307 → 3306 | MySQL 8.0 database |
| **phpmyadmin** | 1312 → 80 | Database management interface |

## 💾 Importing an Existing Database

1. Open phpMyAdmin at http://localhost:1312
2. Login with username `root` and password `chessmysql`
3. Select the `chess_db` database
4. Click the **Import** tab
5. Choose your SQL dump file
6. Click **Go**

## 🛠️ Useful Commands

### View Logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs app
docker-compose logs mysql
docker-compose logs phpmyadmin

# Follow logs in real-time
docker-compose logs -f app
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart app
```

### Stop Services

```bash
# Stop containers (data is preserved)
docker-compose down

# Stop and remove volumes (⚠️ deletes database data)
docker-compose down -v
```

### Access Container Shell

```bash
# Access app container
docker-compose exec app sh

# Access MySQL CLI
docker-compose exec mysql mysql -u root -pchessmysql chess_db
```

### Rebuild After Code Changes

```bash
# Rebuild and restart
docker-compose up --build

# Rebuild specific service
docker-compose build app
docker-compose up app
```

## 🔧 Troubleshooting

### Port Already in Use

If port 31312, 3307, or 1312 is already in use, edit `docker-compose.yml` and change the port mapping:

```yaml
ports:
  - "32000:3000"  # Change 32000 to any available port
```

### Database Connection Issues

Check if MySQL is ready:

```bash
docker-compose logs mysql
```

Wait for the message: `MySQL init process done. Ready for start up.`

### Prisma Migration Errors

If migrations fail, you can run them manually:

```bash
docker-compose exec app npx prisma migrate deploy
```

### Clear Everything and Start Fresh

```bash
# Stop containers and remove volumes
docker-compose down -v

# Remove Docker images
docker-compose rm -f

# Rebuild from scratch
docker-compose up --build
```

## 📚 Database Schema

The application uses Prisma ORM with the following main tables:

- **users** - User accounts and profiles
- **games** - Chess games with PGN and analysis
- **critical_moments** - Key positions and blunders
- **sessions** - NextAuth sessions
- **engines** - Chess engine configurations

Schema is located in `prisma/schema.prisma`.

## 🔒 Security Notes

> [!WARNING]
> The default passwords in `docker-compose.yml` are for development only. Change them for production:
> - MySQL root password: `MYSQL_ROOT_PASSWORD`
> - MySQL user password: `MYSQL_PASSWORD`

> [!IMPORTANT]
> Never commit `.env.docker` to version control. It contains sensitive API keys and secrets.

## 📝 Environment Variables

See `.env.docker.example` for a complete list of configuration options.

Required variables:
- `DATABASE_URL` - MySQL connection string
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - Secret for NextAuth

Optional variables:
- `CHESSCOM_API_KEY` - Chess.com API integration
- `LICHESS_API_TOKEN` - Lichess API integration
- `OPENAI_API_KEY` - OpenAI for AI analysis
- `GOOGLE_GENERATIVE_AI_API_KEY` - Google AI for analysis

## 🎯 Production Deployment

For production use:

1. Change all default passwords
2. Use environment-specific `.env` files
3. Configure SSL/TLS certificates
4. Set up proper backup strategy for MySQL data
5. Use Docker secrets or a secrets manager for sensitive data
6. Configure resource limits in `docker-compose.yml`

## 📞 Support

For issues or questions:
- Check the [troubleshooting section](#-troubleshooting)
- Review Docker logs: `docker-compose logs`
- Check application logs in the container

---

**Happy Chess Analysis! ♟️**
