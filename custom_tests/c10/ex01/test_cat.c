#define _POSIX_C_SOURCE 200809L
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/wait.h>

/* ---------- Helper: run command, capture stdout+stderr ---------- */
static char *run_cmd(const char *cmd, int *exit_code) {
    FILE *fp = popen(cmd, "r");
    if (!fp) return NULL;
    char buf[4096];
    char *out = malloc(1);
    out[0] = '\0';
    while (fgets(buf, sizeof(buf), fp)) {
        out = realloc(out, strlen(out) + strlen(buf) + 1);
        strcat(out, buf);
    }
    int status = pclose(fp);
    *exit_code = WEXITSTATUS(status);
    return out;
}

/* ---------- Helper: create a file with content ---------- */
static void create_file(const char *name, const char *content) {
    FILE *f = fopen(name, "w");
    if (f) {
        fprintf(f, "%s", content);
        fclose(f);
    }
}

/* ---------- Helper: compile ft_cat.c if needed ---------- */
static int ensure_binary(void) {
    // Check if binary already exists (from runner's compile_program)
    if (access("./ft_cat", X_OK) == 0) return 1;
    if (access("./program", X_OK) == 0) {
        // Runner often names it 'program' – symlink or copy
        symlink("./program", "./ft_cat");
        return 1;
    }
    // Try to compile ft_cat.c (must be present)
    if (access("ft_cat.c", R_OK) != 0) {
        fprintf(stderr, "ERROR: ft_cat.c not found and no precompiled binary.\n");
        return 0;
    }
    printf("Compiling ft_cat.c...\n");
    int ret = system("gcc -Wall -Wextra -Werror -o ft_cat ft_cat.c");
    if (ret != 0) {
        fprintf(stderr, "ERROR: compilation failed.\n");
        return 0;
    }
    return 1;
}

/* ---------- Main test ---------- */
int main(void) {
    int ret;
    char *out;

    // 1. Make sure we have a working ft_cat binary
    if (!ensure_binary()) {
        printf("Test - ❌ Failed\nReason: Could not obtain ft_cat binary.\n");
        return 1;
    }

    // 2. Test Stdin
    out = run_cmd("echo -n \"hello stdin\" | ./ft_cat", &ret);
    if (ret != 0 || strcmp(out, "hello stdin") != 0) {
        printf("Test 1 (Stdin) - ❌ Failed\nExpected: hello stdin\nGot: %s\n", out);
        free(out);
        return 1;
    }
    free(out);

    // 3. Test Single File
    create_file("test_a.txt", "content a\n");
    out = run_cmd("./ft_cat test_a.txt", &ret);
    if (ret != 0 || strcmp(out, "content a\n") != 0) {
        printf("Test 2 (Single File) - ❌ Failed\nGot: %s\n", out);
        free(out);
        return 1;
    }
    free(out);

    // 4. Test Multiple Files
    create_file("test_b.txt", "content b\n");
    out = run_cmd("./ft_cat test_a.txt test_b.txt", &ret);
    if (ret != 0 || strcmp(out, "content a\ncontent b\n") != 0) {
        printf("Test 3 (Multiple Files) - ❌ Failed\nGot: %s\n", out);
        free(out);
        return 1;
    }
    free(out);

    // 5. Test Error Handling (missing file)
    // Redirect stderr to stdout so we can capture the message
    out = run_cmd("./ft_cat missing_file 2>&1", &ret);
    if (ret != 1 ||
        strstr(out, "ft_cat: missing_file: No such file or directory") == NULL) {
        printf("Test 4 (Error Handling) - ❌ Failed\n");
        printf("Expected Return: 1, Got: %d\n", ret);
        printf("Expected Message: ft_cat: missing_file: No such file or directory\n");
        printf("Actual Message: %s\n", out);
        free(out);
        return 1;
    }
    free(out);

    // Cleanup
    unlink("test_a.txt");
    unlink("test_b.txt");

    printf("--- ALL CAT TESTS PASSED ---\n");
    return 0;
}
