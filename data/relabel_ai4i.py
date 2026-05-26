"""Load UCI AI4I 2020 and relabel its columns as bakery equivalents.

TODO (Mon): download to data/raw/, remap, write to data/processed/.
"""

COLUMN_MAP = {
    "Air temperature [K]": "oven_chamber_temp",
    "Process temperature [K]": "proofer_temp",
    "Rotational speed [rpm]": "mixer_rpm",
    "Torque [Nm]": "mixer_load",
    "Tool wear [min]": "element_runtime_hours",
    "Machine failure": "equipment_failure",
}


def relabel() -> None:
    """Read raw AI4I CSV, rename columns via COLUMN_MAP, save to processed/."""
    raise NotImplementedError("TODO (Mon): load + relabel AI4I 2020")


if __name__ == "__main__":
    relabel()
