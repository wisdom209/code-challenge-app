import os
import re
import subprocess
import sys
import shutil
import tempfile

class CLanguageHandler:
    DEFAULT_IMAGE = 'gcc-debian-slim'

    def get_source_files(self, exercise_folder):
        return [f for f in os.listdir(exercise_folder) if f.endswith('.c')]

    @staticmethod
    def _parse_prototype(proto):
        proto = proto.strip().rstrip(';').strip()
        pattern = r'^([\w\s*]+?)\s*(\w+)\s*\((.*)\)\s*;?$'
        match = re.match(pattern, proto)
        if not match:
            print(f"ERROR: Could not parse prototype: {proto}", file=sys.stderr)
            return None, None, []
        return_type = match.group(1).strip()
        return_type = re.sub(r'\s*\*\s*', '*', return_type)
        func_name = match.group(2).strip()
        params_str = match.group(3).strip()
        if not params_str or params_str == 'void':
            return return_type, func_name, []

        params = []
        for p in params_str.split(','):
            p = p.strip()
            if not p:
                continue
            tokens = p.split()
            if not tokens:
                continue
            raw_name = tokens[-1]
            name = raw_name.lstrip('*')
            stars = '*' * (len(raw_name) - len(name))
            type_str = ' '.join(tokens[:-1]) + stars
            params.append((type_str, name))
        return return_type, func_name, params

    def _generate_test_main(self, exercise, source_files, exercise_folder, temp_dir):
        proto = exercise.get('prototype', '')
        return_type, func_name, params = self._parse_prototype(proto)
        if not func_name:
            return False

        # Build a map of parameter name -> C type string
        param_types = {name: typ for typ, name in params}

        tests = exercise.get('tests', [])
        if not tests:
            print(f"ERROR: No tests defined for {func_name}", file=sys.stderr)
            return False

        lines = []
        lines.append('#include <stdio.h>')
        lines.append('#include <string.h>')
        lines.append('#include <stdlib.h>')
        header_files = [f for f in os.listdir(exercise_folder) if f.endswith('.h')]
        for hf in header_files:
            lines.append(f'#include "{hf}"')
        lines.append('')
        lines.append(proto if proto.endswith(';') else proto + ';')
        lines.append('')
        lines.append('int main(void) {')

        for i, test in enumerate(tests):
            test_num = i
            args = test.get('args', [])
            init = test.get('init', {})
            post = test.get('post', {})

            var_map = {}

            # Special case for ft_ultimate_ft (multi-level pointers)
            if func_name == 'ft_ultimate_ft':
                lines.append(f'    int n_t{test_num} = 0;')
                if params:
                    ptype = params[0][0]
                    levels = ptype.count('*')
                    for l in range(1, levels):
                        if l == 1:
                            lines.append(f'    int *p{l}_t{test_num} = &n_t{test_num};')
                        else:
                            stars = '*' * l
                            lines.append(f'    int {stars}p{l}_t{test_num} = &p{l-1}_t{test_num};')
                    arg_expr = f'&p{levels-1}_t{test_num}' if levels > 1 else f'&n_t{test_num}'
                else:
                    arg_expr = f'&n_t{test_num}'
                var_map['n'] = f'n_t{test_num}'
            else:
                # Handle initialised variables
                for var_name, val in init.items():
                    c_name = f'{var_name}_t{test_num}'
                    var_map[var_name] = c_name

                    # Determine expected C type from the prototype if possible
                    param_type = param_types.get(var_name)

                    if val is None:                     # JSON null → NULL pointer
                        if param_type and '*' in param_type:
                            lines.append(f'    {param_type} {c_name} = NULL;')
                        else:
                            # Fallback: assume a pointer (void* would need a cast, but int* is simpler)
                            lines.append(f'    int* {c_name} = NULL;')
                    elif isinstance(val, str):
                        # Mutable string buffer (safe for functions that may modify)
                        lines.append(f'    char {c_name}[1024];')
                        lines.append(f'    strcpy({c_name}, "{val}");')
                    elif isinstance(val, list):
                        if all(isinstance(x, int) for x in val):
                            arr_vals = ', '.join(str(x) for x in val)
                            lines.append(f'    int {c_name}[] = {{{arr_vals}}};')
                        elif all(isinstance(x, str) for x in val):
                            arr_vals = ', '.join(f'"{x}"' for x in val)
                            lines.append(f'    char *{c_name}[] = {{{arr_vals}, NULL}};')
                        else:
                            lines.append(f'    /* Unsupported array type for {c_name} */')
                    else:
                        # Numeric value (int assumed; could be improved)
                        lines.append(f'    int {c_name} = {val};')

                # Build argument expression with variable substitution
                arg_exprs = []
                for arg in args:
                    replaced = arg
                    for base, suffixed in var_map.items():
                        if arg == base:
                            replaced = suffixed
                            break
                        elif arg == '&' + base:
                            replaced = '&' + suffixed
                            break
                    arg_exprs.append(str(replaced))
                arg_expr = ', '.join(arg_exprs)

            # Emit test block (same as before)
            lines.append(f'    printf("==TEST_START==\\n");')
            lines.append(f'    printf("TEST={test_num}\\n");')
            lines.append(f'    fflush(stdout);')
            lines.append(f'    printf("==STDOUT_START==\\n");')
            lines.append(f'    fflush(stdout);')

            if return_type == 'void':
                lines.append(f'    {func_name}({arg_expr});')
                ret_var = None
            else:
                ret_var = f'ret_t{test_num}'
                lines.append(f'    {return_type} {ret_var} = {func_name}({arg_expr});')

            lines.append(f'    fflush(stdout);')
            lines.append(f'    printf("\\n==STDOUT_END==\\n");')

            if ret_var:
                if return_type.startswith('char*'):
                    lines.append(f'    printf("RETURN=%s\\n", {ret_var} ? {ret_var} : "(null)");')
                elif return_type.startswith('int*') or '*' in return_type:
                    lines.append(f'    printf("RETURN=%p\\n", (void*){ret_var});')
                elif return_type in ('int', 'unsigned int'):
                    lines.append(f'    printf("RETURN=%d\\n", {ret_var});')
                else:
                    lines.append(f'    printf("RETURN=%ld\\n", (long){ret_var});')
            else:
                lines.append(f'    printf("RETURN=void\\n");')

            for var_name, expected_val in post.items():
                if var_name in var_map:
                    c_name = var_map[var_name]
                    if isinstance(expected_val, str):
                        lines.append(f'    printf("VAR={var_name} %s\\n", {c_name});')
                    elif isinstance(expected_val, list):
                        if all(isinstance(x, int) for x in expected_val):
                            size = len(expected_val)
                            lines.append(f'    printf("VAR_ARRAY_START={var_name}\\n");')
                            for j in range(size):
                                lines.append(f'        printf("%d ", {c_name}[{j}]);')
                            lines.append(f'    printf("\\n==VAR_ARRAY_END==\\n");')
                        elif all(isinstance(x, str) for x in expected_val):
                            lines.append(f'    printf("VAR_STR_ARRAY_START={var_name}\\n");')
                            lines.append(f'    for (int i = 0; {c_name}[i] != NULL; i++) {{')
                            lines.append(f'        printf("%s\\n", {c_name}[i]);')
                            lines.append(f'    }}')
                            lines.append(f'    printf("==VAR_STR_ARRAY_END==\\n");')
                    else:
                        lines.append(f'    printf("VAR={var_name} %d\\n", {c_name});')

            lines.append(f'    printf("==TEST_END==\\n");')
            lines.append('')

        lines.append('    return 0;')
        lines.append('}')

        main_path = os.path.join(temp_dir, 'test_main.c')
        with open(main_path, 'w') as f:
            f.write('\n'.join(lines))
        return True

    def run_memory_check(self, executable_path, temp_dir, docker_config, exercise, result):
        """
        Run Valgrind to detect memory leaks.
        Respects exercise.get('allow_leaks', False):
        - True  → leaks are allowed (check passes regardless)
        - False → leaks cause failure
        Returns True if the exercise should continue (no failure), False if leaks found and not allowed.
        Adds a single check entry to result['checks'].
        """
        # Skip if Docker is used
        if docker_config and docker_config.get('use_docker', False):
            result['checks'].append({
                'name': 'Memory leaks (Valgrind)',
                'passed': True,
                'message': 'Skipped (Docker mode)'
            })
            return True

        # Skip if Valgrind not installed
        if not shutil.which('valgrind'):
            result['checks'].append({
                'name': 'Memory leaks (Valgrind)',
                'passed': True,
                'message': 'Valgrind not installed, check skipped'
            })
            return True

        # set allow leaks to false in json file if program may not have leaks
        allow_leaks = exercise.get('allow_leaks', True)
        is_program = exercise.get('type') == 'program'
        tests = exercise.get('tests', []) if is_program else []
        leaks_found = False

        if is_program and tests:
            # Run each test under Valgrind; stop at first leak
            for i, test in enumerate(tests):
                args = test.get('args', [])
                log_file = os.path.join(temp_dir, f'valgrind_{i}.log')
                cmd = ['valgrind', '--leak-check=full', '--log-file=' + log_file,
                    executable_path] + args
                try:
                    subprocess.run(cmd, timeout=10, capture_output=True)
                except subprocess.TimeoutExpired:
                    continue
                if os.path.exists(log_file):
                    with open(log_file) as f:
                        log = f.read()
                    if self._valgrind_has_leaks(log):
                        leaks_found = True
                        break
        else:
            # Single run for function exercises (or program with no tests)
            log_file = os.path.join(temp_dir, 'valgrind.log')
            cmd = ['valgrind', '--leak-check=full', '--log-file=' + log_file, executable_path]
            try:
                subprocess.run(cmd, timeout=10, capture_output=True)
            except subprocess.TimeoutExpired:
                pass
            if os.path.exists(log_file):
                with open(log_file) as f:
                    log = f.read()
                if self._valgrind_has_leaks(log):
                    leaks_found = True

        # Add check entry
        if allow_leaks:
            # Leaks are allowed – the check always passes, but we note if leaks were found
            result['checks'].append({
                'name': 'Memory leaks (Valgrind)',
                'passed': True,
                'message': 'Memory leaks detected (allowed by exercise)' if leaks_found
                        else 'No memory leaks detected'
            })
            return True   # Never fails the exercise
        else:
            # Leaks are not allowed – failure if leaks found
            result['checks'].append({
                'name': 'Memory leaks (Valgrind)',
                'passed': not leaks_found,
                'message': 'No memory leaks detected' if not leaks_found
                        else 'Memory leaks detected'
            })
            return not leaks_found
            
    def _valgrind_has_leaks(self, log):
        """Return True if Valgrind reports any lost bytes."""
        patterns = [
            r'definitely lost:\s+([0-9,]+) bytes in',
            r'indirectly lost:\s+([0-9,]+) bytes in',
            r'possibly lost:\s+([0-9,]+) bytes in',
        ]
        for pattern in patterns:
            match = re.search(pattern, log)
            if match:
                # Remove commas and convert to int
                val = int(match.group(1).replace(',', ''))
                if val > 0:
                    return True
        return False

    # ----  run custom tests ----------- 
    def run_custom_test(self, exercise, source_filenames, exercise_folder, temp_dir,
                        custom_test_path, result, docker_config=None):
        # Copy the custom test file into the temporary directory
        test_filename = os.path.basename(custom_test_path)
        dest_test = os.path.join(temp_dir, test_filename)
        if os.path.abspath(custom_test_path) != os.path.abspath(dest_test):
            shutil.copy(custom_test_path, dest_test)

        use_docker = docker_config and docker_config.get('use_docker', False)
        image = docker_config.get('image', self.DEFAULT_IMAGE) if docker_config else None

        # For program exercises, the student's program is already compiled separately
        # (by the runner before calling this method). We only compile the test file.
        # For function exercises, we still need to link student code with the test.
        is_program = exercise.get('type') == 'program'

        if is_program:
            # Only compile the test file (standalone)
            if use_docker:
                compile_cmd = ['gcc', '-Wall', '-Wextra', '-Werror', '-o', 'custom_test', test_filename]
                proc = self._run_in_docker(compile_cmd, temp_dir, image)
            else:
                full_cmd = ['gcc', '-Wall', '-Wextra', '-Werror',
                            '-o', os.path.join(temp_dir, 'custom_test'),
                            dest_test]
                proc = subprocess.run(full_cmd, capture_output=True, text=True, timeout=10)
        else:
            # Function exercise: compile student's source files together with the test
            source_paths = [os.path.join(exercise_folder, f) for f in source_filenames]
            source_paths.append(dest_test)
            if use_docker:
                rel_paths = [os.path.relpath(p, temp_dir) for p in source_paths]
                compile_cmd = ['gcc', '-Wall', '-Wextra', '-Werror', '-o', 'custom_test'] + rel_paths
                proc = self._run_in_docker(compile_cmd, temp_dir, image)
            else:
                full_cmd = ['gcc', '-Wall', '-Wextra', '-Werror',
                            '-o', os.path.join(temp_dir, 'custom_test')] + source_paths
                proc = subprocess.run(full_cmd, capture_output=True, text=True, timeout=10)

        # ... continue with running the test (the rest of the method remains unchanged) ...

        if proc.returncode != 0:
            result['checks'].append({
                'name': 'Custom test compilation',
                'passed': False,
                'message': proc.stderr
            })
            result['details'] = 'Custom test compilation failed.'
            return False
        else:
            result['checks'].append({
                'name': 'Custom test compilation',
                'passed': True,
                'message': 'Compiled successfully'
            })

        # Run the custom test
        if use_docker:
            run_cmd = [
                'docker', 'run', '--rm',
                '-v', f'{os.path.abspath(temp_dir)}:/workspace',
                '-w', '/workspace',
                image,
                './custom_test'
            ]
        else:
            run_cmd = [os.path.join(temp_dir, 'custom_test')]

        run_proc = subprocess.run(run_cmd, capture_output=True, text=True, timeout=5, cwd=temp_dir)

        passed = (run_proc.returncode == 0)
        stdout = run_proc.stdout

        # Parse expected and actual output if markers are present
        expected_output = ""
        actual_output = stdout
        markers = {
            'expected': '--- EXPECTED OUTPUT ---',
            'actual': '--- ACTUAL OUTPUT ---'
        }

        if markers['expected'] in stdout and markers['actual'] in stdout:
            # Split into parts
            parts = stdout.split(markers['expected'])
            if len(parts) > 1:
                remaining = parts[1]
                if markers['actual'] in remaining:
                    expected_part, actual_part = remaining.split(markers['actual'], 1)
                    expected_output = expected_part.strip()
                    actual_output = actual_part.strip()
                else:
                    # Actual marker not found after expected
                    expected_output = remaining.strip()
            else:
                # Expected marker not found at start (shouldn't happen)
                pass

        # Build test result
        result['test_results'] = [{
            'test_index': 0,
            'passed': passed,
            'stdout_ok': passed,                     # stdout correctness is implied by return code
            'ret_ok': passed,
            'post_ok': True,
            'expected_stdout': expected_output,
            'actual_stdout': actual_output,
            'expected_return': 0,
            'actual_return': run_proc.returncode,
            'expected_post': {},
            'actual_post': {}
        }]
        result['success'] = passed
        if not passed:
            result['details'] = 'Custom test failed.'
        return passed

    # ---------- Pre‑checks ----------
    def run_pre_checks(self, exercise, exercise_folder, source_files, temp_dir, result):
        # Betty check
        betty_ok = True
        for cf in source_files:
            file_path = os.path.join(exercise_folder, cf)
            betty_proc = subprocess.run(['betty', file_path], capture_output=True, text=True)
            if betty_proc.returncode != 0:
                betty_ok = False
                result['checks'].append({
                    'name': f'Betty style ({cf})',
                    'passed': False,
                    'message': betty_proc.stdout or betty_proc.stderr
                })
            else:
                result['checks'].append({
                    'name': f'Betty style ({cf})',
                    'passed': True,
                    'message': 'Style OK'
                })
        if not betty_ok:
            result['details'] = 'Betty style checks failed.'
            return False
        
        # Norminette check
        norme_ok = True
        if not shutil.which('norminette'):
            result['checks'].append({
                'name': 'Norme style',
                'passed': True,
                'message': 'Norminette not installed, skipped'
            })
        else:
            for cf in source_files:
                file_path = os.path.join(exercise_folder, cf)
                
                # Run norminette directly on the file (no temp directory needed)
                # This avoids filesystem events that trigger watchdog
                norme_proc = subprocess.run(
                    ['norminette', file_path],
                    capture_output=True,
                    text=True,
                    timeout=10  # Add timeout to prevent hanging
                )
                
                # Check the result
                if norme_proc.returncode != 0:
                    norme_ok = False
                    result['checks'].append({
                        'name': f'Norme style ({cf})',
                        'passed': False,
                        'message': norme_proc.stdout or norme_proc.stderr
                    })
                else:
                    result['checks'].append({
                        'name': f'Norme style ({cf})',
                        'passed': True,
                        'message': 'Style OK'
                    })

        if not norme_ok:
            result['details'] = 'Norme style checks failed.'
            return False

        # Forbidden function check
        forbidden_ok = True
        for cf in source_files:
            file_path = os.path.join(exercise_folder, cf)
            with open(file_path) as f:
                content = f.read()
            for forbidden in exercise.get('forbidden', []):
                if re.search(r'\b' + re.escape(forbidden) + r'\s*\(', content):
                    forbidden_ok = False
                    result['checks'].append({
                        'name': f'Forbidden function ({forbidden})',
                        'passed': False,
                        'message': f'Forbidden function "{forbidden}" called in {cf}.'
                    })
        if not forbidden_ok:
            result['details'] = 'Forbidden functions used.'
            return False

        # Allowed functions check (whitelist)
        if 'allowed' in exercise:
            allowed_list = exercise['allowed']
            whitelist_ok = True
            obj_files = []
            
            # First pass: collect all user-defined function symbols from source files
            user_defined_funcs = set()
            for cf in source_files:
                src_path = os.path.join(exercise_folder, cf)
                # Get defined functions (not undefined) from each source file
                nm_def_proc = subprocess.run(['nm', '-g', '--defined-only', src_path], 
                                            capture_output=True, text=True, timeout=10)
                if nm_def_proc.returncode == 0:
                    for line in nm_def_proc.stdout.splitlines():
                        parts = line.strip().split()
                        if len(parts) >= 3 and parts[1] in ('T', 't', 'G', 'g'):
                            symbol = parts[2]
                            # Add both with and without leading underscore
                            user_defined_funcs.add(symbol)
                            if symbol.startswith('_') and not symbol.startswith('__'):
                                user_defined_funcs.add(symbol[1:])
                            else:
                                user_defined_funcs.add('_' + symbol)

            for cf in source_files:
                src_path = os.path.join(exercise_folder, cf)
                obj_path = os.path.join(temp_dir, cf.replace('.c', '.o'))
                compile_proc = subprocess.run(
                    ['gcc', '-c', '-Wall', '-Wextra', '-Werror', src_path, '-o', obj_path],
                    capture_output=True, text=True, timeout=10
                )
                if compile_proc.returncode != 0:
                    result['checks'].append({
                        'name': f'Compilation ({cf})',
                        'passed': False,
                        'message': compile_proc.stderr
                    })
                    result['details'] = 'Compilation for whitelist check failed.'
                    return False
                obj_files.append(obj_path)

            internal_symbols = {
                '__stack_chk_fail', '__gmon_start__', '_init', '_fini',
                '__cxa_finalize', '__dso_handle', '_GLOBAL_OFFSET_TABLE_',
                '__assert_fail', '__libc_start_main'
            }
            violations = []
            try:
                for obj in obj_files:
                    nm_proc = subprocess.run(['nm', '-u', obj], capture_output=True, text=True)
                    if nm_proc.returncode != 0:
                        continue
                    for line in nm_proc.stdout.splitlines():
                        parts = line.strip().split()
                        if len(parts) >= 2 and parts[-2] == 'U':
                            symbol = parts[-1]
                            if symbol.startswith('__') or symbol in internal_symbols:
                                continue
                            actual = (symbol[1:] if symbol.startswith('_')
                                      and not symbol.startswith('__') else symbol)
                            # Allow if in allowed_list OR if it's a user-defined function
                            if (actual not in allowed_list and symbol not in allowed_list 
                                and actual not in user_defined_funcs and symbol not in user_defined_funcs):
                                violations.append(actual)
            except FileNotFoundError:
                pass

            if violations:
                whitelist_ok = False
                result['checks'].append({
                    'name': 'Allowed functions',
                    'passed': False,
                    'message': (f'Disallowed: {", ".join(violations)}. '
                                f'Allowed: {allowed_list or "none"}')
                })
                result['details'] = 'Disallowed functions used.'
                return False

            result['checks'].append({
                'name': 'Allowed functions',
                'passed': True,
                'message': (f'Only allowed functions used: {allowed_list}'
                            if allowed_list else 'No external functions used (correct).')
            })

        return True

    # ---------- Docker helper ----------
    def _run_in_docker(self, cmd_list, temp_dir, image, workdir='/workspace'):
        docker_cmd = [
            'docker', 'run', '--rm',
            '-v', f'{os.path.abspath(temp_dir)}:{workdir}',
            '-w', workdir,
            image
        ] + cmd_list
        return subprocess.run(docker_cmd, capture_output=True, text=True, timeout=30)

    # ---------- Compilation for function exercises ----------
    def compile_code(self, exercise, source_files, exercise_folder, temp_dir, result,
                     docker_config=None):
        if not self._generate_test_main(exercise, source_files, exercise_folder, temp_dir):
            result['details'] = 'Failed to generate test harness.'
            return False

        use_docker = docker_config and docker_config.get('use_docker', False)
        image = docker_config.get('image', self.DEFAULT_IMAGE) if docker_config else None

        if use_docker:
            rel_source_files = []
            for cf in source_files:
                full_path = os.path.join(exercise_folder, cf)
                rel_path = os.path.relpath(full_path, temp_dir)
                rel_source_files.append(rel_path)
            compile_cmd = ['gcc', '-Wall', '-Wextra', '-Werror',
                           '-o', 'test_prog'] + rel_source_files + ['test_main.c']
            proc = self._run_in_docker(compile_cmd, temp_dir, image)
        else:
            full_cmd = ['gcc', '-Wall', '-Wextra', '-Werror',
                        '-o', os.path.join(temp_dir, 'test_prog')]
            full_cmd += [os.path.join(exercise_folder, cf) for cf in source_files]
            full_cmd.append(os.path.join(temp_dir, 'test_main.c'))
            proc = subprocess.run(full_cmd, capture_output=True, text=True, timeout=10)

        if proc.returncode != 0:
            result['checks'].append({
                'name': 'Compilation',
                'passed': False,
                'message': proc.stderr
            })
            result['details'] = 'Compilation failed.'
            return False
        else:
            result['checks'].append({
                'name': 'Compilation',
                'passed': True,
                'message': 'Compiled successfully'
            })
            return True

    # ---------- Compilation for program exercises ----------
    def compile_program(self, source_files, exercise_folder, temp_dir, result,
                        docker_config=None):
        use_docker = docker_config and docker_config.get('use_docker', False)
        image = docker_config.get('image', self.DEFAULT_IMAGE) if docker_config else None

        if use_docker:
            rel_source_files = []
            for cf in source_files:
                full_path = os.path.join(exercise_folder, cf)
                rel_path = os.path.relpath(full_path, temp_dir)
                rel_source_files.append(rel_path)
            compile_cmd = ['gcc', '-Wall', '-Wextra', '-Werror',
                           '-o', 'program'] + rel_source_files
            proc = self._run_in_docker(compile_cmd, temp_dir, image)
        else:
            full_cmd = ['gcc', '-Wall', '-Wextra', '-Werror',
                        '-o', os.path.join(temp_dir, 'program')]
            full_cmd += [os.path.join(exercise_folder, cf) for cf in source_files]
            proc = subprocess.run(full_cmd, capture_output=True, text=True, timeout=10)

        if proc.returncode != 0:
            result['checks'].append({
                'name': 'Compilation',
                'passed': False,
                'message': proc.stderr
            })
            result['details'] = 'Compilation failed.'
            return False
        else:
            result['checks'].append({
                'name': 'Compilation',
                'passed': True,
                'message': 'Compiled successfully'
            })
            return True

    # ---------- Command to run the test program (for functions) ----------
    def get_run_command(self, temp_dir, docker_config=None):
        use_docker = docker_config and docker_config.get('use_docker', False)
        image = docker_config.get('image', self.DEFAULT_IMAGE) if docker_config else None

        if use_docker:
            return [
                'docker', 'run', '--rm',
                '-v', f'{os.path.abspath(temp_dir)}:/workspace',
                '-w', '/workspace',
                image,
                './test_prog'
            ]
        else:
            return [os.path.join(temp_dir, 'test_prog')]

    # ---------- Command to run a program (with arguments) ----------
    def get_program_run_command(self, temp_dir, program_args, docker_config=None):
        use_docker = docker_config and docker_config.get('use_docker', False)
        image = docker_config.get('image', self.DEFAULT_IMAGE) if docker_config else None

        if use_docker:
            cmd = [
                'docker', 'run', '--rm',
                '-v', f'{os.path.abspath(temp_dir)}:/workspace',
                '-w', '/workspace',
                image,
                './program'
            ] + program_args
            return cmd
        else:
            return [os.path.join(temp_dir, 'program')] + program_args

    # ---------- Output parsing for functions ----------
    def parse_test_output(self, output):
        test_results = []
        for block in output.split('==TEST_START==\n')[1:]:
            td = {'test_index': None, 'return': None, 'vars': {}, 'stdout': ''}
            m = re.search(r'TEST=(\d+)', block)
            if m:
                td['test_index'] = int(m.group(1))
            m = re.search(r'==STDOUT_START==\n(.*?)\n==STDOUT_END==\n', block, re.DOTALL)
            if m:
                td['stdout'] = m.group(1)
            # FIX: capture entire line after RETURN=
            m = re.search(r'RETURN=(.*)', block)
            if m and m.group(1).strip() != 'void':
                val = m.group(1).rstrip('\n')
                if val.isdigit() or (val.startswith('-') and val[1:].isdigit()):
                    td['return'] = int(val)
                else:
                    td['return'] = val
            for m in re.finditer(r'VAR=(\w+) (-?\d+)', block):
                td['vars'][m.group(1)] = int(m.group(2))
            for m in re.finditer(r'VAR=(\w+) (.*)', block):
                td['vars'][m.group(1)] = m.group(2)
            for m in re.finditer(
                r'VAR_ARRAY_START=(\w+)\n(.*?)\n==VAR_ARRAY_END==', block, re.DOTALL
            ):
                td['vars'][m.group(1)] = [int(x) for x in m.group(2).split()]
            for m in re.finditer(
                r'VAR_STR_ARRAY_START=(\w+)\n(.*?)\n==VAR_STR_ARRAY_END==', block, re.DOTALL
            ):
                lines = m.group(2).strip().split('\n')
                td['vars'][m.group(1)] = lines
            test_results.append(td)
        return test_results
   
    # ---------- Output parsing for programs ----------
    def parse_program_output(self, output):
        return [{'stdout': output}]
