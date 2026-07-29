export type OrderStatus = 'Pending' | 'In Progress' | 'Done';

export interface OrderItem {
  id: string;
  item_text: string;
  is_completed: boolean;
}

export interface ClinicalOrder {
  id: string;
  patient_name: string;
  age_sex: string;
  birthday: string;
  bed_number: string;
  case_number: string;
  ordered_by: string;
  status: OrderStatus;
  items: OrderItem[];
  raw_text?: string;
  topic_id?: string | number;
  timestamp: string;
  created_at: number;
  updated_at: number;
}

export interface SummaryStats {
  totalPending: number;
  inProgress: number;
  completedToday: number;
  totalOrders: number;
}

export interface FilterState {
  searchQuery: string;
  status: OrderStatus | 'All';
  sortBy: 'time' | 'bed' | 'patient';
}
