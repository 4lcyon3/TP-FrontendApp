export interface District { id: number; description: string; }
export interface School { id: number; fullname: string; district?: District; }

export interface Teacher {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  is_staff: any;
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  school?: School;
}

export interface Student {
  id: number;
  first_name: string;
  last_name: string;
  section?: string;
  puntaje?: number;
  promedio?: number;
  observador_total: number;
  competente_total: number;
  persistente_total: number;
  cant_evaluaciones?: number;
  score_total?: number;
  teacher?: Teacher | number;
  school?: School | number;
}

export interface Report {
  id: number;
  teacher?: Teacher | number;
  student?: Student | number;
  persistente: number;
  competente: number;
  observador: number;
  score_total: number;
  upload_date: string;
  week_number?: number;
  created_at?: string;
}

export interface StudentAccumulated {
  id: number;
  first_name: string;
  last_name: string;
  score_total: number;
  cant_evaluaciones: number;
  persistente: number;
  competente: number;
  observador: number;
}


export interface TokenPair {
  access: string;
  refresh: string;
}
export interface TokenResponse {
  tokens: TokenPair;
}