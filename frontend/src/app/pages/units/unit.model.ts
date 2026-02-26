export interface Unit {
  id: string;
  unitNumber: string;
  unitType: string;
  sizeSqFt: number;
  floor: number;
  climateControlled: boolean;
  pricePerMonth: number;
  status: 'Available' | 'Occupied' | 'Reserved' | 'Maintenance';
  tenantName?: string;
  moveInDate?: Date | null;
  insuranceRequired: boolean;
  lastUpdated: Date;
}