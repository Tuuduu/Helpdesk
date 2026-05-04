"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import { Monitor as MonitorIcon, Laptop } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  COMPUTER_STATUS_LABELS,
  COMPUTER_KIND_LABELS,
  type ComputerStatus,
  type ComputerKind,
} from "@/lib/constants";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel, Button, Input, Select, Spinner } from "@/components/ui";
import { StorageInputList } from "@/components/computers/StorageInputList";
import { MacAddressInputList } from "@/components/computers/MacAddressInputList";
import { AccessoryInputList } from "@/components/computers/AccessoryInputList";
import type {
  ComputerResponse,
  UpdateComputerRequest,
  ComputerStorageInput,
  ComputerMacAddressInput,
  ComputerAccessoryInput,
} from "@/types/computer";

const STATUS_OPTIONS = (
  Object.keys(COMPUTER_STATUS_LABELS) as ComputerStatus[]
).map((s) => ({ value: s, label: COMPUTER_STATUS_LABELS[s] }));

export default function EditComputerPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [original, setOriginal] = useState<ComputerResponse | null>(null);

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [monitor, setMonitor] = useState("");
  const [cpu, setCpu] = useState("");
  const [ramGb, setRamGb] = useState(0);
  const [gpu, setGpu] = useState("");
  const [domainName, setDomainName] = useState("");
  const [position, setPosition] = useState("");
  const [status, setStatus] = useState<ComputerStatus>("Active");
  const [kind, setKind] = useState<ComputerKind>("Desktop");
  const [storages, setStorages] = useState<ComputerStorageInput[]>([]);
  const [macAddresses, setMacAddresses] = useState<ComputerMacAddressInput[]>(
    []
  );
  const [accessories, setAccessories] = useState<ComputerAccessoryInput[]>([]);

  const fetchComputer = useCallback(async () => {
    setLoading(true);
    const res = await api.get<ComputerResponse>(`/computers/${id}`);
    if (res.success && res.data) {
      const c = res.data;
      setOriginal(c);
      setBrand(c.brand);
      setModel(c.model);
      setMonitor(c.monitor ?? "");
      setCpu(c.cpu);
      setRamGb(c.ramGb);
      setGpu(c.gpu ?? "");
      setDomainName(c.domainName ?? "");
      setPosition(c.position);
      setStatus(c.status as ComputerStatus);
      setStorages(
        c.storages.map((s) => ({
          type: s.type,
          capacityGb: s.capacityGb,
          modelName: s.modelName,
        }))
      );
      setMacAddresses(
        c.macAddresses.map((m) => ({
          type: m.type,
          address: m.address,
          label: m.label,
          isPrimary: m.isPrimary,
        }))
      );
      setKind((c.kind ?? "Desktop") as ComputerKind);
      setAccessories(
        (c.accessories ?? []).map((a) => ({ name: a.name, note: a.note }))
      );
    } else {
      toast.error(res.errors?.[0] || "Олдсонгүй");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchComputer();
  }, [fetchComputer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const body: UpdateComputerRequest = {
      kind,
      brand,
      model,
      monitor: monitor || undefined,
      cpu,
      ramGb,
      gpu: gpu || undefined,
      domainName: domainName || undefined,
      position,
      status,
      storages,
      macAddresses,
      accessories: accessories.filter((a) => a.name.trim()),
    };

    const res = await api.put<ComputerResponse>(`/computers/${id}`, body);

    if (res.success && res.data) {
      toast.success("Шинэчиллээ");
      router.push(`/computers/${id}`);
    } else {
      toast.error(res.errors?.[0] || "Алдаа гарлаа");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!original) return null;

  return (
    <>
      <PageHeader
        title={`Засах: ${original.brand} ${original.model}`}
        description={original.assetCode}
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassPanel>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Тоног төхөөрөмж
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Брэнд"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
              />
              <Input
                label="Загвар"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
              />
              <Input
                label="CPU"
                value={cpu}
                onChange={(e) => setCpu(e.target.value)}
                required
              />
              <Input
                label="RAM (GB)"
                type="number"
                min={1}
                value={ramGb || ""}
                onChange={(e) => setRamGb(parseInt(e.target.value) || 0)}
                required
              />
              <Input
                label="GPU"
                value={gpu}
                onChange={(e) => setGpu(e.target.value)}
              />
              <Input
                label="Дэлгэц"
                value={monitor}
                onChange={(e) => setMonitor(e.target.value)}
              />
            </div>
          </GlassPanel>

          <GlassPanel>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Сүлжээ ба төлөв
            </h3>
            <div className="space-y-4">
              <Input
                label="Домэйн нэр"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
              />
              <Input
                label="Албан тушаал"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                required
              />
              <Select
                label="Төлөв"
                options={STATUS_OPTIONS}
                value={status}
                onChange={(e) => setStatus(e.target.value as ComputerStatus)}
                required
              />
            </div>
          </GlassPanel>

          <GlassPanel className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              MAC хаягууд
            </h3>
            <MacAddressInputList
              items={macAddresses}
              onChange={setMacAddresses}
            />
          </GlassPanel>

          <GlassPanel className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Тип
            </h3>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              {(["Desktop", "Laptop"] as ComputerKind[]).map((k) => {
                const Icon = k === "Desktop" ? MonitorIcon : Laptop;
                const selected = kind === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left",
                      selected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-gray-200 bg-white hover:border-primary/50"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5",
                        selected ? "text-primary" : "text-gray-400"
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        selected ? "text-primary" : "text-gray-700"
                      )}
                    >
                      {COMPUTER_KIND_LABELS[k]}
                    </span>
                  </button>
                );
              })}
            </div>
          </GlassPanel>

          <GlassPanel className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Хадгалах төхөөрөмж
            </h3>
            <StorageInputList storages={storages} onChange={setStorages} />
          </GlassPanel>

          <GlassPanel className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Дагалдах хэрэгсэл
            </h3>
            <AccessoryInputList items={accessories} onChange={setAccessories} />
          </GlassPanel>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <Button type="submit" loading={saving}>
            Хадгалах
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Цуцлах
          </Button>
        </div>
      </form>
    </>
  );
}
