export type Role =
  | 'ADMIN'
  | 'RECEPCION'
  | 'ENFERMERIA'
  | 'MEDICO'
  | 'LABORATORIO'
  | 'FARMACIA'
  | 'CAJA'
  | 'AUDITOR';

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CHECKED_IN'
  | 'TRIAGE_DONE'
  | 'IN_CONSULTATION'
  | 'DOCTOR_COMPLETED'
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'CLOSED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'LAB_PENDING'
  | 'LAB_COMPLETED'
  | 'PRESCRIPTION_PENDING'
  | 'PRESCRIPTION_DISPENSED';

export type LabOrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';
export type PrescriptionStatus = 'PENDING' | 'DISPENSED' | 'CANCELLED';
export type BillingStatus = 'PENDING' | 'PARTIAL' | 'PAID';
export type LabPriority = 'ROUTINE' | 'URGENT';
export type ConsultationStatus = 'OPEN' | 'COMPLETED';

export interface User {
  id: string;
  fullName: string;
  email: string;
  password: string;
  role: Role;
  active: boolean;
}

export interface Session {
  user: User;
  loggedAt: string;
}

export interface Patient {
  id: string;
  documentNumber: string;
  fullName: string;
  birthDate: string;
  gender: 'F' | 'M' | 'X';
  phone?: string;
  email?: string;
  address?: string;
  active: boolean;
  createdAt: string;
}

export interface Doctor {
  id: string;
  fullName: string;
  specialtyId: string;
  active: boolean;
  userId?: string;
}

export interface Specialty {
  id: string;
  name: string;
  active: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  specialtyId: string;
  scheduledAt: string;
  reason: string;
  status: AppointmentStatus;
  createdByUserId: string;
  checkedInAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TriageRecord {
  id: string;
  appointmentId: string;
  temperature: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  heartRate: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  weight: number;
  height: number;
  notes?: string;
  createdByUserId: string;
  createdAt: string;
}

export interface Consultation {
  id: string;
  appointmentId: string;
  doctorId: string;
  reason: string;
  clinicalNotes: string;
  preliminaryDiagnosis: string;
  treatmentPlan: string;
  status: ConsultationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LabOrder {
  id: string;
  appointmentId: string;
  consultationId: string;
  doctorId: string;
  testName: string;
  priority: LabPriority;
  status: LabOrderStatus;
  result?: string;
  requestedAt: string;
  completedAt?: string;
}

export interface LabResult {
  id: string;
  labOrderId: string;
  result: string;
  createdByUserId: string;
  createdAt: string;
}

export interface PrescriptionItem {
  medicationId: string;
  quantity: number;
  instructions: string;
}

export interface Prescription {
  id: string;
  appointmentId: string;
  consultationId: string;
  doctorId: string;
  status: PrescriptionStatus;
  items: PrescriptionItem[];
  createdAt: string;
  dispensedAt?: string;
}

export interface Medication {
  id: string;
  name: string;
  stock: number;
  unitPrice: number;
  active: boolean;
}

export interface StockMovement {
  id: string;
  medicationId: string;
  quantity: number;
  type: 'IN' | 'OUT';
  reason: string;
  createdByUserId: string;
  createdAt: string;
}

export interface BillingRecord {
  id: string;
  appointmentId: string;
  patientId: string;
  consultationAmount: number;
  labAmount: number;
  medicationAmount: number;
  discount: number;
  total: number;
  paidAmount: number;
  status: BillingStatus;
  createdAt: string;
  paidAt?: string;
}

export interface Payment {
  id: string;
  billingRecordId: string;
  amount: number;
  method: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA';
  createdByUserId: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  description: string;
  userId: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AppointmentAction {
  key: 'CHECK_IN' | 'CANCEL' | 'TRIAGE' | 'START_CONSULTATION' | 'BILLING' | 'CLOSE';
  label: string;
  route?: string[];
}

export interface NavItem {
  label: string;
  path: string;
  roles: Role[];
}
