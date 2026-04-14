# Forum Backend API

A RESTful API for an online forum built with **Node.js + Express + MySQL**.

## Features
- 🔐 JWT Authentication (register / login)
- 🧵 Threads with categories and tags
- 💬 Nested comments / replies
- 👍 Upvotes & downvotes on threads and comments
- 🛡️ Role-based access: `user`, `moderator`, `admin`
- 📌 Pin / Lock threads (moderator+)
- 🚫 Ban users (admin)

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your DB credentials and JWT secret

# 3. Create the database
mysql -u root -p < schema.sql

# 4. Start the server
npm run dev      # development (nodemon)
npm start        # production
```

---

## API Reference

Base URL: `http://localhost:3000/api`

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | ❌ | Register a new user |
| POST | `/auth/login` | ❌ | Login and get JWT token |
| GET | `/auth/me` | ✅ | Get current user info |

### Threads
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/threads` | ❌ | List threads (filter: `?category=&tag=&search=&page=&limit=`) |
| GET | `/threads/:slug` | ❌ | Get a single thread |
| POST | `/threads` | ✅ | Create a thread |
| PUT | `/threads/:id` | ✅ | Update a thread (author or mod+) |
| DELETE | `/threads/:id` | ✅ | Soft-delete a thread |

### Comments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/threads/:threadId/comments` | ❌ | Get nested comments for a thread |
| POST | `/threads/:threadId/comments` | ✅ | Post a comment (include `parent_id` for replies) |
| PUT | `/comments/:id` | ✅ | Edit a comment |
| DELETE | `/comments/:id` | ✅ | Soft-delete a comment |

### Votes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/vote` | ✅ | Vote on a thread or comment (`target_type`, `target_id`, `value: 1 or -1`) |

### Categories
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/categories` | ❌ | List all categories |
| POST | `/categories` | admin | Create a category |
| DELETE | `/categories/:id` | admin | Delete a category |

### Tags
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/tags` | ❌ | List all tags |
| POST | `/tags` | mod+ | Create a tag |

### Moderation (admin/moderator)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/users` | admin | List all users |
| PATCH | `/admin/users/:id/ban` | admin | Ban/unban user (`{ "ban": true/false }`) |
| PATCH | `/admin/users/:id/role` | admin | Change user role (`{ "role": "moderator" }`) |
| PATCH | `/admin/threads/:id/pin` | mod+ | Pin/unpin thread (`{ "pin": true/false }`) |
| PATCH | `/admin/threads/:id/lock` | mod+ | Lock/unlock thread (`{ "lock": true/false }`) |

---

## Authentication

All protected routes require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Example Requests

### Register
```json
POST /api/auth/register
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "secret123"
}
```

### Create Thread
```json
POST /api/threads
{
  "title": "How do I learn Node.js?",
  "content": "Looking for resources...",
  "category_id": 1,
  "tags": [2, 5]
}
```

### Post a Reply
```json
POST /api/threads/42/comments
{
  "content": "Great question!",
  "parent_id": 10
}
```

### Vote
```json
POST /api/vote
{
  "target_type": "thread",
  "target_id": 7,
  "value": 1
}
```
