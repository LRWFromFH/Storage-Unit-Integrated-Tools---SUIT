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
  Insurance: any;
  Combined: boolean;
  CombinedFrom: string;
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

export interface AssignUnitRequest {
  UnitNumber: string;
  SizeType: string;
  Price: number;
  Length: number;
  Width: number;
  Height: number;
  CustomerID: number | null;
}

export interface CombineUnitsRequest {
  unit_ids: number[];
  price: number;
  customer_id?: number;
}