import { Asset, Expense, RootData, SalesDay, Settings } from '../types';

export const SAMPLE_SETTINGS: Settings = {
  shopName: "Tony's Kitchen",
  operatingDaysPerMonth: 30,
  salesBasis: 'manual',
  salesInputsIncludeVat: false,
  vatRatePercent: 7,
  expected: {
    seats: 40,
    turnsPerDay: 2.5,
    avgSpendPerHead: 110,
  },
  manualMonthlySales: 330000,
  actualAverageDays: 14,
  avgFoodCostPercent: 35,
  targetProfitPercent: 10,
  lastBackupAt: new Date().toISOString(),
};

export const SAMPLE_EXPENSES: Expense[] = [
  // 1 ที่และอาคาร
  { id: 'exp-1-1', categoryId: 1, name: 'ค่าเช่าร้าน', amount: 30000, frequency: 'monthly', excluded: false },
  { id: 'exp-1-2', categoryId: 1, name: 'ค่าส่วนกลาง/ค่าบริหารอาคาร', amount: 2500, frequency: 'monthly', excluded: false },
  { id: 'exp-1-3', categoryId: 1, name: 'ค่าที่จอดรถ', amount: 1500, frequency: 'monthly', excluded: false },
  { id: 'exp-1-4', categoryId: 1, name: 'ภาษีโรงเรือน/ป้าย', amount: 3600, frequency: 'yearly', excluded: false },
  { id: 'exp-1-5', categoryId: 1, name: 'ประกันอัคคีภัยอาคาร', amount: 6000, frequency: 'yearly', excluded: false },

  // 2 ค่าแรง
  { id: 'exp-2-1', categoryId: 2, name: 'เงินเดือน/ค่าแรงพนักงานทั้งหมด', amount: 60000, frequency: 'monthly', excluded: false },
  { id: 'exp-2-2', categoryId: 2, name: 'ค่าล่วงเวลา (OT)', amount: 6000, frequency: 'monthly', excluded: false },
  { id: 'exp-2-3', categoryId: 2, name: 'เงินสมทบประกันสังคมส่วนนายจ้าง', amount: 3500, frequency: 'monthly', excluded: false },
  { id: 'exp-2-4', categoryId: 2, name: 'โบนัส/ค่าคอมมิชชั่น', amount: 30000, frequency: 'yearly', excluded: false },
  { id: 'exp-2-5', categoryId: 2, name: 'ค่าอาหารพนักงาน', amount: 7500, frequency: 'monthly', excluded: false },
  { id: 'exp-2-6', categoryId: 2, name: 'ชุดยูนิฟอร์ม/ผ้ากันเปื้อน', amount: 3600, frequency: 'yearly', excluded: false },
  { id: 'exp-2-7', categoryId: 2, name: 'ค่าเดินทาง/ที่พักพนักงาน', amount: 1200, frequency: 'monthly', excluded: false },
  { id: 'exp-2-8', categoryId: 2, name: 'เงินเดือนเจ้าของ (ตั้งให้ตัวเอง)', amount: 30000, frequency: 'monthly', excluded: false },

  // 3 สาธารณูปโภค
  { id: 'exp-3-1', categoryId: 3, name: 'ค่าไฟฟ้า', amount: 15000, frequency: 'monthly', excluded: false },
  { id: 'exp-3-2', categoryId: 3, name: 'ค่าน้ำประปา', amount: 2500, frequency: 'monthly', excluded: false },
  { id: 'exp-3-3', categoryId: 3, name: 'แก๊สหุงต้ม', amount: 4500, frequency: 'monthly', excluded: false, note: 'ถ้าใส่เป็นต้นทุนต่อจานในสูตรแล้ว ให้ติ๊กไม่นับ' },
  { id: 'exp-3-4', categoryId: 3, name: 'อินเทอร์เน็ต', amount: 800, frequency: 'monthly', excluded: false },
  { id: 'exp-3-5', categoryId: 3, name: 'โทรศัพท์', amount: 500, frequency: 'monthly', excluded: false },
  { id: 'exp-3-6', categoryId: 3, name: 'น้ำดื่ม/น้ำแข็ง', amount: 3000, frequency: 'monthly', excluded: false },

  // 4 ของใช้สิ้นเปลือง
  { id: 'exp-4-1', categoryId: 4, name: 'ทิชชู่/ผ้าเช็ดมือ', amount: 1500, frequency: 'monthly', excluded: false },
  { id: 'exp-4-2', categoryId: 4, name: 'ถุงขยะ', amount: 800, frequency: 'monthly', excluded: false },
  { id: 'exp-4-3', categoryId: 4, name: 'น้ำยาล้างจาน/ถูพื้น/ฆ่าเชื้อ', amount: 2000, frequency: 'monthly', excluded: false },
  { id: 'exp-4-4', categoryId: 4, name: 'ถุงมือ/หมวกคลุมผม/หน้ากาก', amount: 1200, frequency: 'monthly', excluded: false },
  { id: 'exp-4-5', categoryId: 4, name: 'ไม้จิ้มฟัน/ช้อนส้อมใช้แล้วทิ้ง', amount: 600, frequency: 'monthly', excluded: false },
  { id: 'exp-4-6', categoryId: 4, name: 'กระดาษใบเสร็จ/หมึกพิมพ์', amount: 800, frequency: 'monthly', excluded: false },
  { id: 'exp-4-7', categoryId: 4, name: 'บรรจุภัณฑ์ใส่กลับบ้าน', amount: 2500, frequency: 'monthly', excluded: false, note: 'ถ้าใส่เป็นต้นทุนแฝงต่อจานแล้ว ให้ติ๊กไม่นับ' },

  // 5 ซ่อมบำรุงและความสะอาด
  { id: 'exp-5-1', categoryId: 5, name: 'ล้างแอร์', amount: 4800, frequency: 'yearly', excluded: false },
  { id: 'exp-5-2', categoryId: 5, name: 'ล้างท่อ/บ่อดักไขมัน', amount: 1500, frequency: 'monthly', excluded: false },
  { id: 'exp-5-3', categoryId: 5, name: 'ซ่อมเตา/ตู้เย็น/เครื่องใช้', amount: 2000, frequency: 'monthly', excluded: false },
  { id: 'exp-5-4', categoryId: 5, name: 'กำจัดแมลงและหนู', amount: 1500, frequency: 'monthly', excluded: false },
  { id: 'exp-5-5', categoryId: 5, name: 'ค่าเก็บขยะเอกชน', amount: 1000, frequency: 'monthly', excluded: false },
  { id: 'exp-5-6', categoryId: 5, name: 'ซักผ้า', amount: 2000, frequency: 'monthly', excluded: false },
  { id: 'exp-5-7', categoryId: 5, name: 'จ้างแม่บ้าน/ทำความสะอาดรายครั้ง', amount: 0, frequency: 'monthly', excluded: false },

  // 6 การขายและการตลาด
  { id: 'exp-6-1', categoryId: 6, name: 'โฆษณา (Facebook/Google/ป้าย/ใบปลิว)', amount: 5000, frequency: 'monthly', excluded: false },
  { id: 'exp-6-2', categoryId: 6, name: 'ค่าระบบ POS/แอปรับออเดอร์', amount: 1500, frequency: 'monthly', excluded: false },
  { id: 'exp-6-3', categoryId: 6, name: 'ค่าธรรมเนียมรับชำระ QR/บัตร', amount: 1, frequency: 'percentOfSales', excluded: false },
  { id: 'exp-6-4', categoryId: 6, name: 'ส่วนลด/โปรโมชั่น', amount: 0, frequency: 'percentOfSales', excluded: false },
  { id: 'exp-6-5', categoryId: 6, name: 'ค่าถ่ายรูป/ออกแบบเมนู', amount: 6000, frequency: 'yearly', excluded: false },

  // 7 ธุรการ กฎหมาย การเงิน
  { id: 'exp-7-1', categoryId: 7, name: 'ค่าบัญชี/สำนักงานบัญชี', amount: 4000, frequency: 'monthly', excluded: false },
  { id: 'exp-7-2', categoryId: 7, name: 'ค่าต่อใบอนุญาต', amount: 3000, frequency: 'yearly', excluded: false },
  { id: 'exp-7-3', categoryId: 7, name: 'ค่าตรวจสุขภาพพนักงาน', amount: 2400, frequency: 'yearly', excluded: false },
  { id: 'exp-7-4', categoryId: 7, name: 'ประกันภัยร้านและความรับผิดต่อบุคคลที่สาม', amount: 4800, frequency: 'yearly', excluded: false },
  { id: 'exp-7-5', categoryId: 7, name: 'ลิขสิทธิ์เพลง', amount: 6000, frequency: 'yearly', excluded: false },
  { id: 'exp-7-6', categoryId: 7, name: 'ค่าธรรมเนียมธนาคาร', amount: 500, frequency: 'monthly', excluded: false },
  { id: 'exp-7-7', categoryId: 7, name: 'ดอกเบี้ยเงินกู้ (เฉพาะดอกเบี้ย ไม่รวมเงินต้น)', amount: 3200, frequency: 'monthly', excluded: false },

  // 8 ค่าเผื่อความสูญเสีย
  { id: 'exp-8-1', categoryId: 8, name: 'ของเสีย/ของหมดอายุ/ทำผิด', amount: 1, frequency: 'percentOfSales', excluded: false },
  { id: 'exp-8-2', categoryId: 8, name: 'ของแตก/ของหาย', amount: 0.5, frequency: 'percentOfSales', excluded: false },
  { id: 'exp-8-3', categoryId: 8, name: 'เงินขาด/เงินทอนผิด', amount: 0.2, frequency: 'percentOfSales', excluded: false },
];

export const SAMPLE_ASSETS: Asset[] = [
  {
    id: 'ast-1',
    name: 'เตาแก๊สและอุปกรณ์สแตนเลสครัวหลัก',
    price: 180000,
    lifeYears: 5,
    useInstallment: false,
    note: 'หัวเตา KB5 4 หัว โต๊ะเตรียม ซิงค์ล้างจาน',
  },
  {
    id: 'ast-2',
    name: 'ตู้แช่เย็นสแตนเลส 4 ประตู & ตู้ฟรีซ',
    price: 55000,
    lifeYears: 7,
    useInstallment: false,
  },
  {
    id: 'ast-3',
    name: 'เครื่องปรับอากาศ 3 เครื่อง (ผ่อนชำระ)',
    price: 90000,
    lifeYears: 7,
    useInstallment: true,
    installmentMonthly: 3800,
    note: 'ผ่อน 24 งวด งวดละ 3,800 บาท',
  },
  {
    id: 'ast-4',
    name: 'โต๊ะ เก้าอี้ และตกแต่งโถงหน้าร้าน',
    price: 120000,
    lifeYears: 5,
    useInstallment: false,
  },
  {
    id: 'ast-5',
    name: 'เครื่องคิดเงิน POS จอสัมผัสและปริ้นเตอร์',
    price: 28000,
    lifeYears: 4,
    useInstallment: false,
  },
];

// Generate 14 days of realistic daily sales data around 10,000 - 13,000 THB/day
export const createSampleSalesDays = (): SalesDay[] => {
  const list: SalesDay[] = [];
  const baseDate = new Date();
  const salesPattern = [
    10800, 11450, 9800, 12200, 14500, 16800, 15900,
    10200, 11100, 9950, 12600, 14200, 17100, 15300,
  ];

  for (let i = 13; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const amount = salesPattern[13 - i];
    list.push({
      date: dateStr,
      amount,
      note: i === 0 ? 'วันนี้ยอดลูกค้าสม่ำเสมอ' : undefined,
    });
  }
  return list;
};

export const createSampleData = (): RootData => ({
  schemaVersion: 1,
  settings: { ...SAMPLE_SETTINGS },
  expenses: JSON.parse(JSON.stringify(SAMPLE_EXPENSES)),
  assets: JSON.parse(JSON.stringify(SAMPLE_ASSETS)),
  salesDays: createSampleSalesDays(),
});
