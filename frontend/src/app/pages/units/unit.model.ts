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
  unit_number: string;
  size_type: string;
  price: number;
  length?: number;
  width?: number;
  height?: number;
}