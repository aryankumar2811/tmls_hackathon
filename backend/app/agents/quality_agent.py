"""Quality Agent (Claude Haiku 4.5).

Reads CV detections, computes defect-rate spikes, localizes affected zones.
Tools: query_cv, get_defect_rate, get_cv_window, query_rag, log_action.

TODO (Tue): create_react_agent bound to cv + rag + audit tools.
"""

from backend.app.config import settings


def build_quality_agent():
    raise NotImplementedError("TODO (Tue): build Quality agent (Haiku)")
