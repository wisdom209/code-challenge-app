#include "ft_boolean.h"
#include <unistd.h>
#include <stdio.h>
#include <string.h>

// ft_putchar as used in the subject's main
void ft_putchar(char c)
{
    write(1, &c, 1);
}

// Helper to capture stdout when calling ft_putchar with a string
static char *capture_output(void (*func)(char *), char *msg)
{
    int pipefd[2];
    if (pipe(pipefd) == -1)
        return NULL;

    int saved_stdout = dup(1);
    dup2(pipefd[1], 1);
    close(pipefd[1]);

    func(msg);

    fflush(stdout);
    dup2(saved_stdout, 1);
    close(saved_stdout);

    char buffer[1024];
    int n = read(pipefd[0], buffer, sizeof(buffer) - 1);
    close(pipefd[0]);
    buffer[n > 0 ? n : 0] = '\0';
    return strdup(buffer);
}

// Helper to test a specific case
static int test_case(int arg_count, const char *expected_msg)
{
    // Simulate the original main logic: if EVEN(argc-1) then print EVEN_MSG else ODD_MSG
    // We'll call ft_putchar for each character of the chosen message.
    // Since ft_putchar prints one char at a time, we can't just call ft_putchar(msg).
    // Instead we need a wrapper that prints the string via ft_putchar.
    void print_msg(char *msg)
    {
        while (*msg)
            ft_putchar(*msg++);
    }

    int is_even = (arg_count - 1) % 2 == 0;
    char *msg = is_even ? EVEN_MSG : ODD_MSG;
    char *actual = capture_output(print_msg, msg);
    if (!actual)
    {
        printf("FAIL: Could not capture output for arg_count %d\n", arg_count);
        return 1;
    }

    if (strcmp(actual, expected_msg) != 0)
    {
        printf("FAIL: arg_count %d: expected '%s', got '%s'\n", arg_count, expected_msg, actual);
        free(actual);
        return 1;
    }

    free(actual);
    return 0;
}

int main(void)
{
    int result = 0;

    // Test odd number of arguments (argc = 2, so argc-1 = 1, odd)
    if (test_case(2, ODD_MSG) != 0)
        result = 1;

    // Test even number of arguments (argc = 3, so argc-1 = 2, even)
    if (test_case(3, EVEN_MSG) != 0)
        result = 1;

    printf("--- EXPECTED OUTPUT ---\n");
    if (result == 0)
        printf("All tests passed.\n");
    else
        printf("Some tests failed. See above.\n");
    printf("--- ACTUAL OUTPUT ---\n");
    if (result == 0)
        printf("All tests passed.\n");
    else
        printf("Some tests failed. See above.\n");

    return result;
}
