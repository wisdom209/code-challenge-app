#define _POSIX_C_SOURCE 200809L
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

static char *run_cmd(const char *cmd, int *exit_code) {
    FILE *fp = popen(cmd, "r");
    if (!fp) return NULL;
    char buf[16384];
    char *out = malloc(1);
    out[0] = '\0';
    while (fgets(buf, sizeof(buf), fp)) {
        out = realloc(out, strlen(out) + strlen(buf) + 1);
        strcat(out, buf);
    }
    *exit_code = pclose(fp);
    return out;
}

static void create_file(const char *name, const unsigned char *data, size_t len) {
    FILE *f = fopen(name, "wb");
    fwrite(data, 1, len, f);
    fclose(f);
}

int main(void) {
    if (system("make ft_hexdump >/dev/null 2>&1") != 0) {
        printf("--- EXPECTED OUTPUT ---\nMakefile builds ft_hexdump\n--- ACTUAL OUTPUT ---\nMake failed\n");
        return 1;
    }
    if (access("./ft_hexdump", X_OK) != 0) {
        printf("--- EXPECTED OUTPUT ---\nBinary ft_hexdump exists\n--- ACTUAL OUTPUT ---\nBinary not found\n");
        return 1;
    }

    // Small file: "Hello"
    unsigned char data[] = "Hello";
    create_file("hello.bin", data, 5);

    // Expected hexdump -C output (exact format)
    const char *expected =
        "00000000  48 65 6c 6c 6f                                    |Hello|\n"
        "00000005\n";
    int ret;
    char *out = run_cmd("./ft_hexdump -C hello.bin", &ret);
    if (ret != 0 || strcmp(out, expected) != 0) {
        printf("--- EXPECTED OUTPUT ---\n%s\n--- ACTUAL OUTPUT ---\n%s\n", expected, out ? out : "");
        free(out);
        return 1;
    }
    free(out);

    // Empty file
    create_file("empty.bin", NULL, 0);
    out = run_cmd("./ft_hexdump -C empty.bin", &ret);
    const char *empty_expected = "00000000\n";
    if (ret != 0 || strcmp(out, empty_expected) != 0) {
        printf("--- EXPECTED OUTPUT ---\n%s\n--- ACTUAL OUTPUT ---\n%s\n", empty_expected, out ? out : "");
        free(out);
        return 1;
    }
    free(out);

    // Multiple files
    unsigned char data2[] = "AB";
    create_file("a.bin", data2, 2);
    create_file("b.bin", data2, 2);
    out = run_cmd("./ft_hexdump -C a.bin b.bin", &ret);
    const char *multi_expected =
        "00000000  41 42                                             |AB|\n"
        "00000002\n"
        "00000000  41 42                                             |AB|\n"
        "00000002\n";
    if (ret != 0 || strcmp(out, multi_expected) != 0) {
        printf("--- EXPECTED OUTPUT ---\n%s\n--- ACTUAL OUTPUT ---\n%s\n", multi_expected, out ? out : "");
        free(out);
        return 1;
    }
    free(out);

    // Missing file -> error
    out = run_cmd("./ft_hexdump -C missing 2>&1", &ret);
    if (ret != 1 || !strstr(out, "No such file or directory")) {
        printf("--- EXPECTED OUTPUT ---\nError for missing file\n--- ACTUAL OUTPUT ---\n%s\n", out ? out : "");
        free(out);
        return 1;
    }
    free(out);

    unlink("hello.bin");
    unlink("empty.bin");
    unlink("a.bin");
    unlink("b.bin");

    printf("--- EXPECTED OUTPUT ---\nAll hexdump tests passed.\n--- ACTUAL OUTPUT ---\nAll hexdump tests passed.\n");
    return 0;
}
