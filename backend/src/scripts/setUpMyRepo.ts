import { promises as fs } from 'fs';
import path from 'path';

async function setupMyRepo() {
  console.log('📁 Setting up example repository structure...\n');
  
  const baseDir = path.join(process.cwd(), 'code-challenge-platform');
  
  // Create directory structure
  const dirs = [
    'C/basic',
    'C/intermediate',
    'C/advanced',
    'Python/basic',
    'Python/algorithms',
    'Python/data_structures'
  ];

  for (const dir of dirs) {
    await fs.mkdir(path.join(baseDir, dir), { recursive: true });
    console.log(`Created: ${dir}/`);
  }

  // Create example Python solution
  const pythonSolution = `# Python/basic/solution.py
print("Hello from my Python solution!")
`;

  await fs.writeFile(path.join(baseDir, 'Python/basic/solution.py'), pythonSolution);
  console.log('Created: Python/basic/solution.py');

  // Create example C solution
  const cSolution = `// C/basic/task_1.c
#include <stdio.h>

int main() {
    printf("Hello from my C solution!\\n");
    return 0;
}
`;

  await fs.writeFile(path.join(baseDir, 'C/basic/task_1.c'), cSolution);
  console.log('Created: C/basic/task_1.c');

  // Create a README
  const readme = `# Code Challenge Platform Solutions

This repository contains my solutions for the code challenge platform.

## Structure
- \`C/\` - C language solutions
- \`Python/\` - Python language solutions

## How to use with the platform
1. The backend will look for solution files in these directories
2. For Python tasks, create \`solution.py\` in appropriate directory
3. For C tasks, create \`task_1.c\` or similar in appropriate directory

## Task matching
The platform will:
1. Clone this repository
2. Search for solution files in C/ and Python/ directories
3. Copy them to test directory
4. Run the tests

## Tips
- Keep your solution files in the correct language directory
- Name files appropriately (solution.py for Python, task_1.c for C)
- Test locally before pushing
`;

  await fs.writeFile(path.join(baseDir, 'README.md'), readme);
  console.log('Created: README.md');

  console.log('\n✅ Repository structure created at:', baseDir);
  console.log('\n📋 Next steps:');
  console.log('  1. Create a GitHub repository');
  console.log('  2. Push this structure to GitHub:');
  console.log(`     cd ${baseDir}`);
  console.log('     git init');
  console.log('     git add .');
  console.log('     git commit -m "Initial commit"');
  console.log('     git remote add origin https://github.com/YOUR-USERNAME/code-challenge-platform.git');
  console.log('     git push -u origin main');
  console.log('  3. Test with: npx ts-node src/scripts/testWithMyRepo.ts YOUR-USERNAME');
}

setupMyRepo();
