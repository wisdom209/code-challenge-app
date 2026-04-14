#define _POSIX_C_SOURCE 200809L
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <unistd.h>
#include <dirent.h>

static char *run_command(const char *cmd, int *exit_code) {
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

static int file_exists(const char *path) {
    struct stat st;
    return stat(path, &st) == 0;
}

static void create_dummy_srcs_includes(void) {
    // Create srcs/ directory and dummy source files
    mkdir("srcs", 0755);
    const char *src_files[] = {"ft_putchar.c", "ft_swap.c", "ft_putstr.c", "ft_strlen.c", "ft_strcmp.c", NULL};
    for (int i = 0; src_files[i]; i++) {
        char path[256];
        snprintf(path, sizeof(path), "srcs/%s", src_files[i]);
        FILE *f = fopen(path, "w");
        if (strcmp(src_files[i], "ft_putchar.c") == 0)
            fprintf(f, "#include \"ft.h\"\nvoid ft_putchar(char c) { write(1, &c, 1); }\n");
        else if (strcmp(src_files[i], "ft_swap.c") == 0)
            fprintf(f, "void ft_swap(int *a, int *b) { int t = *a; *a = *b; *b = t; }\n");
        else if (strcmp(src_files[i], "ft_putstr.c") == 0)
            fprintf(f, "#include \"ft.h\"\nvoid ft_putstr(char *str) { while (*str) ft_putchar(*str++); }\n");
        else if (strcmp(src_files[i], "ft_strlen.c") == 0)
            fprintf(f, "int ft_strlen(char *str) { int i = 0; while (str[i]) i++; return i; }\n");
        else if (strcmp(src_files[i], "ft_strcmp.c") == 0)
            fprintf(f, "int ft_strcmp(char *s1, char *s2) { while (*s1 && *s1 == *s2) { s1++; s2++; } return *(unsigned char*)s1 - *(unsigned char*)s2; }\n");
        fclose(f);
    }
    mkdir("includes", 0755);
    FILE *h = fopen("includes/ft.h", "w");
    fprintf(h, "#ifndef FT_H\n# define FT_H\n# include <unistd.h>\nvoid ft_putchar(char c);\nvoid ft_swap(int *a, int *b);\nvoid ft_putstr(char *str);\nint ft_strlen(char *str);\nint ft_strcmp(char *s1, char *s2);\n#endif\n");
    fclose(h);
}

static void cleanup(void) {
    system("rm -rf srcs includes libft.a *.o tester 2>/dev/null");
}

int main(void) {
    // Create dummy source/header files
    create_dummy_srcs_includes();

    // 1. Check that Makefile exists
    if (!file_exists("Makefile")) {
        printf("--- EXPECTED OUTPUT ---\nMakefile exists\n--- ACTUAL OUTPUT ---\nMakefile not found\n");
        cleanup();
        return 1;
    }

    // 2. Test 'make libft.a' (or 'make all')
    int ret;
    char *out;
    out = run_command("make libft.a 2>&1", &ret);
    if (ret != 0) {
        printf("--- EXPECTED OUTPUT ---\nmake libft.a succeeds (exit 0)\n--- ACTUAL OUTPUT ---\nmake libft.a failed:\n%s\n", out ? out : "");
        free(out); cleanup();
        return 1;
    }
    free(out);
    if (!file_exists("libft.a")) {
        printf("--- EXPECTED OUTPUT ---\nlibft.a created\n--- ACTUAL OUTPUT ---\nlibft.a missing after make libft.a\n");
        cleanup();
        return 1;
    }

    // 3. Check that object files are in srcs/ (not root)
    DIR *d = opendir("srcs");
    int obj_in_srcs = 0;
    if (d) {
        struct dirent *ent;
        while ((ent = readdir(d))) {
            if (strstr(ent->d_name, ".o")) obj_in_srcs = 1;
        }
        closedir(d);
    }
    if (!obj_in_srcs) {
        printf("--- EXPECTED OUTPUT ---\nObject files (.o) are placed in srcs/ directory\n--- ACTUAL OUTPUT ---\nNo .o files found in srcs/ (they may be in root)\n");
        cleanup();
        return 1;
    }

    // 4. Test 'make clean' – removes .o files but not libft.a
    out = run_command("make clean 2>&1", &ret);
    if (ret != 0) {
        printf("--- EXPECTED OUTPUT ---\nmake clean succeeds\n--- ACTUAL OUTPUT ---\nmake clean failed\n");
        free(out); cleanup();
        return 1;
    }
    free(out);
    d = opendir("srcs");
    int has_o = 0;
    if (d) {
        struct dirent *ent;
        while ((ent = readdir(d))) {
            if (strstr(ent->d_name, ".o")) has_o = 1;
        }
        closedir(d);
    }
    if (has_o) {
        printf("--- EXPECTED OUTPUT ---\nclean removes all .o files\n--- ACTUAL OUTPUT ---\n.o files still present in srcs/\n");
        cleanup();
        return 1;
    }
    if (!file_exists("libft.a")) {
        printf("--- EXPECTED OUTPUT ---\nclean does NOT remove libft.a\n--- ACTUAL OUTPUT ---\nlibft.a was deleted\n");
        cleanup();
        return 1;
    }

    // 5. Test 'make fclean' – removes .o and libft.a
    out = run_command("make fclean 2>&1", &ret);
    if (ret != 0) {
        printf("--- EXPECTED OUTPUT ---\nmake fclean succeeds\n--- ACTUAL OUTPUT ---\nmake fclean failed\n");
        free(out); cleanup();
        return 1;
    }
    free(out);
    if (file_exists("libft.a")) {
        printf("--- EXPECTED OUTPUT ---\nfclean removes libft.a\n--- ACTUAL OUTPUT ---\nlibft.a still exists\n");
        cleanup();
        return 1;
    }

    // 6. Test 'make re' – should run fclean then all
    out = run_command("make re 2>&1", &ret);
    if (ret != 0) {
        printf("--- EXPECTED OUTPUT ---\nmake re succeeds\n--- ACTUAL OUTPUT ---\nmake re failed\n");
        free(out); cleanup();
        return 1;
    }
    free(out);
    if (!file_exists("libft.a")) {
        printf("--- EXPECTED OUTPUT ---\nre creates libft.a\n--- ACTUAL OUTPUT ---\nlibft.a missing after re\n");
        cleanup();
        return 1;
    }

    // 7. Test that 'make all' is default (just 'make')
    out = run_command("make 2>&1", &ret);
    if (ret != 0 || !file_exists("libft.a")) {
        printf("--- EXPECTED OUTPUT ---\n'make' (default) works same as make all\n--- ACTUAL OUTPUT ---\n'make' failed or didn't create libft.a\n");
        free(out); cleanup();
        return 1;
    }
    free(out);

    // 8. Test that no unnecessary recompilation (touch a source, re-make should recompile only changed)
    system("touch srcs/ft_putchar.c");
    out = run_command("make 2>&1", &ret);
    if (ret != 0) {
        printf("--- EXPECTED OUTPUT ---\nmake recompiles only changed files\n--- ACTUAL OUTPUT ---\nmake failed after touching a file\n");
        free(out); cleanup();
        return 1;
    }
    // Expect that at least ft_putchar.o is recompiled – but we just check success
    free(out);

    // All tests passed
    printf("--- EXPECTED OUTPUT ---\nAll Makefile checks passed.\n--- ACTUAL OUTPUT ---\nAll Makefile checks passed.\n");
    cleanup();
    return 0;
}
