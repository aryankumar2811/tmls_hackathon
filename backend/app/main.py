"""FastAPI entrypoint for OvenMind.

Exposes the SSE streams the dashboard subscribes to and the /trigger control
surface that kicks off a demo scenario.

Run: `make backend`  (uvicorn backend.app.main:app --reload --port 8000)

TODO (Tue): implement the SSE generators and wire /trigger to the simulator
+ supervisor. Everything here is a stub so the app boots and routes resolve.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="OvenMind", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/trigger")
def trigger_scenario(scenario: str) -> dict:
    """Start a demo scenario (e.g. 'oven_zone2_element_degradation').

    TODO (Tue): launch the drift simulator for `scenario` and let the
    supervisor observe the resulting stream.
    """
    raise NotImplementedError("TODO (Tue): start scenario + supervisor")


@app.get("/stream/sensors")
async def stream_sensors():
    """SSE: 8 sensor channels @ 2 Hz from the drift simulator.

    TODO (Tue): return an EventSourceResponse over drift_simulator frames.
    """
    raise NotImplementedError("TODO (Tue): SSE sensor stream")


@app.get("/stream/cv")
async def stream_cv():
    """SSE: YOLOv11 detections (bounding boxes + defect rate).

    TODO (Tue): return an EventSourceResponse over cv.infer detections.
    """
    raise NotImplementedError("TODO (Tue): SSE CV stream")


@app.get("/stream/agent")
async def stream_agent_log():
    """SSE: the live agent reasoning / audit-trail log.

    TODO (Wed): stream log_action events + LangSmith trace summaries.
    """
    raise NotImplementedError("TODO (Wed): SSE agent log stream")
