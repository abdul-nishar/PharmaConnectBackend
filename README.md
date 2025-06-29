# PharmaConnect Backend Documentation

---

## Table of Contents
- [1. Overview](#1-overview)
- [2. Getting Started](#2-getting-started)
- [3. Authentication Flow](#3-authentication-flow)
- [4. API Documentation](#4-api-documentation)
- [5. Database Structures](#5-database-structures)
- [6. Services and Modules](#6-services-and-modules)
- [7. Error Handling and Logging](#7-error-handling-and-logging)

---

## 1. Overview

**Purpose:**  
PharmaConnect Backend is a Node.js/Express REST API and real-time server for a pharmacy and healthcare platform. It manages users (patients/doctors), medicines, orders, appointments, and chat, providing secure authentication, data management, and live chat with AI assistant integration.

**Tech Stack:**
- Node.js
- Express.js
- MongoDB (Mongoose ODM)
- Socket.io (for real-time chat)
- JWT (JSON Web Tokens) for authentication
- dotenv for environment management
- cookie-parser for cookie handling
- CORS for cross-origin requests
- Gemini API (Google GenAI) for AI chat assistant

**Architecture Diagram:**
```
[Frontend] <--> [Express REST API + Socket.io] <--> [MongoDB]
                        |                |
                  [Gemini AI]         [Mongoose]
```

**Deployment Model:**
- Deploy as a Node.js app (containerized or on cloud platforms)
- Environment variables managed via `.env` or platform secrets
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
GEMINI_API_KEY=<your-gemini-api-key>
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

### Appointment Routes (`/api/appointments`)
- `POST /` — Create appointment
- `GET /` — List all appointments for user (pagination, filter by status)
- `GET /:id` — Get single appointment (with access control)
- `PATCH /:id` — Update appointment (date/time, only if pending)
- `DELETE /:id` — Cancel appointment (patient only)
- `PATCH /:id/status` — Update appointment status/report (doctor only)

### Chat Routes (`/api/chat`)
- `POST /` — Create new chat (adds to user's chatIds)
- `GET /chatSummaries` — List chat summaries for sidebar
- `GET /:chatId/messages` — Get message history for a chat (access controlled)

#### Real-Time Chat (Socket.io)
- `joinChat` — Join a chat room, receive `{ messageHistory: [...] }`
- `newMessage` — Send a new message, all clients receive `message` event with the new message
- AI assistant replies automatically using Gemini API

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

### Appointment
- `doctorId`: ObjectId (Doctor), required
- `patientId`: ObjectId (Patient), required
- `appointmentDate`: Date, required
- `appointmentTime`: String, required
- `consultationFee`: Number
- `status`: 'Pending' | 'Completed' | 'Cancelled', default 'Pending'
- `consultationReport`: String (optional)

### Chat
- `title`: String, required
- `lastMessage`: { role, message, timestamp }
- `messageHistory`: [{ role, message, timestamp }]

#### Entity Relationship Diagram (ERD)
```
[Patient]---<appointmentIds>---[Appointment]---<doctorId>---[Doctor]
   |                          
   |---<chatIds>---[Chat]
   |---<orderIds>---[Order]---<orderItems>---[Medicine]

[Doctor]---<appointmentIds>---[Appointment]
```

---

## 6. Services and Modules
- **Controllers:** Business logic for users, medicines, orders, appointments, chat
- **Models:** Mongoose schemas for all entities
- **Routes:** API endpoints for each resource
- **Sockets:** Real-time chat via Socket.io, AI integration
- **Utils:** Error handling, async wrappers, AI client

---

## 7. Error Handling and Logging
- Centralized error handler (`errorController.js`) catches and formats all errors
- Custom `AppError` class for operational errors
- Validation, JWT, and database errors are handled with clear messages
- Errors in development include stack traces; in production, only safe messages are sent
- Logging via `console.log` for key events and errors (can be extended with Winston/Morgan)

---

For further details, see the codebase and comments in each file.
