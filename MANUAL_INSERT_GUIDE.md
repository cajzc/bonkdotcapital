# Manual Database Insert Guide

This guide shows you how to manually insert loan offers into MongoDB that will immediately appear in the frontend.

## Quick Setup

1. **Start MongoDB** (if not already running):
   ```bash
   mongod
   ```

2. **Populate initial test data**:
   ```bash
   cd backend
   npm install mongodb  # Install MongoDB driver for the script
   node scripts/populate_test_data.js
   ```

3. **Start the backend server**:
   ```bash
   cd backend
   go run cmd/main.go
   ```

4. **Start the frontend**:
   ```bash
   cd frontend
   npm start
   ```

## Manual Insert Examples

### Using MongoDB Shell

Connect to MongoDB and insert offers:

```javascript
// Connect to the database
use lending_platform

// Insert a single loan offer
db.offers.insertOne({
  offer_address: "manual_offer_" + new Date().getTime(),
  lender_address: "YourWalletAddressHere123456789012345678901234", 
  amount: 80000000,  // 80M BONK
  apy: 13.5,         // 13.5% APY
  token: "SOL",      // Collateral token
  duration: 35,      // 35 days
  is_active: true,
  created_at: new Date()
})

// Insert multiple offers at once
db.offers.insertMany([
  {
    offer_address: "manual_batch_1_" + new Date().getTime(),
    lender_address: "AnotherWalletAddress123456789012345678901234",
    amount: 120000000,
    apy: 11.8,
    token: "USDC",
    duration: 28,
    is_active: true,
    created_at: new Date()
  },
  {
    offer_address: "manual_batch_2_" + new Date().getTime(),
    lender_address: "ThirdWalletAddress123456789012345678901234567",
    amount: 45000000,
    apy: 16.2,
    token: "JUP",
    duration: 7,
    is_active: true,
    created_at: new Date()
  }
])
```

### Field Descriptions

- **offer_address**: Unique identifier for the offer (use timestamp for uniqueness)
- **lender_address**: Solana wallet address of the lender (44 characters)
- **amount**: Loan amount in BONK tokens (number, not string)
- **apy**: Annual Percentage Yield as a decimal (e.g., 12.5 for 12.5%)
- **token**: Collateral token type (SOL, USDC, JUP, mSOL, etc.)
- **duration**: Loan duration in days (number)
- **is_active**: Whether the offer is active (true/false)
- **created_at**: Timestamp when offer was created

## Testing Real-time Updates

1. **Open the frontend** in your browser
2. **Navigate to the Feed tab** - you should see your manually inserted offers
3. **Navigate to the Stats tab** - statistics should reflect your data
4. **Add more offers** using the MongoDB shell
5. **Refresh the frontend** (pull down in the Feed) to see new offers immediately

## Example Test Scenario

1. Insert an offer with high APY:
   ```javascript
   db.offers.insertOne({
     offer_address: "high_apy_offer_" + new Date().getTime(),
     lender_address: "HighAPYLender123456789012345678901234567890",
     amount: 150000000,
     apy: 20.0,
     token: "SOL",
     duration: 7,
     is_active: true,
     created_at: new Date()
   })
   ```

2. Check the frontend - it should appear in the feed immediately
3. Check the stats page - the average APY should update

## Viewing Your Data

### In MongoDB Shell:
```javascript
// View all offers
db.offers.find().pretty()

// View only active offers
db.offers.find({is_active: true}).pretty()

// Count offers
db.offers.countDocuments()

// View platform statistics (what the API calculates)
db.offers.aggregate([
  {$match: {is_active: true}},
  {$group: {
    _id: null,
    total_volume: {$sum: "$amount"},
    average_apy: {$avg: "$apy"},
    count: {$sum: 1}
  }}
])
```

### In the Frontend:
- **Feed Tab**: See all offers as cards with lender info, amounts, APY, duration
- **Stats Tab**: See aggregated statistics including total volume, average APY, active loans count
- **Pull to refresh**: Updates data from the database in real-time

## Expected Frontend Behavior

✅ **What should work:**
- New offers appear immediately in the feed when you insert them
- Statistics update when you refresh the stats page  
- Search functionality works on lender addresses and token types
- Active/inactive offers display correctly
- Pull-to-refresh updates the data

✅ **Data formatting:**
- Large numbers show as "80M", "1.2B", etc.
- APY shows with 1 decimal place: "12.5%"
- Addresses are shortened: "9WzD...AWWM"
- Duration shows as "35 days", "7 days", etc.

## Troubleshooting

### Data not showing in frontend:
1. Check backend server is running on port 8080
2. Verify database name is "lending_platform" (same as main.go)
3. Test API directly: `curl http://localhost:8080/api/v1/offers`
4. Check browser console for errors

### Database connection issues:
1. Ensure MongoDB is running: `mongod`
2. Check connection: `mongosh`
3. Verify database exists: `show dbs`

This setup gives you complete control to test the frontend-backend integration by manually creating and modifying data that immediately reflects in the UI!