import React, { useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Lightbulb,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import { Expense, Frequency } from '../types';
import { getExpenseMonthlyAmount } from '../utils/calc';
import { formatBaht, formatBahtRaw } from '../utils/format';
import { Modal } from '../components/Modal';

interface ExpensesPageProps {
  expenses: Expense[];
  operatingDaysPerMonth: number;
  onUpdateExpenses: (updater: (prev: Expense[]) => Expense[]) => void;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const ExpensesPage: React.FC<ExpensesPageProps> = ({
  expenses,
  operatingDaysPerMonth,
  onUpdateExpenses,
  onNotify,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<number, boolean>>({});
  const [showDoNotIncludeInfo, setShowDoNotIncludeInfo] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Expense | null>(null);

  // New item modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addCategoryId, setAddCategoryId] = useState<number>(1);
  const [addName, setAddName] = useState('');
  const [addAmount, setAddAmount] = useState<number | ''>('');
  const [addFrequency, setAddFrequency] = useState<Frequency>('monthly');

  const frequencyOptions: { value: Frequency; label: string }[] = [
    { value: 'monthly', label: 'ต่อเดือน' },
    { value: 'weekly', label: 'ต่อสัปดาห์' },
    { value: 'daily', label: 'ต่อวัน' },
    { value: 'quarterly', label: 'ต่อไตรมาส' },
    { value: 'yearly', label: 'ต่อปี' },
    { value: 'percentOfSales', label: '% ของยอดขาย' },
  ];

  const toggleCategoryCollapse = (categoryId: number) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleUpdateItem = (id: string, partial: Partial<Expense>) => {
    onUpdateExpenses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...partial } : item))
    );
  };

  const confirmDelete = () => {
    if (!deleteCandidate) return;
    onUpdateExpenses((prev) => prev.filter((item) => item.id !== deleteCandidate.id));
    onNotify('info', `ลบรายการ "${deleteCandidate.name}" แล้ว`);
    setDeleteCandidate(null);
  };

  const handleCreateCustomExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) {
      onNotify('error', 'กรุณาระบุชื่อรายการค่าใช้จ่าย');
      return;
    }

    const newExpense: Expense = {
      id: `custom-${Date.now()}`,
      categoryId: addCategoryId,
      name: addName.trim(),
      amount: Number(addAmount) || 0,
      frequency: addFrequency,
      excluded: false,
    };

    onUpdateExpenses((prev) => [...prev, newExpense]);
    onNotify('success', `เพิ่มรายการ "${newExpense.name}" สำเร็จ`);
    setIsAddModalOpen(false);
    setAddName('');
    setAddAmount('');
    setAddFrequency('monthly');
  };

  const filteredExpenses = expenses.filter((e) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      (e.note && e.note.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* ส่วนหัว แถบค้นหา และปุ่มเพิ่มรายการ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            รายการค่าใช้จ่าย (Expenses)
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            กรอกตัวเลขค่าใช้จ่ายของร้านในแต่ละหมวดหมู่ สามารถเพิ่ม แก้ไข หรือติ๊กยกเว้นได้
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อค่าใช้จ่าย..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#FED7AA] rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer whitespace-nowrap min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มรายการใหม่</span>
          </button>
        </div>
      </div>

      {/* แผงข้อควรระวัง: อะไรที่ห้ามนับในโสหุ้ย (Collapsible Info Panel) */}
      <div className="bg-white rounded-2xl border border-orange-200 overflow-hidden shadow-xs">
        <button
          onClick={() => setShowDoNotIncludeInfo(!showDoNotIncludeInfo)}
          className="w-full px-5 py-3.5 flex items-center justify-between bg-orange-50/70 hover:bg-orange-100/50 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 text-orange-600 shrink-0" />
            <span className="text-sm font-bold text-orange-950">
              อะไรที่ “ห้ามนับ” รวมในโสหุ้ยเด็ดขาด? (กดเพื่อดู 10 ข้อสำคัญ)
            </span>
          </div>
          {showDoNotIncludeInfo ? (
            <ChevronUp className="w-4 h-4 text-orange-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-orange-600" />
          )}
        </button>

        {showDoNotIncludeInfo && (
          <div className="p-5 text-xs text-gray-700 bg-white border-t border-orange-100 space-y-2.5 leading-relaxed">
            <p className="font-semibold text-gray-900">
              เพื่อป้องกันการคิดต้นทุนซ้ำซ้อนหรือตัวเลขบวมเกินจริง ห้ามนำรายการเหล่านี้มาใส่เป็นค่าใช้จ่ายโสหุ้ย:
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 text-gray-600">
              <li>
                <strong className="text-gray-900">วัตถุดิบอาหารและเครื่องดื่ม:</strong> อยู่ใน Food Cost % ของจานนั้นอยู่แล้ว
              </li>
              <li>
                <strong className="text-gray-900">ต้นทุนแฝงที่ใส่ในสูตรรายจานแล้ว:</strong> เช่น ค่าแก๊สหรือบรรจุภัณฑ์กล่องข้าว หากคิดในสูตรต่อจานแล้ว ให้กดติ๊ก "ไม่นับ"
              </li>
              <li>
                <strong className="text-gray-900">ค่า GP เดลิเวอรี่ (เช่น 30%):</strong> ต้องคิดบวกเพิ่มเฉพาะในราคาขายบนแอปเดลิเวอรี่ อย่านำมาเฉลี่ยกับลูกค้าหน้าร้าน
              </li>
              <li>
                <strong className="text-gray-900">ภาษีมูลค่าเพิ่ม (VAT 7%):</strong> เป็นภาษีเรียกเก็บแทนรัฐ ไม่ใช่ต้นทุนของร้าน
              </li>
              <li>
                <strong className="text-gray-900">เงินมัดจำร้าน/ค่าประกันมิเตอร์:</strong> เป็นสินทรัพย์ ได้เงินคืนเมื่อหมดสัญญา
              </li>
              <li>
                <strong className="text-gray-900">เงินลงทุนก้อนแรกทั้งก้อน:</strong> (เช่น ก่อสร้างร้าน 500,000 บาท) ให้บันทึกเป็น "ค่าเสื่อมราคา" ในแท็บค่าเสื่อมราคาแทน
              </li>
              <li>
                <strong className="text-gray-900">เงินต้นที่ผ่อนคืนเงินกู้:</strong> ให้นับเฉพาะ “ดอกเบี้ยจ่าย” ส่วนเงินต้นถือเป็นการคืนภาระหนี้สิน
              </li>
              <li>
                <strong className="text-gray-900">เงินที่เจ้าของเบิกใช้ส่วนตัว:</strong> ให้ตั้งเป็นเงินเดือนเจ้าของที่แน่นอนแทน
              </li>
              <li>
                <strong className="text-gray-900">ภาษีเงินได้นิติบุคคล/บุคคลธรรมดา:</strong> คิดจากกำไรสุทธิปลายปี ไม่ใช่โสหุ้ยดำเนินงาน
              </li>
              <li>
                <strong className="text-gray-900">ค่าบริการ 10% (Service Charge):</strong> ที่เรียกเก็บจากลูกค้าแล้วนำมาหารแบ่งให้พนักงานทั้งหมด อย่านับซ้ำเป็นค่าแรง
              </li>
            </ol>
          </div>
        )}
      </div>

      {/* แถบคำแนะนำสั้นๆ (Tips panel) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 bg-orange-50/50 rounded-xl border border-orange-200/80 flex items-start gap-2.5 text-xs text-orange-950">
          <Lightbulb className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
          <span><strong>ใช้ตัวเลขจริง:</strong> อ้างอิงจากบิลค่าน้ำค่าไฟ สัญญาเช่า หรือสลิปจ่ายเงินเดือนจริง</span>
        </div>
        <div className="p-3.5 bg-orange-50/50 rounded-xl border border-orange-200/80 flex items-start gap-2.5 text-xs text-orange-950">
          <Lightbulb className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
          <span><strong>รายปีระบบหาร 12 ให้:</strong> รายการอย่างภาษีป้าย ประกันภัย ล้างแอร์ ให้เลือก "ต่อปี"</span>
        </div>
        <div className="p-3.5 bg-orange-50/50 rounded-xl border border-orange-200/80 flex items-start gap-2.5 text-xs text-orange-950">
          <Lightbulb className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
          <span><strong>นับเกินดีกว่านับขาด:</strong> ถ้ายังไม่แน่ใจตัวเลข ให้ประมาณการเผื่อไว้เล็กน้อยปลอดภัยกว่า</span>
        </div>
      </div>

      {/* รายการค่าใช้จ่ายจัดกลุ่มตาม 8 หมวดหมู่ */}
      <div className="space-y-4">
        {CATEGORIES.map((cat) => {
          const itemsInCat = filteredExpenses.filter((e) => e.categoryId === cat.id);
          const isCollapsed = !!collapsedCategories[cat.id];

          // คำนวณยอดรวมหมวดนี้
          const fixedSubtotal = itemsInCat.reduce((sum, item) => {
            return sum + getExpenseMonthlyAmount(item, operatingDaysPerMonth);
          }, 0);

          const varSubtotal = itemsInCat.reduce((sum, item) => {
            if (item.frequency === 'percentOfSales' && !item.excluded) {
              return sum + (Number(item.amount) || 0);
            }
            return sum;
          }, 0);

          if (searchQuery.trim() && itemsInCat.length === 0) {
            return null;
          }

          return (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-[#FED7AA] overflow-hidden shadow-xs"
            >
              {/* Category Header */}
              <div
                onClick={() => toggleCategoryCollapse(cat.id)}
                className="px-5 py-3.5 bg-[#FFFBF5] border-b border-orange-100 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {cat.id}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 leading-tight">
                      {cat.name}
                    </h2>
                    <span className="text-[11px] text-gray-500 hidden sm:inline">
                      {cat.description}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs font-bold text-gray-900 tabular-nums">
                      {formatBaht(fixedSubtotal)}/ด.
                    </div>
                    {varSubtotal > 0 && (
                      <div className="text-[10px] text-orange-600 font-medium tabular-nums">
                        + {varSubtotal.toFixed(1)}% ยอดขาย
                      </div>
                    )}
                  </div>

                  <div className="text-gray-400 hover:text-gray-700 p-1">
                    {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Items List */}
              {!isCollapsed && (
                <div className="divide-y divide-gray-100">
                  {itemsInCat.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-400">
                      ไม่มีรายการในหมวดนี้ที่ตรงกับคำค้นหา
                    </div>
                  ) : (
                    itemsInCat.map((item) => {
                      const monthlyEquivalent = getExpenseMonthlyAmount(
                        item,
                        operatingDaysPerMonth
                      );

                      return (
                        <div
                          key={item.id}
                          className={`p-3.5 sm:px-5 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                            item.excluded
                              ? 'bg-gray-50/70 opacity-60'
                              : 'hover:bg-orange-50/20'
                          }`}
                        >
                          {/* ชื่อรายการและหมายเหตุ */}
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) =>
                                handleUpdateItem(item.id, { name: e.target.value })
                              }
                              className="w-full text-xs sm:text-sm font-semibold text-gray-800 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-gray-200 focus:border-orange-400 rounded-md px-1.5 py-1 transition-all outline-none"
                              placeholder="ระบุชื่อค่าใช้จ่าย..."
                            />
                            {item.note && (
                              <p className="text-[11px] text-orange-700/80 px-1.5 mt-0.5">
                                ℹ️ {item.note}
                              </p>
                            )}
                          </div>

                          {/* คอนโทรลตัวเลข ความถี่ และการคำนวณสด */}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
                            {/* Input Amount */}
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={item.amount === 0 ? '' : item.amount}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                  handleUpdateItem(item.id, {
                                    amount: isNaN(val) ? 0 : Math.max(0, val),
                                  });
                                }}
                                placeholder="0"
                                className="w-24 sm:w-28 px-2.5 py-1.5 text-xs text-right font-medium tabular-nums bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                              />
                              <span className="text-xs text-gray-500 w-6">
                                {item.frequency === 'percentOfSales' ? '%' : '฿'}
                              </span>
                            </div>

                            {/* Frequency Selector */}
                            <select
                              value={item.frequency}
                              onChange={(e) =>
                                handleUpdateItem(item.id, {
                                  frequency: e.target.value as Frequency,
                                })
                              }
                              className="text-xs bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
                            >
                              {frequencyOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>

                            {/* Live Monthly Equivalent */}
                            <div className="w-28 text-right text-xs font-bold tabular-nums">
                              {item.excluded ? (
                                <span className="text-gray-400 line-through">
                                  ยกเว้นแล้ว
                                </span>
                              ) : item.frequency === 'percentOfSales' ? (
                                <span className="text-orange-600">
                                  = {item.amount}% ยอด
                                </span>
                              ) : (
                                <span className="text-gray-800">
                                  = {formatBahtRaw(monthlyEquivalent)} ฿/ด.
                                </span>
                              )}
                            </div>

                            {/* Exclude checkbox */}
                            <label className="flex items-center gap-1.5 text-xs text-gray-500 select-none cursor-pointer px-1 py-1 hover:text-gray-800">
                              <input
                                type="checkbox"
                                checked={item.excluded}
                                onChange={(e) =>
                                  handleUpdateItem(item.id, {
                                    excluded: e.target.checked,
                                  })
                                }
                                className="w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-400"
                              />
                              <span className="hidden lg:inline text-[11px]">
                                ไม่นับ (ใส่ในสูตรแล้ว)
                              </span>
                            </label>

                            {/* Delete button */}
                            <button
                              onClick={() => setDeleteCandidate(item)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                              title="ลบรายการนี้"
                              aria-label={`ลบรายการ ${item.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: Add custom expense */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="เพิ่มรายการค่าใช้จ่ายใหม่"
      >
        <form onSubmit={handleCreateCustomExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              หมวดหมู่ค่าใช้จ่าย
            </label>
            <select
              value={addCategoryId}
              onChange={(e) => setAddCategoryId(Number(e.target.value))}
              className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-orange-400"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  หมวด {cat.id}: {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              ชื่อรายการค่าใช้จ่าย
            </label>
            <input
              type="text"
              required
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="เช่น ค่าจ้างนักร้องดนตรีสด, ค่าตรวจรับรองสุขาภิบาล"
              className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                จำนวนเงิน (หรือ % ยอดขาย)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={addAmount}
                onChange={(e) =>
                  setAddAmount(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                placeholder="0"
                className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                ความถี่
              </label>
              <select
                value={addFrequency}
                onChange={(e) => setAddFrequency(e.target.value as Frequency)}
                className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-orange-400"
              >
                {frequencyOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
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
              บันทึกรายการ
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirm Delete */}
      <Modal
        isOpen={!!deleteCandidate}
        onClose={() => setDeleteCandidate(null)}
        title="ยืนยันการลบรายการ"
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
          คุณต้องการลบรายการ{' '}
          <strong className="text-gray-900">"{deleteCandidate?.name}"</strong> ใช่หรือไม่?
        </p>
      </Modal>
    </div>
  );
};
