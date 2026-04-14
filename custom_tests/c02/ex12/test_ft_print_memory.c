
#define _POSIX_C_SOURCE 200112L
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <stdlib.h>

// Student's function
void *ft_print_memory(void *addr, unsigned int size);

// Reference implementation (you can also put this in a separate .c and include it)

void print_memory(const void *addr, size_t size)
{
	const unsigned char *ptr = (const unsigned char *)addr;
	size_t i, j;

	for (i = 0; i < size; i += 16)
	{
		// Print address
		printf("%016lx: ", (unsigned long)(ptr + i));

		// Print hex bytes (16 per line)
		for (j = 0; j < 16; j++)
		{
			if (i + j < size)
				printf("%02x ", ptr[i + j]);
			else
				printf("   "); // padding for incomplete lines
		}

		// Print printable characters
		for (j = 0; j < 16 && i + j < size; j++)
		{
			unsigned char c = ptr[i + j];
			putchar((c >= 32 && c < 127) ? c : '.');
		}
		putchar('\n');
	}
}

int main(void)
{
	char str[] = "Bonjour les aminches\t\n\tc  est fou\ttout\tce qu on peut faire avec\t\n\tprint_memory\n\n\tlol.lol";
	unsigned int size = 92;

	// ----- Capture student output -----
	FILE *student_tmp = tmpfile();
	if (!student_tmp)
	{
		perror("tmpfile");
		return 1;
	}
	int student_fd = fileno(student_tmp);

	// Save stdout and redirect to temporary file
	fflush(stdout);
	int saved_stdout = dup(STDOUT_FILENO);
	dup2(student_fd, STDOUT_FILENO);

	void *ret = ft_print_memory(str, size);
	fflush(stdout);

	// Restore stdout
	dup2(saved_stdout, STDOUT_FILENO);
	close(saved_stdout);

	// Read student output
	rewind(student_tmp);
	char student_buffer[10240] = {0};
	fread(student_buffer, 1, sizeof(student_buffer) - 1, student_tmp);
	fclose(student_tmp); // file is automatically deleted

	// ----- Capture reference output -----
	FILE *ref_tmp = tmpfile();
	if (!ref_tmp)
	{
		perror("tmpfile");
		return 1;
	}
	int ref_fd = fileno(ref_tmp);

	fflush(stdout);
	saved_stdout = dup(STDOUT_FILENO);
	dup2(ref_fd, STDOUT_FILENO);

	print_memory(str, size);
	fflush(stdout);

	dup2(saved_stdout, STDOUT_FILENO);
	close(saved_stdout);

	rewind(ref_tmp);
	char ref_buffer[10240] = {0};
	fread(ref_buffer, 1, sizeof(ref_buffer) - 1, ref_tmp);
	fclose(ref_tmp);

	// Compare
	if (strcmp(ref_buffer, student_buffer) != 0)
	{
		   printf("\n--- EXPECTED OUTPUT ---\n%s\n--- ACTUAL OUTPUT ---\n%s\n",
		   ref_buffer, student_buffer);
		return 1;
	}
	if (ret != str)
	{
		printf("Return value mismatch: expected %p, got %p\n", (void *)str, (void *)ret);
		return 1;
	}

	// On success, print the actual output so it appears in the frontend
	printf("\n--- EXPECTED OUTPUT ---\n%s\n--- ACTUAL OUTPUT ---\n%s\n",
		   ref_buffer, student_buffer);
	return 0;
}
