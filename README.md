<p align="center">
  <img src="https://sdmntprsouthcentralus.oaiusercontent.com/files/00000000-1c2c-61f7-9d72-efc9fa7ede37/raw?se=2025-05-29T16%3A23%3A16Z&sp=r&sv=2024-08-04&sr=b&scid=bb8bc206-e6ea-520c-b85b-e10f885f4bbf&skoid=24a7dec3-38fc-4904-b888-8abe0855c442&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-05-29T11%3A03%3A09Z&ske=2025-05-30T11%3A03%3A09Z&sks=b&skv=2024-08-04&sig=ZlCqFhpUvrxZR4hofL9eSYhQZTHjUMVoiY5rbh1YvFU%3D" width="120" alt="Application Logo" />
</p>

<p align="center"><strong>Community API Backend</strong></p>
<p align="center">A backend API built with NestJS, TypeScript, and PostgreSQL for user authentication, post & comment management, login tracking, and weekly login rankings.</p>

---

## ✨ Features

* User registration and login with JWT authentication
* Password encryption with bcrypt
* Profile update (username and password)
* Post creation, listing with pagination, and detail view
* Comment creation, cursor-based pagination, and deletion
* Login record tracking with timestamps and IP
* Weekly login ranking system
* Dockerized environment setup using Docker Compose

---

## 📁 Project Setup

### Prerequisites

- [Docker](https://www.docker.com/get-started) and Docker Compose
- [Node.js](https://nodejs.org/) (LTS version recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd user-post-service
```

### 2. Environment Setup

The project uses Docker Compose for local development. The default configuration includes:

- PostgreSQL database
- NestJS application with hot-reloading

### 3. Run with Docker Compose

```bash
# Start the application with Docker Compose
docker compose up

# Start with automatic rebuilding on changes
docker compose watch
```

This will:
- Build and start the PostgreSQL database
- Build and start the NestJS application
- Set up volume mounts for hot-reloading
- Configure automatic rebuilds when package.json changes

### 4. Run Without Docker (Local Development)

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Start the application in development mode
npm run start:dev
```

Note: You'll need a PostgreSQL instance running locally or update the DATABASE_URL in .env.

---

## 🔧 Database Management with Prisma

The project uses Prisma ORM for database management.

```bash
# Initialize Prisma (already done in this project)
npx prisma init

# Generate Prisma client after schema changes
npx prisma generate

# Run database migrations
npx prisma migrate dev --name <migration-name>

# View database with Prisma Studio
npx prisma studio
```

## ⚡️ First-Time Setup: Prisma Migration (Important!)

**If you are running this project for the first time, you must create and apply the initial Prisma migration before using Docker or deploying.**

### Why?
Prisma requires migration files to exist before it can set up your database schema. The initial migration must be created manually and committed to the repository. This ensures that all environments (local, Docker, CI/CD) can apply the same schema changes consistently.

### Steps:

1. **Create the initial migration (only once, before first Docker build):**
   ```bash
   npx prisma migrate dev --name init
   ```
   - This will create the `prisma/migrations` folder and apply the schema to your local database.
   - Commit the generated migration files to your repository.

2. **Subsequent runs (including Docker/production):**
   - The following command (already in Docker Compose) will apply all committed migrations:
     ```sh
     npx prisma migrate deploy
     ```
   - This is safe to run every time the container starts. If the database is up to date, it does nothing.

## 📚 API Documentation

API documentation is available via Swagger UI at `/api` when the application is running.

### Authentication

* `POST /auth/signup` - User registration
* `POST /auth/login` - User login and JWT token generation

### User

* `PATCH /users/me` - Update user password or username

### Posts

* `POST /posts` - Create a post
* `GET /posts` - Get paginated posts
* `GET /posts/:id` - Get post detail

### Comments

* `POST /posts/:postId/comments` - Create a comment
* `GET /posts/:postId/comments` - Get comments (cursor-based)
* `DELETE /comments/:id` - Delete a comment

### Login Records

* `GET /users/login-records` - Get login history (up to 30)
* `GET /users/login-rankings` - Weekly login ranking

All endpoints (except signup & login) require Bearer token authentication.

## 🛠️ Project Structure

```
user-post-service/
├── prisma/                  # Prisma schema and migrations
├── src/                     # Source code
│   ├── auth/                # Authentication module
│   ├── users/               # User management module
│   ├── posts/               # Post management module
│   ├── comments/            # Comment management module
│   ├── app.module.ts        # Main application module
│   └── main.ts              # Application entry point
├── Dockerfile               # Docker configuration
├── docker-compose.yml       # Docker Compose configuration
├── .env                     # Environment variables
└── README.md                # Project documentation
```

## 📚 Documentation Generation

```bash
# Generate project documentation
npm run docs
```

This will generate documentation using Compodoc and serve it on a local server.

## 📖 Additional Resources

* [NestJS Documentation](https://docs.nestjs.com)
* [Prisma Documentation](https://www.prisma.io/docs)
* [TypeScript Documentation](https://www.typescriptlang.org/docs)
* [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## 🐳 Docker & Hot-Reloading: Important Notes

- **For reliable hot-reloading and instant code reflection in your running container, do NOT keep your project in a OneDrive, Google Drive, or any cloud-synced folder.**
- Move your project to a local folder, such as `C:\dev\user-post-service`.
- With the following Docker Compose setup:
  ```yaml
  volumes:
    - .:/usr/src/app
    - /usr/src/app/node_modules
  ```
  and your app running with `npm run start:dev`, code changes will be instantly reflected in the running container, and the app will reload automatically.
- If you keep your project in a cloud-synced folder, Docker Desktop on Windows may not detect file changes, and hot-reloading will not work reliably.
- After moving your project, use:
  ```powershell
  docker compose down
  docker compose up --build
  ```
  to restart your containers from the new location.

---

## ✍️ License

This project is licensed under the [MIT License](LICENSE).
