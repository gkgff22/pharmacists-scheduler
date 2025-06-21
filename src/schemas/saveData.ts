import { z } from 'zod';
import { migrateToLatest, validateLegacyData } from './migrations';

// 班別驗證
export const ShiftSchema = z.enum(['早', '午', '晚', '加']);

// 日期鍵驗證 (YYYY-MM-DD 格式)
export const DateKeySchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  "日期格式必須為 YYYY-MM-DD"
);

// 月份驗證 (YYYY-MM 格式)
export const MonthKeySchema = z.string().regex(
  /^\d{4}-\d{2}$/,
  "月份格式必須為 YYYY-MM"
);

// 排班資料驗證
export const ScheduleSchema = z.record(
  DateKeySchema,
  z.record(
    z.string().min(1, "藥師姓名不可為空"),
    z.array(ShiftSchema).max(4, "每日最多4個班別")
  )
);

// 備註驗證
export const NotesSchema = z.record(
  DateKeySchema,
  z.string().max(500, "備註長度不可超過500字")
);

// 完整存檔資料驗證
export const SaveDataSchema = z.object({
  version: z.string().min(1, "版本號不可為空"),
  currentMonth: MonthKeySchema,
  pharmacists: z.array(
    z.string().min(1, "藥師姓名不可為空")
  ).min(1, "至少需要一位藥師").max(20, "藥師數量不可超過20位"),
  schedule: ScheduleSchema,
  notes: NotesSchema,
  savedAt: z.string().datetime("存檔時間格式錯誤"),
}).strict(); // 嚴格模式，不允許額外欄位

// 衍生型別
export type SaveData = z.infer<typeof SaveDataSchema>;
export type Shift = z.infer<typeof ShiftSchema>;

// 驗證結果型別
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data?: SaveData;
}

// 驗證函數（支援版本遷移）
export function validateSaveData(data: unknown): ValidationResult {
  // 首先檢查是否為有效的舊版本格式
  if (typeof data === 'object' && data !== null && 'version' in data) {
    const legacyValidation = validateLegacyData(data as Record<string, unknown>);
    
    if (legacyValidation.isValid) {
      // 如果是舊版本且有效，嘗試遷移到最新版本
      const currentVersion = (typeof (data as Record<string, unknown>).version === 'string' 
        ? (data as Record<string, unknown>).version 
        : '1.0.0');
      const targetVersion = '1.0.0'; // 當前最新版本
      
      if (currentVersion !== targetVersion) {
        const migrationResult = migrateToLatest(data as Record<string, unknown>, targetVersion);
        
        if (migrationResult.success && migrationResult.data) {
          // 遷移成功，驗證遷移後的資料
          const result = SaveDataSchema.safeParse(migrationResult.data);
          
          if (result.success) {
            return {
              isValid: true,
              errors: [],
              warnings: [`資料已從版本 ${currentVersion} 自動升級到 ${targetVersion}`],
              data: result.data
            };
          } else {
            return {
              isValid: false,
              errors: [`遷移後資料驗證失敗: ${result.error.errors.map(e => e.message).join(', ')}`],
              warnings: []
            };
          }
        } else {
          return {
            isValid: false,
            errors: [`版本遷移失敗: ${migrationResult.error}`],
            warnings: []
          };
        }
      }
    } else {
      return {
        isValid: false,
        errors: [`舊版本資料格式錯誤: ${legacyValidation.errors.join(', ')}`],
        warnings: []
      };
    }
  }
  
  // 直接驗證最新版本格式
  const result = SaveDataSchema.safeParse(data);
  
  if (!result.success) {
    return {
      isValid: false,
      errors: result.error.errors.map(err => {
        const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
        return `${path}${err.message}`;
      }),
      warnings: [],
    };
  }
  
  // 額外的業務邏輯檢查
  const warnings: string[] = [];
  const saveData = result.data;
  
  // 檢查是否有空的排班月份
  if (Object.keys(saveData.schedule).length === 0) {
    warnings.push("排班資料為空");
  }
  
  // 檢查存檔時間是否過舊（超過6個月）
  const savedDate = new Date(saveData.savedAt);
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  if (savedDate < sixMonthsAgo) {
    warnings.push("此存檔已超過6個月，可能與當前版本不完全相容");
  }
  
  return {
    isValid: true,
    errors: [],
    warnings,
    data: saveData
  };
}

// 版本相容性檢查
export function checkVersionCompatibility(version: string): {
  compatible: boolean;
  message?: string;
} {
  const currentVersion = "1.0.0";
  
  // 簡單的版本比較邏輯
  if (version === currentVersion) {
    return { compatible: true };
  }
  
  // 主版本號不同，不相容
  const [major] = version.split('.');
  const [currentMajor] = currentVersion.split('.');
  
  if (major !== currentMajor) {
    return {
      compatible: false,
      message: `存檔版本 ${version} 與當前版本 ${currentVersion} 不相容`
    };
  }
  
  return {
    compatible: true,
    message: `存檔版本 ${version} 與當前版本 ${currentVersion} 相容，但可能有細微差異`
  };
}