import { GridAsset, EndUserPremises, DistributionHub, FieldCrew } from '../types';

// TSSPDCL Hyderabad Metro Zone (Cyberabad / Madhapur / HITEC City Corridor)
export const MAP_CENTER: [number, number] = [78.3820, 17.4460]; // [lng, lat]
export const MAP_DEFAULT_ZOOM = 14.5;

// 1. TSSPDCL Distribution Hubs (Feeders & Local Distribution)
export const MOCK_HUBS: DistributionHub[] = [
  {
    id: 'hub-07',
    code: 'HUB-F07-HITEC',
    name: 'Cyber Towers & Ayyappa Society Hub',
    locality: 'Madhapur, Cybercity Circle, TSSPDCL',
    circle: 'Cybercity Circle, Hyderabad Metro Zone',
    substationCode: 'SS-MADHAPUR-33KV',
    feederCode: 'F-07-CYBER',
    voltage: '11kV / 415V',
    status: 'DOWN', // Outage in scenario
    coordinates: [78.3820, 17.4465],
    transformerIds: ['dtr-mdp-101', 'dtr-mdp-102', 'dtr-mdp-103'],
    totalConsumers: 740,
  },
  {
    id: 'hub-03',
    code: 'HUB-F03-KONDAPUR',
    name: 'Kondapur & Botanical Garden Hub',
    locality: 'Kondapur, Ranga Reddy Section, TSSPDCL',
    circle: 'Gachibowli Circle, TSSPDCL',
    substationCode: 'SS-KONDAPUR-33KV',
    feederCode: 'F-03-KNDPR',
    voltage: '11kV / 415V',
    status: 'HEALTHY',
    coordinates: [78.3650, 17.4620],
    transformerIds: ['dtr-knd-201', 'dtr-knd-202'],
    totalConsumers: 430,
  },
  {
    id: 'hub-12',
    code: 'HUB-F12-GACHIBOWLI',
    name: 'Gachibowli Financial District Hub',
    locality: 'Gachibowli, Hyderabad',
    circle: 'Financial District Circle, TSSPDCL',
    substationCode: 'SS-GACHIBOWLI-33KV',
    feederCode: 'F-12-FIN',
    voltage: '11kV / 415V',
    status: 'HEALTHY',
    coordinates: [78.3550, 17.4350],
    transformerIds: ['dtr-gcb-301'],
    totalConsumers: 650,
  },
];

// 2. TSSPDCL Section Office Emergency Field Crews
export const MOCK_CREWS: FieldCrew[] = [
  {
    id: 'crew-tsspdcl-01',
    name: 'TSSPDCL Emergency Gang (Madhapur Section)',
    shortName: 'Madhapur Sky-lift Gang',
    sectionOffice: 'AE / Operation / Madhapur (Cybercity Circle)',
    leadTechnician: 'K. Srinivas Reddy (AE / Operation)',
    leadPhone: '+91 94906 18201',
    specialization: 'HIGH_VOLTAGE_11KV',
    specializationLabel: '11kV Overhead Lines & Tree Trimming',
    vehicleId: 'Hydraulic Sky-lift TS-09-EA-4412',
    vehicleType: 'Hydraulic Sky-lift Truck (18m Reach)',
    status: 'AVAILABLE',
    currentLocation: 'Madhapur 33/11kV Substation Yard, Cybercity',
    baseDepot: 'Madhapur 33/11kV Substation Yard',
    coordinates: [78.3790, 17.4490],
    speedKmph: 0,
    etaMinutes: 6,
    phoneContact: '+91 94906 18201',
    members: [
      {
        id: 'tech-mdp-1',
        name: 'K. Srinivas Reddy',
        role: 'Assistant Engineer (AE / Op - Lead)',
        phone: '+91 94906 18201',
        status: 'AVAILABLE',
        experience: '15 yrs • 33/11kV Switching In-charge',
        avatarInitials: 'SR',
        gangId: 'crew-tsspdcl-01',
        gangName: 'Madhapur Emergency Gang',
        vehicleId: 'Hydraulic Sky-lift TS-09-EA-4412',
        sectionOffice: 'Madhapur Section',
        closestTicket: {
          ticketId: 'tkt-001',
          ticketNumber: 'TSSPDCL-HYD-00412',
          priority: 'P1_CRITICAL',
          locality: 'Ayyappa Society, Madhapur',
          primaryAssetCode: 'F-07-CYBER',
          summary: 'Outage on 11kV Feeder F-07 affecting Ayyappa Society & Kavuri Hills',
          distanceKm: 0.8,
          etaMinutes: 6,
        },
      },
      {
        id: 'tech-mdp-2',
        name: 'K. Ramulu',
        role: 'Senior Lineman',
        phone: '+91 94408 12301',
        status: 'AVAILABLE',
        experience: '12 yrs • Live-line Glove & Hotstick Certified',
        avatarInitials: 'KR',
        gangId: 'crew-tsspdcl-01',
        gangName: 'Madhapur Emergency Gang',
        vehicleId: 'Hydraulic Sky-lift TS-09-EA-4412',
        sectionOffice: 'Madhapur Section',
        closestTicket: {
          ticketId: 'tkt-001',
          ticketNumber: 'TSSPDCL-HYD-00412',
          priority: 'P1_CRITICAL',
          locality: 'Ayyappa Society, Madhapur',
          primaryAssetCode: 'F-07-CYBER',
          summary: 'Outage on 11kV Feeder F-07 affecting Ayyappa Society & Kavuri Hills',
          distanceKm: 0.8,
          etaMinutes: 6,
        },
      },
      {
        id: 'tech-mdp-3',
        name: 'B. Venkat',
        role: 'Assistant Lineman (ALM)',
        phone: '+91 94408 12302',
        status: 'AVAILABLE',
        experience: '6 yrs • Overhead Line Climbing & Earthing',
        avatarInitials: 'BV',
        gangId: 'crew-tsspdcl-01',
        gangName: 'Madhapur Emergency Gang',
        vehicleId: 'Hydraulic Sky-lift TS-09-EA-4412',
        sectionOffice: 'Madhapur Section',
      },
      {
        id: 'tech-mdp-4',
        name: 'G. Ravi',
        role: 'Sky-lift Hydraulic Operator',
        phone: '+91 94408 12303',
        status: 'AVAILABLE',
        experience: '8 yrs • Aerial Platform & Traffic Safety',
        avatarInitials: 'GR',
        gangId: 'crew-tsspdcl-01',
        gangName: 'Madhapur Emergency Gang',
        vehicleId: 'Hydraulic Sky-lift TS-09-EA-4412',
        sectionOffice: 'Madhapur Section',
      },
    ],
    closestTicket: {
      ticketId: 'tkt-001',
      ticketNumber: 'TSSPDCL-HYD-00412',
      priority: 'P1_CRITICAL',
      locality: 'Ayyappa Society, Madhapur',
      primaryAssetCode: 'F-07-CYBER',
      summary: 'Outage on 11kV Feeder F-07 affecting Ayyappa Society & Kavuri Hills',
      distanceKm: 0.8,
      etaMinutes: 6,
    },
  },
  {
    id: 'crew-tsspdcl-02',
    name: 'TSSPDCL DTR Breakdown Squad (Kondapur Section)',
    shortName: 'Kondapur DTR Crane Squad',
    sectionOffice: 'Sub-Engineer / Operation / Kondapur',
    leadTechnician: 'M. Venkat Rao (Sub-Engineer)',
    leadPhone: '+91 94906 18202',
    specialization: 'TRANSFORMER_DTR_BREAKDOWN',
    specializationLabel: 'DTR Replacement & Bushing Testing',
    vehicleId: 'Heavy Mobile Crane TS-09-UA-8831',
    vehicleType: 'Heavy Mobile Crane Truck (10-Ton Bed)',
    status: 'AVAILABLE',
    currentLocation: 'Kondapur RTO Circle Section Depot',
    baseDepot: 'Kondapur RTO Section Depot',
    coordinates: [78.3650, 17.4640],
    speedKmph: 0,
    etaMinutes: 12,
    phoneContact: '+91 94906 18202',
    members: [
      {
        id: 'tech-knd-1',
        name: 'M. Venkat Rao',
        role: 'Sub-Engineer (SE / Op - Lead)',
        phone: '+91 94906 18202',
        status: 'AVAILABLE',
        experience: '14 yrs • DTR Megger & Oil BDV Testing',
        avatarInitials: 'VR',
        gangId: 'crew-tsspdcl-02',
        gangName: 'Kondapur DTR Breakdown Squad',
        vehicleId: 'Heavy Mobile Crane TS-09-UA-8831',
        sectionOffice: 'Kondapur Section',
        closestTicket: {
          ticketId: 'tkt-003',
          ticketNumber: 'TSSPDCL-HYD-00414',
          priority: 'P3_MEDIUM',
          locality: 'Cyber Towers vicinity, Madhapur',
          primaryAssetCode: 'UNASSIGNED',
          summary: 'Ambiguous location report - requires operator pin verification',
          distanceKm: 2.1,
          etaMinutes: 12,
        },
      },
      {
        id: 'tech-knd-2',
        name: 'P. Naresh',
        role: 'Senior Lineman',
        phone: '+91 94408 22301',
        status: 'AVAILABLE',
        experience: '10 yrs • HT/LT Bushing & HG Fuse Specialist',
        avatarInitials: 'PN',
        gangId: 'crew-tsspdcl-02',
        gangName: 'Kondapur DTR Breakdown Squad',
        vehicleId: 'Heavy Mobile Crane TS-09-UA-8831',
        sectionOffice: 'Kondapur Section',
      },
      {
        id: 'tech-knd-3',
        name: 'S. Ramesh',
        role: 'Junior Lineman',
        phone: '+91 94408 22302',
        status: 'AVAILABLE',
        experience: '4 yrs • Neutral Earthing Pit & Clamping',
        avatarInitials: 'SR',
        gangId: 'crew-tsspdcl-02',
        gangName: 'Kondapur DTR Breakdown Squad',
        vehicleId: 'Heavy Mobile Crane TS-09-UA-8831',
        sectionOffice: 'Kondapur Section',
      },
      {
        id: 'tech-knd-4',
        name: 'T. Krishna',
        role: 'Crane & Rigging Operator',
        phone: '+91 94408 22303',
        status: 'RESTING',
        experience: '9 yrs • Heavy Rigging (Standby at depot)',
        avatarInitials: 'TK',
        gangId: 'crew-tsspdcl-02',
        gangName: 'Kondapur DTR Breakdown Squad',
        vehicleId: 'Heavy Mobile Crane TS-09-UA-8831',
        sectionOffice: 'Kondapur Section',
      },
    ],
    closestTicket: {
      ticketId: 'tkt-003',
      ticketNumber: 'TSSPDCL-HYD-00414',
      priority: 'P3_MEDIUM',
      locality: 'Cyber Towers vicinity, Madhapur',
      primaryAssetCode: 'UNASSIGNED',
      summary: 'Ambiguous location report - requires operator pin verification',
      distanceKm: 2.1,
      etaMinutes: 12,
    },
  },
  {
    id: 'crew-tsspdcl-03',
    name: 'TSSPDCL Fuse-Off Call Gang (Gachibowli Section)',
    shortName: 'Gachibowli Fuse-Off Squad',
    sectionOffice: 'Lineman / Operation / Gachibowli',
    leadTechnician: 'Y. Yadagiri (Lead Lineman)',
    leadPhone: '+91 94906 18203',
    specialization: 'FUSE_OFF_CALL',
    specializationLabel: 'LT Fuse-Off Calls & Underground Cable Puncture',
    vehicleId: 'Patrol 4x4 Bolero TS-09-GA-1102',
    vehicleType: 'Rapid Response 4x4 Bolero Utility Van',
    status: 'DISPATCHED',
    currentLocation: 'Financial District Wipro Circle (En Route to Waverock)',
    baseDepot: 'Gachibowli Stadium Substation Depot',
    coordinates: [78.3550, 17.4350],
    speedKmph: 36,
    etaMinutes: 5,
    assignedIncidentId: 'tkt-002',
    assignedTicketNumber: 'TSSPDCL-HYD-00418',
    assignedTaskDescription: 'Investigating phase drop & neutral voltage shift on DTR-GCB-301 secondary bus',
    assignedAt: 'Today, 17:22 IST',
    phoneContact: '+91 94906 18203',
    members: [
      {
        id: 'tech-gcb-1',
        name: 'Y. Yadagiri',
        role: 'Lead Lineman (FOC In-charge)',
        phone: '+91 94906 18203',
        status: 'ASSIGNED',
        assignedTicketId: 'tkt-002',
        assignedTicketNumber: 'TSSPDCL-HYD-00418',
        assignedTaskDescription: 'Investigating phase drop & neutral voltage shift on DTR-GCB-301 secondary bus',
        assignedAt: 'Today, 17:22 IST',
        experience: '11 yrs • 415V Phase Balancing & LT Fuses',
        avatarInitials: 'YY',
        gangId: 'crew-tsspdcl-03',
        gangName: 'Gachibowli Fuse-Off Call Gang',
        vehicleId: 'Patrol 4x4 Bolero TS-09-GA-1102',
        sectionOffice: 'Gachibowli Section',
      },
      {
        id: 'tech-gcb-2',
        name: 'Ch. Suresh',
        role: 'Lineman Assistant',
        phone: '+91 94408 33301',
        status: 'ASSIGNED',
        assignedTicketId: 'tkt-002',
        assignedTicketNumber: 'TSSPDCL-HYD-00418',
        assignedTaskDescription: 'Investigating phase drop & neutral voltage shift on DTR-GCB-301 secondary bus',
        assignedAt: 'Today, 17:22 IST',
        experience: '5 yrs • Consumer Meter & Service Drop Specialist',
        avatarInitials: 'CS',
        gangId: 'crew-tsspdcl-03',
        gangName: 'Gachibowli Fuse-Off Call Gang',
        vehicleId: 'Patrol 4x4 Bolero TS-09-GA-1102',
        sectionOffice: 'Gachibowli Section',
      },
      {
        id: 'tech-gcb-3',
        name: 'A. Kumar',
        role: 'Patrol Driver & Field Tech',
        phone: '+91 94408 33302',
        status: 'AVAILABLE',
        experience: '7 yrs • Emergency Response Navigation',
        avatarInitials: 'AK',
        gangId: 'crew-tsspdcl-03',
        gangName: 'Gachibowli Fuse-Off Call Gang',
        vehicleId: 'Patrol 4x4 Bolero TS-09-GA-1102',
        sectionOffice: 'Gachibowli Section',
      },
    ],
    closestTicket: {
      ticketId: 'tkt-006',
      ticketNumber: 'TSSPDCL-HYD-00422',
      priority: 'P1_CRITICAL',
      locality: 'Financial District, Gachibowli',
      primaryAssetCode: 'F-12-FIN',
      summary: 'Underground 11kV XLPE cable fault between Substation and Waverock Junction',
      distanceKm: 1.4,
      etaMinutes: 8,
    },
  },
];

// 3. Grid Assets (Substations, Feeders, DTRs)
export const MOCK_ASSETS: GridAsset[] = [
  // 33/11kV Substations
  {
    id: 'ss-mdp',
    code: 'SS-MADHAPUR-33KV',
    name: 'Madhapur 33/11kV Main Substation',
    type: 'SUBSTATION',
    voltage: '33kV / 11kV',
    state: 'HEALTHY',
    coordinates: [78.3790, 17.4490],
    consumersAffected: 0,
    lastTelemetryTimestamp: 'Nominal Bus (33.2kV)',
  },
  {
    id: 'ss-knd',
    code: 'SS-KONDAPUR-33KV',
    name: 'Kondapur 33/11kV Substation',
    type: 'SUBSTATION',
    voltage: '33kV / 11kV',
    state: 'HEALTHY',
    coordinates: [78.3680, 17.4620],
    consumersAffected: 0,
    lastTelemetryTimestamp: 'Nominal Bus (33.1kV)',
  },
  {
    id: 'ss-gcb',
    code: 'SS-GACHIBOWLI-33KV',
    name: 'Gachibowli 33/11kV Substation',
    type: 'SUBSTATION',
    voltage: '33kV / 11kV',
    state: 'HEALTHY',
    coordinates: [78.3580, 17.4380],
    consumersAffected: 0,
    lastTelemetryTimestamp: 'Nominal Bus (33.4kV)',
  },

  // 11kV Feeders
  {
    id: 'f-07',
    code: 'F-07-CYBER',
    name: '11kV Feeder 07 - Cyber Towers & Ayyappa Society',
    type: 'FEEDER',
    voltage: '11kV',
    state: 'DOWN', // Outage in scenario
    parentAssetId: 'ss-mdp',
    feederCode: 'F-07',
    coordinates: [78.3820, 17.4465],
    consumersAffected: 740,
    lastTelemetryTimestamp: 'Trip Alert: 11kV Breaker Open (3m ago)',
  },
  {
    id: 'f-03',
    code: 'F-03-KNDPR',
    name: '11kV Feeder 03 - Kondapur Residential',
    type: 'FEEDER',
    voltage: '11kV',
    state: 'HEALTHY',
    parentAssetId: 'ss-knd',
    feederCode: 'F-03',
    coordinates: [78.3650, 17.4620],
    consumersAffected: 0,
    lastTelemetryTimestamp: 'Nominal (11.2kV)',
  },
  {
    id: 'f-12',
    code: 'F-12-FIN',
    name: '11kV Feeder 12 - Financial District Express',
    type: 'FEEDER',
    voltage: '11kV',
    state: 'HEALTHY',
    parentAssetId: 'ss-gcb',
    feederCode: 'F-12',
    coordinates: [78.3550, 17.4350],
    consumersAffected: 0,
    lastTelemetryTimestamp: 'Nominal (11.3kV)',
  },

  // Distribution Transformers (DTR / 11kV to 415V/240V) under Feeder F-07 (Madhapur)
  {
    id: 'dtr-mdp-101',
    code: 'DTR-MDP-101',
    name: '100kVA DTR Kavuri Hills Phase 1',
    type: 'TRANSFORMER',
    voltage: '415V / 240V',
    state: 'DOWN',
    parentAssetId: 'f-07',
    hubId: 'hub-07',
    feederCode: 'F-07',
    coordinates: [78.3860, 17.4425],
    consumersAffected: 180,
    capacityKva: 100,
    currentLoadAmps: 0,
    lastTelemetryTimestamp: 'Zero Secondary Voltage',
  },
  {
    id: 'dtr-mdp-102',
    code: 'DTR-MDP-102',
    name: '250kVA DTR Ayyappa Society Main Road',
    type: 'TRANSFORMER',
    voltage: '415V / 240V',
    state: 'DOWN',
    parentAssetId: 'f-07',
    hubId: 'hub-07',
    feederCode: 'F-07',
    coordinates: [78.3820, 17.4465],
    consumersAffected: 320,
    capacityKva: 250,
    currentLoadAmps: 0,
    lastTelemetryTimestamp: 'Zero Voltage / LT Breaker Open',
  },
  {
    id: 'dtr-mdp-103',
    code: 'DTR-MDP-103',
    name: '160kVA DTR Madhapur 100ft Road Circle',
    type: 'TRANSFORMER',
    voltage: '415V / 240V',
    state: 'DOWN',
    parentAssetId: 'f-07',
    hubId: 'hub-07',
    feederCode: 'F-07',
    coordinates: [78.3910, 17.4485],
    consumersAffected: 240,
    capacityKva: 160,
    currentLoadAmps: 0,
    lastTelemetryTimestamp: 'Zero Secondary Voltage',
  },

  // DTRs under Feeder F-03 (Kondapur)
  {
    id: 'dtr-knd-201',
    code: 'DTR-KND-201',
    name: '250kVA DTR Kondapur RTO Circle',
    type: 'TRANSFORMER',
    voltage: '415V / 240V',
    state: 'HEALTHY',
    parentAssetId: 'f-03',
    hubId: 'hub-03',
    feederCode: 'F-03',
    coordinates: [78.3650, 17.4640],
    consumersAffected: 0,
    capacityKva: 250,
    currentLoadAmps: 195,
    lastTelemetryTimestamp: 'Nominal (241V)',
  },
  {
    id: 'dtr-knd-202',
    code: 'DTR-KND-202',
    name: '100kVA DTR Botanical Garden Road',
    type: 'TRANSFORMER',
    voltage: '415V / 240V',
    state: 'HEALTHY',
    parentAssetId: 'f-03',
    hubId: 'hub-03',
    feederCode: 'F-03',
    coordinates: [78.3620, 17.4580],
    consumersAffected: 0,
    capacityKva: 100,
    currentLoadAmps: 85,
    lastTelemetryTimestamp: 'Nominal (239V)',
  },

  // DTR under Feeder F-12 (Gachibowli)
  {
    id: 'dtr-gcb-301',
    code: 'DTR-GCB-301',
    name: '500kVA DTR Financial District Tech Park',
    type: 'TRANSFORMER',
    voltage: '415V / 240V',
    state: 'HEALTHY',
    parentAssetId: 'f-12',
    hubId: 'hub-12',
    feederCode: 'F-12',
    coordinates: [78.3520, 17.4320],
    consumersAffected: 0,
    capacityKva: 500,
    currentLoadAmps: 340,
    lastTelemetryTimestamp: 'Nominal (242V)',
  },
];

// 4. End Users / Consumer Meter Premises (USC: Unique Service Connection)
export const MOCK_END_USERS: EndUserPremises[] = [
  {
    id: 'usr-101',
    serviceConnectionNo: '1104-58293',
    consumerName: 'B. Venkatesh Goud (Domestic)',
    addressText: 'Plot 42, 2nd Cross, Ayyappa Society, Madhapur',
    locality: 'Ayyappa Society, Madhapur',
    transformerId: 'dtr-mdp-102',
    coordinates: [78.3824, 17.4468],
    contactPhone: '+91 98490 23456',
    loadKw: 5.0,
  },
  {
    id: 'usr-102',
    serviceConnectionNo: '1104-58294',
    consumerName: 'K. Lakshmi Rao (Domestic)',
    addressText: 'Flat 201, Sri Sai Nilayam, Kavuri Hills, Madhapur',
    locality: 'Kavuri Hills, Madhapur',
    transformerId: 'dtr-mdp-101',
    coordinates: [78.3862, 17.4422],
    contactPhone: '+91 98490 55441',
    loadKw: 6.5,
  },
  {
    id: 'usr-103',
    serviceConnectionNo: '1104-58310',
    consumerName: 'Bhavani Commercial Complex',
    addressText: 'Shop 14, 100ft Road Circle, Madhapur',
    locality: 'Madhapur 100ft Road',
    transformerId: 'dtr-mdp-103',
    coordinates: [78.3915, 17.4487],
    contactPhone: '+91 98490 77119',
    loadKw: 15.0,
  },
  {
    id: 'usr-201',
    serviceConnectionNo: '1107-12948',
    consumerName: 'Vasavi Residency Association',
    addressText: 'Building 18, Kondapur RTO Circle Road',
    locality: 'Kondapur',
    transformerId: 'dtr-knd-201',
    coordinates: [78.3653, 17.4642],
    contactPhone: '+91 98490 88223',
    loadKw: 25.0,
  },
];

// GeoJSON Generators for MapLibre
export function getSubstationsGeoJSON() {
  const substations = MOCK_ASSETS.filter((a) => a.type === 'SUBSTATION');
  return {
    type: 'FeatureCollection',
    features: substations.map((ss) => ({
      type: 'Feature',
      properties: {
        id: ss.id,
        code: ss.code,
        name: ss.name,
        voltage: ss.voltage,
        type: 'SUBSTATION',
        color: '#38bdf8', // bright sky blue
      },
      geometry: {
        type: 'Point',
        coordinates: ss.coordinates,
      },
    })),
  };
}

export function getFeederLinesGeoJSON() {
  const lines = [
    // Madhapur 33kV SS -> Feeder 07 -> Transformers (Kavuri Hills, Ayyappa Society, 100ft Rd)
    {
      type: 'Feature',
      properties: {
        feederCode: 'F-07',
        name: 'TSSPDCL 11kV Feeder 07 (Cyber Towers & Ayyappa Society)',
        state: 'DOWN',
        color: '#ef4444',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [78.3790, 17.4490], // SS Madhapur
          [78.3805, 17.4480],
          [78.3820, 17.4465], // DTR-MDP-102 (Ayyappa Society)
          [78.3860, 17.4425], // DTR-MDP-101 (Kavuri Hills)
          [78.3910, 17.4485], // DTR-MDP-103 (100ft Rd)
        ],
      },
    },
    // Kondapur 33kV SS -> Feeder 03 -> DTRs
    {
      type: 'Feature',
      properties: {
        feederCode: 'F-03',
        name: 'TSSPDCL 11kV Feeder 03 (Kondapur Residential)',
        state: 'HEALTHY',
        color: '#10b981',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [78.3680, 17.4620], // SS Kondapur
          [78.3665, 17.4630],
          [78.3650, 17.4640], // DTR-KND-201
          [78.3620, 17.4580], // DTR-KND-202
        ],
      },
    },
    // Gachibowli 33kV SS -> Feeder 12 -> DTR
    {
      type: 'Feature',
      properties: {
        feederCode: 'F-12',
        name: 'TSSPDCL 11kV Feeder 12 (Financial District Express)',
        state: 'HEALTHY',
        color: '#10b981',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [78.3580, 17.4380], // SS Gachibowli
          [78.3550, 17.4350],
          [78.3520, 17.4320], // DTR-GCB-301
        ],
      },
    },
  ];

  return {
    type: 'FeatureCollection',
    features: lines,
  };
}

export function getTransformersGeoJSON(assets: GridAsset[]) {
  const transformers = assets.filter((a) => a.type === 'TRANSFORMER');
  return {
    type: 'FeatureCollection',
    features: transformers.map((tr) => ({
      type: 'Feature',
      properties: {
        id: tr.id,
        code: tr.code,
        name: tr.name,
        state: tr.state,
        feederCode: tr.feederCode,
        hubId: tr.hubId,
        voltage: tr.voltage,
        capacity: tr.capacityKva || 250,
        consumers: tr.consumersAffected || 0,
        type: 'TRANSFORMER',
        color:
          tr.state === 'HEALTHY'
            ? '#10b981'
            : tr.state === 'DOWN'
            ? '#ef4444'
            : tr.state === 'MAINTENANCE'
            ? '#f59e0b'
            : '#94a3b8',
      },
      geometry: {
        type: 'Point',
        coordinates: tr.coordinates,
      },
    })),
  };
}

export function getEndUsersGeoJSON(endUsers: EndUserPremises[]) {
  return {
    type: 'FeatureCollection',
    features: endUsers.map((usr) => ({
      type: 'Feature',
      properties: {
        id: usr.id,
        serviceConnectionNo: usr.serviceConnectionNo,
        consumerName: usr.consumerName,
        locality: usr.locality,
        loadKw: usr.loadKw,
        type: 'END_USER',
        color: '#a855f7', // purple
      },
      geometry: {
        type: 'Point',
        coordinates: usr.coordinates,
      },
    })),
  };
}

// Service drop lines connecting DTR to Consumer
export function getServiceDropsGeoJSON() {
  const lines = [
    // DTR-MDP-102 to Venkatesh Goud (Ayyappa Society)
    {
      type: 'Feature',
      properties: { dtrCode: 'DTR-MDP-102', usc: '1104-58293' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [78.3820, 17.4465], // DTR-MDP-102
          [78.3824, 17.4468], // Consumer
        ],
      },
    },
    // DTR-MDP-101 to Lakshmi Rao (Kavuri Hills)
    {
      type: 'Feature',
      properties: { dtrCode: 'DTR-MDP-101', usc: '1104-58294' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [78.3860, 17.4425], // DTR-MDP-101
          [78.3862, 17.4422], // Consumer
        ],
      },
    },
  ];

  return {
    type: 'FeatureCollection',
    features: lines,
  };
}
