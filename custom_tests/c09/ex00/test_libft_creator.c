#define _POSIX_C_SOURCE 200809L
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <unistd.h>

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

static int lib_contains_object(const char *libpath, const char *objname) {
    char cmd[512];
    snprintf(cmd, sizeof(cmd), "ar t %s 2>/dev/null | grep -q '^%s$'", libpath, objname);
    return system(cmd) == 0;
}

int main(void) {
    const char *required_files[] = {
        "libft_creator.sh", "ft_putchar.c", "ft_swap.c",
        "ft_putstr.c", "ft_strlen.c", "ft_strcmp.c", NULL
    };
    for (int i = 0; required_files[i]; i++) {
        if (!file_exists(required_files[i])) {
            printf("--- EXPECTED OUTPUT ---\n");
            printf("All required files present: %s\n", required_files[i]);
            printf("--- ACTUAL OUTPUT ---\n");
            printf("Missing file: %s\n", required_files[i]);
            return 1;
        }
    }

    int exit_code;
    char *out = run_command("sh libft_creator.sh 2>&1", &exit_code);
    if (exit_code != 0 || !file_exists("libft.a")) {
        printf("--- EXPECTED OUTPUT ---\n");
        printf("Script runs successfully (exit 0) and creates libft.a\n");
        printf("--- ACTUAL OUTPUT ---\n");
        printf("Script exit code: %d\n", exit_code);
        printf("libft.a exists: %s\n", file_exists("libft.a") ? "yes" : "no");
        if (out) printf("Script output:\n%s\n", out);
        free(out);
        return 1;
    }
    free(out);

    const char *required_objs[] = {
        "ft_putchar.o", "ft_swap.o", "ft_putstr.o", "ft_strlen.o", "ft_strcmp.o", NULL
    };
    for (int i = 0; required_objs[i]; i++) {
        if (!lib_contains_object("libft.a", required_objs[i])) {
            printf("--- EXPECTED OUTPUT ---\n");
            printf("libft.a contains %s\n", required_objs[i]);
            printf("--- ACTUAL OUTPUT ---\n");
            printf("libft.a does NOT contain %s\n", required_objs[i]);
            return 1;
        }
    }

    // Write tester.c
    const char *test_c =
        "#include <stdio.h>\n"
        "#include <string.h>\n"
        "void ft_putchar(char c);\n"
        "void ft_swap(int *a, int *b);\n"
        "void ft_putstr(char *str);\n"
        "int ft_strlen(char *str);\n"
        "int ft_strcmp(char *s1, char *s2);\n"
        "int main() {\n"
        "    int a = 5, b = 10;\n"
        "    ft_swap(&a, &b);\n"
        "    if (a != 10 || b != 5) return 1;\n"
        "    if (ft_strlen(\"Hello\") != 5) return 2;\n"
        "    if (ft_strcmp(\"abc\", \"abc\") != 0) return 3;\n"
        "    if (ft_strcmp(\"abc\", \"abd\") >= 0) return 4;\n"
        "    if (ft_strcmp(\"abd\", \"abc\") <= 0) return 5;\n"
        "    ft_putchar('X');\n"
        "    ft_putstr(\" OK\\n\");\n"
        "    return 0;\n"
        "}\n";

    FILE *f = fopen("tester.c", "w");
    if (!f) {
        printf("--- EXPECTED OUTPUT ---\n");
        printf("Internal test harness created.\n");
        printf("--- ACTUAL OUTPUT ---\n");
        printf("Failed to write tester.c\n");
        return 1;
    }
    fprintf(f, "%s", test_c);
    fclose(f);

    // ✅ FIXED: put tester.c BEFORE -lft
    char compile_cmd[1024];
    snprintf(compile_cmd, sizeof(compile_cmd),
             "gcc -Wall -Wextra -Werror tester.c -L. -lft -o tester 2>&1");
    int compile_ret;
    char *compile_out = run_command(compile_cmd, &compile_ret);
    if (compile_ret != 0 || !file_exists("tester")) {
        printf("--- EXPECTED OUTPUT ---\n");
        printf("Test program compiles successfully with libft.a\n");
        printf("--- ACTUAL OUTPUT ---\n");
        printf("Compilation failed. Compiler output:\n%s\n",
               compile_out ? compile_out : "(no output)");
        free(compile_out);
        return 1;
    }
    free(compile_out);

    int test_ret = system("./tester");
    if (test_ret != 0) {
        printf("--- EXPECTED OUTPUT ---\n");
        printf("All five functions behave correctly.\n");
        printf("--- ACTUAL OUTPUT ---\n");
        printf("One or more functions are incorrect. Test program returned %d\n", test_ret);
        return 1;
    }

    printf("--- EXPECTED OUTPUT ---\n");
    printf("All checks passed.\n");
    printf("--- ACTUAL OUTPUT ---\n");
    printf("All checks passed.\n");
    return 0;
}
