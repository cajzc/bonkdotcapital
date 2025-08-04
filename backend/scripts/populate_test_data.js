// Script to populate MongoDB with test data for development
// Run with: node scripts/populate_test_data.js

const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'lending_platform';  // Match the database name in main.go

const testOffers = [
  {
    offer_address: 'offer_test_1_' + Date.now(),
    lender_address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    amount: 50000000,
    apy: 12.5,
    token: 'SOL',
    duration: 30,
    is_active: true,
    created_at: new Date()
  },
  {
    offer_address: 'offer_test_2_' + Date.now(),
    lender_address: 'Cv6TfqTLNBg3HhCFXKPa5gWQ7Pje5LsKwSpH3QKQdQKn',
    amount: 75000000,
    apy: 15.2,
    token: 'USDC',
    duration: 60,
    is_active: true,
    created_at: new Date()
  },
  {
    offer_address: 'offer_test_3_' + Date.now(),
    lender_address: 'FqGWNQUfFNhq1H5aoxMLfmU5BzXSJvN1EZZXXXf4DJHy',
    amount: 25000000,
    apy: 10.8,
    token: 'JUP',
    duration: 14,
    is_active: true,
    created_at: new Date()
  },
  {
    offer_address: 'offer_test_4_' + Date.now(),
    lender_address: 'H8c4BPyQZk9qH1RsRMZGT3FJqTGp4L3RvXXKnJRyP5Nx',
    amount: 100000000,
    apy: 8.9,
    token: 'SOL',
    duration: 90,
    is_active: true,
    created_at: new Date()
  },
  {
    offer_address: 'offer_test_5_' + Date.now(),
    lender_address: 'DRiP2Pn2K6fuMLKQmt5rZWxa4eUkbvnDv7hk6v4n5EQW',
    amount: 30000000,
    apy: 14.7,
    token: 'USDC',
    duration: 45,
    is_active: false, // One inactive for testing
    created_at: new Date()
  },
  {
    offer_address: 'offer_test_6_' + Date.now(),
    lender_address: 'BonkCapitalLenderAddress123456789012345678901',
    amount: 200000000,
    apy: 11.3,
    token: 'mSOL',
    duration: 21,
    is_active: true,
    created_at: new Date()
  }
];

const testLoans = [
  {
    loan_address: 'loan_test_1_' + Date.now(),
    lender_address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    borrower_address: 'BxKWBpF6TXHs8xGq8qYKV7vZz9YaTmmRJGF8vx5UExVa',
    amount: 25000000,
    apy: 12.5,
    token: 'BONK',
    collateral_token: 'SOL',
    collateral_amount: 125,
    duration: 30,
    start_date: new Date(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    is_active: true,
    created_at: new Date()
  },
  {
    loan_address: 'loan_test_2_' + Date.now(),
    lender_address: 'Cv6TfqTLNBg3HhCFXKPa5gWQ7Pje5LsKwSpH3QKQdQKn',
    borrower_address: 'CzKWBpF6TXHs8xGq8qYKV7vZz9YaTmmRJGF8vx5UExVb',
    amount: 40000000,
    apy: 15.2,
    token: 'BONK',
    collateral_token: 'USDC',
    collateral_amount: 2000,
    duration: 60,
    start_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    end_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    is_active: true,
    created_at: new Date()
  }
];

const testRequests = [
  {
    request_address: 'request_test_1_' + Date.now(),
    borrower_address: 'BxKWBpF6TXHs8xGq8qYKV7vZz9YaTmmRJGF8vx5UExVa',
    amount: 35000000,
    max_apy: 13.0,
    token: 'BONK',
    collateral_token: 'SOL',
    collateral_amount: 175,
    duration: 30,
    is_active: true,
    created_at: new Date()
  },
  {
    request_address: 'request_test_2_' + Date.now(),
    borrower_address: 'CzKWBpF6TXHs8xGq8qYKV7vZz9YaTmmRJGF8vx5UExVb',
    amount: 60000000,
    max_apy: 16.0,
    token: 'BONK',
    collateral_token: 'USDC',
    collateral_amount: 3000,
    duration: 60,
    is_active: true,
    created_at: new Date()
  }
];

async function populateDatabase() {
  console.log('🚀 Starting database population...');
  
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Clear existing test data
    console.log('🧹 Clearing existing test data...');
    await db.collection('offers').deleteMany({ offer_address: { $regex: /^offer_test_/ } });
    await db.collection('loans').deleteMany({ loan_address: { $regex: /^loan_test_/ } });
    await db.collection('requests').deleteMany({ request_address: { $regex: /^request_test_/ } });
    await db.collection('comments').deleteMany({});
    
    // Insert test data
    console.log('📝 Inserting test loan offers...');
    const offersResult = await db.collection('offers').insertMany(testOffers);
    console.log(`   ✅ Inserted ${offersResult.insertedCount} loan offers`);
    
    console.log('📝 Inserting test loans...');
    const loansResult = await db.collection('loans').insertMany(testLoans);
    console.log(`   ✅ Inserted ${loansResult.insertedCount} loans`);
    
    console.log('📝 Inserting test loan requests...');
    const requestsResult = await db.collection('requests').insertMany(testRequests);
    console.log(`   ✅ Inserted ${requestsResult.insertedCount} loan requests`);
    
    // Get the inserted offer IDs to create some test comments
    const insertedOffers = await db.collection('offers').find({ offer_address: { $regex: /^offer_test_/ } }).toArray();
    
    if (insertedOffers.length > 0) {
      const testComments = [
        {
          offer_id: insertedOffers[0]._id,
          author: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
          content: 'Great terms! I might be interested in borrowing.',
          created_at: new Date()
        },
        {
          offer_id: insertedOffers[0]._id,
          author: 'BxKWBpF6TXHs8xGq8qYKV7vZz9YaTmmRJGF8vx5UExVa',
          content: 'What are the exact collateral requirements?',
          created_at: new Date()
        },
        {
          offer_id: insertedOffers[1]._id,
          author: 'CzKWBpF6TXHs8xGq8qYKV7vZz9YaTmmRJGF8vx5UExVb',
          content: 'This rate seems fair for the duration.',
          created_at: new Date()
        }
      ];
      
      console.log('💬 Inserting test comments...');
      const commentsResult = await db.collection('comments').insertMany(testComments);
      console.log(`   ✅ Inserted ${commentsResult.insertedCount} comments`);
    }
    
    console.log('\n🎉 Database population completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • ${testOffers.length} loan offers`);
    console.log(`   • ${testLoans.length} loans`);
    console.log(`   • ${testRequests.length} loan requests`);
    console.log(`   • ${insertedOffers.length > 0 ? '3' : '0'} comments`);
    console.log('\n🖥️  You can now test the frontend with this data!');
    console.log('   1. Start the backend server: cd backend && go run cmd/main.go');
    console.log('   2. Start the frontend: cd frontend && npm start');
    console.log('   3. The feed should show real loan offers from the database');
    console.log('   4. The stats should show real platform statistics');
    console.log('   5. Try manually adding more offers in MongoDB to see real-time updates!');
    
  } catch (error) {
    console.error('❌ Error populating database:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the population script
populateDatabase().catch(console.error);