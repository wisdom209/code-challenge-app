/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   test_ft_ultimate_range.c                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: wisdom <ononiwuwisdom@gmail.com>           +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/03/28 13:21:41 by wisdom            #+#    #+#             */
/*   Updated: 2026/03/28 13:23:16 by wisdom           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

/* ************************************************************************** */
/*                                test_ft_ultimate_range.c                    */
/* ************************************************************************** */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <limits.h>

/* Prototype of the function to test */
int ft_ultimate_range(int **range, int min, int max);

/* -------------------------------------------------------------------------- */
/*                               Helper functions                             */
/* -------------------------------------------------------------------------- */

/**
 * Compares two integer arrays of given size.
 * Returns 1 if identical, 0 otherwise.
 */
static int compare_arrays(const int *a, const int *b, int size)
{
	for (int i = 0; i < size; i++)
	{
		if (a[i] != b[i])
			return 0;
	}
	return 1;
}

/**
 * Prints a test result.
 */
static void print_result(const char *test_name, int success)
{
	printf("[%s] %s\n", success ? "OK" : "KO", test_name);
}

/* -------------------------------------------------------------------------- */
/*                               Test cases                                   */
/* -------------------------------------------------------------------------- */

/**
 * Basic test: min < max, normal range.
 */
static int test_basic(void)
{
	int *range = NULL;
	int min = 5, max = 10;
	int expected[] = {5, 6, 7, 8, 9};
	int expected_size = max - min;

	int size = ft_ultimate_range(&range, min, max);
	if (size != expected_size)
	{
		return 0;
	}
	if (range == NULL)
		return 0;
	if (!compare_arrays(range, expected, size))
		return 0;
	free(range);
	return 1;
}

/**
 * Range of exactly one element.
 */
static int test_one_element(void)
{
	int *range = NULL;
	int min = 42, max = 43;
	int expected[] = {42};
	int expected_size = 1;

	int size = ft_ultimate_range(&range, min, max);
	if (size != expected_size)
		return 0;
	if (range == NULL)
		return 0;
	if (!compare_arrays(range, expected, size))
		return 0;
	free(range);
	return 1;
}

/**
 * Negative values: min negative, max positive.
 */
static int test_negative_positive(void)
{
	int *range = NULL;
	int min = -5, max = 3;
	int expected[] = {-5, -4, -3, -2, -1, 0, 1, 2};
	int expected_size = max - min;

	int size = ft_ultimate_range(&range, min, max);
	if (size != expected_size)
		return 0;
	if (range == NULL)
		return 0;
	if (!compare_arrays(range, expected, size))
		return 0;
	free(range);
	return 1;
}

/**
 * Large but manageable range (0 to 9999). We only verify size and a few values.
 */
static int test_large_range(void)
{
	int *range = NULL;
	int min = 0, max = 10000;
	int expected_size = max - min;

	int size = ft_ultimate_range(&range, min, max);
	if (size != expected_size)
		return 0;
	if (range == NULL)
		return 0;
	/* Spot check first, middle, last elements */
	if (range[0] != 0 || range[5000] != 5000 || range[9999] != 9999)
		return 0;
	free(range);
	return 1;
}

/**
 * Boundary values near INT_MIN and INT_MAX (small range to avoid overflow).
 */
static int test_int_boundaries(void)
{
	int *range = NULL;
	int min = INT_MAX - 3, max = INT_MAX;
	int expected[] = {INT_MAX - 3, INT_MAX - 2, INT_MAX - 1};
	int expected_size = max - min;

	int size = ft_ultimate_range(&range, min, max);
	if (size != expected_size)
		return 0;
	if (range == NULL)
		return 0;
	if (!compare_arrays(range, expected, size))
		return 0;
	free(range);

	/* Test near INT_MIN */
	range = NULL;
	min = INT_MIN;
	max = INT_MIN + 4;
	int expected2[] = {INT_MIN, INT_MIN + 1, INT_MIN + 2, INT_MIN + 3};
	expected_size = max - min;

	size = ft_ultimate_range(&range, min, max);
	if (size != expected_size)
		return 0;
	if (range == NULL)
		return 0;
	if (!compare_arrays(range, expected2, size))
		return 0;
	free(range);
	return 1;
}

/**
 * Error case: min >= max. Must return -1 and set *range to NULL.
 */
static int test_min_ge_max(void)
{
	int *range = (int *)0xdeadbeef; /* arbitrary non‑NULL pointer */
	int size;

	/* min == max */
	size = ft_ultimate_range(&range, 10, 10);
	if (size != -1 || range != NULL)
		return 0;

	/* min > max */
	range = (int *)0xdeadbeef;
	size = ft_ultimate_range(&range, 20, 10);
	if (size != -1 || range != NULL)
		return 0;

	return 1;
}

/**
 * Additional error: min and max such that max - min exceeds INT_MAX.
 * The function should return -1 because the size cannot be represented as int.
 * (This is a reasonable expectation, though not explicitly required.)
 */
static int test_overflow_size(void)
{
	int *range = NULL;
	int min = INT_MIN;
	int max = INT_MAX;

	int size = ft_ultimate_range(&range, min, max);
	/* If the implementation is careful, it will detect overflow and return -1.
	   We don't check *range because the spec is silent on allocation failures. */
	if (size != -1)
		return 0;
	/* We cannot reliably free range here (it may be NULL or a leaked pointer),
	   but the implementation should not leak.  In a real test environment,
	   a memory leak checker (like Valgrind) would be used. */
	return 1;
}

/* -------------------------------------------------------------------------- */
/*                               Main test runner                             */
/* -------------------------------------------------------------------------- */

int main(void)
{
	int passed = 0;
	int total = 0;

	/* List of test functions */
	struct
	{
		const char *name;
		int (*func)(void);
	} tests[] = {
		{"Basic range (5-9)", test_basic},
		{"One element (42)", test_one_element},
		{"Negative to positive (-5..2)", test_negative_positive},
		{"Large range (0-9999)", test_large_range},
		{"Near INT_MIN / INT_MAX", test_int_boundaries},
		{"min >= max (errors)", test_min_ge_max},
		{"Overflow size (INT_MIN to INT_MAX)", test_overflow_size},
		{NULL, NULL}};

	for (int i = 0; tests[i].name != NULL; i++)
	{
		int ok = tests[i].func();
		print_result(tests[i].name, ok);
		total++;
		if (ok)
			passed++;
	}

	printf("\nSummary: %d / %d tests passed.\n", passed, total);
	return (passed == total) ? 0 : 1;
}
