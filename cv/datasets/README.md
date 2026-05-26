# cv/datasets/

Pull bakery datasets from **Roboflow Universe** (classes for baguette / croissant /
burnt / mold / etc.) in YOLO format. Drop the exported folders here.

Contents are **gitignored** (large). Keep a `data.yaml` describing class names +
train/val splits for `cv/train.py`.

Target: ~200 images total (100 good + 100 defective). Half real from Roboflow,
half generated in `../synthetic/`.
