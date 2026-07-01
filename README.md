# 🔥 OvenMind

> **Agentic intelligence layer that fuses predictive maintenance and food computer vision for industrial bakeries.**

A LangGraph supervisor coordinates four specialist agents (Equipment, Quality, Work-Order, Reporting) plus a Correlation agent over synthetic IoT sensor data and a YOLOv11 bakery-defect model. The killer demo: a simulated oven heating-element fault triggers a sensor anomaly, the CV model catches uneven browning on the same line seconds later, the agent **autonomously links the two**, retrieves the matching past incident from RAG, and dispatches a PDF work order to Slack — live, in under 90 seconds.

Built for the **TMLS Hackathon, May 25–29 2026**. Target customer: **FGF Brands** (~$1.4B industrial bakery, 22+ sites).

> ⚠️ **All sensor and image data in this demo is synthetic.** Failure modes and sensor distributions are grounded in published industry references (UCI AI4I 2020, OXMaint failure-mode literature) and a real fine-tuned YOLOv11 baseline. Be honest about this on stage.
