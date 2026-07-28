import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { GoogleGenAI } from '@google/genai';
import {
  User,
  Plot,
  Client,
  Contract,
  Inquiry,
  Burial,
  Payment,
  PathNode,
  PathEdge,
  ActivityLog,
  CemeteryMap,
  PathStep,
  PathFindingResult,
} from './src/types.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'himlayan-jwt-access-secret-key-2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'himlayan-jwt-refresh-secret-key-2026';

// Initialize In-Memory Data Store (Pre-seeded)
const salt = bcrypt.genSaltSync(10);
const defaultPasswordHash = bcrypt.hashSync('Admin@123', salt);

let usersStore: User[] = [
  {
    id: 'usr-1',
    email: 'admin@himlayan.gov.ph',
    full_name: 'Super Admin User',
    role: 'super_admin',
    is_active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-2',
    email: 'rcc@himlayan.gov.ph',
    full_name: 'RCC Memorial Clerk',
    role: 'rcc',
    is_active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-3',
    email: 'engineer@himlayan.gov.ph',
    full_name: 'Cemetery Engineer',
    role: 'engineer',
    is_active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-4',
    email: 'staff@himlayan.gov.ph',
    full_name: 'Grounds Staff',
    role: 'staff',
    is_active: true,
    createdAt: new Date().toISOString(),
  },
];

// 20 Path Nodes in Himlayan Cemetery
const pathNodesStore: PathNode[] = [
  { id: 'node-gate-1', lat: 14.6700, lng: 121.0400, node_label: 'Main Gate Entrance', is_accessible: true },
  { id: 'node-1', lat: 14.6710, lng: 121.0405, node_label: 'Main Entrance Avenue A', is_accessible: true },
  { id: 'node-2', lat: 14.6720, lng: 121.0410, node_label: 'Section A North Plaza', is_accessible: true },
  { id: 'node-3', lat: 14.6730, lng: 121.0415, node_label: 'Section A North Pathway', is_accessible: true },
  { id: 'node-4', lat: 14.6740, lng: 121.0420, node_label: 'Section A Garden Loop', is_accessible: true },
  { id: 'node-5', lat: 14.6715, lng: 121.0425, node_label: 'Section B East Entrance', is_accessible: true },
  { id: 'node-6', lat: 14.6725, lng: 121.0430, node_label: 'Section B Promenade', is_accessible: true },
  { id: 'node-7', lat: 14.6735, lng: 121.0435, node_label: 'Section B Memorial Cross', is_accessible: true },
  { id: 'node-8', lat: 14.6745, lng: 121.0440, node_label: 'Section B East Perimeter', is_accessible: true },
  { id: 'node-9', lat: 14.6690, lng: 121.0410, node_label: 'Section C South Junction', is_accessible: true },
  { id: 'node-10', lat: 14.6680, lng: 121.0420, node_label: 'Section C Apartment Terraces', is_accessible: true },
  { id: 'node-11', lat: 14.6670, lng: 121.0430, node_label: 'Section C South Garden', is_accessible: true },
  { id: 'node-12', lat: 14.6660, lng: 121.0440, node_label: 'Section C Quiet Meadow', is_accessible: true },
  { id: 'node-13', lat: 14.6705, lng: 121.0390, node_label: 'Section D West Avenue', is_accessible: true },
  { id: 'node-14', lat: 14.6715, lng: 121.0385, node_label: 'Section D Family Mausoleum Lane', is_accessible: true },
  { id: 'node-15', lat: 14.6725, lng: 121.0380, node_label: 'Section D Heritage Circle', is_accessible: true },
  { id: 'node-16', lat: 14.6735, lng: 121.0375, node_label: 'Section D West Gate Exit', is_accessible: true },
  { id: 'node-17', lat: 14.6700, lng: 121.0420, node_label: 'Central Chapel & Administration Building', is_accessible: true },
  { id: 'node-18', lat: 14.6710, lng: 121.0430, node_label: 'Central Fountain Plaza', is_accessible: true },
  { id: 'node-19', lat: 14.6720, lng: 121.0440, node_label: 'Central Peace Pavilion', is_accessible: true },
];

// Helper Haversine distance in meters
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Generate Path Edges connecting graph nodes
const pathEdgesStore: PathEdge[] = [
  { id: 'e-1', from_node_id: 'node-gate-1', to_node_id: 'node-1', distance_weight: 120, pathway_name: 'Main Gate Avenue' },
  { id: 'e-2', from_node_id: 'node-1', to_node_id: 'node-2', distance_weight: 130, pathway_name: 'Section A Main Drive' },
  { id: 'e-3', from_node_id: 'node-2', to_node_id: 'node-3', distance_weight: 125, pathway_name: 'Section A North Path' },
  { id: 'e-4', from_node_id: 'node-3', to_node_id: 'node-4', distance_weight: 140, pathway_name: 'Section A Garden Loop' },
  { id: 'e-5', from_node_id: 'node-1', to_node_id: 'node-17', distance_weight: 200, pathway_name: 'Chapel Walkway' },
  { id: 'e-6', from_node_id: 'node-17', to_node_id: 'node-18', distance_weight: 150, pathway_name: 'Fountain Promenade' },
  { id: 'e-7', from_node_id: 'node-18', to_node_id: 'node-19', distance_weight: 160, pathway_name: 'Peace Pavilion Path' },
  { id: 'e-8', from_node_id: 'node-17', to_node_id: 'node-5', distance_weight: 170, pathway_name: 'East Link Road' },
  { id: 'e-9', from_node_id: 'node-5', to_node_id: 'node-6', distance_weight: 130, pathway_name: 'Section B Avenue' },
  { id: 'e-10', from_node_id: 'node-6', to_node_id: 'node-7', distance_weight: 135, pathway_name: 'Memorial Cross Way' },
  { id: 'e-11', from_node_id: 'node-7', to_node_id: 'node-8', distance_weight: 145, pathway_name: 'East Perimeter Road' },
  { id: 'e-12', from_node_id: 'node-gate-1', to_node_id: 'node-9', distance_weight: 150, pathway_name: 'South Entry Road' },
  { id: 'e-13', from_node_id: 'node-9', to_node_id: 'node-10', distance_weight: 140, pathway_name: 'Apartment Terrace Way' },
  { id: 'e-14', from_node_id: 'node-10', to_node_id: 'node-11', distance_weight: 145, pathway_name: 'South Garden Path' },
  { id: 'e-15', from_node_id: 'node-11', to_node_id: 'node-12', distance_weight: 155, pathway_name: 'Quiet Meadow Lane' },
  { id: 'e-16', from_node_id: 'node-gate-1', to_node_id: 'node-13', distance_weight: 110, pathway_name: 'West Perimeter Avenue' },
  { id: 'e-17', from_node_id: 'node-13', to_node_id: 'node-14', distance_weight: 125, pathway_name: 'Family Mausoleum Way' },
  { id: 'e-18', from_node_id: 'node-14', to_node_id: 'node-15', distance_weight: 130, pathway_name: 'Heritage Circle Lane' },
  { id: 'e-19', from_node_id: 'node-15', to_node_id: 'node-16', distance_weight: 135, pathway_name: 'West Gate Link' },
  { id: 'e-20', from_node_id: 'node-2', to_node_id: 'node-18', distance_weight: 210, pathway_name: 'North-Central Cross Road' },
  { id: 'e-21', from_node_id: 'node-6', to_node_id: 'node-18', distance_weight: 190, pathway_name: 'East-Central Link' },
  { id: 'e-22', from_node_id: 'node-10', to_node_id: 'node-17', distance_weight: 220, pathway_name: 'South-Central Link' },
  { id: 'e-23', from_node_id: 'node-14', to_node_id: 'node-17', distance_weight: 200, pathway_name: 'West-Central Link' },
];

// Seed 80 Plots (Sections A, B, C, D)
const plotsStore: Plot[] = [];

const sections = [
  { name: 'A', latOffset: 0.003, lngOffset: 0.001, node: 'node-3', typeDist: ['single', 'single', 'family'] },
  { name: 'B', latOffset: 0.002, lngOffset: 0.003, node: 'node-6', typeDist: ['single', 'family', 'family'] },
  { name: 'C', latOffset: -0.002, lngOffset: 0.002, node: 'node-10', typeDist: ['apartment', 'apartment', 'single'] },
  { name: 'D', latOffset: 0.001, lngOffset: -0.002, node: 'node-14', typeDist: ['family', 'family', 'apartment'] },
];

let plotIdCounter = 1;
sections.forEach((sec) => {
  for (let i = 1; i <= 20; i++) {
    const pNum = `${sec.name}-${i < 10 ? '0' + i : i}`;
    const lotType = sec.typeDist[i % 3] as 'single' | 'family' | 'apartment';
    const capacity = lotType === 'single' ? 1 : lotType === 'family' ? 4 : 8;
    const price = lotType === 'single' ? 15000 : lotType === 'family' ? 35000 : 60000;
    
    // Status distribution
    let status: 'available' | 'reserved' | 'occupied' | 'full' = 'available';
    let currentOccupants = 0;
    let burialDate: string | undefined = undefined;
    let burialTime: string | undefined = undefined;
    let inquirerName: string | undefined = undefined;
    let deceasedName: string | undefined = undefined;

    if (i % 4 === 0) {
      status = 'occupied';
      currentOccupants = 1;
    } else if (i % 7 === 0) {
      status = 'reserved';
      // Future burial date for reserved lot
      const daysAhead = (i % 3) + 1;
      const bDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
      bDate.setHours(10, 0, 0, 0);
      burialDate = bDate.toISOString();
      burialTime = '10:00 AM';
      inquirerName = i % 2 === 0 ? 'Elena Ramos' : 'Juan Dela Cruz';
      deceasedName = i % 2 === 0 ? 'Mateo Ramos' : 'Rosalina Dela Cruz';
    } else if (i % 11 === 0) {
      status = 'full';
      currentOccupants = capacity;
    }

    const lat = 14.6700 + sec.latOffset + (Math.floor((i - 1) / 5) * 0.0003) + ((i % 5) * 0.0001);
    const lng = 121.0400 + sec.lngOffset + ((i % 5) * 0.0003) + (Math.floor((i - 1) / 5) * 0.0001);

    plotsStore.push({
      id: `plot-${plotIdCounter++}`,
      plot_number: pNum,
      section: sec.name,
      lat,
      lng,
      lot_type: lotType,
      capacity,
      current_occupants: currentOccupants,
      status,
      price,
      nearest_path_node_id: sec.node,
      notes: `Himlayan Memorial Section ${sec.name} plot lot #${pNum}`,
      burial_date: burialDate,
      burial_time: burialTime,
      inquirer_name: inquirerName,
      deceased_name: deceasedName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
});

// Seed Clients, Contracts, Inquiries, Burials
const clientsStore: Client[] = [
  {
    id: 'cli-1',
    full_name: 'Maria Santos',
    contact_number: '+63 917 123 4567',
    email: 'maria.santos@gmail.com',
    address: '123 Katipunan Ave, Metro Manila',
    id_number: 'CRN-1984-55412',
    id_type: 'UMID',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cli-2',
    full_name: 'Juan Dela Cruz',
    contact_number: '+63 918 987 6543',
    email: 'juan.delacruz@yahoo.com',
    address: '456 Commonwealth Ave, Metro Manila',
    id_number: 'PASSPORT-A99881',
    id_type: 'Passport',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cli-3',
    full_name: 'Elena Ramos',
    contact_number: '+63 920 555 1212',
    email: 'elena.ramos@outlook.com',
    address: '789 Visayas Ave, Metro Manila',
    id_number: 'SSS-03-9988711-2',
    id_type: 'SSS ID',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const contractsStore: Contract[] = [
  {
    id: 'ctr-1',
    client_id: 'cli-1',
    plot_id: 'plot-4', // A-04
    contract_date: '2026-01-15',
    contract_type: 'new',
    commencement_date: '2026-01-15',
    expiration_date: '2056-01-15',
    total_amount: 15000,
    payment_type: 'cash',
    status: 'completed',
    prepared_by: 'usr-2',
    approved_by_superadmin_at: '2026-01-16T10:00:00Z',
    death_certificate_number: 'DC-2026-0012',
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'ctr-2',
    client_id: 'cli-2',
    plot_id: 'plot-8', // A-08
    contract_date: '2026-03-20',
    contract_type: 'new',
    commencement_date: '2026-03-20',
    expiration_date: '2076-03-20',
    total_amount: 35000,
    payment_type: 'installment',
    status: 'active',
    prepared_by: 'usr-2',
    death_certificate_number: 'DC-2026-0044',
    createdAt: '2026-03-20T09:30:00Z',
  },
];

const inquiriesStore: Inquiry[] = [
  {
    id: 'inq-1',
    client_id: 'cli-1',
    plot_id: 'plot-1',
    inquiry_date: '2026-07-20',
    message: 'Interested in purchasing a Single Lot in Section A near the shade trees.',
    status: 'approved',
    processed_by: 'usr-2',
    processed_at: '2026-07-21T09:00:00Z',
    createdAt: '2026-07-20T14:22:00Z',
  },
  {
    id: 'inq-2',
    client_id: 'cli-3',
    plot_id: 'plot-25', // Section B
    inquiry_date: '2026-07-22',
    message: 'Requesting quotation and installment terms for Family Lot B-05.',
    status: 'pending',
    createdAt: '2026-07-22T11:05:00Z',
  },
];

const burialsStore: Burial[] = [
  {
    id: 'bur-1',
    plot_id: 'plot-4',
    contract_id: 'ctr-1',
    deceased_name: 'Roberto Santos',
    date_of_birth: '1945-05-12',
    date_of_death: '2026-01-10',
    burial_date: '2026-01-18T10:00:00',
    burial_status: 'completed',
    scheduled_by: 'usr-2',
    notes: 'Funeral service held at Central Chapel. Full military honor detail.',
    createdAt: '2026-01-15T11:00:00Z',
  },
];

const paymentsStore: Payment[] = [
  {
    id: 'pay-1',
    contract_id: 'ctr-1',
    amount: 15000,
    payment_date: '2026-01-15',
    payment_method: 'cash',
    receipt_number: 'OR-2026-00891',
    collected_by: 'usr-2',
    notes: 'Full payment for Plot A-04',
    createdAt: '2026-01-15T09:00:00Z',
  },
  {
    id: 'pay-2',
    contract_id: 'ctr-2',
    amount: 10000,
    payment_date: '2026-03-20',
    payment_method: 'installment',
    receipt_number: 'OR-2026-01102',
    collected_by: 'usr-2',
    notes: 'Initial downpayment for Plot A-08',
    createdAt: '2026-03-20T10:15:00Z',
  },
];

const activityLogsStore: ActivityLog[] = [
  {
    id: 'act-1',
    user_id: 'usr-1',
    user_email: 'admin@himlayan.gov.ph',
    action: 'SYSTEM_INITIALIZATION',
    module: 'System',
    description: 'Himlayan Cemetery Management System loaded with 80 plots & pathfinding network.',
    ip_address: '127.0.0.1',
    createdAt: new Date().toISOString(),
  },
];

let cemeteryMapStore: CemeteryMap = {
  id: 'map-1',
  name: 'Himlayan Memorial Park Master Boundary',
  description: 'Official Himlayan Memorial Park boundary perimeter and sector outlines.',
  boundary_data: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'Cemetery Perimeter' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [121.0370, 14.6750],
              [121.0450, 14.6750],
              [121.0450, 14.6650],
              [121.0370, 14.6650],
              [121.0370, 14.6750],
            ],
          ],
        },
      },
    ],
  },
  createdAt: new Date().toISOString(),
};

// A* Pathfinding Engine Function
function findAStarPath(fromNodeId: string, toNodeId: string): PathFindingResult {
  const nodeMap = new Map<string, PathNode>();
  pathNodesStore.forEach((n) => nodeMap.set(n.id, n));

  const startNode = nodeMap.get(fromNodeId);
  const endNode = nodeMap.get(toNodeId);

  if (!startNode || !endNode) {
    return { path: [], totalDistance: 0, nodesVisited: 0 };
  }

  // Build Adjacency List
  const adj = new Map<string, { targetId: string; weight: number }[]>();
  pathNodesStore.forEach((n) => adj.set(n.id, []));

  pathEdgesStore.forEach((e) => {
    const list1 = adj.get(e.from_node_id);
    if (list1) list1.push({ targetId: e.to_node_id, weight: e.distance_weight });
    const list2 = adj.get(e.to_node_id);
    if (list2) list2.push({ targetId: e.from_node_id, weight: e.distance_weight });
  });

  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();
  const cameFrom = new Map<string, string>();
  const openSet = new Set<string>();

  pathNodesStore.forEach((n) => {
    gScore.set(n.id, Infinity);
    fScore.set(n.id, Infinity);
  });

  gScore.set(fromNodeId, 0);
  fScore.set(fromNodeId, calculateHaversineDistance(startNode.lat, startNode.lng, endNode.lat, endNode.lng));
  openSet.add(fromNodeId);

  let nodesVisited = 0;

  while (openSet.size > 0) {
    nodesVisited++;
    // Get node in openSet with lowest fScore
    let currentId = Array.from(openSet)[0]!;
    let lowestF = fScore.get(currentId)!;

    openSet.forEach((id) => {
      const f = fScore.get(id)!;
      if (f < lowestF) {
        lowestF = f;
        currentId = id;
      }
    });

    if (currentId === toNodeId) {
      // Reconstruct path
      const pathNodesList: PathNode[] = [];
      let curr: string | undefined = toNodeId;
      while (curr) {
        const n = nodeMap.get(curr);
        if (n) pathNodesList.unshift(n);
        curr = cameFrom.get(curr);
      }

      // Calculate step distances
      const pathSteps: PathStep[] = [];
      let accumulatedDistance = 0;

      for (let i = 0; i < pathNodesList.length; i++) {
        const pNode = pathNodesList[i]!;
        let stepDist = 0;
        if (i > 0) {
          const prev = pathNodesList[i - 1]!;
          stepDist = calculateHaversineDistance(prev.lat, prev.lng, pNode.lat, pNode.lng);
          accumulatedDistance += stepDist;
        }
        pathSteps.push({
          nodeId: pNode.id,
          lat: pNode.lat,
          lng: pNode.lng,
          label: pNode.node_label || pNode.id,
          distanceFromPrevious: stepDist,
        });
      }

      return {
        path: pathSteps,
        totalDistance: accumulatedDistance,
        nodesVisited,
      };
    }

    openSet.delete(currentId);
    const neighbors = adj.get(currentId) || [];

    for (const neighbor of neighbors) {
      const tentativeG = gScore.get(currentId)! + neighbor.weight;
      if (tentativeG < gScore.get(neighbor.targetId)!) {
        cameFrom.set(neighbor.targetId, currentId);
        gScore.set(neighbor.targetId, tentativeG);

        const targetNode = nodeMap.get(neighbor.targetId)!;
        const h = calculateHaversineDistance(targetNode.lat, targetNode.lng, endNode.lat, endNode.lng);
        fScore.set(neighbor.targetId, tentativeG + h);

        openSet.add(neighbor.targetId);
      }
    }
  }

  // Fallback: direct line if no edge path found
  return {
    path: [
      { nodeId: startNode.id, lat: startNode.lat, lng: startNode.lng, label: startNode.node_label, distanceFromPrevious: 0 },
      { nodeId: endNode.id, lat: endNode.lat, lng: endNode.lng, label: endNode.node_label, distanceFromPrevious: calculateHaversineDistance(startNode.lat, startNode.lng, endNode.lat, endNode.lng) },
    ],
    totalDistance: calculateHaversineDistance(startNode.lat, startNode.lng, endNode.lat, endNode.lng),
    nodesVisited,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Middleware: Authentication Guard
  const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ success: false, error: 'Unauthorized: Missing token' });
      return;
    }

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired token' });
        return;
      }
      (req as any).user = decoded;
      next();
    });
  };

  // Helper activity log logger
  const logActivity = (action: string, module: string, description: string, req?: express.Request) => {
    const user = req ? (req as any).user : undefined;
    activityLogsStore.unshift({
      id: `act-${Date.now()}`,
      user_id: user?.id || undefined,
      user_email: user?.email || undefined,
      action,
      module,
      description,
      ip_address: req ? req.ip || '127.0.0.1' : '127.0.0.1',
      createdAt: new Date().toISOString(),
    });
    if (activityLogsStore.length > 500) {
      activityLogsStore.pop();
    }
  };

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Auth Routes
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password required' });
      return;
    }

    const user = usersStore.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || !user.is_active) {
      res.status(401).json({ success: false, error: 'Invalid credentials or inactive account' });
      return;
    }

    // Compare password (accept Admin@123 for seeded or check hash)
    const valid = password === 'Admin@123' || bcrypt.compareSync(password, defaultPasswordHash);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const tokenPayload = { id: user.id, email: user.email, role: user.role, name: user.full_name };
    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    logActivity('USER_LOGIN', 'Auth', `User ${user.email} logged in successfully as ${user.role}.`, req);

    res.json({
      success: true,
      data: {
        user,
        accessToken,
        refreshToken,
      },
    });
  });

  app.post('/api/auth/refresh-token', (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ success: false, error: 'Refresh token required' });
      return;
    }

    jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err: any, decoded: any) => {
      if (err) {
        res.status(401).json({ success: false, error: 'Invalid refresh token' });
        return;
      }
      const user = usersStore.find((u) => u.id === decoded.id);
      if (!user) {
        res.status(401).json({ success: false, error: 'User not found' });
        return;
      }
      const newAccessToken = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.full_name }, JWT_SECRET, { expiresIn: '15m' });
      const newRefreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

      res.json({
        success: true,
        data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
      });
    });
  });

  app.get('/api/auth/profile', authenticateToken, (req, res) => {
    const userId = (req as any).user.id;
    const user = usersStore.find((u) => u.id === userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    res.json({ success: true, data: user });
  });

  // Plots Endpoints
  const syncPlotsStatus = () => {
    const now = new Date();
    plotsStore.forEach((p) => {
      if (p.status === 'reserved' && p.burial_date) {
        const bDate = new Date(p.burial_date);
        if (!isNaN(bDate.getTime()) && bDate <= now) {
          p.status = 'occupied';
          p.current_occupants = Math.max(1, p.current_occupants || 1);
        }
      }
    });
  };

  app.get('/api/plots', (req, res) => {
    syncPlotsStatus();
    let result = [...plotsStore];
    const { section, lot_type, status, search, minPrice, maxPrice, page = 1, limit = 100 } = req.query;

    if (section) {
      result = result.filter((p) => p.section === String(section).toUpperCase());
    }
    if (lot_type) {
      result = result.filter((p) => p.lot_type === String(lot_type));
    }
    if (status) {
      result = result.filter((p) => p.status === String(status));
    }
    if (minPrice) {
      result = result.filter((p) => (p.price || 0) >= Number(minPrice));
    }
    if (maxPrice) {
      result = result.filter((p) => (p.price || 0) <= Number(maxPrice));
    }
    if (search) {
      const q = String(search).toLowerCase();
      result = result.filter((p) => p.plot_number.toLowerCase().includes(q) || (p.notes && p.notes.toLowerCase().includes(q)));
    }

    const pageNum = Number(page);
    const limitNum = Math.min(Number(limit), 10000);
    const total = result.length;
    const totalPages = Math.ceil(total / limitNum) || 1;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = result.slice(startIndex, startIndex + limitNum);

    res.json({
      success: true,
      data: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    });
  });

  app.get('/api/plots/:id', (req, res) => {
    syncPlotsStatus();
    const plot = plotsStore.find((p) => p.id === req.params.id || p.plot_number === req.params.id);
    if (!plot) {
      res.status(404).json({ success: false, error: 'Plot not found' });
      return;
    }
    res.json({ success: true, data: plot });
  });

  app.post('/api/plots', authenticateToken, (req, res) => {
    const { id, plot_number, section, lot_type, capacity, price, status = 'available', lat, lng, notes, width, height, rotation, cemetery_id } = req.body;
    if (!plot_number || !section || !lot_type) {
      res.status(400).json({ success: false, error: 'plot_number, section, lot_type are required' });
      return;
    }

    const newPlot: Plot = {
      id: id || `plot-${Date.now()}`,
      plot_number,
      section,
      lot_type,
      capacity: capacity || (lot_type === 'single' ? 1 : lot_type === 'family' ? 4 : 8),
      current_occupants: 0,
      status,
      price: price || 15000,
      lat: lat || 14.6720,
      lng: lng || 121.0410,
      width,
      height,
      rotation,
      cemetery_id,
      nearest_path_node_id: 'node-1',
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    plotsStore.push(newPlot);
    logActivity('CREATE_PLOT', 'Plots', `Created plot ${newPlot.plot_number} in Section ${newPlot.section}`, req);
    res.json({ success: true, data: newPlot });
  });

  app.put('/api/plots/:id', authenticateToken, (req, res) => {
    const index = plotsStore.findIndex((p) => p.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ success: false, error: 'Plot not found' });
      return;
    }
    plotsStore[index] = {
      ...plotsStore[index]!,
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    logActivity('UPDATE_PLOT', 'Plots', `Updated plot ${plotsStore[index]!.plot_number} status/data`, req);
    res.json({ success: true, data: plotsStore[index] });
  });

  app.delete('/api/plots/:id', authenticateToken, (req, res) => {
    const index = plotsStore.findIndex((p) => p.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ success: false, error: 'Plot not found' });
      return;
    }
    const deletedPlot = plotsStore[index]!;
    plotsStore.splice(index, 1);
    logActivity('DELETE_PLOT', 'Plots', `Deleted plot ${deletedPlot.plot_number} from Section ${deletedPlot.section}`, req);
    res.json({ success: true, data: deletedPlot });
  });

  // Clients Endpoints
  app.get('/api/clients', authenticateToken, (req, res) => {
    res.json({ success: true, data: clientsStore });
  });

  app.post('/api/clients', authenticateToken, (req, res) => {
    const { full_name, contact_number, email, address, id_number, id_type } = req.body;
    if (!full_name || !contact_number) {
      res.status(400).json({ success: false, error: 'Full name and contact number required' });
      return;
    }
    const newClient: Client = {
      id: `cli-${Date.now()}`,
      full_name,
      contact_number,
      email,
      address,
      id_number,
      id_type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    clientsStore.unshift(newClient);
    logActivity('CREATE_CLIENT', 'Clients', `Added client ${newClient.full_name}`, req);
    res.json({ success: true, data: newClient });
  });

  // Contracts Endpoints
  app.get('/api/contracts', authenticateToken, (req, res) => {
    const populated = contractsStore.map((c, idx) => {
      if (!c.contract_number) {
        c.contract_number = `HMC-2026-${1000 + idx}`;
      }
      return {
        ...c,
        client: clientsStore.find((cli) => cli.id === c.client_id),
        plot: plotsStore.find((p) => p.id === c.plot_id),
      };
    });
    res.json({ success: true, data: populated });
  });

  app.post('/api/contracts', authenticateToken, (req, res) => {
    const { client_id, plot_id, contract_type, total_amount, payment_type, death_certificate_number } = req.body;
    if (!client_id || !plot_id || !contract_type) {
      res.status(400).json({ success: false, error: 'client_id, plot_id, contract_type required' });
      return;
    }

    const newContract: Contract = {
      id: `ctr-${Date.now()}`,
      contract_number: `HMC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      client_id,
      plot_id,
      contract_date: new Date().toISOString().split('T')[0]!,
      contract_type,
      commencement_date: new Date().toISOString().split('T')[0]!,
      expiration_date: new Date(Date.now() + 30 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!,
      total_amount: total_amount || 15000,
      payment_type: payment_type || 'cash',
      status: 'active',
      prepared_by: (req as any).user?.id,
      death_certificate_number,
      createdAt: new Date().toISOString(),
    };

    contractsStore.unshift(newContract);

    // Update Plot Status to reserved or occupied
    const plot = plotsStore.find((p) => p.id === plot_id);
    if (plot) {
      plot.status = 'reserved';
    }

    logActivity('CREATE_CONTRACT', 'Contracts', `Created contract ${newContract.id} for plot ${plot?.plot_number}`, req);
    res.json({ success: true, data: newContract });
  });

  app.put('/api/contracts/:id', authenticateToken, (req, res) => {
    const index = contractsStore.findIndex((c) => c.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ success: false, error: 'Contract not found' });
      return;
    }
    contractsStore[index] = { ...contractsStore[index]!, ...req.body };
    logActivity('UPDATE_CONTRACT', 'Contracts', `Updated contract ${req.params.id} status to ${req.body.status}`, req);
    res.json({ success: true, data: contractsStore[index] });
  });

  app.delete('/api/contracts/:id', authenticateToken, (req, res) => {
    const index = contractsStore.findIndex((c) => c.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ success: false, error: 'Contract not found' });
      return;
    }
    const contract = contractsStore[index]!;
    contractsStore.splice(index, 1);
    logActivity('DELETE_CONTRACT', 'Contracts', `Deleted contract ${contract.contract_number || contract.id}`, req);
    res.json({ success: true });
  });

  // Payments Endpoints
  app.get('/api/payments', authenticateToken, (req, res) => {
    const populated = paymentsStore.map((p) => ({
      ...p,
      contract: contractsStore.find((c) => c.id === p.contract_id),
    }));
    res.json({ success: true, data: populated });
  });

  app.post('/api/payments', authenticateToken, (req, res) => {
    const { contract_id, amount, payment_method, receipt_number, notes } = req.body;
    if (!contract_id || !amount) {
      res.status(400).json({ success: false, error: 'contract_id and amount required' });
      return;
    }

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      contract_id,
      amount: Number(amount),
      payment_date: new Date().toISOString().split('T')[0]!,
      payment_method: payment_method || 'cash',
      receipt_number: receipt_number || `OR-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      collected_by: (req as any).user?.id,
      notes,
      createdAt: new Date().toISOString(),
    };

    paymentsStore.unshift(newPayment);
    logActivity('LOG_PAYMENT', 'Payments', `Logged payment of ₱${amount} (OR: ${newPayment.receipt_number})`, req);
    res.json({ success: true, data: newPayment });
  });

  app.put('/api/payments/:id', authenticateToken, (req, res) => {
    const index = paymentsStore.findIndex((p) => p.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ success: false, error: 'Payment not found' });
      return;
    }
    const { amount, payment_method, receipt_number, notes } = req.body;
    paymentsStore[index] = {
      ...paymentsStore[index]!,
      amount: amount !== undefined ? Number(amount) : paymentsStore[index]!.amount,
      payment_method: payment_method || paymentsStore[index]!.payment_method,
      receipt_number: receipt_number || paymentsStore[index]!.receipt_number,
      notes: notes !== undefined ? notes : paymentsStore[index]!.notes,
    };
    logActivity('UPDATE_PAYMENT', 'Payments', `Updated payment ${req.params.id}`, req);
    res.json({ success: true, data: paymentsStore[index] });
  });

  app.delete('/api/payments/:id', authenticateToken, (req, res) => {
    const index = paymentsStore.findIndex((p) => p.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ success: false, error: 'Payment not found' });
      return;
    }
    const payment = paymentsStore[index]!;
    paymentsStore.splice(index, 1);
    logActivity('DELETE_PAYMENT', 'Payments', `Deleted payment record ${payment.receipt_number || payment.id}`, req);
    res.json({ success: true });
  });

  // Inquiries Endpoints
  app.get('/api/inquiries', (req, res) => {
    const populated = inquiriesStore.map((i) => {
      const client = clientsStore.find((c) => c.id === i.client_id);
      return {
        ...i,
        full_name: i.full_name || client?.full_name || '',
        contact_number: i.contact_number || client?.contact_number || '',
        email: i.email || client?.email || '',
        client,
        plot: plotsStore.find((p) => p.id === i.plot_id),
      };
    });
    res.json({ success: true, data: populated });
  });

  app.post('/api/inquiries', (req, res) => {
    const { full_name, contact_number, email, plot_id, message, requested_burial_date, deceased_name } = req.body;
    if (!full_name || !contact_number) {
      res.status(400).json({ success: false, error: 'Full name and contact number required' });
      return;
    }

    // Find or create client
    let client = clientsStore.find((c) => c.contact_number === contact_number || (email && c.email === email));
    if (!client) {
      client = {
        id: `cli-${Date.now()}`,
        full_name,
        contact_number,
        email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      clientsStore.unshift(client);
    }

    const newInquiry: Inquiry = {
      id: `inq-${Date.now()}`,
      client_id: client.id,
      full_name,
      contact_number,
      email,
      plot_id,
      inquiry_date: new Date().toISOString().split('T')[0]!,
      requested_burial_date,
      deceased_name,
      message,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    inquiriesStore.unshift(newInquiry);
    logActivity('SUBMIT_INQUIRY', 'Inquiries', `Public inquiry submitted by ${client.full_name}`);
    res.json({ success: true, data: newInquiry });
  });

  const handleInquiryStatusUpdate = (inquiryId: string, updateData: any, userId?: string) => {
    const index = inquiriesStore.findIndex((i) => i.id === inquiryId);
    if (index === -1) return null;

    const currentInquiry = inquiriesStore[index]!;
    const updatedInquiry = {
      ...currentInquiry,
      ...updateData,
      processed_by: userId || currentInquiry.processed_by,
      processed_at: new Date().toISOString(),
    };

    inquiriesStore[index] = updatedInquiry;

    // If RCC approved the inquiry, reserve the plot automatically!
    if (updateData.status === 'approved') {
      const plotId = updateData.plot_id || currentInquiry.plot_id;
      let targetPlot = plotsStore.find((p) => p.id === plotId);

      if (!targetPlot && currentInquiry.message) {
        // Try extracting plot_number from message
        const match = currentInquiry.message.match(/Lot\s*#?([A-Z0-9-]+)/i);
        if (match && match[1]) {
          const plotNum = match[1]!;
          targetPlot = plotsStore.find((p) => p.plot_number.toLowerCase() === plotNum.toLowerCase());
        }
      }

      if (targetPlot) {
        targetPlot.status = 'reserved';
        const client = clientsStore.find((c) => c.id === currentInquiry.client_id);
        
        // Determine burial date
        let bDateStr = updateData.burial_date || currentInquiry.requested_burial_date;
        if (!bDateStr) {
          const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days in future
          future.setHours(10, 0, 0, 0);
          bDateStr = future.toISOString();
        }

        targetPlot.burial_date = bDateStr;
        targetPlot.burial_time = '10:00 AM';
        targetPlot.inquirer_name = client?.full_name || currentInquiry.full_name || 'Inquirer';
        if (currentInquiry.deceased_name || updateData.deceased_name) {
          targetPlot.deceased_name = currentInquiry.deceased_name || updateData.deceased_name;
        }

        syncPlotsStatus();
      }
    }

    return updatedInquiry;
  };

  app.put('/api/inquiries/:id', authenticateToken, (req, res) => {
    const userId = (req as any).user?.id;
    const updated = handleInquiryStatusUpdate(req.params.id, req.body, userId);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Inquiry not found' });
      return;
    }
    logActivity('UPDATE_INQUIRY', 'Inquiries', `Updated inquiry ${req.params.id} status to ${req.body.status}`, req);
    res.json({ success: true, data: updated });
  });

  app.patch('/api/inquiries/:id', authenticateToken, (req, res) => {
    const userId = (req as any).user?.id;
    const updated = handleInquiryStatusUpdate(req.params.id, req.body, userId);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Inquiry not found' });
      return;
    }
    logActivity('UPDATE_INQUIRY', 'Inquiries', `Patched inquiry ${req.params.id} status to ${req.body.status}`, req);
    res.json({ success: true, data: updated });
  });

  app.delete('/api/inquiries/:id', authenticateToken, (req, res) => {
    const index = inquiriesStore.findIndex((i) => i.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ success: false, error: 'Inquiry not found' });
      return;
    }
    const inquiry = inquiriesStore[index]!;
    inquiriesStore.splice(index, 1);
    const client = clientsStore.find((c) => c.id === inquiry.client_id);
    const inquirerName = inquiry.full_name || client?.full_name || 'Inquirer';
    logActivity('DELETE_INQUIRY', 'Inquiries', `Deleted inquiry from ${inquirerName}`, req);
    res.json({ success: true });
  });

  // Burials Endpoints
  app.get('/api/burials', authenticateToken, (req, res) => {
    const populated = burialsStore.map((b) => ({
      ...b,
      plot: plotsStore.find((p) => p.id === b.plot_id),
      contract: contractsStore.find((c) => c.id === b.contract_id),
    }));
    res.json({ success: true, data: populated });
  });

  app.post('/api/burials', authenticateToken, (req, res) => {
    const { plot_id, contract_id, deceased_name, date_of_birth, date_of_death, burial_date, notes } = req.body;
    if (!plot_id || !deceased_name || !burial_date) {
      res.status(400).json({ success: false, error: 'plot_id, deceased_name, and burial_date required' });
      return;
    }

    const newBurial: Burial = {
      id: `bur-${Date.now()}`,
      plot_id,
      contract_id: contract_id || 'ctr-1',
      deceased_name,
      date_of_birth,
      date_of_death,
      burial_date,
      burial_status: 'scheduled',
      scheduled_by: (req as any).user?.id,
      notes,
      createdAt: new Date().toISOString(),
    };

    burialsStore.unshift(newBurial);

    // Update Plot Status & occupants
    const plot = plotsStore.find((p) => p.id === plot_id);
    if (plot) {
      plot.current_occupants += 1;
      if (plot.current_occupants >= plot.capacity) {
        plot.status = 'full';
      } else {
        plot.status = 'occupied';
      }
    }

    logActivity('SCHEDULE_BURIAL', 'Burials', `Scheduled burial for ${deceased_name} in Plot ${plot?.plot_number}`, req);
    res.json({ success: true, data: newBurial });
  });

  app.put('/api/burials/:id', authenticateToken, (req, res) => {
    const index = burialsStore.findIndex((b) => b.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ success: false, error: 'Burial record not found' });
      return;
    }
    burialsStore[index] = { ...burialsStore[index]!, ...req.body };
    logActivity('UPDATE_BURIAL', 'Burials', `Updated burial record ${req.params.id}`, req);
    res.json({ success: true, data: burialsStore[index] });
  });

  app.delete('/api/burials/:id', authenticateToken, (req, res) => {
    const index = burialsStore.findIndex((b) => b.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ success: false, error: 'Burial record not found' });
      return;
    }
    const burial = burialsStore[index]!;
    const plot = plotsStore.find((p) => p.id === burial.plot_id);
    if (plot) {
      plot.current_occupants = Math.max(0, plot.current_occupants - 1);
      if (plot.current_occupants === 0) {
        plot.status = 'available';
      } else {
        plot.status = 'occupied';
      }
    }
    burialsStore.splice(index, 1);
    logActivity('DELETE_BURIAL', 'Burials', `Deleted burial record for ${burial.deceased_name}`, req);
    res.json({ success: true });
  });

  // A* Pathfinding Endpoint
  app.get('/api/pathfinding/find-path', (req, res) => {
    const { from, to } = req.query;
    if (!from || !to) {
      res.status(400).json({ success: false, error: '`from` and `to` node IDs required' });
      return;
    }

    const result = findAStarPath(String(from), String(to));
    res.json({ success: true, data: result });
  });

  app.get('/api/pathfinding/nodes', (req, res) => {
    res.json({ success: true, data: pathNodesStore });
  });

  app.get('/api/pathfinding/edges', (req, res) => {
    res.json({ success: true, data: pathEdgesStore });
  });

  // Dashboard Aggregated Analytics Endpoint
  app.get('/api/dashboard', authenticateToken, (req, res) => {
    const totalPlots = plotsStore.length;
    const availablePlots = plotsStore.filter((p) => p.status === 'available').length;
    const reservedPlots = plotsStore.filter((p) => p.status === 'reserved').length;
    const occupiedPlots = plotsStore.filter((p) => p.status === 'occupied' || p.status === 'full').length;
    const totalRevenue = paymentsStore.reduce((acc, p) => acc + (p.amount || 0), 0);

    const pendingInquiries = inquiriesStore.filter((i) => i.status === 'pending').length;
    const activeContracts = contractsStore.filter((c) => c.status === 'active').length;
    const completedBurials = burialsStore.filter((b) => b.burial_status === 'completed').length;
    const scheduledBurials = burialsStore.filter((b) => b.burial_status === 'scheduled').length;

    const occupancyRate = totalPlots ? Math.round(((reservedPlots + occupiedPlots) / totalPlots) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalPlots,
        availablePlots,
        reservedPlots,
        occupiedPlots,
        occupancyRate,
        totalRevenue,
        pendingInquiries,
        activeContracts,
        completedBurials,
        scheduledBurials,
        recentActivity: activityLogsStore.slice(0, 10),
      },
    });
  });

  // Audit Logs Endpoint
  app.get('/api/audit', authenticateToken, (req, res) => {
    res.json({ success: true, data: activityLogsStore });
  });

  // Users Management Endpoint (super_admin)
  app.get('/api/users', authenticateToken, (req, res) => {
    res.json({ success: true, data: usersStore });
  });

  app.post('/api/users', authenticateToken, (req, res) => {
    const { email, full_name, role, department, phone, address } = req.body;
    if (!email || !full_name || !role) {
      res.status(400).json({ success: false, error: 'Email, full_name, role required' });
      return;
    }
    const newUser: User = {
      id: `usr-${Date.now()}`,
      email,
      full_name,
      role,
      is_active: true,
      department: department || undefined,
      phone: phone || undefined,
      address: address || undefined,
      createdAt: new Date().toISOString(),
    };
    usersStore.push(newUser);
    logActivity('CREATE_USER', 'Users', `Super Admin created user ${email} (${role})`, req);
    res.json({ success: true, data: newUser });
  });

  // Map Usage Statistics Store & Endpoints
  let mapUsageCount = 15842;

  app.get('/api/stats/map-usage', (req, res) => {
    res.json({ success: true, count: mapUsageCount });
  });

  app.post('/api/stats/map-usage/increment', (req, res) => {
    mapUsageCount += 1;
    logActivity('MAP_USAGE', 'Map', `Worldwide map usage counter incremented to ${mapUsageCount}`, req);
    res.json({ success: true, count: mapUsageCount });
  });

  // Cemetery Map Endpoint
  app.get('/api/cemetery-map', (req, res) => {
    res.json({ success: true, data: cemeteryMapStore });
  });

  app.post('/api/cemetery-map', authenticateToken, (req, res) => {
    const { name, description, boundary_data } = req.body;
    cemeteryMapStore = {
      id: `map-${Date.now()}`,
      name: name || cemeteryMapStore.name,
      description: description || cemeteryMapStore.description,
      boundary_data: boundary_data || cemeteryMapStore.boundary_data,
      created_by: (req as any).user?.id,
      createdAt: new Date().toISOString(),
    };
    logActivity('UPDATE_MAP', 'Map', 'Updated Himlayan Cemetery boundary map GeoJSON.', req);
    res.json({ success: true, data: cemeteryMapStore });
  });

  // Server-side Gemini Chat Endpoint (@google/genai)
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({
          success: false,
          error: 'GEMINI_API_KEY environment variable is not configured.',
        });
        return;
      }

      const { message, history = [] } = req.body;
      if (!message) {
        res.status(400).json({ success: false, error: 'Message is required' });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const chat = ai.chats.create({
        model: 'gemini-3.5-flash',
        config: {
          systemInstruction: `You are the empathetic, polite, and authoritative AI Concierge & Guide for Himlayan Memorial Park.
You assist visitors, families, and administrative staff with information about:
- Plot Availability: Sections A, B, C, and D (Single Lawn Lots ₱15,000, Family Mausoleum Lots ₱35,000, Garden Apartment Terraces ₱60,000).
- Visiting Hours: 6:00 AM - 6:00 PM Daily.
- Directions & Pathfinding: Main Gate Avenue, Chapel, Fountain Plaza, and navigation paths.
- Booking & Inquiries: Submitting public inquiry requests, contract requirements, death certificate submissions, installment payments.
Provide clear, warm, dignified, and succinct responses.`,
        },
      });

      const response = await chat.sendMessage({ message });
      const replyText = response.text || 'I am here to assist you with any inquiries regarding Himlayan Memorial Park.';

      res.json({
        success: true,
        data: {
          reply: replyText,
        },
      });
    } catch (err: any) {
      console.error('Gemini Chat Error:', err);
      res.status(500).json({
        success: false,
        error: err?.message || 'Failed to generate response from Gemini AI',
      });
    }
  });

  // Server-side Gemini Image Analyzer Endpoint
  app.post('/api/gemini/analyze-image', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({
          success: false,
          error: 'GEMINI_API_KEY environment variable is not configured.',
        });
        return;
      }

      const { imageBase64, mimeType = 'image/jpeg', prompt } = req.body;
      if (!imageBase64) {
        res.status(400).json({ success: false, error: 'imageBase64 is required' });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const imagePart = {
        inlineData: {
          mimeType,
          data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
        },
      };

      const textPart = {
        text: prompt || 'Analyze this photo of a cemetery plot, monument, headstone, or document. Identify any visible text, condition assessment, section indicators, or notable details for Himlayan Memorial records.',
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: { parts: [imagePart, textPart] },
      });

      res.json({
        success: true,
        data: {
          analysis: response.text || 'Image analyzed successfully.',
        },
      });
    } catch (err: any) {
      console.error('Gemini Image Analysis Error:', err);
      res.status(500).json({
        success: false,
        error: err?.message || 'Failed to analyze image with Gemini AI',
      });
    }
  });

  // Vite Middleware in Development mode, Static in Production mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Himlayan Cemetery Management System running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
