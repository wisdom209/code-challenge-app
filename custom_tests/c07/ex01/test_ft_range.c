#include <stdio.h>
#include <stdlib.h>

// Your prototype
int *ft_range(int min, int max);

void print_test(int min, int max, int test_num)
{
	int *res;
	int size = max - min;

	printf("Test %d: range(%d, %d) | Expected Size: %d\n", test_num, min, max, size > 0 ? size : 0);

	res = ft_range(min, max);

	if (min >= max)
	{
		if (res == NULL)
			printf("✅ Success: Returned NULL for invalid range.\n");
		else
			printf("❌ Failure: Expected NULL, but got a pointer.\n");
	}
	else if (res == NULL)
	{
		printf("❌ Failure: Returned NULL but expected an array.\n");
	}
	else
	{
		int i = 0;
		int error = 0;
		while (i < size)
		{
			if (res[i] != min + i)
			{
				printf("❌ Error at index %d: Expected %d, got %d\n", i, min + i, res[i]);
				error = 1;
				break;
			}
			i++;
		}
		if (!error)
			printf("✅ Success: Array contains all correct values.\n");

		free(res); // Important to prevent leaks! 💧
	}
	printf("------------------------------------------\n");
}

int main(void)
{
	printf("--- Starting ft_range Tests ---\n\n");

	// Test 1: Standard positive range
	print_test(5, 10, 1);

	// Test 2: Range involving negative numbers
	print_test(-3, 2, 2);

	// Test 3: Large range
	print_test(0, 100, 3);

	// Test 4: min equals max (Should return NULL)
	print_test(10, 10, 4);

	// Test 5: min greater than max (Should return NULL)
	print_test(20, 10, 5);

	// Test 6: Minimum and Maximum integer limits (Careful with overflow!)
	print_test(-2147483648, -2147483646, 6);

	return (0);
}
