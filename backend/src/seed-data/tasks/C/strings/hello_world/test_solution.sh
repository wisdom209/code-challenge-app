#!/bin/bash
gcc hello_world.c -o /tmp/test_solution 2>&1
if [ $? -ne 0 ]; then
  echo "FAIL: Compilation failed"
  exit 1
fi

betty hello_world.c

if [ $? -ne 0 ]; then
  echo "FAIL: Betty linter failed. Check your coding style!"
  exit 1
else
  echo "✅ PASS: Betty linter ok."
fi

OUTPUT=$(/tmp/test_solution 2>&1)
rm -f /tmp/test_solution

if echo "$OUTPUT" | grep -q "Hello, World!"; then
  echo "✅ PASS: Output contains 'Hello, World!'"
  exit 0
else
  echo "❌ FAIL: Expected 'Hello, World!' but got:"
  echo "$OUTPUT"
  exit 1
fi
