// TSSPDCL Hyderabad GridResQ AI Types & Schemas

export type ThemeMode = 'dark' | 'light';
export type ActivePage = 'map' | 'incidents' | 'crews' | 'calls' | 'diagnosis' | 'login' | 'signup' | 'auth';

export type AssetState = 'HEALTHY' | 'DOWN' | 'MAINTENANCE' | 'UNKNOWN';
export type AssetType = 'SUBSTATION' | 'FEEDER' | 'TRANSFORMER' | 'END_USER';

export type CallStatus = 'IDLE' | 'RINGING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
export type IncidentPriority = 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_LOW' | 'UNASSESSED';
export type IncidentStatus = 'NEW' | 'DIAGNOSING' | 'NEEDS_REVIEW' | 'TICKETED' | 'RESOLVED' | 'ESCALATED';
export type TicketStatus = 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';
export type AckStatus = 'PENDING' | 'SENT' | 'FAILED';
export type CrewStatus = 'AVAILABLE' | 'DISPATCHED' | 'EN_ROUTE' | 'ON_SITE';

export interface DistributionHub {
  id: string;
  code: string;
  name: string;
  locality: string;
  circle: string; // e.g. Cybercity Circle, TSSPDCL
  substationCode: string;
  feederCode: string;
  voltage: string;
  status: AssetState;
  coordinates: [number, number];
  transformerIds: string[];
  totalConsumers: number;
}

export interface GridAsset {
  id: string;
  code: string;
  name: string;
  type: AssetType;
  voltage: string;
  state: AssetState;
  parentAssetId?: string;
  hubId?: string;
  feederCode?: string;
  coordinates: [number, number]; // [lng, lat]
  consumersAffected?: number;
  lastTelemetryTimestamp?: string;
  capacityKva?: number;
  currentLoadAmps?: number;
  serviceConnectionNo?: string; // TSSPDCL Unique Service Connection Number (USC)
  consumerCategory?: 'DOMESTIC' | 'COMMERCIAL' | 'INDUSTRIAL';
}

export interface EndUserPremises {
  id: string;
  serviceConnectionNo: string; // e.g. 1104-58293
  consumerName: string;
  addressText: string;
  locality: string;
  transformerId: string;
  coordinates: [number, number];
  contactPhone: string;
  loadKw: number;
}

export interface CrewMember {
  id: string;
  name: string;
  role: string; // e.g. 'Assistant Engineer (Op)', 'Senior Lineman', 'Assistant Lineman', 'Sky-lift Operator'
  phone: string;
  status: 'AVAILABLE' | 'ASSIGNED' | 'RESTING';
  assignedTicketId?: string;
  assignedTicketNumber?: string;
  assignedTaskDescription?: string;
  assignedAt?: string;
  experience: string; // e.g. '15 yrs • 33/11kV Certified'
  avatarInitials: string;
  gangId?: string;
  gangName?: string;
  vehicleId?: string;
  sectionOffice?: string;
  closestTicket?: ClosestTicketInfo | null;
}

export interface ClosestTicketInfo {
  ticketId: string;
  ticketNumber: string;
  priority: IncidentPriority;
  locality: string;
  primaryAssetCode: string;
  summary: string;
  distanceKm: number;
  etaMinutes: number;
}

export interface FieldCrew {
  id: string;
  name: string;
  shortName?: string;
  sectionOffice: string; // TSSPDCL Section Office
  leadTechnician: string;
  leadPhone: string;
  specialization: 'HIGH_VOLTAGE_11KV' | 'TRANSFORMER_DTR_BREAKDOWN' | 'FUSE_OFF_CALL' | 'GENERAL_LV';
  specializationLabel: string;
  vehicleId: string; // Telangana vehicle registration, e.g. TS-09-EA-4412
  vehicleType: string; // e.g. Hydraulic Sky-lift (18m)
  status: CrewStatus;
  currentLocation: string;
  baseDepot: string;
  coordinates: [number, number]; // [lng, lat]
  speedKmph?: number;
  etaMinutes?: number;
  assignedIncidentId?: string;
  assignedTicketNumber?: string;
  assignedTaskDescription?: string;
  assignedAt?: string;
  phoneContact: string;
  members: CrewMember[];
  closestTicket?: ClosestTicketInfo | null;
}

export interface TranscriptSegment {
  id: string;
  sequenceNo: number;
  speaker: 'CALLER' | 'AI_AGENT' | 'SYSTEM';
  text: string;
  timestamp: string;
}

export interface Hypothesis {
  causeCode: 'FEEDER_OUTAGE' | 'TRANSFORMER_FAILURE' | 'PLANNED_MAINTENANCE' | 'UNKNOWN';
  title: string;
  explanation: string;
  evidenceIds: string[];
  confidenceBand: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceScore: number;
}

export interface DiagnosisResult {
  status: 'DIAGNOSED' | 'INSUFFICIENT_EVIDENCE' | 'NEEDS_CLARIFICATION';
  hypotheses: Hypothesis[];
  customerSafeSummary: string;
  operatorSummary: string;
  nextVerificationSteps: string[];
  needsHumanReview: boolean;
  generatedAt: string;
  evidenceCount: number;
}

export interface IncidentComment {
  id: string;
  author: string;
  role: 'OPERATOR' | 'FIELD_CREW' | 'AI_SYSTEM' | 'SUPERVISOR';
  content: string;
  timestamp: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  callId: string;
  serviceConnectionNo: string;
  locality: string;
  substationName?: string;
  sectionOffice?: string;
  primaryAssetCode: string;
  priority: IncidentPriority;
  status: TicketStatus;
  summary: string;
  customerSummary: string;
  acknowledgementChannel: string;
  acknowledgementStatus: AckStatus;
  recipientContact: string;
  createdAt: string;
  resolvedAt?: string;
  durationText?: string;
  resolutionReason?: string;
  resolutionCategory?: string;
  allocatedTechnicianId?: string;
  assignedTechnicianName?: string;
  assignedTechnicianRole?: string;
  assignedTechnicianPhone?: string;
  allocatedCrewId?: string;
  assignedCrewName?: string;
  assignedCrewLead?: string;
  assignedCrewVehicle?: string;
  assignedCrewPhone?: string;
  assignedOperatorName?: string;
  consumersAffected?: number;
  comments: IncidentComment[];
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: 'SYSTEM' | 'AI_AGENT' | 'HUMAN_OPERATOR';
  action: string;
  details: string;
  badgeColor?: string;
}

export interface DemoScenario {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  callerNumber: string;
  locality: string;
  hubId: string;
  targetAssetCode: string;
  initialTranscript: TranscriptSegment[];
  diagnosis: DiagnosisResult;
  ticket: Ticket;
  auditTrail: AuditLogItem[];
  recommendedCrewId: string;
}
