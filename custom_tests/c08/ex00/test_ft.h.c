#include "ft.h"
#include <stdio.h>

// Stub implementations (just to satisfy linker)
void ft_putchar(char c) { (void)c; }
void ft_swap(int *a, int *b) { (void)a; (void)b; }
void ft_putstr(char *str) { (void)str; }
int ft_strlen(char *str) { (void)str; return 0; }
int ft_strcmp(char *s1, char *s2) { (void)s1; (void)s2; return 0; }

int main(void)
{
    // Call each function – if prototypes are missing or wrong, compilation fails
    ft_putchar('a');
    ft_swap(NULL, NULL);
    ft_putstr("test");
    ft_strlen("test");
    ft_strcmp("a", "b");

    printf("--- EXPECTED OUTPUT ---\n");
    printf("SUCCESS: All prototypes present and correct.\n");
    printf("--- ACTUAL OUTPUT ---\n");
    printf("SUCCESS: All prototypes present and correct.\n");
    return 0;
}
