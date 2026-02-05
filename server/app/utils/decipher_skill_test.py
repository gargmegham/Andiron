#!/usr/bin/env python3
"""Decipher a ROT13-encoded file (default: 'skill test.txt')."""

from __future__ import annotations

import argparse
import codecs
from pathlib import Path

def decipher_text(text: str) -> str:
    return codecs.decode(text, "rot_13")


def main() -> None:
    parser = argparse.ArgumentParser(description="Decipher a ROT13-encoded text file.")
    parser.add_argument("input", nargs="?", default="skill test.txt", help="Path to ciphertext file")
    parser.add_argument("-o", "--output", help="Optional output file path")
    args = parser.parse_args()

    input_path = Path(args.input)
    text = input_path.read_text(encoding="utf-8")
    decoded = decipher_text(text)

    if args.output:
        Path(args.output).write_text(decoded, encoding="utf-8")
    else:
        print(decoded, end="")


if __name__ == "__main__":
    main()
