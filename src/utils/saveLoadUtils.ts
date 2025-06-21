import { SaveData, SaveDataSchema, validateSaveData, checkVersionCompatibility } from '@/schemas/saveData';
import { Schedule, Notes } from '@/types/schedule';

const CURRENT_VERSION = "1.0.0";
const AUTO_SAVE_KEY = "pharmacist-schedule-autosave";

// 存檔相關型別
export interface SaveResult {
  success: boolean;
  error?: string;
}

export interface LoadResult {
  success: boolean;
  data?: SaveData;
  errors: string[];
  warnings: string[];
}

// 創建存檔資料
export function createSaveData(
  currentMonth: Date,
  pharmacists: string[],
  schedule: Schedule,
  notes: Notes
): SaveData {
  return {
    version: CURRENT_VERSION,
    currentMonth: `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`,
    pharmacists,
    schedule,
    notes,
    savedAt: new Date().toISOString(),
  };
}

// 生成檔案名稱
export function generateFileName(currentMonth: Date): string {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
  
  return `排班存檔_${year}年${String(month).padStart(2, '0')}月_${timestamp}.json`;
}

// 儲存到檔案
export async function saveToFile(saveData: SaveData, filename?: string): Promise<SaveResult> {
  try {
    // 使用 Zod 驗證資料
    const validated = SaveDataSchema.parse(saveData);
    
    const jsonString = JSON.stringify(validated, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || generateFileName(new Date(validated.currentMonth + '-01'));
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('存檔失敗:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    };
  }
}

// 從檔案讀取
export async function loadFromFile(file: File): Promise<LoadResult> {
  try {
    const text = await file.text();
    let data: unknown;
    
    try {
      data = JSON.parse(text);
    } catch {
      return {
        success: false,
        errors: ['檔案格式錯誤：無法解析 JSON'],
        warnings: []
      };
    }
    
    // 使用 Zod 驗證
    const validation = validateSaveData(data);
    
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
        warnings: validation.warnings
      };
    }
    
    // 版本相容性檢查
    const versionCheck = checkVersionCompatibility(validation.data!.version);
    if (!versionCheck.compatible) {
      return {
        success: false,
        errors: [versionCheck.message!],
        warnings: validation.warnings
      };
    }
    
    // 加入版本警告（如果有）
    const warnings = [...validation.warnings];
    if (versionCheck.message) {
      warnings.push(versionCheck.message);
    }
    
    return {
      success: true,
      data: validation.data!,
      errors: [],
      warnings
    };
  } catch (err) {
    return {
      success: false,
      errors: [`讀檔失敗: ${err instanceof Error ? err.message : '未知錯誤'}`],
      warnings: []
    };
  }
}

// 自動存檔到 LocalStorage
export function autoSave(
  currentMonth: Date,
  pharmacists: string[],
  schedule: Schedule,
  notes: Notes
): boolean {
  try {
    const saveData = createSaveData(currentMonth, pharmacists, schedule, notes);
    const validated = SaveDataSchema.parse(saveData);
    
    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(validated));
    return true;
  } catch (error) {
    console.error('自動存檔失敗:', error);
    return false;
  }
}

// 從 LocalStorage 讀取自動存檔
export function loadAutoSave(): LoadResult {
  try {
    const saved = localStorage.getItem(AUTO_SAVE_KEY);
    if (!saved) {
      return {
        success: false,
        errors: ['沒有找到自動存檔'],
        warnings: []
      };
    }
    
    const data = JSON.parse(saved);
    const validation = validateSaveData(data);
    
    if (!validation.isValid) {
      // 如果自動存檔損壞，清除它
      localStorage.removeItem(AUTO_SAVE_KEY);
      return {
        success: false,
        errors: ['自動存檔已損壞並已清除'],
        warnings: []
      };
    }
    
    return {
      success: true,
      data: validation.data!,
      errors: [],
      warnings: validation.warnings
    };
  } catch {
    // 清除損壞的自動存檔
    localStorage.removeItem(AUTO_SAVE_KEY);
    return {
      success: false,
      errors: ['自動存檔讀取失敗並已清除'],
      warnings: []
    };
  }
}

// 清除自動存檔
export function clearAutoSave(): void {
  localStorage.removeItem(AUTO_SAVE_KEY);
}

// 檢查是否有自動存檔
export function hasAutoSave(): boolean {
  return localStorage.getItem(AUTO_SAVE_KEY) !== null;
}

// 獲取自動存檔的基本資訊（不完整載入）
export function getAutoSaveInfo(): { hasAutoSave: boolean; savedAt?: string; month?: string } {
  try {
    const saved = localStorage.getItem(AUTO_SAVE_KEY);
    if (!saved) {
      return { hasAutoSave: false };
    }
    
    const data = JSON.parse(saved);
    return {
      hasAutoSave: true,
      savedAt: data.savedAt,
      month: data.currentMonth
    };
  } catch {
    return { hasAutoSave: false };
  }
}

// 工具函數：將 SaveData 轉換為應用程式狀態
export function saveDataToAppState(saveData: SaveData) {
  const currentMonth = new Date(saveData.currentMonth + '-01');
  
  return {
    currentMonth,
    pharmacists: saveData.pharmacists,
    schedule: saveData.schedule,
    notes: saveData.notes
  };
}