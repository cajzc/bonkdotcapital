// Simple test script to verify API endpoints are working
const API_BASE_URL = 'http://localhost:8080/api/v1';

async function testAPI() {
  console.log('Testing API endpoints...\n');

  try {
    // Test platform stats endpoint
    console.log('1. Testing /stats endpoint...');
    const statsResponse = await fetch(`${API_BASE_URL}/stats`);
    const stats = await statsResponse.json();
    console.log('✅ Stats:', JSON.stringify(stats, null, 2));
    
    // Test loan offers endpoint
    console.log('\n2. Testing /offers endpoint...');
    const offersResponse = await fetch(`${API_BASE_URL}/offers`);
    const offers = await offersResponse.json();
    console.log('✅ Offers:', offers.length ? `Found ${offers.length} offers` : 'No offers found');
    
    // Test loan requests endpoint
    console.log('\n3. Testing /requests endpoint...');
    const requestsResponse = await fetch(`${API_BASE_URL}/requests`);
    const requests = await requestsResponse.json();
    console.log('✅ Requests:', requests.length ? `Found ${requests.length} requests` : 'No requests found');
    
    console.log('\n🎉 All API endpoints are working correctly!');
    
  } catch (error) {
    console.error('❌ API test failed:', error);
    process.exit(1);
  }
}

testAPI();