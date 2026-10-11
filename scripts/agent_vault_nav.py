#!/usr/bin/env python3
"""
Agent Vault Navigator - Codebase Knowledge Graph & Architecture Index
Specifically built for AI Assistant (Antigravity) to navigate EduCore ERP without reading 8000+ line files.
"""

import os
import sys
import json
import re
import argparse

VAULT_DIR = "/root/college-erp-educore/vault"
ROOT_DIR = "/root/college-erp-educore"

def search_vault(query):
    results = {}
    if not os.path.exists(VAULT_DIR):
        print("[!] Vault directory not found.")
        return results

    for f in os.listdir(VAULT_DIR):
        if not f.endswith('.md'):
            continue
        filepath = os.path.join(VAULT_DIR, f)
        with open(filepath, 'r', encoding='utf-8') as file:
            content = file.read()
            if query.lower() in content.lower():
                matches = [l.strip() for l in content.splitlines() if query.lower() in l.lower()]
                results[f] = matches[:5]
    return results

def get_table_info(table_name):
    schema_file = os.path.join(ROOT_DIR, "server/db.ts")
    with open(schema_file, 'r', encoding='utf-8') as f:
        content = f.read()

    pattern = rf"CREATE TABLE IF NOT EXISTS {table_name}\s*\((.*?)\);"
    match = re.search(pattern, content, re.DOTALL | re.IGNORECASE)
    if match:
        cols = [c.strip() for c in match.group(1).split('\n') if c.strip() and not c.strip().startswith('--')]
        return {
            "table": table_name,
            "columns": cols
        }
    return None

def get_route_info(endpoint_substring):
    routes_dir = os.path.join(ROOT_DIR, "server/routes")
    matched_routes = []
    for f in os.listdir(routes_dir):
        if not f.endswith('.ts'):
            continue
        path = os.path.join(routes_dir, f)
        with open(path, 'r', encoding='utf-8') as file:
            lines = file.readlines()
            for idx, line in enumerate(lines):
                if endpoint_substring.lower() in line.lower() and ('router.' in line.lower() or 'Router()' in line.lower() or 'app.use' in line.lower()):
                    matched_routes.append({
                        "file": f,
                        "line_num": idx + 1,
                        "declaration": line.strip()
                    })
    return matched_routes

def list_vault_notes():
    if not os.path.exists(VAULT_DIR):
        return []
    notes = []
    for f in sorted(os.listdir(VAULT_DIR)):
        if f.endswith('.md'):
            path = os.path.join(VAULT_DIR, f)
            with open(path, 'r', encoding='utf-8') as file:
                lines = file.readlines()
                title = f
                for l in lines[:10]:
                    if l.startswith('title:'):
                        title = l.split('title:')[1].strip().strip('"').strip("'")
                        break
                notes.append((f, title))
    return notes

def main():
    parser = argparse.ArgumentParser(description="Agent Knowledge Vault CLI for EduCore ERP")
    subparsers = parser.add_subparsers(dest="command")

    # Query command
    q_parser = subparsers.add_parser("query", help="Search vault knowledge base")
    q_parser.add_argument("keyword", help="Search term across all markdown vault nodes")

    # Table command
    t_parser = subparsers.add_parser("table", help="Inspect table schema")
    t_parser.add_argument("name", help="Table name to inspect")

    # Route command
    r_parser = subparsers.add_parser("route", help="Search API endpoints")
    r_parser.add_argument("endpoint", help="Endpoint path substring")

    # List command
    subparsers.add_parser("list", help="List all vault notes")

    args = parser.parse_args()

    if args.command == "query":
        res = search_vault(args.keyword)
        if not res:
            print(f"[-] No matches found for '{args.keyword}'.")
        else:
            print(f"[+] Found {len(res)} notes matching '{args.keyword}':")
            for note, lines in res.items():
                print(f"\n📄 [[{note.replace('.md', '')}]]:")
                for l in lines:
                    print(f"   • {l}")

    elif args.command == "table":
        info = get_table_info(args.name)
        if not info:
            print(f"[-] Table '{args.name}' not found in server/db.ts schema.")
        else:
            print(f"[+] Schema for table '{info['table']}':")
            for col in info['columns']:
                print(f"   • {col}")

    elif args.command == "route":
        routes = get_route_info(args.endpoint)
        if not routes:
            print(f"[-] No routes matching '{args.endpoint}'.")
        else:
            print(f"[+] Found {len(routes)} matching routes:")
            for r in routes:
                print(f"   • [{r['file']}:{r['line_num']}] {r['declaration']}")

    elif args.command == "list" or not args.command:
        notes = list_vault_notes()
        print(f"[+] EduCore Obsidian Vault ({len(notes)} notes):")
        for f, t in notes:
            print(f"   • [[{f.replace('.md', '')}]] - {t}")

if __name__ == "__main__":
    main()
