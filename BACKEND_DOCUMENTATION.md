# PharmaConnect Backend Documentation

---

## 1. Overview

**Purpose:**  
PharmaConnect Backend is a Node.js/Express REST API that powers a pharmacy and healthcare platform. It manages users (patients/doctors), medicines, orders, and chat, providing secure authentication, data management, and real-time communication.

**Tech Stack:**
- Node.js
- Express.js
- MongoDB (Mongoose ODM)
- Socket.io (for chat)
- JWT (JSON Web Tokens) for authentication
- dotenv for environment management
- cookie-parser for cookie handling
- CORS for cross-origin requests

**Architecture Diagram:**
```
[Frontend] <--> [Express REST API] <--> [MongoDB]
                        |                |
                  [Socket.io]         [Mongoose]
```

**Deployment Model:**
- To be deployed as a containerized Node.js app (e.g., on Render, Heroku, or Docker/Kubernetes)
- Environment variables managed via `.env` file or platform secrets
- MongoDB Atlas or managed MongoDB instance

---

## 2. Getting Started

### Cloning the Repository
```bash
git clone <repo-url>
cd PharmaConnectBackend
```

### Environment Setup
- Node.js v18+
- MongoDB (local or Atlas)

### Installing Dependencies
```bash
npm install
```

### Environment Variables
Create a `.env` file in the root with:
```
PORT=3000
MONGO_URI=<your-mongodb-uri>
JWT_SECRET=<your-jwt-secret>
JWT_COOKIE_EXPIRY_TIME=2d
NODE_ENV=development
```

### Running Locally
```bash
npm run dev
```

---

## 3. Authentication Flow

- **Signup/Login:**
  - Users (patients/doctors) sign up or log in via `/api/users/signup` or `/api/users/login`.
  - On success, a JWT is generated and sent as an HTTP-only cookie (`jwt`).
- **Token Structure:**
  - JWT payload: `{ id: <userId> }`
  - Expiry: set by `JWT_COOKIE_EXPIRY_TIME` (e.g., 2 days)
- **Middleware:**
  - `protect` middleware checks for JWT in cookies or `Authorization` header.
  - If valid, attaches user to `req.user`.
  - `restrictTo` middleware restricts access by user role.
- **Logout:**
  - `/api/users/logout` clears the JWT cookie.

---

## 4. API Documentation

### User Routes (`/api/users`)
- `POST /signup` — Register new user (patient/doctor)
- `POST /login` — Login
- `GET /logout` — Logout
- `GET /me` — Get current user (protected)
- `GET /profile` — Get full profile (protected)
- `PATCH /updateMe` — Update profile (protected)

### Medicine Routes (`/api/medicines`)
- `GET /` — List medicines (pagination, filter by category)
- `GET /search` — Search medicines (by name, desc, category, price)
- `GET /:id` — Get medicine by ID
- `POST /` — Create medicine (admin)
- `PUT /:id` — Update medicine (admin)
- `DELETE /:id` — Delete medicine (admin)

### Order Routes (`/api/orders`)
- `POST /` — Create order
- `GET /user/:userId` — Get user orders
- `GET /:id` — Get order by ID
- `PATCH /:id/cancel` — Cancel order
- `GET /` — List all orders (admin)
- `PATCH /:id/status` — Update order status (admin)

### Chat Routes (`/api/chat`)
- `GET /` — List chats
- `GET /:id` — Get chat history
- `POST /chats` — Create chat

### Error Format
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (optional)"
}
```

---

## 5. Database Structures

### Patient
- `name`: String, required
- `email`: String, required, unique
- `role`: 'patient' | 'doctor', default 'patient'
- `password`: String, required, min 8 chars
- `dateOfBirth`: Date, required
- `appointmentIds`: [ObjectId]
- `chatIds`: [ObjectId]
- `orderIds`: [ObjectId]

### Doctor
- `name`: String, required
- `email`: String, required, unique
- `role`: 'patient' | 'doctor', default 'doctor'
- `password`: String, required, min 8 chars
- `specialization`: String, required
- `appointmentIds`: [ObjectId]

### Medicine
- `name`: String, required
- `price`: Number, required
- `shortDesc`: String, required
- `image`: String, required
- `category`: String, default 'General'

### Order
- `customerId`: ObjectId (Patient), required
- `orderItems`: [{ medicineId, quantity, unitPrice }]
- `totalPrice`: Number, required
- `orderStatus`: 'pending' | 'delivered' | 'cancelled', default 'pending'
- `deliveryDate`: Date, required
- `shippingAddress`: String, required

### Chat
- `title`: String, required
- `lastMessage`: { role, message, timestamp }
- `messageHistory`: [{ role, message, timestamp }]

#### Entity Relationship Diagram (ERD)
```
[Patient]---<orderIds>---[Order]---<orderItems>---[Medicine]
   |                          
   |---<chatIds>---[Chat]

[Doctor]---<appointmentIds>---[Appointment]
```

---

## 6. Services and Modules
- **Controllers:** Business logic for users, medicines, orders, chat
- **Models:** Mongoose schemas for all entities
- **Routes:** API endpoints for each resource
- **Sockets:** Real-time chat via Socket.io
- **Utils:** Error handling, async wrappers

---

## 7. Error Handling and Logging
- Centralized error handler (`errorController.js`) catches and formats all errors
- Custom `AppError` class for operational errors
- Validation, JWT, and database errors are handled with clear messages
- Errors in development include stack traces; in production, only safe messages are sent
- Logging via `console.log` for key events and errors (can be extended with Winston/Morgan)

---

For further details, see the codebase and comments in each file.
