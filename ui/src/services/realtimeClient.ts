import { DEMO_SCENARIOS, MOCK_INCIDENT_TICKETS } from '../mock/scenarios';
import { MOCK_ASSETS, MOCK_HUBS, MOCK_CREWS, MOCK_END_USERS } from '../mock/gridTopology';
import { api } from './api';
import { authClient } from './authClient';
import {
  CallStatus,
  DemoScenario,
  GridAsset,
  DistributionHub,
  FieldCrew,
  CrewMember,
  EndUserPremises,
  Ticket,
  IncidentComment,
  TranscriptSegment,
  DiagnosisResult,
  AuditLogItem,
  ThemeMode,
  ActivePage,
} from '../types';

export interface DashboardState {
  theme: ThemeMode;
  activePage: ActivePage;
  isMapFullscreen: boolean;
  currentScenario: DemoScenario;
  hubs: DistributionHub[];
  activeHub: DistributionHub;
  crews: FieldCrew[];
  allocatedCrew: FieldCrew | null;
  endUsers: EndUserPremises[];
  selectedEndUser: EndUserPremises | null;
  callStatus: CallStatus;
  callDuration: number;
  transcripts: TranscriptSegment[];
  assets: GridAsset[];
  activeIncidentDiagnosis: DiagnosisResult | null;
  activeTicket: Ticket | null;
  ticketsList: Ticket[];
  auditLogs: AuditLogItem[];
  isLiveSocketConnected: boolean;
  selectedAsset: GridAsset | null;
  focusedCoordinates: [number, number] | null;
  searchQuery: string;
}

export type StateListener = (state: DashboardState) => void;

class RealtimeClient {
  private listeners: StateListener[] = [];
  private state: DashboardState;
  private timerInterval: number | null = null;
  private scenarioSimulationTimers: number[] = [];

  constructor() {
    const defaultScenario = DEMO_SCENARIOS.feeder_fault;
    const defaultHub = MOCK_HUBS.find((h) => h.id === defaultScenario.hubId) || MOCK_HUBS[0];
    const defaultCrew = MOCK_CREWS.find((c) => c.id === defaultScenario.recommendedCrewId) || MOCK_CREWS[0];
    const initialPage: ActivePage = authClient.getState().isAuthenticated ? 'map' : 'login';
    const savedTheme = (localStorage.getItem('gridresq_theme') as ThemeMode) || 'light';

    this.state = {
      theme: savedTheme,
      activePage: initialPage,
      isMapFullscreen: false,
      currentScenario: defaultScenario,
      hubs: JSON.parse(JSON.stringify(MOCK_HUBS)),
      activeHub: defaultHub,
      crews: JSON.parse(JSON.stringify(MOCK_CREWS)),
      allocatedCrew: defaultCrew,
      endUsers: JSON.parse(JSON.stringify(MOCK_END_USERS)),
      selectedEndUser: MOCK_END_USERS[0],
      callStatus: 'IDLE',
      callDuration: 0,
      transcripts: [],
      assets: JSON.parse(JSON.stringify(MOCK_ASSETS)),
      activeIncidentDiagnosis: null,
      activeTicket: MOCK_INCIDENT_TICKETS[0] || null,
      ticketsList: JSON.parse(JSON.stringify(MOCK_INCIDENT_TICKETS)),
      auditLogs: [...defaultScenario.auditTrail],
      isLiveSocketConnected: false,
      selectedAsset: null,
      focusedCoordinates: defaultHub.coordinates,
      searchQuery: '',
    };

    // Auto-sync with FastAPI / Supabase backend
    this.initBackendSync();
  }

  public async initBackendSync() {
    try {
      const [remoteTickets, remoteCrews] = await Promise.all([
        api.getTickets().catch(() => null),
        api.getCrews().catch(() => null),
      ]);

      if (remoteTickets && remoteTickets.length > 0) {
        this.state.ticketsList = remoteTickets;
        this.state.activeTicket =
          remoteTickets.find((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS') ||
          remoteTickets[0];
      }

      if (remoteCrews && remoteCrews.length > 0) {
        this.state.crews = remoteCrews;
        this.state.allocatedCrew = remoteCrews[0];
      }

      this.state.isLiveSocketConnected = true;
      this.notify();

      // Subscribe to live SSE events from FastAPI
      api.subscribeRealtimeStream(
        (event) => this.handleBackendEvent(event),
        () => {
          this.state.isLiveSocketConnected = false;
          this.notify();
        }
      );
    } catch (err) {
      console.info('Backend sync fallback to local mock data:', err);
    }
  }

  private async handleBackendEvent(event: any) {
    this.state.isLiveSocketConnected = true;
    try {
      if (
        event.event_type === 'TICKET_CREATED' ||
        event.event_type === 'TICKET_RESOLVED' ||
        event.event_type === 'TICKET_REOPENED' ||
        event.event_type === 'TICKET_ESCALATED' ||
        event.event_type === 'COMMENT_ADDED'
      ) {
        const freshTickets = await api.getTickets();
        this.state.ticketsList = freshTickets;
        if (this.state.activeTicket) {
          const fresh = freshTickets.find(
            (t) => t.id === this.state.activeTicket?.id || t.ticketNumber === this.state.activeTicket?.ticketNumber
          );
          if (fresh) this.state.activeTicket = fresh;
        }
        this.notify();
      } else if (event.event_type === 'TECH_ASSIGNED') {
        const [freshTickets, freshCrews] = await Promise.all([api.getTickets(), api.getCrews()]);
        this.state.ticketsList = freshTickets;
        this.state.crews = freshCrews;
        if (this.state.activeTicket) {
          const fresh = freshTickets.find(
            (t) => t.id === this.state.activeTicket?.id || t.ticketNumber === this.state.activeTicket?.ticketNumber
          );
          if (fresh) this.state.activeTicket = fresh;
        }
        this.notify();
      }
    } catch (err) {
      console.error('Error handling SSE broadcast event:', err);
    }
  }


  public getState(): DashboardState {
    return this.state;
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.push(listener);
    listener(this.state);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  // Theme Toggle
  public setTheme(theme: ThemeMode) {
    this.state.theme = theme;
    localStorage.setItem('gridresq_theme', theme);
    this.notify();
  }

  public toggleTheme() {
    this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('gridresq_theme', this.state.theme);
    this.notify();
  }

  // Page Navigation
  public setActivePage(page: ActivePage) {
    this.state.activePage = page;
    this.notify();
  }

  // Map Fullscreen Toggle
  public toggleMapFullscreen(force?: boolean) {
    this.state.isMapFullscreen = force !== undefined ? force : !this.state.isMapFullscreen;
    this.notify();
  }

  public setSearchQuery(query: string) {
    this.state.searchQuery = query;
    this.notify();
  }

  // Select Hub
  public selectHub(hubId: string) {
    const hub = this.state.hubs.find((h) => h.id === hubId);
    if (hub) {
      this.state.activeHub = hub;
      this.state.focusedCoordinates = hub.coordinates;
      const firstTransformer = this.state.assets.find(
        (a) => a.type === 'TRANSFORMER' && a.hubId === hub.id
      );
      this.state.selectedAsset = firstTransformer || null;
      this.notify();
    }
  }

  // Select Asset
  public selectAsset(asset: GridAsset | null) {
    this.state.selectedAsset = asset;
    if (asset) {
      this.state.focusedCoordinates = asset.coordinates;
      if (asset.hubId) {
        const hub = this.state.hubs.find((h) => h.id === asset.hubId);
        if (hub) this.state.activeHub = hub;
      }
    }
    this.notify();
  }

  // Select End User
  public selectEndUser(endUser: EndUserPremises | null) {
    this.state.selectedEndUser = endUser;
    if (endUser) {
      this.state.focusedCoordinates = endUser.coordinates;
    }
    this.notify();
  }

  // Resource Allocation: Dispatch Crew
  public allocateCrew(crewId: string, ticketId?: string) {
    const crew = this.state.crews.find((c) => c.id === crewId);
    if (!crew) return;

    // Find ticket to link
    let ticket = this.state.ticketsList.find((t) => t.id === ticketId || t.ticketNumber === ticketId);
    if (!ticket && crew.closestTicket) {
      ticket = this.state.ticketsList.find(
        (t) => t.id === crew.closestTicket?.ticketId || t.ticketNumber === crew.closestTicket?.ticketNumber
      );
    }
    if (!ticket) {
      ticket = this.state.activeTicket || this.state.ticketsList[0];
    }

    crew.status = 'DISPATCHED';
    crew.speedKmph = 38;
    if (ticket) {
      crew.assignedIncidentId = ticket.id;
      crew.assignedTicketNumber = ticket.ticketNumber;
      crew.assignedTaskDescription = ticket.summary;
      crew.currentLocation = `${ticket.locality} (En Route)`;
      crew.assignedAt = 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST';

      ticket.allocatedCrewId = crew.id;
      ticket.assignedCrewName = crew.name;
      ticket.assignedCrewLead = crew.leadTechnician;
      ticket.assignedCrewVehicle = crew.vehicleId;
      ticket.assignedCrewPhone = crew.phoneContact;
      if (ticket.status === 'OPEN') {
        ticket.status = 'IN_PROGRESS';
      }

      ticket.comments.push({
        id: `c-${Date.now()}`,
        author: 'NOC Dispatch Control',
        role: 'OPERATOR',
        content: `Dispatched field gang ${crew.name} (${crew.vehicleId}, Lead: ${crew.leadTechnician}). En route with ETA ~ ${crew.etaMinutes || 8} mins.`,
        timestamp: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST',
      });
    }

    this.state.allocatedCrew = crew;

    this.state.auditLogs.unshift({
      id: `aud-${Date.now()}-crew`,
      timestamp: new Date().toLocaleTimeString() + ' IST',
      actor: 'HUMAN_OPERATOR',
      action: 'CREW_DISPATCHED',
      details: `Dispatched ${crew.name} (${crew.vehicleId}) to ${ticket?.ticketNumber || 'Outage'}. Lead: ${crew.leadTechnician}. ETA: ${crew.etaMinutes} mins.`,
      badgeColor: 'amber',
    });
    this.notify();
  }

  // Mark Crew as arrived on site
  public markCrewOnSite(crewId: string) {
    const crew = this.state.crews.find((c) => c.id === crewId);
    if (crew) {
      crew.status = 'ON_SITE';
      crew.speedKmph = 0;
      const ticket = this.state.ticketsList.find((t) => t.id === crew.assignedIncidentId || t.ticketNumber === crew.assignedTicketNumber);
      if (ticket) {
        crew.currentLocation = `${ticket.locality} (On-Site Pole)`;
        ticket.comments.push({
          id: `c-${Date.now()}`,
          author: crew.leadTechnician,
          role: 'FIELD_CREW',
          content: `Crew arrived on-site at ${ticket.locality}. Vehicle stationed. Initiating physical line & transformer diagnostic.`,
          timestamp: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST',
        });
      }

      this.state.auditLogs.unshift({
        id: `aud-${Date.now()}-onsite`,
        timestamp: new Date().toLocaleTimeString() + ' IST',
        actor: 'FIELD_CREW',
        action: 'CREW_ON_SITE',
        details: `${crew.name} reached incident site at ${crew.currentLocation}. Safe zone established.`,
        badgeColor: 'blue',
      });
      this.notify();
    }
  }

  // Release Crew back to Available
  public releaseCrew(crewId: string) {
    const crew = this.state.crews.find((c) => c.id === crewId);
    if (crew) {
      const prevTicketNumber = crew.assignedTicketNumber || crew.assignedIncidentId;
      crew.status = 'AVAILABLE';
      crew.assignedIncidentId = undefined;
      crew.assignedTicketNumber = undefined;
      crew.assignedTaskDescription = undefined;
      crew.assignedAt = undefined;
      crew.speedKmph = 0;
      crew.currentLocation = crew.baseDepot;

      this.state.auditLogs.unshift({
        id: `aud-${Date.now()}-rel`,
        timestamp: new Date().toLocaleTimeString() + ' IST',
        actor: 'HUMAN_OPERATOR',
        action: 'CREW_RELEASED',
        details: `${crew.name} completed assignment for ${prevTicketNumber || 'ticket'}. Returned to ${crew.baseDepot} as AVAILABLE.`,
        badgeColor: 'green',
      });
      this.notify();
    }
  }

  // Focus Crew Location on Map
  public focusCrewOnMap(crewId: string) {
    const crew = this.state.crews.find((c) => c.id === crewId);
    if (crew) {
      this.state.activePage = 'map';
      this.state.focusedCoordinates = crew.coordinates;
      this.notify();
    }
  }

  // Resource Allocation: Dispatch Individual Technician
  public allocateTechnician(technicianId: string, ticketId?: string) {
    let targetTech: CrewMember | undefined;
    let targetCrew: FieldCrew | undefined;

    for (const crew of this.state.crews) {
      const found = crew.members?.find((m) => m.id === technicianId);
      if (found) {
        targetTech = found;
        targetCrew = crew;
        break;
      }
    }

    if (!targetTech || !targetCrew) return;

    // Find ticket to link
    let ticket = this.state.ticketsList.find((t) => t.id === ticketId || t.ticketNumber === ticketId);
    if (!ticket && targetTech.closestTicket) {
      ticket = this.state.ticketsList.find(
        (t) => t.id === targetTech.closestTicket?.ticketId || t.ticketNumber === targetTech.closestTicket?.ticketNumber
      );
    }
    if (!ticket) {
      ticket = this.state.activeTicket || this.state.ticketsList.find((t) => t.status !== 'RESOLVED') || this.state.ticketsList[0];
    }

    const timeStr = 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST';
    targetTech.status = 'ASSIGNED';
    targetTech.assignedTicketId = ticket?.id;
    targetTech.assignedTicketNumber = ticket?.ticketNumber;
    targetTech.assignedTaskDescription = ticket?.summary;
    targetTech.assignedAt = timeStr;

    // Also update parent crew to Dispatched
    targetCrew.status = 'DISPATCHED';
    targetCrew.speedKmph = 38;
    if (ticket) {
      targetCrew.currentLocation = `${ticket.locality} (En Route)`;
      ticket.allocatedTechnicianId = targetTech.id;
      ticket.assignedTechnicianName = targetTech.name;
      ticket.assignedTechnicianRole = targetTech.role;
      ticket.assignedTechnicianPhone = targetTech.phone;
      ticket.allocatedCrewId = targetCrew.id;
      ticket.assignedCrewName = targetCrew.name;
      ticket.assignedCrewLead = targetTech.name;
      ticket.assignedCrewVehicle = targetCrew.vehicleId;
      ticket.assignedCrewPhone = targetTech.phone;

      if (ticket.status === 'OPEN') {
        ticket.status = 'IN_PROGRESS';
      }

      ticket.comments.push({
        id: `c-${Date.now()}`,
        author: 'NOC Dispatch Control',
        role: 'OPERATOR',
        content: `Assigned technician ${targetTech.name} (${targetTech.role}, Phone: ${targetTech.phone}) from ${targetCrew.name} (${targetCrew.vehicleId}). En route with ETA ~ ${targetCrew.etaMinutes || 6} mins.`,
        timestamp: timeStr,
      });
    }

    this.state.allocatedCrew = targetCrew;

    this.state.auditLogs.unshift({
      id: `aud-${Date.now()}-tech`,
      timestamp: new Date().toLocaleTimeString() + ' IST',
      actor: 'HUMAN_OPERATOR',
      action: 'TECHNICIAN_ASSIGNED',
      details: `Assigned technician ${targetTech.name} (${targetTech.role}) to ${ticket?.ticketNumber || 'Outage'}. Fleet: ${targetCrew.vehicleId}.`,
      badgeColor: 'amber',
    });
    this.notify();
    if (ticket) {
      api.assignTechnician(ticket.id, targetTech.id).catch((err) => console.warn('Backend assignTechnician:', err));
    }
  }

  // Release Individual Technician back to Available
  public releaseTechnician(technicianId: string) {
    let targetTech: CrewMember | undefined;
    let targetCrew: FieldCrew | undefined;

    for (const crew of this.state.crews) {
      const found = crew.members?.find((m) => m.id === technicianId);
      if (found) {
        targetTech = found;
        targetCrew = crew;
        break;
      }
    }

    if (!targetTech) return;
    const prevTicket = targetTech.assignedTicketNumber || targetTech.assignedTicketId;

    targetTech.status = 'AVAILABLE';
    targetTech.assignedTicketId = undefined;
    targetTech.assignedTicketNumber = undefined;
    targetTech.assignedTaskDescription = undefined;
    targetTech.assignedAt = undefined;

    if (targetCrew) {
      const anyOtherAssigned = targetCrew.members?.some((m) => m.status === 'ASSIGNED');
      if (!anyOtherAssigned) {
        targetCrew.status = 'AVAILABLE';
        targetCrew.speedKmph = 0;
        targetCrew.currentLocation = targetCrew.baseDepot;
      }
    }

    this.state.auditLogs.unshift({
      id: `aud-${Date.now()}-tech-rel`,
      timestamp: new Date().toLocaleTimeString() + ' IST',
      actor: 'HUMAN_OPERATOR',
      action: 'TECHNICIAN_RELEASED',
      details: `Technician ${targetTech.name} (${targetTech.role}) completed assignment for ${prevTicket || 'ticket'}. Marked AVAILABLE.`,
      badgeColor: 'green',
    });
    this.notify();
    api.releaseTechnician(technicianId).catch((err) => console.warn('Backend releaseTechnician:', err));
  }


  // Run Demo Scenario
  public runScenario(scenarioId: string) {
    this.clearAllTimers();

    const scenario = DEMO_SCENARIOS[scenarioId] || DEMO_SCENARIOS.feeder_fault;
    const targetHub = this.state.hubs.find((h) => h.id === scenario.hubId) || this.state.hubs[0];

    const cleanAssets: GridAsset[] = JSON.parse(JSON.stringify(MOCK_ASSETS));

    if (scenarioId === 'feeder_fault') {
      cleanAssets.forEach((a) => {
        if (a.code === 'F-07-CYBER' || a.parentAssetId === 'f-07') {
          a.state = 'DOWN';
          a.consumersAffected = a.type === 'FEEDER' ? 740 : 250;
        }
      });
    } else if (scenarioId === 'transformer_failure') {
      cleanAssets.forEach((a) => {
        if (a.code === 'F-07-CYBER') a.state = 'HEALTHY';
        if (a.code === 'DTR-MDP-102') {
          a.state = 'DOWN';
          a.consumersAffected = 320;
        }
      });
    } else if (scenarioId === 'noisy_telemetry') {
      cleanAssets.forEach((a) => {
        if (a.code === 'DTR-KND-201') a.state = 'UNKNOWN';
      });
    }

    this.state = {
      ...this.state,
      currentScenario: scenario,
      activeHub: targetHub,
      callStatus: 'RINGING',
      callDuration: 0,
      transcripts: [],
      assets: cleanAssets,
      activeIncidentDiagnosis: null,
      activeTicket: null,
      auditLogs: [
        {
          id: `aud-${Date.now()}-1`,
          timestamp: new Date().toLocaleTimeString() + ' IST',
          actor: 'SYSTEM',
          action: 'SCENARIO_STARTED',
          details: `Loaded TSSPDCL Scenario: "${scenario.title}" (Substation: SS-MADHAPUR-33KV)`,
          badgeColor: 'blue',
        },
      ],
      selectedAsset: cleanAssets.find((a) => a.code === scenario.targetAssetCode) || null,
      focusedCoordinates: targetHub.coordinates,
    };
    this.notify();

    this.simulateCallProgression(scenario);
  }

  private simulateCallProgression(scenario: DemoScenario) {
    // 1. Ringing -> IN_PROGRESS
    const t1 = window.setTimeout(() => {
      this.state.callStatus = 'IN_PROGRESS';
      this.startDurationTimer();
      this.state.auditLogs.unshift({
        id: `aud-${Date.now()}-call`,
        timestamp: new Date().toLocaleTimeString() + ' IST',
        actor: 'SYSTEM',
        action: 'CALL_ANSWERED',
        details: `Exotel TSSPDCL Helpline (1912) connected. Caller: ${scenario.callerNumber} (USC: ${scenario.ticket.serviceConnectionNo})`,
        badgeColor: 'green',
      });
      this.notify();
    }, 2000);
    this.scenarioSimulationTimers.push(t1);

    // 2. Transcripts appear
    scenario.initialTranscript.forEach((seg, idx) => {
      const delay = 2500 + idx * 2200;
      const t = window.setTimeout(() => {
        this.state.transcripts.push(seg);
        this.notify();
      }, delay);
      this.scenarioSimulationTimers.push(t);
    });

    // 3. Grid asset located
    const locDelay = 2500 + scenario.initialTranscript.length * 2200 + 800;
    const tLoc = window.setTimeout(() => {
      this.state.auditLogs.unshift({
        id: `aud-${Date.now()}-loc`,
        timestamp: new Date().toLocaleTimeString() + ' IST',
        actor: 'SYSTEM',
        action: 'HIERARCHY_MAPPED',
        details: `Resolved consumer location "${scenario.locality}" to TSSPDCL Hub: ${this.state.activeHub.name}.`,
        badgeColor: 'indigo',
      });
      this.notify();
    }, locDelay);
    this.scenarioSimulationTimers.push(tLoc);

    // 4. Gemini Diagnosis completed
    const diagDelay = locDelay + 2000;
    const tDiag = window.setTimeout(() => {
      this.state.activeIncidentDiagnosis = scenario.diagnosis;
      this.state.auditLogs.unshift({
        id: `aud-${Date.now()}-diag`,
        timestamp: new Date().toLocaleTimeString() + ' IST',
        actor: 'AI_AGENT',
        action: 'DIAGNOSIS_GROUNDED',
        details: `Gemini verified ${scenario.diagnosis.evidenceCount} evidence citations. Status: ${scenario.diagnosis.status}`,
        badgeColor: 'purple',
      });
      this.notify();
    }, diagDelay);
    this.scenarioSimulationTimers.push(tDiag);

    // 5. Call Ends & Ticket Created
    const ticketDelay = diagDelay + 1800;
    const tTicket = window.setTimeout(() => {
      this.state.callStatus = 'COMPLETED';
      this.stopDurationTimer();
      this.state.activeTicket = scenario.ticket;

      if (!this.state.ticketsList.some((t) => t.ticketNumber === scenario.ticket.ticketNumber)) {
        this.state.ticketsList.unshift(scenario.ticket);
      }

      this.state.auditLogs.unshift({
        id: `aud-${Date.now()}-tkt`,
        timestamp: new Date().toLocaleTimeString() + ' IST',
        actor: 'SYSTEM',
        action: 'TICKET_DISPATCHED',
        details: `Created Ticket ${scenario.ticket.ticketNumber} (${scenario.ticket.priority}). Recommended TSSPDCL gang: ${scenario.recommendedCrewId}.`,
        badgeColor: 'green',
      });
      this.notify();
    }, ticketDelay);
    this.scenarioSimulationTimers.push(tTicket);
  }

  // Operator Action: Resolve Ticket
  public resolveTicket(ticketId: string, outcomeReason: string, category?: string) {
    const ticket = this.state.ticketsList.find((t) => t.id === ticketId) || this.state.activeTicket;
    if (ticket) {
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST';
      ticket.status = 'RESOLVED';
      ticket.resolvedAt = `Today, ${nowTime}`;
      ticket.durationText = ticket.durationText || '48m';
      ticket.resolutionCategory = category || 'Field Restoration Verified';
      ticket.resolutionReason = outcomeReason;

      // Add resolution comment to ticket
      ticket.comments.push({
        id: `c-${Date.now()}`,
        author: ticket.assignedOperatorName || 'Operator Ramesh Varma',
        role: 'OPERATOR',
        content: `Incident resolved: ${outcomeReason} [Category: ${ticket.resolutionCategory}]`,
        timestamp: `Today, ${nowTime}`,
      });

      this.state.auditLogs.unshift({
        id: `aud-${Date.now()}-res`,
        timestamp: new Date().toLocaleTimeString() + ' IST',
        actor: 'HUMAN_OPERATOR',
        action: 'TICKET_RESOLVED',
        details: `Ticket ${ticket.ticketNumber} marked resolved by Operator: "${outcomeReason}"`,
        badgeColor: 'emerald',
      });

      if (this.state.selectedAsset) {
        this.state.selectedAsset.state = 'HEALTHY';
        this.state.selectedAsset.consumersAffected = 0;
      }
      this.state.assets.forEach((a) => {
        if (a.code === ticket.primaryAssetCode || a.parentAssetId === 'f-07') {
          a.state = 'HEALTHY';
          a.consumersAffected = 0;
        }
      });

      const hub = this.state.hubs.find((h) => h.id === this.state.activeHub.id);
      if (hub) hub.status = 'HEALTHY';

      this.notify();
      api.resolveTicket(ticket.id, ticket.resolutionCategory || 'Field Restoration Verified', outcomeReason).catch((err) => console.warn('Backend resolveTicket:', err));
    }
  }

  // Operator Action: Reopen Ticket
  public reopenTicket(ticketId: string, reason?: string) {
    const ticket = this.state.ticketsList.find((t) => t.id === ticketId) || this.state.activeTicket;
    if (ticket) {
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST';
      ticket.status = 'OPEN';
      ticket.resolvedAt = undefined;
      const reopenNote = reason || 'Consumer re-contacted 1912 reporting continued voltage drop.';

      ticket.comments.push({
        id: `c-${Date.now()}`,
        author: ticket.assignedOperatorName || 'Operator Ramesh Varma',
        role: 'OPERATOR',
        content: `Ticket re-opened: ${reopenNote}`,
        timestamp: `Today, ${nowTime}`,
      });

      this.state.auditLogs.unshift({
        id: `aud-${Date.now()}-reopen`,
        timestamp: new Date().toLocaleTimeString() + ' IST',
        actor: 'HUMAN_OPERATOR',
        action: 'TICKET_REOPENED',
        details: `Ticket ${ticket.ticketNumber} reopened by Operator: "${reopenNote}"`,
        badgeColor: 'amber',
      });

      this.notify();
      api.reopenTicket(ticket.id).catch((err) => console.warn('Backend reopenTicket:', err));
    }
  }

  // Add Comment / Work Log Note to Ticket
  public addComment(
    ticketId: string,
    author: string,
    role: IncidentComment['role'],
    content: string
  ) {
    const ticket = this.state.ticketsList.find((t) => t.id === ticketId) || this.state.activeTicket;
    if (ticket && content.trim()) {
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST';
      ticket.comments.push({
        id: `c-${Date.now()}`,
        author,
        role,
        content: content.trim(),
        timestamp: `Today, ${nowTime}`,
      });

      this.state.auditLogs.unshift({
        id: `aud-${Date.now()}-comment`,
        timestamp: new Date().toLocaleTimeString() + ' IST',
        actor: role === 'OPERATOR' ? 'HUMAN_OPERATOR' : role === 'AI_SYSTEM' ? 'AI_AGENT' : 'SYSTEM',
        action: 'COMMENT_ADDED',
        details: `[${ticket.ticketNumber}] ${author} posted work note: "${content.trim().slice(0, 70)}..."`,
        badgeColor: 'blue',
      });

      this.notify();
      api.addComment(ticket.id, author, role, content.trim()).catch((err) => console.warn('Backend addComment:', err));
    }
  }

  // Assign Individual Technician to Ticket
  public assignTechnicianToTicket(ticketId: string, technicianId: string) {
    this.allocateTechnician(technicianId, ticketId);
  }

  // Assign or Reassign Crew to Ticket
  public assignCrewToTicket(ticketId: string, crewId: string) {
    const ticket = this.state.ticketsList.find((t) => t.id === ticketId) || this.state.activeTicket;
    const crew = this.state.crews.find((c) => c.id === crewId);
    if (ticket && crew) {
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST';
      ticket.allocatedCrewId = crew.id;
      ticket.assignedCrewName = crew.name;
      ticket.assignedCrewLead = crew.leadTechnician;
      ticket.assignedCrewVehicle = crew.vehicleId;
      ticket.assignedCrewPhone = crew.phoneContact;
      crew.status = 'DISPATCHED';
      crew.assignedIncidentId = ticket.id;

      if (ticket.status === 'OPEN') {
        ticket.status = 'IN_PROGRESS';
      }

      ticket.comments.push({
        id: `c-${Date.now()}`,
        author: 'NOC Dispatch Control',
        role: 'OPERATOR',
        content: `Dispatched field gang ${crew.name} (Vehicle: ${crew.vehicleId}, Lead: ${crew.leadTechnician}) to incident location.`,
        timestamp: `Today, ${nowTime}`,
      });

      this.state.auditLogs.unshift({
        id: `aud-${Date.now()}-crew`,
        timestamp: new Date().toLocaleTimeString() + ' IST',
        actor: 'HUMAN_OPERATOR',
        action: 'CREW_ASSIGNED',
        details: `Dispatched ${crew.name} to Ticket ${ticket.ticketNumber}. Vehicle: ${crew.vehicleId}.`,
        badgeColor: 'cyan',
      });

      this.notify();
    }
  }

  public escalateTicket(ticketId: string, note?: string) {
    const ticket = this.state.ticketsList.find((t) => t.id === ticketId) || this.state.activeTicket;
    if (ticket) {
      ticket.status = 'ESCALATED';
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST';

      ticket.comments.push({
        id: `c-${Date.now()}`,
        author: ticket.assignedOperatorName || 'Operator Ramesh Varma',
        role: 'OPERATOR',
        content: `Escalated to TSSPDCL Cybercity Divisional Engineer Breakdown Team. ${note ? `Note: ${note}` : ''}`,
        timestamp: `Today, ${nowTime}`,
      });

      this.state.auditLogs.unshift({
        id: `aud-${Date.now()}-esc`,
        timestamp: new Date().toLocaleTimeString() + ' IST',
        actor: 'HUMAN_OPERATOR',
        action: 'TICKET_ESCALATED',
        details: `Ticket ${ticket.ticketNumber} escalated to TSSPDCL Divisional Engineer Breakdown Team. ${note ? `Note: "${note}"` : ''}`,
        badgeColor: 'red',
      });
      this.notify();
      api.escalateTicket(ticket.id, note || '').catch((err) => console.warn('Backend escalateTicket:', err));
    }
  }


  private startDurationTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = window.setInterval(() => {
      this.state.callDuration += 1;
      this.notify();
    }, 1000);
  }

  private stopDurationTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private clearAllTimers() {
    this.stopDurationTimer();
    this.scenarioSimulationTimers.forEach((t) => clearTimeout(t));
    this.scenarioSimulationTimers = [];
  }
}

export const realtimeClient = new RealtimeClient();
