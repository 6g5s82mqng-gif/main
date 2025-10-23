# BNP Authentication System

This document describes the authentication system implemented for the BNP website.

## Overview

The authentication system provides:
- User registration and login functionality
- Token-based authentication using JWT
- MongoDB database integration with Mongoose
- Alert notifications for server messages
- Persistent authentication state using localStorage

## Features

### Authentication Methods
- **Login**: Users can login with username/phone and password
- **Register**: New users can create an account with username, password, and password confirmation
- **Logout**: Users can securely logout and clear authentication state

### Token Format
The system returns tokens in the format:
```json
{
    "access_token": "23089|HZStZbs4AeXvNUdDvrqHqnAI5R1XVFksrMY9ybCv76ab75a1",
    "token_type": "Bearer"
}
```

### Security Notes
- **No Password Hashing**: As requested, passwords are stored in plain text (NOT recommended for production)
- **JWT Tokens**: Tokens expire after 24 hours
- **Token Storage**: Tokens are stored in localStorage for persistence

## API Endpoints

### Register
- **URL**: `POST /api/auth/register`
- **Body**: 
  ```json
  {
    "username": "string",
    "password": "string",
    "confirmPassword": "string"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "ลงทะเบียนสำเร็จ",
    "data": {
      "access_token": "string",
      "token_type": "Bearer",
      "user": {
        "id": "string",
        "username": "string",
        "phone": "string"
      }
    }
  }
  ```

### Login
- **URL**: `POST /api/auth/login`
- **Body**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "เข้าสู่ระบบสำเร็จ",
    "data": {
      "access_token": "string",
      "token_type": "Bearer",
      "user": {
        "id": "string",
        "username": "string",
        "phone": "string"
      }
    }
  }
  ```

## Setup Instructions

### 1. Environment Configuration
Create a `.env` file in the project root:
```
MONGODB_URI=mongodb://localhost:27017/bnp-app
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

### 2. Database Setup
- Ensure MongoDB is running on your system
- The application will automatically create the `bnp-app` database
- A `users` collection will be created automatically

### 3. Dependencies
The system uses the following additional packages:
- `mongoose` - MongoDB object modeling
- `jsonwebtoken` - JWT token generation and verification
- `@types/jsonwebtoken` - TypeScript types for JWT

### 4. Running the Application
```bash
bun install
bun run dev
```

## Usage

### Registration Flow
1. Navigate to `/register`
2. Fill in username/phone and password
3. Confirm password
4. Click "ลงทะเบียนตอนนี้"
5. On success, user is redirected to `/my` and logged in automatically

### Login Flow
1. Navigate to `/login`
2. Enter username/phone and password
3. Click "เข้าสู่ระบบตอนนี้"
4. On success, user is redirected to `/my`

### My Account Page
- Shows user information when authenticated
- Displays user ID (last 8 characters)
- Shows account balance and profit/loss (currently hardcoded to 0)
- Includes logout functionality
- Shows login/register options when not authenticated

## Alert System

The application includes a comprehensive alert notification system:
- **Success**: Green alerts for successful operations
- **Error**: Red alerts for errors and validation failures
- **Warning**: Yellow alerts for warnings
- **Info**: Blue alerts for general information

Alerts automatically disappear after 3 seconds but can be manually dismissed.

## File Structure

```
src/
├── lib/
│   ├── database/
│   │   └── connection.ts     # MongoDB connection
│   ├── models/
│   │   └── User.ts          # User model schema
│   ├── stores/
│   │   ├── auth.ts          # Authentication state management
│   │   └── alert.ts         # Alert notification system
│   ├── utils/
│   │   └── jwt.ts           # JWT token utilities
│   └── components/
│       └── Alert.svelte     # Alert notification component
└── routes/
    ├── api/
    │   └── auth/
    │       ├── login/+server.ts      # Login API endpoint
    │       └── register/+server.ts   # Registration API endpoint
    ├── login/+page.svelte      # Login page
    ├── register/+page.svelte   # Registration page
    ├── my/+page.svelte         # My account page
    └── +layout.svelte          # Main layout with alerts
```

## Error Handling

The system includes comprehensive error handling:
- Form validation on both client and server side
- Database connection error handling
- API error responses with Thai language messages
- User-friendly error notifications via alert system

## Future Enhancements

For production use, consider:
1. **Password Hashing**: Implement bcrypt or similar for password security
2. **Email Verification**: Add email verification for new accounts
3. **Password Reset**: Implement forgot password functionality
4. **Rate Limiting**: Add rate limiting to prevent brute force attacks
5. **Input Sanitization**: Add input sanitization and validation
6. **HTTPS**: Ensure HTTPS is used in production
7. **Environment Variables**: Use proper environment variable management
8. **Database Security**: Implement proper database security measures