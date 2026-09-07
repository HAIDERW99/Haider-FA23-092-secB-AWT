# 🔄 KametiPro — Pakistan's Smartest Kameti Management App
https://haider-fa-23-092-sec-b-awt-y2qt.vercel.app/

> Apni committee ko digital aur transparent banao — payments track karo, members manage karo, aur turn order automatically handle karo.

---

## 💡 The Idea

**Kameti** (also called committee or ROSCA) is a traditional savings system widely used in Pakistan. A group of people contribute a fixed amount every month, and each month one member gets the full collected amount.

The problem? It's all managed on paper, WhatsApp messages, or just memory — leading to confusion, missed payments, and disputes.

**KametiPro** solves this by bringing the whole process online:
- Admin creates a committee and adds members
- Everyone can see payment status in real time
- Turn order is managed automatically
- No more arguments about who paid and who didn't

---
| Role | Email | Password | Login URL |
|------|-------|----------|-----------|
| **Admin** | haiderwahla199@gmail.com | haider123 | 
| **User** | hamzaweb3565@gmail.com | 12345678 | 


## 🖼️ Screenshots

### Home Page
<img width="945" height="434" alt="image" src="https://github.com/user-attachments/assets/c244f2c6-6568-4c99-b6dc-bddfe326a79d" />


### How It Works
<img width="945" height="388" alt="image" src="https://github.com/user-attachments/assets/064b51c1-860d-48d8-9324-0216a3ddfd5f" />


### Pricing Plans
<img width="948" height="391" alt="image" src="https://github.com/user-attachments/assets/2d641d1d-37b2-4e22-bb51-8b52e1686066" />


### FAQ Section
<img width="938" height="382" alt="image" src="https://github.com/user-attachments/assets/6e618b2e-ead0-4fc1-ae95-ccc3ad06a172" />


### Contact Page
<img width="923" height="440" alt="image" src="https://github.com/user-attachments/assets/fc06931b-ef8d-4728-8a81-b9dcd7e35b6b" />


### CTA & Footer
<img width="946" height="385" alt="image" src="https://github.com/user-attachments/assets/cb1f191c-8363-4e68-a026-536f5e24b9bf" />


### Dashboard
<img width="945" height="434" alt="image" src="https://github.com/user-attachments/assets/80e6daca-4c45-4390-956d-6b4734d1331d" />


### Committee Detail — Payment Status
<img width="942" height="353" alt="image" src="https://github.com/user-attachments/assets/c8e60cc5-3344-458b-bdb2-0c9717d664cc" />



---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔐 Auth | Signup / Login with JWT |
| 🏦 Committee Management | Create, update, delete committees |
| 👥 Member Management | Add / remove members, assign turns |
| 💳 Payment Tracking | Mark paid, due, or upcoming per member |
| 📊 Dashboard | Live stats — collected, pending, progress |
| 🗑️ Delete Committee | Admin can delete with one click |
| 📬 Contact Form | Email + Facebook contact support |
| 💰 Subscription | Free / Pro / Business plans with payment flow |
| 📱 Responsive | Works on mobile and desktop |

---

## 🛠️ Technologies Used

### Frontend
| Tech | Purpose |
|---|---|
| React 18 | UI framework |
| Vite | Build tool & dev server |
| React Router v6 | Client-side routing |
| Axios | API calls |
| CSS (custom) | Styling — no UI library |

### Backend
| Tech | Purpose |
|---|---|
| Node.js | Runtime |
| Express.js | REST API framework |
| MongoDB | Database |
| Mongoose | ODM for MongoDB |
| JWT | Authentication tokens |
| bcryptjs | Password hashing |
| express-validator | Input validation |
| dotenv | Environment config |
| CORS | Cross-origin requests |

---

## 📁 Project Structure

```
Kameti-Pro/
├── kametipro-backend/       # Express + MongoDB API
│   ├── controllers/         # Business logic
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API endpoints
│   ├── middleware/          # Auth, validation, error handling
│   ├── utils/               # Token & turn order helpers
│   └── server.js            # Entry point
│
└── kametipro-react/         # React frontend
    ├── src/
    │   ├── pages/           # Home, Dashboard, CommitteeDetail, etc.
    │   ├── components/      # Navbar, Footer, Modals
    │   ├── api/             # Axios instance & API functions
    │   └── utils/           # Auth helpers
    └── index.html
```

---

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone <repo-url>
cd Kameti-Pro
```

### 2. Backend setup
```bash
cd kametipro-backend
npm install
```

Create a `.env` file:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/kametipro
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

```bash
node server.js
```

### 3. Frontend setup
```bash
cd kametipro-react
npm install
npm run dev
```

App runs at → **http://localhost:5173**  
API runs at → **http://localhost:5000**

---

## 🔌 API Overview

### Auth — `/api/auth`
| Method | Route | Description |
|---|---|---|
| POST | /signup | Register |
| POST | /login | Login, get token |
| GET | /me | Get current user |

### Committees — `/api/committees`
| Method | Route | Description |
|---|---|---|
| GET | / | My committees |
| POST | / | Create committee |
| GET | /:id | Committee detail |
| DELETE | /:id | Delete (admin only) |
| POST | /:id/members | Add member |
| DELETE | /:id/members/:memberId | Remove member |
| PATCH | /:id/payments/:memberId | Update payment status |

---

## 💳 Subscription Plans

| Plan | Price | Committees | Members |
|---|---|---|---|
| Free | ₨0/month | 1 | Up to 10 |
| Pro | ₨499/month | 10 | Unlimited |
| Business | ₨1,499/month | Unlimited | Unlimited |

Payment methods supported: **JazzCash**, **Easypaisa**, **Debit/Credit Card**, **Bank Transfer**

---

## 👨‍💻 Developer

**Haider Raza**  
📧 haiderwahla199@gmail.com  
🔗 [Facebook](https://www.facebook.com/profile.php?id=100077446284306)

---

## 📄 License

This project is for educational purposes. All rights reserved © 2025 KametiPro.
