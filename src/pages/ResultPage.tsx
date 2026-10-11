import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clipboard,
  Copy,
  DollarSign,
  Info,
  Scale,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { RootData, SalesBasis } from '../types';
import { computeDashboardSummary } from '../utils/calc';
import {
  copyTextToClipboard,
  formatBaht,
  formatBahtRaw,
  formatPercent,
  formatPercentRaw,
  formatThaiDateTime,
} from '../utils/format';

interface ResultPageProps {
  data: RootData;
  onUpdateSettings: (updater: (prev: RootData['settings']) => RootData['settings']) => void;
  onNavigateTab: (tab: 'expenses' | 'assets' | 'sales' | 'settings') => void;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const ResultPage: React.FC<ResultPageProps> = ({
  data,
  onUpdateSettings,
  onNavigateTab,
  onNotify,
}) => {
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const summary = computeDashboardSummary(data);
  const { settings } = data;

  // ตรวจสอบสถานะการสำรองข้อมูลย้อนหลัง 7 วัน
  const isBackupOutdated = (() => {
    if (!settings.lastBackupAt) return true;
    try {
      const last = new Date(settings.lastBackupAt).getTime();
      const now = new Date().getTime();
      const diffDays = (now - last) / (1000 * 60 * 60 * 24);
      return diffDays >= 7;
    } catch {
      return true;
    }
  })();

  const basisLabelMap: Record<SalesBasis, string> = {
    expected: 'ประมาณการร้านใหม่',
    manual: 'กรอกยอดรายเดือนเอง',
    actual: 'เฉลี่ยยอดขายจริง',
  };

  // การคัดลอกเฉพาะตัวเลข (เช่น "35.0")
  const handleCopyNumber = async () => {
    if (summary.overheadPercent === null) {
      onNotify('error', 'ไม่มียอดขาย จึงยังไม่สามารถคำนวณ % โสหุ้ยได้');
      return;
    }
    const numText = summary.overheadPercent.toFixed(1);
    const success = await copyTextToClipboard(numText);
    if (success) {
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 2000);
      onNotify('success', `คัดลอกตัวเลข ${numText}% แล้ว พร้อมวางในแอปคำนวณต้นทุนอาหาร`);
    } else {
      onNotify('error', 'ไม่สามารถคัดลอกได้ กรุณาคัดลอกด้วยตนเอง');
    }
  };

  // การคัดลอกข้อความสรุปฉบับย่อภาษาไทย
  const handleCopySummaryText = async () => {
    const lines = [
      `📊 สรุปผลคำนวณโสหุ้ยร้าน: ${settings.shopName || "Tony's Kitchen"}`,
      `⭐ โสหุ้ยที่แนะนำ: ${
        summary.overheadPercent !== null
          ? `${summary.overheadPercent.toFixed(1)}% ของราคาขาย (ก่อน VAT)`
          : 'ยังระบุไม่ได้ (กรุณากรอกยอดขาย)'
      }`,
      `💰 ขายเมนู 100 บาท มีต้นทุนโสหุ้ยแฝง: ${
        summary.overheadPercent !== null
          ? `${summary.overheadPercent.toFixed(1)} บาท`
          : '-'
      }`,
      `🏢 ต้นทุนคงที่ทั้งหมด: ${formatBaht(summary.fixedTotal)}/เดือน`,
      `📈 ยอดขายฐานที่ใช้ (${basisLabelMap[settings.salesBasis]}): ${formatBaht(
        summary.activeSales
      )}/เดือน`,
      `💵 รวมโสหุ้ยทุกประเภทรวมกัน: ${formatBaht(summary.overheadBaht)}/เดือน`,
      summary.breakEvenSales !== null
        ? `⚖️ ยอดขายจุดคุ้มทุน: ${formatBaht(
            summary.breakEvenSales
          )}/เดือน (${formatBaht(summary.breakEvenDaily)}/วัน)`
        : '⚖️ จุดคุ้มทุน: ยังคำนวณไม่ได้ (ต้นทุนเกิน 100%)',
      summary.targetProfitSales !== null
        ? `🎯 ยอดขายเพื่อให้ได้กำไร ${settings.targetProfitPercent}%: ${formatBaht(
            summary.targetProfitSales
          )}/เดือน`
        : '',
      `📅 คำนวณ ณ วันที่: ${new Date().toLocaleDateString('th-TH')}`,
    ]
      .filter(Boolean)
      .join('\n');

    const success = await copyTextToClipboard(lines);
    if (success) {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
      onNotify('success', 'คัดลอกข้อความสรุปทั้งหมดแล้ว');
    } else {
      onNotify('error', 'ไม่สามารถคัดลอกข้อความได้');
    }
  };

  const handleSelectBasis = (basis: SalesBasis) => {
    onUpdateSettings((prev) => ({
      ...prev,
      salesBasis: basis,
    }));
    onNotify('info', `เปลี่ยนฐานยอดขายเป็น "${basisLabelMap[basis]}" เรียบร้อย`);
  };

  return (
    <div className="space-y-6">
      {/* แจ้งเตือนเรื่องการสำรองข้อมูล (ถ้านานกว่า 7 วัน หรือยังไม่เคย) */}
      {isBackupOutdated && (
        <div className="p-4 rounded-xl bg-[#FEF9C3] border border-amber-300 text-amber-900 flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-bold">ข้อมูลเก็บเฉพาะในเบราว์เซอร์นี้: </span>
              {settings.lastBackupAt ? (
                <span>
                  สำรองข้อมูลล่าสุดเมื่อ {formatThaiDateTime(settings.lastBackupAt)}{' '}
                  (เกิน 7 วันแล้ว) เพื่อความปลอดภัยแนะนำให้กด Export สำรองไฟล์ไว้
                </span>
              ) : (
                <span>
                  ยังไม่เคยสำรองข้อมูลเลย หากล้างประวัติเบราว์เซอร์ข้อมูลอาจหายได้ แนะนำให้กด Export ไว้
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('settings')}
            className="text-xs font-bold text-amber-800 hover:text-amber-950 underline shrink-0 whitespace-nowrap cursor-pointer"
          >
            ไปที่หน้าตั้งค่า &rarr;
          </button>
        </div>
      )}

      {/* แถบการเตือนสำคัญ (Warnings) */}
      <div className="space-y-3">
        {/* เตือน 1: โสหุ้ย > 50% */}
        {summary.overheadPercent !== null && summary.overheadPercent > 50 && (
          <div className="p-4 rounded-xl bg-[#FEE2E2] border border-red-300 text-[#991B1B] flex items-start gap-3 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm leading-relaxed">
              <span className="font-bold">โสหุ้ยสูงมาก ({summary.overheadPercent.toFixed(1)}%): </span>
              ถ้าขายได้ตามนี้ร้านอาจขาดทุน เนื่องจากต้นทุนอาหารมักอยู่ที่ 30-35% เมื่อรวมกับโสหุ้ยที่เกิน 50% ทำให้เหลือกำไรน้อยมากหรือไม่เหลือกำไรเลย แนะนำให้ตรวจสอบค่าใช้จ่ายคงที่ หรือวางแผนเพิ่มยอดขาย
            </div>
          </div>
        )}

        {/* เตือน 2: โสหุ้ย > 40% และยอดจริงยังไม่มีข้อมูล */}
        {summary.overheadPercent !== null &&
          summary.overheadPercent > 40 &&
          (settings.salesBasis === 'expected' || settings.salesBasis === 'manual') &&
          summary.actualDaysLogged === 0 && (
            <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-950 flex items-start gap-3 shadow-xs">
              <Info className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <div className="text-sm leading-relaxed">
                <span className="font-bold">คำแนะนำสำหรับร้านเปิดใหม่: </span>
                โสหุ้ยช่วงแรกอาจดูสูง ({summary.overheadPercent.toFixed(1)}%) เพราะร้านอาหารใหม่ควรใช้ตัวเลขยอดขายเป้าหมายตามความจุร้านที่แท้จริง ไม่ใช่ยอดสัปดาห์แรก เมื่อเปิดร้านไปแล้ว 1–2 เดือนและมีบันทึกยอดขายจริงสม่ำเสมอ ให้สลับมาใช้ฐาน "เฉลี่ยยอดขายจริง" เพื่อความแม่นยำสูงสุด
              </div>
            </div>
          )}

        {/* เตือน 3: ยังไม่ได้ใส่เงินเดือนเจ้าของ */}
        {!summary.hasOwnerSalary && (
          <div className="p-4 rounded-xl bg-[#FEF9C3] border border-yellow-300 text-yellow-950 flex items-start justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm leading-relaxed">
                <span className="font-bold">คุณยังไม่ได้ใส่เงินเดือนของเจ้าของ: </span>
                กำไรอาจดูสูงเกินจริงในรายงาน หากเจ้าของลงแรงทำงานในร้านด้วย ควรตั้งเงินเดือนสมมติให้ตัวเองในหมวดค่าแรง เพื่อให้คำนวณต้นทุนที่แท้จริงได้ถูกต้อง
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('expenses')}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 underline shrink-0 whitespace-nowrap cursor-pointer"
            >
              แก้ไขในค่าใช้จ่าย &rarr;
            </button>
          </div>
        )}

        {/* เตือน 4: มีหมวดหมู่ที่มียอดเป็น 0 ทั้งหมด */}
        {summary.zeroCategories.length > 0 && (
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 flex items-center justify-between text-xs">
            <span>
              💡 มีบางหมวดค่าใช้จ่ายที่ยอดรวมเป็น 0 บาท (เช่น ซ่อมบำรุง หรือของใช้สิ้นเปลือง) อย่าลืมตรวจสอบว่ามีค่าใช้จ่ายแฝงตกหล่นหรือไม่
            </span>
            <button
              onClick={() => onNavigateTab('expenses')}
              className="font-bold text-orange-600 hover:text-orange-800 underline shrink-0 whitespace-nowrap ml-2 cursor-pointer"
            >
              ตรวจดูรายการ
            </button>
          </div>
        )}
      </div>

      {/* บัตรผลลัพธ์หลักเด่นชัด (Big Highlight Card) */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        {/* Subtle decorative background graphic */}
        <div
          className="absolute -right-10 -bottom-10 w-60 h-60 rounded-full bg-white/10 blur-2xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold tracking-wider uppercase text-orange-100 bg-white/20 px-3 py-1 rounded-full inline-block mb-2">
                ตัวเลขสำหรับใส่ใน Food Cost
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                โสหุ้ยที่แนะนำ:{' '}
                {summary.overheadPercent !== null ? (
                  <span className="text-amber-200 tabular-nums">
                    {summary.overheadPercent.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-orange-200">- %</span>
                )}{' '}
                <span className="text-base sm:text-lg font-normal text-orange-100">
                  ของราคาขาย (ก่อน VAT)
                </span>
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyNumber}
                disabled={summary.overheadPercent === null}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-orange-600 font-bold text-sm shadow-sm hover:bg-orange-50 active:scale-98 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="คัดลอกเฉพาะตัวเลขเพื่อนำไปใส่ในโปรแกรมสูตรอาหาร"
              >
                {copiedNumber ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>คัดลอกแล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>คัดลอกตัวเลข</span>
                  </>
                )}
              </button>

              <button
                onClick={handleCopySummaryText}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-orange-700/60 hover:bg-orange-700 text-white text-xs font-semibold backdrop-blur-xs transition-colors cursor-pointer"
                title="คัดลอกรายงานสรุปทั้งหมดส่งต่อใน LINE หรือบันทึก"
              >
                {copiedSummary ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
                <span className="hidden sm:inline">สรุปเป็นข้อความ</span>
              </button>
            </div>
          </div>

          {/* ประโยคอธิบายตัวอย่างที่เข้าใจง่ายทันที */}
          <div className="bg-black/15 backdrop-blur-xs rounded-xl p-4 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
              <span>
                {summary.overheadPercent !== null ? (
                  <>
                    <strong className="text-amber-200">ตัวอย่าง:</strong> ถ้าเมนูขาย{' '}
                    <strong>100 บาท</strong> (ไม่รวม VAT) จะมีต้นทุนโสหุ้ยแฝง{' '}
                    <strong className="text-amber-200 underline">
                      {summary.overheadPercent.toFixed(1)} บาท
                    </strong>
                  </>
                ) : (
                  <span className="text-orange-200">
                    กรุณากรอกยอดขายที่แท็บ "ยอดขาย" เพื่อดูการคำนวณตัวอย่าง
                  </span>
                )}
              </span>
            </div>

            <div className="text-xs text-orange-100 flex items-center gap-2 shrink-0">
              <span>ฐานยอดขาย:</span>
              <span className="font-bold bg-white/20 px-2 py-0.5 rounded text-white">
                {basisLabelMap[settings.salesBasis]}
              </span>
            </div>
          </div>

          {/* สถิติ 4 ช่องย่อย */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            <div className="bg-white/10 rounded-xl p-3 border border-white/10">
              <div className="text-xs text-orange-100">ต้นทุนคงที่ (Fixed)</div>
              <div className="text-base sm:text-lg font-bold tabular-nums mt-0.5">
                {formatBaht(summary.fixedTotal)}
              </div>
              <div className="text-[11px] text-orange-200">ต่อเดือน</div>
            </div>

            <div className="bg-white/10 rounded-xl p-3 border border-white/10">
              <div className="text-xs text-orange-100">โสหุ้ยผันแปร (% ยอดขาย)</div>
              <div className="text-base sm:text-lg font-bold tabular-nums mt-0.5">
                {formatPercent(summary.variablePercentTotal)}
              </div>
              <div className="text-[11px] text-orange-200">รูดบัตร/ของเสีย ฯลฯ</div>
            </div>

            <div className="bg-white/10 rounded-xl p-3 border border-white/10">
              <div className="text-xs text-orange-100">ยอดขายฐาน (ก่อน VAT)</div>
              <div className="text-base sm:text-lg font-bold tabular-nums mt-0.5">
                {formatBaht(summary.activeSales)}
              </div>
              <div className="text-[11px] text-orange-200">ต่อเดือน</div>
            </div>

            <div className="bg-white/10 rounded-xl p-3 border border-white/10">
              <div className="text-xs text-orange-100">รวมโสหุ้ยเป็นเงินบาท</div>
              <div className="text-base sm:text-lg font-bold tabular-nums mt-0.5">
                {formatBaht(summary.overheadBaht)}
              </div>
              <div className="text-[11px] text-orange-200">ต่อเดือน</div>
            </div>
          </div>
        </div>
      </div>

      {/* เปรียบเทียบ 3 ฐานยอดขาย (Comparison under the 3 sales bases) */}
      <div className="bg-white rounded-2xl border border-[#FED7AA] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-orange-500" />
              เปรียบเทียบสัดส่วนโสหุ้ยตาม 3 ฐานยอดขาย
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              คลิกเลือกฐานที่คุณต้องการนำมาเป็นค่าแนะนำหลัก
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('sales')}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>ปรับแต่งตัวเลขยอดขาย</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* ฐาน 1: ประมาณการ */}
          <div
            onClick={() => handleSelectBasis('expected')}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
              settings.salesBasis === 'expected'
                ? 'border-orange-500 bg-orange-50/50 shadow-xs'
                : 'border-gray-200 hover:border-orange-200 bg-white'
            }`}
          >
            {settings.salesBasis === 'expected' && (
              <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500 text-white">
                ใช้อยู่ขณะนี้
              </span>
            )}
            <div className="text-xs font-semibold text-gray-500 mb-1">
              1. ประมาณการร้านเปิดใหม่
            </div>
            <div className="text-2xl font-black text-gray-900 tabular-nums my-1">
              {formatPercent(summary.salesComparisons.expectedOverheadPercent)}
            </div>
            <div className="text-xs text-gray-600 mt-2 space-y-0.5">
              <div>
                ฐานยอดขาย:{' '}
                <span className="font-semibold text-gray-800">
                  {formatBaht(summary.salesComparisons.expectedSales)}
                </span>
                /ด.
              </div>
              <div className="text-[11px] text-gray-500">
                (ที่นั่ง {settings.expected.seats} · หมุน {settings.expected.turnsPerDay} รอบ · หัวละ {settings.expected.avgSpendPerHead}฿)
              </div>
            </div>
          </div>

          {/* ฐาน 2: กรอกยอดเอง */}
          <div
            onClick={() => handleSelectBasis('manual')}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
              settings.salesBasis === 'manual'
                ? 'border-orange-500 bg-orange-50/50 shadow-xs'
                : 'border-gray-200 hover:border-orange-200 bg-white'
            }`}
          >
            {settings.salesBasis === 'manual' && (
              <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500 text-white">
                ใช้อยู่ขณะนี้
              </span>
            )}
            <div className="text-xs font-semibold text-gray-500 mb-1">
              2. กรอกยอดขายต่อเดือนเอง
            </div>
            <div className="text-2xl font-black text-gray-900 tabular-nums my-1">
              {formatPercent(summary.salesComparisons.manualOverheadPercent)}
            </div>
            <div className="text-xs text-gray-600 mt-2 space-y-0.5">
              <div>
                ฐานยอดขาย:{' '}
                <span className="font-semibold text-gray-800">
                  {formatBaht(summary.salesComparisons.manualSales)}
                </span>
                /ด.
              </div>
              <div className="text-[11px] text-gray-500">
                (ยอดรายเดือนที่ตั้งเป้าหมายไว้)
              </div>
            </div>
          </div>

          {/* ฐาน 3: ยอดขายจริง */}
          <div
            onClick={() => handleSelectBasis('actual')}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
              settings.salesBasis === 'actual'
                ? 'border-orange-500 bg-orange-50/50 shadow-xs'
                : 'border-gray-200 hover:border-orange-200 bg-white'
            }`}
          >
            {settings.salesBasis === 'actual' && (
              <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500 text-white">
                ใช้อยู่ขณะนี้
              </span>
            )}
            <div className="text-xs font-semibold text-gray-500 mb-1">
              3. เฉลี่ยจากยอดขายจริงรายวัน
            </div>
            <div className="text-2xl font-black text-gray-900 tabular-nums my-1">
              {summary.actualDaysLogged > 0
                ? formatPercent(summary.salesComparisons.actualOverheadPercent)
                : '-'}
            </div>
            <div className="text-xs text-gray-600 mt-2 space-y-0.5">
              <div>
                ฐานยอดขาย:{' '}
                <span className="font-semibold text-gray-800">
                  {summary.actualDaysLogged > 0
                    ? `${formatBaht(summary.salesComparisons.actualSales)}/ด.`
                    : 'ยังไม่มีข้อมูล'}
                </span>
              </div>
              <div className="text-[11px] text-gray-500">
                (บันทึกแล้ว {summary.actualDaysLogged} วัน · คิดเฉลี่ย {settings.actualAverageDays} วัน)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* จุดคุ้มทุน & ยอดขายเพื่อกำไรเป้าหมาย (Break-even & Target Profit) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* จุดคุ้มทุน */}
        <div className="bg-white rounded-2xl border border-[#FED7AA] p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-orange-500" />
              จุดคุ้มทุน (Break-even)
            </h3>
            <span className="text-xs text-gray-500">
              สมมติ Food Cost {settings.avgFoodCostPercent}%
            </span>
          </div>

          {summary.breakEvenSales !== null ? (
            <div className="space-y-2">
              <div>
                <div className="text-xs text-gray-500">ยอดขายรายเดือนที่ต้องทำให้ได้</div>
                <div className="text-2xl font-bold text-gray-900 tabular-nums">
                  {formatBaht(summary.breakEvenSales)}
                </div>
              </div>
              <div className="p-3 bg-orange-50/70 rounded-xl border border-orange-100 flex items-center justify-between text-xs">
                <span className="text-gray-600">ต้องขายให้ได้อย่างน้อยต่อวัน:</span>
                <span className="font-bold text-orange-900 tabular-nums">
                  {formatBaht(summary.breakEvenDaily)} / วัน
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-red-700 text-xs">
              ไม่มีวันคุ้มทุนด้วยต้นทุนระดับนี้ (Food Cost + โสหุ้ยผันแปร เกิน 100%)
            </div>
          )}
          <p className="text-[11px] text-gray-400">
            * คำนวณจากค่าใช้จ่ายคงที่ ÷ (1 − Food Cost % − โสหุ้ยผันแปร %)
          </p>
        </div>

        {/* ยอดขายเพื่อเป้าหมายกำไร */}
        <div className="bg-white rounded-2xl border border-[#FED7AA] p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              ยอดขายเพื่อให้ได้กำไรเป้าหมาย
            </h3>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              กำไรเป้าหมาย {settings.targetProfitPercent}%
            </span>
          </div>

          {summary.targetProfitSales !== null ? (
            <div className="space-y-2">
              <div>
                <div className="text-xs text-gray-500">ยอดขายรายเดือนที่ต้องทำให้ได้</div>
                <div className="text-2xl font-bold text-emerald-800 tabular-nums">
                  {formatBaht(summary.targetProfitSales)}
                </div>
              </div>
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
                <span className="text-gray-600">ต้องขายให้ได้เฉลี่ยต่อวัน:</span>
                <span className="font-bold text-emerald-900 tabular-nums">
                  {formatBaht(summary.targetProfitDaily)} / วัน
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-red-700 text-xs">
              ไม่สามารถทำกำไรตามเป้าหมายได้ (ต้นทุนรวมเป้ากำไรเกิน 100%)
            </div>
          )}
          <p className="text-[11px] text-gray-400">
            * ปรับเปลี่ยนเปอร์เซ็นต์ Food Cost และกำไรเป้าหมายได้ที่แท็บ "ตั้งค่า"
          </p>
        </div>
      </div>

      {/* ตารางวิเคราะห์ความอ่อนไหว (Sensitivity Table) */}
      <div className="bg-white rounded-2xl border border-[#FED7AA] p-5 sm:p-6 shadow-xs space-y-3">
        <div>
          <h3 className="font-bold text-gray-900 text-sm">
            การเปลี่ยนแปลงของ % โสหุ้ย เมื่อยอดขายขยับขึ้น-ลง (Sensitivity Analysis)
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            เมื่อยอดขายเปลี่ยน ต้นทุนคงที่จะถูกหารด้วยจำนวนยอดที่เปลี่ยนไป ทำให้ % โสหุ้ยปรับเปลี่ยนดังนี้:
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-semibold">
                <th className="py-2.5 px-3">สถานการณ์ยอดขาย</th>
                <th className="py-2.5 px-3 text-right">ยอดขาย (฿/เดือน)</th>
                <th className="py-2.5 px-3 text-right">% โสหุ้ยที่ต้องใช้</th>
                <th className="py-2.5 px-3 text-right">โสหุ้ยรวม (฿/เดือน)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {summary.sensitivity.map((row, idx) => {
                const isBase = row.multiplier === 1.0;
                return (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      isBase ? 'bg-orange-50/60 font-semibold' : 'hover:bg-gray-50/80'
                    }`}
                  >
                    <td className="py-2.5 px-3 text-gray-800">
                      {row.label}
                      {isBase && (
                        <span className="ml-1.5 text-[10px] text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">
                          ฐานปัจจุบัน
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-gray-700">
                      {formatBaht(row.sales)}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold text-gray-900">
                      {formatPercent(row.overheadPercent)}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-gray-600">
                      {formatBaht(row.overheadBaht)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* สรุปสัดส่วนค่าใช้จ่ายแยกหมวดหมู่ (Category Breakdown) */}
      <div className="bg-white rounded-2xl border border-[#FED7AA] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">
              สัดส่วนค่าใช้จ่ายคงที่แยกตามหมวดหมู่ (Fixed Cost Breakdown)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              รวมค่าใช้จ่ายคงที่ทั้งหมด {formatBaht(summary.fixedTotal)} / เดือน
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('expenses')}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
          >
            <span>ดูรายละเอียด</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3 pt-2">
          {summary.breakdown.items.map((item) => (
            <div key={item.categoryId} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-800">{item.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 tabular-nums">
                    {formatBaht(item.monthlyAmount)}
                  </span>
                  <span className="text-gray-400 w-12 text-right tabular-nums">
                    ({item.sharePercentOfFixed.toFixed(1)}%)
                  </span>
                </div>
              </div>

              {/* Simple CSS horizontal bar */}
              <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(0, item.sharePercentOfFixed))}%`,
                  }}
                />
              </div>
            </div>
          ))}

          {/* แถวพิเศษสำหรับโสหุ้ยผันแปร */}
          <div className="pt-2 border-t border-gray-100 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-orange-950">
                โสหุ้ยแบบผันแปร (% ของยอดขาย)
              </span>
              <span className="font-bold text-orange-600 tabular-nums">
                {summary.variablePercentTotal.toFixed(1)}% ของยอดขาย
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              ค่าธรรมเนียม QR/บัตร, ค่าสูญเสียของแตกของเสีย จะเพิ่มขึ้นตามยอดขายจริง
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
