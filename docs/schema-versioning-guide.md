# Schema 版本管理指南

## 🎯 核心原則

### 1. 語義化版本號
- **MAJOR.MINOR.PATCH** (如 1.2.3)
- **MAJOR**: 破壞性變更，不向後兼容
- **MINOR**: 新功能，向後兼容  
- **PATCH**: 錯誤修復，完全兼容

### 2. 向前相容策略
```typescript
// ✅ 推薦：漸進式升級
const migrations = {
  '1.0.0->1.1.0': addOptionalFields,
  '1.1.0->1.2.0': addMetadata,
  '1.2.0->2.0.0': restructureData
};

// ❌ 避免：直接跳躍升級
const badMigration = {
  '1.0.0->2.0.0': massiveRestructure // 太複雜，容易出錯
};
```

## 🔧 實作檢查清單

### 新增功能時
- [ ] 新欄位設為可選 (`field?: Type`)
- [ ] 提供合理預設值
- [ ] 增加 MINOR 版本號
- [ ] 編寫遷移函數
- [ ] 新增測試案例

### 破壞性變更時
- [ ] 增加 MAJOR 版本號
- [ ] 保留舊版本 Schema 定義
- [ ] 實作資料轉換邏輯
- [ ] 提供回滾機制
- [ ] 更新文件說明

### 錯誤修復時
- [ ] 增加 PATCH 版本號
- [ ] 確保不影響資料結構
- [ ] 測試現有存檔相容性

## 🚀 部署策略

### 1. 漸進式部署
```typescript
// 階段1: 支援讀取舊格式
const canReadV1 = true;
const canWriteV2 = false;

// 階段2: 開始寫入新格式
const canReadV1 = true;  
const canWriteV2 = true;

// 階段3: 停止支援舊格式
const canReadV1 = false;
const canWriteV2 = true;
```

### 2. 錯誤處理
```typescript
try {
  const data = await loadUserData();
  const validation = validateSaveData(data);
  
  if (!validation.isValid) {
    // 記錄錯誤用於分析
    analytics.track('schema_validation_failed', {
      errors: validation.errors,
      userVersion: data.version,
      systemVersion: CURRENT_VERSION
    });
    
    // 提供用戶友善的錯誤訊息
    showUserError('檔案格式過舊，請更新應用程式');
  }
} catch (error) {
  // 處理未預期的錯誤
}
```

## 📊 監控指標

### 追蹤指標
- 各版本存檔的使用比例
- 遷移成功/失敗率
- 遷移執行時間
- 使用者升級率

### 告警設定
- 遷移失敗率 > 5%
- 舊版本使用率 > 20%（發布6個月後）
- 新版本驗證錯誤率 > 1%

## 🔍 測試策略

### 單元測試
```typescript
describe('Schema Migration', () => {
  test('should migrate v1.0.0 to v1.1.0', () => {
    const oldData = createV1_0_0Data();
    const result = migrateToLatest(oldData, '1.1.0');
    
    expect(result.success).toBe(true);
    expect(result.data.version).toBe('1.1.0');
  });
  
  test('should handle invalid migration', () => {
    const invalidData = { invalid: 'data' };
    const result = validateSaveData(invalidData);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('格式錯誤');
  });
});
```

### 整合測試
- 測試真實使用者存檔
- 驗證效能影響
- 檢查資料完整性

## 📚 相關資源

- [Zod Schema 驗證](https://zod.dev)
- [語義化版本規範](https://semver.org/lang/zh-TW/)
- [資料庫遷移最佳實踐](https://martinfowler.com/articles/evodb.html)