import axios, { AxiosInstance } from 'axios';
import {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  Task,
  ExecutionRequest,
  ExecutionResult,
  TestRequest,
  TestFromRepoRequest,
} from '../types';

// Define the standard API response wrapper from your backend
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class ApiService {
  private api: AxiosInstance;
  private baseURL = "http://localhost:3001/api";


  constructor() {
    this.api = axios.create({
      baseURL: '/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle 401 errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // --- Authentication ---
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const { data } = await this.api.post<AuthResponse>('/register', credentials);
    return data;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await this.api.post<AuthResponse>('/login', credentials);
    return data;
  }

  // --- Tasks ---
  
  // Backend: GET /tasks
  async getAllTasks(): Promise<Task[]> {
    const { data } = await this.api.get<ApiResponse<Task[]>>('/tasks');
    return data.data; 
  }

  // Backend: GET /tasks?language=python (Query Param, not URL param)
  async getTasksByLanguage(language: string): Promise<Task[]> {
    const { data } = await this.api.get<ApiResponse<Task[]>>('/tasks', {
      params: { language }
    });
    return data.data;
  }

  // Backend: GET /tasks?language=python&category=strings
  async getTasksByCategory(language: string, category: string): Promise<Task[]> {
    const { data } = await this.api.get<ApiResponse<Task[]>>('/tasks', {
      params: { language, category }
    });
    return data.data;
  }

  // Backend: GET /tasks/:id
  async getTaskById(id: string): Promise<Task> {
    const { data } = await this.api.get<ApiResponse<Task>>(`/tasks/${id}`);
    return data.data;
  }

  // --- Code Execution ---

  // Backend: POST /docker/run-inline (For raw code execution in editor)
  async executeCode(request: ExecutionRequest): Promise<ExecutionResult> {
    const { data } = await this.api.post<ApiResponse<ExecutionResult>>('/docker/run-inline', request);
    return data.data || (data as any); // Handle cases where data might not be wrapped
  }

  // NOTE: The backend currently lacks a "Run Test Cases" endpoint for raw code.
  // We map this to run-inline for now so the button works, 
  // but it won't validate against hidden test cases yet.
  async runTests(request: TestRequest): Promise<ExecutionResult> {
    // Transforming request to match /docker/run-inline expectation
    const payload = {
      language: request.language,
      code: request.code,
      input: '' 
    };
    // Using run-inline endpoint from dockerRoutes.ts
    const { data } = await this.api.post<ApiResponse<any>>('/docker/run-inline', payload);
    
    // Transform backend response to match ExecutionResult interface
    return {
      success: data.success || (data as any).success, // handle unwrapped response
      exitCode: (data as any).execution?.exitCode ?? 0,
      stdout: (data as any).execution?.stdout || '',
      stderr: (data as any).execution?.stderr || '',
      executionTime: (data as any).execution?.executionTime || 0,
      timedOut: (data as any).execution?.timedOut || false
    };
  }

  // Backend: POST /run (For running from GitHub Repo)
  async runTestsFromRepo(request: TestFromRepoRequest): Promise<ExecutionResult> {
    const { data } = await this.api.post<ApiResponse<any>>('/run', {
      taskId: request.taskId,
      language: request.language,
      repoName: 'code-challenge-platform', // defaulting as per backend logic
      githubUsername: request.githubUsername
    });
    
    return {
      success: data.success,
      exitCode: (data as any).execution?.exitCode ?? 0,
      stdout: (data as any).execution?.stdout || '',
      stderr: (data as any).execution?.stderr || '',
      executionTime: (data as any).execution?.executionTime || 0,
      timedOut: (data as any).execution?.timedOut || false
    };
  }


  async post(endpoint: string, data: any): Promise<any> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  /**
   * Generic GET request
   */
  async get(endpoint: string): Promise<any> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  /**
   * Generic PUT request
   */
  async put(endpoint: string, data: any): Promise<any> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  /**
   * Generic DELETE request
   */
  async delete(endpoint: string): Promise<any> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  /**
   * Get authorization headers
   */
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }
}

export const apiService = new ApiService();
export default apiService;

