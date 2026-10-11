import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  HelpCircle,
  History,
  Info,
  Lightbulb,
  Plus,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { RootData, SalesBasis, SalesDay, Settings } from '../types';
import {
  calculateMonthlySalesByBasis,
} from '../utils/calc';
import {
  formatBaht,
  formatBahtRaw,
  formatInteger,
  formatThaiDate,
} from '../utils/format';
import { Modal } from '../components/Modal';

interface SalesPageProps {
  settings: Settings;
  salesDays: SalesDay[];
  onUpdateSettings: (updater: (prev: Settings) => Settings) => void;
  onUpdateSalesDays: (updater: (prev: SalesDay[]) => SalesDay[]) => void;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const SalesPage: React.FC<SalesPageProps> = ({
  settings,
  salesDays,
  onUpdateSettings,
  onUpdateSalesDays,
  onNotify,
}) => {
  // Today's date string YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  const [dateInput, setDateInput] = useState(todayStr);
  const [amountInput, setAmountInput] = useState<number | ''>('');
  const [noteInput, setNoteInput] = useState('');
  const [editingDay, setEditingDay] = useState<SalesDay | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<SalesDay | null>(null);

  // Sorting sales days by date descending
  const sortedSalesDays = [...salesDays].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Computed monthly sales for all 3 bases (ex-VAT)
  const expectedMonthlySales = calculateMonthlySalesByBasis(
    'expected',
    settings,
    salesDays
  );
  const manualMonthlySalesVal = calculateMonthlySalesByBasis(
    'manual',
    settings,
    salesDays
  );
  const actualMonthlySalesVal = calculateMonthlySalesByBasis(
    'actual',
    settings,
    salesDays
  );

  // Actual days window stats
  const targetDays = settings.actualAverageDays || 14;
  const recentWindow = sortedSalesDays.slice(0, targetDays);
  const recentWindowTotal = recentWindow.reduce(
    (sum, d) => sum + (Number(d.amount) || 0),
    0
  );
  const recentDailyAverage =
    recentWindow.length > 0 ? recentWindowTotal / recentWindow.length : 0;

  const handleSaveDailySales = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateInput) {
      onNotify('error', 'กรุณาระบุวันที่');
      return;
    }
    const amountNum = Number(amountInput);
    if (isNaN(amountNum) || amountNum < 0) {
      onNotify('error', 'กรุณาระบุยอดขายเป็นตัวเลขที่ถูกต้อง (ตั้งแต่ 0 ขึ้นไป)');
      return;
    }

    // Upsert by date: if date already exists, update it!
    const existingIndex = salesDays.findIndex((d) => d.date === dateInput);
    if (existingIndex >= 0) {
      onUpdateSalesDays((prev) =>
        prev.map((item) =>
          item.date === dateInput
            ? {
                ...item,
                amount: amountNum,
                note: noteInput.trim() || undefined,
              }
            : item
        )
      );
      onNotify('success', `อัปเดตยอดขายวันที่ ${formatThaiDate(dateInput)} เรียบร้อย`);
    } else {
      const newEntry: SalesDay = {
        date: dateInput,
        amount: amountNum,
        note: noteInput.trim() || undefined,
      };
      onUpdateSalesDays((prev) => [...prev, newEntry]);
      onNotify('success', `บันทึกยอดขายวันที่ ${formatThaiDate(dateInput)} สำเร็จ`);
    }

    // Reset inputs
    setEditingDay(null);
    setAmountInput('');
    setNoteInput('');
  };

  const handleStartEditDay = (day: SalesDay) => {
    setEditingDay(day);
    setDateInput(day.date);
    setAmountInput(day.amount);
    setNoteInput(day.note || '');
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingDay(null);
    setDateInput(todayStr);
    setAmountInput('');
    setNoteInput('');
  };

  const confirmDeleteDay = () => {
    if (!deleteCandidate) return;
    onUpdateSalesDays((prev) => prev.filter((d) => d.date !== deleteCandidate.date));
    onNotify('info', `ลบข้อมูลวันที่ ${formatThaiDate(deleteCandidate.date)} แล้ว`);
    setDeleteCandidate(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          ยอดขาย (Sales Base)
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          ยอดขายคือฐานที่นำมาหารค่าใช้จ่ายโสหุ้ยเพื่อคิดเป็นเปอร์เซ็นต์ แนะนำให้เลือกฐานที่สะท้อนความจริงที่สุด
        </p>
      </div>

      {/* Global VAT Setting for Sales Inputs */}
      <div className="bg-white rounded-2xl border border-[#FED7AA] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <label className="flex items-start sm:items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={settings.salesInputsIncludeVat}
            onChange={(e) =>
              onUpdateSettings((prev) => ({
                ...prev,
                salesInputsIncludeVat: e.target.checked,
              }))
            }
            className="w-5 h-5 mt-0.5 sm:mt-0 text-orange-500 rounded border-gray-300 focus:ring-orange-400"
          />
          <div>
            <span className="text-xs sm:text-sm font-bold text-gray-900 block sm:inline">
              ตัวเลขยอดขายที่กรอก “รวม VAT แล้ว”
            </span>
            <span className="text-xs text-gray-500 block sm:inline sm:ml-2">
              (ระบบจะคำนวณถอด VAT {settings.vatRatePercent}% ออกให้อัตโนมัติ เพราะโสหุ้ยต้องคิดเทียบกับราคาขายก่อน VAT เสมอ)
            </span>
          </div>
        </label>

        {settings.salesInputsIncludeVat && (
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto text-xs bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-200">
            <span className="text-gray-600">อัตรา VAT:</span>
            <input
              type="number"
              min="0"
              max="20"
              step="any"
              value={settings.vatRatePercent}
              onChange={(e) =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  vatRatePercent: parseFloat(e.target.value) || 7,
                }))
              }
              className="w-14 px-1.5 py-0.5 bg-white border border-gray-300 rounded text-center font-bold text-orange-600 focus:outline-none"
            />
            <span className="font-bold text-gray-600">%</span>
          </div>
        )}
      </div>

      {/* 3 Sections corresponding to sales bases */}
      <div className="space-y-6">
        {/* Section 1: ประมาณการ (สำหรับร้านเปิดใหม่) */}
        <div
          className={`bg-white rounded-2xl border-2 transition-all p-5 sm:p-6 shadow-xs space-y-4 ${
            settings.salesBasis === 'expected'
              ? 'border-orange-500 ring-2 ring-orange-100'
              : 'border-[#FED7AA]'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 font-bold text-sm flex items-center justify-center">
                1
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-gray-900">
                  ประมาณการ (สำหรับร้านเปิดใหม่)
                </h2>
                <span className="text-xs text-gray-500">
                  คำนวณจากความจุที่นั่ง รอบการหมุน และยอดใช้จ่ายต่อหัว
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onUpdateSettings((prev) => ({ ...prev, salesBasis: 'expected' }));
                onNotify('success', 'เลือกใช้ฐาน "ประมาณการร้านใหม่" แล้ว');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                settings.salesBasis === 'expected'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-gray-100 hover:bg-orange-50 text-gray-700 hover:text-orange-700'
              }`}
            >
              {settings.salesBasis === 'expected' ? '✓ กำลังใช้งานฐานนี้' : 'เลือกใช้ฐานนี้'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                จำนวนที่นั่งในร้าน (Seats)
              </label>
              <input
                type="number"
                min="1"
                value={settings.expected.seats || ''}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    expected: {
                      ...prev.expected,
                      seats: Math.max(0, parseInt(e.target.value, 10) || 0),
                    },
                  }))
                }
                placeholder="40"
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 font-medium tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                รอบหมุนเวียนต่อวัน (Table Turns)
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={settings.expected.turnsPerDay || ''}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    expected: {
                      ...prev.expected,
                      turnsPerDay: Math.max(0, parseFloat(e.target.value) || 0),
                    },
                  }))
                }
                placeholder="2.5"
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 font-medium tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                ยอดใช้จ่ายเฉลี่ยต่อหัว (บาท/คน)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={settings.expected.avgSpendPerHead || ''}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    expected: {
                      ...prev.expected,
                      avgSpendPerHead: Math.max(0, parseFloat(e.target.value) || 0),
                    },
                  }))
                }
                placeholder="110"
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 font-medium tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                วันเปิดร้านต่อเดือน (วัน)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={settings.operatingDaysPerMonth || ''}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    operatingDaysPerMonth: Math.max(
                      1,
                      Math.min(31, parseInt(e.target.value, 10) || 30)
                    ),
                  }))
                }
                placeholder="30"
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 font-medium tabular-nums"
              />
            </div>
          </div>

          {/* Conservative Hint in Thai */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-amber-950">คำแนะนำการประมาณการแบบอนุรักษนิยม (Conservative):</strong>{' '}
              ช่วงแรกควรประเมินรอบโต๊ะเพียง 1.5 - 2.0 รอบต่อวัน และยอดต่อหัวอิงตามราคาอาหารจานหลัก 1 จาน + น้ำเปล่า เพื่อไม่ให้คาดหวังยอดขายสูงเกินไปจนทำให้ % โสหุ้ยต่ำเกินจริงจนขายขาดทุน
            </div>
          </div>

          {/* Live Result of Expected */}
          <div className="flex items-center justify-between p-3.5 bg-[#FFFBF5] rounded-xl border border-orange-100">
            <span className="text-xs font-semibold text-gray-700">
              ยอดขายรายเดือนที่ได้จากการประมาณการ (ก่อน VAT):
            </span>
            <span className="text-base font-bold text-orange-950 tabular-nums">
              {formatBaht(expectedMonthlySales)} / เดือน
            </span>
          </div>
        </div>

        {/* Section 2: กรอกยอดขายต่อเดือนเอง */}
        <div
          className={`bg-white rounded-2xl border-2 transition-all p-5 sm:p-6 shadow-xs space-y-4 ${
            settings.salesBasis === 'manual'
              ? 'border-orange-500 ring-2 ring-orange-100'
              : 'border-[#FED7AA]'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 font-bold text-sm flex items-center justify-center">
                2
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-gray-900">
                  กรอกยอดขายต่อเดือนเอง
                </h2>
                <span className="text-xs text-gray-500">
                  สำหรับร้านที่มีเป้าหมายยอดขายรวมประจำเดือนในใจอยู่แล้ว
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onUpdateSettings((prev) => ({ ...prev, salesBasis: 'manual' }));
                onNotify('success', 'เลือกใช้ฐาน "กรอกยอดขายต่อเดือนเอง" แล้ว');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                settings.salesBasis === 'manual'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-gray-100 hover:bg-orange-50 text-gray-700 hover:text-orange-700'
              }`}
            >
              {settings.salesBasis === 'manual' ? '✓ กำลังใช้งานฐานนี้' : 'เลือกใช้ฐานนี้'}
            </button>
          </div>

          <div className="max-w-md">
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              ยอดขายเป้าหมายต่อเดือน (บาท)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="any"
                value={settings.manualMonthlySales === 0 ? '' : settings.manualMonthlySales}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    manualMonthlySales: Math.max(0, parseFloat(e.target.value) || 0),
                  }))
                }
                placeholder="เช่น 330000"
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 font-medium tabular-nums"
              />
              <span className="text-xs text-gray-500 shrink-0">บาท/เดือน</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-[#FFFBF5] rounded-xl border border-orange-100">
            <span className="text-xs font-semibold text-gray-700">
              ยอดขายที่นำมาเป็นฐานคำนวณ (ก่อน VAT):
            </span>
            <span className="text-base font-bold text-orange-950 tabular-nums">
              {formatBaht(manualMonthlySalesVal)} / เดือน
            </span>
          </div>
        </div>

        {/* Section 3: บันทึกยอดขายรวมรายวัน */}
        <div
          className={`bg-white rounded-2xl border-2 transition-all p-5 sm:p-6 shadow-xs space-y-4 ${
            settings.salesBasis === 'actual'
              ? 'border-orange-500 ring-2 ring-orange-100'
              : 'border-[#FED7AA]'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 font-bold text-sm flex items-center justify-center">
                3
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-gray-900">
                  บันทึกยอดขายรวมรายวัน (ONE number per day)
                </h2>
                <span className="text-xs text-gray-500">
                  กรอกเพียงยอดรวมวันละ 1 ตัวเลข ไม่ต้องบันทึกแยกเมนู
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onUpdateSettings((prev) => ({ ...prev, salesBasis: 'actual' }));
                onNotify('success', 'เลือกใช้ฐาน "เฉลี่ยยอดขายจริง" แล้ว');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                settings.salesBasis === 'actual'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-gray-100 hover:bg-orange-50 text-gray-700 hover:text-orange-700'
              }`}
            >
              {settings.salesBasis === 'actual' ? '✓ กำลังใช้งานฐานนี้' : 'เลือกใช้ฐานนี้'}
            </button>
          </div>

          {/* Thai Tip: How to get daily total in 30 seconds */}
          <div className="p-4 bg-orange-50/80 rounded-xl border border-orange-200 text-xs text-orange-950 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-orange-900">
              <Clock className="w-4 h-4 text-orange-600" />
              <span>วิธีหายอดรวมต่อวันใน 30 วินาที ตอนปิดร้าน:</span>
            </div>
            <p className="text-gray-700 leading-relaxed pl-5">
              นับเงินสดที่ขายได้จริงในลิ้นชัก (หักเงินทอนเริ่มต้นออก) + รวมยอดสลิปโอนเงิน/สแกน QR ธนาคาร + ยอดสรุปจากแอปเดลิเวอรี่/เครื่องรูดบัตร นำมารวมกันเป็นยอดเดียวแล้วกรอกลงช่องด้านล่างได้ทันที ไม่ต้องเสียเวลาคีย์ทีละจาน!
            </p>
          </div>

          {/* Warning if fewer than 7 days */}
          {salesDays.length < 7 && (
            <div className="p-3 bg-[#FEF9C3] rounded-xl border border-amber-300 text-xs text-amber-950 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>ข้อมูลยังน้อย ({salesDays.length} วัน):</strong> ผลอาจคลาดเคลื่อน แนะนำให้บันทึกติดต่อกันอย่างน้อย 7–14 วัน เพื่อให้ได้ค่าเฉลี่ยที่นิ่งและแม่นยำ
              </span>
            </div>
          )}

          {/* Input Form for Daily Sales */}
          <form
            onSubmit={handleSaveDailySales}
            className="p-4 bg-gray-50/70 rounded-xl border border-gray-200 space-y-3"
          >
            <div className="text-xs font-bold text-gray-800">
              {editingDay ? `แก้ไขยอดขายวันที่ ${formatThaiDate(editingDay.date)}` : 'บันทึกยอดขายวันนี้'}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  วันที่ *
                </label>
                <input
                  type="date"
                  required
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  ยอดขายรวมของวัน (บาท) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={amountInput}
                  onChange={(e) =>
                    setAmountInput(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                  placeholder="เช่น 11500"
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 font-medium tabular-nums"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  หมายเหตุ (ไม่บังคับ)
                </label>
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="เช่น ฝนตกหนัก, วันหยุดยาว"
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              {editingDay && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3.5 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer min-h-[38px] flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{editingDay ? 'บันทึกการแก้ไข' : 'บันทึกยอดขายวันนี้'}</span>
              </button>
            </div>
          </form>

          {/* Actual Sales Analytics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#FFFBF5] rounded-xl border border-orange-100 text-xs">
            <div>
              <div className="text-gray-500 mb-1">ช่วงวันที่นำมาเฉลี่ย:</div>
              <div className="flex items-center gap-1">
                {([7, 14, 30] as const).map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        actualAverageDays: days,
                      }))
                    }
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      settings.actualAverageDays === days
                        ? 'bg-orange-500 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {days} วันล่าสุด
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-gray-500">ยอดขายเฉลี่ยต่อวัน (จาก {recentWindow.length} วัน):</div>
              <div className="text-base font-bold text-gray-900 tabular-nums mt-0.5">
                {formatBaht(recentDailyAverage)} / วัน
              </div>
            </div>

            <div>
              <div className="text-gray-500">ยอดขายเทียบเท่าต่อเดือน (ก่อน VAT):</div>
              <div className="text-base font-bold text-orange-950 tabular-nums mt-0.5">
                {formatBaht(actualMonthlySalesVal)} / เดือน
              </div>
            </div>
          </div>

          {/* Table of Logged Days */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-700">
              <span className="flex items-center gap-1.5">
                <History className="w-4 h-4 text-orange-500" />
                ประวัติยอดขายที่บันทึกแล้ว ({salesDays.length} รายการ)
              </span>
            </div>

            {salesDays.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl">
                ยังไม่มีข้อมูลยอดขายรายวัน เริ่มบันทึกยอดขายแรกได้ที่ฟอร์มด้านบน
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100 text-xs">
                {sortedSalesDays.map((item) => (
                  <div
                    key={item.date}
                    className="p-3 flex items-center justify-between hover:bg-orange-50/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-24 font-semibold text-gray-800">
                        {formatThaiDate(item.date)}
                      </div>
                      <div className="font-bold text-gray-900 tabular-nums">
                        {formatBaht(item.amount)}
                      </div>
                      {item.note && (
                        <span className="text-gray-400 hidden sm:inline">
                          ({item.note})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEditDay(item)}
                        className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                        title="แก้ไข"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteCandidate(item)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="ลบ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Confirm Delete Sales Day */}
      <Modal
        isOpen={!!deleteCandidate}
        onClose={() => setDeleteCandidate(null)}
        title="ยืนยันการลบยอดขาย"
        footer={
          <>
            <button
              onClick={() => setDeleteCandidate(null)}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              onClick={confirmDeleteDay}
              className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs cursor-pointer"
            >
              ยืนยันการลบ
            </button>
          </>
        }
      >
        <p className="text-gray-700 text-sm">
          คุณต้องการลบข้อมูลยอดขายประจำวันที่{' '}
          <strong className="text-gray-900">
            {deleteCandidate ? formatThaiDate(deleteCandidate.date) : ''}
          </strong>{' '}
          จำนวน{' '}
          <strong className="text-gray-900">
            {deleteCandidate ? formatBaht(deleteCandidate.amount) : ''}
          </strong>{' '}
          ใช่หรือไม่?
        </p>
      </Modal>
    </div>
  );
};
