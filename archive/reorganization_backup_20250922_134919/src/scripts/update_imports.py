#!/usr/bin/env python3
"""Update Python imports to use absolute paths"""
import os
import re
import sys
from pathlib import Path

def update_file_imports(filepath):
    """Update imports in a single Python file"""
    with open(filepath, 'r') as f:
        content = f.read()

    # Replace relative imports with absolute
    patterns = [
        (r"sys\.path\.append\('\.\.\/\.\.\/'\)", "# Path already in PYTHONPATH"),
        (r"sys\.path\.append\('\.\.\/\.\.'\)", "# Path already in PYTHONPATH"),
        (r"from \.\. import", "from src.bgapp import"),
        (r"from \.\.\. import", "from src import"),
    ]

    modified = False
    for pattern, replacement in patterns:
        new_content = re.sub(pattern, replacement, content)
        if new_content != content:
            modified = True
            content = new_content

    if modified:
        with open(filepath, 'w') as f:
            f.write(content)
        return True
    return False

def main():
    """Main function"""
    python_files = Path('src').glob('**/*.py')
    updated_count = 0

    for filepath in python_files:
        if update_file_imports(filepath):
            print(f"Updated: {filepath}")
            updated_count += 1

    print(f"\n✅ Updated {updated_count} files")

if __name__ == "__main__":
    main()
