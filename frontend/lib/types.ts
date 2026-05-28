// Types mirroring the FastAPI backend payloads.

export type Severity = "low" | "medium" | "critical";

export interface Prediction {
  class: 1 | 2 | 3;
  class_name: Severity;
  probabilities: [number, number, number];
  top_features: string[];
  anomalous_features: string[];
}

export interface IssueContext {
  error_code: string | null;
  error_description: string | null;
  last_maintenance_date: string | null;
  maintenance_type: string | null;
  firmware_version: string | null;
  operator_id: string | null;
  shift: string | null;
  ground_truth_severity: number | null;
  ground_truth_description: string | null;
  corrective_action: string | null;
}

/** A single record predicted by the model; rendered as a row in the table. */
export interface Issue {
  id: string;                              // Record_ID, e.g. "REC-00459"
  equipment_id: string;
  machine_name: string;
  machine_type: string;
  line: string;
  plant: string;
  manufacturer: string;
  product: string | null;
  title: string;
  detectedAt: number;                      // ms epoch
  severity: Severity;
  features: Record<string, number | string | null>;
  prediction: Prediction;
  context: IssueContext;
}

export interface WorkOrder {
  wo_id: string;
  equipment_id: string;
  equipment_name: string;
  line: string;
  plant: string;
  severity: Severity;
  root_cause: string;
  parts: string[];
  technician: string;
  eta_hours: number;
  estimated_impact_usd: [number, number];
  error_code?: string | null;
  suggested_action_csv?: string | null;
  created: string;
  pdf?: { pdf_path: string | null; ok: boolean; note?: string };
  slack?: { posted: boolean; note?: string };
}

// Agent stream events (discriminated by `type`).
export interface AgentEvent {
  type:
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
}

export interface ModelInfo {
  feature_names: string[];
  numeric_features: string[];
  feature_importances: Record<string, number>;
  class_labels: [1, 2, 3];
  class_names: Record<1 | 2 | 3, Severity>;
  baselines: Record<string, number>;
  anomaly_thresholds: Record<string, number>;
  units: Record<string, string>;
}

/** Per-issue client-side aggregate including any in-flight analysis. */
export interface IssueState extends Issue {
  analysisStatus: "idle" | "analyzing" | "diagnosed" | "error";
  session?: string;
  agentEvents: AgentEvent[];
  report?: string;
  workOrder?: WorkOrder | null;
  tokens: number;
  cost: number;
  cached: boolean;
}
