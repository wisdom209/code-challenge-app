#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>

extern int main(int argc, char **argv);

// Helper to show invisible characters
void print_hex(char *str)
{
	printf("Hex: ");
	for (int i = 0; str[i]; i++)
		printf("%02x ", (unsigned char)str[i]);
	printf("\n");
}

int run_test(char *exec_name)
{
	int pipe_fds[2];
	char actual[256];
	char expected[256];

	memset(actual, 0, sizeof(actual));
	memset(expected, 0, sizeof(expected));
	snprintf(expected, sizeof(expected), "%s", exec_name);

	if (pipe(pipe_fds) == -1)
		return 1; // <--- FIXED: return an error code

	int real_stdout = dup(STDOUT_FILENO);
	dup2(pipe_fds[1], STDOUT_FILENO);

	char *mock_argv[] = {exec_name, NULL};
	main(1, mock_argv);

	fflush(stdout);
	dup2(real_stdout, STDOUT_FILENO);
	close(pipe_fds[1]);

	read(pipe_fds[0], actual, sizeof(actual) - 1);
	close(pipe_fds[0]);

	if (strcmp(actual, expected) == 0)
	{
		printf("\n\n\nExpected: %s\n", expected);
		print_hex(expected);

		printf("\nActual:   %s\n", actual);
		print_hex(actual);
		return 0;
	}
	else
	{
		printf("\n\n\nExpected: %s\n", expected);
		print_hex(expected);

		printf("\nActual:   %s\n", actual);
		print_hex(actual);
		return 1;
	}
}

__attribute__((constructor)) void my_test_launcher()
{
	exit(run_test("./banana_test"));
}
