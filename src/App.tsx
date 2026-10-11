import React, { useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { MobileNavBar } from './components/Navigation';
import { ToastContainer, ToastMessage } from './components/Toast';
import { WelcomeModal } from './components/WelcomeModal';
import { createSampleData } from './data/sample';
import { createInitialData } from './data/template';
import { AssetsPage } from './pages/AssetsPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { ResultPage } from './pages/ResultPage';
import { SalesPage } from './pages/SalesPage';
import { SettingsPage } from './pages/SettingsPage';
import { ActiveTab, RootData } from './types';
import {
  FIRST_LAUNCH_KEY,
  loadDataFromStorage,
  requestPersistentStorage,
  saveDataToStorage,
} from './utils/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('result');
  const [data, setData] = useState<RootData>(() => {
    const loaded = loadDataFromStorage();
    return loaded.data;
  });
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean>(() => {
    return !localStorage.getItem(FIRST_LAUNCH_KEY);
  });
  const [isSaving, setIsSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Track if this is the first render to avoid redundant immediate saves
  const isInitialMount = useRef(true);
  const saveTimeoutRef = useRef<number | null>(null);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. First load: request persistent storage and display load errors if any
  useEffect(() => {
    requestPersistentStorage();
    const loaded = loadDataFromStorage();
    if (loaded.error) {
      addToast('error', loaded.error);
    }
  }, []);

  // 2. Debounced auto-save (~300ms) on data changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setIsSaving(true);
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      const res = saveDataToStorage(data);
      if (!res.success && res.error) {
        addToast('error', res.error);
      }
      setIsSaving(false);
    }, 300);

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data]);

  // First launch onboarding choices
  const handleChooseBlank = () => {
    const blank = createInitialData();
    setData(blank);
    saveDataToStorage(blank);
    setIsFirstLaunch(false);
    addToast('info', 'เริ่มแบบฟอร์มเปล่ามาตรฐานเรียบร้อย สามารถกรอกข้อมูลได้เลย');
  };

  const handleChooseSample = () => {
    const sample = createSampleData();
    setData(sample);
    saveDataToStorage(sample);
    setIsFirstLaunch(false);
    addToast('success', 'โหลดข้อมูลตัวอย่างร้านอาหารเรียบร้อย สามารถดูผลลัพธ์ได้ทันที');
  };

  return (
    <div className="min-h-screen bg-[#FFFBF5] text-[#1F2937] flex flex-col font-sans pb-20 md:pb-8">
      {/* Header */}
      <Header
        shopName={data.settings.shopName}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isSaving={isSaving}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'result' && (
          <ResultPage
            data={data}
            onUpdateSettings={(updater) =>
              setData((prev) => ({ ...prev, settings: updater(prev.settings) }))
            }
            onNavigateTab={setActiveTab}
            onNotify={addToast}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesPage
            expenses={data.expenses}
            operatingDaysPerMonth={data.settings.operatingDaysPerMonth}
            onUpdateExpenses={(updater) =>
              setData((prev) => ({ ...prev, expenses: updater(prev.expenses) }))
            }
            onNotify={addToast}
          />
        )}

        {activeTab === 'assets' && (
          <AssetsPage
            assets={data.assets}
            onUpdateAssets={(updater) =>
              setData((prev) => ({ ...prev, assets: updater(prev.assets) }))
            }
            onNotify={addToast}
          />
        )}

        {activeTab === 'sales' && (
          <SalesPage
            settings={data.settings}
            salesDays={data.salesDays}
            onUpdateSettings={(updater) =>
              setData((prev) => ({ ...prev, settings: updater(prev.settings) }))
            }
            onUpdateSalesDays={(updater) =>
              setData((prev) => ({ ...prev, salesDays: updater(prev.salesDays) }))
            }
            onNotify={addToast}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            data={data}
            onUpdateRootData={setData}
            onUpdateSettings={(updater) =>
              setData((prev) => ({ ...prev, settings: updater(prev.settings) }))
            }
            onNotify={addToast}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#FED7AA] py-4 text-center text-xs text-gray-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Tony's Kitchen – Overhead Calculator (Thai Restaurant Edition)</span>
          <span>ข้อมูลเก็บในเครื่องของคุณแบบออฟไลน์ 100% · ไม่มีการส่งข้อมูลออกภายนอก</span>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <MobileNavBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Welcome Onboarding Modal for First Launch */}
      <WelcomeModal
        isOpen={isFirstLaunch}
        onChooseBlank={handleChooseBlank}
        onChooseSample={handleChooseSample}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
