export interface DepartmentResponse {
  id: string;
  name: string;
  companyId: string;
  companyName: string;
  userCount: number;
  createdAt: string;
}

export interface CreateDepartmentRequest {
  name: string;
  companyId: string;
}

export interface UpdateDepartmentRequest {
  name: string;
}
