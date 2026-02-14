import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

async function testAuth() {
  console.log('🔐 Testing Authentication System...\n');
  
  let token = '';
  
  try {
    // Test 1: Register a new user
    console.log('1. Testing Registration:');
    const registerData = {
      email: `test${Date.now()}@example.com`,
      password: 'TestPass123!',
      username: `testuser${Date.now()}`,
    };
    
    const registerRes = await axios.post(`${API_BASE}/register`, registerData);
    console.log(`   ✅ Registration successful`);
    console.log(`   Username: ${registerRes.data.user.username}`);
    console.log(`   Email: ${registerRes.data.user.email}`);
    token = registerRes.data.token;
    console.log(`   Token received: ${token.substring(0, 50)}...\n`);
    
    // Test 2: Login with the new user
    console.log('2. Testing Login:');
    const loginRes = await axios.post(`${API_BASE}/login`, {
      email: registerData.email,
      password: registerData.password,
    });
    console.log(`   ✅ Login successful\n`);
    
    // Test 3: Get user profile
    console.log('3. Testing Profile Fetch:');
    const profileRes = await axios.get(`${API_BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`   ✅ Profile fetched`);
    console.log(`   User ID: ${profileRes.data.user.id}`);
    console.log(`   Account Age: ${profileRes.data.user.accountAgeDays} days\n`);
    
    // Test 4: Verify token
    console.log('4. Testing Token Verification:');
    const verifyRes = await axios.post(`${API_BASE}/verify-token`, {
      token,
    });
    console.log(`   ✅ Token is valid\n`);
    
    // Test 5: Test with seeded admin user
    console.log('5. Testing Seeded Admin Login:');
    const adminRes = await axios.post(`${API_BASE}/login`, {
      email: 'admin@example.com',
      password: 'Admin123!',
    });
    console.log(`   ✅ Admin login successful`);
    console.log(`   Admin Username: ${adminRes.data.user.username}`);
    console.log(`   Admin Bio: ${adminRes.data.user.bio}\n`);
    
    // Test 6: Test invalid login
    console.log('6. Testing Invalid Login:');
    try {
      await axios.post(`${API_BASE}/login`, {
        email: 'nonexistent@example.com',
        password: 'WrongPass',
      });
    } catch (error: any) {
      console.log(`   ✅ Correctly rejected invalid login`);
      console.log(`   Error: ${error.response.data.error}`);
      console.log(`   Status: ${error.response.status}\n`);
    }
    
    // Test 7: Test protected route without token
    console.log('7. Testing Unauthorized Access:');
    try {
      await axios.get(`${API_BASE}/me`);
    } catch (error: any) {
      console.log(`   ✅ Correctly rejected unauthorized access`);
      console.log(`   Error: ${error.response.data.error}`);
      console.log(`   Status: ${error.response.status}\n`);
    }
    
    console.log('🎉 All authentication tests passed!');
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status:', error.response.status);
    }
  }
}

// Run the test
testAuth();
