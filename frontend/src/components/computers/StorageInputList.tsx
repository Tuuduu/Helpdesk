"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button, Input, Select } from "@/components/ui";
import { STORAGE_TYPE_LABELS, type StorageType } from "@/lib/constants";
import type { ComputerStorageInput } from "@/types/computer";

interface Props {
  storages: ComputerStorageInput[];
  onChange: (next: ComputerStorageInput[]) => void;
}

const STORAGE_TYPE_OPTIONS = (Object.keys(STORAGE_TYPE_LABELS) as StorageType[]).map(
  (key) => ({ value: key, label: STORAGE_TYPE_LABELS[key] })
);

export function StorageInputList({ storages, onChange }: Props) {
  const update = (index: number, patch: Partial<ComputerStorageInput>) => {
    const next = storages.map((s, i) => (i === index ? { ...s, ...patch } : s));
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(storages.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([...storages, { type: "SSD", capacityGb: 256, modelName: "" }]);
  };

  return (
    <div className="space-y-3">
      {storages.length === 0 && (
        <p className="text-xs text-gray-500 italic">
          Дор хаяж нэг хадгалах төхөөрөмж нэмнэ үү
        </p>
      )}

      {storages.map((s, i) => (
        <div
          key={i}
          className="grid grid-cols-1 md:grid-cols-[140px_120px_1fr_auto] gap-2 items-end"
        >
          <Select
            label={i === 0 ? "Төрөл" : undefined}
            options={STORAGE_TYPE_OPTIONS}
            value={s.type}
            onChange={(e) => update(i, { type: e.target.value as StorageType })}
          />
          <Input
            label={i === 0 ? "Багтаамж (GB)" : undefined}
            type="number"
            min={1}
            value={s.capacityGb || ""}
            onChange={(e) =>
              update(i, { capacityGb: parseInt(e.target.value) || 0 })
            }
          />
          <Input
            label={i === 0 ? "Загвар (заавал биш)" : undefined}
            value={s.modelName ?? ""}
            onChange={(e) => update(i, { modelName: e.target.value })}
            placeholder="WD Blue, Samsung 970 Evo..."
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => remove(i)}
          >
            Хасах
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        icon={<Plus className="w-4 h-4" />}
        onClick={add}
      >
        Storage нэмэх
      </Button>
    </div>
  );
}
