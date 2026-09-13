
# 只加这几个文件，不用替换你现有整套代码

把本文件夹中的 4 个文件复制到你现在 Jupyter / Terminal 正在运行的项目目录：

- `waterpulse_visualization.py`
- `literature_registry.py`
- `literature_registry.json`
- `REFERENCES.bib`

## A. 接可视化

在你已经得到 `report_facts` 后加：

```python
from waterpulse_visualization import generate_report_visuals

charts = generate_report_visuals(
    report_facts=report_facts,
    output_dir="outputs",
    prefix=report_facts.get("meta", {}).get("run_id", "waterpulse")
)

print(charts)
```

会生成：
- 采购结构图
- 三类主要水风险来源图
- 重点供应地区贡献排序图
- 如果本次真的运行过 Scenario，再生成压力测试图

如果你还没有 `report_facts`，也可以：

```python
charts = generate_report_visuals(
    baseline_result=baseline_result,
    scenario_result=scenario_result,
    records=confirmed_records,
    output_dir="outputs",
    prefix="demo"
)
```

## B. 把文献给 AI / Word 报告使用

```python
from literature_registry import llm_reference_context, bibliography

reference_context = llm_reference_context()
```

将 `reference_context` 作为 AI system/context 的一个只读块传入。

必须保留这条规则：
> 文献仅用于方法依据、来源说明和管理建议背景；不得用文献中的数值替代本次用户输入、节点数据库或确定性计算结果。

Word 最后一节“参考文献”可直接：

```python
refs_text = bibliography()
```

如果只想拿水风险与干旱文献：

```python
refs_text = bibliography(["water_stress", "drought", "SPEI"])
```

## C. 图片插入 Word

如果你现有 `python-docx` 已经在生成 Word：

```python
from docx.shared import Inches

for key in ["procurement", "paths", "nodes", "scenario"]:
    path = charts.get(key)
    if path:
        doc.add_picture(path, width=Inches(6.2))
```

注意：报告正文只解释“风险在哪里、为什么、企业怎么办”。
不要把程序字段、JSON、日志、字段映射过程放进企业报告。
