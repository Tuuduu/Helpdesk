"use client";

import { Plus, Trash2, Star } from "lucide-react";
import { Button, Input, Select } from "@/components/ui";
import { MAC_TYPE_LABELS, type MacAddressType } from "@/lib/constants";
import { formatMacAddress } from "@/lib/utils";
import type { ComputerMacAddressInput } from "@/types/computer";

interface Props {
  items: ComputerMacAddressInput[];
  onChange: (next: ComputerMacAddressInput[]) => void;
}

const TYPE_OPTIONS = (Object.keys(MAC_TYPE_LABELS) as MacAddressType[]).map(
  (key) => ({ value: key, label: MAC_TYPE_LABELS[key] })
);

export function MacAddressInputList({ items, onChange }: Props) {
  const update = (index: number, patch: Partial<ComputerMacAddressInput>) => {
    const next = items.map((m, i) => (i === index ? { ...m, ...patch } : m));
    onChange(next);
  };

  const remove = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    // Хэрэв primary-г устгасан бол эхнийхээс primary болго
    if (items[index].isPrimary && next.length > 0) {
      next[0] = { ...next[0], isPrimary: true };
    }
    onChange(next);
  };

  const setPrimary = (index: number) => {
    const next = items.map((m, i) => ({ ...m, isPrimary: i === index }));
    onChange(next);
  };

  const add = () => {
    const isFirst = items.length === 0;
    onChange([
      ...items,
      { type: "Lan", address: "", label: "", isPrimary: isFirst },
    ]);
  };

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="text-xs text-gray-500 italic">
          Дор хаяж нэг MAC хаяг нэмнэ үү (LAN, Wi-Fi, эсвэл бусад)
        </p>
      )}

      {items.map((m, i) => (
        <div
          key={i}
          className="grid grid-cols-1 md:grid-cols-[120px_180px_1fr_auto_auto] gap-2 items-end"
        >
          <Select
            label={i === 0 ? "Төрөл" : undefined}
            options={TYPE_OPTIONS}
            value={m.type}
            onChange={(e) => update(i, { type: e.target.value as MacAddressType })}
          />
          <Input
            label={i === 0 ? "MAC хаяг" : undefined}
            value={m.address}
            onChange={(e) =>
              update(i, { address: formatMacAddress(e.target.value) })
            }
            placeholder="AA:BB:CC:DD:EE:FF"
            maxLength={17}
          />
          <Input
            label={i === 0 ? "Тэмдэглэл (заавал биш)" : undefined}
            value={m.label ?? ""}
            onChange={(e) => update(i, { label: e.target.value })}
            placeholder="Жишээ: Dock-ын Ethernet"
          />
          <Button
            type="button"
            variant={m.isPrimary ? "primary" : "ghost"}
            size="sm"
            icon={
              <Star
                className={`w-4 h-4 ${m.isPrimary ? "fill-white" : ""}`}
              />
            }
            onClick={() => setPrimary(i)}
            title={m.isPrimary ? "Үндсэн" : "Үндсэн болгох"}
          >
            {m.isPrimary ? "Үндсэн" : ""}
          </Button>
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
        MAC хаяг нэмэх
      </Button>
    </div>
  );
}
