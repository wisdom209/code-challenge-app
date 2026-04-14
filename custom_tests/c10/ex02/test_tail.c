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
    if (system("make ft_tail >/dev/null 2>&1") != 0) {
        printf("--- EXPECTED OUTPUT ---\nMakefile builds ft_tail\n--- ACTUAL OUTPUT ---\nMake failed\n");
        return 1;
    }
    if (access("./ft_tail", X_OK) != 0) {
        printf("--- EXPECTED OUTPUT ---\nBinary ft_tail exists\n--- ACTUAL OUTPUT ---\nBinary not found\n");
        return 1;
    }

    // Create a test file with 20 bytes: "1234567890abcdefghij"
    create_file("data.txt", "1234567890abcdefghij");

    // tail -c 5 should output last 5 bytes: "fghij"
    int ret;
    char *out = run_cmd("./ft_tail -c 5 data.txt", &ret);
    if (ret != 0 || strcmp(out, "fghij") != 0) {
        printf("--- EXPECTED OUTPUT ---\nfghij\n--- ACTUAL OUTPUT ---\n%s\n", out ? out : "");
        free(out);
        return 1;
    }
    free(out);

    // tail -c 0 -> nothing
    out = run_cmd("./ft_tail -c 0 data.txt", &ret);
    if (ret != 0 || out[0] != '\0') {
        printf("--- EXPECTED OUTPUT ---\n<empty>\n--- ACTUAL OUTPUT ---\n%s\n", out ? out : "");
        free(out);
        return 1;
    }
    free(out);

    // tail -c 100 (more than file size) -> whole file
    out = run_cmd("./ft_tail -c 100 data.txt", &ret);
    if (ret != 0 || strcmp(out, "1234567890abcdefghij") != 0) {
        printf("--- EXPECTED OUTPUT ---\n1234567890abcdefghij\n--- ACTUAL OUTPUT ---\n%s\n", out ? out : "");
        free(out);
        return 1;
    }
    free(out);

    // Multiple files: should output with header "==> file <==\n"
    create_file("a.txt", "AAAA");
    create_file("b.txt", "BBBB");
    out = run_cmd("./ft_tail -c 2 a.txt b.txt", &ret);
    const char *expected = "==> a.txt <==\nAA\n==> b.txt <==\nBB\n";
    if (ret != 0 || strcmp(out, expected) != 0) {
        printf("--- EXPECTED OUTPUT ---\n%s\n--- ACTUAL OUTPUT ---\n%s\n", expected, out ? out : "");
        free(out);
        return 1;
    }
    free(out);

    // Missing file -> error
    out = run_cmd("./ft_tail -c 1 missing 2>&1", &ret);
    if (ret != 1 || !strstr(out, "No such file or directory")) {
        printf("--- EXPECTED OUTPUT ---\nError for missing file\n--- ACTUAL OUTPUT ---\n%s\n", out ? out : "");
        free(out);
        return 1;
    }
    free(out);

    unlink("data.txt");
    unlink("a.txt");
    unlink("b.txt");

    printf("--- EXPECTED OUTPUT ---\nAll tail tests passed.\n--- ACTUAL OUTPUT ---\nAll tail tests passed.\n");
    return 0;
}
