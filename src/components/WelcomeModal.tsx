import React from 'react';
import { ChefHat, FileSpreadsheet, Sparkles } from 'lucide-react';
import { Modal } from './Modal';

interface WelcomeModalProps {
  isOpen: boolean;
  onChooseBlank: () => void;
  onChooseSample: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onChooseBlank,
  onChooseSample,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Cannot dismiss without choosing
      title="ยินดีต้อนรับสู่ Tony's Kitchen – คำนวณโสหุ้ย"
      maxWidthClass="max-w-xl"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-950">
          <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <ChefHat className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-base text-orange-950">
              ช่วยเจ้าของร้านอาหารคำนวณ % โสหุ้ย เพื่อตั้งราคาไม่ให้ขาดทุน
            </h3>
            <p className="text-xs text-orange-800 mt-0.5">
              ไม่ต้องลงบัญชีละเอียดยิบ ใช้แค่ยอดขายรวมต่อวัน ข้อมูลเก็บในเครื่องคุณ 100% ปลอดภัย ใช้งานออฟไลน์ได้
            </p>
          </div>
        </div>

        <p className="text-gray-600 text-sm">
          คุณต้องการเริ่มต้นใช้งานแบบใด? สามารถสลับ ล้าง หรือแก้ไขข้อมูลได้ตลอดเวลาจากเมนูตั้งค่า
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={onChooseSample}
            className="flex flex-col text-left p-4 rounded-xl border-2 border-orange-400 bg-orange-50/40 hover:bg-orange-100/50 transition-all cursor-pointer group shadow-xs"
          >
            <div className="flex items-center gap-2 text-orange-600 font-bold mb-1">
              <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>โหลดข้อมูลตัวอย่าง</span>
            </div>
            <p className="text-xs text-gray-600 leading-normal">
              แนะนำสำหรับผู้เริ่มต้น: มีตัวเลขจริงของร้านอาหารขนาดกลาง (ยอดขาย 330,000 บ./ด.) ให้เห็นภาพสรุปผลทันที
            </p>
          </button>

          <button
            onClick={onChooseBlank}
            className="flex flex-col text-left p-4 rounded-xl border border-gray-200 bg-white hover:border-orange-300 hover:bg-gray-50/80 transition-all cursor-pointer group shadow-xs"
          >
            <div className="flex items-center gap-2 text-gray-800 font-bold mb-1">
              <FileSpreadsheet className="w-5 h-5 group-hover:scale-110 transition-transform text-gray-500" />
              <span>เริ่มแบบฟอร์มเปล่า</span>
            </div>
            <p className="text-xs text-gray-500 leading-normal">
              แบบฟอร์มหมวดหมู่มาตรฐานครบ 8 หมวด ยอดเงิน 0 บาท พร้อมให้คุณกรอกตัวเลขจริงของร้านคุณทันที
            </p>
          </button>
        </div>
      </div>
    </Modal>
  );
};
