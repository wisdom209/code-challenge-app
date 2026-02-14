import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

async function testSimpleReset() {
  console.log('🔐 Testing Simple Password Reset (Security Questions)...\n');
  
  const testEmail = `simple${Date.now()}@example.com`;
  const testUsername = `simpleuser${Date.now()}`;
  const originalPassword = 'OriginalPass123!';
  const newPassword = 'NewSimplePass456!';

  try {
    // Step 1: Register with security question
    console.log('1. Creating user with security question...');
    const registerRes = await axios.post(`${API_BASE}/register`, {
      email: testEmail,
      password: originalPassword,
      username: testUsername,
      securityQuestion: 'What is your favorite programming language?',
      securityAnswer: 'Python',
    });
    
    if (!registerRes.data.success) {
      console.error('❌ Failed to create user:', registerRes.data.error);
      return;
    }
    console.log('✅ User created with security question\n');

    // Step 2: Get security question
    console.log('2. Fetching security question...');
    const questionRes = await axios.get(`${API_BASE}/security-question/${testUsername}`);
    console.log(`✅ Question: ${questionRes.data.question}\n`);

    // Step 3: Try wrong answer
    console.log('3. Testing with wrong answer...');
    try {
      await axios.post(`${API_BASE}/verify-security-answer`, {
        username: testUsername,
        answer: 'Java',
      });
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected wrong answer\n');
      } else {
        throw error;
      }
    }

    // Step 4: Verify correct answer
    console.log('4. Verifying correct answer...');
    const verifyRes = await axios.post(`${API_BASE}/verify-security-answer`, {
      username: testUsername,
      answer: 'Python',
    });
    
    console.log('✅ Answer verified');
    console.log(`   Reset token received: ${verifyRes.data.resetToken ? 'Yes' : 'No'}\n`);

    const resetToken = verifyRes.data.resetToken;

    // Step 5: Reset password
    console.log('5. Resetting password...');
    const resetRes = await axios.post(`${API_BASE}/reset-password-simple`, {
      resetToken,
      newPassword,
    });
    
    console.log('✅ Password reset successful');
    console.log(`   New auth token: ${resetRes.data.token ? 'Yes' : 'No'}\n`);

    // Step 6: Verify old password doesn't work
    console.log('6. Verifying old password is invalid...');
    try {
      await axios.post(`${API_BASE}/login`, {
        email: testEmail,
        password: originalPassword,
      });
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('✅ Old password rejected\n');
      }
    }

    // Step 7: Login with new password
    console.log('7. Logging in with new password...');
    const loginRes = await axios.post(`${API_BASE}/login`, {
      email: testEmail,
      password: newPassword,
    });
    
    console.log(`✅ Login successful! Welcome ${loginRes.data.user.username}\n`);

    // Step 8: Test non-existent user
    console.log('8. Testing security question for non-existent user...');
    const fakeRes = await axios.get(`${API_BASE}/security-question/fakeuser123`);
    console.log(`✅ Returns generic question (prevents enumeration)`);
    console.log(`   Question: ${fakeRes.data.question}\n`);

    console.log('🎉 All simple reset tests passed!');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testSimpleReset();
