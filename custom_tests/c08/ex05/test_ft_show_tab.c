#include "ft_stock_str.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

// Helper to capture stdout
static char *capture_stdout(void (*func)(t_stock_str *), t_stock_str *arr)
{
    int pipefd[2];
    if (pipe(pipefd) == -1)
        return NULL;

    int saved_stdout = dup(1);
    dup2(pipefd[1], 1);
    close(pipefd[1]);

    func(arr);

    fflush(stdout);
    dup2(saved_stdout, 1);
    close(saved_stdout);

    char buffer[4096];
    int n = read(pipefd[0], buffer, sizeof(buffer) - 1);
    close(pipefd[0]);
    buffer[n > 0 ? n : 0] = '\0';
    return strdup(buffer);
}

int main(void)
{
    // Build a test array (like ft_strs_to_tab would produce)
    t_stock_str test[] = {
        {5, "Hello", strdup("Hello")},
        {2, "42", strdup("42")},
        {5, "world", strdup("world")},
        {0, NULL, NULL}
    };

    char *output = capture_stdout(ft_show_tab, test);
    if (!output)
    {
        printf("FAIL: Could not capture output\n");
        return 1;
    }

    // Expected output format: string\nsize\ncopy\n for each element
    char expected[] = "Hello\n5\nHello\n42\n2\n42\nworld\n5\nworld\n";

    if (strcmp(output, expected) != 0)
    {
        printf("FAIL: Output mismatch\n");
        printf("Expected:\n%s\n", expected);
        printf("Got:\n%s\n", output);
        free(output);
        return 1;
    }

    free(output);

    // Clean up
    for (int i = 0; i < 3; i++)
        free(test[i].copy);

    // Success
    printf("--- EXPECTED OUTPUT ---\n");
    printf("All tests passed.\n");
    printf("--- ACTUAL OUTPUT ---\n");
    printf("All tests passed.\n");
    return 0;
}
