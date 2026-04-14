#define _POSIX_C_SOURCE 200809L
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

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
    *exit_code = pclose(fp);
    return out;
}

static void create_file(const char *name, const char *content) {
    FILE *f = fopen(name, "w");
    fprintf(f, "%s", content);
    fclose(f);
}

int main(void) {
    const char *student_prog = "./program";
    if (access(student_prog, X_OK) != 0) {
        printf("--- EXPECTED OUTPUT ---\nStudent program exists\n--- ACTUAL OUTPUT ---\n%s not found\n", student_prog);
        return 1;
    }

    int ret;
    char *out;
    char cmd[256];

    // No argument
    snprintf(cmd, sizeof(cmd), "%s 2>&1", student_prog);
    out = run_cmd(cmd, &ret);
    if (ret == 0 || !strstr(out, "File name missing.")) {
        printf("--- EXPECTED OUTPUT ---\nNo argument: exit non-zero, 'File name missing.'\\n\n--- ACTUAL OUTPUT ---\nExit %d\n%s\n", ret, out ? out : "");
        free(out);
        return 1;
    }
    free(out);

    // Too many arguments
    snprintf(cmd, sizeof(cmd), "%s a b 2>&1", student_prog);
    out = run_cmd(cmd, &ret);
    if (ret == 0 || !strstr(out, "Too many arguments.")) {
        printf("--- EXPECTED OUTPUT ---\nToo many arguments: exit non-zero, 'Too many arguments.'\\n\n--- ACTUAL OUTPUT ---\nExit %d\n%s\n", ret, out ? out : "");
        free(out);
        return 1;
    }
    free(out);

    // Cannot read file
    snprintf(cmd, sizeof(cmd), "%s missing 2>&1", student_prog);
    out = run_cmd(cmd, &ret);
    if (ret == 0 || !strstr(out, "Cannot read file.")) {
        printf("--- EXPECTED OUTPUT ---\nCannot read file: exit non-zero, 'Cannot read file.'\\n\n--- ACTUAL OUTPUT ---\nExit %d\n%s\n", ret, out ? out : "");
        free(out);
        return 1;
    }
    free(out);

    // Valid file
    create_file("test.txt", "Hello World!\n");
    snprintf(cmd, sizeof(cmd), "%s test.txt", student_prog);
    out = run_cmd(cmd, &ret);
    if (ret != 0 || strcmp(out, "Hello World!\n") != 0) {
        printf("--- EXPECTED OUTPUT ---\nValid file: exit 0, 'Hello World!\\n'\n--- ACTUAL OUTPUT ---\nExit %d\n%s\n", ret, out ? out : "");
        free(out);
        unlink("test.txt");
        return 1;
    }
    free(out);
    unlink("test.txt");

    printf("--- EXPECTED OUTPUT ---\nAll display_file tests passed.\n--- ACTUAL OUTPUT ---\nAll display_file tests passed.\n");
    return 0;
}
