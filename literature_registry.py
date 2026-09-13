
from __future__ import annotations
from pathlib import Path
import json

REGISTRY_PATH = Path(__file__).with_name("literature_registry.json")

def load_references():
    return json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))

def references_for(tags=None):
    refs = load_references()
    if not tags:
        return refs
    tags = set(tags)
    return [r for r in refs if tags.intersection(set(r.get("use_for") or []))]

def citation_text(ref):
    authors = ref.get("authors") or ""
    year = ref.get("year")
    title = ref.get("title") or ""
    publisher = ref.get("publisher") or ""
    doi = ref.get("doi")
    url = ref.get("url")
    tail = f"https://doi.org/{doi}" if doi else url
    y = str(year) if year else "n.d."
    return f"{authors} ({y}). {title}. {publisher}. {tail}"

def bibliography(tags=None):
    return "\n".join(citation_text(r) for r in references_for(tags))

def llm_reference_context():
    """
    给 AI 的“方法/文献背景”，不能替代本次计算数据。
    仅用于解释方法、来源和管理建议，不允许 AI 从文献中补造本次企业数值。
    """
    return {
        "rule": (
            "以下文献只用于方法依据、来源说明和管理建议背景。"
            "不得使用文献中的数值替代本次用户输入、节点数据库或确定性计算结果。"
        ),
        "references": load_references(),
    }
