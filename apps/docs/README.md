# 📘 FitVibe Documentation

Welcome to the **FitVibe project documentation**.

## Structure

| Path | Purpose |
|------|---------|
| `Product Requirements Document.md` | Product Requirements Document |
| `Technical Design Document.md` | Technical Design Document |
| `Testing & Quality Assurance Plan.md` | Testing & Quality Assurance Plan |
| `diagrams/` | Auto-extracted Mermaid diagrams |
| `diagrams_index.md` | Index of all Mermaid diagrams |

# Thoroughly extract all ```mermaid code blocks from PRD and TDD, auto-name by section,
# include names as comments, and pack into a ZIP with an index and updated docs README.

import re, os, zipfile
from pathlib import Path

# Input files
prd_path = Path("/mnt/data/Fitvibe_PRD.md")   # note lowercase v per uploaded path
tdd_path = Path("/mnt/data/FitVibe_TDD.md")

# Read file contents
prd_text = prd_path.read_text(encoding="utf-8")
tdd_text = tdd_path.read_text(encoding="utf-8")

def parse_headings(text):
    """Return list of (start_index, level, title) for markdown headings"""
    headings = []
    for m in re.finditer(r"^(#{1,6})\s+(.+)$", text, re.MULTILINE):
        level = len(m.group(1))
        title = m.group(2).strip()
        start = m.start()
        headings.append((start, level, title))
    return headings

def find_nearest_heading(headings, pos):
    """Find the nearest heading above the given character pos."""
    prev = None
    for start, level, title in headings:
        if start <= pos:
            prev = (level, title)
        else:
            break
    return prev  # can be None

def section_number_from_title(title):
    """Extract leading section number like '6.2.1', else None."""
    if not title:
        return None
    m = re.match(r"^(\d+(?:\.\d+)*)(?:\s+|[^\d])", title)
    return m.group(1) if m else None

def slugify(text):
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "_", text).strip("_")
    text = re.sub(r"_+", "_", text)
    return text or "section"

def extract_mermaid_blocks(text, source_prefix):
    """Extract mermaid blocks with metadata and suggested filenames."""
    headings = parse_headings(text)
    blocks = []
    # Regex to capture mermaid code fences; support optional language qualifiers (just mermaid)
    for m in re.finditer(r"```mermaid\s*\n(.*?)\n```", text, re.DOTALL | re.IGNORECASE):
        code = m.group(1).strip()
        pos = m.start()
        heading = find_nearest_heading(headings, pos)
        if heading:
            level, title = heading
        else:
            level, title = (None, "Untitled")
        secnum = section_number_from_title(title)
        base = ""
        if secnum:
            base = f"{secnum}_{slugify(title[len(secnum):].strip())}"
        else:
            base = slugify(title)
        base = base.strip("_") or "diagram"
        # Prepare filename; will add numeric suffix if duplicates
        blocks.append({
            "title": title,
            "section": secnum or "n/a",
            "code": code,
            "base": base
        })
    # Deduplicate names
    counts = {}
    files = []
    for b in blocks:
        base = b["base"]
        counts[base] = counts.get(base, 0) + 1
        suffix = "" if counts[base] == 1 else f"_{counts[base]}"
        filename = f"{source_prefix}_{base}{suffix}.mmd"
        header_comment = f"%% Source: {source_prefix.upper()} | Section: {b['section']} | Heading: {b['title']}"
        content = f"{header_comment}\n{b['code']}\n"
        files.append((filename, content, b))
    return files

# Extract from PRD and TDD
prd_files = extract_mermaid_blocks(prd_text, "prd")
tdd_files = extract_mermaid_blocks(tdd_text, "tdd")
all_files = prd_files + tdd_files

# Build index markdown
index_lines = [
    "# 🗺️ FitVibe – Mermaid Diagrams Index",
    "",
    "This index lists all Mermaid diagrams extracted from the PRD and TDD. Filenames are auto-named from section headings.",
    "",
    "| File | Origin | Section | Heading |",
    "|------|--------|---------|---------|"
]
for fname, _content, meta in all_files:
    origin = "PRD" if fname.startswith("prd_") else "TDD"
    index_lines.append(f"| [{fname}](./diagrams/{fname}) | {origin} | {meta['section']} | {meta['title']} |")
index_md = "\n".join(index_lines) + "\n"

# Updated docs README (non-destructive standalone)
readme_md = """# 📘 FitVibe Documentation

Welcome to the **FitVibe project documentation**.

## Structure

| Path | Purpose |
|------|---------|
| `Fitvibe_PRD.md` | Product Requirements Document |
| `FitVibe_TDD.md` | Technical Design Document |
| `FitVibe_QA_Plan.md` | Testing & Quality Assurance Plan |
| `docs/diagrams/` | Auto-extracted Mermaid diagrams |
| `docs/diagrams_index.md` | Index of all Mermaid diagrams |

> To refresh diagrams after changing PRD/TDD, re-run the extraction.
"""

```# Thoroughly extract all ```mermaid code blocks from PRD and TDD, auto-name by section,
# include names as comments, and pack into a ZIP with an index and updated docs README.

import re, os, zipfile
from pathlib import Path

# Input files
prd_path = Path("/mnt/data/Fitvibe_PRD.md")   # note lowercase v per uploaded path
tdd_path = Path("/mnt/data/FitVibe_TDD.md")

# Read file contents
prd_text = prd_path.read_text(encoding="utf-8")
tdd_text = tdd_path.read_text(encoding="utf-8")

def parse_headings(text):
    """Return list of (start_index, level, title) for markdown headings"""
    headings = []
    for m in re.finditer(r"^(#{1,6})\s+(.+)$", text, re.MULTILINE):
        level = len(m.group(1))
        title = m.group(2).strip()
        start = m.start()
        headings.append((start, level, title))
    return headings

def find_nearest_heading(headings, pos):
    """Find the nearest heading above the given character pos."""
    prev = None
    for start, level, title in headings:
        if start <= pos:
            prev = (level, title)
        else:
            break
    return prev  # can be None

def section_number_from_title(title):
    """Extract leading section number like '6.2.1', else None."""
    if not title:
        return None
    m = re.match(r"^(\d+(?:\.\d+)*)(?:\s+|[^\d])", title)
    return m.group(1) if m else None

def slugify(text):
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "_", text).strip("_")
    text = re.sub(r"_+", "_", text)
    return text or "section"

def extract_mermaid_blocks(text, source_prefix):
    """Extract mermaid blocks with metadata and suggested filenames."""
    headings = parse_headings(text)
    blocks = []
    # Regex to capture mermaid code fences; support optional language qualifiers (just mermaid)
    for m in re.finditer(r"```mermaid\s*\n(.*?)\n```", text, re.DOTALL | re.IGNORECASE):
        code = m.group(1).strip()
        pos = m.start()
        heading = find_nearest_heading(headings, pos)
        if heading:
            level, title = heading
        else:
            level, title = (None, "Untitled")
        secnum = section_number_from_title(title)
        base = ""
        if secnum:
            base = f"{secnum}_{slugify(title[len(secnum):].strip())}"
        else:
            base = slugify(title)
        base = base.strip("_") or "diagram"
        # Prepare filename; will add numeric suffix if duplicates
        blocks.append({
            "title": title,
            "section": secnum or "n/a",
            "code": code,
            "base": base
        })
    # Deduplicate names
    counts = {}
    files = []
    for b in blocks:
        base = b["base"]
        counts[base] = counts.get(base, 0) + 1
        suffix = "" if counts[base] == 1 else f"_{counts[base]}"
        filename = f"{source_prefix}_{base}{suffix}.mmd"
        header_comment = f"%% Source: {source_prefix.upper()} | Section: {b['section']} | Heading: {b['title']}"
        content = f"{header_comment}\n{b['code']}\n"
        files.append((filename, content, b))
    return files

# Extract from PRD and TDD
prd_files = extract_mermaid_blocks(prd_text, "prd")
tdd_files = extract_mermaid_blocks(tdd_text, "tdd")
all_files = prd_files + tdd_files

# Build index markdown
index_lines = [
    "# 🗺️ FitVibe – Mermaid Diagrams Index",
    "",
    "This index lists all Mermaid diagrams extracted from the PRD and TDD. Filenames are auto-named from section headings.",
    "",
    "| File | Origin | Section | Heading |",
    "|------|--------|---------|---------|"
]
for fname, _content, meta in all_files:
    origin = "PRD" if fname.startswith("prd_") else "TDD"
    index_lines.append(f"| [{fname}](./diagrams/{fname}) | {origin} | {meta['section']} | {meta['title']} |")
index_md = "\n".join(index_lines) + "\n"

# Updated docs README (non-destructive standalone)
readme_md = """# 📘 FitVibe Documentation

Welcome to the **FitVibe project documentation**.

## Structure

| Path | Purpose |
|------|---------|
| `Fitvibe_PRD.md` | Product Requirements Document |
| `FitVibe_TDD.md` | Technical Design Document |
| `FitVibe_QA_Plan.md` | Testing & Quality Assurance Plan |
| `docs/diagrams/` | Auto-extracted Mermaid diagrams |
| `docs/diagrams_index.md` | Index of all Mermaid diagrams |

> To refresh diagrams after changing PRD/TDD, re-run the extraction.
# Thoroughly extract all ```mermaid code blocks from PRD and TDD, auto-name by section,
# include names as comments, and pack into a ZIP with an index and updated docs README.

import re, os, zipfile
from pathlib import Path

# Input files
prd_path = Path("/mnt/data/Fitvibe_PRD.md")   # note lowercase v per uploaded path
tdd_path = Path("/mnt/data/FitVibe_TDD.md")

# Read file contents
prd_text = prd_path.read_text(encoding="utf-8")
tdd_text = tdd_path.read_text(encoding="utf-8")

def parse_headings(text):
    """Return list of (start_index, level, title) for markdown headings"""
    headings = []
    for m in re.finditer(r"^(#{1,6})\s+(.+)$", text, re.MULTILINE):
        level = len(m.group(1))
        title = m.group(2).strip()
        start = m.start()
        headings.append((start, level, title))
    return headings

def find_nearest_heading(headings, pos):
    """Find the nearest heading above the given character pos."""
    prev = None
    for start, level, title in headings:
        if start <= pos:
            prev = (level, title)
        else:
            break
    return prev  # can be None

def section_number_from_title(title):
    """Extract leading section number like '6.2.1', else None."""
    if not title:
        return None
    m = re.match(r"^(\d+(?:\.\d+)*)(?:\s+|[^\d])", title)
    return m.group(1) if m else None

def slugify(text):
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "_", text).strip("_")
    text = re.sub(r"_+", "_", text)
    return text or "section"

def extract_mermaid_blocks(text, source_prefix):
    """Extract mermaid blocks with metadata and suggested filenames."""
    headings = parse_headings(text)
    blocks = []
    # Regex to capture mermaid code fences; support optional language qualifiers (just mermaid)
    for m in re.finditer(r"```mermaid\s*\n(.*?)\n```", text, re.DOTALL | re.IGNORECASE):
        code = m.group(1).strip()
        pos = m.start()
        heading = find_nearest_heading(headings, pos)
        if heading:
            level, title = heading
        else:
            level, title = (None, "Untitled")
        secnum = section_number_from_title(title)
        base = ""
        if secnum:
            base = f"{secnum}_{slugify(title[len(secnum):].strip())}"
        else:
            base = slugify(title)
        base = base.strip("_") or "diagram"
        # Prepare filename; will add numeric suffix if duplicates
        blocks.append({
            "title": title,
            "section": secnum or "n/a",
            "code": code,
            "base": base
        })
    # Deduplicate names
    counts = {}
    files = []
    for b in blocks:
        base = b["base"]
        counts[base] = counts.get(base, 0) + 1
        suffix = "" if counts[base] == 1 else f"_{counts[base]}"
        filename = f"{source_prefix}_{base}{suffix}.mmd"
        header_comment = f"%% Source: {source_prefix.upper()} | Section: {b['section']} | Heading: {b['title']}"
        content = f"{header_comment}\n{b['code']}\n"
        files.append((filename, content, b))
    return files

# Extract from PRD and TDD
prd_files = extract_mermaid_blocks(prd_text, "prd")
tdd_files = extract_mermaid_blocks(tdd_text, "tdd")
all_files = prd_files + tdd_files

# Build index markdown
index_lines = [
    "# 🗺️ FitVibe – Mermaid Diagrams Index",
    "",
    "This index lists all Mermaid diagrams extracted from the PRD and TDD. Filenames are auto-named from section headings.",
    "",
    "| File | Origin | Section | Heading |",
    "|------|--------|---------|---------|"
]
for fname, _content, meta in all_files:
    origin = "PRD" if fname.startswith("prd_") else "TDD"
    index_lines.append(f"| [{fname}](./diagrams/{fname}) | {origin} | {meta['section']} | {meta['title']} |")
index_md = "\n".join(index_lines) + "\n"

# Updated docs README (non-destructive standalone)
readme_md = """# 📘 FitVibe Documentation

Welcome to the **FitVibe project documentation**.

## Structure

| Path | Purpose |
|------|---------|
| `Fitvibe_PRD.md` | Product Requirements Document |
| `FitVibe_TDD.md` | Technical Design Document |
| `FitVibe_QA_Plan.md` | Testing & Quality Assurance Plan |
| `docs/diagrams/` | Auto-extracted Mermaid diagrams |
| `docs/diagrams_index.md` | Index of all Mermaid diagrams |

> To refresh diagrams after changing PRD/TDD, re-run the extraction.

# Thoroughly extract all ```mermaid code blocks from PRD and TDD, auto-name by section,
# include names as comments, and pack into a ZIP with an index and updated docs README.

import re, os, zipfile
from pathlib import Path

# Input files
prd_path = Path("/mnt/data/Fitvibe_PRD.md")   # note lowercase v per uploaded path
tdd_path = Path("/mnt/data/FitVibe_TDD.md")

# Read file contents
prd_text = prd_path.read_text(encoding="utf-8")
tdd_text = tdd_path.read_text(encoding="utf-8")

def parse_headings(text):
    """Return list of (start_index, level, title) for markdown headings"""
    headings = []
    for m in re.finditer(r"^(#{1,6})\s+(.+)$", text, re.MULTILINE):
        level = len(m.group(1))
        title = m.group(2).strip()
        start = m.start()
        headings.append((start, level, title))
    return headings

def find_nearest_heading(headings, pos):
    """Find the nearest heading above the given character pos."""
    prev = None
    for start, level, title in headings:
        if start <= pos:
            prev = (level, title)
        else:
            break
    return prev  # can be None

def section_number_from_title(title):
    """Extract leading section number like '6.2.1', else None."""
    if not title:
        return None
    m = re.match(r"^(\d+(?:\.\d+)*)(?:\s+|[^\d])", title)
    return m.group(1) if m else None

def slugify(text):
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "_", text).strip("_")
    text = re.sub(r"_+", "_", text)
    return text or "section"

def extract_mermaid_blocks(text, source_prefix):
    """Extract mermaid blocks with metadata and suggested filenames."""
    headings = parse_headings(text)
    blocks = []
    # Regex to capture mermaid code fences; support optional language qualifiers (just mermaid)
    for m in re.finditer(r"```mermaid\s*\n(.*?)\n```", text, re.DOTALL | re.IGNORECASE):
        code = m.group(1).strip()
        pos = m.start()
        heading = find_nearest_heading(headings, pos)
        if heading:
            level, title = heading
        else:
            level, title = (None, "Untitled")
        secnum = section_number_from_title(title)
        base = ""
        if secnum:
            base = f"{secnum}_{slugify(title[len(secnum):].strip())}"
        else:
            base = slugify(title)
        base = base.strip("_") or "diagram"
        # Prepare filename; will add numeric suffix if duplicates
        blocks.append({
            "title": title,
            "section": secnum or "n/a",
            "code": code,
            "base": base
        })
    # Deduplicate names
    counts = {}
    files = []
    for b in blocks:
        base = b["base"]
        counts[base] = counts.get(base, 0) + 1
        suffix = "" if counts[base] == 1 else f"_{counts[base]}"
        filename = f"{source_prefix}_{base}{suffix}.mmd"
        header_comment = f"%% Source: {source_prefix.upper()} | Section: {b['section']} | Heading: {b['title']}"
        content = f"{header_comment}\n{b['code']}\n"
        files.append((filename, content, b))
    return files

# Extract from PRD and TDD
prd_files = extract_mermaid_blocks(prd_text, "prd")
tdd_files = extract_mermaid_blocks(tdd_text, "tdd")
all_files = prd_files + tdd_files

# Build index markdown
index_lines = [
    "# 🗺️ FitVibe – Mermaid Diagrams Index",
    "",
    "This index lists all Mermaid diagrams extracted from the PRD and TDD. Filenames are auto-named from section headings.",
    "",
    "| File | Origin | Section | Heading |",
    "|------|--------|---------|---------|"
]
for fname, _content, meta in all_files:
    origin = "PRD" if fname.startswith("prd_") else "TDD"
    index_lines.append(f"| [{fname}](./diagrams/{fname}) | {origin} | {meta['section']} | {meta['title']} |")
index_md = "\n".join(index_lines) + "\n"

# Updated docs README (non-destructive standalone)
readme_md = """# 📘 FitVibe Documentation

Welcome to the **FitVibe project documentation**.

## Structure

| Path | Purpose |
|------|---------|
| `Fitvibe_PRD.md` | Product Requirements Document |
| `FitVibe_TDD.md` | Technical Design Document |
| `FitVibe_QA_Plan.md` | Testing & Quality Assurance Plan |
| `docs/diagrams/` | Auto-extracted Mermaid diagrams |
| `docs/diagrams_index.md` | Index of all Mermaid diagrams |

```
# code blocks from PRD and TDD, auto-name by section,
# include names as comments, and pack into a ZIP with an index and updated docs README.

import re, os, zipfile
from pathlib import Path

# Input files
prd_path = Path("/mnt/data/Fitvibe_PRD.md")   # note lowercase v per uploaded path
tdd_path = Path("/mnt/data/FitVibe_TDD.md")

# Read file contents
prd_text = prd_path.read_text(encoding="utf-8")
tdd_text = tdd_path.read_text(encoding="utf-8")

def parse_headings(text):
    """Return list of (start_index, level, title) for markdown headings"""
    headings = []
    for m in re.finditer(r"^(#{1,6})\s+(.+)$", text, re.MULTILINE):
        level = len(m.group(1))
        title = m.group(2).strip()
        start = m.start()
        headings.append((start, level, title))
    return headings

def find_nearest_heading(headings, pos):
    """Find the nearest heading above the given character pos."""
    prev = None
    for start, level, title in headings:
        if start <= pos:
            prev = (level, title)
        else:
            break
    return prev  # can be None

def section_number_from_title(title):
    """Extract leading section number like '6.2.1', else None."""
    if not title:
        return None
    m = re.match(r"^(\d+(?:\.\d+)*)(?:\s+|[^\d])", title)
    return m.group(1) if m else None

def slugify(text):
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "_", text).strip("_")
    text = re.sub(r"_+", "_", text)
    return text or "section"

def extract_mermaid_blocks(text, source_prefix):
    """Extract mermaid blocks with metadata and suggested filenames."""
    headings = parse_headings(text)
    blocks = []
    # Regex to capture mermaid code fences; support optional language qualifiers (just mermaid)
    for m in re.finditer(r"```mermaid\s*\n(.*?)\n```", text, re.DOTALL | re.IGNORECASE):
        code = m.group(1).strip()
        pos = m.start()
        heading = find_nearest_heading(headings, pos)
        if heading:
            level, title = heading
        else:
            level, title = (None, "Untitled")
        secnum = section_number_from_title(title)
        base = ""
        if secnum:
            base = f"{secnum}_{slugify(title[len(secnum):].strip())}"
        else:
            base = slugify(title)
        base = base.strip("_") or "diagram"
        # Prepare filename; will add numeric suffix if duplicates
        blocks.append({
            "title": title,
            "section": secnum or "n/a",
            "code": code,
            "base": base
        })
    # Deduplicate names
    counts = {}
    files = []
    for b in blocks:
        base = b["base"]
        counts[base] = counts.get(base, 0) + 1
        suffix = "" if counts[base] == 1 else f"_{counts[base]}"
        filename = f"{source_prefix}_{base}{suffix}.mmd"
        header_comment = f"%% Source: {source_prefix.upper()} | Section: {b['section']} | Heading: {b['title']}"
        content = f"{header_comment}\n{b['code']}\n"
        files.append((filename, content, b))
    return files

# Extract from PRD and TDD
prd_files = extract_mermaid_blocks(prd_text, "prd")
tdd_files = extract_mermaid_blocks(tdd_text, "tdd")
all_files = prd_files + tdd_files
```