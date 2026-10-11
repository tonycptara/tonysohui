export type Frequency =
  | 'monthly'
  | 'weekly'
  | 'daily'
  | 'quarterly'
  | 'yearly'
  | 'percentOfSales';

export interface Expense {
  id: string;
  categoryId: number; // 1 to 8
  name: string;
  amount: number;
  frequency: Frequency;
  excluded: boolean; // true = "already counted per-plate in recipe, do not include"
  note?: string;
}

export interface Asset {
  id: string;
  name: string;
  price: number;
  lifeYears: number;
  useInstallment: boolean;
  installmentMonthly?: number;
  note?: string;
}

export interface SalesDay {
  date: string; // YYYY-MM-DD (unique)
  amount: number;
  note?: string;
}

export type SalesBasis = 'expected' | 'manual' | 'actual';

export interface ExpectedSalesConfig {
  seats: number;
  turnsPerDay: number;
  avgSpendPerHead: number;
}

export interface Settings {
  shopName: string;
  operatingDaysPerMonth: number;
  salesBasis: SalesBasis;
  salesInputsIncludeVat: boolean;
  vatRatePercent: number;
  expected: ExpectedSalesConfig;
  manualMonthlySales: number;
  actualAverageDays: 7 | 14 | 30;
  avgFoodCostPercent: number;
  targetProfitPercent: number;
  lastBackupAt?: string;
}

export interface RootData {
  schemaVersion: 1;
  settings: Settings;
  expenses: Expense[];
  assets: Asset[];
  salesDays: SalesDay[];
}

export interface CategoryInfo {
  id: number;
  name: string;
  description: string;
}

export type ActiveTab = 'result' | 'expenses' | 'assets' | 'sales' | 'settings';
