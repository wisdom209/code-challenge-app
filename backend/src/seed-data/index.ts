import { readFileSync } from 'fs';
import { join } from 'path';

const SEED_DATA_DIR = join(__dirname, 'tasks');

// Helper to read description files
const readDescription = (lang: string, category: string, taskFolder: string): string => {
  return readFileSync(
    join(SEED_DATA_DIR, lang, category, taskFolder, 'description.md'),
    'utf-8'
  );
};

export const sampleTasks = [
  // C Tasks
  {
    title: 'Hello World in C',
    description: readDescription('C', 'strings', 'hello_world'),
    category: 'strings',
    difficulty: 'easy' as const,
    tags: ['c', 'beginner', 'output'],
    points: 10,
    order: 1,
    isActive: true,
  estimatedTime: 10,
    configs: [{
      language: 'c',
      entryPoint: 'hello_world.c',
      testCommand: 'bash test_solution.sh',
      timeout: 10000,
      memoryLimit: 128,
      testScriptPath: 'C/strings/hello_world', 
      testCases: [{
        input: '',
        expectedOutput: 'Hello, World!',
        isHidden: false,
        description: 'Standard output'
      }]
    }]
  },
  {
    title: 'Reverse a String in C',
    description: readDescription('C', 'strings', 'reverse_a_string'),
    category: 'strings',
    difficulty: 'medium' as const,
    tags: ['c', 'strings', 'algorithms'],
    points: 20,
    order: 2,
    isActive: true,
  estimatedTime: 10,
    configs: [{
      language: 'c',
      entryPoint: 'reverse_a_string.c',
      testCommand: 'bash test_solution.sh',
      timeout: 10000,
      memoryLimit: 128,
       testScriptPath: 'C/strings/reverse_a_string', 
      testCases: [
        { input: 'hello', expectedOutput: 'olleh', isHidden: false, description: 'Basic reversal' },
        { input: 'Python', expectedOutput: 'nohtyP', isHidden: false, description: 'Mixed case' },
        { input: '', expectedOutput: '', isHidden: true, description: 'Empty string' },
        { input: 'a', expectedOutput: 'a', isHidden: true, description: 'Single character' }
      ]
    }]
  },
  
  // Python Tasks
  {
    title: 'Reverse a String in Python',
    description: readDescription('Python', 'strings', 'reverse_a_string'),
    category: 'strings',
    difficulty: 'easy' as const,
    tags: ['python', 'strings', 'beginner'],
    points: 15,
    order: 1,
    isActive: true,
  estimatedTime: 10,
    configs: [{
      language: 'python',
      entryPoint: 'reverse_a_string.py',
      testCommand: 'python test_solution.py',
      timeout: 10000,
      memoryLimit: 128,
      testScriptPath: 'Python/strings/reverse_a_string',
      testCases: [
        { input: 'hello', expectedOutput: 'olleh', isHidden: false, description: 'Basic reversal' },
        { input: 'Python', expectedOutput: 'nohtyP', isHidden: false, description: 'Mixed case' }
      ]
    }]
  },
  {
    title: 'Add Two Numbers in Python',
    description: readDescription('Python', 'mathematics', 'add_two_numbers'),
    category: 'mathematics',
    difficulty: 'easy' as const,
    tags: ['python', 'mathematics', 'beginner'],
    points: 15,
    order: 1,
    isActive: true,
  estimatedTime: 10,
    configs: [{
      language: 'python',
      entryPoint: 'add_two_numbers.py',
      testCommand: 'python test_solution.py',
      timeout: 10000,
      memoryLimit: 128,
      testScriptPath: 'Python/mathematics/add_two_numbers', 
      testCases: [
        { input: '5,3', expectedOutput: '8', isHidden: false, description: 'Positive numbers' },
        { input: '-5,5', expectedOutput: '0', isHidden: false, description: 'Negative + positive' }
      ]
    }]
  }
];
