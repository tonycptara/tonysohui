import React from 'react';
import { CheckCircle2, ChefHat, RefreshCw } from 'lucide-react';
import { ActiveTab } from '../types';

interface HeaderProps {
  shopName: string;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isSaving: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  shopName,
  activeTab,
  onTabChange,
  isSaving,
}) => {
  const navTabs: { id: ActiveTab; label: string }[] = [
    { id: 'result', label: 'สรุปผล' },
    { id: 'expenses', label: 'ค่าใช้จ่าย' },
    { id: 'assets', label: 'ค่าเสื่อมราคา' },
    { id: 'sales', label: 'ยอดขาย' },
    { id: 'settings', label: 'ตั้งค่า' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#FED7AA]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-[#F97316] text-white flex items-center justify-center shadow-xs">
            <ChefHat className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-gray-900 leading-tight">
              Tony's Kitchen
            </span>
            <span className="text-xs text-orange-700 font-medium">
              คำนวณโสหุ้ย {shopName && shopName !== "Tony's Kitchen" ? `· ${shopName}` : ''}
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-orange-50/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Status indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
            {isSaving ? (
              <RefreshCw className="w-4 h-4 text-orange-500 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
            <span className="hidden sm:inline">
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกในเครื่องแล้ว'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
