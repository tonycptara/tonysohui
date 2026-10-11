import { RootData } from '../types';
import { createInitialData } from '../data/template';

export const STORAGE_KEY = 'tonys-kitchen-overhead-v1';
export const FIRST_LAUNCH_KEY = 'tonys-kitchen-overhead-initialized-v1';

/**
 * เรียก navigator.storage.persist() เมื่อเปิดเว็บครั้งแรกเพื่อป้องกันเบราว์เซอร์ลบข้อมูล
 */
export async function requestPersistentStorage(): Promise<void> {
  try {
    if (navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persist();
      console.log('Storage persisted:', isPersisted);
    }
  } catch (err) {
    console.warn('Storage persist request failed (ignorable):', err);
  }
}

/**
 * โหลดข้อมูลจาก localStorage พร้อมการตรวจสอบความถูกต้องและ fallback
 */
export function loadDataFromStorage(): {
  data: RootData;
  isFirstLaunch: boolean;
  error?: string;
} {
  const initialized = localStorage.getItem(FIRST_LAUNCH_KEY);
  const isFirstLaunch = !initialized;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        data: createInitialData(),
        isFirstLaunch,
      };
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || parsed.schemaVersion !== 1) {
      console.warn('Invalid schemaVersion or data structure in storage');
      return {
        data: createInitialData(),
        isFirstLaunch,
        error: 'โครงสร้างข้อมูลในเครื่องไม่ตรงรุ่น ระบบได้สร้างแบบฟอร์มใหม่ให้เรียบร้อยแล้ว',
      };
    }

    // Sanitize missing fields if any
    const initial = createInitialData();
    const data: RootData = {
      schemaVersion: 1,
      settings: {
        ...initial.settings,
        ...(parsed.settings || {}),
        expected: {
          ...initial.settings.expected,
          ...(parsed.settings?.expected || {}),
        },
      },
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : initial.expenses,
      assets: Array.isArray(parsed.assets) ? parsed.assets : [],
      salesDays: Array.isArray(parsed.salesDays) ? parsed.salesDays : [],
    };

    return {
      data,
      isFirstLaunch,
    };
  } catch (err) {
    console.error('Failed to parse data from localStorage:', err);
    return {
      data: createInitialData(),
      isFirstLaunch,
      error: 'เกิดข้อผิดพลาดในการอ่านข้อมูลในเครื่อง ระบบได้กู้คืนค่าเริ่มต้นให้แล้ว',
    };
  }
}

/**
 * บันทึกข้อมูลลงใน localStorage
 */
export function saveDataToStorage(data: RootData): { success: boolean; error?: string } {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, serialized);
    localStorage.setItem(FIRST_LAUNCH_KEY, 'true');
    return { success: true };
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
    return {
      success: false,
      error: 'ไม่สามารถบันทึกข้อมูลลงในเบราว์เซอร์ได้ (พื้นที่จัดเก็บอาจเต็มหรือถูกบล็อก)',
    };
  }
}

/**
 * ล้างข้อมูลทั้งหมดใน localStorage
 */
export function clearAllStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(FIRST_LAUNCH_KEY);
  } catch (err) {
    console.error('Error clearing localStorage:', err);
  }
}

/**
 * Export ไฟล์ JSON
 */
export function exportDataAsJSON(
  data: RootData,
  currentOverheadPercent: number | null
): void {
  const exportPayload = {
    schemaVersion: 1,
    exportDate: new Date().toISOString(),
    overheadPercentOfSales: currentOverheadPercent !== null ? Number(currentOverheadPercent.toFixed(2)) : null,
    settings: data.settings,
    expenses: data.expenses,
    assets: data.assets,
    salesDays: data.salesDays,
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const todayStr = new Date().toISOString().split('T')[0];
  const filename = `tonys-kitchen-overhead-backup-${todayStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * ตรวจสอบไฟล์ Import JSON
 */
export interface ImportValidationResult {
  valid: boolean;
  data?: RootData;
  error?: string;
  counts?: {
    expensesCount: number;
    assetsCount: number;
    salesDaysCount: number;
  };
}

export function validateImportJSON(rawContent: string): ImportValidationResult {
  try {
    const parsed = JSON.parse(rawContent);
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'รูปแบบไฟล์ไม่ถูกต้อง (ไม่ใช่ไฟล์ JSON)' };
    }

    if (parsed.schemaVersion !== 1) {
      return {
        valid: false,
        error: `เวอร์ชัน schema ไม่รองรับ (ต้องการเวอร์ชัน 1 แต่พบ ${parsed.schemaVersion || 'ไม่ระบุ'})`,
      };
    }

    if (!parsed.settings || !Array.isArray(parsed.expenses)) {
      return {
        valid: false,
        error: 'โครงสร้างข้อมูลไม่สมบูรณ์ ขาดข้อมูลการตั้งค่าหรือรายการค่าใช้จ่าย',
      };
    }

    const defaultInit = createInitialData();
    const data: RootData = {
      schemaVersion: 1,
      settings: {
        ...defaultInit.settings,
        ...(parsed.settings || {}),
        expected: {
          ...defaultInit.settings.expected,
          ...(parsed.settings?.expected || {}),
        },
      },
      expenses: parsed.expenses,
      assets: Array.isArray(parsed.assets) ? parsed.assets : [],
      salesDays: Array.isArray(parsed.salesDays) ? parsed.salesDays : [],
    };

    return {
      valid: true,
      data,
      counts: {
        expensesCount: data.expenses.length,
        assetsCount: data.assets.length,
        salesDaysCount: data.salesDays.length,
      },
    };
  } catch {
    return {
      valid: false,
      error: 'ไฟล์ JSON เสียหายหรือไม่สามารถอ่านข้อความได้',
    };
  }
}
