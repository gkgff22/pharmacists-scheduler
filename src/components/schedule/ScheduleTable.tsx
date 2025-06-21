import { useState } from "react";
import { Calendar, Users, AlertTriangle } from "lucide-react";
import { PharmacistNameEditor } from "../ui/PharmacistNameEditor";
import { ShiftEditor } from "../ui/ShiftEditor";
import { SaveLoadButtons, AutoSaveIndicator } from "../ui/SaveLoadButtons";
import {
  getDaysInMonth,
  getDayName,
  getRequiredShifts,
  calculateStats,
} from "@/utils/scheduleUtils";
import { Shift, Schedule, Notes } from "@/types/schedule";

interface ScheduleTableProps {
  currentMonth: Date;
  pharmacists: string[];
  schedule: Schedule;
  notes: Notes;
  violations: string[];
  showStats: boolean;
  lastAutoSave?: Date;
  isAutoSaving?: boolean;
  onMonthChange: (date: Date) => void;
  onPharmacistNameEdit: (oldName: string, newName: string) => void;
  onShiftEdit: (date: Date, pharmacist: string, shifts: Shift[]) => void;
  onNoteEdit: (date: Date, note: string) => void;
  onExportCalendar: () => void;
  onExportImage: () => void;
  onShareImage: () => void;
  onToggleStats: () => void;
  onSave: () => Promise<void>;
  onLoad: (file: File) => Promise<void>;
}

export const ScheduleTable = ({
  currentMonth,
  pharmacists,
  schedule,
  notes,
  violations,
  showStats,
  lastAutoSave,
  isAutoSaving,
  onMonthChange,
  onPharmacistNameEdit,
  onShiftEdit,
  onNoteEdit,
  onExportCalendar,
  onExportImage,
  onShareImage,
  onToggleStats,
  onSave,
  onLoad,
}: ScheduleTableProps) => {
  const [editingPharmacist, setEditingPharmacist] = useState<string | null>(
    null
  );
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const days = getDaysInMonth(currentMonth);
  const stats = calculateStats(currentMonth, schedule, pharmacists);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 標題欄 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="text-blue-600" size={32} />
              <h1 className="text-3xl font-bold text-gray-800">
                上允藥師排班管理系統
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={onToggleStats}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Users size={20} />
                統計面板
              </button>
              
              {/* 存檔讀檔按鈕 */}
              <SaveLoadButtons
                onSave={onSave}
                onLoad={onLoad}
              />
              
              <div className="flex gap-2">
                <button
                  onClick={onExportCalendar}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  匯出日曆
                </button>
                <button
                  onClick={onExportImage}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  匯出圖片
                </button>
                <button
                  onClick={onShareImage}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  分享
                </button>
                <button
                  onClick={onToggleStats}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  {showStats ? "隱藏統計" : "顯示統計"}
                </button>
              </div>
            </div>
          </div>
          
          {/* 自動存檔狀態指示器 */}
          <div className="flex justify-end mt-4">
            <AutoSaveIndicator 
              lastSaved={lastAutoSave}
              isSaving={isAutoSaving}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* 主要排班表 */}
          <div className="xl:col-span-3">
            <div className="bg-white rounded-xl shadow-lg p-6">
              {/* 月份控制 */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() =>
                    onMonthChange(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() - 1
                      )
                    )
                  }
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  上月
                </button>
                <h2 className="text-2xl font-bold text-gray-800">
                  {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
                </h2>
                <button
                  onClick={() =>
                    onMonthChange(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() + 1
                      )
                    )
                  }
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  下月
                </button>
              </div>

              {/* 排班表格 */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-3 text-left font-semibold">
                        日期
                      </th>
                      {pharmacists.map((pharmacist) => (
                        <th
                          key={pharmacist}
                          className="border border-gray-300 p-3 text-center font-semibold min-w-32"
                        >
                          {editingPharmacist === pharmacist ? (
                            <PharmacistNameEditor
                              name={pharmacist}
                              onSave={(newName) =>
                                onPharmacistNameEdit(pharmacist, newName)
                              }
                              onCancel={() => setEditingPharmacist(null)}
                            />
                          ) : (
                            <div
                              className="cursor-pointer hover:bg-blue-100 rounded p-1 transition-colors"
                              onClick={() => setEditingPharmacist(pharmacist)}
                              title="點擊編輯姓名"
                            >
                              {pharmacist}
                            </div>
                          )}
                        </th>
                      ))}
                      <th className="border border-gray-300 p-3 text-center font-semibold">
                        備註
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {days.map((day) => {
                      const dateKey = day.toISOString().split("T")[0];
                      const daySchedule = schedule[dateKey] || {};
                      const dayOfWeek = day.getDay();
                      const required = getRequiredShifts(day);

                      return (
                        <tr
                          key={dateKey}
                          className={`${
                            dayOfWeek === 0
                              ? "bg-red-50"
                              : dayOfWeek === 6
                              ? "bg-blue-50"
                              : "bg-white"
                          } hover:bg-gray-50`}
                        >
                          <td className="border border-gray-300 p-3 font-medium">
                            <div className="flex flex-col">
                              <span>{day.getDate()}</span>
                              <span className="text-sm text-gray-500">
                                週{getDayName(day)}
                              </span>
                              {required.morning > 0 && (
                                <div className="text-xs text-gray-400 mt-1">
                                  早{required.morning} 午{required.afternoon} 晚
                                  {required.evening}
                                </div>
                              )}
                            </div>
                          </td>
                          {pharmacists.map((pharmacist) => {
                            const shifts = daySchedule[pharmacist] || [];
                            const isEditing =
                              editingCell === `${dateKey}-${pharmacist}`;

                            return (
                              <td
                                key={pharmacist}
                                className="border border-gray-300 p-2"
                              >
                                {isEditing ? (
                                  <ShiftEditor
                                    shifts={shifts}
                                    onSave={(newShifts) => {
                                      onShiftEdit(day, pharmacist, newShifts);
                                      setEditingCell(null);
                                    }}
                                    onCancel={() => setEditingCell(null)}
                                  />
                                ) : (
                                  <div
                                    className="min-h-12 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded p-2"
                                    onClick={() =>
                                      setEditingCell(`${dateKey}-${pharmacist}`)
                                    }
                                  >
                                    {shifts.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {shifts.map((shift, idx) => (
                                          <span
                                            key={idx}
                                            className={`px-2 py-1 rounded text-sm font-medium ${
                                              shift === "早"
                                                ? "bg-yellow-200 text-yellow-800"
                                                : shift === "午"
                                                ? "bg-blue-200 text-blue-800"
                                                : "bg-purple-200 text-purple-800"
                                            }`}
                                          >
                                            {shift}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 text-sm">
                                        休假
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                          <td className="border border-gray-300 p-2">
                            <input
                              type="text"
                              value={notes[dateKey] || ""}
                              onChange={(e) => onNoteEdit(day, e.target.value)}
                              placeholder="備註..."
                              className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 側邊欄 */}
          <div className="space-y-6">
            {/* 統計面板 */}
            {showStats && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="text-blue-600" size={20} />
                  統計資訊
                </h3>
                <div className="space-y-4">
                  {pharmacists.map((pharmacist) => {
                    const stat = stats[pharmacist];
                    return (
                      <div
                        key={pharmacist}
                        className="border-b border-gray-200 pb-3"
                      >
                        <h4 className="font-semibold text-gray-700 mb-2">
                          {pharmacist}
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>假期：{stat.holidays}天</div>
                          <div>班數：{stat.shifts}節</div>
                          <div>早晚班：{stat.morningEveningDays}天</div>
                          <div>週一假：{stat.mondayHolidays}天</div>
                          <div>週六假：{stat.saturdayHolidays}天</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 違規提示 */}
            {violations.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">
                  <AlertTriangle className="text-red-600" size={20} />
                  排班違規提醒
                </h3>
                <div className="space-y-2">
                  {violations.map((violation, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
                    >
                      {violation}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 排班規則說明 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">排班規則</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <div>• 週一：早中晚各2人，每人最多2節</div>
                <div>• 週二~五：早1人，午1人，晚2人</div>
                <div>• 週六：早2人，午1人，晚1人</div>
                <div>• 週日：全天休息</div>
                <div>• 假期天數需平均分配</div>
                <div>• 早晚班天數需平均分配</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
