import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

const testRegistration = async () => {
  console.log('Testing user registration endpoint...\n');

  const testCases = [
    // Valid username
    { username: 'octocat', shouldSucceed: true },
    
    // Valid username with uppercase
    { username: 'GitHubUser', shouldSucceed: true },
    
    // Valid username with numbers
    { username: 'user123', shouldSucceed: true },
    
    // Valid username with hyphens
    { username: 'user-name', shouldSucceed: true },
    
    // Missing username
    { username: '', shouldSucceed: false },
    
    // Too long username
    { username: 'a'.repeat(40), shouldSucceed: false },
    
    // Invalid characters
    { username: 'user name', shouldSucceed: false },
    
    // Starts with hyphen
    { username: '-username', shouldSucceed: false },
    
    // Ends with hyphen
    { username: 'username-', shouldSucceed: false },
  ];

  for (const testCase of testCases) {
    console.log(`Testing username: "${testCase.username}"`);
    
    try {
      const response = await axios.post(`${API_BASE}/register`, {
        username: testCase.username
      }, {
        validateStatus: (status) => true // Accept all status codes
      });

      console.log(`  Status: ${response.status}`);
      console.log(`  Success: ${response.data.success}`);
      
      if (response.data.success) {
        console.log(`  User ID: ${response.data.user.id}`);
        console.log(`  username: ${response.data.user.username}`);
      } else {
        console.log(`  Error: ${response.data.error}`);
        console.log(`  Details: ${response.data.details}`);
      }
    } catch (error: any) {
      console.log(`  Error: ${error.message}`);
    }
    
    console.log('---\n');
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  testRegistration().catch(console.error);
}

export default testRegistration;
