/**
 * Utility functions for converting between Frontend and Backend warehouse formats
 */

export interface BackendWarehouse {
  _id: string;
  name: string;
  type: 'MAIN' | 'SUB';
  status: 'ACTIVE' | 'INACTIVE';
  assignedBranches: Array<{
    _id: string;
    name: string;
    code?: string;
  }>;
  managerUserId?: {
    _id: string;
    fullName: string;
    email?: string;
    role?: string;
  };
  isShared?: boolean;
  itemCount?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface FrontendWarehouse {
  id: string;
  name: string;
  type: 'main' | 'sub';
  assignedBranches: Array<{
    id: string;
    name: string;
    code?: string;
  }>;
  manager?: {
    id: string;
    fullName: string;
    email?: string;
    role?: string;
  };
  status: 'active' | 'inactive';
  isShared?: boolean;
  itemCount?: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface BackendBranch {
  _id: string;
  name: string;
  code?: string;
}

export interface FrontendBranch {
  id: string;
  name: string;
  code?: string;
}

export interface BackendUser {
  _id: string;
  fullName: string;
  email?: string;
  role?: string;
}

export interface FrontendUser {
  id: string;
  fullName: string;
  email?: string;
  role?: string;
}

/**
 * Convert backend warehouse format to frontend format
 */
export function convertBackendWarehouseToFrontend(backend: BackendWarehouse): FrontendWarehouse {
  return {
    id: backend._id,
    name: backend.name,
    type: backend.type.toLowerCase() as 'main' | 'sub',
    status: backend.status.toLowerCase() as 'active' | 'inactive',
    assignedBranches: backend.assignedBranches.map(branch => ({
      id: branch._id,
      name: branch.name,
      code: branch.code,
    })),
    manager: backend.managerUserId ? {
      id: backend.managerUserId._id,
      fullName: backend.managerUserId.fullName,
      email: backend.managerUserId.email,
      role: backend.managerUserId.role,
    } : undefined,
    isShared: backend.isShared || false,
    itemCount: backend.itemCount || 0,
    createdAt: new Date(backend.created_at),
    updatedAt: backend.updated_at ? new Date(backend.updated_at) : undefined,
  };
}

/**
 * Convert frontend warehouse format to backend format
 */
export function convertFrontendWarehouseToBackend(frontend: {
  name: string;
  type: 'main' | 'sub';
  status: 'active' | 'inactive';
  assignedBranches: string[];
  managerId?: string;
  isShared?: boolean;
}): {
  name: string;
  type: 'MAIN' | 'SUB';
  status: 'ACTIVE' | 'INACTIVE';
  assignedBranches: string[];
  managerUserId?: string;
  isShared?: boolean;
} {
  return {
    name: frontend.name,
    type: frontend.type.toUpperCase() as 'MAIN' | 'SUB',
    status: frontend.status.toUpperCase() as 'ACTIVE' | 'INACTIVE',
    assignedBranches: frontend.assignedBranches,
    managerUserId: frontend.managerId && frontend.managerId !== 'none' ? frontend.managerId : undefined,
    isShared: frontend.isShared || false,
  };
}

/**
 * Convert backend branch format to frontend format
 */
export function convertBackendBranchToFrontend(backend: BackendBranch): FrontendBranch {
  return {
    id: backend._id,
    name: backend.name,
    code: backend.code,
  };
}

/**
 * Convert backend user format to frontend format
 */
export function convertBackendUserToFrontend(backend: BackendUser): FrontendUser {
  return {
    id: backend._id,
    fullName: backend.fullName,
    email: backend.email,
    role: backend.role,
  };
}
