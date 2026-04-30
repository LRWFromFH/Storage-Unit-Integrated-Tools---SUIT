export interface InsuranceRecord {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  UnitID: number;
  ProviderName: string;
  PolicyNumber: string;
  CoverageLimit: number;
  ExpiryDate: string;
}

export interface InsuranceResponse {
  insurance: InsuranceRecord;
}

export interface Unit {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  UnitNumber: string;
  SizeType: string;
  Length: number;
  Width: number;
  Height: number;
  Price: number;
  CustomerID: number | null;
  Renter: any | null;
  Insurance: InsuranceRecord | null;
  Combined: boolean;
  CombinedFrom: string;
  Status?: string;
  Reserved?: boolean;
  NextDueDate?: string | null;
}

export interface UnitsResponse {
  units: Unit[];
}

export interface CreateUnitRequest {
  UnitNumber: string;
  SizeType: string;
  Price: number;
  Length?: number;
  Width?: number;
  Height?: number;
}

export interface CombineUnitsRequest {
  unit_ids: number[];
  price: number;
  customer_id?: number;
}