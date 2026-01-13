
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
}

export interface Invoice {
  id: string;
  supplierName: string;
  invoiceNumber: string;
  emissionDate: string;
  orderNumber: string; // PO / OSV / OS
  value: number; // Valor da nota
  pdfUrl: string;
  fileName: string;
  uploadedBy: string; // User ID
  userName: string; // Display name
  createdAt: string;
  observations?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export type FilterOptions = {
  supplierName: string;
  invoiceNumber: string;
  dateFrom: string;
  dateTo: string;
  userName: string;
};
