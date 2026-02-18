// test-full-stack.js
// Run: node test-full-stack.js
// Ensure backend and frontend are running (backend on 3001, frontend on 5173)

const axios = require('axios');

// Configuration
const BACKEND_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:5173';
const API_BASE = `${BACKEND_URL}/api`;

// Test results storage
const results = [];

// Helper to log a test result
function logResult(name, status, message = '', details = '') {
  const icon = status === 'pass' ? '✅' : status === 'warn' ? '⚠️' : '❌';
  console.log(`${icon} ${name}: ${message}`);
  if (details) console.log(`   ${details}`);
  results.push({ name, status, message, details });
}

// Main test runner
async function runTests() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('     Code Challenge Platform - Full Stack Test Suite');
  console.log('═══════════════════════════════════════════════════════\n');

  // --------------------------------------------------------------------
  // 1. BACKEND HEALTH CHECKS
  // --------------------------------------------------------------------
  console.log('\n📡 Backend Health Checks\n');

  // 1.1 Health endpoint
  try {
    const health = await axios.get(`${BACKEND_URL}/health`, { timeout: 3000 });
    if (health.data.status === 'healthy') {
      logResult('Backend Health', 'pass', 'Server is healthy', 
        `Database: ${health.data.database.status}`);
    } else {
      logResult('Backend Health', 'fail', 'Health check returned unexpected status');
    }
  } catch (error) {
    logResult('Backend Health', 'fail', 'Backend not reachable', 
      `Is the server running on ${BACKEND_URL}?`);
  }

  // 1.2 Docker connection
  try {
    const dockerHealth = await axios.get(`${API_BASE}/docker/health`, { timeout: 3000 });
    if (dockerHealth.data.connected) {
      logResult('Docker Connection', 'pass', 'Docker daemon is reachable');
    } else {
      logResult('Docker Connection', 'warn', 'Docker daemon not connected', 
        'Code execution may fail');
    }
  } catch (error) {
    logResult('Docker Connection', 'warn', 'Could not check Docker', 
      error.response?.data?.error || error.message);
  }

  // 1.3 Supported languages
  try {
    const langs = await axios.get(`${API_BASE}/docker/languages`, { timeout: 3000 });
    if (langs.data.languages && langs.data.languages.length > 0) {
      logResult('Supported Languages', 'pass', 
        `Found ${langs.data.languages.length} languages: ${langs.data.languages.map(l => l.id).join(', ')}`);
    } else {
      logResult('Supported Languages', 'warn', 'No languages returned');
    }
  } catch (error) {
    logResult('Supported Languages', 'warn', 'Could not fetch languages', error.message);
  }

  // 1.4 Tasks endpoint (public)
  try {
    const tasks = await axios.get(`${API_BASE}/tasks`, { timeout: 3000 });
    if (tasks.data.data && tasks.data.data.length > 0) {
      logResult('Tasks Available', 'pass', `Found ${tasks.data.data.length} tasks`);
    } else {
      logResult('Tasks Available', 'warn', 'No tasks in database', 'Run "npm run seed" in backend');
    }
  } catch (error) {
    logResult('Tasks Available', 'fail', 'Could not fetch tasks', error.message);
  }

  // --------------------------------------------------------------------
  // 2. FRONTEND AVAILABILITY
  // --------------------------------------------------------------------
  console.log('\n🌐 Frontend Checks\n');

  try {
    const front = await axios.get(FRONTEND_URL, { timeout: 3000 });
    if (front.status === 200) {
      logResult('Frontend Server', 'pass', 'Frontend is reachable');
    } else {
      logResult('Frontend Server', 'fail', `Unexpected status ${front.status}`);
    }
  } catch (error) {
    logResult('Frontend Server', 'fail', 'Frontend not reachable', 
      `Is the dev server running on ${FRONTEND_URL}?`);
  }

  // --------------------------------------------------------------------
  // 3. AUTHENTICATION (ADMIN LOGIN)
  // --------------------------------------------------------------------
  console.log('\n🔐 Authentication (Admin)\n');

  let adminToken = null;
  let regularToken = null;

  // Admin credentials from seed data
  const adminCreds = {
    email: 'admin@codechallenge.com',
    password: 'Admin123!'
  };

  // Regular user credentials (create if not exists)
  const testUser = {
    email: `testuser_${Date.now()}@example.com`,
    password: 'TestPass123!',
    username: `testuser_${Date.now()}`,
    securityQuestion: 'What is your favorite programming language?',
    securityAnswer: 'JavaScript'
  };

  try {
    const login = await axios.post(`${API_BASE}/login`, adminCreds);
    if (login.data.success && login.data.token) {
      adminToken = login.data.token;
      logResult('Admin Login', 'pass', 'Successfully logged in as admin');
    } else {
      logResult('Admin Login', 'fail', 'Login response missing token');
    }
  } catch (error) {
    logResult('Admin Login', 'fail', 'Admin login failed', 
      error.response?.data?.message || error.message);
  }

  // Also try to register a regular user (for role checks later)
  try {
    const register = await axios.post(`${API_BASE}/register`, testUser);
    if (register.data.success && register.data.token) {
      regularToken = register.data.token;
      logResult('Regular User Registration', 'pass', 'Created regular user');
    } else {
      logResult('Regular User Registration', 'warn', 'Could not create regular user');
    }
  } catch (error) {
    // If user already exists, try to login
    try {
      const login = await axios.post(`${API_BASE}/login`, {
        email: testUser.email,
        password: testUser.password
      });
      if (login.data.success) {
        regularToken = login.data.token;
        logResult('Regular User Login', 'pass', 'Logged in as regular user');
      }
    } catch (loginErr) {
      logResult('Regular User Access', 'warn', 'Could not obtain regular user token');
    }
  }

  // --------------------------------------------------------------------
  // 4. ADMIN PANEL API TESTS
  // --------------------------------------------------------------------
  console.log('\n⚙️ Admin Panel API Tests\n');

  let tasksList = [];

  if (!adminToken) {
    logResult('Admin API Tests', 'fail', 'Skipped – no admin token');
  } else {
    const adminHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };

    // 4.1 Get admin stats
    try {
      const stats = await axios.get(`${API_BASE}/admin/tasks/stats`, adminHeaders);
      if (stats.data.success) {
        logResult('Admin Stats', 'pass', 'Retrieved task statistics');
      } else {
        logResult('Admin Stats', 'fail', 'Stats endpoint returned error');
      }
    } catch (error) {
      logResult('Admin Stats', 'fail', 'Could not fetch stats', error.message);
    }

    // 4.2 Get all tasks (admin view)
    try {
      const tasks = await axios.get(`${API_BASE}/admin/tasks`, adminHeaders);
      if (tasks.data.success && tasks.data.data) {
        tasksList = tasks.data.data;
        logResult('Admin Tasks List', 'pass', `Retrieved ${tasksList.length} tasks`);
      } else {
        logResult('Admin Tasks List', 'fail', 'Tasks list endpoint returned error');
      }
    } catch (error) {
      logResult('Admin Tasks List', 'fail', 'Could not fetch tasks list', error.message);
    }

    // 4.3 Create a new task
    let newTaskId = null;
    const newTask = {
      title: `Test Task ${Date.now()}`,
      description: 'This is a test task created by the test script.',
      category: 'strings',
      difficulty: 'easy',
      tags: ['test', 'automated'],
      points: 10,
      order: 999,
      estimatedTime: 5,
      isActive: true,
      configs: [
        {
          language: 'python',
          entryPoint: 'solution.py',
          testCommand: 'python test_solution.py',
          timeout: 5000,
          memoryLimit: 128,
          testScriptPath: 'Python/strings/reverse_a_string',
          testCases: [
            {
              input: 'hello',
              expectedOutput: 'olleh',
              isHidden: false,
              description: 'Basic'
            }
          ]
        }
      ]
    };

    try {
      const create = await axios.post(`${API_BASE}/admin/tasks`, newTask, adminHeaders);
      if (create.data.success && create.data.data && create.data.data._id) {
        newTaskId = create.data.data._id;
        logResult('Create Task', 'pass', `Created task with ID: ${newTaskId}`);
      } else {
        logResult('Create Task', 'fail', 'Create task response missing task ID');
      }
    } catch (error) {
      logResult('Create Task', 'fail', 'Could not create task', 
        error.response?.data?.error || error.message);
    }

    // 4.4 Generate test script for that task
    if (newTaskId) {
      try {
        const scriptRes = await axios.post(`${API_BASE}/admin/tasks/generate-test-script`, {
          language: 'python',
          entryPoint: 'solution.py',
          testCases: newTask.configs[0].testCases
        }, adminHeaders);
        if (scriptRes.data.success && scriptRes.data.data.script) {
          logResult('Generate Test Script', 'pass', 'Generated test script');
        } else {
          logResult('Generate Test Script', 'fail', 'Script generation failed');
        }
      } catch (error) {
        logResult('Generate Test Script', 'fail', 'Could not generate script', error.message);
      }

      // 4.5 Update the task
      try {
        const updateData = { title: `Updated Test Task ${Date.now()}` };
        const update = await axios.put(`${API_BASE}/admin/tasks/${newTaskId}`, updateData, adminHeaders);
        if (update.data.success) {
          logResult('Update Task', 'pass', 'Task updated successfully');
        } else {
          logResult('Update Task', 'fail', 'Update failed');
        }
      } catch (error) {
        logResult('Update Task', 'fail', 'Could not update task', error.message);
      }

      // 4.6 Delete (soft delete) the task
      try {
        const del = await axios.delete(`${API_BASE}/admin/tasks/${newTaskId}`, adminHeaders);
        if (del.data.success) {
          logResult('Soft Delete Task', 'pass', 'Task soft-deleted');
        } else {
          logResult('Soft Delete Task', 'fail', 'Delete failed');
        }
      } catch (error) {
        logResult('Soft Delete Task', 'fail', 'Could not delete task', error.message);
      }

      // 4.7 Restore the task
      try {
        const restore = await axios.post(`${API_BASE}/admin/tasks/${newTaskId}/restore`, {}, adminHeaders);
        if (restore.data.success) {
          logResult('Restore Task', 'pass', 'Task restored');
        } else {
          logResult('Restore Task', 'fail', 'Restore failed');
        }
      } catch (error) {
        logResult('Restore Task', 'fail', 'Could not restore task', error.message);
      }

      // 4.8 Validate a task (using the new task data)
      try {
        const validate = await axios.post(`${API_BASE}/admin/tasks/validate`, newTask, adminHeaders);
        if (validate.data.success && validate.data.isValid) {
          logResult('Validate Task', 'pass', 'Task validation passed');
        } else {
          logResult('Validate Task', 'warn', 'Validation failed or returned errors', 
            validate.data.errors?.join(', '));
        }
      } catch (error) {
        logResult('Validate Task', 'fail', 'Could not validate task', error.message);
      }

      // 4.9 Bulk delete (using the created task ID)
      try {
        const bulk = await axios.post(`${API_BASE}/admin/tasks/bulk-delete`, 
          { taskIds: [newTaskId] }, adminHeaders);
        if (bulk.data.success) {
          logResult('Bulk Delete', 'pass', 'Bulk delete succeeded');
        } else {
          logResult('Bulk Delete', 'fail', 'Bulk delete failed');
        }
      } catch (error) {
        logResult('Bulk Delete', 'fail', 'Could not perform bulk delete', error.message);
      }
    }
  }

  // --------------------------------------------------------------------
  // 5. REGULAR USER ACCESS CONTROL
  // --------------------------------------------------------------------
  console.log('\n🔒 Regular User Access Control\n');

  if (regularToken) {
    const userHeaders = { headers: { Authorization: `Bearer ${regularToken}` } };
    // Try to access admin endpoint – should be forbidden
    try {
      await axios.get(`${API_BASE}/admin/tasks/stats`, userHeaders);
      logResult('Admin Access (Regular User)', 'fail', 'Regular user was able to access admin endpoint!');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        logResult('Admin Access (Regular User)', 'pass', 'Regular user correctly forbidden');
      } else {
        logResult('Admin Access (Regular User)', 'warn', 'Unexpected error', error.message);
      }
    }
  } else {
    logResult('Regular User Access Control', 'warn', 'Skipped – no regular user token');
  }

  // --------------------------------------------------------------------
  // 6. TASK EXECUTION ENDPOINT
  // --------------------------------------------------------------------
  console.log('\n🚀 Task Execution Endpoint\n');

  if (adminToken && tasksList.length > 0) {
    const sampleTask = tasksList[0];
    const headers = { headers: { Authorization: `Bearer ${adminToken}` } };
    try {
      const run = await axios.post(`${API_BASE}/run`, {
        taskId: sampleTask._id,
        language: sampleTask.configs[0].language,
        repoName: 'code-challenge-platform',
        githubUsername: 'this-user-does-not-exist-hopefully'
      }, { ...headers, timeout: 15000 }); // ⬅️ Increased to 15 seconds
      logResult('Run Task Endpoint', 'pass', 'Endpoint responded (expected error is fine)');
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        logResult('Run Task Endpoint', 'fail', 'Request timed out after 15 seconds', 
          'Backend may be slow or hanging. Check Docker and network.');
      } else if (error.response) {
        logResult('Run Task Endpoint', 'pass', `Endpoint responded with status ${error.response.status} (as expected)`);
      } else {
        logResult('Run Task Endpoint', 'fail', 'Could not reach endpoint', error.message);
      }
    }
  } else {
    logResult('Run Task Endpoint', 'warn', 'Skipped – no tasks or admin token');
  }

  // --------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('                       TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');

  const passed = results.filter(r => r.status === 'pass').length;
  const warned = results.filter(r => r.status === 'warn').length;
  const failed = results.filter(r => r.status === 'fail').length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`⚠️  Warnings: ${warned}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed === 0 && warned === 0) {
    console.log('\n🎉 All tests passed! The system is ready.');
  } else if (failed === 0) {
    console.log('\n⚠️  Some warnings detected – review them above.');
  } else {
    console.log('\n❌ Some tests failed – check the details above.');
  }

  console.log('\n═══════════════════════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  console.error('Unhandled error in test script:', error);
  process.exit(1);
});
