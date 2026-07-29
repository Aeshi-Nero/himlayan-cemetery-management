export type UserRole = 'super_admin' | 'rcc' | 'engineer' | 'staff';

export type PlotStatus = 'available' | 'reserved' | 'occupied' | 'full';

export type LotType = 'single' | 'family' | 'apartment' | 'path' | 'border' | 'entrance';

export type ContractType = 'new' | 'renewal';

export type PaymentType = 'cash' | 'installment';

export type ContractStatus = 'active' | 'completed' | 'cancelled';

export type InquiryStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export type BurialStatus = 'scheduled' | 'completed' | 'cancelled';

export type PaymentMethod = 'cash' | 'installment';

export type NotificationType = 'renewal' | 'approval' | 'rejection';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  avatar?: string;
  department?: string;
  phone?: string;
  address?: string;
  is_new_account?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Client {
  id: string;
  full_name: string;
  contact_number: string;
  email?: string;
  address?: string;
  id_number?: string;
  id_type?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Plot {
  id: string;
  plot_number: string;
  section: string;
  lat?: number;
  lng?: number;
  lot_type: LotType;
  capacity: number;
  current_occupants: number;
  status: PlotStatus;
  price?: number;
  nearest_path_node_id?: string;
  notes?: string;
  width?: number;
  height?: number;
  rotation?: number;
  color?: string;
  cemetery_id?: string;
  deceased_names?: string[];
  burial_date?: string;
  burial_time?: string;
  inquirer_name?: string;
  deceased_name?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PathNode {
  id: string;
  lat: number;
  lng: number;
  node_label?: string;
  is_accessible: boolean;
}

export interface PathEdge {
  id: string;
  from_node_id: string;
  to_node_id: string;
  distance_weight: number;
  pathway_name?: string;
}

export interface Contract {
  id: string;
  contract_number?: string;
  amount_paid?: number;
  balance_remaining?: number;
  client_id: string;
  client?: Client;
  plot_id: string;
  plot?: Plot;
  contract_date: string;
  contract_type: ContractType;
  commencement_date?: string;
  expiration_date?: string;
  total_amount: number;
  payment_type: PaymentType;
  status: ContractStatus;
  prepared_by?: string;
  approved_by_superadmin_at?: string;
  death_certificate_number?: string;
  createdAt: string;
}

export interface Inquiry {
  id: string;
  client_id: string;
  client?: Client;
  full_name?: string;
  contact_number?: string;
  email?: string;
  plot_id?: string;
  plot?: Plot;
  inquiry_date: string;
  requested_burial_date?: string;
  deceased_name?: string;
  message?: string;
  status: InquiryStatus;
  processed_by?: string;
  processed_at?: string;
  createdAt: string;
}

export interface Burial {
  id: string;
  plot_id: string;
  plot?: Plot;
  contract_id: string;
  contract?: Contract;
  deceased_name: string;
  date_of_birth?: string;
  date_of_death: string;
  burial_date: string;
  burial_status: BurialStatus;
  scheduled_by?: string;
  notes?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  contract_id: string;
  contract?: Contract;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  receipt_number?: string;
  collected_by?: string;
  notes?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  module: string;
  description: string;
  ip_address?: string;
  createdAt: string;
}

export interface CemeteryMap {
  id: string;
  name: string;
  description?: string;
  boundary_data: any; // GeoJSON
  created_by?: string;
  createdAt: string;
}

export interface PathStep {
  nodeId: string;
  lat: number;
  lng: number;
  label?: string;
  distanceFromPrevious: number;
}

export interface PathFindingResult {
  path: PathStep[];
  totalDistance: number; // in meters
  nodesVisited: number;
}
