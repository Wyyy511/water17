
from __future__ import annotations
from pathlib import Path
import math
import pandas as pd
import matplotlib.pyplot as plt

def _records(x):
    if x is None:
        return []
    if isinstance(x, pd.DataFrame):
        return x.to_dict(orient="records")
    if isinstance(x, list):
        return x
    return []

def _save(fig, path):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.tight_layout()
    fig.savefig(path, dpi=180, bbox_inches="tight")
    plt.close(fig)
    return str(path)

def plot_procurement_structure(records, out_path):
    """企业采购结构：按采购占比绘图。Unknown 保留，不自动归一化。"""
    rows = _records(records)
    labels, values = [], []
    for r in rows:
        w = r.get("purchase_weight")
        if w is None:
            continue
        labels.append(str(r.get("node_name") or r.get("node_id") or "Unknown"))
        values.append(float(w) * 100)

    fig, ax = plt.subplots(figsize=(8, max(3, 0.48 * max(len(labels), 1) + 1)))
    ax.barh(range(len(labels)), values)
    ax.set_yticks(range(len(labels)), labels)
    ax.invert_yaxis()
    ax.set_xlabel("采购占比 (%)")
    ax.set_title("采购结构")
    for i, v in enumerate(values):
        ax.text(v + 0.6, i, f"{v:.1f}%", va="center", fontsize=9)
    if values:
        ax.set_xlim(0, max(100, max(values) * 1.15))
    return _save(fig, out_path)

def plot_path_contributions(summary, out_path):
    """三条风险路径的绝对贡献与占比。"""
    rows = _records(summary)
    if not rows:
        return None
    s = rows[0]
    labels = ["长期缺水", "历史干旱", "季节波动"]
    vals = [
        float(s.get("path_contrib_WS") or 0),
        float(s.get("path_contrib_DR") or 0),
        float(s.get("path_contrib_SV") or 0),
    ]
    total = sum(vals)

    fig, ax = plt.subplots(figsize=(7.5, 3.5))
    bars = ax.bar(labels, vals)
    ax.set_ylabel("风险贡献值")
    ax.set_title("主要水风险来源")
    for bar, v in zip(bars, vals):
        pct = (v / total * 100) if total else 0
        ax.text(bar.get_x() + bar.get_width()/2, v, f"{v:.4f}\n{pct:.1f}%",
                ha="center", va="bottom", fontsize=9)
    return _save(fig, out_path)

def plot_node_contributions(nodes, out_path, top_n=8):
    """供应节点对采购组合的风险贡献排序。"""
    rows = [r for r in _records(nodes) if r.get("C") is not None]
    rows = sorted(rows, key=lambda r: float(r.get("C") or 0), reverse=True)[:top_n]
    labels = [str(r.get("node_name") or r.get("node_id") or "节点") for r in rows]
    vals = [float(r.get("C") or 0) for r in rows]

    fig, ax = plt.subplots(figsize=(8, max(3, 0.48 * max(len(rows), 1) + 1)))
    ax.barh(range(len(rows)), vals)
    ax.set_yticks(range(len(rows)), labels)
    ax.invert_yaxis()
    ax.set_xlabel("对采购组合的风险贡献")
    ax.set_title("重点供应地区排序")
    for i, (r, v) in enumerate(zip(rows, vals)):
        share = r.get("contribution_share")
        label = f"{v:.4f}"
        if share is not None:
            label += f"  ({float(share)*100:.1f}%)"
        ax.text(v + (max(vals) * 0.015 if vals and max(vals) else 0.002), i, label,
                va="center", fontsize=8)
    return _save(fig, out_path)

def plot_scenario_result(scenario, out_path):
    """只画本次实际运行的情景，不创建未运行结果。"""
    if not scenario:
        return None
    d = scenario.get("data") if isinstance(scenario, dict) else None
    if not d:
        return None

    typ = d.get("scenario_type")
    fig, ax = plt.subplots(figsize=(7.5, 3.8))

    if typ == "NodeFailure":
        labels = ["供应损失", "库存缓冲", "替代供应", "未满足需求"]
        vals = [
            float(d.get("gross_loss") or 0),
            float(d.get("inventory_used") or 0),
            float(d.get("replacement_allocated") or 0),
            float(d.get("unmet_demand") or 0),
        ]
        bars = ax.bar(labels, vals)
        ax.set_ylabel("同口径供应量")
        ax.set_title("关键供应地区中断压力测试")
        for bar, v in zip(bars, vals):
            ax.text(bar.get_x()+bar.get_width()/2, v, f"{v:.4f}",
                    ha="center", va="bottom", fontsize=9)
    else:
        base = d.get("PRWI_baseline")
        scen = d.get("PRWI_scenario")
        if scen is None:
            scen = d.get("PRWI_future")
        labels = ["当前", "压力测试"]
        vals = [float(base or 0), float(scen or 0)]
        bars = ax.bar(labels, vals)
        ax.set_ylabel("同口径风险指数")
        ax.set_title("当前风险与压力测试对比")
        for bar, v in zip(bars, vals):
            ax.text(bar.get_x()+bar.get_width()/2, v, f"{v:.4f}",
                    ha="center", va="bottom", fontsize=9)

    return _save(fig, out_path)

def generate_report_visuals(report_facts=None, baseline_result=None, scenario_result=None,
                            records=None, output_dir="outputs", prefix="waterpulse"):
    """
    兼容两种输入：
    1) report_facts（V9.7+）
    2) baseline_result + scenario_result + records（旧链路）
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    if report_facts:
        recs = ((report_facts.get("confirmed_inputs") or {}).get("records") or [])
        summary = ((report_facts.get("baseline") or {}).get("summary") or [])
        nodes = report_facts.get("nodes") or []
        scenario = report_facts.get("scenarios")
    else:
        recs = records or []
        data = (baseline_result or {}).get("data") or {}
        summary = data.get("summary") or []
        nodes = data.get("nodes") or []
        scenario = scenario_result

    return {
        "procurement": plot_procurement_structure(recs, output_dir / f"{prefix}_procurement.png") if recs else None,
        "paths": plot_path_contributions(summary, output_dir / f"{prefix}_paths.png") if _records(summary) else None,
        "nodes": plot_node_contributions(nodes, output_dir / f"{prefix}_nodes.png") if _records(nodes) else None,
        "scenario": plot_scenario_result(scenario, output_dir / f"{prefix}_scenario.png") if scenario else None,
    }
