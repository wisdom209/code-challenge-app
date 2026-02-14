#!/bin/bash

# Create the test runner C program
cat > /tmp/test_runner.c << 'EOF'
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#define MAX_LEN 101

// Forward declaration - user's function
char* reverseString(const char str[]);

// Test function
void run_test(const char* input, const char* expected, const char* desc, int* passed, int* failed) {
    char* result = reverseString(input);
    
    if (result == NULL && strlen(expected) == 0) {
        // Accept NULL for empty string
        printf("✅ %s\n", desc);
        (*passed)++;
        return;
    }
    
    if (result == NULL) {
        printf("❌ %s\n", desc);
        printf("   Input: '%s'\n", input);
        printf("   Expected: '%s'\n", expected);
        printf("   Got: NULL\n");
        (*failed)++;
        return;
    }
    
    if (strcmp(result, expected) == 0) {
        printf("✅ %s\n", desc);
        (*passed)++;
    } else {
        printf("❌ %s\n", desc);
        printf("   Input: '%s'\n", input);
        printf("   Expected: '%s'\n", expected);
        printf("   Got: '%s'\n", result);
        (*failed)++;
    }
    
    // Clean up allocated memory
    free(result);
}

int main() {
    int passed = 0;
    int failed = 0;
    
    run_test("hello", "olleh", "Basic reversal", &passed, &failed);
    run_test("Python", "nohtyP", "Mixed case", &passed, &failed);
    run_test("", "", "Empty string", &passed, &failed);
    run_test("a", "a", "Single character", &passed, &failed);
    run_test("racecar", "racecar", "Palindrome", &passed, &failed);
    
    printf("\nResults: %d passed, %d failed\n", passed, failed);
    
    return failed == 0 ? 0 : 1;
}
EOF

# Compile user's solution with test runner
gcc -c reverse_a_string.c -o /tmp/user_solution.o 2>&1
if [ $? -ne 0 ]; then
    echo "FAIL: Compilation of reverse_a_string.c failed"
    exit 1
fi

betty reverse_a_string.c
if [ $? -ne 0 ]; then
  echo "FAIL: Betty linter failed. Check your coding style!"
  exit 1
else
  echo "✅ PASS: Betty linter ok."
fi

gcc /tmp/test_runner.c /tmp/user_solution.o -o /tmp/test_runner 2>&1
if [ $? -ne 0 ]; then
    echo "FAIL: Linking failed"
    rm -f /tmp/user_solution.o
    exit 1
fi

# Run tests
/tmp/test_runner
EXIT_CODE=$?

# Cleanup
rm -f /tmp/test_runner /tmp/test_runner.c /tmp/user_solution.o

exit $EXIT_CODE
