# KametiPro Backend API

Express.js + MongoDB REST API for the KametiPro committee management platform.

## Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **Validation**: express-validator

## Project Structure

```
kametipro-backend/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/
│   ├── authController.js      # signup, login, getMe
│   ├── committeeController.js # CRUD + join + invite
│   └── paymentController.js   # history, mark-paid, advance-month
├── middleware/
│   ├── auth.js                # protect (JWT) + adminOnly
│   ├── errorHandler.js        # central error handler
│   └── validate.js            # express-validator runner
├── models/
│   ├── User.js                # name, email, phone, hashed password
│   ├── Committee.js           # committee + members + turnOrder
│   └── Payment.js             # payment records per member per month
├── routes/
│   ├── authRoutes.js
│   ├── committeeRoutes.js
│   └── paymentRoutes.js
├── utils/
│   ├── generateToken.js       # JWT signing helper
│   └── turnOrder.js           # turn order generation logic
├── app.js                     # Express app setup
├── server.js                  # Entry point
└── .env                       # Environment variables
```

## Setup

```bash
cd kametipro-backend
npm install
# Edit .env with your MongoDB URI and JWT secret
npm run dev      # development (nodemon)
npm start        # production
```

## Environment Variables (.env)

| Variable        | Description                          | Default                              |
|-----------------|--------------------------------------|--------------------------------------|
| PORT            | Server port                          | 5000                                 |
| NODE_ENV        | Environment                          | development                          |
| MONGO_URI       | MongoDB connection string            | mongodb://127.0.0.1:27017/kametipro  |
| JWT_SECRET      | Secret key for JWT signing           | (change this!)                       |
| JWT_EXPIRES_IN  | Token expiry                         | 7d                                   |
| CLIENT_URL      | Frontend origin for CORS             | http://localhost:5174                |

## API Reference

### Auth  `/api/auth`

| Method | Endpoint   | Auth | Description          |
|--------|------------|------|----------------------|
| POST   | /signup    | No   | Register new user    |
| POST   | /login     | No   | Login, returns JWT   |
| GET    | /me        | Yes  | Get current user     |

### Committees  `/api/committees`

| Method | Endpoint                        | Auth  | Description                        |
|--------|---------------------------------|-------|------------------------------------|
| POST   | /                               | Yes   | Create committee                   |
| GET    | /                               | Yes   | Get all my committees              |
| GET    | /:id                            | Yes   | Get single committee               |
| PUT    | /:id                            | Yes   | Update committee (admin)           |
| DELETE | /:id                            | Yes   | Delete committee (admin)           |
| POST   | /join/:inviteToken              | Yes   | Join via invite link               |
| GET    | /:id/invite-link                | Yes   | Get invite URL (admin)             |
| POST   | /:id/regenerate-invite          | Yes   | Regenerate invite token (admin)    |

### Payments  `/api/payments`

| Method | Endpoint                                  | Auth | Description                        |
|--------|-------------------------------------------|------|------------------------------------|
| GET    | /committee/:committeeId                   | Yes  | Full payment history               |
| GET    | /my/:committeeId                          | Yes  | My own payments for a committee    |
| PATCH  | /:paymentId/mark-paid                     | Yes  | Mark payment as Paid               |
| PATCH  | /:paymentId/status                        | Yes  | Update status (admin)              |
| POST   | /committee/:committeeId/advance-month     | Yes  | Advance to next month (admin)      |

## Turn Order Logic

`utils/turnOrder.js` provides:
- **`generateTurnOrder(memberIds, strategy)`** — assigns each member a unique month slot
  - `sequential`: members get turns in join order
  - `random`: turns are randomly shuffled (Fisher-Yates)
- **`getTurnForMonth(turnOrder, month)`** — returns the member ID for a given month
- **`appendMemberToTurnOrder(existing, newMemberId, duration)`** — adds a new member to the first available slot

## Authentication

All protected routes require:
```
Authorization: Bearer <token>
```
