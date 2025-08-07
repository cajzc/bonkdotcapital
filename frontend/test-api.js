w// Simple test to verify API client works in Node.js environment
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:8080/api/v1';

async function testAPI() {
  console.log('🧪 Testing Frontend API Client Configuration...\n');

  try {
    // Test offers endpoint
    console.log('1. Testing offers endpoint...');
    const offersResponse = await fetch(`${API_BASE_URL}/offers/`);
    if (!offersResponse.ok) {
      throw new Error(`HTTP ${offersResponse.status}: ${offersResponse.statusText}`);
    }
    const offers = await offersResponse.json();
    console.log(`✅ Offers: Found ${offers.length} offers`);
    
    // Test requests endpoint
    console.log('2. Testing requests endpoint...');
    const requestsResponse = await fetch(`${API_BASE_URL}/requests/`);
    if (!requestsResponse.ok) {
      throw new Error(`HTTP ${requestsResponse.status}: ${requestsResponse.statusText}`);
    }
    const requests = await requestsResponse.json();
    console.log(`✅ Requests: Found ${requests.length} requests`);
    
    // Test stats endpoint
    console.log('3. Testing stats endpoint...');
    const statsResponse = await fetch(`${API_BASE_URL}/stats`);
    if (!statsResponse.ok) {
      throw new Error(`HTTP ${statsResponse.status}: ${statsResponse.statusText}`);
    }
    const stats = await statsResponse.json();
    console.log(`✅ Stats: ${stats.active_loans_count} active loans, ${stats.average_apy.toFixed(1)}% avg APY`);
    
    console.log('\n🎉 All API endpoints are working correctly!');
    console.log('\n📱 Your React Native app should now be able to:');
    console.log('   • Load loan offers and requests in the feed');
    console.log('   • Display real platform statistics');
    console.log('   • Show user profile data');
    console.log('\n💡 If you\'re still having issues:');
    console.log('   • Make sure you\'re using the correct device IP (10.0.2.2 for Android emulator)');
    console.log('   • Check that your device can reach the backend server');
    console.log('   • WebSocket errors are non-critical and won\'t prevent data loading');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   • Make sure the backend server is running: go run cmd/main.go');
    console.log('   • Verify MongoDB is accessible and has data');
    console.log('   • Check if you can access http://localhost:8080/api/v1/offers/ in your browser');
  }
}

testAPI();