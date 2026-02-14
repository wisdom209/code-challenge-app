# Reverse a String in C

Implement a function that reverses a string and returns it.

## Requirements
- Implement: `char* reverseString(const char str[])`
- Return a newly allocated reversed string
- Do NOT modify the input string (it's const)
- Do NOT write a `main()` function
- Do NOT use `printf()` or any I/O
- Just implement the reversal logic

## Function Signature
```c
char* reverseString(const char str[]);
```

Notes
Input string is null-terminated and const (read-only)
Return a newly allocated string (caller will free it)
Handle empty strings (return empty string or NULL)
Maximum string length: 100 characters
Remember to include <string.h> and <stdlib.h> for strlen and malloc
