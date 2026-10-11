import React from 'react';
import {
  BarChart3,
  Coins,
  History,
  Receipt,
  Settings,
} from 'lucide-react';
import { ActiveTab } from '../types';

interface MobileNavBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'result', label: 'สรุปผล', icon: BarChart3 },
    { id: 'expenses', label: 'ค่าใช้จ่าย', icon: Receipt },
    { id: 'assets', label: 'ค่าเสื่อม', icon: Coins },
    { id: 'sales', label: 'ยอดขาย', icon: History },
    { id: 'settings', label: 'ตั้งค่า', icon: Settings },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#FED7AA] shadow-lg flex items-center justify-around px-1 py-1"
      aria-label="เมนูหลักสำหรับมือถือ"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 px-0.5 min-h-[48px] rounded-lg transition-colors cursor-pointer ${
              isActive
                ? 'text-orange-600 font-bold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[11px] leading-tight mt-1 whitespace-nowrap">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
