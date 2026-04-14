#include "ft_abs.h"
#include <stdio.h>

static int test_abs(int input, int expected)
{
    int result = ABS(input);
    if (result != expected)
    {
        printf("FAIL: ABS(%d) returned %d, expected %d\n", input, result, expected);
        return 1;
    }
    return 0;
}

int main(void)
{
    int failures = 0;

    failures += test_abs(5, 5);
    failures += test_abs(-3, 3);
    failures += test_abs(0, 0);
    failures += test_abs(-2147483648, 2147483648);
    failures += test_abs(2147483647, 2147483647);

    // Complex expression test
    int x = -10, y = 20;
    if (ABS(x + y) != 10)
    {
        printf("FAIL: ABS(x + y) where x=-10, y=20: got %d, expected 10\n", ABS(x + y));
        failures++;
    }

    printf("--- EXPECTED OUTPUT ---\n");
    if (failures == 0)
        printf("All tests passed.\n");
    else
        printf("Some tests failed. See above.\n");
    printf("--- ACTUAL OUTPUT ---\n");
    if (failures == 0)
        printf("All tests passed.\n");
    else
        printf("Some tests failed. See above.\n");

    return (failures == 0) ? 0 : 1;
}
