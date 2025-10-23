# Investment Plans API Documentation

This document describes the full CRUD API for managing investment plan templates in the BNP application.

## Overview

The investment plans system has been migrated from static data to a MongoDB-based system with full admin CRUD functionality. The system automatically seeds default investment plans when the database is empty.

## Investment Plan Model

```typescript
{
  duration: number;           // in days: 1, 7, 15, 30, 60, 90
  label: string;             // e.g., "1D", "7D", "15D", "30D", "60D", "90D"
  rewardPercentage: number;  // reward percentage for the duration
  minAmount: number;         // minimum investment amount
  maxAmount: number;         // maximum investment amount
  createdAt: Date;
  updatedAt: Date;
}
```

## Public API Endpoints

### GET `/api/investment/plans`

Fetches all investment plans for users.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "duration": 1,
      "label": "1D",
      "rewardPercentage": 0.1,
      "minAmount": 1,
      "maxAmount": 10000,
      "createdAt": "2023-07-01T00:00:00.000Z",
      "updatedAt": "2023-07-01T00:00:00.000Z"
    }
  ]
}
```

## Admin API Endpoints

All admin endpoints require authentication via the `adminAuthMiddleware`.

### GET `/api/admin/investment-plans-templates`

Fetches all investment plan templates.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "duration": 1,
      "label": "1D",
      "rewardPercentage": 0.1,
      "minAmount": 1,
      "maxAmount": 10000,
      "createdAt": "2023-07-01T00:00:00.000Z",
      "updatedAt": "2023-07-01T00:00:00.000Z"
    }
  ]
}
```

### POST `/api/admin/investment-plans-templates`

Creates a new investment plan template.

**Request Body:**
```json
{
  "duration": 30,
  "label": "30D",
  "rewardPercentage": 4.5,
  "minAmount": 1,
  "maxAmount": 200000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Investment plan template created successfully",
  "data": { ...createdPlan }
}
```

### GET `/api/admin/investment-plans-templates/[planId]`

Fetches a single investment plan template by ID.

**Response:**
```json
{
  "success": true,
  "data": { ...plan }
}
```

### PUT `/api/admin/investment-plans-templates/[planId]`

Updates a single investment plan template.

**Request Body:**
```json
{
  "label": "30D Updated",
  "rewardPercentage": 5.0,
  "minAmount": 50,
  "maxAmount": 300000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Investment plan template updated successfully",
  "data": { ...updatedPlan }
}
```

### DELETE `/api/admin/investment-plans-templates/[planId]`

Deletes a single investment plan template.

**Response:**
```json
{
  "success": true,
  "message": "Investment plan template deleted successfully",
  "data": { ...deletedPlan }
}
```

### POST `/api/admin/investment-plans-templates/seed`

Seeds or resets the default investment plans.

**Request Body:**
```json
{
  "action": "seed"  // or "reset"
}
```

**Actions:**
- `seed`: Adds default plans if they don't exist
- `reset`: Clears all existing plans and reinserts defaults

**Default Plans:**
- 1D - 0.1% reward (1 - 10,000 THB)
- 7D - 1% reward (1 - 50,000 THB)
- 15D - 2.5% reward (1 - 100,000 THB)
- 30D - 4.5% reward (1 - 200,000 THB)
- 60D - 10% reward (1 - 500,000 THB)
- 90D - 19.5% reward (1 - 1,000,000 THB)

## Validation Rules
**Validation Rules:**

- `duration`: Must be one of [1, 7, 15, 30, 60, 90]
- `rewardPercentage`: Must be between 0 and 100
- `minAmount`: Must be >= 0
- `maxAmount`: Must be >= 0
- `minAmount`: Cannot be greater than `maxAmount`
- `duration`: Must be unique across all plans

## Investment Creation Validation

When users create investments through `/api/investment/create`, the system now validates:

1. **Duration exists**: The investment plan must exist in the database
2. **Amount limits**: The investment amount must be between `minAmount` and `maxAmount` for the selected plan
3. **Dynamic rewards**: The reward percentage is fetched from the database plan, not hardcoded

**Example Error Messages:**
- `"ไม่พบแผนการลงทุนสำหรับระยะเวลาที่เลือก"` (Investment plan not found)
- `"จำนวนเงินลงทุนขั้นต่ำคือ 50 THB"` (Minimum investment amount is 50 THB)
- `"จำนวนเงินลงทุนสูงสุดคือ 200000 THB"` (Maximum investment amount is 200,000 THB)

## Auto-Seeding

The public API endpoint (`/api/investment/plans`) automatically seeds the default investment plans if the database is empty. This ensures the system works out of the box without manual intervention.

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request (validation errors)
- 401: Unauthorized
- 404: Not Found
- 409: Conflict (duplicate duration)
- 500: Internal Server Error