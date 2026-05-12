export interface VendorType {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  vendorCount: number;
}

export interface CreateVendorTypeRequest {
  name: string;
  description?: string;
  sortOrder: number;
}

export interface UpdateVendorTypeRequest {
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface VendorContact {
  id: string;
  vendorTypeId: string;
  vendorTypeName: string;
  companyName: string;
  accountManager?: string;
  phone?: string;
  email?: string;
  description?: string;
  isActive: boolean;
  showOnLoginPage: boolean;
  createdAt: string;
}

export interface CreateVendorContactRequest {
  vendorTypeId: string;
  companyName: string;
  accountManager?: string;
  phone?: string;
  email?: string;
  description?: string;
  showOnLoginPage?: boolean;
}

export interface UpdateVendorContactRequest extends CreateVendorContactRequest {
  isActive: boolean;
  showOnLoginPage: boolean;
}
