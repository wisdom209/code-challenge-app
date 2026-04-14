#include "ft_point.h"
#include <stdio.h>

void set_point(t_point *point)
{
    point->x = 42;
    point->y = 21;
}

int main(void)
{
    t_point point;
    set_point(&point);

    if (point.x != 42 || point.y != 21)
    {
        printf("FAIL: point.x = %d (expected 42), point.y = %d (expected 21)\n", point.x, point.y);
        return 1;
    }

    printf("--- EXPECTED OUTPUT ---\n");
    printf("All tests passed.\n");
    printf("--- ACTUAL OUTPUT ---\n");
    printf("All tests passed.\n");
    return 0;
}
