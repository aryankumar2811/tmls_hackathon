// Types mirroring the FastAPI backend payloads.

export type Severity = "low" | "medium" | "high" | "critical";

export interface ScenarioMeta {
  id: string;
  equipment_id: string;
  equipment_name: string;
  line: string;
  title: string;
  severity: Severity;
  product: string;
  image: string;
  fire_at_t: number;
  hz: number;
  duration_s: number;
}

export interface Channel {
  key: string;
  label: string;
  unit: string;
  baseline: number;
  drift_to: number;
}

export interface SensorFrame {
  t: number;
  values: Record<string, number>;
}

export interface Detection {
  label: string;
  confidence: number;
  bbox: [number, number, number, number]; // x, y, w, h (normalized)
}

export interface CVFrame {
  t: number;
  defect_rate: number;
  detections: Detection[];
}

export interface TriggerResponse {
  session: string;
  scenario: string;
  meta: ScenarioMeta;
  channels: Channel[];
  cv_image: string;
  ml: MLMeta;
  ground_truth: { root_cause: string; matched_incident: string; impact_usd: [number, number] };
}

// Agent stream events (discriminated by `type`).
export interface AgentEvent {
  type:
    | "notification"
    | "supervisor"
    | "agent_start"
    | "tool_call"
    | "tool_result"
    | "agent_done"
    | "note"
    | "work_order"
    | "report"
    | "error"
    | "end";
  agent?: string;
  role?: string;
  model?: string;
  tool?: string;
  args?: Record<string, unknown>;
  result?: unknown;
  summary?: string;
  reasoning?: string;
  markdown?: string;
  next?: string;
  completed?: string[];
  wo?: WorkOrder;
  tokens?: number;
  cost?: number;
  message?: string;
  cached?: boolean;
  severity?: Severity;
  title?: string;
  equipment_id?: string;
  line?: string;
  t?: number;
}

export interface WorkOrder {
  wo_id: string;
  equipment_id: string;
  equipment_name: string;
  line: string;
  severity: Severity;
  root_cause: string;
  parts: string[];
  technician: string;
  eta_hours: number;
  estimated_impact_usd: [number, number];
  matched_incident?: string;
  created: string;
  pdf?: { pdf_path: string | null; ok: boolean; note?: string };
  slack?: { posted: boolean; note?: string };
}

export interface ReportResponse {
  session: string;
  scenario: string;
  status: string;
  cached: boolean;
  tokens: number;
  cost_usd: number;
  report: {
    markdown: string;
    findings: Record<string, string>;
    work_order: WorkOrder | null;
  } | null;
  work_order: WorkOrder | null;
  trace: AgentEvent[];
  ml: MLMeta;
  cv_image: string;
  ground_truth: { root_cause: string; matched_incident: string; impact_usd: [number, number] };
  meta: ScenarioMeta;
}

// Client-side aggregate for one triggered incident (one session).
export interface Incident {
  session: string;
  meta: ScenarioMeta;
  channels: Channel[];
  ml: MLMeta;
  groundTruth: { root_cause: string; matched_incident: string; impact_usd: [number, number] };
  sensorFrames: SensorFrame[];
  cvFrames: CVFrame[];
  agentEvents: AgentEvent[];
  report?: string;
  workOrder?: WorkOrder | null;
  status: "investigating" | "diagnosed";
  cached: boolean;
  tokens: number;
  cost: number;
  detectedAt: number;
  playhead: number;
}

export interface MLMeta {
  rul_hours: [number, number];
  feature_contributions: Record<string, number>;
  cv_classes: string[];
  conf_threshold: number;
  failure_probability: { t: number; p: number }[];
  defect_peak_rate: number;
  baseline_rate: number;
}
