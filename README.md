# Ember & Plate

A full-stack restaurant ordering and reservation experience built with React, Express, and MongoDB. The customer storefront and protected restaurant admin studio use the same persistent API and database.

## Features

- Cinematic, responsive restaurant home page and complete menu browsing experience.
- MongoDB-backed menu search, category/dietary/price filters, sorting, dish details, favorites, and admin CRUD.
- Customer registration, sign-in, profile, and role-based administrator access. Passwords are hashed with bcrypt; API sessions use signed JWTs.
- Persistent cart, server-priced checkout, mock pay-on-delivery/pickup order creation, status timeline, and admin order status updates.
- Reservation requests with optional signed-in customer association, customer cancellation, and date-filtered admin management.
- Admin overview with daily metrics, popular dishes, recent orders, and a seven-day revenue chart.
- Loading, empty, and error states; responsive navigation; toast feedback; and subtle Framer Motion transitions.
- Express validation, Helmet headers, CORS allow-listing, authentication rate limiting, and centralized API errors.
- Locally served sample food and dining photography, so the seeded experience does not depend on third-party image requests at runtime.

## Stack and architecture

- **Frontend:** React 18, Vite, JavaScript, React Router, Axios, Lucide React, Framer Motion, Recharts.
- **Backend:** Node.js ES modules, Express, Mongoose, MongoDB, bcryptjs, JWT.
- `frontend/src/pages/` contains the home, customer, and administration screens. Shared state lives in `context/`, reusable UI in `components/`, and HTTP configuration in `services/`.
- `backend/models/` defines User, MenuItem, Category, Order, Reservation, and Favorite. `routes/api.js` exposes the REST API; `middleware/` handles authorization and errors; `seed.js` provisions sample data and an optional first admin.

## Requirements

- Node.js 20+ and npm.
- MongoDB 6+ locally, or a MongoDB Atlas connection string.

## Installation

From the project root:

```powershell
npm install
npm install --prefix backend
npm install --prefix frontend
Copy-Item .env.example backend\.env
```

Edit `backend\.env` before starting the server. `JWT_SECRET` must be a long, unique random value. Do not commit `.env` files.

### Environment variables

| Variable | Purpose | Default |
| --- | --- | --- |
| `PORT` | Express listening port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/ember-and-plate` |
| `JWT_SECRET` | Secret used to sign access tokens | Required |
| `CLIENT_URL` | Allowed browser origin for CORS | `http://localhost:5173` |
| `ADMIN_NAME` | Name for the first seeded admin | `Ember Admin` |
| `ADMIN_EMAIL` | Email for the first seeded admin | `admin@emberandplate.com` |
| `ADMIN_PASSWORD` | Password for the first seeded admin (8+ chars) | Set a private value |
| `VITE_API_URL` | Optional frontend API base URL | `http://localhost:5000/api` |

`backend/.env.example` is also available as a copy-ready backend template.

## MongoDB and seed data

Start MongoDB locally, or create a database in Atlas and set `MONGODB_URI`. Seed sample dishes, categories, and (when admin credentials are set) the initial administrator:

```powershell
npm run seed
```

The seed operation is safe to rerun: existing sample dish records are kept, and missing records are inserted. Seeded dishes include Paneer Tikka, Butter Chicken, Margherita Pizza, Truffle Pasta, Classic Burger, Grilled Salmon, Chocolate Lava Cake, Tiramisu, and Fresh Lime Soda.

## Run the application

Run both development servers from the project root:

```powershell
npm run dev
```

Or start them separately:

```powershell
npm run dev:backend
npm run dev:frontend
```

- Web app: `http://localhost:5173`
- API health: `http://localhost:5000/api/health`

Production frontend build:

```powershell
npm run build
```

## First administrator

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env`, then run the seed script. Sign in with those credentials. Admin users can access `/admin`, `/admin/menu`, `/admin/orders`, `/admin/reservations`, and `/admin/customers`. Public registration always creates a customer account; it cannot assign administrator privileges.

## API overview

- Authentication: `POST /api/auth/register`, `POST /api/auth/login`, `GET/PATCH /api/auth/me`.
- Menu: `GET /api/menu`, `GET /api/menu/:id`; admin-only `POST /api/menu`, `PATCH /api/menu/:id`, `DELETE /api/menu/:id`.
- Orders: `POST /api/orders`, `GET /api/orders/mine`, `GET /api/orders/:id`; admin-only `GET /api/orders`, `PATCH /api/orders/:id/status`.
- Reservations: `POST /api/reservations`, `GET /api/reservations/mine`, `DELETE /api/reservations/:id`; admin-only `GET /api/reservations`, `PATCH /api/reservations/:id/status`.
- Favorites: authenticated `GET /api/favorites`, `POST/DELETE /api/favorites/:id`.
- Dashboard and customers: admin-only `GET /api/admin/stats`, `GET /api/admin/customers`.

Order totals are calculated by the API from the current database menu prices rather than trusting client-supplied prices. Payments are intentionally mocked; the checkout explicitly does not collect card data.

## End-to-end smoke test

1. Start MongoDB, seed data, and run both servers.
2. Register a customer, sign in, browse the seeded menu, add a dish, and place a delivery or pickup order.
3. Sign in as the seeded admin in a second browser profile; inspect `/admin/orders` and update its status.
4. Return to the customer order page; the order detail refreshes status periodically.
5. In `/admin/menu`, add Paneer Tikka (or another dish); confirm it appears on `/menu`.
6. Submit a reservation; signed-in customers can see it under `/reservations`, and an admin can confirm/cancel it.

MongoDB must be running and reachable for API-backed pages, registration, orders, reservations, and the admin dashboard to work.

Sample photography is packaged under `frontend/public/images/`; replace it with restaurant-owned or separately licensed imagery for a production deployment.
