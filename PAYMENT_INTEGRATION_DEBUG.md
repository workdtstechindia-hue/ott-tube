# Razorpay Payment Integration - APK Debugging Guide

## 🔴 Critical Issues Fixed

### 1. **CORS Whitelist (Web + APK)**
- **Problem**: Backend was using blanket `cors()` which may reject APK requests from different origins.
- **Fix**: Added CORS whitelist in `backend/app.js` with proper `credentials`, `methods`, and `allowedHeaders`.
- **APK Status**: Now allows requests from mobile apps (requests without origin header are accepted).

### 2. **Razorpay API Credentials**
- **Problem**: `.env` shows `rzp_live_*` (Live Mode) but APK may be in test mode.
- **Current Setup**: Live keys require:
  - ✅ Activated Razorpay merchant account
  - ✅ KYC verification complete
  - ✅ Live API keys matched with test app
- **For Testing**: Switch to `rzp_test_*` keys in `.env`:
  ```env
  RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxx
  RAZORPAY_KEY_SECRET=rzp_test_yyyyyyyyyyyy
  ```

### 3. **Order Status Endpoint (New)**
- **Added**: `GET /api/payment/order/:orderId` — APK can now query pending payment status.
- **Use Case**: If payment hangs, APK can check if order was created.

### 4. **Improved Error Logging**
- **Added**: Detailed error messages for:
  - Signature verification failures
  - Missing orders
  - Duplicate payments
  - "Merchant issue" → clarifies test vs live key problem

---

## 🔧 Troubleshooting APK Payment Failures

### Symptom: "Payment Issue" / Payment Fails Immediately

**Step 1: Check Backend Logs**
```bash
# View payment controller logs
tail -f /path/to/server.log | grep "\[Payment\]"
```

**Step 2: Check Razorpay Key Mode**
```bash
# In backend/.env, verify key prefix:
RAZORPAY_KEY_ID=rzp_live_... (PRODUCTION)
# OR
RAZORPAY_KEY_ID=rzp_test_... (TESTING)
```
- **Live keys** only work with activated merchant account
- **Test keys** work immediately (use with test card 4111111111111111)

**Step 3: Verify CORS**
From APK, test the backend:
```bash
# Replace {BACKEND_URL} with your server URL
curl -X OPTIONS {BACKEND_URL}/api/payment/create-order \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v
```
Look for `Access-Control-Allow-Origin` in response headers.

**Step 4: Check Payment Order Creation**
```bash
# Post request to create order
curl -X POST {BACKEND_URL}/api/payment/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{"movieId": "YOUR_MOVIE_ID"}' \
  -v
```
Expected response:
```json
{
  "success": true,
  "data": {
    "orderId": "order_xxxxxxxxxxx",
    "keyId": "rzp_test_...",
    "amount": 4900,
    "currency": "INR"
  }
}
```

---

## 🛠️ Common Payment Errors & Solutions

| Error | Root Cause | Solution |
|-------|-----------|----------|
| "Invalid payment signature" | Signature mismatch in verification | Ensure `RAZORPAY_KEY_SECRET` matches Razorpay dashboard |
| "Merchant issue" | Using live keys without activated account | Switch to test keys (`rzp_test_...`) |
| "Order not found" | User ID mismatch or order expired | Ensure correct user token sent with request |
| "Duplicate payment detected" | Payment already processed | Check database for existing purchase record |
| CORS error in APK | Backend rejecting origin | Check CORS whitelist in `app.js` |

---

## ✅ Razorpay Test Mode Setup

### Test Credentials
```
Key ID:     rzp_test_xxxxxxxxxxx
Key Secret: rzp_test_yyyyyyyyyyyy
```

### Test Payment Cards
| Card | CVV | Exp | Status |
|------|-----|-----|--------|
| 4111 1111 1111 1111 | 123 | 12/25 | ✅ Success |
| 4444 3333 2222 1111 | 123 | 12/25 | ❌ Decline |
| 4242 4242 4242 4242 | 123 | 12/25 | ✅ Success |

### Test via Razorpay Dashboard
1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Switch to **Test Mode** (toggle in top-right)
3. Copy test keys and paste into `.env`
4. Restart backend
5. Test payment flow from APK

---

## 📡 Backend API Endpoints

### 1. Create Payment Order
```
POST /api/payment/create-order
Authorization: Bearer {token}
Content-Type: application/json

{
  "movieId": "63f7d8e2c1a2b3c4d5e6f7a8"
}

Response:
{
  "success": true,
  "data": {
    "orderId": "order_1234567890",
    "keyId": "rzp_test_...",
    "amount": 4900,
    "currency": "INR"
  }
}
```

### 2. Verify Payment
```
POST /api/payment/verify
Authorization: Bearer {token}
Content-Type: application/json

{
  "razorpay_order_id": "order_1234567890",
  "razorpay_payment_id": "pay_1234567890",
  "razorpay_signature": "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a"
}

Response:
{
  "success": true,
  "data": {
    "purchaseId": "63f7d8e2c1a2b3c4d5e6f7a9",
    "accessExpiresAt": "2026-03-20T10:30:00Z",
    "watchLink": "/api/user/watch/63f7d8e2c1a2b3c4d5e6f7a8"
  }
}
```

### 3. Check Order Status (NEW)
```
GET /api/payment/order/{orderId}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "status": "pending" | "paid" | "failed",
    "paymentId": "pay_123...",
    "amount": 49.00,
    "paidAt": "2026-02-18T...",
    "accessExpiresAt": "2026-03-20T..."
  }
}
```

---

## 🚀 Deployment Checklist

- [ ] Backend running with latest code (includes CORS fix)
- [ ] `.env` has correct Razorpay keys (test or live)
- [ ] APK points to correct backend URL
- [ ] New endpoint `/api/payment/order/:orderId` is accessible
- [ ] Payment verification returns correct movieId format (string, not ObjectId)
- [ ] Database Purchase model has all fields (no schema conflicts)
- [ ] Test payment flow end-to-end
- [ ] Monitor server logs for `[Payment]` errors during testing

---

## 📞 Support

For persistent payment issues:
1. Check backend logs: `[Payment]` tagged errors
2. Verify Razorpay dashboard for payment status
3. Confirm `.env` credentials match dashboard
4. Test with test mode keys first
5. Verify APK backend URL and authentication token

