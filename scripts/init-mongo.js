// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

db = db.getSiblingDB('lending_platform');

// Create collections
db.createCollection('offers');
db.createCollection('comments');
db.createCollection('loans');
db.createCollection('requests');

// Create indexes for better performance
db.offers.createIndex({ "lender_address": 1 });
db.offers.createIndex({ "is_active": 1 });
db.offers.createIndex({ "created_at": -1 });

db.comments.createIndex({ "offer_id": 1 });
db.comments.createIndex({ "request_id": 1 });
db.comments.createIndex({ "created_at": -1 });

db.loans.createIndex({ "lender_address": 1 });
db.loans.createIndex({ "borrower_address": 1 });
db.loans.createIndex({ "is_active": 1 });

db.requests.createIndex({ "borrower_address": 1 });
db.requests.createIndex({ "is_active": 1 });
db.requests.createIndex({ "created_at": -1 });

print('Database initialized with collections and indexes');