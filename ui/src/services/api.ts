import {
  Ticket,
  FieldCrew,
  CrewMember,
  IncidentComment,
  DistributionHub,
  GridAsset,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : '';


function formatTimestamp(isoStr?: string | null): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST`;
  } catch {
    return isoStr;
  }
}

// Convert Backend Ticket to Frontend Ticket
export function mapBackendTicket(raw: any): Ticket {
  return {
    id: raw.id,
    ticketNumber: raw.ticket_number,
    callId: raw.service_connection_no ? `CALL-${raw.id.slice(-4)}` : 'CALL-1912',
    serviceConnectionNo: raw.service_connection_no || '1104-58293',
    locality: raw.locality,
    substationName: raw.substation_name,
    sectionOffice: raw.section_office,
    primaryAssetCode: raw.primary_asset_code,
    priority: raw.priority,
    status: raw.status,
    summary: raw.summary,
    customerSummary: raw.summary,
    acknowledgementChannel: raw.acknowledgement_channel || 'SMS / EMAIL',
    acknowledgementStatus: raw.acknowledgement_status || 'SENT',
    recipientContact: raw.recipient_contact || '+91 98490 23456',
    createdAt: formatTimestamp(raw.created_at),
    resolvedAt: raw.resolved_at ? formatTimestamp(raw.resolved_at) : undefined,
    durationText: raw.duration_text || (raw.status === 'RESOLVED' ? 'Resolved in 45m' : 'Active: 25m'),
    resolutionReason: raw.resolution_reason || undefined,
    resolutionCategory: raw.resolution_category || undefined,
    allocatedTechnicianId: raw.allocated_technician_id || undefined,
    assignedTechnicianName: raw.assigned_technician_name || undefined,
    assignedTechnicianRole: raw.assigned_technician_role || undefined,
    assignedTechnicianPhone: raw.assigned_technician_phone || undefined,
    allocatedCrewId: raw.allocated_crew_id || undefined,
    assignedCrewName: raw.assigned_crew_name || undefined,
    assignedCrewLead: raw.assigned_crew_lead || undefined,
    assignedCrewVehicle: raw.assigned_crew_vehicle || undefined,
    assignedCrewPhone: raw.assigned_crew_phone || undefined,
    assignedOperatorName: raw.assigned_operator_name || 'Operator Ramesh Varma',
    consumersAffected: raw.consumers_affected || 0,
    comments: (raw.comments || []).map((c: any): IncidentComment => ({
      id: c.id,
      author: c.author,
      role: c.role,
      content: c.content,
      timestamp: formatTimestamp(c.created_at),
    })),
  };
}

// Convert Backend Crew to Frontend FieldCrew
export function mapBackendCrew(raw: any): FieldCrew {
  const members: CrewMember[] = (raw.members || []).map((m: any): CrewMember => ({
    id: m.id,
    name: m.name,
    role: m.role,
    phone: m.phone,
    status: m.status,
    avatarInitials: m.avatar_initials,
    experience: m.experience_text,
    assignedTicketId: m.assigned_ticket_id || undefined,
    assignedTicketNumber: m.assigned_ticket_number || undefined,
    assignedTaskDescription: m.assigned_task_description || undefined,
    assignedAt: m.assigned_at ? formatTimestamp(m.assigned_at) : undefined,
    gangId: raw.id,
    gangName: raw.name,
    vehicleId: raw.vehicle_number,
    sectionOffice: raw.section_office,
  }));

  return {
    id: raw.id,
    name: raw.name,
    shortName: raw.short_name,
    sectionOffice: raw.section_office,
    leadTechnician: raw.lead_name,
    leadPhone: raw.lead_phone,
    specialization: raw.specialization,
    specializationLabel: raw.specialization_label,
    vehicleId: raw.vehicle_number,
    vehicleType: raw.vehicle_type,
    status: raw.status,
    currentLocation: raw.current_location_text,
    baseDepot: raw.base_depot,
    coordinates: [raw.longitude, raw.latitude],
    speedKmph: raw.speed_kmph,
    etaMinutes: raw.eta_minutes,
    assignedIncidentId: raw.assigned_incident_id || undefined,
    assignedTicketNumber: raw.assigned_ticket_number || undefined,
    assignedTaskDescription: raw.assigned_task_description || undefined,
    assignedAt: raw.assigned_at ? formatTimestamp(raw.assigned_at) : undefined,
    phoneContact: raw.contact_phone,
    members,
  };
}

export const api = {
  // 1. Tickets
  async getTickets(): Promise<Ticket[]> {
    const res = await fetch(`${API_BASE_URL}/api/tickets`);
    if (!res.ok) throw new Error(`Failed to fetch tickets: ${res.statusText}`);
    const data = await res.json();
    return data.map(mapBackendTicket);
  },

  async assignTechnician(ticketId: string, technicianId: string): Promise<Ticket> {
    const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/assign-technician`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technician_id: technicianId }),
    });
    if (!res.ok) throw new Error(`Assign technician failed: ${res.statusText}`);
    const data = await res.json();
    return mapBackendTicket(data);
  },

  async resolveTicket(ticketId: string, category: string, reason: string): Promise<Ticket> {
    const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category,
        reason,
        operator_name: 'Operator Ramesh Varma',
      }),
    });
    if (!res.ok) throw new Error(`Resolve ticket failed: ${res.statusText}`);
    const data = await res.json();
    return mapBackendTicket(data);
  },

  async reopenTicket(ticketId: string): Promise<Ticket> {
    const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/reopen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`Reopen ticket failed: ${res.statusText}`);
    const data = await res.json();
    return mapBackendTicket(data);
  },

  async escalateTicket(ticketId: string, reason: string): Promise<Ticket> {
    const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/escalate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error(`Escalate ticket failed: ${res.statusText}`);
    const data = await res.json();
    return mapBackendTicket(data);
  },

  async addComment(ticketId: string, author: string, role: string, content: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, role, content }),
    });
    if (!res.ok) throw new Error(`Add comment failed: ${res.statusText}`);
    return await res.json();
  },

  // 2. Field Crews & Technicians
  async getCrews(): Promise<FieldCrew[]> {
    const res = await fetch(`${API_BASE_URL}/api/crews`);
    if (!res.ok) throw new Error(`Failed to fetch crews: ${res.statusText}`);
    const data = await res.json();
    return data.map(mapBackendCrew);
  },

  async releaseTechnician(technicianId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/technicians/${technicianId}/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`Release technician failed: ${res.statusText}`);
    return await res.json();
  },

  // 3. Grid Topology
  async getSubstations(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/api/topology/substations`);
    if (!res.ok) throw new Error(`Failed to fetch topology: ${res.statusText}`);
    return await res.json();
  },

  // 4. Server-Sent Events (SSE) Live Stream
  subscribeRealtimeStream(onEvent: (event: any) => void, onError?: (err: any) => void): () => void {
    const eventSource = new EventSource(`${API_BASE_URL}/api/realtime/stream`);

    eventSource.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        onEvent(payload);
      } catch (err) {
        console.error('Failed to parse SSE event:', err);
      }
    };

    eventSource.onerror = (err) => {
      if (onError) onError(err);
    };

    return () => {
      eventSource.close();
    };
  },
};

