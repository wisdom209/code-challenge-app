// User and Authentication Types
export interface User {
  _id: string;
  username: string;
  email: string;
  progress: UserProgress[];
  createdAt: string;
  role: 'user' | 'admin' | 'super_admin';
}

export interface UserProgress {
  taskId: string;
  completed: boolean;
  attemptCount: number;
  lastAttempt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  securityQuestion: string;
  securityAnswer: string;
}

// Task Types
export interface Task {
  _id: string;
  title: string;
  slug: string;
  configs: [{ language: string; entryPoint: string }];
  category: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  starterCode: string;
  testScriptPath: string;
  entryPoint: string;
  createdAt: string;
}

export interface TaskCategory {
  category: string;
  count: number;
  tasks: Task[];
}

// Code Execution Types
export interface ExecutionRequest {
  language: string;
  code: string;
  input?: string;
}

export interface ExecutionResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  executionTime: number;
  timedOut: boolean;
}

export interface TestRequest {
  taskId: string;
  code: string;
  language: string;
}

export interface TestFromRepoRequest {
  taskId: string;
  githubUsername: string;
  language: string;
}

// UI State Types
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export type Language = 'python' | 'c';

export interface LanguageInfo {
  id: Language;
  name: string;
  icon: string;
  color: string;
  description: string;
}

// ADD THESE NEW INTERFACES AT THE END OF THE FILE
export interface AdminTestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  description: string;
}

export interface AdminTaskConfig {
  language: string;
  entryPoint: string;
  testCommand: string;
  timeout: number;
  memoryLimit: number;
  testScriptPath: string;
  testCases: AdminTestCase[];
}

export interface AdminTask {
  _id?: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  points: number;
  order: number;
  estimatedTime: number;
  isActive: boolean;
  configs: AdminTaskConfig[];
  createdAt?: string;
  updatedAt?: string;
}

