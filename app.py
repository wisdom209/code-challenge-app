import os
import re
import json
import sqlite3
import shutil
import subprocess
import tempfile
from flask import Flask, render_template, request, redirect, url_for, flash, g, jsonify

# Import language handlers
from languages import get_handler

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-this'

CONFIG_FILE = 'config.json'
BOOKS_FOLDER = 'books'
DATABASE = 'progress.db'


# ---------- Database ----------
def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    with app.app_context():
        db = get_db()
        db.execute('''
            CREATE TABLE IF NOT EXISTS completed (
                book_id TEXT,
                chapter_idx INTEGER,
                exercise_idx INTEGER,
                PRIMARY KEY (book_id, chapter_idx, exercise_idx)
            )
        ''')
        db.commit()

# ---------- Config ----------
def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE) as f:
            return json.load(f)
    return {}

def save_config(config):
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f)

# ---------- Load books ----------
def load_books():
    books = {}
    if not os.path.exists(BOOKS_FOLDER):
        os.makedirs(BOOKS_FOLDER)
    for filename in sorted(os.listdir(BOOKS_FOLDER)):
        if filename.endswith('.json'):
            with open(os.path.join(BOOKS_FOLDER, filename)) as f:
                book_data = json.load(f)
                book_id = filename[:-5]
                books[book_id] = book_data
    return books

def get_books():
    books = getattr(g, '_books', None)
    if books is None:
        books = g._books = load_books()
    return books

# ---------- Language detection helper ----------
def get_exercise_language(book, chapter_idx, exercise_idx):
    """
    Determine language for an exercise:
    - exercise.language if present
    - else chapter.language if present
    - else book.language if present
    - else 'c'
    """
    chapter = book['chapters'][chapter_idx]
    exercise = chapter['exercises'][exercise_idx]
    return (exercise.get('language') or
            chapter.get('language') or
            book.get('language') or
            'c')

# ---------- Test runner ----------
def run_test(repo_url, book_id, chapter_idx, exercise_idx, config=None):
    if config is None:
        config = load_config()
    books = get_books()
    book = books[book_id]
    chapter = book['chapters'][chapter_idx]
    exercise = chapter['exercises'][exercise_idx]

    temp_dir = tempfile.mkdtemp()
    result = {'success': False, 'checks': [], 'details': '', 'test_results': []}

    try:
        # Clone repo
        clone_proc = subprocess.run(
            ['git', 'clone', '--depth', '1', repo_url, temp_dir],
            capture_output=True, text=True, timeout=30
        )
        if clone_proc.returncode != 0:
            result['details'] = f"Clone failed: {clone_proc.stderr}"
            return result

        # README check (common to all languages)
        book_dir = book_id
        folder_name = f'ex{exercise_idx:02d}'
        readme_root = os.path.join(temp_dir, 'README.md')
        readme_ex = os.path.join(temp_dir, book_dir, folder_name, 'README.md')
        if not os.path.exists(readme_root) and not os.path.exists(readme_ex):
            result['checks'].append({'name': 'README.md exists', 'passed': False,
                                     'message': 'README.md not found.'})
            result['details'] = 'README.md is missing.'
            return result
        result['checks'].append({'name': 'README.md exists', 'passed': True,
                                 'message': 'README.md found.'})

        # Locate exercise folder
        exercise_folder = os.path.join(temp_dir, book_dir, folder_name)
        if not os.path.isdir(exercise_folder):
            result['details'] = f"Folder '{book_dir}/{folder_name}' not found in repo."
            return result

        # Determine language and get handler
        language = get_exercise_language(book, chapter_idx, exercise_idx)
        handler = get_handler(language)

        # Docker configuration (from config.json) with per‑language override
        docker_images = config.get('docker_images', {})
        docker_config = {
            'use_docker': config.get('use_docker', False),
            'image': docker_images.get(language, handler.DEFAULT_IMAGE)
        }

        # Get source files for this language
        source_files = handler.get_source_files(exercise_folder)
        if not source_files and not exercise.get('custom_test', False):
            result['details'] = f'No source files found for language {language} in {book_dir}/{folder_name}.'
            return result

        # Determine exercise type (default 'function')
        exercise_type = exercise.get('type', 'function')

        if exercise_type == 'program':
            # Program exercise: compile without test harness
            if not handler.compile_program(source_files, exercise_folder, temp_dir, result,
                                           docker_config=docker_config):
                return result
            
            #  Run pre_checks
            if not handler.run_pre_checks(exercise, exercise_folder, source_files, temp_dir, result):
                return result
              
            # --- NEW: Handle custom tests ---
            if exercise.get('custom_test'):
                # Path to the custom test folder
                custom_test_folder = os.path.join('custom_tests', book_id, f'ex{exercise_idx:02d}')
                if not os.path.exists(custom_test_folder):
                    result['details'] = f'Custom test folder not found: {custom_test_folder}'
                    return result

                # Copy all files from the custom test folder to temp_dir
                for file in os.listdir(custom_test_folder):
                    src = os.path.join(custom_test_folder, file)
                    dst = os.path.join(temp_dir, file)
                    if os.path.isfile(src):
                        shutil.copy2(src, dst)

                # Copy all header files from the student's folder to temp_dir
                for item in os.listdir(exercise_folder):
                    src = os.path.join(exercise_folder, item)
                    dst = os.path.join(temp_dir, item)
                    if os.path.isfile(src):
                        shutil.copy2(src, dst)
                # Find the test .c file (should be named test_*.c)
                test_c_files = [f for f in os.listdir(temp_dir) if f.startswith('test_') and f.endswith('.c')]
                if not test_c_files:
                    result['details'] = f'No test .c file found in {custom_test_folder}'
                    return result
                custom_test_path = os.path.join(temp_dir, test_c_files[0])

                # Run the custom test
                if not handler.run_custom_test(
                    exercise, source_files, exercise_folder, temp_dir,
                    custom_test_path, result, docker_config=docker_config
                ):
                    return result
                return result
            # Get test data
            tests = exercise.get('tests', [])
            if not tests:
                result['details'] = 'No tests defined for program.'
                return result
            
            all_passed = True
            for test_idx, test in enumerate(tests):
                program_args = test.get('args', [])
                run_cmd = handler.get_program_run_command(temp_dir, program_args,
                                                          docker_config=docker_config)
                run_proc = subprocess.run(run_cmd, capture_output=True, text=True, timeout=5)
                output = run_proc.stdout
                expected_stdout = test.get('stdout', '')
                passed = (output == expected_stdout)
                if not passed:
                    all_passed = False
                result['test_results'].append({
                    'test_index': test_idx,
                    'passed': passed,
                    'stdout_ok': passed,
                    'expected_stdout': expected_stdout,
                    'actual_stdout': output
                })
            result['success'] = all_passed

            executable_path = os.path.join(temp_dir, 'program')
            if hasattr(handler, 'run_memory_check') and os.path.exists(executable_path):
                memory_ok = handler.run_memory_check(
                    executable_path, temp_dir, docker_config, exercise, result
                )
                if not memory_ok:
                    result['success'] = False

        else:  # function exercise
            # Run language‑specific pre‑checks
            if not handler.run_pre_checks(exercise, exercise_folder, source_files, temp_dir, result):
                return result

            # --- NEW: Handle custom tests ---
            if exercise.get('custom_test'):
                # Path to the custom test folder
                custom_test_folder = os.path.join('custom_tests', book_id, f'ex{exercise_idx:02d}')
                if not os.path.exists(custom_test_folder):
                    result['details'] = f'Custom test folder not found: {custom_test_folder}'
                    return result

                # Copy all files from the custom test folder to temp_dir
                for file in os.listdir(custom_test_folder):
                    src = os.path.join(custom_test_folder, file)
                    dst = os.path.join(temp_dir, file)
                    if os.path.isfile(src):
                        shutil.copy2(src, dst)

                # Copy all header files from the student's folder to temp_dir
                for item in os.listdir(exercise_folder):
                    src = os.path.join(exercise_folder, item)
                    dst = os.path.join(temp_dir, item)
                    if os.path.isfile(src):
                        shutil.copy2(src, dst)
                # Find the test .c file (should be named test_*.c)
                test_c_files = [f for f in os.listdir(temp_dir) if f.startswith('test_') and f.endswith('.c')]
                if not test_c_files:
                    result['details'] = f'No test .c file found in {custom_test_folder}'
                    return result
                custom_test_path = os.path.join(temp_dir, test_c_files[0])

                # Run the custom test
                if not handler.run_custom_test(
                    exercise, source_files, exercise_folder, temp_dir,
                    custom_test_path, result, docker_config=docker_config
                ):
                    return result
                return result
            else:
                # Compile with test harness
                if not handler.compile_code(exercise, source_files, exercise_folder, temp_dir, result,
                                            docker_config=docker_config):
                    return result

            # Run the test program
            run_cmd = handler.get_run_command(temp_dir, docker_config=docker_config)
            run_proc = subprocess.run(run_cmd, capture_output=True, text=True, timeout=5)
            output = run_proc.stdout

            # Parse output using handler
            test_results = handler.parse_test_output(output)

            # Evaluate tests (language‑agnostic)
            all_passed = True
            for i, test in enumerate(exercise['tests']):
                if i >= len(test_results):
                    result['test_results'].append({'test_index': i, 'passed': False,
                                                   'error': 'Missing test output'})
                    all_passed = False
                    continue
                actual = test_results[i]
                exp_stdout = test.get('stdout', '')
                exp_return = test.get('returns', None)
                exp_post = test.get('post', {})

                stdout_ok = actual.get('stdout', '') == exp_stdout
                ret_ok = True
                if exp_return is not None:
                    actual_ret = actual.get('return')
                    if isinstance(exp_return, int) and isinstance(actual_ret, int):
                        ret_ok = (actual_ret == exp_return)
                    else:
                        ret_ok = (str(actual_ret) == str(exp_return))
                post_ok = True
                for k, v in exp_post.items():
                    if k not in actual.get('vars', {}):
                        post_ok = False
                        break
                    actual_v = actual['vars'][k]
                    if isinstance(v, int) and isinstance(actual_v, int):
                        if actual_v != v:
                            post_ok = False
                            break
                    else:
                        if str(actual_v) != str(v):
                            post_ok = False
                            break
                passed = stdout_ok and ret_ok and post_ok
                if not passed:
                    all_passed = False
                result['test_results'].append({
                    'test_index': i, 'passed': passed,
                    'stdout_ok': stdout_ok, 'ret_ok': ret_ok, 'post_ok': post_ok,
                    'expected_stdout': exp_stdout,
                    'actual_stdout': actual.get('stdout', ''),
                    'expected_return': exp_return,
                    'actual_return': actual.get('return'),
                    'expected_post': exp_post,
                    'actual_post': actual.get('vars', {})
                })
            result['success'] = all_passed

                        # ... existing test evaluation that sets result['success'] and result['test_results'] ...

            result['success'] = all_passed

            # --- Memory leak check (if handler supports it) ---
            executable_path = os.path.join(temp_dir, 'test_prog')
            if hasattr(handler, 'run_memory_check') and os.path.exists(executable_path):
                memory_ok = handler.run_memory_check(
                    executable_path, temp_dir, docker_config, exercise, result
                )
                if not memory_ok:
                    result['success'] = False

    except subprocess.TimeoutExpired:
        result['details'] = 'Timeout: process took too long.'
    except Exception as e:
        result['details'] = f'Unexpected error: {str(e)}'
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

    return result
    
# ---------- Routes ----------
@app.route('/')
def index():
    config = load_config()
    books = get_books()
    return render_template('index.html', books=books, repo_url=config.get('repo_url', ''))

@app.route('/book/<book_id>')
def view_book(book_id):
    books = get_books()
    if book_id not in books:
        flash('Book not found', 'error')
        return redirect(url_for('index'))
    book = books[book_id]
    db = get_db()
    chapter_progress = []
    for ci, chapter in enumerate(book['chapters']):
        cur = db.execute(
            'SELECT COUNT(*) as cnt FROM completed WHERE book_id=? AND chapter_idx=?',
            (book_id, ci)
        )
        cnt = cur.fetchone()['cnt']
        chapter_progress.append({
            'chapter': chapter, 'chapter_idx': ci,
            'completed': cnt, 'total': len(chapter['exercises'])
        })
    return render_template('book.html', book_id=book_id, book=book,
                           chapter_progress=chapter_progress)

@app.route('/book/<book_id>/chapter/<int:chapter_idx>')
def view_chapter(book_id, chapter_idx):
    books = get_books()
    if book_id not in books:
        flash('Book not found', 'error')
        return redirect(url_for('index'))
    book = books[book_id]
    if not (0 <= chapter_idx < len(book['chapters'])):
        flash('Chapter not found', 'error')
        return redirect(url_for('view_book', book_id=book_id))
    chapter = book['chapters'][chapter_idx]
    db = get_db()
    cur = db.execute(
        'SELECT exercise_idx FROM completed WHERE book_id=? AND chapter_idx=?',
        (book_id, chapter_idx)
    )
    completed = {row['exercise_idx'] for row in cur.fetchall()}
    return render_template('chapter.html', book_id=book_id, book=book,
                           chapter=chapter, chapter_idx=chapter_idx, completed=completed)

@app.route('/book/<book_id>/chapter/<int:chapter_idx>/exercise/<int:exercise_idx>',
           methods=['GET', 'POST'])
def view_exercise(book_id, chapter_idx, exercise_idx):
    books = get_books()
    if book_id not in books:
        flash('Book not found', 'error')
        return redirect(url_for('index'))
    book = books[book_id]
    if not (0 <= chapter_idx < len(book['chapters'])):
        flash('Chapter not found', 'error')
        return redirect(url_for('view_book', book_id=book_id))
    chapter = book['chapters'][chapter_idx]
    if not (0 <= exercise_idx < len(chapter['exercises'])):
        flash('Exercise not found', 'error')
        return redirect(url_for('view_chapter', book_id=book_id, chapter_idx=chapter_idx))
    exercise = chapter['exercises'][exercise_idx]

    db = get_db()
    cur = db.execute(
        'SELECT 1 FROM completed WHERE book_id=? AND chapter_idx=? AND exercise_idx=?',
        (book_id, chapter_idx, exercise_idx)
    )
    completed = cur.fetchone() is not None
    result = None

    if request.method == 'POST':
        config = load_config()
        repo_url = config.get('repo_url')
        if not repo_url:
            flash('Please set your GitHub repo URL in settings first.', 'error')
            return redirect(url_for('settings'))
        result = run_test(repo_url, book_id, chapter_idx, exercise_idx, config=config)
        if result['success']:
            try:
                db.execute(
                    'INSERT INTO completed (book_id, chapter_idx, exercise_idx) VALUES (?,?,?)',
                    (book_id, chapter_idx, exercise_idx)
                )
                db.commit()
                completed = True
                flash('Exercise completed! 🎉', 'success')
            except sqlite3.IntegrityError:
                pass

    return render_template('exercise.html',
                           book_id=book_id, book=book,
                           chapter=chapter, chapter_idx=chapter_idx,
                           exercise=exercise, exercise_idx=exercise_idx,
                           completed=completed, result=result)

@app.route('/settings', methods=['GET', 'POST'])
def settings():
    config = load_config()
    if request.method == 'POST':
        config['repo_url'] = request.form.get('repo_url', '').strip()
        save_config(config)
        flash('Settings saved.', 'success')
        return redirect(url_for('settings'))
    return render_template('settings.html', config=config)

@app.route('/reset', methods=['POST'])
def reset():
    data = request.get_json()
    level = data.get('level')
    book_id = data.get('book_id')
    chapter_idx = data.get('chapter_idx')
    exercise_idx = data.get('exercise_idx')
    db = get_db()
    if level == 'exercise' and all(v is not None for v in [book_id, chapter_idx, exercise_idx]):
        db.execute(
            'DELETE FROM completed WHERE book_id=? AND chapter_idx=? AND exercise_idx=?',
            (book_id, chapter_idx, exercise_idx)
        )
    elif level == 'chapter' and book_id is not None and chapter_idx is not None:
        db.execute('DELETE FROM completed WHERE book_id=? AND chapter_idx=?',
                   (book_id, chapter_idx))
    elif level == 'book' and book_id is not None:
        db.execute('DELETE FROM completed WHERE book_id=?', (book_id,))
    elif level == 'all':
        db.execute('DELETE FROM completed')
    else:
        return jsonify({'error': 'Invalid reset level'}), 400
    db.commit()
    return jsonify({'success': True})

@app.route('/export')
def export_progress():
    db = get_db()
    cur = db.execute(
        'SELECT book_id, chapter_idx, exercise_idx FROM completed '
        'ORDER BY book_id, chapter_idx, exercise_idx'
    )
    return jsonify([dict(row) for row in cur.fetchall()])

@app.route('/import', methods=['POST'])
def import_progress():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    file = request.files['file']
    if not file.filename:
        return jsonify({'error': 'Empty file'}), 400
    try:
        data = json.load(file)
        db = get_db()
        imported = 0
        for item in data:
            try:
                db.execute(
                    'INSERT INTO completed (book_id, chapter_idx, exercise_idx) VALUES (?,?,?)',
                    (item['book_id'], item['chapter_idx'], item['exercise_idx'])
                )
                imported += 1
            except sqlite3.IntegrityError:
                pass
        db.commit()
        return jsonify({'success': True, 'imported': imported})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
