import os
import re

# Mapping for stand-alone icon glyphs
TEXT_MAP = {
    'close': '✕',
    'cancel': '✕',
    'clear': '✕',
    'arrow_forward': '→',
    'chevron_right': '→',
    'arrow_back': '←',
    'chevron_left': '←',
    'add': '+',
    'add_circle': '+',
    'remove': '-',
    'check': '✓',
    'check_circle': '✓',
    'done': '✓',
    'done_all': '✓',
    'verified': '✓',
    'warning': '[!]',
    'error': '[!]',
    'block': '[BLOCKED]',
    'edit': '[EDIT]',
    'delete': '[DEL]',
    'refresh': '[REFRESH]',
    'sync': '[SYNC]',
    'download': '[DL]',
    'print': '[PRINT]',
    'visibility': '[VIEW]',
    'visibility_off': '[HIDE]',
    'lock': '[LOCKED]',
    'lock_open': '[UNLOCKED]',
    'expand_more': '▼',
    'expand_less': '▲',
    'call': '[CALL]',
    'call_end': '[END]',
    'mic': '[MIC]',
    'mic_off': '[MUTE]',
    'search': '',
    'school': '',
    'badge': '',
    'apartment': '',
    'calendar_today': '',
    'workspace_premium': '',
    'psychology': '',
    'folder_shared': '',
    'payments': '',
    'trending_up': '',
    'group': '',
    'mail': '',
    'auto_awesome': '',
    'receipt_long': '',
    'receipt': '',
    'credit_card': '',
    'menu_book': '',
    'radar': '',
    'how_to_reg': '',
    'grade': '',
    'supervisor_account': '',
    'event_note': '',
    'save': '',
    'wifi': '',
    'battery_full': '',
    'desktop_windows': '',
    'logout': '',
    'dashboard': '',
}

def replace_icon(match):
    full_tag = match.group(0)
    icon_text = match.group(1).strip()
    
    # Check if there is dynamic JSX inside
    if '{' in icon_text:
        return ''
        
    replacement = TEXT_MAP.get(icon_text, '')
    if replacement:
        return f'<span className="font-bold text-[10px]">{replacement}</span>'
    return ''

pattern = re.compile(r"<span\s+className=[^{>]*material-symbols-outlined[^>]*>(.*?)</span>", re.DOTALL)

modified_files = 0
for root, dirs, fnames in os.walk("src"):
    for f in fnames:
        if f.endswith(".tsx") or f.endswith(".ts"):
            fpath = os.path.join(root, f)
            with open(fpath, "r", encoding="utf-8") as file:
                content = file.read()
            
            if "material-symbols-outlined" in content:
                new_content = pattern.sub(replace_icon, content)
                # also handle backtick className template literals
                new_content = re.sub(r"<span\s+className=\{`[^`]*material-symbols-outlined[^`]*`\}[^>]*>(.*?)</span>", "", new_content)
                
                if new_content != content:
                    with open(fpath, "w", encoding="utf-8") as file:
                        file.write(new_content)
                    modified_files += 1
                    print(f"Cleaned icons in: {fpath}")

print(f"Done. Cleaned {modified_files} files.")
