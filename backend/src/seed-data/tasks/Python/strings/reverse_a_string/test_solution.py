#!/usr/bin/env python3
import sys
import traceback

try:
    from reverse_a_string import reverse_string  # MUST be indented!
except Exception as e:
    print(f"FAIL: {e}")
    sys.exit(1)

tests = [
    ("hello", "olleh", "Basic"),
    ("Python", "nohtyP", "Mixed case"),
    ("", "", "Empty string"),
    ("a", "a", "Single char"),
    ("racecar", "racecar", "Palindrome")
]

passed = failed = 0
for inp, exp, desc in tests:
    try:
        res = reverse_string(inp)
        if res == exp:
            print(f"✅ {desc}")
            passed += 1
        else:
            print(f"❌ {desc}: expected {repr(exp)}, got {repr(res)}")
            failed += 1
    except Exception as e:
        print(f"❌ {desc}: {e}")
        traceback.print_exc()
        failed += 1

print(f"\nResults: {passed} passed, {failed} failed")
sys.exit(0 if failed == 0 else 1)
