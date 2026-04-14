#include "ft_stock_str.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Prototype of the student's function
t_stock_str *ft_strs_to_tab(int ac, char **av);

static void check_str(const char *actual, const char *expected, const char *msg)
{
    if ((actual == NULL && expected != NULL) ||
        (actual != NULL && expected == NULL) ||
        (actual != NULL && expected != NULL && strcmp(actual, expected) != 0))
    {
        printf("FAIL: %s\n", msg);
        printf("       expected: '%s'\n", expected ? expected : "(null)");
        printf("       got:      '%s'\n", actual ? actual : "(null)");
        exit(1);
    }
}

int main(void)
{
    // Test data
    char *av[] = {"Hello", "42", "world", NULL};
    int ac = 3;

    // Call the student's function
    t_stock_str *arr = ft_strs_to_tab(ac, av);
    if (!arr)
    {
        printf("FAIL: ft_strs_to_tab returned NULL\n");
        return 1;
    }

    // Verify each element
    for (int i = 0; i < ac; i++)
    {
        char msg[64];
        snprintf(msg, sizeof(msg), "element %d", i);
        check_str(arr[i].str, av[i], msg);
        check_str(arr[i].copy, av[i], msg);

        int expected_size = (int)strlen(av[i]);
        if (arr[i].size != expected_size)
        {
            printf("FAIL: size mismatch for element %d\n", i);
            printf("       expected: %d, got: %d\n", expected_size, arr[i].size);
            exit(1);
        }

        // Ensure the copy is a distinct memory allocation (optional)
        if (arr[i].copy != arr[i].str && arr[i].copy != NULL && arr[i].str != NULL)
        {
            // Good: they are separate pointers
        }
        else if (arr[i].copy == arr[i].str && arr[i].str != NULL)
        {
            printf("FAIL: copy points to same memory as str (should be a copy)\n");
            exit(1);
        }
    }

    // Check sentinel
    if (arr[ac].str != NULL)
    {
        printf("FAIL: sentinel not NULL (str = %p)\n", (void*)arr[ac].str);
        return 1;
    }

    // Free the allocated memory
    for (int i = 0; i < ac; i++)
        free(arr[i].copy);
    free(arr);

    // Success
    printf("--- EXPECTED OUTPUT ---\n");
    printf("All tests passed.\n");
    printf("--- ACTUAL OUTPUT ---\n");
    printf("All tests passed.\n");
    return 0;
}
