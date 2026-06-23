# FoodExpress Mobile App

This workspace contains the React Native Expo mobile app and a Node.js backend for the FoodExpress customer experience.

## Structure

- `foodexpress-app/` - React Native Expo customer mobile app.
- `backend/` - Node.js + Express backend with MongoDB Atlas, JWT auth, and REST APIs.

## Frontend Setup

1. Open `foodexpress-app/`.
2. Install dependencies:
   - `npm install`
3. Run the Expo app:
   - `npm start`

## Backend Setup

1. Open `backend/`.
2. Install dependencies:
   - `npm install`
3. Create `.env` from `.env.example`.
4. Start the server:
   - `npm run dev`

## API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `GET /api/foods`
- `GET /api/foods/:id`
- `GET /api/categories`
- `GET /api/restaurants`
- `GET /api/reviews/food/:foodId`
- `GET /api/orders`
- `POST /api/orders`
- `GET /api/cart`
- `PUT /api/cart`
- `DELETE /api/cart`
- `GET /api/wishlist`
- `PUT /api/wishlist`

## Notes

- The app is built only for the customer mobile experience.
- Admin dashboard integration is intentionally excluded and can be added later.
- The backend is designed for future admin features like managing foods, restaurants, categories, orders, users, and coupons.
