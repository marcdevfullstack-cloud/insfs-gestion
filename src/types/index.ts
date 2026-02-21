export type Role = "ADMIN" | "SCOLARITE" | "COMPTABILITE";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
}

export interface School {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface AcademicYear {
  id: string;
  label: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export type Gender = "M" | "F";
export type MaritalStatus = "Célibataire" | "Marié(e)" | "Veuf(ve)" | "Divorcé(e)";
export type StatusType = "Fonctionnaire" | "Boursier national" | "Boursier étranger" | "Non-boursier";
export type EntryMode = "Concours direct" | "Analyse de dossier" | "Concours professionnel";

export interface Student {
  id: string;
  matricule: string;
  last_name: string;
  first_name: string;
  gender: Gender;
  date_of_birth: string;
  place_of_birth: string;
  nationality: string;
  father_name?: string;
  mother_name?: string;
  marital_status: MaritalStatus;
  children_count: number;
  phone?: string;
  email?: string;
  address?: string;
  photo_url?: string;
  status_type: StatusType;
  matricule_fonctionnaire?: string;
  emploi?: string;
  echelon?: string;
  categorie?: string;
  classe?: string;
  entry_mode: EntryMode;
  diploma_cepe: boolean;
  diploma_bepc: boolean;
  diploma_bac: boolean;
  diploma_bac_serie?: string;
  other_diplomas?: string;
  is_blocked: boolean;
  block_reason?: string;
  enrollments?: Enrollment[];
  created_at: string;
  updated_at: string;
}

export type EnrollmentQuality = "CD" | "CP" | "FC";
export type EnrollmentStatus = "EN_COURS" | "VALIDE" | "ANNULE";

export interface Enrollment {
  id: string;
  student_id: string;
  school_id: string;
  academic_year_id: string;
  year_of_study: number;
  cycle?: string;
  quality: EnrollmentQuality;
  enrollment_date: string;
  status: EnrollmentStatus;
  total_paid?: number;
  student?: Student;
  school?: School;
  academic_year?: AcademicYear;
  payments?: Payment[];
}

export type PaymentType = "FRAIS_INSCRIPTION" | "FRAIS_SCOLARITE";
export type PaymentMethod = "ESPÈCES" | "VIREMENT" | "MOBILE_MONEY";

export interface Payment {
  id: string;
  enrollment_id: string;
  payment_type: PaymentType;
  payment_method: PaymentMethod;
  amount: number;
  payment_date: string;
  receipt_number: string;
  installment_number: number;
  notes?: string;
  recorded_by: string;
  enrollment?: Enrollment;
  recorder?: User;
  created_at: string;
  updated_at: string;
}

export interface FeeSchedule {
  id: string;
  academic_year_id: string;
  school_id: string;
  student_status: StatusType;
  fee_type: PaymentType;
  total_amount: number;
  max_installments: number;
  academic_year?: AcademicYear;
  school?: School;
}

export interface DashboardStats {
  students: {
    total: number;
  };
  enrollments: {
    total: number;
    en_cours: number;
    valide: number;
    annule: number;
    by_school: Array<{ school_code: string; count: number }>;
  };
  payments: {
    total_collected: number;
    collected_this_month: number;
    recovery_rate: number;
  };
  top_unpaid: Array<{
    id: string;
    student: { last_name: string; first_name: string; matricule: string } | null;
    school_code: string | null;
    academic_year: string | null;
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface LoginResponse {
  token: string;
  user: User;
}