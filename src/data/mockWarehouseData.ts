// Mock data for warehouses, branches, and users
// This simulates API responses for frontend-only implementation

export interface Branch {
  id: string;
  name: string;
  code?: string;
}

export interface User {
  id: string;
  fullName: string;
  email?: string;
  role?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  type: 'main' | 'sub';
  assignedBranches: Branch[];
  manager?: User;
  status: 'active' | 'inactive';
  isShared?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// Mock branches data
export const mockBranches: Branch[] = [
  { id: '1', name: 'Main Clinic - Downtown', code: 'MC-DT' },
  { id: '2', name: 'Branch Clinic - North', code: 'BC-N' },
  { id: '3', name: 'Branch Clinic - South', code: 'BC-S' },
  { id: '4', name: 'Branch Clinic - East', code: 'BC-E' },
  { id: '5', name: 'Branch Clinic - West', code: 'BC-W' },
  { id: '6', name: 'Emergency Clinic', code: 'EC' },
];

// Mock users data (for warehouse managers)
export const mockUsers: User[] = [
  { id: '1', fullName: 'John Smith', email: 'john.smith@clinic.com', role: 'Warehouse Manager' },
  { id: '2', fullName: 'Sarah Johnson', email: 'sarah.j@clinic.com', role: 'Inventory Supervisor' },
  { id: '3', fullName: 'Michael Brown', email: 'michael.b@clinic.com', role: 'Warehouse Manager' },
  { id: '4', fullName: 'Emily Davis', email: 'emily.d@clinic.com', role: 'Logistics Coordinator' },
  { id: '5', fullName: 'David Wilson', email: 'david.w@clinic.com', role: 'Warehouse Manager' },
];

// Mock warehouses data
export const mockWarehouses: Warehouse[] = [
  {
    id: '1',
    name: 'Main Warehouse - Central',
    type: 'main',
    assignedBranches: [mockBranches[0], mockBranches[1], mockBranches[2]],
    manager: mockUsers[0],
    status: 'active',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Sub Warehouse - North Branch',
    type: 'sub',
    assignedBranches: [mockBranches[1]],
    manager: mockUsers[1],
    status: 'active',
    createdAt: new Date('2024-02-20'),
  },
  {
    id: '3',
    name: 'Sub Warehouse - South Branch',
    type: 'sub',
    assignedBranches: [mockBranches[2], mockBranches[3]],
    manager: mockUsers[2],
    status: 'active',
    createdAt: new Date('2024-03-10'),
  },
  {
    id: '4',
    name: 'Emergency Warehouse',
    type: 'sub',
    assignedBranches: [mockBranches[5]],
    manager: mockUsers[3],
    status: 'active',
    createdAt: new Date('2024-04-05'),
  },
  {
    id: '5',
    name: 'Main Warehouse - Secondary',
    type: 'main',
    assignedBranches: [mockBranches[0], mockBranches[4], mockBranches[5]],
    manager: mockUsers[4],
    status: 'inactive',
    createdAt: new Date('2023-12-01'),
  },
];

// Mock API functions
export const mockWarehouseAPI = {
  // Get all warehouses with optional filters
  getWarehouses: async (filters?: {
    search?: string;
    type?: 'main' | 'sub' | 'all';
    status?: 'active' | 'inactive' | 'all';
    branchId?: string;
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ warehouses: Warehouse[]; pagination: { page: number; limit: number; total: number; pages: number } }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    let filtered = [...mockWarehouses];

    // Apply filters
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(w => 
        w.name.toLowerCase().includes(searchLower) ||
        w.manager?.fullName.toLowerCase().includes(searchLower)
      );
    }

    if (filters?.type && filters.type !== 'all') {
      filtered = filtered.filter(w => w.type === filters.type);
    }

    if (filters?.status && filters.status !== 'all') {
      filtered = filtered.filter(w => w.status === filters.status);
    }

    if (filters?.branchId) {
      filtered = filtered.filter(w => 
        w.assignedBranches.some(b => b.id === filters.branchId)
      );
    }

    // Apply sorting
    if (filters?.sortBy) {
      filtered.sort((a, b) => {
        let aVal: any, bVal: any;
        if (filters.sortBy === 'name') {
          aVal = a.name;
          bVal = b.name;
        } else if (filters.sortBy === 'createdAt') {
          aVal = a.createdAt.getTime();
          bVal = b.createdAt.getTime();
        }
        
        if (filters.sortOrder === 'desc') {
          return bVal > aVal ? 1 : -1;
        }
        return aVal > bVal ? 1 : -1;
      });
    }

    // Apply pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = filtered.slice(start, end);

    return {
      warehouses: paginated,
      pagination: {
        page,
        limit,
        total: filtered.length,
        pages: Math.ceil(filtered.length / limit),
      },
    };
  },

  // Get single warehouse
  getWarehouseById: async (id: string): Promise<Warehouse | null> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockWarehouses.find(w => w.id === id) || null;
  },

  // Create warehouse
  createWarehouse: async (data: {
    name: string;
    type: 'main' | 'sub';
    assignedBranches: string[];
    managerId?: string;
    status?: 'active' | 'inactive';
  }): Promise<Warehouse> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const assignedBranches = mockBranches.filter(b => data.assignedBranches.includes(b.id));
    const manager = data.managerId ? mockUsers.find(u => u.id === data.managerId) : undefined;

    const newWarehouse: Warehouse = {
      id: String(mockWarehouses.length + 1),
      name: data.name,
      type: data.type,
      assignedBranches,
      manager,
      status: data.status || 'active',
      createdAt: new Date(),
    };

    mockWarehouses.push(newWarehouse);
    return newWarehouse;
  },

  // Update warehouse
  updateWarehouse: async (id: string, data: Partial<{
    name: string;
    type: 'main' | 'sub';
    assignedBranches: string[];
    managerId?: string;
    status: 'active' | 'inactive';
  }>): Promise<Warehouse> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const index = mockWarehouses.findIndex(w => w.id === id);
    if (index === -1) {
      throw new Error('Warehouse not found');
    }

    const warehouse = mockWarehouses[index];
    
    if (data.name) warehouse.name = data.name;
    if (data.type) warehouse.type = data.type;
    if (data.status) warehouse.status = data.status;
    if (data.assignedBranches) {
      warehouse.assignedBranches = mockBranches.filter(b => data.assignedBranches!.includes(b.id));
    }
    if (data.managerId !== undefined) {
      warehouse.manager = data.managerId ? mockUsers.find(u => u.id === data.managerId) : undefined;
    }
    
    warehouse.updatedAt = new Date();
    return warehouse;
  },

  // Delete warehouse
  deleteWarehouse: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockWarehouses.findIndex(w => w.id === id);
    if (index !== -1) {
      mockWarehouses.splice(index, 1);
    }
  },

  // Get all branches
  getBranches: async (): Promise<Branch[]> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return [...mockBranches];
  },

  // Get all users (for manager selection)
  getUsers: async (): Promise<User[]> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return [...mockUsers];
  },
};
