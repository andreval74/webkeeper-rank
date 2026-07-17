export type UserRole = 'admin' | 'consultant' | 'agency' | 'company' | 'client' | 'team';

export interface WriBreakdownItem {
  category: string;
  key: string;
  value: number;
  weight: number;
}
