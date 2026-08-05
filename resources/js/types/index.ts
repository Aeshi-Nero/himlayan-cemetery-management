export type UserRole = 'super_admin' | 'rcc' | 'engineer';

export type PlotStatus = 'available' | 'reserved' | 'occupied' | 'full';

export type LotType = 'single' | 'family' | 'apartment' | 'path' | 'border' | 'entrance';

export type ContractType = 'new' | 'renewal';

export type PaymentType = 'cash' | 'installment';

export type ContractStatus =
  | 'draft'
  | 'permit_issued'
  | 'rental_computed'
  | 'paid'
  | 'pending_approval'
  | 'approved'
  | 'released'
  | 'active'
  | 'completed'
  | 'cancelled';

export type InquiryStatus = 'pending' | 'contacted' | 'approved' | 'rejected' | 'completed' | 'closed';

export type BurialStatus = 'scheduled' | 'completed' | 'cancelled';

export type PaymentMethod = 'cash' | 'installment';

export type NotificationType = 'renewal' | 'approval' | 'rejection';

export type OrdinancePeriod = 'pre_2002' | '2002_2013' | '2013_present';

export type InstallmentStatus = 'unpaid' | 'partial' | 'paid' | 'overdue';

export type PermitStatus = 'issued' | 'used' | 'cancelled';

export type PlanType = 'burial' | 'funeral' | 'memorial';

export type NicheStatus = 'available' | 'reserved' | 'occupied';

export type UserNotificationType = 'burial_reminder' | 'installment_due' | 'overdue' | 'system';

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
    createdAt?: string;
    updatedAt?: string;
    created_at?: string;
    updated_at?: string;
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
    created_at?: string;
    updated_at?: string;
}

export interface Plot {
    id: string;
    plot_number: string;
    name?: string;
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
    created_at?: string;
    updated_at?: string;
}

export interface PathNode {
    id: string;
    lat: number;
    lng: number;
    node_label?: string;
    is_accessible: boolean;
}

export interface PlotConnection {
    id: string;
    cemetery_id?: string;
    from_plot_id: string;
    to_plot_id: string;
    from_plot?: Plot;
    to_plot?: Plot;
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
    pre_need_plan_id?: string;
    pre_need_plan?: PreNeedPlan;
    columbary_niche_id?: string;
    columbary_niche?: ColumbaryNiche;
    contract_date: string;
    contract_type: ContractType;
    commencement_date?: string;
    expiration_date?: string;
    total_amount: number;
    payment_type: PaymentType;
    ordinance_period?: OrdinancePeriod;
    lot_type?: 'individual' | 'family';
    lot_area?: number;
    dimension?: string;
    status: ContractStatus;
    prepared_by?: string;
    approved_by_superadmin_at?: string;
    death_certificate_number?: string;
    af_51_number?: string;
    af_51_date?: string;
    approved_by_treasurer_at?: string;
    approved_by_mayor_at?: string;
    installment_schedules?: InstallmentSchedule[];
    payments?: Payment[];
    burials?: Burial[];
    burial_permits?: BurialPermit[];
    createdAt: string;
    created_at?: string;
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
    created_at?: string;
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
    approved_at?: string;
    notes?: string;
    createdAt: string;
    created_at?: string;
}

export interface Payment {
    id: string;
    contract_id: string;
    contract?: Contract;
    amount: number;
    payment_date: string;
    payment_method: PaymentMethod;
    receipt_number?: string;
    af_51_number?: string;
    collected_by?: string;
    notes?: string;
    createdAt: string;
    created_at?: string;
}

export interface InstallmentSchedule {
    id: string;
    contract_id: string;
    contract?: Contract;
    due_date: string;
    amount_due: number;
    amount_paid: number;
    status: InstallmentStatus;
    paid_at?: string;
    createdAt: string;
    created_at?: string;
}

export interface BurialPermit {
    id: string;
    contract_id: string;
    contract?: Contract;
    permit_number?: string;
    deceased_name: string;
    date_of_birth?: string;
    date_of_death: string;
    death_certificate_number?: string;
    burial_permit_fee: number;
    status: PermitStatus;
    issued_by?: string | User;
    issued_by_user?: User;
    issued_at?: string;
    notes?: string;
    createdAt: string;
    created_at?: string;
}

export interface PreNeedPlan {
    id: string;
    name: string;
    slug: string;
    type: PlanType;
    description?: string;
    features?: string[];
    price: number;
    image?: string;
    is_active: boolean;
    createdAt: string;
    created_at?: string;
}

export interface ColumbaryNiche {
    id: string;
    niche_number: string;
    section?: string;
    row?: string;
    tier?: string;
    status: NicheStatus;
    price: number;
    map_x?: number;
    map_y?: number;
    notes?: string;
    createdAt: string;
    created_at?: string;
}

export interface ClientFeedback {
    id: string;
    client_id: string;
    client?: Client;
    contract_id?: string;
    contract?: Contract;
    rating: number;
    comments?: string;
    status: 'pending' | 'submitted';
    submitted_at?: string;
    createdAt: string;
    created_at?: string;
}

export interface SentClientNotification {
    id: string;
    client_id: string;
    client?: Client;
    type: string;
    channel: 'database' | 'mail';
    subject: string;
    body?: string;
    reference_type?: string;
    reference_id?: string;
    status: 'sent' | 'failed';
    response?: string;
    createdAt: string;
    created_at?: string;
}

export interface UserNotification {
    id: string;
    user_id?: string;
    type: UserNotificationType;
    title: string;
    body?: string;
    link?: string;
    is_read: boolean;
    scheduled_at?: string;
    createdAt: string;
    created_at?: string;
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
    created_at?: string;
}

export interface CemeteryMap {
    id: string;
    name: string;
    description?: string;
    boundary_data: any;
    created_by?: string;
    createdAt: string;
    created_at?: string;
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
    totalDistance: number;
    nodesVisited: number;
}

export interface DashboardStats {
    totalPlots: number;
    availablePlots: number;
    reservedPlots: number;
    occupiedPlots: number;
    occupancyRate: number;
    totalRevenue: number;
    pendingInquiries: number;
    activeContracts: number;
    completedBurials: number;
    scheduledBurials: number;
    recentActivity: ActivityLog[];
}
