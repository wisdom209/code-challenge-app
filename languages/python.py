import os
import re
import sys
import subprocess
import json
import ast
import tempfile
from pathlib import Path

class PythonLanguageHandler:
    DEFAULT_IMAGE = 'python:3.11-slim'

    def get_source_files(self, exercise_folder):
        """Return all .py files in the exercise folder."""
        return [f for f in os.listdir(exercise_folder) if f.endswith('.py')]

    # ---------- Pre‑checks ----------
    def run_pre_checks(self, exercise, exercise_folder, source_files, temp_dir, result):
        """
        Optional pre‑checks:
        - Syntax validation
        - Forbidden imports (based on exercise.get('forbidden', []))
        - Allowed imports whitelist (exercise.get('allowed', []))
        """
        # 1. Syntax check using ast.parse
        syntax_ok = True
        for py_file in source_files:
            file_path = os.path.join(exercise_folder, py_file)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    source = f.read()
                ast.parse(source)
                result['checks'].append({
                    'name': f'Syntax ({py_file})',
                    'passed': True,
                    'message': 'Syntax OK'
                })
            except SyntaxError as e:
                syntax_ok = False
                result['checks'].append({
                    'name': f'Syntax ({py_file})',
                    'passed': False,
                    'message': f'{e.__class__.__name__}: {e}'
                })

        if not syntax_ok:
            result['details'] = 'Syntax errors found.'
            return False

        # 2. Forbidden / allowed import checks
        forbidden = exercise.get('forbidden', [])
        allowed = exercise.get('allowed', [])
        if forbidden or allowed:
            import_ok = True
            imported_modules = set()
            for py_file in source_files:
                file_path = os.path.join(exercise_folder, py_file)
                with open(file_path, 'r', encoding='utf-8') as f:
                    source = f.read()
                tree = ast.parse(source)
                for node in ast.walk(tree):
                    if isinstance(node, ast.Import):
                        for alias in node.names:
                            imported_modules.add(alias.name.split('.')[0])
                    elif isinstance(node, ast.ImportFrom):
                        if node.module:
                            imported_modules.add(node.module.split('.')[0])

            # Check forbidden
            for mod in imported_modules:
                if mod in forbidden:
                    import_ok = False
                    result['checks'].append({
                        'name': f'Forbidden import',
                        'passed': False,
                        'message': f'Module "{mod}" is forbidden.'
                    })
                    break

            # If whitelist exists, check all imports are in allowed
            if allowed and import_ok:
                for mod in imported_modules:
                    if mod not in allowed:
                        import_ok = False
                        result['checks'].append({
                            'name': f'Allowed imports',
                            'passed': False,
                            'message': f'Module "{mod}" is not in allowed list: {allowed}'
                        })
                        break

            if import_ok:
                result['checks'].append({
                    'name': 'Import restrictions',
                    'passed': True,
                    'message': 'All imports are permitted.'
                })
            else:
                result['details'] = 'Import restrictions violated.'
                return False

        # (Optional) run a linter like flake8 – you can add later
        return True

    # ---------- Test harness generation (for function exercises) ----------
    def _generate_test_script(self, exercise, source_files, exercise_folder, temp_dir):
        """
        Generate a Python test script that:
        - Imports the user's module (by dynamically adding its path)
        - For each test case, calls the function with given args/init
        - Captures stdout and return value
        - Prints results with special markers for parsing.
        """
        func_name = exercise['name']
        proto = exercise.get('prototype', '')  # optional, for documentation
        tests = exercise.get('tests', [])
        if not tests:
            return False

        # Build import statement: assume the main file is the one with the function.
        # We'll import from a module named 'solution' (we'll copy the user's main .py to solution.py)
        main_py = source_files[0] if source_files else None
        if not main_py:
            return False

        lines = [
            "import sys",
            "import io",
            "import contextlib",
            "import importlib.util",
            "",
            "# Add exercise folder to path",
            f"sys.path.insert(0, {repr(exercise_folder)})",
            f"# Import the user's module (assuming the main file is {main_py})",
            f"spec = importlib.util.spec_from_file_location('solution', {repr(os.path.join(exercise_folder, main_py))})",
            "solution = importlib.util.module_from_spec(spec)",
            "spec.loader.exec_module(solution)",
            "",
            f"func = getattr(solution, '{func_name}')",
            "",
            "# Helper to capture stdout",
            "@contextlib.contextmanager",
            "def capture_output():",
            "    new_out = io.StringIO()",
            "    old_out = sys.stdout",
            "    try:",
            "        sys.stdout = new_out",
            "        yield new_out",
            "    finally:",
            "        sys.stdout = old_out",
            "",
        ]

        for i, test in enumerate(tests):
            args = test.get('args', [])
            init = test.get('init', {})
            post = test.get('post', {})
            expected_return = test.get('returns', None)

            lines.append(f"# Test {i}")
            lines.append(f"print('==TEST_START==')")
            lines.append(f"print(f'TEST={i}')")
            lines.append(f"print('==STDOUT_START==')")

            # Prepare local variables based on init
            for var_name, val in init.items():
                # Convert JSON value to Python literal (simple types)
                # For more complex objects (like DataFrames) we'll need special handling – start simple.
                if isinstance(val, str):
                    # Use repr to safely embed string
                    lines.append(f"{var_name} = {repr(val)}")
                else:
                    lines.append(f"{var_name} = {val}")

            # Build argument list: args are variable names (strings)
            arg_list = []
            for arg in args:
                # If arg is a string like "dest", it refers to variable name
                arg_list.append(arg)
            call_args = ', '.join(arg_list)

            # Call the function, capturing stdout and return value
            if expected_return is not None and expected_return != "None":
                lines.append(f"with capture_output() as captured:")
                lines.append(f"    ret = func({call_args})")
                lines.append(f"print(captured.getvalue(), end='')")
                lines.append(f"print('==STDOUT_END==')")
                lines.append(f"print(f'RETURN={ret}')")
            else:
                # void function (no return or expected None)
                lines.append(f"with capture_output() as captured:")
                lines.append(f"    func({call_args})")
                lines.append(f"print(captured.getvalue(), end='')")
                lines.append(f"print('==STDOUT_END==')")
                lines.append(f"print('RETURN=None')")

            # Check post conditions: output variable values
            for var_name, expected_val in post.items():
                # Use repr to get Python representation
                lines.append(f"print(f'VAR={var_name} {repr(locals().get(var_name))}')")

            lines.append(f"print('==TEST_END==')")
            lines.append("")

        test_script_path = os.path.join(temp_dir, 'test_script.py')
        with open(test_script_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines))
        return True

    # ---------- Compilation step (for function exercises) ----------
    def compile_code(self, exercise, source_files, exercise_folder, temp_dir, result,
                     docker_config=None, **kwargs):
        """
        For Python, "compile" means generating a test script and optionally checking syntax.
        """
        if exercise.get('custom_test'):
            # Use a pre‑written custom test script from custom_tests/...
            book_id = kwargs.get('book_id')
            chapter_idx = kwargs.get('chapter_idx')
            exercise_idx = kwargs.get('exercise_idx')
            if not (book_id and chapter_idx is not None and exercise_idx is not None):
                result['checks'].append({
                    'name': 'Custom test',
                    'passed': False,
                    'message': 'Missing book/chapter/exercise identifiers for custom test.'
                })
                return False
            test_path = os.path.join('custom_tests', book_id,
                                     f'ex{exercise_idx:02d}',
                                     f'test_{exercise["name"]}.py')
            if not os.path.exists(test_path):
                result['checks'].append({
                    'name': 'Custom test',
                    'passed': False,
                    'message': f'Custom test not found: {test_path}'
                })
                return False
            # Copy to temp_dir as test_script.py
            shutil.copy(test_path, os.path.join(temp_dir, 'test_script.py'))
        else:
            if not self._generate_test_script(exercise, source_files, exercise_folder, temp_dir):
                result['details'] = 'Failed to generate test script.'
                return False

        result['checks'].append({
            'name': 'Test script generation',
            'passed': True,
            'message': 'Test script created successfully'
        })
        return True

    # ---------- Compilation for program exercises ----------
    def compile_program(self, source_files, exercise_folder, temp_dir, result,
                        docker_config=None):
        """
        For a standalone Python program, we just need to copy the main file(s) to temp_dir.
        If there are multiple files, we copy all.
        """
        for src in source_files:
            shutil.copy(os.path.join(exercise_folder, src),
                        os.path.join(temp_dir, src))
        # Also copy any other .py files? Already included.
        result['checks'].append({
            'name': 'Program files',
            'passed': True,
            'message': 'Source files copied'
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
                'python', 'test_script.py'
            ]
        else:
            return ['python', os.path.join(temp_dir, 'test_script.py')]

    # ---------- Command to run a program (with arguments) ----------
    def get_program_run_command(self, temp_dir, program_args, docker_config=None):
        use_docker = docker_config and docker_config.get('use_docker', False)
        image = docker_config.get('image', self.DEFAULT_IMAGE) if docker_config else None

        # Determine main script name – assume first .py file or 'main.py'
        py_files = [f for f in os.listdir(temp_dir) if f.endswith('.py')]
        main_script = py_files[0] if py_files else 'main.py'

        if use_docker:
            cmd = [
                'docker', 'run', '--rm',
                '-v', f'{os.path.abspath(temp_dir)}:/workspace',
                '-w', '/workspace',
                image,
                'python', main_script
            ] + program_args
            return cmd
        else:
            return ['python', os.path.join(temp_dir, main_script)] + program_args

    # ---------- Output parsing for function exercises ----------
    def parse_test_output(self, output):
        """
        Parse the output from test_script.py.
        Expected format:
        ==TEST_START==
        TEST=0
        ==STDOUT_START==
        (stdout content)
        ==STDOUT_END==
        RETURN=42
        VAR=x 'hello'
        ==TEST_END==
        """
        test_results = []
        blocks = output.split('==TEST_START==\n')[1:]
        for block in blocks:
            td = {'test_index': None, 'return': None, 'vars': {}, 'stdout': ''}
            # Test index
            m = re.search(r'TEST=(\d+)', block)
            if m:
                td['test_index'] = int(m.group(1))
            # Stdout
            m = re.search(r'==STDOUT_START==\n(.*?)\n==STDOUT_END==', block, re.DOTALL)
            if m:
                td['stdout'] = m.group(1)
            # Return value
            m = re.search(r'RETURN=(.*)', block)
            if m:
                ret_str = m.group(1).strip()
                if ret_str == 'None':
                    td['return'] = None
                else:
                    # Try to evaluate as Python literal
                    try:
                        td['return'] = ast.literal_eval(ret_str)
                    except:
                        td['return'] = ret_str  # fallback to string
            # Variables
            for m in re.finditer(r'VAR=(\w+) (.*)', block):
                var_name = m.group(1)
                val_str = m.group(2).strip()
                try:
                    td['vars'][var_name] = ast.literal_eval(val_str)
                except:
                    td['vars'][var_name] = val_str
            test_results.append(td)
        return test_results

    # ---------- Output parsing for program exercises ----------
    def parse_program_output(self, output):
        """For programs, just return the full stdout as a single test."""
        return [{'stdout': output}]
