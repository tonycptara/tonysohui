import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  Download,
  FileSpreadsheet,
  HardDrive,
  Info,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { createSampleData } from '../data/sample';
import { createInitialData } from '../data/template';
import { RootData, Settings } from '../types';
import { computeDashboardSummary } from '../utils/calc';
import {
  formatThaiDateTime,
} from '../utils/format';
import {
  clearAllStorage,
  exportDataAsJSON,
  ImportValidationResult,
  validateImportJSON,
} from '../utils/storage';
import { Modal } from '../components/Modal';

interface SettingsPageProps {
  data: RootData;
  onUpdateRootData: (newData: RootData) => void;
  onUpdateSettings: (updater: (prev: Settings) => Settings) => void;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  data,
  onUpdateRootData,
  onUpdateSettings,
  onNotify,
}) => {
  const { settings } = data;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal states
  const [importPendingResult, setImportPendingResult] = useState<ImportValidationResult | null>(null);
  const [showClearConfirmStep1, setShowClearConfirmStep1] = useState(false);
  const [showClearConfirmStep2, setShowClearConfirmStep2] = useState(false);
  const [showResetBlankConfirm, setShowResetBlankConfirm] = useState(false);
  const [showLoadSampleConfirm, setShowLoadSampleConfirm] = useState(false);

  const summary = computeDashboardSummary(data);

  // Export JSON
  const handleExport = () => {
    const updatedData: RootData = {
      ...data,
      settings: {
        ...data.settings,
        lastBackupAt: new Date().toISOString(),
      },
    };
    onUpdateRootData(updatedData);
    exportDataAsJSON(updatedData, summary.overheadPercent);
    onNotify(
      'success',
      'ดาวน์โหลดไฟล์สำรองข้อมูล JSON เรียบร้อยแล้ว (อัปเดตวันสำรองข้อมูลแล้ว)'
    );
  };

  // Import JSON file handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = validateImportJSON(content);

      if (!result.valid) {
        onNotify('error', result.error || 'ไฟล์ข้อมูลไม่ถูกต้อง');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Valid: show confirmation modal with counts
      setImportPendingResult(result);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.onerror = () => {
      onNotify('error', 'ไม่สามารถอ่านไฟล์ได้');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!importPendingResult?.data) return;
    onUpdateRootData(importPendingResult.data);
    onNotify('success', 'นำเข้าข้อมูลสำเร็จ ข้อมูลทั้งหมดถูกอัปเดตแล้ว');
    setImportPendingResult(null);
  };

  // Load sample data
  const handleLoadSample = () => {
    const sample = createSampleData();
    onUpdateRootData(sample);
    onNotify('success', 'โหลดข้อมูลตัวอย่างร้านอาหารขนาดกลางเรียบร้อยแล้ว');
    setShowLoadSampleConfirm(false);
  };

  // Reset to blank template
  const handleResetBlank = () => {
    const blank = createInitialData();
    onUpdateRootData(blank);
    onNotify('info', 'รีเซ็ตเป็นแบบฟอร์มเปล่ามาตรฐานเรียบร้อย');
    setShowResetBlankConfirm(false);
  };

  // 2-step clear all
  const handleClearAllConfirmed = () => {
    clearAllStorage();
    const blank = createInitialData();
    onUpdateRootData(blank);
    onNotify('info', 'ล้างข้อมูลทั้งหมดในเครื่องและรีเซ็ตระบบแล้ว');
    setShowClearConfirmStep2(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          ตั้งค่าและสำรองข้อมูล (Settings & Backup)
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          ปรับแต่งสมมติฐานของร้าน และจัดการสำรองข้อมูลทั้งหมด
        </p>
      </div>

      {/* สำคัญ: คำชี้แจงการจัดเก็บข้อมูล LocalStorage */}
      <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-950 flex items-start gap-3 shadow-xs">
        <HardDrive className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm leading-relaxed">
          <span className="font-bold">ข้อมูลถูกเก็บไว้ในอุปกรณ์นี้เท่านั้น: </span>
          ระบบทำงานแบบออฟไลน์ 100% ไม่มีการส่งข้อมูลขึ้นเซิร์ฟเวอร์ใดๆ หากคุณล้างประวัติเบราว์เซอร์ (Clear Browsing Data) หรือเปลี่ยนอุปกรณ์ ข้อมูลจะหายไป จึงควรหมั่นกด <strong>"Export สำรองข้อมูล (JSON)"</strong> เพื่อเก็บไฟล์สำรองไว้อย่างสม่ำเสมอ
        </div>
      </div>

      {/* กลุ่มการตั้งค่าพื้นฐานของร้าน (Restaurant Settings) */}
      <div className="bg-white rounded-2xl border border-[#FED7AA] p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <span>ข้อมูลพื้นฐานของร้าน</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              ชื่อร้านอาหาร
            </label>
            <input
              type="text"
              value={settings.shopName}
              onChange={(e) =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  shopName: e.target.value,
                }))
              }
              placeholder="Tony's Kitchen"
              className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              จำนวนวันเปิดทำการต่อเดือน (วัน)
            </label>
            <input
              type="number"
              min="1"
              max="31"
              value={settings.operatingDaysPerMonth}
              onChange={(e) =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  operatingDaysPerMonth: Math.max(
                    1,
                    Math.min(31, parseInt(e.target.value, 10) || 30)
                  ),
                }))
              }
              className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 font-medium tabular-nums"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              ประมาณการ Food Cost % เฉลี่ยของร้าน (สำหรับจุดคุ้มทุน)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="90"
                step="any"
                value={settings.avgFoodCostPercent}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    avgFoodCostPercent: Math.max(0, parseFloat(e.target.value) || 0),
                  }))
                }
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 font-medium tabular-nums"
              />
              <span className="text-xs text-gray-500 font-bold shrink-0">%</span>
            </div>
            <span className="text-[11px] text-gray-400 mt-0.5 block">
              ปกติร้านอาหารทั่วไปอยู่ที่ 30% - 35%
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              กำไรสุทธิเป้าหมายที่ต้องการ (% ของยอดขาย)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="50"
                step="any"
                value={settings.targetProfitPercent}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    targetProfitPercent: Math.max(0, parseFloat(e.target.value) || 0),
                  }))
                }
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 font-medium tabular-nums"
              />
              <span className="text-xs text-gray-500 font-bold shrink-0">%</span>
            </div>
            <span className="text-[11px] text-gray-400 mt-0.5 block">
              เป้าหมายมาตรฐานมักอยู่ที่ 10% - 15%
            </span>
          </div>
        </div>
      </div>

      {/* สำรองข้อมูลและกู้คืน (Backup & Restore) */}
      <div className="bg-white rounded-2xl border border-[#FED7AA] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              สำรองและกู้คืนข้อมูล (Backup & Restore)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              ดาวน์โหลดเก็บไว้ในเครื่องคอมพิวเตอร์/มือถือ หรือนำกลับมาโหลดในอุปกรณ์อื่น
            </p>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
            สำรองล่าสุด: <strong className="text-gray-800">{formatThaiDateTime(settings.lastBackupAt)}</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Export Button */}
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 p-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-xs cursor-pointer transition-all min-h-[48px]"
          >
            <Download className="w-4 h-4" />
            <span>Export ข้อมูล (JSON)</span>
          </button>

          {/* Import Button */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
              id="import-json-input"
            />
            <label
              htmlFor="import-json-input"
              className="flex items-center justify-center gap-2 p-4 rounded-xl bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-bold text-xs shadow-xs cursor-pointer transition-all min-h-[48px] select-none"
            >
              <Upload className="w-4 h-4 text-orange-600" />
              <span>Import ข้อมูล (JSON)</span>
            </label>
          </div>
        </div>
      </div>

      {/* การจัดการข้อมูลเริ่มต้นและรีเซ็ต (Templates & Reset) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-gray-900">
          ชุดข้อมูลเริ่มต้นและการรีเซ็ต
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Load Sample Data */}
          <button
            onClick={() => setShowLoadSampleConfirm(true)}
            className="flex flex-col text-left p-3.5 rounded-xl border border-orange-200 bg-orange-50/40 hover:bg-orange-100/60 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2 font-bold text-xs text-orange-900 mb-1">
              <Sparkles className="w-4 h-4 text-orange-600" />
              <span>โหลดข้อมูลตัวอย่าง</span>
            </div>
            <p className="text-[11px] text-gray-600 leading-normal">
              ใส่ตัวเลขจริงของร้านอาหารขนาดกลาง (ยอดขาย 330,000 บ./ด.)
            </p>
          </button>

          {/* Reset Blank Template */}
          <button
            onClick={() => setShowResetBlankConfirm(true)}
            className="flex flex-col text-left p-3.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2 font-bold text-xs text-gray-800 mb-1">
              <FileSpreadsheet className="w-4 h-4 text-gray-500" />
              <span>รีเซ็ตเป็นแบบฟอร์มเปล่า</span>
            </div>
            <p className="text-[11px] text-gray-500 leading-normal">
              ล้างยอดเงินเป็น 0 โดยเก็บหมวดหมู่มาตรฐาน 8 หมวดไว้
            </p>
          </button>

          {/* Clear All Storage */}
          <button
            onClick={() => setShowClearConfirmStep1(true)}
            className="flex flex-col text-left p-3.5 rounded-xl border border-red-200 bg-red-50/40 hover:bg-red-100/60 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2 font-bold text-xs text-red-800 mb-1">
              <Trash2 className="w-4 h-4 text-red-600" />
              <span>ล้างข้อมูลทั้งหมด</span>
            </div>
            <p className="text-[11px] text-red-600/80 leading-normal">
              ล้างแคชในเบราว์เซอร์ทั้งหมด (ยืนยัน 2 ขั้นตอน)
            </p>
          </button>
        </div>
      </div>

      {/* Modal: Confirm Import */}
      <Modal
        isOpen={!!importPendingResult}
        onClose={() => setImportPendingResult(null)}
        title="ยืนยันการนำเข้าข้อมูล (Import)"
        footer={
          <>
            <button
              onClick={() => setImportPendingResult(null)}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleConfirmImport}
              className="px-4 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-xs cursor-pointer"
            >
              ยืนยันการเขียนทับ
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            ไฟล์ที่นำเข้ามีโครงสร้างที่ถูกต้อง พร้อมแทนที่ข้อมูลปัจจุบันด้วยรายการต่อไปนี้:
          </p>
          <div className="p-3 bg-orange-50 rounded-xl border border-orange-200 text-xs text-orange-950 space-y-1">
            <div>
              • รายการค่าใช้จ่าย: <strong>{importPendingResult?.counts?.expensesCount}</strong> รายการ
            </div>
            <div>
              • รายการสินทรัพย์/อุปกรณ์: <strong>{importPendingResult?.counts?.assetsCount}</strong> รายการ
            </div>
            <div>
              • ข้อมูลยอดขายรายวัน: <strong>{importPendingResult?.counts?.salesDaysCount}</strong> วัน
            </div>
          </div>
          <p className="text-xs text-red-600 font-semibold">
            * การนำเข้าจะเขียนทับข้อมูลทั้งหมดในปัจจุบัน หากไม่แน่ใจให้กด Export สำรองข้อมูลเดิมไว้ก่อน
          </p>
        </div>
      </Modal>

      {/* Modal: Confirm Load Sample */}
      <Modal
        isOpen={showLoadSampleConfirm}
        onClose={() => setShowLoadSampleConfirm(false)}
        title="ยืนยันการโหลดข้อมูลตัวอย่าง"
        footer={
          <>
            <button
              onClick={() => setShowLoadSampleConfirm(false)}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleLoadSample}
              className="px-4 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-xs cursor-pointer"
            >
              โหลดข้อมูลตัวอย่าง
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-700">
          คุณต้องการโหลดข้อมูลตัวอย่างร้านอาหารขนาดกลางใช่หรือไม่? ข้อมูลที่มีอยู่เดิมจะถูกแทนที่ด้วยข้อมูลตัวอย่าง
        </p>
      </Modal>

      {/* Modal: Confirm Reset Blank */}
      <Modal
        isOpen={showResetBlankConfirm}
        onClose={() => setShowResetBlankConfirm(false)}
        title="ยืนยันการรีเซ็ตเป็นแบบฟอร์มเปล่า"
        footer={
          <>
            <button
              onClick={() => setShowResetBlankConfirm(false)}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleResetBlank}
              className="px-4 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-xs cursor-pointer"
            >
              รีเซ็ตเป็นฟอร์มเปล่า
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-700">
          คุณต้องการล้างตัวเลขทั้งหมดให้เป็นแบบฟอร์มเปล่าเริ่มต้น (ยอดเงิน 0 บาท) ใช่หรือไม่?
        </p>
      </Modal>

      {/* Modal: Clear All Step 1 */}
      <Modal
        isOpen={showClearConfirmStep1}
        onClose={() => setShowClearConfirmStep1(false)}
        title="ยืนยันการล้างข้อมูล (ขั้นตอนที่ 1 จาก 2)"
        footer={
          <>
            <button
              onClick={() => setShowClearConfirmStep1(false)}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              onClick={() => {
                setShowClearConfirmStep1(false);
                setShowClearConfirmStep2(true);
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs cursor-pointer"
            >
              ต่อไปยังขั้นตอนที่ 2
            </button>
          </>
        }
      >
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            คุณกำลังจะลบข้อมูลทั้งหมดที่บันทึกไว้ในเบราว์เซอร์นี้ รวมถึงยอดขาย ค่าใช้จ่าย และสินทรัพย์ทั้งหมด
          </p>
          <p className="text-xs text-red-600 font-semibold">
            หากดำเนินการแล้วจะไม่สามารถกู้คืนได้เว้นแต่คุณจะมีไฟล์ JSON สำรอง
          </p>
        </div>
      </Modal>

      {/* Modal: Clear All Step 2 */}
      <Modal
        isOpen={showClearConfirmStep2}
        onClose={() => setShowClearConfirmStep2(false)}
        title="คำเตือนขั้นสุดท้าย (ขั้นตอนที่ 2 จาก 2)"
        footer={
          <>
            <button
              onClick={() => setShowClearConfirmStep2(false)}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleClearAllConfirmed}
              className="px-4 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-xl shadow-xs cursor-pointer"
            >
              ยืนยันการล้างข้อมูลทั้งหมดเด็ดขาด
            </button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-red-900">
          <div className="flex items-center gap-2 font-bold text-red-700">
            <ShieldAlert className="w-5 h-5" />
            <span>คุณแน่ใจ 100% หรือไม่?</span>
          </div>
          <p>
            ข้อมูลทั้งหมดในเครื่องจะถูกลบทันทีและระบบจะเริ่มใหม่เป็นแบบฟอร์มเปล่า
          </p>
        </div>
      </Modal>
    </div>
  );
};
