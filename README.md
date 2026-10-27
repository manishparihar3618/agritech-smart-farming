# 🌱 AgriTech — Smart Farming Platform

A full-stack agricultural management platform that empowers farmers to manage farms, track crop lifecycles, list agricultural products, schedule machinery/consultation bookings, and monitor weather forecasts.

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: React 19, Vite, Vanilla CSS with custom modern Agricultural Design System.
- **Backend**: Node.js, Express 5, RESTful architecture.
- **Database**: MongoDB Atlas with Mongoose schemas.
- **Authentication**: JWT (JSON Web Tokens) with 7-day expiration, bcryptjs salted password hashing, and protected route middleware.
- **External APIs**: Open-Meteo Geocoding and Weather Forecast APIs (free, no paid API keys required).

---

## 🚀 Features

### 1. 🔐 Authentication & Authorization
- Farmer registration & login with server-side validation.
- Secure bcryptjs password hashing and JWT token generation.
- Bearer token authentication middleware for all protected CRUD routes.
- Safe client-side logout clearing session state.

### 2. 🏡 Farm Management
- Complete CRUD operations: Add new farm, view farmer's farms, delete farm.
- Tracks farm name, location (address, city, state, pincode), size (acres/hectares), soil type, and irrigation system.
- Strict ownership isolation (`farmer: req.user._id`).

### 3. 🌾 Crop Tracking
- Manage crop cycles linked to authenticated user and verified farm.
- Tracks crop name, variety, planting date, expected harvest date, area, and growth stage (`planned`, `seedling`, `vegetative`, `flowering`, `harvesting`, `harvested`).
- Full CRUD support with delete and populate capabilities.

### 4. 📦 Product Management
- List farming resources, seeds, fertilizers, pesticides, and equipment.
- Tracks name, category, description, brand, price, unit, and stock quantity.
- Full CRUD support with seller association.

### 5. 📅 Agricultural Bookings
- Schedule equipment rental, farming services, and expert consultations.
- Status management (`pending`, `confirmed`, `completed`, `cancelled`).
- Integrated one-click cancellation and booking deletion.

### 6. 🌦️ Weather Integration
- City-based search powered by Open-Meteo.
- Real-time temperature, apparent ("feels-like") temperature, relative humidity, and wind speed.
- 3-day forecast with daily max/min temperatures and rain precipitation probability.
- Defensive fallback and error handling for missing coordinates or unknown cities.

---

## ⚙️ Setup & Running Locally

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster or local MongoDB instance

### 1. Backend Setup
```bash
cd Server
npm install
```

Configure `Server/.env`:
```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

Start the backend:
```bash
npm run dev
# or
npm start
```
Server runs on `http://localhost:5000`.

### 2. Frontend Setup
```bash
cd Client
npm install
npm run dev
```
Client runs on `http://localhost:5173`.

---

## 🛡️ Security & Secret Rotation Notice

> [!IMPORTANT]
> If `Server/.env` was previously committed to version control in earlier commits:
> 1. Untrack the file:
>    ```bash
>    git rm --cached Server/.env
>    git commit -m "Stop tracking environment secrets"
>    ```
> 2. Rotate your MongoDB Atlas database user password in the MongoDB Atlas Console.
> 3. Generate a new high-entropy string for `JWT_SECRET`.
> 4. Keep your `.env` file solely on your local workstation and production environment variables.
