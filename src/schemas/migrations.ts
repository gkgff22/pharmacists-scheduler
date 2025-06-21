import { z } from 'zod';

// 版本資訊介面
export interface VersionInfo {
  major: number;
  minor: number;
  patch: number;
}

// 遷移函數類型
export type MigrationFunction = (data: Record<string, unknown>) => Record<string, unknown>;

// 解析版本號
export const parseVersion = (version: string): VersionInfo => {
  const [major = 1, minor = 0, patch = 0] = version.split('.').map(Number);
  return { major, minor, patch };
};

// 比較版本號
export const compareVersions = (v1: VersionInfo, v2: VersionInfo): number => {
  if (v1.major !== v2.major) return v1.major - v2.major;
  if (v1.minor !== v2.minor) return v1.minor - v2.minor;
  return v1.patch - v2.patch;
};

// 歷史 Schema 定義（用於驗證舊格式）
export const SaveDataV1_0_0 = z.object({
  version: z.string(),
  currentMonth: z.string().regex(/^\d{4}-\d{2}$/),
  pharmacists: z.array(z.string()).min(1).max(20),
  schedule: z.record(z.string(), z.record(z.string(), z.array(z.enum(['早', '午', '晚'])))), // 注意：沒有 '加' 班別
  notes: z.record(z.string(), z.string()),
  savedAt: z.string().datetime(),
});

export const SaveDataV1_1_0 = z.object({
  version: z.string(),
  currentMonth: z.string().regex(/^\d{4}-\d{2}$/),
  pharmacists: z.array(z.string()).min(1).max(20),
  schedule: z.record(z.string(), z.record(z.string(), z.array(z.enum(['早', '午', '晚', '加'])))), // 新增 '加' 班別
  notes: z.record(z.string(), z.string()),
  savedAt: z.string().datetime(),
});

export const SaveDataV1_2_0 = z.object({
  version: z.string(),
  currentMonth: z.string().regex(/^\d{4}-\d{2}$/),
  pharmacists: z.array(z.string()).min(1).max(20),
  schedule: z.record(z.string(), z.record(z.string(), z.array(z.enum(['早', '午', '晚', '加'])))),
  notes: z.record(z.string(), z.string()),
  savedAt: z.string().datetime(),
  // 假設未來新增的欄位
  metadata: z.object({
    creator: z.string().optional(),
    department: z.string().optional(),
  }).optional(),
});

// 遷移函數映射表
export const migrations: Record<string, MigrationFunction> = {
  // 從 1.0.0 升級到 1.1.0
  '1.0.0->1.1.0': (data: Record<string, unknown>) => {
    // V1.0.0 沒有 '加' 班別，確保升級後保持原有資料完整性
    return {
      ...data,
      version: '1.1.0',
      // schedule 資料結構不變，因為 '加' 班別是新增的，不影響舊資料
    };
  },

  // 從 1.1.0 升級到 1.2.0  
  '1.1.0->1.2.0': (data: Record<string, unknown>) => {
    return {
      ...data,
      version: '1.2.0',
      // 新增 metadata 欄位，但設為可選，不影響舊資料
      metadata: {
        creator: 'unknown',
        department: 'default',
      },
    };
  },

  // 從 1.0.0 直接升級到 1.2.0（跨版本遷移）
  '1.0.0->1.2.0': (data: Record<string, unknown>) => {
    // 先升級到 1.1.0，再升級到 1.2.0
    const intermediate = migrations['1.0.0->1.1.0'](data);
    return migrations['1.1.0->1.2.0'](intermediate);
  },
};

// 自動遷移函數
export const migrateToLatest = (data: Record<string, unknown>, targetVersion: string = '1.2.0'): {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
} => {
  try {
    const currentVersion = data.version || '1.0.0';
    
    if (currentVersion === targetVersion) {
      return { success: true, data };
    }

    const migrationKey = `${currentVersion}->${targetVersion}`;
    
    if (migrations[migrationKey]) {
      // 直接遷移
      const migratedData = migrations[migrationKey](data);
      return { success: true, data: migratedData };
    }

    // 嘗試逐步遷移（未來可擴展為自動路徑查找）
    const currentVer = parseVersion(currentVersion);
    const targetVer = parseVersion(targetVersion);
    
    if (compareVersions(currentVer, targetVer) > 0) {
      return { 
        success: false, 
        error: `無法從較新版本 ${currentVersion} 降級到 ${targetVersion}` 
      };
    }

    // 簡化的逐步遷移邏輯
    let migratedData = data;
    if (currentVersion === '1.0.0' && targetVersion === '1.2.0') {
      migratedData = migrations['1.0.0->1.2.0'](data);
      return { success: true, data: migratedData };
    }

    return { 
      success: false, 
      error: `沒有找到從 ${currentVersion} 到 ${targetVersion} 的遷移路徑` 
    };
  } catch (error) {
    return { 
      success: false, 
      error: `遷移過程中發生錯誤: ${error instanceof Error ? error.message : '未知錯誤'}` 
    };
  }
};

// 驗證舊版本資料
export const validateLegacyData = (data: Record<string, unknown>): {
  version: string;
  isValid: boolean;
  errors: string[];
} => {
  const version = (typeof data.version === 'string' ? data.version : '1.0.0');
  
  try {
    switch (version) {
      case '1.0.0':
        SaveDataV1_0_0.parse(data);
        return { version, isValid: true, errors: [] };
      
      case '1.1.0':
        SaveDataV1_1_0.parse(data);
        return { version, isValid: true, errors: [] };
        
      case '1.2.0':
        SaveDataV1_2_0.parse(data);
        return { version, isValid: true, errors: [] };
        
      default:
        return { 
          version, 
          isValid: false, 
          errors: [`不支援的版本: ${version}`] 
        };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        version,
        isValid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return {
      version,
      isValid: false,
      errors: ['未知驗證錯誤']
    };
  }
};