"""CLI: python -m scripts.run_golden  → JSON + exit 0/1"""

from __future__ import annotations

import json
import sys

from app.eval.harness import run_golden


def main() -> int:
    report = run_golden()
    print(json.dumps(report, indent=2))
    return 0 if report["pass"] else 1


if __name__ == "__main__":
    sys.exit(main())
