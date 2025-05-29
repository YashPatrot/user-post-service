<p align="center">
  <img src="https://sdmntprsouthcentralus.oaiusercontent.com/files/00000000-1c2c-61f7-9d72-efc9fa7ede37/raw?se=2025-05-29T16%3A23%3A16Z&sp=r&sv=2024-08-04&sr=b&scid=bb8bc206-e6ea-520c-b85b-e10f885f4bbf&skoid=24a7dec3-38fc-4904-b888-8abe0855c442&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-05-29T11%3A03%3A09Z&ske=2025-05-30T11%3A03%3A09Z&sks=b&skv=2024-08-04&sig=ZlCqFhpUvrxZR4hofL9eSYhQZTHjUMVoiY5rbh1YvFU%3D" width="120" alt="NestJS Logo" />
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

### 1. Install Dependencies

```bash
npm install
```

### 2. Run with Docker Compose

```bash
docker-compose up --build
```

### 3. Run Locally

```bash
# development
npm run start

# watch mode
npm run start:dev

# production
npm run start:prod
```

---

### 4. Generate Documentation

```bash
npm run docs
```

### 5. Prisma 

```bash
# Initialize Prisma
$ npx prisma init

#Generate Prisma client after making changes to the schema
$ npx prisma generate

#Run database migrations
$ npx prisma migrate dev --name init

```

## 🔧 API Overview

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

---

## 📚 Documentation & Resources

* [NestJS Docs](https://docs.nestjs.com)
* [Prisma Docs](https://www.prisma.io/docs)
* [TypeScript Docs](https://www.typescriptlang.org/docs)
* [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

## ✍️ License

This project is licensed under the [MIT License](LICENSE).
