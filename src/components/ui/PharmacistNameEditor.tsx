import { useState } from "react";
import { Save, X } from "lucide-react";

interface PharmacistNameEditorProps {
  name: string;
  onSave: (newName: string) => void;
  onCancel: () => void;
}

export const PharmacistNameEditor = ({
  name,
  onSave,
  onCancel,
}: PharmacistNameEditorProps) => {
  const [newName, setNewName] = useState(name);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(newName);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <input
        type="text"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        onKeyDown={handleKeyDown}
        className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="輸入藥師姓名"
        autoFocus
        maxLength={10}
      />
      <div className="flex gap-1">
        <button
          type="submit"
          className="flex-1 px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
        >
          <Save size={10} className="inline mr-1" />
          確定
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
        >
          <X size={10} className="inline mr-1" />
          取消
        </button>
      </div>
    </form>
  );
};
