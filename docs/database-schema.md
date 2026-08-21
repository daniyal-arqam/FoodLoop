# Database schema

MongoDB database `foodloop`. Collections are owned by the service that writes them. Food-service also **reads** `organizations` for claim verification (same documents, `strict: false`).

## User (`auth-service`)

- `_id` ObjectId
- `name` string
- `email` string unique, lowercased
- `passwordHash` string (bcrypt, never returned in JSON)
- `role` enum: Provider, Organization, Admin
- `isActive` boolean
- `createdAt`, `updatedAt`

## Organization (`organization-service`)

- `_id` ObjectId
- `userId` ObjectId → User
- `organizationName` string
- `description` string
- `address` string
- `location.latitude`, `location.longitude` + GeoJSON coordinates
- `foodCategoriesNeeded` string[] (Prepared, Bakery, Produce, …)
- `requiredQuantity` number
- `verified` boolean (Admin only)
- `createdAt`, `updatedAt`

## FoodListing (`food-service`)

- `_id` ObjectId
- `providerId` ObjectId → User
- `foodName`, `category`, `quantity`, `unit`, `description`
- `pickupLocation.address`, `latitude`, `longitude` + GeoJSON
- `availableFrom`, `availableUntil`, `expiryDate`
- `status` enum: Available, Reserved, Collected, Expired
- `reservedBy` ObjectId → Organization (when Reserved/Collected)
- `claimedQuantity`, `claimedAt`, `collectedAt`
- `createdAt`, `updatedAt`

## Claim (`food-service`)

- `_id` ObjectId
- `listingId` ObjectId → FoodListing
- `organizationId` ObjectId → Organization
- `quantity` number
- `status` enum: Reserved, Collected
- `collectedAt` (required when Collected)
- `createdAt`, `updatedAt`

## Relationships

```
User 1 ──< Organization (role Organization, one profile)
User 1 ──< FoodListing (role Provider)
FoodListing 1 ──< Claim
Organization 1 ──< Claim
```
