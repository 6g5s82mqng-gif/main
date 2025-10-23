# Admin API Documentation

## Authentication

All admin API endpoints require the following header:
```
uwu: Admin
```

Without this header, all requests will return a 401 Unauthorized response.

---

## User Management APIs

### 1. Get All Users (with pagination and filtering)
**Endpoint:** `GET /api/admin/users`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term for username, bank fullname, or phone
- `status` (optional): Filter by status ("active", "inactive", "all")
- `sortBy` (optional): Sort field (default: "createdAt")
- `sortOrder` (optional): Sort order ("asc", "desc" - default: "desc")

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "userId": 1234,
        "username": "john_doe",
        "phone": "0812345678",
        "available_balance": 5000.00,
        "profit_loss": 1200.50,
        "bank": {
          "bank_name": "Kasikorn Bank",
          "number": "1234567890",
          "fullname": "John Doe",
          "withdrawNumber": "123456"
        },
        "cardphoto": "https://files.catbox.moe/example.jpg",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 50,
      "limit": 10
    }
  }
}
```

### 2. Create New User
**Endpoint:** `POST /api/admin/users`

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "password123",
  "phone": "0812345678",
  "available_balance": 0,
  "profit_loss": 0,
  "bank": {
    "bank_name": "Kasikorn Bank",
    "number": "1234567890",
    "fullname": "John Doe",
    "withdrawNumber": "123456"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "userId": 1234,
    "username": "john_doe",
    "phone": "0812345678",
    "available_balance": 0,
    "profit_loss": 0,
    "bank": { ... },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. Bulk Update Users
**Endpoint:** `PUT /api/admin/users`

**Request Body:**
```json
{
  "userId": 1234,
  "updates": {
    "username": "new_username",
    "phone": "0898765432",
    "available_balance": 10000.00,
    "bank": {
      "bank_name": "Bangkok Bank",
      "number": "9876543210",
      "fullname": "John Smith",
      "withdrawNumber": "654321"
    }
  }
}
```

### 4. Delete User
**Endpoint:** `DELETE /api/admin/users?userId=1234`

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": {
    "userId": 1234,
    "username": "john_doe",
    ...
  }
}
```

### 5. Get Single User
**Endpoint:** `GET /api/admin/users/1234`

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": 1234,
    "username": "john_doe",
    "phone": "0812345678",
    "available_balance": 5000.00,
    "profit_loss": 1200.50,
    "bank": { ... },
    "cardphoto": "https://files.catbox.moe/example.jpg",
    "stats": {
      "totalInvested": 15000.00,
      "activeInvestments": 2,
      "completedInvestments": 5,
      "totalProfit": 1200.50,
      "totalInvestments": 7
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 6. Update Single User
**Endpoint:** `PUT /api/admin/users/1234`

**Request Body:**
```json
{
  "username": "updated_username",
  "password": "newpassword123",
  "withdrawPassword": "withdraw123",
  "phone": "0898765432",
  "available_balance": 15000.00,
  "profit_loss": 2500.00,
  "bank": { ... },
  "cardphoto": "https://files.catbox.moe/newimage.jpg"
}
```

### 7. Delete Single User
**Endpoint:** `DELETE /api/admin/users/1234`

**Note:** This will also delete all associated investment records.

---

## Investment Management APIs

### 1. Get All Investment Plans
**Endpoint:** `GET /api/admin/investment-plans`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `userId` (optional): Filter by user ID
- `status` (optional): Filter by status ("active", "completed", "cancelled", "all")
- `sortBy` (optional): Sort field (default: "createdAt")
- `sortOrder` (optional): Sort order ("asc", "desc" - default: "desc")

**Response:**
```json
{
  "success": true,
  "data": {
    "investments": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "userId": 1234,
        "amount": 5000.00,
        "duration": 30,
        "rewardPercentage": 4.5,
        "status": "active",
        "autoResubmit": false,
        "startDate": "2024-01-01T00:00:00.000Z",
        "endDate": "2024-01-31T00:00:00.000Z",
        "profit": 225.00,
        "estimatedIncome": 225.00,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalInvestments": 25,
      "limit": 10
    }
  }
}
```

### 2. Create Investment Plan
**Endpoint:** `POST /api/admin/investment-plans`

**Request Body:**
```json
{
  "userId": 1234,
  "amount": 5000.00,
  "duration": 30,
  "rewardPercentage": 4.5,
  "autoResubmit": false
}
```

**Valid Durations:** 1, 7, 15, 30, 60, 90 (days)

### 3. Bulk Update Investment Plans
**Endpoint:** `PUT /api/admin/investment-plans`

**Request Body:**
```json
{
  "investmentId": "507f1f77bcf86cd799439011",
  "updates": {
    "status": "completed",
    "autoResubmit": true,
    "amount": 6000.00
  }
}
```

### 4. Delete Investment Plan
**Endpoint:** `DELETE /api/admin/investment-plans?investmentId=507f1f77bcf86cd799439011`

**Note:** If the investment is active, the amount will be refunded to the user's balance.

### 5. Get Single Investment Plan
**Endpoint:** `GET /api/admin/investment-plans/507f1f77bcf86cd799439011`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": 1234,
    "amount": 5000.00,
    "duration": 30,
    "rewardPercentage": 4.5,
    "status": "active",
    "autoResubmit": false,
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-31T00:00:00.000Z",
    "profit": 225.00,
    "estimatedIncome": 225.00,
    "user": {
      "userId": 1234,
      "username": "john_doe",
      "phone": "0812345678",
      "bank": { ... }
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 6. Update Single Investment Plan
**Endpoint:** `PUT /api/admin/investment-plans/507f1f77bcf86cd799439011`

**Request Body:**
```json
{
  "status": "completed",
  "autoResubmit": true,
  "amount": 6000.00,
  "duration": 60,
  "rewardPercentage": 10.0,
  "profit": 600.00,
  "estimatedIncome": 600.00
}
```

### 7. Delete Single Investment Plan
**Endpoint:** `DELETE /api/admin/investment-plans/507f1f77bcf86cd799439011`

---

## Dashboard API

### Get Dashboard Statistics
**Endpoint:** `GET /api/admin/dashboard`

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 150,
      "active": 85,
      "withBank": 120,
      "totalBalance": 2500000.00,
      "totalProfit": 450000.00
    },
    "investments": {
      "total": 500,
      "active": 150,
      "completed": 320,
      "cancelled": 30,
      "totalInvested": 15000000.00,
      "totalEstimatedIncome": 2250000.00
    },
    "recentActivity": {
      "users": [
        {
          "userId": 1234,
          "username": "john_doe",
          "phone": "0812345678",
          "createdAt": "2024-01-01T00:00:00.000Z"
        }
      ],
      "investments": [
        {
          "_id": "507f1f77bcf86cd799439011",
          "userId": 1234,
          "amount": 5000.00,
          "status": "active",
          "createdAt": "2024-01-01T00:00:00.000Z",
          "userId": {
            "username": "john_doe"
          }
        }
      ]
    },
    "analytics": {
      "investmentsByDuration": [
        { "_id": 1, "count": 50, "totalAmount": 250000.00 },
        { "_id": 7, "count": 80, "totalAmount": 800000.00 },
        { "_id": 15, "count": 60, "totalAmount": 900000.00 },
        { "_id": 30, "count": 120, "totalAmount": 2400000.00 },
        { "_id": 60, "count": 100, "totalAmount": 3000000.00 },
        { "_id": 90, "count": 90, "totalAmount": 3150000.00 }
      ],
      "monthlyStats": [
        { "_id": "2024-01", "investments": 45, "totalAmount": 1350000.00 },
        { "_id": "2024-02", "investments": 52, "totalAmount": 1560000.00 }
      ],
      "monthlyUserStats": [
        { "_id": "2024-01", "users": 25 },
        { "_id": "2024-02", "users": 30 }
      ]
    }
  }
}
```

---

## Bulk Operations API

### Perform Bulk Operations
**Endpoint:** `POST /api/admin/bulk`

**Request Body Examples:**

#### Bulk Create Users:
```json
{
  "operation": "create",
  "type": "users",
  "data": [
    {
      "username": "user1",
      "password": "password123",
      "phone": "0812345678",
      "available_balance": 1000.00
    },
    {
      "username": "user2",
      "password": "password456",
      "phone": "0823456789",
      "available_balance": 2000.00
    }
  ]
}
```

#### Bulk Update Users:
```json
{
  "operation": "update",
  "type": "users",
  "data": [
    {
      "userId": 1234,
      "available_balance": 5000.00,
      "profit_loss": 1200.00
    },
    {
      "userId": 1235,
      "phone": "0898765432"
    }
  ]
}
```

#### Bulk Update User Balance:
```json
{
  "operation": "updateBalance",
  "type": "users",
  "data": [
    {
      "userId": 1234,
      "available_balance": 10000.00,
      "profit_loss": 2500.00
    }
  ]
}
```

#### Bulk Delete Users:
```json
{
  "operation": "delete",
  "type": "users",
  "data": [1234, 1235, 1236]
}
```

#### Bulk Create Investments:
```json
{
  "operation": "create",
  "type": "investments",
  "data": [
    {
      "userId": 1234,
      "amount": 5000.00,
      "duration": 30,
      "rewardPercentage": 4.5,
      "autoResubmit": false
    }
  ]
}
```

#### Bulk Update Investment Status:
```json
{
  "operation": "updateStatus",
  "type": "investments",
  "data": [
    {
      "investmentId": "507f1f77bcf86cd799439011",
      "status": "completed"
    }
  ]
}
```

**Response Format:**
```json
{
  "success": true,
  "message": "Bulk operation completed. Success: 5, Failed: 0",
  "data": {
    "success": [ ... ],
    "failed": [ ... ]
  }
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP Status Codes:
- `400`: Bad Request (validation errors, missing required fields)
- `401`: Unauthorized (missing or invalid admin header)
- `404`: Not Found (user/investment not found)
- `409`: Conflict (duplicate username, etc.)
- `500`: Internal Server Error (database errors, etc.)

---

## Notes

1. **Password Security**: All passwords are automatically hashed using bcrypt before storage.
2. **User ID Auto-increment**: User IDs are automatically assigned incrementally.
3. **Investment Completion**: When marking investments as "completed", the principal + profit is automatically returned to the user's balance.
4. **Data Validation**: All endpoints include comprehensive validation for data types and business rules.
5. **Cascade Deletion**: Deleting a user also deletes all their associated investment records.
6. **Balance Management**: Active investment refunds are automatically processed when investments are deleted.
7. **Search Functionality**: User search covers username, bank fullname, and phone number fields.
8. **Sorting**: Most list endpoints support sorting by multiple fields with ascending/descending order.
9. **Pagination**: All list endpoints support pagination for efficient data retrieval.
10. **Bulk Operations**: Support for efficient bulk operations on both users and investments with detailed success/failure reporting.