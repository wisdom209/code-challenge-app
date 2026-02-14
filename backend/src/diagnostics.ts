import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();

const execAsync = promisify(exec);
const API_BASE = 'http://localhost:3001/api';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: string;
}

const results: CheckResult[] = [];

function logResult(result: CheckResult) {
  results.push(result);
  const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️ ' : '❌';
  console.log(`${icon} ${result.name}: ${result.message}`);
  if (result.details) {
    console.log(`   ${result.details}`);
  }
}

async function checkMongoDB() {
  console.log('\n🔍 Checking MongoDB...');
  try {
    // Try to ping MongoDB
    const { stdout } = await execAsync('mongosh --eval "db.adminCommand(\'ping\')" --quiet');
    if (stdout.includes('ok: 1')) {
      logResult({
        name: 'MongoDB',
        status: 'pass',
        message: 'Running and accessible'
      });
      return true;
    } else {
      logResult({
        name: 'MongoDB',
        status: 'fail',
        message: 'Not responding correctly',
        details: 'Try: sudo systemctl start mongod (Linux) or brew services start mongodb-community (Mac)'
      });
      return false;
    }
  } catch (error: any) {
    logResult({
      name: 'MongoDB',
      status: 'fail',
      message: 'Not running or not installed',
      details: 'Install MongoDB: https://www.mongodb.com/docs/manual/installation/'
    });
    return false;
  }
}

async function checkDocker() {
  console.log('\n🔍 Checking Docker...');
  try {
    const { stdout } = await execAsync('docker ps');
    logResult({
      name: 'Docker',
      status: 'pass',
      message: 'Running and accessible'
    });
    
    // Check for required images
    try {
      const { stdout: images } = await execAsync('docker images');
      const hasPython = images.includes('python');
      const hasGcc = images.includes('gcc');
      
      if (hasPython && hasGcc) {
        logResult({
          name: 'Docker Images',
          status: 'pass',
          message: 'Required images available (python, gcc)'
        });
      } else {
        logResult({
          name: 'Docker Images',
          status: 'warn',
          message: 'Some required images might be missing',
          details: `Pull with: docker pull python:3.11-slim && docker pull gcc:latest`
        });
      }
    } catch (error) {
      logResult({
        name: 'Docker Images',
        status: 'warn',
        message: 'Could not check images',
        details: 'Ensure Docker is running properly'
      });
    }
    
    return true;
  } catch (error: any) {
    logResult({
      name: 'Docker',
      status: 'fail',
      message: 'Not running or not installed',
      details: 'Install Docker: https://docs.docker.com/get-docker/'
    });
    return false;
  }
}

async function checkBackendServer() {
  console.log('\n🔍 Checking Backend Server...');
  try {
    const response = await axios.get(`${API_BASE.replace('/api', '')}/health`, {
      timeout: 3000
    });
    
    if (response.data.status === 'healthy') {
      logResult({
        name: 'Backend Server',
        status: 'pass',
        message: `Running on port ${process.env.PORT || 3001}`,
        details: `Database: ${response.data.database.status}`
      });
      return true;
    } else {
      logResult({
        name: 'Backend Server',
        status: 'warn',
        message: 'Server responded but health check failed'
      });
      return false;
    }
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      logResult({
        name: 'Backend Server',
        status: 'fail',
        message: 'Not running',
        details: 'Start with: pnpm run dev'
      });
    } else {
      logResult({
        name: 'Backend Server',
        status: 'fail',
        message: `Error: ${error.message}`,
        details: 'Check if the server is running on the correct port'
      });
    }
    return false;
  }
}

async function checkTasks() {
  console.log('\n🔍 Checking Tasks in Database...');
  try {
    const response = await axios.get(`${API_BASE}/tasks`, {
      timeout: 3000
    });
    
    const tasks = response.data.data;
    if (tasks.length > 0) {
      logResult({
        name: 'Database Tasks',
        status: 'pass',
        message: `Found ${tasks.length} tasks`,
        details: `Tasks: ${tasks.map((t: any) => t.title).join(', ')}`
      });
      
      // Validate task structure
      let allValid = true;
      for (const task of tasks) {
        if (!task.category || !task.order) {
          logResult({
            name: `Task: ${task.title}`,
            status: 'warn',
            message: 'Missing category or order',
            details: `Category: ${task.category || 'MISSING'}, Order: ${task.order || 'MISSING'}`
          });
          allValid = false;
        }
      }
      
      if (allValid) {
        logResult({
          name: 'Task Validation',
          status: 'pass',
          message: 'All tasks have required fields (category, order)'
        });
      }
      
      return tasks.length > 0;
    } else {
      logResult({
        name: 'Database Tasks',
        status: 'fail',
        message: 'No tasks found in database',
        details: 'Run: pnpm run seed'
      });
      return false;
    }
  } catch (error: any) {
    logResult({
      name: 'Database Tasks',
      status: 'fail',
      message: `Could not fetch tasks: ${error.message}`,
      details: 'Ensure backend server and MongoDB are running'
    });
    return false;
  }
}

async function checkGitHubRepo(username: string) {
  console.log(`\n🔍 Checking GitHub Repository for ${username}...`);
  
  const repoUrl = `https://github.com/${username}/code-challenge-platform`;
  const apiUrl = `https://api.github.com/repos/${username}/code-challenge-platform`;
  
  try {
    const response = await axios.get(apiUrl, {
      timeout: 5000,
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (response.data.private) {
      logResult({
        name: 'GitHub Repository',
        status: 'warn',
        message: 'Repository is private',
        details: 'Make it public or use authentication for git clone to work'
      });
    } else {
      logResult({
        name: 'GitHub Repository',
        status: 'pass',
        message: 'Repository exists and is public',
        details: `URL: ${repoUrl}`
      });
    }
    
    // Check for expected files
    const filesToCheck = [
      'Python/strings/solution_1.py',
      'Python/mathematics/solution_2.py',
      'C/strings/solution_3.c'
    ];
    
    for (const file of filesToCheck) {
      try {
        const fileUrl = `https://api.github.com/repos/${username}/code-challenge-platform/contents/${file}`;
        await axios.get(fileUrl, { timeout: 3000 });
        logResult({
          name: `File: ${file}`,
          status: 'pass',
          message: 'Exists in repository'
        });
      } catch (error: any) {
        if (error.response?.status === 404) {
          logResult({
            name: `File: ${file}`,
            status: 'warn',
            message: 'Not found in repository',
            details: 'This file is expected for one of the seed tasks'
          });
        }
      }
    }
    
    return true;
  } catch (error: any) {
    if (error.response?.status === 404) {
      logResult({
        name: 'GitHub Repository',
        status: 'fail',
        message: 'Repository not found',
        details: `Create it at: ${repoUrl}`
      });
    } else {
      logResult({
        name: 'GitHub Repository',
        status: 'warn',
        message: `Could not check: ${error.message}`,
        details: 'This might be a network issue or rate limit'
      });
    }
    return false;
  }
}

async function runDiagnostics(username?: string) {
  console.log('═══════════════════════════════════════════════════════');
  console.log('     Code Challenge Platform - System Diagnostics');
  console.log('═══════════════════════════════════════════════════════');
  
  const mongoOk = await checkMongoDB();
  const dockerOk = await checkDocker();
  const backendOk = await checkBackendServer();
  const tasksOk = await checkTasks();
  
  if (username) {
    await checkGitHubRepo(username);
  }
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('                    Summary');
  console.log('═══════════════════════════════════════════════════════');
  
  const passed = results.filter(r => r.status === 'pass').length;
  const warned = results.filter(r => r.status === 'warn').length;
  const failed = results.filter(r => r.status === 'fail').length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`⚠️  Warnings: ${warned}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed === 0 && warned === 0) {
    console.log('\n🎉 All checks passed! You\'re ready to run tests.');
  } else if (failed === 0) {
    console.log('\n⚠️  Some warnings detected. System should work but check the warnings above.');
  } else {
    console.log('\n❌ Some checks failed. Please fix the issues above before running tests.');
    console.log('\n📋 Quick Fix Guide:');
    console.log('   1. Start MongoDB: sudo systemctl start mongod (or brew services start mongodb-community)');
    console.log('   2. Start Docker: systemctl start docker (or open Docker Desktop)');
    console.log('   3. Seed database: pnpm run seed');
    console.log('   4. Start backend: pnpm run dev');
    console.log('   5. Create GitHub repository with correct structure');
  }
  
  console.log('\n═══════════════════════════════════════════════════════\n');
  
  return failed === 0;
}

// Main execution
const username = process.argv[2];

if (!username) {
  console.log('\nUsage: npx ts-node src/scripts/diagnostics.ts <github-username>');
  console.log('Example: npx ts-node src/scripts/diagnostics.ts wisdom209\n');
  console.log('Running diagnostics without GitHub check...\n');
}

runDiagnostics(username).then(success => {
  process.exit(success ? 0 : 1);
});
