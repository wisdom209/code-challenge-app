#!/usr/bin/env python3
import sys
import traceback

try:
    from add_two_numbers import add_two_numbers  # MUST be indented!
except Exception as e:
    print(f"FAIL: {e}")
    sys.exit(1)

tests = [
    ((5, 3), 8, "Positive numbers"),
    ((-5, 5), 0, "Neg + Pos"),
    ((0, 0), 0, "Zeros"),
    ((-10, -20), -30, "Both negative")
]

passed = failed = 0
for (a, b), exp, desc in tests:
    try:
        res = add_two_numbers(a, b)
        if res == exp:
            print(f"✅ {desc}")
            passed += 1
        else:
            print(f"❌ {desc}: expected {exp}, got {res}")
            failed += 1
    except Exception as e:
        print(f"❌ {desc}: {e}")
        traceback.print_exc()
        failed += 1

print(f"\nResults: {passed} passed, {failed} failed")
sys.exit(0 if failed == 0 else 1)
