# reports/

ReportLab PDF work orders — professional-looking, embeds a parts table, severity
badge, predicted $ impact, and a QR code. Output consumed by the Work-Order Agent
and attached to the Slack message.

- `work_order_pdf.py` — `render(work_order) -> path`.

Test 10× on Wednesday. Cache the output so the demo never re-renders on stage.
