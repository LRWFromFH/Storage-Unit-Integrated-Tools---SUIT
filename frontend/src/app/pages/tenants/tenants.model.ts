export interface Customer {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  FirstName: string;
  LastName: string;
  Phone: string;
  Address: string;
  Email: string;
  Units?: any[];
  Notes?: any[];
}

export interface CustomersResponse {
  customers: Customer[];
}