#include <stdio.h>
#include <stdlib.h>
#include <string.h>

char **ft_split(char *str, char *charset);

void free_split(char **tab)
{
    int i = 0;
    if (!tab) return;
    while (tab[i])
        free(tab[i++]);
    free(tab);
}

int count_tab(char **tab)
{
    int i = 0;
    while (tab && tab[i]) i++;
    return (i);
}

int validate(char *test_name, char **got, char **expected)
{
    int i = 0;
    int got_len = count_tab(got);
    int exp_len = count_tab(expected);

    if (got_len != exp_len)
    {
        printf("❌ %s: FAILED (Length mismatch. Expected %d, got %d)\n", test_name, exp_len, got_len);
        return (0);
    }
    while (i < exp_len)
    {
        if (strcmp(got[i], expected[i]) != 0)
        {
            printf("❌ %s: FAILED\n   Expected [%d]: \"%s\"\n   Got      [%d]: \"%s\"\n", 
                    test_name, i, expected[i], i, got[i]);
            return (0);
        }
        i++;
    }
    printf("✅ %s: PASSED\n", test_name);
    return (1);
}

int main(void)
{
    int all_passed = 1;

    // Test 1: Standard
    {
        char *exp[] = {"Hello", "world", NULL};
        char **got = ft_split("Hello world", " ");
        if (!validate("Standard Split", got, exp)) all_passed = 0;
        free_split(got);
    }

    // Test 2: Multiple delimiters
    {
        char *exp[] = {"Split", "this", "string", NULL};
        char **got = ft_split("---Split---this--string---", "-");
        if (!validate("Consecutive Delimiters", got, exp)) all_passed = 0;
        free_split(got);
    }

    // Test 3: Empty String
    {
        char *exp[] = {NULL};
        char **got = ft_split("", "abc");
        if (!validate("Empty String", got, exp)) all_passed = 0;
        free_split(got);
    }

    // Test 4: Only delimiters
    {
        char *exp[] = {NULL};
        char **got = ft_split("$$$$", "$");
        if (!validate("Only Delimiters", got, exp)) all_passed = 0;
        free_split(got);
    }

    if (all_passed)
    {
        printf("\nALL TESTS PASSED! 🌟\n");
        return (0);
    }
    else
    {
        printf("\nSOME TESTS FAILED. ⚠️\n");
        return (1);
    }
}
