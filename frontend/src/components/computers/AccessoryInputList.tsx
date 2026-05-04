"use client";

import { Plus, Trash2, Package } from "lucide-react";
import { Button, Input } from "@/components/ui";
import type { ComputerAccessoryInput } from "@/types/computer";

interface Props {
  items: ComputerAccessoryInput[];
  onChange: (next: ComputerAccessoryInput[]) => void;
}

export function AccessoryInputList({ items, onChange }: Props) {
  const update = (index: number, patch: Partial<ComputerAccessoryInput>) => {
    onChange(items.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([...items, { name: "", note: "" }]);
  };

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-xl py-6 flex flex-col items-center text-gray-400 text-xs">
          <Package className="w-8 h-8 mb-1.5 opacity-50" />
          Дагалдах хэрэгсэл нэмээгүй байна
        </div>
      )}

      {items.map((a, i) => (
        <div
          key={i}
          className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2 items-end"
        >
          <Input
            label={i === 0 ? "Хэрэгслийн нэр" : undefined}
            value={a.name}
            onChange={(e) => update(i, { name: e.target.value })}
            placeholder="Хулгана, гар, цүнх..."
          />
          <Input
            label={i === 0 ? "Тайлбар (заавал биш)" : undefined}
            value={a.note ?? ""}
            onChange={(e) => update(i, { note: e.target.value })}
            placeholder="Жишээ: Logitech MX Master 3, серийн дугаар..."
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => remove(i)}
          />
        </div>
      ))}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        icon={<Plus className="w-4 h-4" />}
        onClick={add}
      >
        Хэрэгсэл нэмэх
      </Button>
    </div>
  );
}
