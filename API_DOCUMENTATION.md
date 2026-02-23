# Movie Rental Backend API Documentation

Base URL:
- `http://localhost:5000`

Database:
- `movieappDB`

Content type:
- Use `Content-Type: application/json` for JSON endpoints.
- Use `multipart/form-data` for movie create/update endpoints.

Authentication:
- Protected endpoints require:
- `Authorization: Bearer <JWT_TOKEN>`

## Response Format

Success response:
```json
{
  "success": true,
  "message": "Some message",
  "data": {}
}
```

Error response:
```json
{
  "success": false,
  "message": "Error message"
}
```

---

## Health

### GET `/health`

Purpose:
- Service health check.

Response `200`:
```json
{
  "success": true,
  "message": "OK"
}
```

---

## Auth APIs

### POST `/api/auth/register`

Purpose:
- Register a normal user account and auto-login immediately.

Body:
```json
{
  "name": "John Doe",
  "email": "john@mail.com",
  "password": "User@123"
}
```

Response `200`:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "USER_ID",
      "name": "John Doe",
      "email": "john@mail.com",
      "role": "user"
    },
    "token": "JWT_TOKEN"
  }
}
```

Notes:
- Response structure matches `/api/auth/login` exactly.
- Token is returned immediately after successful registration.

### POST `/api/auth/login`

Purpose:
- Login a normal user account.
- Also accepts admin credentials from environment variables (`ADMIN_EMAIL` / `ADMIN_PASSWORD`) and returns an admin JWT when matched.

Body:
```json
{
  "email": "john@mail.com",
  "password": "User@123"
}
```

Response `200`:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "USER_OR_ADMIN_ID",
      "name": "John Doe",
      "email": "john@mail.com",
      "role": "user"
    },
    "token": "JWT_TOKEN"
  }
}
```

### POST `/api/auth/admin/login`

Purpose:
- Login admin account using environment credentials (`ADMIN_EMAIL`, `ADMIN_PASSWORD`).

Body:
```json
{
  "email": "admin2@mail.com",
  "password": "admin123"
}
```

Response `200`:
```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "user": {
      "id": "admin",
      "name": "System Admin",
      "email": "admin2@mail.com",
      "role": "admin"
    },
    "token": "JWT_TOKEN"
  }
}
```

### GET `/api/auth/me`

Purpose:
- Return authenticated account profile data for logged-in user/admin.

Headers:
- `Authorization: Bearer <JWT_TOKEN>`

Response `200`:
```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "id": "USER_OR_ADMIN_ID",
    "name": "John Doe",
    "email": "john@mail.com",
    "role": "user"
  }
}
```

Error `401` examples:
```json
{
  "success": false,
  "message": "Authorization token is missing"
}
```

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

```json
{
  "success": false,
  "message": "User not found or inactive"
}
```

Error `404` (token valid but account removed after auth check):
```json
{
  "success": false,
  "message": "User not found"
}
```

---

## Movie APIs (Public)

### GET `/api/movies?page=1&limit=10`

Purpose:
- Paginated movie listing for home/explore page.

Query params:
- `page` default `1`
- `limit` default `10`, max `50`

Response `200`:
```json
{
  "success": true,
  "message": "Movies fetched successfully",
  "data": {
    "totalMovies": 120,
    "totalPages": 12,
    "currentPage": 1,
    "movies": [
      {
        "id": "MOVIE_ID",
        "title": "Inception",
        "description": "Movie description",
        "actors": ["Actor 1", "Actor 2"],
        "rating": 8.8,
        "price": 199,
        "coverImageUrl": "https://res.cloudinary.com/<cloud>/image/upload/v123/movie-rental/covers/file.jpg",
        "createdAt": "2026-02-16T10:00:00.000Z",
        "updatedAt": "2026-02-16T10:00:00.000Z"
      }
    ]
  }
}
```

### GET `/api/movies/:movieId`

Purpose:
- Get single movie details (public metadata).

Response `200`:
```json
{
  "success": true,
  "message": "Movie details fetched",
  "data": {
    "id": "MOVIE_ID",
    "title": "Inception",
    "description": "Movie description",
    "actors": ["Actor 1", "Actor 2"],
    "rating": 8.8,
    "price": 199,
    "coverImageUrl": "https://res.cloudinary.com/<cloud>/image/upload/v123/movie-rental/covers/file.jpg",
    "createdAt": "2026-02-16T10:00:00.000Z",
    "updatedAt": "2026-02-16T10:00:00.000Z"
  }
}
```

---

## Payment APIs (User Protected)

Required:
- User JWT token

### POST `/api/payment/create-order`

Purpose:
- Create Razorpay order for a movie purchase.
- Prevents duplicate purchase if active rental already exists.

Body:
```json
{
  "movieId": "MOVIE_ID"
}
```

Response `201`:
```json
{
  "success": true,
  "message": "Razorpay order created",
  "data": {
    "orderId": "order_xxx",
    "amount": 19900,
    "currency": "INR",
    "keyId": "rzp_xxx",
    "movieId": "MOVIE_ID"
  }
}
```

Error `409` when already rented:
```json
{
  "success": false,
  "message": "You already rented this movie and your access is still active"
}
```

### POST `/api/payment/verify`

Purpose:
- Verify Razorpay signature.
- Mark purchase as paid.
- Grant rental access for 30 days (configurable).

Body:
```json
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx"
}
```

Response `200`:
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "purchaseId": "PURCHASE_ID",
    "movieId": "MOVIE_ID",
    "accessExpiresAt": "2026-03-16T10:00:00.000Z",
    "watchLink": "/api/user/watch/MOVIE_ID"
  }
}
```

---

## User APIs (User Protected)

Required:
- User JWT token

### GET `/api/user/my-movies`

Purpose:
- Fetch all active purchased movies.
- Returns expiry date and watch link for each movie.

Response `200`:
```json
{
  "success": true,
  "message": "Purchased movies fetched successfully",
  "data": [
    {
      "movieId": "MOVIE_ID",
      "title": "Inception",
      "description": "Movie description",
      "actors": ["Actor 1", "Actor 2"],
      "rating": 8.8,
      "price": 199,
      "coverImageUrl": "https://res.cloudinary.com/<cloud>/image/upload/v123/movie-rental/covers/file.jpg",
      "purchasedAt": "2026-02-16T10:00:00.000Z",
      "expiryDate": "2026-03-16T10:00:00.000Z",
      "watchLink": "/api/user/watch/MOVIE_ID"
    }
  ]
}
```

### GET `/api/user/watch/:movieId`

Purpose:
- Validate active rental access for the movie.
- Returns direct Cloudinary video URL for playback.

Response `200`:
```json
{
  "success": true,
  "message": "Watch access granted",
  "data": {
    "movie": {
      "id": "MOVIE_ID",
      "title": "Inception",
      "description": "Movie description",
      "actors": ["Actor 1", "Actor 2"],
      "rating": 8.8,
      "price": 199,
      "coverImageUrl": "https://res.cloudinary.com/<cloud>/image/upload/v123/movie-rental/covers/file.jpg",
      "createdAt": "2026-02-16T10:00:00.000Z",
      "updatedAt": "2026-02-16T10:00:00.000Z"
    },
    "accessExpiresAt": "2026-03-16T10:00:00.000Z",
    "watchLink": "https://res.cloudinary.com/<cloud>/video/upload/v123/movie-rental/videos/file.mp4"
  }
}
```

### GET `/api/user/watch/:movieId/stream`

Purpose:
- Redirects to the Cloudinary video URL.
- Requires valid active purchase.

Response:
- Redirect response (`302`) to Cloudinary video URL if access valid.
- `403` if not purchased or expired.

---

## Admin APIs (Admin Protected)

Required:
- Admin JWT token

### GET `/api/admin/dashboard/overview`

Purpose:
- Dashboard summary.

Response `200`:
```json
{
  "success": true,
  "message": "Dashboard overview fetched",
  "data": {
    "totalMovies": 10,
    "totalUsers": 250,
    "totalPurchases": 540,
    "totalRevenue": 128000,
    "paidTransactions": 500
  }
}
```

### GET `/api/admin/movies`

Purpose:
- Get all movies (admin view).

### GET `/api/admin/movies/:movieId`

Purpose:
- Get full movie details (admin view).

### POST `/api/admin/movies`

Purpose:
- Upload new movie with assets.

Request:
- `multipart/form-data`

Fields:
- `title` (string, required)
- `description` (string, required)
- `price` (number, required)
- `rating` (number, optional)
- `actors` (comma-separated string or array, optional)
- `cover` (file: image, required)
- `video` (file: video, required)

Response `201`:
```json
{
  "success": true,
  "message": "Movie uploaded successfully",
  "data": {
    "id": "MOVIE_ID",
    "title": "Inception",
    "description": "Movie description",
    "actors": ["Actor 1", "Actor 2"],
    "rating": 8.8,
    "price": 199,
    "coverImageUrl": "https://res.cloudinary.com/<cloud>/image/upload/v123/movie-rental/covers/file.jpg",
    "coverImagePublicId": "movie-rental/covers/file",
    "videoUrl": "https://res.cloudinary.com/<cloud>/video/upload/v123/movie-rental/videos/file.mp4",
    "videoPublicId": "movie-rental/videos/file",
    "createdAt": "2026-02-16T10:00:00.000Z",
    "updatedAt": "2026-02-16T10:00:00.000Z"
  }
}
```

### PUT `/api/admin/movies/:movieId`

Purpose:
- Update movie metadata and optionally replace cover/video files.
- If new media is uploaded, old Cloudinary assets are deleted after successful update.

Request:
- `multipart/form-data`

Fields (all optional):
- `title` (string)
- `description` (string)
- `price` (number)
- `rating` (number)
- `actors` (comma-separated string or array)
- `cover` (file: image)
- `video` (file: video)

Response `200`:
```json
{
  "success": true,
  "message": "Movie updated successfully",
  "data": {
    "id": "MOVIE_ID",
    "title": "Inception",
    "description": "Movie description",
    "actors": ["Actor 1", "Actor 2"],
    "rating": 8.9,
    "price": 249,
    "coverImageUrl": "https://res.cloudinary.com/<cloud>/image/upload/v123/movie-rental/covers/file.jpg",
    "coverImagePublicId": "movie-rental/covers/file",
    "videoUrl": "https://res.cloudinary.com/<cloud>/video/upload/v123/movie-rental/videos/file.mp4",
    "videoPublicId": "movie-rental/videos/file",
    "createdAt": "2026-02-16T10:00:00.000Z",
    "updatedAt": "2026-02-16T10:30:00.000Z"
  }
}
```

### DELETE `/api/admin/movies/:movieId`

Purpose:
- Delete movie and associated Cloudinary assets.

Response `200`:
```json
{
  "success": true,
  "message": "Movie deleted successfully"
}
```

### GET `/api/admin/users`

Purpose:
- List all users.

### GET `/api/admin/purchases`

Purpose:
- List all purchases with user/movie references.

---

## Razorpay Frontend Integration Flow

1. User logs in using `/api/auth/login`.
2. Call `/api/payment/create-order` with `movieId`.
3. Open Razorpay checkout on frontend using:
- `key`: `data.keyId`
- `order_id`: `data.orderId`
- `amount`: `data.amount`
- `currency`: `data.currency`
4. On successful payment callback, send to backend `/api/payment/verify`:
- `razorpay_order_id`
- `razorpay_payment_id`
- `razorpay_signature`
5. If verify succeeds, user can access:
- `/api/user/my-movies`
- `/api/user/watch/:movieId`
- `/api/user/watch/:movieId/stream` (optional redirect endpoint)

---

## Common Status Codes

- `200` OK
- `201` Created
- `400` Bad Request
- `401` Unauthorized
- `403` Forbidden
- `404` Not Found
- `409` Conflict
- `500` Internal Server Error


