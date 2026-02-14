import Docker, { Container, ContainerCreateOptions } from 'dockerode';
import { Readable } from 'stream';
import { promises as fs } from 'fs';
import path from 'path';
import Task, { ITask } from '../models/Task';
import { existsSync } from 'node:fs';

// Type for our execution results
export interface ExecutionResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  executionTime: number;
  timedOut: boolean;
}

// Configuration for Python and C only
interface LanguageConfig {
  image: string;
  workDir: string;
  isCompiled: boolean; // True for C, False for Python
}

class DockerService {
  private docker: Docker;
  private isConnected: boolean = false;
  private tempDir = path.join(__dirname, '..', '..', '.tmp');

  // Only Python and C configurations
  languageConfigs: Record<string, LanguageConfig> = {
    python: {
      image: 'python:3.11-slim',
      workDir: '/usr/src/app',
      isCompiled: false,
    },
    c: {
      image: 'gcc-debian-slim',
      workDir: '/usr/src/app',
      isCompiled: true,
    },
  };

  constructor() {
    this.docker = new Docker({
      socketPath: '/var/run/docker.sock',
    });
    console.log('🐳 DockerService initialized (Python & C only)');
    this.ensureTempDir();
  }

  private async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temporary directory:', error);
    }
  }

  /**
   * Execute a shell command
   */
  private async runShellCommand(
    command: string,
    cwd?: string
  ): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    const { spawn } = await import('child_process');

    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(' ');
      const process = spawn(cmd, args, { cwd, shell: true });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (exitCode) => {
        resolve({
          exitCode: exitCode || 0,
          stdout,
          stderr,
        });
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  // Add this method to your DockerService class
  async checkConnection(): Promise<boolean> {
    try {
      await this.docker.ping();
      this.isConnected = true;
      console.log('✅ Docker daemon is reachable');
      return true;
    } catch (error) {
      console.error('❌ Docker daemon is not reachable:', error);
      this.isConnected = false;
      return false;
    }
  }

  // Optional: Add a method to get Docker info
  async getDockerInfo(): Promise<any> {
    try {
      const info = await this.docker.info();
      return info;
    } catch (error) {
      console.error('Failed to get Docker info:', error);
      throw error;
    }
  }

  /**
   * Run code in a container - Python or C only
   */
  async runCode(
    language: string,
    code: string,
    input: string = '',
    timeoutMs: number = 10000
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    // Check Docker connection
    if (!this.isConnected) {
      const connected = await this.checkConnection();
      if (!connected) {
        return this.createErrorResult('Docker daemon is not running');
      }
    }

    // Get configuration
    const config = this.languageConfigs[language];
    if (!config) {
      return this.createErrorResult(
        `Unsupported language: ${language}. Use 'python' or 'c'`
      );
    }

    let container: Container | null = null;

    try {
      console.log(`Running ${language} code (${code.length} chars)`);

      // Step 1: Prepare command based on language
      const command = this.prepareCommand(language, code, config);

      // Step 2: Create and run container
      container = await this.createAndRunContainer(config, command, input);

      // Step 3: Collect output
      const output = await this.collectContainerOutput(
        container,
        input,
        timeoutMs
      );

      // Step 4: Get exit code
      const exitCode = await this.getContainerExitCode(container);

      const executionTime = Date.now() - startTime;

      console.log(
        `${language} execution completed in ${executionTime}ms (exit: ${exitCode})`
      );

      return {
        success: exitCode === 0,
        exitCode,
        stdout: output.stdout,
        stderr: output.stderr,
        executionTime,
        timedOut: false,
      };
    } catch (error: any) {
      if (error.message.includes('timeout')) {
        return {
          success: false,
          exitCode: -1,
          stdout: '',
          stderr: `Execution timed out after ${timeoutMs}ms`,
          executionTime: Date.now() - startTime,
          timedOut: true,
        };
      }

      return {
        success: false,
        exitCode: -1,
        stdout: '',
        stderr: `Execution failed: ${error.message}`,
        executionTime: Date.now() - startTime,
        timedOut: false,
      };
    } finally {
      // Cleanup
      if (container) {
        await this.cleanupContainer(container);
      }
    }
  }

  /**
   * Run tests from a user's GitHub repository for a given task.
   */
  async runTestsFromRepo(
    githubUsername: string,
    taskId: string,
    language: string,
    repoName?: string // Optional: allow custom repo name
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    let repoPath: string | null = null;
    let container: Container | null = null;

    try {
      // 1. Get task details
      const task = await Task.findById(taskId);
      if (!task) {
        return this.createErrorResult('Task not found');
      }

      const taskConfig = task.getConfigForLanguage(language);
      if (!taskConfig) {
        return this.createErrorResult(
          `Task does not support language: ${language}`
        );
      }

      const { testCommand, timeout: taskTimeout } = taskConfig;

      // 2. Create a temporary directory for cloning
      const uniqueFolderName = `repo-${githubUsername}-${taskId}-${Date.now()}`;
      repoPath = path.join(this.tempDir, uniqueFolderName);
      await fs.mkdir(repoPath, { recursive: true });
      console.log(`Created temporary directory: ${repoPath}`);

      // 3. Clone the user's repository
      const repoUrl = `https://github.com/${githubUsername}/${
        repoName || 'code-challenge-platform'
      }.git`;
      console.log(`Cloning ${repoUrl} into ${repoPath}`);

      const cloneResult = await this.runShellCommand(
        `git clone ${repoUrl} ${repoPath}`
      );
      if (cloneResult.exitCode !== 0) {
        throw new Error(`Failed to clone repository: ${cloneResult.stderr}`);
      }
      console.log('Repository cloned successfully.');

      // 4. Check Docker connection
      if (!this.isConnected) {
        const connected = await this.checkConnection();
        if (!connected) {
          return this.createErrorResult('Docker daemon is not running');
        }
      }

      // 5. Get language configuration
      const config = this.languageConfigs[language];
      if (!config) {
        return this.createErrorResult(
          `Unsupported language for Docker execution: ${language}.`
        );
      }

      // 6. Build the expected file path based on simplified GitHub structure
      // structure: /language/category/taskFolderName.ext
      // Example: C/strings/hello-world.c
      const languageDir = language === 'c' ? 'C' : 'Python';
      const ext = language === 'python' ? 'py' : 'c';

      // Extract task folder name from testScriptPath
      // Example: "C/strings/hello-world" → "hello-world"
      const taskFolderName =
        taskConfig.testScriptPath.split('/').pop() || `solution_${task.order}`;

      // Expected path: /languageDir/category/taskFolderName.ext
      const expectedFileName = `${taskFolderName}.${ext}`;
      const solutionPath = path.join(
        repoPath,
        languageDir,
        task.category,
        expectedFileName
      );

      // Check if file exists at expected path
      try {
        await fs.access(solutionPath);
        console.log(`✅ Found solution file at expected path: ${solutionPath}`);
      } catch (error) {
        // If not found, try fallback patterns
        console.log(
          `⚠️  File not found at ${solutionPath}, trying alternatives...`
        );

        // Try without category directory
        const fallbackPath = path.join(repoPath, languageDir, expectedFileName);
        try {
          await fs.access(fallbackPath);
          console.log(`✅ Found solution file at: ${fallbackPath}`);
        } catch (error2) {
          // Last resort: search recursively
          const findFile = async (
            dir: string,
            pattern: string
          ): Promise<string | null> => {
            try {
              const files = await fs.readdir(dir, { withFileTypes: true });

              for (const file of files) {
                const fullPath = path.join(dir, file.name);

                if (file.isDirectory()) {
                  const found = await findFile(fullPath, pattern);
                  if (found) return found;
                } else if (
                  file.name.includes(taskFolderName) &&
                  file.name.endsWith(`.${ext}`)
                ) {
                  return fullPath;
                }
              }
            } catch (error) {
              // Directory doesn't exist or can't be read
            }
            return null;
          };

          let solutionPath =
            (await findFile(
              path.join(repoPath, languageDir),
              taskFolderName
            )) || (await findFile(repoPath, taskFolderName));

          if (!solutionPath) {
            throw new Error(
              `Could not find solution file for task ${task.title}.\n` +
                `Expected structure: ${languageDir}/${task.category}/${taskFolderName}.${ext}\n` +
                `or: ${languageDir}/${taskFolderName}.${ext}`
            );
          }
          console.log(`✅ Found solution file via search: ${solutionPath}`);
        }
      }

      console.log(`Using solution file: ${solutionPath}`);

      // 7. Create a test directory with the required files
      const testDir = path.join(this.tempDir, `test-${Date.now()}`);
      await fs.mkdir(testDir, { recursive: true });

      // Copy the solution file to test directory
      const solutionContent = await fs.readFile(solutionPath, 'utf-8');
      await fs.writeFile(
        path.join(testDir, taskConfig.entryPoint),
        solutionContent
      );

      // Copy test script from seed-data/tasks/{testScriptPath}
      const testScriptFolder = path.join(
        __dirname,
        '../seed-data/tasks',
        taskConfig.testScriptPath
      );
      let testScriptSrc: string;
      let testScriptDest: string;

      if (language === 'c') {
        testScriptSrc = path.join(testScriptFolder, 'test_solution.sh');
        testScriptDest = path.join(testDir, 'test_solution.sh');
      } else if (language === 'python') {
        testScriptSrc = path.join(testScriptFolder, 'test_solution.py');
        testScriptDest = path.join(testDir, 'test_solution.py');
      } else {
        throw new Error(`Unsupported language: ${language}`);
      }

      // Verify test script exists
      if (!existsSync(testScriptSrc)) {
        throw new Error(
          `Test script not found: ${testScriptSrc}\nCheck task config.testScriptPath`
        );
      }

      // Copy and make executable (fs/promises methods are already async)
      await fs.copyFile(testScriptSrc, testScriptDest);
      await fs.chmod(testScriptDest, 0o755);

      // 8. Define container options - mount the test directory
      const containerOptions: ContainerCreateOptions = {
        Image: config.image,
        Tty: false,
        OpenStdin: false,
        HostConfig: {
          NetworkMode: 'none',
          Memory: taskConfig.memoryLimit
            ? taskConfig.memoryLimit * 1024 * 1024
            : 256 * 1024 * 1024,
          AutoRemove: true,
          SecurityOpt: ['no-new-privileges:true'],
          Binds: [`${testDir}:${config.workDir}:ro`], // Mount test directory
        },
        WorkingDir: config.workDir,
        Cmd: ['sh', '-c', testCommand], // Execute the test command
      };

      // 9. Create and run the container
      container = await this.docker.createContainer(containerOptions);
      await container.start();

      // 10. Collect output
      const output = await this.collectContainerOutput(
        container,
        '', // No stdin for tests
        taskTimeout || 10000
      );

      // 11. Get exit code
      const exitCode = await this.getContainerExitCode(container);

      const executionTime = Date.now() - startTime;

      return {
        success: exitCode === 0,
        exitCode,
        stdout: output.stdout,
        stderr: output.stderr,
        executionTime,
        timedOut: false,
      };
    } catch (error: any) {
      console.error('Error in runTestsFromRepo:', error);
      if (error.message.includes('timeout')) {
        return {
          success: false,
          exitCode: -1,
          stdout: '',
          stderr: `Execution timed out`,
          executionTime: Date.now() - startTime,
          timedOut: true,
        };
      }
      return this.createErrorResult(
        `Failed to run tests from repository: ${error.message}`
      );
    } finally {
      if (container) {
        await this.cleanupContainer(container);
      }
      // Clean up temporary directories
      if (repoPath) {
        try {
          await fs.rm(repoPath, { recursive: true, force: true });
          console.log(`Cleaned up cloned repository: ${repoPath}`);
        } catch (cleanupError) {
          console.error(`Failed to clean up ${repoPath}:`, cleanupError);
        }
      }
    }
  }

  /**
   * Prepare command based on language
   */
  private prepareCommand(
    language: string,
    code: string,
    config: LanguageConfig
  ): string[] {
    if (language === 'python') {
      // Python: Direct execution with -c flag
      return ['python', '-c', code];
    } else if (language === 'c') {
      // C: Use your heredoc compilation approach
      const cScript = `
        # Create unique filename to avoid conflicts
        TIMESTAMP=$(date +%s)
        SRC_FILE="/tmp/code_\${TIMESTAMP}.c"
        EXE_FILE="/tmp/exec_\${TIMESTAMP}"
        
        # Write C code to file using heredoc (handles quotes, newlines, etc.)
        cat > "\$SRC_FILE" << 'C_EOF'
${code}
C_EOF
        
        # Compile with gcc
        echo "Compiling C code..."
        gcc "\$SRC_FILE" -o "\$EXE_FILE" 2>&1
        
        if [ \$? -eq 0 ]; then
          echo "Compilation successful"
          chmod +x "\$EXE_FILE"
          "\$EXE_FILE"
          EXIT_CODE=\$?
        else
          echo "Compilation failed"
          EXIT_CODE=1
        fi
        
        # Cleanup
        rm -f "\$SRC_FILE" "\$EXE_FILE"
        exit \$EXIT_CODE
      `;

      return ['sh', '-c', cScript];
    }

    // Should never reach here (already validated)
    return [];
  }

  /**
   * Create and start a container
   */
  private async createAndRunContainer(
    config: LanguageConfig,
    command: string[],
    input: string
  ): Promise<Container> {
    const containerOptions: ContainerCreateOptions = {
      Image: config.image,
      Cmd: command,
      WorkingDir: config.workDir,
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
      OpenStdin: !!input,
      HostConfig: {
        NetworkMode: 'none',
        Memory: 256 * 1024 * 1024,
        MemorySwap: 512 * 1024 * 1024,
        CpuShares: 512,
        AutoRemove: true,
        SecurityOpt: ['no-new-privileges:true'],
      },
    };

    // Add Python-specific env
    if (!config.isCompiled) {
      containerOptions.Env = ['PYTHONUNBUFFERED=1'];
    }

    const container = await this.docker.createContainer(containerOptions);
    await container.start();

    return container;
  }

  /**
   * Collect output from container
   */
  private async collectContainerOutput(
    container: Container,
    input: string,
    timeoutMs: number
  ): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const stream = container.attach(
        {
          stream: true,
          stdout: true,
          stderr: true,
          stdin: !!input,
        },
        (err, stream) => {
          if (err) {
            reject(err);
            return;
          }

          let stdout = '';
          let stderr = '';
          let timeoutId: NodeJS.Timeout;

          timeoutId = setTimeout(() => {
            (stream as unknown as Readable).destroy();
            reject(new Error(`Timeout after ${timeoutMs}ms`));
          }, timeoutMs);

          // Send input if provided
          if (input && stream) {
            stream.write(input);
            stream.end();
          }

          // Collect output
          stream?.on('data', (chunk: Buffer) => {
            // Simple output collection (for now)
            stdout += chunk.toString();
          });

          stream?.on('end', () => {
            clearTimeout(timeoutId);
            resolve({ stdout, stderr });
          });

          stream?.on('error', (error) => {
            clearTimeout(timeoutId);
            reject(error);
          });
        }
      );
    });
  }

  /**
   * Get container exit code
   */
  private async getContainerExitCode(container: Container): Promise<number> {
    const result = await container.wait();
    return result.StatusCode;
  }

  /**
   * Cleanup container
   */
  private async cleanupContainer(container: Container): Promise<void> {
    try {
      await container.stop({ t: 1 }); // 1 second timeout
    } catch (error) {
      // Container might already be stopped
    }
  }

  /**
   * Helper to create error result
   */
  private createErrorResult(message: string): ExecutionResult {
    return {
      success: false,
      exitCode: -1,
      stdout: '',
      stderr: message,
      executionTime: 0,
      timedOut: false,
    };
  }

  /**
   * Check if language is supported
   */
  isLanguageSupported(language: string): boolean {
    return language in this.languageConfigs;
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return Object.keys(this.languageConfigs);
  }
}

export const dockerService = new DockerService();
export default dockerService;
