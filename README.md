# 🎫 Saba Ticket — Backend API

Node.js + Express + MongoDB backend for Bus/Train/Flight booking system.

---

## 🚀 Setup

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
# → Fill in MONGO_URI, JWT_SECRET, RAZORPAY keys, EMAIL credentials

# Run in development
npm run dev

# Run in production
npm start
```

---

## 📡 API Endpoints

Base URL: `http://localhost:5000/api`

### 🔐 Auth (`/api/auth`)

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/register` | Public | Register new user |
| POST | `/login` | Public | Login user |
| GET | `/me` | Private | Get current user profile |
| PUT | `/update-profile` | Private | Update name/phone |
| PUT | `/change-password` | Private | Change password |
| POST | `/forgot-password` | Public | Send reset email |
| PUT | `/reset-password/:token` | Public | Reset password with token |

**Register body:**
```json
{
  "name": "Ahmed Khan",
  "email": "ahmed@example.com",
  "password": "secure123",
  "phone": "9876543210"
}
```

---

### 🚌 Trips (`/api/trips`)

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/search` | Public | Search trips |
| GET | `/:id` | Public | Get trip details |
| GET | `/:id/seats` | Public | Get seat layout |

**Search query params:**
```
/api/trips/search?from=Delhi&to=Mumbai&date=2024-12-25&type=flight&passengers=2
```

---

### 🎟️ Bookings (`/api/bookings`)

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/create` | Private | Create a booking |
| GET | `/my-bookings` | Private | Get user's bookings |
| GET | `/:id` | Private | Get booking details |
| POST | `/:id/cancel` | Private | Cancel booking |

**Create booking body:**
```json
{
  "tripId": "64abc...",
  "seatClass": "economy",
  "passengers": [
    {
      "name": "Ahmed Khan",
      "age": 28,
      "gender": "male",
      "seatNumber": "S01",
      "idType": "aadhar",
      "idNumber": "1234-5678-9012"
    }
  ]
}
```

---

### 💳 Payment (`/api/payment`)

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/create-order` | Private | Create Razorpay order |
| POST | `/verify` | Private | Verify payment signature |
| POST | `/webhook` | Razorpay | Handle payment events |

**Payment flow:**
1. `POST /api/bookings/create` → get `bookingId`
2. `POST /api/payment/create-order` with `{ bookingId }` → get Razorpay `order.id`
3. Open Razorpay checkout in frontend with order details
4. On success, `POST /api/payment/verify` with razorpay response
5. Booking confirmed + email sent ✅

---

### 👑 Admin (`/api/admin`) — Admin only

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/dashboard` | Stats overview |
| GET | `/trips` | All trips (with filters) |
| POST | `/trips` | Create new trip |
| PUT | `/trips/:id` | Update trip |
| DELETE | `/trips/:id` | Delete trip |
| GET | `/bookings` | All bookings |
| GET | `/users` | All users |
| PUT | `/users/:id/ban` | Ban/unban user |

**Create trip body (Admin):**
```json
{
  "type": "flight",
  "name": "IndiGo 6E-201",
  "from": { "city": "Delhi", "station": "Indira Gandhi International", "code": "DEL" },
  "to": { "city": "Mumbai", "station": "Chhatrapati Shivaji", "code": "BOM" },
  "departureTime": "2024-12-25T08:00:00.000Z",
  "arrivalTime": "2024-12-25T10:15:00.000Z",
  "duration": "2h 15m",
  "totalSeats": 180,
  "price": { "economy": 4500, "business": 12000 },
  "operator": "IndiGo",
  "amenities": ["Meals", "WiFi"]
}
```

---

## 🔑 Authentication

Send JWT token in every protected request:
```
Authorization: Bearer <your_token>
```

---

## 📦 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT + bcryptjs
- **Payments:** Razorpay
- **Email:** Nodemailer (Gmail SMTP)
- **Security:** Helmet, CORS, Rate Limiting

---

## 🗂️ Project Structure

```
src/
├── config/
│   └── db.js               # MongoDB connection
├── controllers/
│   ├── authController.js   # Auth logic
│   ├── tripController.js   # Trip search
│   ├── bookingController.js# Booking logic
│   ├── paymentController.js# Razorpay integration
│   └── adminController.js  # Admin panel
├── middleware/
│   └── auth.js             # JWT protect + adminOnly
├── models/
│   ├── User.js
│   ├── Trip.js
│   └── Booking.js
├── routes/
│   ├── authRoutes.js
│   ├── tripRoutes.js
│   ├── bookingRoutes.js
│   └── adminRoutes.js
├── utils/
│   └── helpers.js          # JWT, email utils
└── server.js               # Entry point
```

---

## 🌐 Deploy on Render (Free)

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo
4. Set environment variables from `.env.example`
5. Build command: `npm install`
6. Start command: `npm start`
