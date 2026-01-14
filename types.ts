
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER', // Gestor de Setor
  USER = 'USER'
}

export enum InvoiceStatus {
  EM_ANALISE = 'EM_ANALISE',
  RECEBIDA = 'RECEBIDA',
  PENDENTE = 'PENDENTE'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  sector: string; // Setor do usuário
}

export interface Supplier {
  id: string;
  name: string; // Nome Fantasia
  razaoSocial: string;
  cnpj: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  contactEmail?: string;
  active: boolean;
}

export interface Invoice {
  id: string;
  supplierId?: string;
  supplierName: string;
  supplierCnpj?: string;
  invoiceNumber: string;
  emissionDate: string;
  orderNumber: string; 
  value: number;
  pdfUrl: string;
  fileName: string;
  uploadedBy: string;
  userName: string;
  userSector: string; // Setor no momento da postagem
  createdAt: string;
  observations?: string;
  status: InvoiceStatus;
  adminObservations?: string;
  userResponse?: string;
  docType: 'OSV' | 'CONTRATO'; // Tipo de vínculo
}

export type ViewType = 'dashboard' | 'upload' | 'invoices' | 'suppliers' | 'users' | 'system';

export type FilterOptions = {
  supplierName: string;
  invoiceNumber: string;
  dateFrom: string;
  dateTo: string;
  userName: string;
  sector: string;
};
