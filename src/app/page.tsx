"use client";

import { useState, useEffect } from "react";
import { ScheduleTable } from "@/components/schedule/ScheduleTable";
import { Schedule, Notes, Shift, PharmacistStats } from "@/types/schedule";
import {
  getDaysInMonth,
  getRequiredShifts,
  calculateStats,
  getDayName,
} from "@/utils/scheduleUtils";

export default function Home() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [pharmacists, setPharmacists] = useState([
    "王藥師",
    "李藥師",
    "張藥師",
    "陳藥師",
  ]);
  const [schedule, setSchedule] = useState<Schedule>({});
  const [violations, setViolations] = useState<string[]>([]);
  const [notes, setNotes] = useState<Notes>({});
  const [showStats, setShowStats] = useState(true);

  // 檢查排班違規
  const checkViolations = () => {
    const newViolations: string[] = [];
    const days = getDaysInMonth(currentMonth);

    days.forEach((day) => {
      const dateKey = day.toISOString().split("T")[0];
      const daySchedule = schedule[dateKey] || {};
      const required = getRequiredShifts(day);
      const dayOfWeek = day.getDay();

      if (dayOfWeek === 0) return; // 週日跳過

      // 檢查每個時段的人數
      (["morning", "afternoon", "evening"] as const).forEach((period) => {
        const periodName =
          period === "morning" ? "早" : period === "afternoon" ? "午" : "晚";
        const requiredCount = required[period];

        if (requiredCount > 0) {
          const actualCount = pharmacists.filter((p) =>
            (daySchedule[p] || []).includes(periodName)
          ).length;

          if (actualCount !== requiredCount) {
            newViolations.push(
              `${
                day.getMonth() + 1
              }/${day.getDate()} ${periodName}班人數不符：需要${requiredCount}人，實際${actualCount}人`
            );
          }
        }
      });

      // 檢查週一每人最多兩節的限制
      if (dayOfWeek === 1) {
        pharmacists.forEach((pharmacist) => {
          const shifts = daySchedule[pharmacist] || [];
          if (shifts.length > 2) {
            newViolations.push(
              `${
                day.getMonth() + 1
              }/${day.getDate()} ${pharmacist}超過週一最多兩節限制`
            );
          }
        });
      }
    });

    // 檢查統計平衡
    const stats = calculateStats(currentMonth, schedule, pharmacists);
    const avgHolidays =
      Object.values(stats).reduce(
        (sum, s: PharmacistStats) => sum + s.holidays,
        0
      ) / 4;
    const avgShifts =
      Object.values(stats).reduce(
        (sum, s: PharmacistStats) => sum + s.shifts,
        0
      ) / 4;
    const avgMorningEvening =
      Object.values(stats).reduce(
        (sum, s: PharmacistStats) => sum + s.morningEveningDays,
        0
      ) / 4;
    const avgMondayHolidays =
      Object.values(stats).reduce(
        (sum, s: PharmacistStats) => sum + s.mondayHolidays,
        0
      ) / 4;
    const avgSaturdayHolidays =
      Object.values(stats).reduce(
        (sum, s: PharmacistStats) => sum + s.saturdayHolidays,
        0
      ) / 4;

    pharmacists.forEach((pharmacist) => {
      const s = stats[pharmacist];
      if (Math.abs(s.holidays - avgHolidays) > 2) {
        newViolations.push(`${pharmacist}假期天數不平均`);
      }
      if (Math.abs(s.shifts - avgShifts) > 3) {
        newViolations.push(`${pharmacist}上班節數不平均`);
      }
      if (Math.abs(s.morningEveningDays - avgMorningEvening) > 1) {
        newViolations.push(`${pharmacist}早晚班天數不平均`);
      }
      if (Math.abs(s.mondayHolidays - avgMondayHolidays) > 1) {
        newViolations.push(`${pharmacist}週一假期不平均`);
      }
      if (Math.abs(s.saturdayHolidays - avgSaturdayHolidays) > 1) {
        newViolations.push(`${pharmacist}週六假期不平均`);
      }
    });

    setViolations(newViolations);
  };

  useEffect(() => {
    checkViolations();
  }, [schedule, currentMonth]);

  // 處理班別編輯
  const handleShiftEdit = (
    date: Date,
    pharmacist: string,
    newShifts: Shift[]
  ) => {
    const dateKey = date.toISOString().split("T")[0];
    setSchedule((prev) => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        [pharmacist]: newShifts,
      },
    }));
  };

  // 處理藥師名稱編輯
  const handlePharmacistNameEdit = (oldName: string, newName: string) => {
    if (newName.trim() === "" || newName === oldName) {
      return;
    }

    // 更新藥師名單
    setPharmacists((prev) =>
      prev.map((name) => (name === oldName ? newName.trim() : name))
    );

    // 更新排班記錄中的藥師名稱
    setSchedule((prev) => {
      const newSchedule = { ...prev };
      Object.keys(newSchedule).forEach((dateKey) => {
        if (newSchedule[dateKey][oldName]) {
          newSchedule[dateKey][newName.trim()] = newSchedule[dateKey][oldName];
          delete newSchedule[dateKey][oldName];
        }
      });
      return newSchedule;
    });
  };

  // 處理備註編輯
  const handleNoteEdit = (date: Date, note: string) => {
    const dateKey = date.toISOString().split("T")[0];
    setNotes((prev) => ({
      ...prev,
      [dateKey]: note,
    }));
  };

  // 導出為日曆格式
  const exportCalendar = () => {
    try {
      // 如果有違規，先詢問用戶是否確定要導出
      if (violations.length > 0) {
        const confirmMessage = `目前排班存在 ${
          violations.length
        } 項違規：\n\n${violations.slice(0, 5).join("\n")}${
          violations.length > 5 ? "\n...(還有更多違規項目)" : ""
        }\n\n確定要導出日曆嗎？`;

        if (!window.confirm(confirmMessage)) {
          return; // 用戶選擇取消，不繼續導出
        }
      }

      const days = getDaysInMonth(currentMonth);
      let calendarData =
        "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//藥師排班系統//NONSGML v1.0//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n";

      days.forEach((day) => {
        const dateKey = day.toISOString().split("T")[0];
        const daySchedule = schedule[dateKey] || {};
        const dateStr = dateKey.replace(/-/g, "");

        pharmacists.forEach((pharmacist) => {
          const shifts = daySchedule[pharmacist] || [];
          if (shifts.length > 0) {
            const shiftText = shifts.join("");
            const uid = `${dateStr}-${pharmacist.replace(
              /\s/g,
              ""
            )}-${Math.random().toString(36).substr(2, 9)}`;

            calendarData += `BEGIN:VEVENT\n`;
            calendarData += `UID:${uid}\n`;
            calendarData += `DTSTART;VALUE=DATE:${dateStr}\n`;
            calendarData += `DTEND;VALUE=DATE:${dateStr}\n`;
            calendarData += `SUMMARY:${pharmacist} - ${shiftText}班\n`;
            calendarData += `DESCRIPTION:藥師排班：${shiftText}班\n`;
            calendarData += `DTSTAMP:${
              new Date().toISOString().replace(/[-:]/g, "").split(".")[0]
            }Z\n`;
            calendarData += `END:VEVENT\n`;
          }
        });
      });

      calendarData += "END:VCALENDAR";

      // 創建並下載文件
      const blob = new Blob([calendarData], {
        type: "text/calendar;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `藥師排班_${currentMonth.getFullYear()}_${
        currentMonth.getMonth() + 1
      }.ics`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // 顯示成功訊息
      alert(
        "日曆文件已成功下載！可以匯入到 Google Calendar 或 Apple 日曆中使用。"
      );
    } catch (error) {
      console.error("導出日曆時發生錯誤:", error);
      alert("導出日曆時發生錯誤，請稍後再試。");
    }
  };

  // 導出為圖片 - 月曆格式
  const handleExportImage = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 設置畫布大小和樣式
    const cellWidth = 180;
    const cellHeight = 140;
    const headerHeight = 50;
    const titleHeight = 60;
    const padding = 20;

    const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

    // 計算月曆佈局
    const firstDay = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    const lastDay = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    );
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // 從週日開始

    const totalWeeks = Math.ceil((lastDay.getDate() + firstDay.getDay()) / 7);

    const totalWidth = cellWidth * 7 + padding * 2;
    const totalHeight =
      titleHeight + headerHeight + cellHeight * totalWeeks + padding * 2;

    canvas.width = totalWidth;
    canvas.height = totalHeight;

    // 設置背景為白色
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 繪製標題
    ctx.fillStyle = "#1e40af";
    ctx.font = "bold 28px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      `${currentMonth.getFullYear()}年 ${
        currentMonth.getMonth() + 1
      }月 藥師排班表`,
      totalWidth / 2,
      padding + titleHeight / 2 + 10
    );

    // 繪製星期標題背景
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(
      padding,
      padding + titleHeight,
      totalWidth - padding * 2,
      headerHeight
    );

    // 繪製星期標題邊框
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      padding,
      padding + titleHeight,
      totalWidth - padding * 2,
      headerHeight
    );

    // 繪製星期標題
    weekDays.forEach((day, index) => {
      const x = padding + cellWidth * index;
      const isWeekend = index === 0 || index === 6;

      ctx.fillStyle = isWeekend ? "#dc2626" : "#1f2937";
      ctx.font = "bold 18px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        day,
        x + cellWidth / 2,
        padding + titleHeight + headerHeight / 2 + 7
      );
    });

    // 繪製月曆格子
    for (let week = 0; week < totalWeeks; week++) {
      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + week * 7 + dayOfWeek);

        const x = padding + cellWidth * dayOfWeek;
        const y = padding + titleHeight + headerHeight + cellHeight * week;

        const isCurrentMonth =
          currentDate.getMonth() === currentMonth.getMonth();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isToday =
          currentDate.toDateString() === new Date().toDateString();

        // 設置格子背景色
        if (!isCurrentMonth) {
          ctx.fillStyle = "#f8fafc";
        } else if (isToday) {
          ctx.fillStyle = "#fef3c7";
        } else if (isWeekend) {
          ctx.fillStyle = "#fef2f2";
        } else {
          ctx.fillStyle = "#ffffff";
        }

        ctx.fillRect(x, y, cellWidth, cellHeight);

        // 繪製格子邊框
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellWidth, cellHeight);

        // 繪製日期數字
        const dateNum = currentDate.getDate();
        ctx.fillStyle = isCurrentMonth
          ? isWeekend
            ? "#dc2626"
            : "#1f2937"
          : "#9ca3af";
        ctx.font = isToday
          ? "bold 16px Arial, sans-serif"
          : "14px Arial, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(dateNum.toString(), x + 8, y + 20);

        // 如果是當前月份的日期，繪製排班信息
        if (isCurrentMonth) {
          const dateKey = currentDate.toISOString().split("T")[0];
          const daySchedule = schedule[dateKey] || {};

          // 定義藥師顏色（使用不同的色調）
          const pharmacistColors = [
            { bg: "#fef3c7", text: "#92400e" }, // 黃色系
            { bg: "#dbeafe", text: "#1e40af" }, // 藍色系
            { bg: "#f3e8ff", text: "#6b21a8" }, // 紫色系
            { bg: "#dcfce7", text: "#166534" }, // 綠色系
          ];

          // 計算三行的高度和位置（移除時段標籤）
          const rowHeight = (cellHeight - 50) / 3; // 減去日期和padding的空間
          const rowWidth = cellWidth - 16; // 減去左右padding
          const startY = y + 30;

          // 繪製三行（早、中、晚）
          const periods = ["早", "中", "晚"];
          const periodMapping = { 早: "早", 中: "午", 晚: "晚" }; // 映射到實際的班別名稱

          periods.forEach((period, rowIndex) => {
            const rowY = startY + rowIndex * rowHeight;
            const rowX = x + 8;

            // 收集該時段的藥師
            const periodPharmacists = [];
            pharmacists.forEach((pharmacist, pharmacistIndex) => {
              const shifts = daySchedule[pharmacist] || [];
              const actualPeriod = periodMapping[period];
              if (shifts.includes(actualPeriod)) {
                periodPharmacists.push({
                  name: pharmacist.charAt(0), // 只取姓氏
                  color:
                    pharmacistColors[pharmacistIndex % pharmacistColors.length],
                });
              }
            });

            // 繪製該時段的藥師（填滿整個時段區域）
            const contentX = rowX;
            const contentWidth = rowWidth;
            const contentHeight = rowHeight - 2; // 減去邊框

            if (periodPharmacists.length > 0) {
              // 計算每個藥師色塊的寬度
              const blockWidth = contentWidth / periodPharmacists.length;

              periodPharmacists.forEach((pharmacist, index) => {
                const blockX = contentX + index * blockWidth;
                const blockY = rowY + 1;

                // 繪製藥師色塊背景
                ctx.fillStyle = pharmacist.color.bg;
                ctx.fillRect(blockX, blockY, blockWidth, contentHeight);

                // 繪製色塊邊框
                ctx.strokeStyle = pharmacist.color.text;
                ctx.lineWidth = 1;
                ctx.strokeRect(blockX, blockY, blockWidth, contentHeight);

                // 繪製藥師姓氏
                ctx.fillStyle = pharmacist.color.text;
                ctx.font = "bold 12px Arial, sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(
                  pharmacist.name,
                  blockX + blockWidth / 2,
                  blockY + contentHeight / 2 + 4
                );
              });
            } else {
              // 如果該時段沒有人，填滿整個區域並顯示 "-"
              ctx.fillStyle = "#f8fafc";
              ctx.fillRect(contentX, rowY + 1, contentWidth, contentHeight);

              ctx.strokeStyle = "#e2e8f0";
              ctx.lineWidth = 1;
              ctx.strokeRect(contentX, rowY + 1, contentWidth, contentHeight);

              ctx.fillStyle = "#9ca3af";
              ctx.font = "12px Arial, sans-serif";
              ctx.textAlign = "center";
              ctx.fillText(
                "-",
                contentX + contentWidth / 2,
                rowY + rowHeight / 2 + 4
              );
            }
          });

          // 如果週日，顯示公休
          if (dayOfWeek === 0) {
            ctx.fillStyle = "#dc2626";
            ctx.font = "12px Arial, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("公休", x + cellWidth / 2, y + cellHeight / 2 + 5);
          }

          // 繪製備註（如果有）
          const note = notes[dateKey];
          if (note && note.trim()) {
            ctx.fillStyle = "#ef4444";
            ctx.font = "10px Arial, sans-serif";
            ctx.textAlign = "left";
            const noteText =
              note.length > 10 ? note.substring(0, 10) + "..." : note;
            ctx.fillText("備註:" + noteText, x + 8, y + cellHeight - 8);
          }
        }
      }
    }

    // 繪製圖例
    const legendY =
      padding + titleHeight + headerHeight + cellHeight * totalWeeks + 10;
    ctx.fillStyle = "#6b7280";
    ctx.font = "12px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("圖例：", padding, legendY);

    // 藥師顏色圖例
    const pharmacistColors = [
      { bg: "#fef3c7", text: "#92400e" }, // 黃色系
      { bg: "#dbeafe", text: "#1e40af" }, // 藍色系
      { bg: "#f3e8ff", text: "#6b21a8" }, // 紫色系
      { bg: "#dcfce7", text: "#166534" }, // 綠色系
    ];

    pharmacists.forEach((pharmacist, index) => {
      const legendX = padding + 50 + index * 100;
      const color = pharmacistColors[index % pharmacistColors.length];

      // 繪製藥師圓圈圖例
      ctx.fillStyle = color.bg;
      ctx.beginPath();
      ctx.arc(legendX + 10, legendY - 5, 8, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = color.text;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(legendX + 10, legendY - 5, 8, 0, 2 * Math.PI);
      ctx.stroke();

      // 繪製藥師姓氏
      ctx.fillStyle = color.text;
      ctx.font = "bold 10px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(pharmacist.charAt(0), legendX + 10, legendY - 2);

      // 繪製藥師全名
      ctx.fillStyle = "#374151";
      ctx.font = "12px Arial, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(pharmacist, legendX + 25, legendY);
    });

    // 轉換為圖片並下載
    canvas.toBlob((blob) => {
      if (!blob) {
        alert("無法生成圖片");
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `藥師排班月曆_${currentMonth.getFullYear()}年${(
        currentMonth.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}月.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert("月曆已成功匯出為圖片！");
    });
  };

  // 分享圖片
  const handleShareImage = async () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 設置畫布大小和樣式
    const cellWidth = 180;
    const cellHeight = 140;
    const headerHeight = 50;
    const titleHeight = 60;
    const padding = 20;

    // ... 複製 handleExportImage 中的繪圖代碼 ...

    // 轉換為 base64 圖片
    const base64Image = canvas.toDataURL("image/png");

    // 創建分享選單
    const shareMenu = document.createElement("div");
    shareMenu.className =
      "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
    shareMenu.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold mb-4">分享排班表</h3>
        <div class="grid grid-cols-2 gap-4">
          <button class="share-btn flex items-center justify-center p-3 bg-[#06C755] text-white rounded-lg hover:bg-opacity-90" data-type="line">
            <svg class="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.346 0 .627.285.627.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
            </svg>
            Line
          </button>
          <button class="share-btn flex items-center justify-center p-3 bg-[#0084FF] text-white rounded-lg hover:bg-opacity-90" data-type="messenger">
            <svg class="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 4.477 0 10c0 2.5 1.1 4.8 2.9 6.4L2 24l7.3-1.9c1.6.4 3.3.7 5 .7 6.627 0 12-4.477 12-10S18.627 0 12 0zm.1 16.9c-2.7 0-5.3-1.2-7.2-3.3-1.9-2.1-2.9-4.9-2.9-7.8 0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8z"/>
            </svg>
            Messenger
          </button>
          <button class="share-btn flex items-center justify-center p-3 bg-[#0088cc] text-white rounded-lg hover:bg-opacity-90" data-type="telegram">
            <svg class="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.341c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.535.223l.19-2.72 5.56-5.023c.232-.21-.05-.327-.358-.118l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.535-.197 1.002.13.832.953z"/>
            </svg>
            Telegram
          </button>
          <button class="share-btn flex items-center justify-center p-3 bg-gray-600 text-white rounded-lg hover:bg-opacity-90" data-type="copy">
            <svg class="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M8 4v12a2 2 0 002 2h8a2 2 0 002-2V7.242a2 2 0 00-.602-1.43L16.083 2.57A2 2 0 0014.685 2H10a2 2 0 00-2 2z"/>
              <path d="M16 18v2a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h2"/>
            </svg>
            複製連結
          </button>
        </div>
        <button class="mt-4 w-full p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300" onclick="this.closest('.fixed').remove()">
          取消
        </button>
      </div>
    `;

    // 添加分享按鈕事件監聽
    shareMenu.querySelectorAll(".share-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const type = (e.currentTarget as HTMLElement).dataset.type;
        const shareText = `${currentMonth.getFullYear()}年${
          currentMonth.getMonth() + 1
        }月藥師排班表`;

        switch (type) {
          case "line":
            window.open(
              `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
                base64Image
              )}&text=${encodeURIComponent(shareText)}`
            );
            break;
          case "messenger":
            window.open(
              `https://www.facebook.com/dialog/share?app_id=YOUR_APP_ID&display=popup&href=${encodeURIComponent(
                base64Image
              )}&quote=${encodeURIComponent(shareText)}`
            );
            break;
          case "telegram":
            window.open(
              `https://t.me/share/url?url=${encodeURIComponent(
                base64Image
              )}&text=${encodeURIComponent(shareText)}`
            );
            break;
          case "copy":
            try {
              await navigator.clipboard.writeText(base64Image);
              alert("圖片連結已複製到剪貼簿！");
            } catch (err) {
              alert("複製失敗，請手動複製圖片。");
            }
            break;
        }
        shareMenu.remove();
      });
    });

    document.body.appendChild(shareMenu);
  };

  return (
    <ScheduleTable
      currentMonth={currentMonth}
      pharmacists={pharmacists}
      schedule={schedule}
      notes={notes}
      violations={violations}
      showStats={showStats}
      onMonthChange={setCurrentMonth}
      onPharmacistNameEdit={handlePharmacistNameEdit}
      onShiftEdit={handleShiftEdit}
      onNoteEdit={handleNoteEdit}
      onExportCalendar={exportCalendar}
      onExportImage={handleExportImage}
      onShareImage={handleShareImage}
      onToggleStats={() => setShowStats(!showStats)}
    />
  );
}
