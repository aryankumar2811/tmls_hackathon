# cv/

Owner: **CV / Data lead**.

YOLOv11 (Ultralytics) fine-tuned for bakery defect detection (uneven browning,
burnt, mold, good). Goal is **visible bounding boxes that look right on the demo
images** — do not chase accuracy past that.

> ⚠️ All training images are synthetic or pulled from Roboflow Universe. No real
> FGF imagery. Be open about this on stage.

- `train.py` — fine-tune YOLOv11n on the small dataset (~200 imgs: 100 good + 100
  defective; half real from Roboflow, half Stable Diffusion / ControlNet generated).
- `infer.py` — `/predict` inference; streams detections over SSE to the dashboard.
- `datasets/` — Roboflow Universe bakery datasets (gitignored; see its README).
- `synthetic/` — Stable Diffusion + ControlNet "good → defective" generation.
- `weights/` — model weights (gitignored).

**Fallback:** if inference > 2 s by Wed noon → YOLOv11-nano on CPU + cache results.
Do **not** re-run the full model 30×/min on stage.
