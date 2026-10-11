import re
import json

with open('audio/transcript_lecture_3_complete_verbatim.md', 'r', encoding='utf-8') as f:
    text = f.read()

lines = text.split('\n')
print(f"Total lines: {len(lines)}, Total characters: {len(text)}")

# Find timestamps and key speaker statements
sections = []
current_time = "00:00:00"
current_block = []

for line in lines:
    time_match = re.search(r'\[?(\d{2}:\d{2}(?::\d{2})?)\]?', line)
    if time_match:
        if current_block:
            sections.append((current_time, '\n'.join(current_block)))
            current_block = []
        current_time = time_match.group(1)
    current_block.append(line)

if current_block:
    sections.append((current_time, '\n'.join(current_block)))

print(f"Detected {len(sections)} timestamped segments.")

# Key search queries across the transcript
keywords = [
    "tenant", "subdomain", "impersonat", "open button", "client", "school", "college",
    "batch", "section", "semester", "annual", "academic", "l1", "l2", "l3", "l4", "l5",
    "transfer", "non-destructive",
    "subject", "code", "formula", "take_exam", "show_in_report_card", "take_attendance",
    "free period", "fc", "cc", "combined class", "elective",
    "allocation", "handover", "valid_from", "valid_until", "successor",
    "attendance", "backdated", "lock", "fraud", "condon", "75",
    "promotion", "demotion", "struck", "struck off", "deactivat", "progression",
    "payroll", "basic", "hra", "pf", "esi", "voluntary", "security", "installment", "target", "deduction",
    "noc", "exit", "library", "accounts", "hod", "it", "hr", "refund", "release",
    "gateway", "payment", "razorpay", "payu", "cashfree", "live", "test", "sandbox", "current account",
    "permission", "field", "view", "edit", "disabled", "dependency",
    "role", "dual", "additional", "teaching", "non-teaching", "admin", "guest"
]

results = {}
for kw in keywords:
    matches = []
    for t, content in sections:
        if kw.lower() in content.lower():
            matches.append(t)
    results[kw] = matches

print("\n--- KEYWORD OCCURRENCE TIMESTAMPS ---")
for kw, matches in results.items():
    print(f"{kw:<20}: {len(matches)} mentions (e.g., {matches[:4]})")
