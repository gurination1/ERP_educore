import os
import re

SRC_DIR = '/root/college-erp-educore/src'

replacements = [
    # Spinner / Cyan accents in App.tsx
    (r'border-\[#86f2e4\]', r'border-[#ea580c]'),
    (r'text-\[#86f2e4\]', r'text-[#ea580c]'),
    (r'bg-\[#86f2e4\]/\d+', r'bg-[#ffedd5]'),
    (r'bg-\[#86f2e4\]', r'bg-[#ffedd5]'),
    (r'border-\[#86f2e4\]/\d+', r'border-[#ea580c]/30'),
    
    # Old teal primary buttons / text
    (r'bg-\[#006a61\]', r'bg-[#ea580c]'),
    (r'hover:bg-\[#005a52\]', r'hover:bg-[#c2410c]'),
    (r'hover:bg-\[#004f48\]', r'hover:bg-[#9a3412]'),
    (r'border-\[#006a61\]', r'border-[#ea580c]'),
    (r'border-\[#004f48\]', r'border-[#001744]'),
    (r'text-\[#006a61\]', r'text-[#00236f]'),
    (r'text-\[#004f48\]', r'text-[#001744]'),
    (r'text-\[#005a52\]', r'text-[#00236f]'),
]

modified_files = []

for root, _, files in os.walk(SRC_DIR):
    for f in files:
        if f.endswith(('.tsx', '.ts', '.css')):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as fh:
                content = fh.read()
            
            new_content = content
            for pat, repl in replacements:
                new_content = re.sub(pat, repl, new_content)
            
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as fh:
                    fh.write(new_content)
                modified_files.append(path)

print(f"Updated theme colors in {len(modified_files)} files:")
for mf in modified_files:
    print(f" - {os.path.basename(mf)}")
