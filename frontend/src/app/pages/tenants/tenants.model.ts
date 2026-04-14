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

export interface Note {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  CustomerID: number;
  Content: string;
  AuthorID: number;
}

export interface NotesResponse {
  notes: Note[];
}

export interface LedgerEntry {
  ID: number;
  CreatedAt: string;
  CustomerID: number;
  UnitID?: number;
  InvoiceID: number;
  Amount: number;
  Type: string;
  Description: string;
}

export interface TransactionsResponse {
  transactions: LedgerEntry[];
}