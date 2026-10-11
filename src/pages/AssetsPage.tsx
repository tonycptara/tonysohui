import React, { useState } from 'react';
import {
  AlertTriangle,
  Coins,
  Edit2,
  HelpCircle,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Asset } from '../types';
import { getAssetMonthlyCost } from '../utils/calc';
import { formatBaht, formatBahtRaw } from '../utils/format';
import { Modal } from '../components/Modal';

interface AssetsPageProps {
  assets: Asset[];
  onUpdateAssets: (updater: (prev: Asset[]) => Asset[]) => void;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const AssetsPage: React.FC<AssetsPageProps> = ({
  assets,
  onUpdateAssets,
  onNotify,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Asset | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [lifeYears, setLifeYears] = useState<number | ''>(5);
  const [useInstallment, setUseInstallment] = useState(false);
  const [installmentMonthly, setInstallmentMonthly] = useState<number | ''>('');
  const [note, setNote] = useState('');

  // Pre-fill suggestion chips
  const suggestionChips = [
    { name: 'เตาแก๊สและอุปกรณ์ครัว', years: 5 },
    { name: 'ตู้แช่/ตู้เย็น', years: 7 },
    { name: 'แอร์', years: 7 },
    { name: 'โต๊ะเก้าอี้/ตกแต่งร้าน', years: 5 },
    { name: 'ป้ายร้าน', years: 5 },
    { name: 'เครื่อง POS/คอมพิวเตอร์', years: 4 },
  ];

  const totalMonthlyCost = assets.reduce(
    (sum, ast) => sum + getAssetMonthlyCost(ast),
    0
  );

  const handleOpenAdd = () => {
    setEditingAsset(null);
    setName('');
    setPrice('');
    setLifeYears(5);
    setUseInstallment(false);
    setInstallmentMonthly('');
    setNote('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setName(asset.name);
    setPrice(asset.price || '');
    setLifeYears(asset.lifeYears || 5);
    setUseInstallment(asset.useInstallment);
    setInstallmentMonthly(asset.installmentMonthly || '');
    setNote(asset.note || '');
    setIsAddModalOpen(true);
  };

  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onNotify('error', 'กรุณาระบุชื่อสินทรัพย์/อุปกรณ์');
      return;
    }

    const numPrice = Number(price) || 0;
    const numLifeYears = Number(lifeYears) || 5;
    const numInstallment = Number(installmentMonthly) || 0;

    if (!useInstallment && numLifeYears <= 0) {
      onNotify('error', 'อายุการใช้งานต้องมากกว่า 0 ปี');
      return;
    }

    if (editingAsset) {
      onUpdateAssets((prev) =>
        prev.map((item) =>
          item.id === editingAsset.id
            ? {
                ...item,
                name: name.trim(),
                price: numPrice,
                lifeYears: numLifeYears,
                useInstallment,
                installmentMonthly: useInstallment ? numInstallment : undefined,
                note: note.trim() || undefined,
              }
            : item
        )
      );
      onNotify('success', `อัปเดตข้อมูล "${name}" เรียบร้อย`);
    } else {
      const newAsset: Asset = {
        id: `ast-${Date.now()}`,
        name: name.trim(),
        price: numPrice,
        lifeYears: numLifeYears,
        useInstallment,
        installmentMonthly: useInstallment ? numInstallment : undefined,
        note: note.trim() || undefined,
      };
      onUpdateAssets((prev) => [...prev, newAsset]);
      onNotify('success', `เพิ่มอุปกรณ์ "${name}" เรียบร้อย`);
    }

    setIsAddModalOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteCandidate) return;
    onUpdateAssets((prev) => prev.filter((item) => item.id !== deleteCandidate.id));
    onNotify('info', `ลบอุปกรณ์ "${deleteCandidate.name}" แล้ว`);
    setDeleteCandidate(null);
  };

  const handleAddChip = (chipName: string, years: number) => {
    const newAsset: Asset = {
      id: `ast-${Date.now()}`,
      name: chipName,
      price: 0,
      lifeYears: years,
      useInstallment: false,
    };
    onUpdateAssets((prev) => [...prev, newAsset]);
    onNotify('success', `เพิ่มหมวด "${chipName}" แล้ว (กรุณาใส่ราคาหรือค่างวด)`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            ค่าเสื่อมราคาและผ่อนอุปกรณ์ (Assets & Depreciation)
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            เงินลงทุนซื้ออุปกรณ์ครัว งานระบบ ตกแต่ง หรือค่างวดผ่อนรายเดือน
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer whitespace-nowrap self-start sm:self-auto min-h-[40px]"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มอุปกรณ์ใหม่</span>
        </button>
      </div>

      {/* คำเตือนเรื่องการไม่นับซ้ำระหว่างค่าเสื่อมราคาและค่างวดผ่อน */}
      <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-950 flex items-start gap-3 shadow-xs">
        <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm leading-relaxed">
          <span className="font-bold">ข้อควรระวัง: </span>
          สำหรับอุปกรณ์ชิ้นเดียวกัน ให้เลือกวิธีใดวิธีหนึ่งเท่านั้น ระหว่าง{' '}
          <strong>"คิดค่าเสื่อมราคาตามอายุการใช้งาน"</strong> (ซื้อสด/ผ่อนหมดแล้ว) หรือ{' '}
          <strong>"ใช้ค่างวดผ่อนต่อเดือน"</strong> (กำลังผ่อนชำระอยู่){' '}
          <span className="text-red-700 font-bold">
            ห้ามคิดทั้งสองอย่างพร้อมกันเพราะต้นทุนจะบวมซ้ำซ้อน
          </span>
        </div>
      </div>

      {/* Pre-fill Suggestion Chips */}
      <div className="bg-white rounded-2xl border border-[#FED7AA] p-4 sm:p-5 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <span>กดเพื่อเพิ่มอุปกรณ์แนะนำมาตรฐาน (พร้อมตั้งอายุใช้งานให้ทันที):</span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleAddChip(chip.name, chip.years)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-orange-600" />
              <span>
                {chip.name} ({chip.years} ปี)
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stat */}
      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-2.5">
          <Coins className="w-5 h-5 text-orange-500" />
          <span className="text-sm font-bold text-gray-800">
            รวมค่าเสื่อมราคาและค่างวดอุปกรณ์ทั้งหมด
          </span>
        </div>
        <div className="text-base sm:text-lg font-bold text-gray-900 tabular-nums">
          {formatBaht(totalMonthlyCost)} / เดือน
        </div>
      </div>

      {/* Assets List */}
      <div className="space-y-3">
        {assets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center space-y-3">
            <Coins className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="text-sm font-bold text-gray-700">
              ยังไม่มีรายการสินทรัพย์หรืออุปกรณ์
            </h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              กดเลือกจากอุปกรณ์แนะนำด้านบน หรือคลิกปุ่ม "เพิ่มอุปกรณ์ใหม่" เพื่อบันทึกค่าเสื่อมราคาของเครื่องครัว โต๊ะเก้าอี้ แอร์ ป้ายร้าน ฯลฯ
            </p>
          </div>
        ) : (
          assets.map((ast) => {
            const monthlyCost = getAssetMonthlyCost(ast);
            return (
              <div
                key={ast.id}
                className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-orange-200 transition-colors shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900">{ast.name}</h3>
                    {ast.useInstallment ? (
                      <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                        ผ่อนชำระ
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        ค่าเสื่อม {ast.lifeYears} ปี
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
                    {ast.useInstallment ? (
                      <span>ค่างวด: {formatBaht(ast.installmentMonthly)} / เดือน</span>
                    ) : (
                      <>
                        <span>ราคาซื้อ: {formatBaht(ast.price)}</span>
                        <span>·</span>
                        <span>
                          (ตกปีละ {formatBahtRaw(ast.lifeYears > 0 ? ast.price / ast.lifeYears : 0)} ฿)
                        </span>
                      </>
                    )}
                    {ast.note && (
                      <>
                        <span>·</span>
                        <span className="text-orange-700">หมายเหตุ: {ast.note}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-gray-100">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">ต้นทุนต่อเดือน</div>
                    <div className="text-sm sm:text-base font-bold text-gray-900 tabular-nums">
                      = {formatBahtRaw(monthlyCost)} ฿/ด.
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => handleOpenEdit(ast)}
                      className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                      title="แก้ไข"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteCandidate(ast)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="ลบ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Add or Edit Asset */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingAsset ? 'แก้ไขข้อมูลสินทรัพย์' : 'เพิ่มสินทรัพย์ / อุปกรณ์'}
      >
        <form onSubmit={handleSaveAsset} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              ชื่อสินทรัพย์ / อุปกรณ์ *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น ตู้แช่สแตนเลส 4 ประตู, เตาแก๊ส KB5 3 หัว"
              className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* Toggle useInstallment */}
          <div className="p-3 rounded-xl bg-orange-50/50 border border-orange-200/80">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={useInstallment}
                onChange={(e) => setUseInstallment(e.target.checked)}
                className="w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-400"
              />
              <span className="text-xs font-bold text-orange-950">
                รายการนี้กำลังผ่อนอยู่ (ใช้ค่างวดผ่อนต่อเดือนแทนการตัดค่าเสื่อม)
              </span>
            </label>
          </div>

          {useInstallment ? (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                ค่างวดผ่อนต่อเดือน (บาท/เดือน) *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={installmentMonthly}
                onChange={(e) =>
                  setInstallmentMonthly(
                    e.target.value === '' ? '' : parseFloat(e.target.value)
                  )
                }
                placeholder="เช่น 3500"
                className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-orange-400"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ราคาซื้อรวม (บาท)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={price}
                  onChange={(e) =>
                    setPrice(
                      e.target.value === '' ? '' : parseFloat(e.target.value)
                    )
                  }
                  placeholder="เช่น 80000"
                  className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  อายุการใช้งาน (ปี) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={lifeYears}
                  onChange={(e) =>
                    setLifeYears(
                      e.target.value === '' ? '' : parseInt(e.target.value, 10)
                    )
                  }
                  placeholder="5"
                  className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              หมายเหตุเพิ่มเติม (ถ้ามี)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น ประกันคอมเพรสเซอร์ 5 ปี, ผ่อนงวดสุดท้าย ก.ย. 68"
              className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-xs cursor-pointer"
            >
              บันทึกข้อมูล
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirm Delete */}
      <Modal
        isOpen={!!deleteCandidate}
        onClose={() => setDeleteCandidate(null)}
        title="ยืนยันการลบสินทรัพย์"
        footer={
          <>
            <button
              onClick={() => setDeleteCandidate(null)}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs cursor-pointer"
            >
              ยืนยันการลบ
            </button>
          </>
        }
      >
        <p className="text-gray-700 text-sm">
          คุณต้องการลบอุปกรณ์{' '}
          <strong className="text-gray-900">"{deleteCandidate?.name}"</strong> ใช่หรือไม่?
        </p>
      </Modal>
    </div>
  );
};
