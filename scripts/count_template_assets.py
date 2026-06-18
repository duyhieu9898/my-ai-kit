#!/usr/bin/env python3
import os
import re

def count_items(path, item_type='all'):
    if not os.path.exists(path):
        return 0
    items = os.listdir(path)
    if item_type == 'dir':
        return len([d for d in items if os.path.isdir(os.path.join(path, d))])
    elif item_type == 'file':
        # Skip directories and potentially hidden system files
        return len([f for f in items if os.path.isfile(os.path.join(path, f)) and not f.startswith('.')])
    else:
        return len([i for i in items if not i.startswith('.')])

def parse_documented_gemini(arch_path):
    if not os.path.exists(arch_path):
        return {}
    with open(arch_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract values from text
    agents = re.search(r'-\s*\*\*(\d+)\s*Specialist Agents\*\*', content)
    skills = re.search(r'-\s*\*\*(\d+)\s*Skills\*\*', content)
    workflows = re.search(r'-\s*\*\*(\d+)\s*Workflows\*\*', content)
    scripts = re.search(r'Total Scripts\*\*\s*\|\s*(\d+)\s*master', content)
    
    return {
        'agents': int(agents.group(1)) if agents else None,
        'skills': int(skills.group(1)) if skills else None,
        'workflows': int(workflows.group(1)) if workflows else None,
        'scripts': int(scripts.group(1)) if scripts else None
    }

def parse_documented_codex(arch_path):
    if not os.path.exists(arch_path):
        return {}
    with open(arch_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    skills = re.search(r'-\s*\*\*(\d+)\s*Composable Skills\*\*', content)
    scripts = re.search(r'-\s*\*\*(\d+)\s*Master Scripts\*\*', content)
    
    return {
        'skills': int(skills.group(1)) if skills else None,
        'scripts': int(scripts.group(1)) if scripts else None
    }

def print_result(template_name, category, actual, documented):
    if documented is None:
        status = "N/A"
        doc_str = "N/A"
    else:
        status = "✅ MATCH" if actual == documented else "❌ MISMATCH"
        doc_str = str(documented)
    print(f"| {template_name:<8} | {category:<12} | {actual:<10} | {doc_str:<12} | {status:<10} |")

def main():
    print("=" * 60)
    print(" TEMPLATE ASSETS COUNT & ARCHITECTURE.MD VERIFICATION")
    print("=" * 60)
    print(f"| {'Template':<8} | {'Category':<12} | {'Actual':<10} | {'Documented':<12} | {'Status':<10} |")
    print("|" + "-" * 10 + "|" + "-" * 14 + "|" + "-" * 12 + "|" + "-" * 14 + "|" + "-" * 12 + "|")
    
    # Gemini Paths
    gemini_base = "templates/gemini/.agents"
    gemini_arch = os.path.join(gemini_base, "ARCHITECTURE.md")
    
    gemini_actual = {
        'agents': count_items(os.path.join(gemini_base, "agents"), 'file'),
        'skills': count_items(os.path.join(gemini_base, "skills"), 'dir'),
        'workflows': count_items(os.path.join(gemini_base, "workflows"), 'file'),
        'scripts': count_items(os.path.join(gemini_base, "scripts"), 'file')
    }
    
    gemini_doc = parse_documented_gemini(gemini_arch)
    
    print_result("Gemini", "Agents", gemini_actual['agents'], gemini_doc.get('agents'))
    print_result("Gemini", "Skills", gemini_actual['skills'], gemini_doc.get('skills'))
    print_result("Gemini", "Workflows", gemini_actual['workflows'], gemini_doc.get('workflows'))

    print_result("Gemini", "Scripts", gemini_actual['scripts'], gemini_doc.get('scripts'))
    
    print("|" + "-" * 10 + "|" + "-" * 14 + "|" + "-" * 12 + "|" + "-" * 14 + "|" + "-" * 12 + "|")
    
    # Codex Paths
    codex_base = "templates/codex/.agents"
    codex_arch = os.path.join(codex_base, "ARCHITECTURE.md")
    
    codex_actual = {
        'skills': count_items(os.path.join(codex_base, "skills"), 'dir'),
        'scripts': count_items(os.path.join(codex_base, "scripts"), 'file')
    }
    
    codex_doc = parse_documented_codex(codex_arch)
    
    print_result("Codex", "Skills", codex_actual['skills'], codex_doc.get('skills'))
    print_result("Codex", "Scripts", codex_actual['scripts'], codex_doc.get('scripts'))
    
    print("=" * 60)

if __name__ == "__main__":
    main()
