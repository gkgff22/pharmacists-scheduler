/**
 * Schema 版本遷移範例
 * 
 * 展示如何處理不同版本的存檔資料
 */

import { validateSaveData } from '../src/schemas/saveData';
import { migrateToLatest } from '../src/schemas/migrations';

// 模擬不同版本的存檔資料
const examples = {
  // V1.0.0 - 原始版本（沒有加班）
  v1_0_0: {
    version: "1.0.0",
    currentMonth: "2025-01",
    pharmacists: ["邱", "黃", "李", "陳"],
    schedule: {
      "2025-01-01": {
        "邱": ["早", "午"],
        "黃": ["晚"],
        "李": [],
        "陳": ["午"]
      }
    },
    notes: {
      "2025-01-01": "元旦假期"
    },
    savedAt: "2025-01-01T12:00:00.000Z"
  },

  // V1.1.0 - 新增加班功能
  v1_1_0: {
    version: "1.1.0", 
    currentMonth: "2025-01",
    pharmacists: ["邱", "黃", "李", "陳"],
    schedule: {
      "2025-01-01": {
        "邱": ["早", "午", "加"], // 新增加班
        "黃": ["晚"],
        "李": [],
        "陳": ["午"]
      }
    },
    notes: {
      "2025-01-01": "元旦假期"
    },
    savedAt: "2025-01-01T12:00:00.000Z"
  },

  // V1.2.0 - 新增 metadata
  v1_2_0: {
    version: "1.2.0",
    currentMonth: "2025-01", 
    pharmacists: ["邱", "黃", "李", "陳"],
    schedule: {
      "2025-01-01": {
        "邱": ["早", "午", "加"],
        "黃": ["晚"],
        "李": [],
        "陳": ["午"]
      }
    },
    notes: {
      "2025-01-01": "元旦假期"
    },
    savedAt: "2025-01-01T12:00:00.000Z",
    metadata: {
      creator: "管理員",
      department: "藥劑科"
    }
  },

  // 無版本號的資料（視為 1.0.0）
  legacy: {
    currentMonth: "2025-01",
    pharmacists: ["邱", "黃"],
    schedule: {
      "2025-01-01": {
        "邱": ["早"],
        "黃": ["晚"]
      }
    },
    notes: {},
    savedAt: "2025-01-01T12:00:00.000Z"
  }
};

// 測試驗證和遷移
export function testSchemaMigration() {
  console.log('=== Schema 版本遷移測試 ===\n');

  Object.entries(examples).forEach(([label, data]) => {
    console.log(`🔸 測試 ${label}:`);
    
    const validation = validateSaveData(data);
    
    if (validation.isValid) {
      console.log('  ✅ 驗證成功');
      if (validation.warnings.length > 0) {
        console.log('  ⚠️  警告:', validation.warnings.join(', '));
      }
      console.log('  📦 最終資料版本:', validation.data?.version);
    } else {
      console.log('  ❌ 驗證失敗:', validation.errors.join(', '));
    }
    console.log('');
  });
}

// 手動遷移範例
export function manualMigrationExample() {
  console.log('=== 手動遷移範例 ===\n');
  
  const oldData = examples.v1_0_0;
  console.log('原始資料版本:', oldData.version);
  
  const migrationResult = migrateToLatest(oldData, '1.2.0');
  
  if (migrationResult.success && migrationResult.data) {
    console.log('✅ 遷移成功!');
    console.log('新版本:', (migrationResult.data as { version: string }).version);
    console.log('新欄位:', (migrationResult.data as { metadata?: unknown }).metadata);
  } else {
    console.log('❌ 遷移失敗:', migrationResult.error);
  }
}

// 模擬實際使用情境
export function simulateRealWorldUsage() {
  console.log('=== 實際使用情境模擬 ===\n');
  
  // 情境1: 用戶載入舊版本存檔
  console.log('📁 用戶載入 V1.0.0 存檔...');
  const userFile = examples.v1_0_0;
  const validation = validateSaveData(userFile);
  
  if (validation.isValid) {
    console.log('✅ 存檔已成功載入並升級到最新版本');
    console.log('📊 可用功能: 基本排班 + 加班功能 + 進階管理');
  }
  
  console.log('');
  
  // 情境2: 處理未來版本的存檔
  console.log('📁 處理未來版本存檔...');
  const futureData = { ...examples.v1_2_0, version: '2.0.0' };
  const futureValidation = validateSaveData(futureData);
  
  if (!futureValidation.isValid) {
    console.log('⚠️  偵測到更新版本的存檔，建議更新應用程式');
  }
}

// 如果直接執行此檔案，運行測試
if (require.main === module) {
  testSchemaMigration();
  manualMigrationExample();
  simulateRealWorldUsage();
}