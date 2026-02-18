import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeComponentProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

// Sample lesson content (in production, this would come from the backend or static files)
const SAMPLE_LESSONS: Record<string, string> = {
  'c-strings': `# Strings in C

## Introduction to Strings

In C, strings are represented as arrays of characters terminated by a null character (\`\\0\`). Unlike higher-level languages, C doesn't have a built-in string type.

## Declaring Strings

\`\`\`c
char str1[50] = "Hello, World!";
char str2[] = "Auto-sized";
char str3[20];
strcpy(str3, "Copied string");
\`\`\`

## Common String Functions

### strlen() - String Length
\`\`\`c
#include <string.h>
int len = strlen("Hello"); // Returns 5
\`\`\`

### strcpy() - String Copy
\`\`\`c
char dest[50];
strcpy(dest, "Source string");
\`\`\`

### strcat() - String Concatenation
\`\`\`c
char str[50] = "Hello";
strcat(str, " World"); // str is now "Hello World"
\`\`\`

### strcmp() - String Comparison
\`\`\`c
int result = strcmp("abc", "abc"); // Returns 0 (equal)
\`\`\`

## Best Practices

1. **Always ensure null termination**: C strings must end with \`\\0\`
2. **Avoid buffer overflow**: Use functions like \`strncpy\` instead of \`strcpy\`
3. **Check bounds**: Always verify array sizes before operations
4. **Use string.h**: Include the standard library for string operations

## Example: Reverse a String

\`\`\`c
#include <stdio.h>
#include <string.h>

void reverseString(char* str) {
    int len = strlen(str);
    for (int i = 0; i < len / 2; i++) {
        char temp = str[i];
        str[i] = str[len - 1 - i];
        str[len - 1 - i] = temp;
    }
}

int main() {
    char str[] = "Hello";
    reverseString(str);
    printf("%s\\n", str); // Outputs: olleH
    return 0;
}
\`\`\`

## Practice Challenges

Now that you understand strings in C, try these challenges:
- Implement a function to count vowels in a string
- Create a function to check if a string is a palindrome
- Write a program to find the longest word in a sentence
`,
  'python-basics': `# Python Basics

## Welcome to Python!

Python is a high-level, interpreted programming language known for its readability and simplicity.

## Variables and Data Types

\`\`\`python
# Numbers
age = 25
price = 19.99

# Strings
name = "Alice"
message = 'Hello World'

# Booleans
is_active = True
is_admin = False

# Lists
numbers = [1, 2, 3, 4, 5]
mixed = [1, "two", 3.0, True]
\`\`\`

## Basic Operations

### Arithmetic
\`\`\`python
result = 10 + 5   # Addition
result = 10 - 5   # Subtraction
result = 10 * 5   # Multiplication
result = 10 / 5   # Division
result = 10 ** 2  # Exponentiation
result = 10 // 3  # Floor division
result = 10 % 3   # Modulus
\`\`\`

### String Operations
\`\`\`python
greeting = "Hello" + " " + "World"  # Concatenation
repeated = "Hi" * 3                  # Repetition
length = len("Python")               # Length
\`\`\`

## Control Flow

### If Statements
\`\`\`python
age = 18

if age >= 18:
    print("Adult")
elif age >= 13:
    print("Teenager")
else:
    print("Child")
\`\`\`

### Loops
\`\`\`python
# For loop
for i in range(5):
    print(i)

# While loop
count = 0
while count < 5:
    print(count)
    count += 1
\`\`\`

## Functions

\`\`\`python
def greet(name):
    """Return a greeting message"""
    return f"Hello, {name}!"

def add_numbers(a, b):
    """Add two numbers and return the result"""
    return a + b

# Using functions
message = greet("Alice")
total = add_numbers(5, 3)
\`\`\`

## Practice Time!

Try these exercises:
1. Write a function to check if a number is even
2. Create a program to find the largest number in a list
3. Implement FizzBuzz
`,
};

export const LessonPage: React.FC = () => {
  const { language, category } = useParams<{
    language: string;
    category: string;
  }>();
  const [lessonContent, setLessonContent] = useState('');
  const lessonKey = `${language}-${category}`;

  useEffect(() => {
    // In production, fetch from backend
    // For now, use sample or show coming soon
    const content = SAMPLE_LESSONS[lessonKey];
    setLessonContent(
      content ||
        '# Coming Soon\n\nThis lesson is under construction. Check back later!'
    );
  }, [lessonKey]);


  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          to={`/languages/${language}/categories`}
          className="inline-flex items-center gap-2 text-neon-cyan hover:text-neon-cyan/80 font-mono mb-6 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Categories
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-5xl">📖</span>
          <div>
            <h1 className="text-4xl font-display font-bold text-white capitalize">
              {category?.replace(/-/g, ' ')} Lesson
            </h1>
            <p className="text-gray-400 font-mono text-sm mt-1">
              {language?.toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      {/* Lesson Content */}
      <div className="bg-dark-800 border-2 border-dark-700 rounded-lg p-8">
        <div className="prose prose-invert prose-lg max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Properly typed with CodeProps
              code({
                node,
                inline,
                className,
                children,
                ...props
              }: CodeComponentProps) {
                // Remove 'ref' if it accidentally appears in props (fixes the SyntaxHighlighter error)
                const { ref, ...codeProps } = props;

                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus as any}
                    language={match[1]}
                    PreTag="div"
                    {...codeProps} // spread without ref
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code
                    className="bg-dark-700 px-2 py-1 rounded text-neon-cyan font-mono text-sm"
                    {...codeProps} // spread without ref
                  >
                    {children}
                  </code>
                );
              },
              h1: ({ children }) => (
                <h1 className="text-4xl font-display font-bold text-white mb-6 mt-8">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-3xl font-display font-bold text-neon-cyan mb-4 mt-8">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-2xl font-display font-semibold text-neon-purple mb-3 mt-6">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="text-gray-300 font-mono text-base leading-relaxed mb-4">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside text-gray-300 font-mono mb-4 space-y-2">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside text-gray-300 font-mono mb-4 space-y-2">
                  {children}
                </ol>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="text-neon-cyan hover:text-neon-cyan/80 underline"
                >
                  {children}
                </a>
              ),
            }}
          >
            {lessonContent}
          </ReactMarkdown>
        </div>
      </div>

      {/* Practice CTA */}
      <div className="mt-8 bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10 border-2 border-neon-cyan/30 rounded-lg p-6">
        <h3 className="text-2xl font-display font-bold text-white mb-2">
          Ready to Practice?
        </h3>
        <p className="text-gray-400 font-mono mb-4">
          Apply what you've learned with hands-on challenges
        </p>
        <Link to={`/languages/${language}/${category}`}>
          <button className="px-6 py-3 bg-neon-cyan text-dark-950 font-display font-semibold rounded-lg hover:bg-neon-cyan/90 transition-colors">
            View Challenges →
          </button>
        </Link>
      </div>
    </div>
  );
};
