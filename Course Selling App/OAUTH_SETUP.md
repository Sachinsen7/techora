# OAuth & Payment Gateway Setup Guide

## 🔐 Google OAuth Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API and Google OAuth2 API

### 2. Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in required information:
   - App name: Your Course Selling App
   - User support email: your-email@domain.com
   - Developer contact information: your-email@domain.com

### 3. Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `https://techora-1.onrender.com/api/auth/google/callback` (development)
   - `https://yourdomain.com/api/auth/google/callback` (production)
5. Copy Client ID and Client Secret

### 4. Update Environment Variables

Add to your `.env` file:

```env
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_CALLBACK_URL=https://techora-1.onrender.com/api/auth/google/callback
```

## 💳 PhonePe Payment Gateway Setup

### 1. Register with PhonePe

1. Visit [PhonePe Business](https://business.phonepe.com/)
2. Register as a merchant
3. Complete KYC verification
4. Get merchant credentials

### 2. Get API Credentials

After approval, you'll receive:

- Merchant ID
- Salt Key
- Salt Index

### 3. Update Environment Variables

Add to your `.env` file:

```env
PHONEPE_MERCHANT_ID=your-merchant-id
PHONEPE_SALT_KEY=your-salt-key
PHONEPE_SALT_INDEX=1
PHONEPE_BASE_URL=https://api-preprod.phonepe.com/apis/pg-sandbox
PHONEPE_REDIRECT_URL=https://techora-1.onrender.com/api/payment/phonepe/callback
PHONEPE_WEBHOOK_URL=https://techora-1.onrender.com/api/payment/phonepe/webhook
```

### 4. Test Environment

For testing, use PhonePe's sandbox environment:

- Base URL: `https://api-preprod.phonepe.com/apis/pg-sandbox`
- Use test credentials provided by PhonePe

## 🚀 Frontend Integration

### 1. Add Google OAuth Button

```jsx
import GoogleOAuthButton from "../components/auth/GoogleOAuthButton";

// In your login component
<GoogleOAuthButton text="Sign in with Google" />;
```

### 2. Add Route for OAuth Success

```jsx
// In your App.jsx or router setup
import AuthSuccess from "../pages/AuthSuccess";

<Route path="/auth/success" element={<AuthSuccess />} />;
```

### 3. Environment Variables for Frontend

Add to your frontend `.env` file:

```env
VITE_API_BASE_URL=https://techora-1.onrender.com
```

## 🔧 Testing

### Test Google OAuth

1. Start your backend server
2. Navigate to login page
3. Click "Continue with Google"
4. Complete OAuth flow
5. Check if user is created in database

### Test PhonePe Payment

1. Create a course with a price > 0
2. Try to purchase the course
3. Use PhonePe test credentials
4. Verify payment status updates

## 🛡️ Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **HTTPS**: Use HTTPS in production
3. **CORS**: Configure CORS properly for your domain
4. **JWT Secret**: Use a strong, random JWT secret
5. **Session Secret**: Use a strong session secret

## 📝 Database Changes

The following fields have been added to support OAuth and payments:

### User Model

- `googleId`: Google OAuth ID
- `isEmailVerified`: Email verification status

### Purchase Model

- `paymentStatus`: PENDING, COMPLETED, FAILED, CANCELLED
- `paymentMethod`: PHONEPE, MOCK, FREE
- `paymentResponse`: Payment gateway response data

## 🔄 Migration

If you have existing users, run this MongoDB command to add default values:

```javascript
db.users.updateMany(
  { isEmailVerified: { $exists: false } },
  { $set: { isEmailVerified: false } }
);

db.purchases.updateMany(
  { paymentStatus: { $exists: false } },
  { $set: { paymentStatus: "COMPLETED", paymentMethod: "MOCK" } }
);
```

## 📞 Support

For issues:

- Google OAuth: Check Google Cloud Console logs
- PhonePe: Contact PhonePe merchant support
- General: Check server logs and network requests
