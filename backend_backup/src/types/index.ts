import { Request } from 'express';
import { UserRole } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  database: string;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

export interface PathNode {
  id: string;
  lat: number;
  lng: number;
  nodeLabel: string | null;
  isAccessible: boolean;
}

export interface PathEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  distanceWeight: number;
  pathwayName: string | null;
}

export interface PathResult {
  path: PathNode[];
  totalDistance: number;
  edges: PathEdge[];
}