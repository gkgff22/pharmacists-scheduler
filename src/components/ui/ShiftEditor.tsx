import { useState } from "react";
import { Save, X } from "lucide-react";
import { Shift } from "@/types/schedule";

interface ShiftEditorProps {
  shifts: Shift[];
  onSave: (shifts: Shift[]) => void;
  onCancel: () => void;
}

export const ShiftEditor = ({ shifts, onSave, onCancel }: ShiftEditorProps) => {
  const [selectedShifts, setSelectedShifts] = useState<Shift[]>([...shifts]);

  const toggleShift = (shift: Shift) => {
    setSelectedShifts((prev) =>
      prev.includes(shift) ? prev.filter((s) => s !== shift) : [...prev, shift]
    );
  };

  return (
    <div className="flex flex-col gap-2 p-2 bg-gray-50 rounded">
      <div className="flex gap-1">
        {(["早", "午", "晚", "加"] as Shift[]).map((shift) => (
          <button
            key={shift}
            onClick={() => toggleShift(shift)}
            className={`px-2 py-1 rounded text-sm font-medium ${
              selectedShifts.includes(shift)
                ? shift === "早"
                  ? "bg-yellow-500 text-white"
                  : shift === "午"
                  ? "bg-blue-500 text-white"
                  : "bg-purple-500 text-white"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
          >
            {shift}
          </button>
        ))}
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => onSave(selectedShifts)}
          className="flex-1 px-2 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
        >
          <Save size={12} className="inline mr-1" />
          確定
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-2 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
        >
          <X size={12} className="inline mr-1" />
          取消
        </button>
      </div>
    </div>
  );
};
