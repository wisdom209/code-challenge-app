# C Learning App

A local web application to test your C exercises (like 42 Piscine) by cloning your GitHub repo and running tests.

## Setup

1. Install Python 3.10+ and required packages:

pip install -r requirements.txt


2. Ensure `gcc` and `betty` are installed and available in PATH.
- For Betty: https://github.com/alx-tools/Betty/wiki

3. Run the app:

python app.py


4. Open http://localhost:5000 in your browser.

## Usage

1. Go to **Settings** and enter your GitHub repository URL (e.g., `https://github.com/yourusername/42piscine`).
2. Browse books and chapters.
3. Click on an exercise, then **Run Test**.
4. The app will:
- Clone your repo (shallow clone)
- Check Betty style on all .c files in the exercise folder (e.g., `ex00/`)
- Check for forbidden functions
- Compile and run the code against expected outputs
- Show a summary of checks (pass/fail)
- Mark exercise as completed if all checks pass

## Progress Management

- Completed exercises are marked with ✅.
- Use **Export Progress** to download a JSON file of your completed exercises.
- Use **Import Progress** (click the link, select a file) to restore progress on another device.
- Reset buttons are available per exercise, chapter, book, or all.

## Adding More Books/Exercises

Create a JSON file in the `books/` folder with the following structure:

```json
{
"title": "Book Title",
"chapters": [
 {
   "title": "Chapter Title",
   "exercises": [
     {
       "name": "exercise_name",
       "prototype": "function prototype",
       "type": "function",  // or "program"
       "tests": [
         { "args": ["arg1", "arg2"], "stdout": "expected output" }
       ],
       "forbidden": ["printf", "puts"],
       "description": "Optional description"
     }
   ]
 }
]
}
```


---

## ✅ **How to Use**

1. Create the folder structure with all the files above.
2. Install Flask: `pip install flask`
3. Run `python app.py`
4. Open browser to `http://localhost:5000`
5. Set your GitHub repo URL in Settings.
6. Test an exercise!

---

## 🔧 **Extending for Future Chapters**

Just add new JSON files in the `books/` folder. The app will automatically load them.

---

This should give you a fully functional, minimal C learning app that matches your requirements. Let me know if you encounter any issues or need modifications!
