import { Asset, Expense, RootData, SalesBasis, SalesDay, Settings } from '../types';

/**
 * คำนวณยอดเงินรายเดือนของค่าใช้จ่ายคงที่แต่ละรายการ (บาท/เดือน)
 * สูตร:
 * - monthly: ยอดเดิม
 * - weekly: amount * 52 / 12
 * - daily: amount * operatingDaysPerMonth
 * - quarterly: amount / 3
 * - yearly: amount / 12
 * หากติ๊ก excluded = true ให้ส่งกลับ 0
 */
export function getExpenseMonthlyAmount(
  expense: Expense,
  operatingDaysPerMonth: number
): number {
  if (expense.excluded) return 0;
  if (expense.frequency === 'percentOfSales') return 0; // คิดแยกเป็น % ยอดขาย

  const amount = Number(expense.amount) || 0;
  if (amount <= 0) return 0;

  switch (expense.frequency) {
    case 'monthly':
      return amount;
    case 'weekly':
      return (amount * 52) / 12;
    case 'daily':
      return amount * (operatingDaysPerMonth > 0 ? operatingDaysPerMonth : 30);
    case 'quarterly':
      return amount / 3;
    case 'yearly':
      return amount / 12;
    default:
      return 0;
  }
}

/**
 * คำนวณค่าเสื่อมราคาหรือค่างวดต่อเดือนของสินทรัพย์ (บาท/เดือน)
 * สูตร:
 * - ถ้าผ่อน: ค่างวดต่อเดือน
 * - ถ้าคิดค่าเสื่อม: ราคา ÷ อายุการใช้งาน (ปี) ÷ 12
 */
export function getAssetMonthlyCost(asset: Asset): number {
  if (asset.useInstallment) {
    return Math.max(0, Number(asset.installmentMonthly) || 0);
  }
  const price = Math.max(0, Number(asset.price) || 0);
  const lifeYears = Number(asset.lifeYears) || 0;
  if (lifeYears <= 0 || price <= 0) return 0;
  return price / lifeYears / 12;
}

/**
 * คำนวณยอดรวมค่าใช้จ่ายคงที่ (Fixed Cost) ทั้งหมดต่อเดือน (บาท)
 * รวม: ค่าใช้จ่ายคงที่ทุกหมวดหมู่ (ไม่นับ excluded) + ค่าเสื่อมราคา/ค่างวดสินทรัพย์
 */
export function calculateFixedTotal(
  expenses: Expense[],
  assets: Asset[],
  operatingDaysPerMonth: number
): number {
  const expensesFixed = expenses.reduce(
    (sum, exp) => sum + getExpenseMonthlyAmount(exp, operatingDaysPerMonth),
    0
  );
  const assetsFixed = assets.reduce(
    (sum, ast) => sum + getAssetMonthlyCost(ast),
    0
  );
  return expensesFixed + assetsFixed;
}

/**
 * คำนวณสัดส่วนค่าใช้จ่ายผันแปรต่อยอดขายรวม (%)
 * รวม: ค่าใช้จ่ายประเภท percentOfSales ทั้งหมดที่ไม่ได้ excluded
 */
export function calculateVariablePercentTotal(expenses: Expense[]): number {
  return expenses.reduce((sum, exp) => {
    if (exp.excluded) return sum;
    if (exp.frequency === 'percentOfSales') {
      return sum + Math.max(0, Number(exp.amount) || 0);
    }
    return sum;
  }, 0);
}

/**
 * คำนวณยอดขายรายเดือนตามฐานที่เลือก (ก่อน VAT / Ex-VAT เสมอ)
 */
export function calculateMonthlySalesByBasis(
  basis: SalesBasis,
  settings: Settings,
  salesDays: SalesDay[]
): number {
  const vatDivisor = settings.salesInputsIncludeVat
    ? 1 + (Number(settings.vatRatePercent) || 7) / 100
    : 1;

  if (basis === 'expected') {
    const seats = Math.max(0, Number(settings.expected.seats) || 0);
    const turns = Math.max(0, Number(settings.expected.turnsPerDay) || 0);
    const spend = Math.max(0, Number(settings.expected.avgSpendPerHead) || 0);
    const days = Math.max(1, Number(settings.operatingDaysPerMonth) || 30);
    const rawSales = seats * turns * spend * days;
    return vatDivisor > 0 ? rawSales / vatDivisor : 0;
  }

  if (basis === 'manual') {
    const rawSales = Math.max(0, Number(settings.manualMonthlySales) || 0);
    return vatDivisor > 0 ? rawSales / vatDivisor : 0;
  }

  if (basis === 'actual') {
    if (!salesDays || salesDays.length === 0) return 0;
    // เรียงตามวันที่ล่าสุด
    const sorted = [...salesDays].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const targetDays = settings.actualAverageDays || 14;
    const windowDays = sorted.slice(0, targetDays);
    if (windowDays.length === 0) return 0;

    const totalWindowAmount = windowDays.reduce(
      (sum, item) => sum + Math.max(0, Number(item.amount) || 0),
      0
    );
    const avgDailySales = totalWindowAmount / windowDays.length;
    const daysInMonth = Math.max(1, Number(settings.operatingDaysPerMonth) || 30);
    const rawSales = avgDailySales * daysInMonth;
    return vatDivisor > 0 ? rawSales / vatDivisor : 0;
  }

  return 0;
}

/**
 * คำนวณเปอร์เซ็นต์โสหุ้ยต่อราคาขาย (Overhead % of Selling Price, ex-VAT)
 * สูตร: (fixedTotal ÷ monthlySales × 100) + variablePercentTotal
 */
export function calculateOverheadPercent(
  fixedTotal: number,
  variablePercentTotal: number,
  monthlySales: number
): number | null {
  if (!monthlySales || monthlySales <= 0 || !isFinite(monthlySales)) {
    return null;
  }
  const result = (fixedTotal / monthlySales) * 100 + variablePercentTotal;
  if (!isFinite(result) || isNaN(result)) return null;
  return result;
}

/**
 * คำนวณโสหุ้ยรวมเป็นจำนวนเงินบาทต่อเดือน
 * สูตร: fixedTotal + (variablePercentTotal ÷ 100 × monthlySales)
 */
export function calculateOverheadBaht(
  fixedTotal: number,
  variablePercentTotal: number,
  monthlySales: number
): number {
  if (!monthlySales || monthlySales <= 0) {
    return fixedTotal;
  }
  return fixedTotal + (variablePercentTotal / 100) * monthlySales;
}

/**
 * คำนวณจุดคุ้มทุนต่อเดือน (Break-even Monthly Sales)
 * สูตร: fixedTotal ÷ (1 − avgFoodCostPercent/100 − variablePercentTotal/100)
 */
export function calculateBreakEvenSales(
  fixedTotal: number,
  variablePercentTotal: number,
  avgFoodCostPercent: number
): number | null {
  const marginRatio =
    1 - (avgFoodCostPercent / 100) - (variablePercentTotal / 100);
  if (marginRatio <= 0 || fixedTotal <= 0) {
    return null; // ไม่มีวันคุ้มทุนด้วยต้นทุนระดับนี้
  }
  const res = fixedTotal / marginRatio;
  return isFinite(res) && !isNaN(res) ? res : null;
}

/**
 * คำนวณยอดขายที่ต้องการเพื่อกำไรเป้าหมายต่อเดือน
 * สูตร: fixedTotal ÷ (1 − avgFoodCostPercent/100 − variablePercentTotal/100 − targetProfitPercent/100)
 */
export function calculateTargetProfitSales(
  fixedTotal: number,
  variablePercentTotal: number,
  avgFoodCostPercent: number,
  targetProfitPercent: number
): number | null {
  const marginRatio =
    1 -
    (avgFoodCostPercent / 100) -
    (variablePercentTotal / 100) -
    (targetProfitPercent / 100);
  if (marginRatio <= 0 || fixedTotal <= 0) {
    return null;
  }
  const res = fixedTotal / marginRatio;
  return isFinite(res) && !isNaN(res) ? res : null;
}

/**
 * ตารางวิเคราะห์ความอ่อนไหว (Sensitivity Table)
 * ยอดขายที่ 70%, 100%, 130%, 150% ของยอดขายฐาน
 */
export interface SensitivityRow {
  multiplier: number;
  label: string;
  sales: number;
  overheadPercent: number | null;
  overheadBaht: number;
}

export function calculateSensitivity(
  fixedTotal: number,
  variablePercentTotal: number,
  baseMonthlySales: number
): SensitivityRow[] {
  const multipliers = [
    { multiplier: 0.7, label: '70% (ยอดตก/ช่วงโลว์ซีซั่น)' },
    { multiplier: 1.0, label: '100% (ยอดขายปัจจุบัน/ฐานที่เลือก)' },
    { multiplier: 1.3, label: '130% (ยอดเพิ่มขึ้น 30%)' },
    { multiplier: 1.5, label: '150% (ช่วงพีค/เทศกาล)' },
  ];

  return multipliers.map((m) => {
    const s = baseMonthlySales * m.multiplier;
    const ohPercent = calculateOverheadPercent(
      fixedTotal,
      variablePercentTotal,
      s
    );
    const ohBaht = calculateOverheadBaht(fixedTotal, variablePercentTotal, s);
    return {
      multiplier: m.multiplier,
      label: m.label,
      sales: s,
      overheadPercent: ohPercent,
      overheadBaht: ohBaht,
    };
  });
}

/**
 * สรุปค่าใช้จ่ายแยกรายหมวดหมู่ (Category Breakdown)
 */
export interface CategoryBreakdownItem {
  categoryId: number;
  name: string;
  monthlyAmount: number;
  sharePercentOfFixed: number;
  isVariableCategory?: boolean;
}

export function calculateCategoryBreakdown(
  expenses: Expense[],
  assets: Asset[],
  operatingDaysPerMonth: number,
  fixedTotal: number
): {
  items: CategoryBreakdownItem[];
  variablePercent: number;
} {
  // ค่าใช้จ่ายคงที่หมวด 1-8
  const categoryNames: Record<number, string> = {
    1: 'ที่และอาคาร',
    2: 'ค่าแรง',
    3: 'สาธารณูปโภค',
    4: 'ของใช้สิ้นเปลือง',
    5: 'ซ่อมบำรุงและความสะอาด',
    6: 'การขายและการตลาด (ส่วนคงที่)',
    7: 'ธุรการ กฎหมาย การเงิน',
    8: 'ค่าเผื่อความสูญเสีย (ส่วนคงที่)',
  };

  const sums: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
  };

  for (const exp of expenses) {
    if (exp.excluded || exp.frequency === 'percentOfSales') continue;
    const amt = getExpenseMonthlyAmount(exp, operatingDaysPerMonth);
    if (sums[exp.categoryId] !== undefined) {
      sums[exp.categoryId] += amt;
    }
  }

  // สินทรัพย์
  const assetTotal = assets.reduce(
    (sum, ast) => sum + getAssetMonthlyCost(ast),
    0
  );

  const items: CategoryBreakdownItem[] = [];

  for (let id = 1; id <= 8; id++) {
    const amt = sums[id];
    // ถ้ามีค่า หรือหมวดสำคัญ แสดง
    items.push({
      categoryId: id,
      name: categoryNames[id],
      monthlyAmount: amt,
      sharePercentOfFixed: fixedTotal > 0 ? (amt / fixedTotal) * 100 : 0,
    });
  }

  // เพิ่มค่าเสื่อมราคาและผ่อนอุปกรณ์
  items.push({
    categoryId: 99,
    name: 'ค่าเสื่อมราคาและผ่อนอุปกรณ์',
    monthlyAmount: assetTotal,
    sharePercentOfFixed: fixedTotal > 0 ? (assetTotal / fixedTotal) * 100 : 0,
  });

  const variablePercent = calculateVariablePercentTotal(expenses);

  return { items, variablePercent };
}

/**
 * คำนวณสรุปภาพรวมทั้งหมดจาก RootData
 */
export function computeDashboardSummary(data: RootData) {
  const { settings, expenses, assets, salesDays } = data;
  const fixedTotal = calculateFixedTotal(
    expenses,
    assets,
    settings.operatingDaysPerMonth
  );
  const variablePercentTotal = calculateVariablePercentTotal(expenses);

  // คำนวณยอดขายทั้ง 3 ฐานเพื่อเปรียบเทียบ
  const expectedSales = calculateMonthlySalesByBasis(
    'expected',
    settings,
    salesDays
  );
  const manualSales = calculateMonthlySalesByBasis('manual', settings, salesDays);
  const actualSales = calculateMonthlySalesByBasis('actual', settings, salesDays);

  const activeSales = calculateMonthlySalesByBasis(
    settings.salesBasis,
    settings,
    salesDays
  );

  const overheadPercent = calculateOverheadPercent(
    fixedTotal,
    variablePercentTotal,
    activeSales
  );
  const overheadBaht = calculateOverheadBaht(
    fixedTotal,
    variablePercentTotal,
    activeSales
  );

  const expectedOverheadPercent = calculateOverheadPercent(
    fixedTotal,
    variablePercentTotal,
    expectedSales
  );
  const manualOverheadPercent = calculateOverheadPercent(
    fixedTotal,
    variablePercentTotal,
    manualSales
  );
  const actualOverheadPercent = calculateOverheadPercent(
    fixedTotal,
    variablePercentTotal,
    actualSales
  );

  const breakEvenSales = calculateBreakEvenSales(
    fixedTotal,
    variablePercentTotal,
    settings.avgFoodCostPercent
  );
  const breakEvenDaily =
    breakEvenSales !== null
      ? breakEvenSales / (settings.operatingDaysPerMonth || 30)
      : null;

  const targetProfitSales = calculateTargetProfitSales(
    fixedTotal,
    variablePercentTotal,
    settings.avgFoodCostPercent,
    settings.targetProfitPercent
  );
  const targetProfitDaily =
    targetProfitSales !== null
      ? targetProfitSales / (settings.operatingDaysPerMonth || 30)
      : null;

  const sensitivity = calculateSensitivity(
    fixedTotal,
    variablePercentTotal,
    activeSales
  );

  const breakdown = calculateCategoryBreakdown(
    expenses,
    assets,
    settings.operatingDaysPerMonth,
    fixedTotal
  );

  // ตรวจสอบเงินเดือนเจ้าของ
  const ownerSalaryExp = expenses.find(
    (e) => e.name.trim() === 'เงินเดือนเจ้าของ (ตั้งให้ตัวเอง)'
  );
  const hasOwnerSalary = ownerSalaryExp
    ? Number(ownerSalaryExp.amount) > 0 && !ownerSalaryExp.excluded
    : false;

  // ตรวจสอบหมวดหมู่ที่มียอดเป็น 0 ทั้งหมด
  const zeroCategories: number[] = [];
  for (let c = 1; c <= 7; c++) {
    const expsInCat = expenses.filter((e) => e.categoryId === c);
    const sumInCat = expsInCat.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    if (sumInCat === 0) {
      zeroCategories.push(c);
    }
  }

  return {
    fixedTotal,
    variablePercentTotal,
    activeSales,
    overheadPercent,
    overheadBaht,
    salesComparisons: {
      expectedSales,
      expectedOverheadPercent,
      manualSales,
      manualOverheadPercent,
      actualSales,
      actualOverheadPercent,
    },
    breakEvenSales,
    breakEvenDaily,
    targetProfitSales,
    targetProfitDaily,
    sensitivity,
    breakdown,
    hasOwnerSalary,
    zeroCategories,
    actualDaysLogged: salesDays.length,
  };
}
