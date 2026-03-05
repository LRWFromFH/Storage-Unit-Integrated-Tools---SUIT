export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  unitNumber: string;
  moveInDate: Date;
  insurance: boolean;
  status: 'Active' | 'Pending' | 'Closed';
}