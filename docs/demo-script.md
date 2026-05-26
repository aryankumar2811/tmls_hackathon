# The 90-Second Demo Script

> Memorize verbatim by Thursday night. Rehearse 10× out loud. Have a teammate play a rude judge.

## [0:00–0:15] The hook
> "FGF Brands runs 22 bakeries producing hundreds of thousands of products a day under Stonefire, ACE, and Wonder. They had a Listeria recall of 2 million units in January 2024 and their CFO has publicly committed to Industry 4.0. The gap nobody's closing: nothing connects 'is the equipment dying?' to 'is the product wrong?' That's what OvenMind does."

*[click Trigger Scenario → "Oven Zone 2 — element degradation"]*

## [0:15–0:35] The trigger
- Live chart: Line 3 oven Zone 2 current draw drifting +12% over 30 s; thermocouple variance climbing.
- **Equipment Agent:** *"Anomaly detected on Tunnel Oven TO-3 Zone 2. Vibration baseline normal. Current draw and temp variance suggest element degradation. RUL estimate: 14–48 hours."*

## [0:35–0:55] The cross-modal moment (the WOW)
- CV feed of naan starts showing uneven-browning bounding boxes; defect rate jumps 0.4% → 6.8%.
- **Quality Agent:** *"Browning uniformity defect rate on Line 3 increased 17× in 90 seconds. Affected zone: top surface, leading edge."*
- **Correlation Agent (Sonnet), reasoning visible live:** *"Equipment anomaly on TO-3 Zone 2 (top heating element) temporally and spatially aligned with CV defect localized to product top surface, leading edge. Probability of common root cause: high. Cross-referencing historical incidents..."*

## [0:55–1:15] RAG + autonomous action
- RAG retrieves **INC-2025-0317** (seeded match): *"identical pattern, 4.2 hr downtime, $18,400 cost, root cause: element coil degradation."*
- **Work-Order Agent** generates **WO-2026-0528-001** as a real PDF (parts from the equipment manual in RAG, technician auto-assigned, ETA computed).
- Slack channel **#maintenance-line3** receives a real message with the PDF attached, severity badge, and predicted impact ($14k–$22k if not intervened in 8 hrs).

## [1:15–1:30] The audit-trail close
- Click **"Show reasoning"** → full agent graph: 23 tool calls, 6 RAG retrievals, supervisor handoffs, total tokens, total cost ($0.43).
- "Every decision is logged. Every action is reversible. Every dollar is tracked. This is the intelligence layer FGF can drop on top of their existing CMMS and CV stack."

---

## B-side demos (for judges who linger at the expo)
1. **Conversational mode** — type "what's wrong with Line 3?" → full RAG + correlation.
2. **Severity escalation** — a scenario where the agent escalates to a "Plant Manager" Slack channel.
3. **Historical query** — "show me all element failures last quarter" → RAG + fake incident DB.

## "Things that can go wrong" cheat sheet
- Slack down → screenshot fallback.
- CV slow → switch to pre-recorded inference.
- Claude rate-limited → GPT-4o-mini with same prompts.

## Honesty notes (judges value this)
- All data is synthetic; failure modes are grounded in published references.
- FGF's current CV (AnyVision) is **access control only** — we extend that to the line. Do not claim they already do line inspection.
- Pickering Wonderbrands campus is **under construction** (groundbreaking July 17 2023), not operational.
