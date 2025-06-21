import { useState, useRef } from 'react';
import { Save, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

interface SaveLoadButtonsProps {
  onSave: () => Promise<void>;
  onLoad: (file: File) => Promise<void>;
  className?: string;
  disabled?: boolean;
}

export const SaveLoadButtons = ({ 
  onSave, 
  onLoad, 
  className = "",
  disabled = false 
}: SaveLoadButtonsProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (disabled || isSaving) return;
    
    setIsSaving(true);
    try {
      await onSave();
      toast.success('存檔成功！');
    } catch (error) {
      console.error('存檔失敗:', error);
      toast.error('存檔失敗，請稍後再試');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadClick = () => {
    if (disabled || isLoading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 檢查檔案類型
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      toast.error('請選擇 JSON 格式的存檔檔案');
      return;
    }

    // 檢查檔案大小 (限制 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('檔案大小不可超過 10MB');
      return;
    }

    setIsLoading(true);
    try {
      await onLoad(file);
      toast.success('讀檔成功！');
    } catch (error) {
      console.error('讀檔失敗:', error);
      toast.error('讀檔失敗，請檢查檔案格式');
    } finally {
      setIsLoading(false);
      // 清除檔案選擇，允許重複選擇同一檔案
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* 存檔按鈕 */}
      <button
        onClick={handleSave}
        disabled={disabled || isSaving}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
          transition-all duration-200
          ${disabled || isSaving
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
          }
        `}
        title="儲存當前排班到檔案"
      >
        <Save size={16} className={isSaving ? 'animate-spin' : ''} />
        {isSaving ? '存檔中...' : '存檔'}
      </button>

      {/* 讀檔按鈕 */}
      <button
        onClick={handleLoadClick}
        disabled={disabled || isLoading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
          transition-all duration-200
          ${disabled || isLoading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
          }
        `}
        title="從檔案載入排班資料"
      >
        <Upload size={16} className={isLoading ? 'animate-spin' : ''} />
        {isLoading ? '讀檔中...' : '讀檔'}
      </button>

      {/* 隱藏的檔案輸入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

// 自動存檔狀態指示器元件
interface AutoSaveIndicatorProps {
  lastSaved?: Date;
  isSaving?: boolean;
  className?: string;
}

export const AutoSaveIndicator = ({ 
  lastSaved, 
  isSaving = false, 
  className = "" 
}: AutoSaveIndicatorProps) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-TW', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className={`flex items-center gap-2 text-sm text-gray-600 ${className}`}>
      {isSaving ? (
        <>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span>自動存檔中...</span>
        </>
      ) : lastSaved ? (
        <>
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span>已自動存檔 ({formatTime(lastSaved)})</span>
        </>
      ) : (
        <>
          <div className="w-2 h-2 bg-gray-400 rounded-full" />
          <span>尚未存檔</span>
        </>
      )}
    </div>
  );
};