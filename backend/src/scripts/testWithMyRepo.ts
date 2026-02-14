import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE = 'http://localhost:3001/api';

async function testWithMyRepo(githubUsername: string) {
  console.log(`\n🔍 Testing with GitHub user: ${githubUsername}`);
  console.log('==========================================\n');

  // Step 1: Create or login with GitHub username
  let token = '';
  try {
    // Try to login first
    const loginRes = await axios.post(`${API_BASE}/login`, {
      email: `${githubUsername}@example.com`,
      password: 'TestPass123!',
    });

    if (loginRes.data.success) {
      token = loginRes.data.token;
      console.log(`✅ Logged in as: ${githubUsername}`);
    }
  } catch (loginError) {
    // Create user
    try {
      const registerRes = await axios.post(`${API_BASE}/register`, {
        email: `${githubUsername}@example.com`,
        password: 'TestPass123!',
        username: githubUsername,
        securityQuestion: 'What is your favorite programming language?',
        securityAnswer: 'Python',
      });

      if (registerRes.data.success) {
        token = registerRes.data.token;
        console.log(`✅ Created user: ${githubUsername}`);
      }
    } catch (registerError: any) {
      console.error(
        `❌ Failed to create user: ${
          registerError.response?.data?.error || registerError.message
        }`
      );
      return;
    }
  }

  // Step 2: Get available tasks
  console.log('\n📋 Fetching available tasks...');
  try {
    const tasksRes = await axios.get(`${API_BASE}/tasks`);

    if (tasksRes.data.data.length === 0) {
      console.error('❌ No tasks found. Run "npm run seed" first.');
      return;
    }

    console.log(`Found ${tasksRes.data.meta.total} tasks:`);
    tasksRes.data.data.forEach((task: any, index: number) => {
      console.log(`  ${index + 1}. ${task.title} (ID: ${task._id})`);
      console.log(
        `     Difficulty: ${task.difficulty}, Points: ${task.points}`
      );
      console.log(
        `     Languages: ${task.configs.map((c: any) => c.language).join(', ')}`
      );
      console.log();
    });

    // Step 3: Test each task that matches our repo structure
    console.log('\n🚀 Testing tasks that match your repository structure...');
    console.log('--------------------------------------------------------');

    for (const task of tasksRes.data.data) {
      // Check what languages are supported
      for (const config of task.configs) {
        const language = config.language;

        // Skip if language not in your repo structure
        if (!['python', 'c'].includes(language)) continue;

        console.log(`\n📝 Testing: ${task.title} (${language})`);
        console.log(`   Task ID: ${task._id}`);

        try {
          const executeRes = await axios.post(
            `${API_BASE}/run`,
            {
              taskId: task._id,
              language: language,
              repoName: 'code-challenge-platform',
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          console.log(
            `   Result: ${executeRes.data.success ? '✅ PASS' : '❌ FAIL'}`
          );
          console.log(`   Exit Code: ${executeRes.data.execution.exitCode}`);

          if (executeRes.data.execution.stdout) {
            console.log(
              `   Output: ${executeRes.data.execution.stdout.substring(
                0,
                100
              )}...`
            );
          }

          if (executeRes.data.execution.stderr) {
            console.log(
              `   Error: ${executeRes.data.execution.stderr.substring(
                0,
                100
              )}...`
            );
          }
        } catch (error: any) {
          if (error.response?.status === 400) {
            console.log(`   ❌ Task error: ${error.response.data.error}`);
          } else if (error.response?.status === 500) {
            console.log(
              `   ❌ Repository error: Likely missing ${config.entryPoint} in your repo`
            );
            console.log(
              `   💡 Expected file: ${
                config.entryPoint
              } in your ${language.toUpperCase()}/ directory`
            );
          } else {
            console.log(`   ❌ Unexpected error: ${error.message}`);
          }
        }
      }
    }

    // Step 4: Test Docker inline execution (always works)
    console.log('\n🧪 Testing Docker inline execution...');
    try {
      const inlineRes = await axios.post(
        `${API_BASE}/docker/run-inline`,
        {
          language: 'python',
          code: 'print("Python is working! 2 + 3 =", 2 + 3)',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log(
        `✅ Docker inline execution: ${
          inlineRes.data.success ? 'PASS' : 'FAIL'
        }`
      );
      console.log(`   Output: ${inlineRes.data.execution.stdout}`);
    } catch (error: any) {
      console.log(
        `❌ Docker inline error: ${
          error.response?.data?.error || error.message
        }`
      );
    }
  } catch (error: any) {
    console.error('❌ Failed to fetch tasks:', error.message);
  }
}

// Get GitHub username from command line
const githubUsername = process.argv[2];

if (!githubUsername) {
  console.log(`
Usage: npx ts-node src/scripts/testWithMyRepo.ts <github-username>

Example: npx ts-node src/scripts/testWithMyRepo.ts yourusername

Prerequisites:
1. GitHub repository named "code-challenge-platform" exists
2. Repository has C/ and Python/ directories with your solutions
3. Docker and MongoDB are running
4. Backend server is running (npm run dev)

Quick start:
1. Create a test solution file: Python/basic/solution.py
2. Add: print("Hello from my repo!")
3. Push to GitHub
4. Run this test
`);
  process.exit(1);
}

testWithMyRepo(githubUsername);
