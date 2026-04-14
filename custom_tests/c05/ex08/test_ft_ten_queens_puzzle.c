#define _POSIX_C_SOURCE 200112L
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <stdlib.h>

// Student's function
int ft_ten_queens_puzzle(void);

// ---------- Reference implementation (exact expected behaviour) ----------
static int ref_count;
static int ref_board[10];

static void ref_print_solution(void)
{
	for (int i = 0; i < 10; i++)
	{
		char c = ref_board[i] + '0';
		write(1, &c, 1);
	}
	write(1, "\n", 1);
}

static int ref_is_safe(int col, int row)
{
	for (int i = 0; i < col; i++)
	{
		if (ref_board[i] == row)
			return (0);
		if (ref_board[i] - i == row - col)
			return (0);
		if (ref_board[i] + i == row + col)
			return (0);
	}
	return (1);
}

static void ref_solve(int col)
{
	if (col == 10)
	{
		ref_print_solution();
		ref_count++;
		return;
	}
	for (int row = 0; row < 10; row++)
	{
		if (ref_is_safe(col, row))
		{
			ref_board[col] = row;
			ref_solve(col + 1);
		}
	}
}

static int ref_ten_queens_puzzle(void)
{
	ref_count = 0;
	ref_solve(0);
	return (ref_count);
}
// -------------------------------------------------------------------------

int main(void)
{
	// ----- Capture student output -----
	FILE *student_tmp = tmpfile();
	if (!student_tmp)
	{
		perror("tmpfile");
		return (1);
	}
	int student_fd = fileno(student_tmp);

	fflush(stdout);
	int saved_stdout = dup(STDOUT_FILENO);
	dup2(student_fd, STDOUT_FILENO);

	int student_ret = ft_ten_queens_puzzle();
	fflush(stdout);

	dup2(saved_stdout, STDOUT_FILENO);
	close(saved_stdout);

	rewind(student_tmp);
	char student_buffer[10000] = {0};
	size_t student_len = fread(student_buffer, 1, sizeof(student_buffer) - 1, student_tmp);
	student_buffer[student_len] = '\0';
	fclose(student_tmp);

	// ----- Capture reference output -----
	FILE *ref_tmp = tmpfile();
	if (!ref_tmp)
	{
		perror("tmpfile");
		return (1);
	}
	int ref_fd = fileno(ref_tmp);

	fflush(stdout);
	saved_stdout = dup(STDOUT_FILENO);
	dup2(ref_fd, STDOUT_FILENO);

	int ref_ret = ref_ten_queens_puzzle();
	fflush(stdout);

	dup2(saved_stdout, STDOUT_FILENO);
	close(saved_stdout);

	rewind(ref_tmp);
	char ref_buffer[10000] = {0};
	size_t ref_len = fread(ref_buffer, 1, sizeof(ref_buffer) - 1, ref_tmp);
	ref_buffer[ref_len] = '\0';
	fclose(ref_tmp);

	// ----- Compare -----
	int ok = 1;
	if (student_ret != ref_ret)
	{
		printf("Return value mismatch: expected %d, got %d\n",
			   ref_ret, student_ret);
		ok = 0;
	}
	if (strcmp(student_buffer, ref_buffer) != 0)
	{
		printf(
			"\n--- EXPECTED OUTPUT (first 100 chars) ---\n%.100s"
			"\n--- ACTUAL OUTPUT (first 100 chars) ---\n%.100s\n",
			ref_buffer, student_buffer);
		ok = 0;
	}
	if (ok)
	{
		printf(
			"\n--- EXPECTED OUTPUT (first 100 chars) ---\n%.100s"
			"\n--- ACTUAL OUTPUT (first 100 chars) ---\n%.100s\n",
			ref_buffer, student_buffer);
		return (0);
	}
	return (1);
}
