"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Image as ImageIcon,
  X,
  Upload,
  Monitor as MonitorIcon,
  Laptop,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, getAccessToken } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  COMPUTER_KIND_LABELS,
  type ComputerKind,
} from "@/lib/constants";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel, Button, Input, Select, SearchableSelect } from "@/components/ui";
import { StorageInputList } from "@/components/computers/StorageInputList";
import { MacAddressInputList } from "@/components/computers/MacAddressInputList";
import { AccessoryInputList } from "@/components/computers/AccessoryInputList";
import type {
  CreateComputerRequest,
  ComputerResponse,
  ComputerStorageInput,
  ComputerMacAddressInput,
  ComputerAccessoryInput,
} from "@/types/computer";
import type { PagedResult } from "@/types/api";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface CompanyOption {
  id: string;
  name: string;
}

interface UserOption {
  id: string;
  fullName: string;
  position?: string;
  companyId: string;
  departmentId?: string;
  departmentName?: string;
}

export default function NewComputerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);

  const [companyId, setCompanyId] = useState(user?.companyId ?? "");
  const [ownerUserId, setOwnerUserId] = useState("");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState("");
  const [companyDepartments, setCompanyDepartments] = useState<{ id: string; name: string }[]>([]);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [monitor, setMonitor] = useState("");
  const [cpu, setCpu] = useState("");
  const [ramGb, setRamGb] = useState(8);
  const [gpu, setGpu] = useState("");
  const [domainName, setDomainName] = useState("");
  const [kind, setKind] = useState<ComputerKind>("Desktop");
  const [accessories, setAccessories] = useState<ComputerAccessoryInput[]>([]);
  const [storages, setStorages] = useState<ComputerStorageInput[]>([
    { type: "SSD", capacityGb: 256, modelName: "" },
  ]);
  const [macAddresses, setMacAddresses] = useState<ComputerMacAddressInput[]>([
    { type: "Lan", address: "", label: "", isPrimary: true },
  ]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Load companies (all roles can pick which company to register the computer for)
  useEffect(() => {
    async function loadCompanies() {
      const res = await api.get<CompanyOption[]>("/companies");
      if (res.success && res.data) setCompanies(res.data);
    }
    loadCompanies();
  }, []);

  // Load users for selected company
  useEffect(() => {
    if (!companyId) {
      setUsers([]);
      return;
    }
    async function loadUsers() {
      const res = await api.get<PagedResult<UserOption>>("/users", {
        companyId,
        pageSize: 200,
        isActive: true,
      });
      if (res.success && res.data) setUsers(res.data.items);
    }
    loadUsers();
  }, [companyId]);

  // Auto-fill position + department from selected owner
  useEffect(() => {
    if (!ownerUserId) return;
    const owner = users.find((u) => u.id === ownerUserId);
    if (owner?.position && !position) setPosition(owner.position);
    if (owner?.departmentName && !department) setDepartment(owner.departmentName);
  }, [ownerUserId, users, position, department]);

  // Тухайн компанийн хэлтсүүдийг ачаалах
  useEffect(() => {
    if (!companyId) {
      setCompanyDepartments([]);
      return;
    }
    api
      .get<{ id: string; name: string; companyId: string }[]>("/departments", {
        companyId,
      })
      .then((res) => {
        if (res.success && res.data) {
          setCompanyDepartments(
            res.data.map((d) => ({ id: d.id, name: d.name }))
          );
        }
      });
  }, [companyId]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addImages = (files: FileList | null) => {
    if (!files) return;
    const accepted: File[] = [];
    const previews: string[] = [];
    Array.from(files).forEach((f) => {
      if (!ALLOWED_IMAGE_TYPES.includes(f.type)) {
        toast.error(`${f.name}: Зөвхөн jpg/png/webp зөвшөөрнө`);
        return;
      }
      if (f.size > MAX_IMAGE_SIZE) {
        toast.error(`${f.name}: 5MB-аас хэтэрсэн`);
        return;
      }
      accepted.push(f);
      previews.push(URL.createObjectURL(f));
    });
    if (accepted.length > 0) {
      setImages((prev) => [...prev, ...accepted]);
      setImagePreviews((prev) => [...prev, ...previews]);
    }
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImagesFor = async (computerId: string): Promise<number> => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";
    const token = getAccessToken() ?? "";
    let uploaded = 0;
    for (let i = 0; i < images.length; i++) {
      const formData = new FormData();
      formData.append("file", images[i]);
      formData.append("isPrimary", String(i === 0));
      try {
        const res = await fetch(`${apiBase}/computers/${computerId}/images`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();
        if (data.success) uploaded++;
      } catch {
        // ignore individual upload failures, will report aggregate
      }
    }
    return uploaded;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const body: CreateComputerRequest = {
      kind,
      brand,
      model,
      monitor: monitor || undefined,
      cpu,
      ramGb,
      gpu: gpu || undefined,
      domainName: domainName || undefined,
      ownerUserId,
      position,
      department: department || undefined,
      companyId,
      storages,
      macAddresses,
      accessories: accessories.filter((a) => a.name.trim()),
    };

    const res = await api.post<ComputerResponse>("/computers", body);

    if (res.success && res.data) {
      const newId = res.data.id;
      let imageMsg = "";
      if (images.length > 0) {
        const uploaded = await uploadImagesFor(newId);
        if (uploaded === images.length) {
          imageMsg = ` (${uploaded} зураг хадгаллаа)`;
        } else if (uploaded > 0) {
          imageMsg = ` (${uploaded}/${images.length} зураг хадгаллаа)`;
        } else {
          toast.error("Компьютер бүртгэгдсэн ч зураг хадгалахад алдаа гарлаа");
        }
      }
      toast.success(`Компьютер амжилттай бүртгэгдлээ${imageMsg}`);
      router.push(`/computers/${newId}`);
    } else {
      toast.error(res.errors?.[0] || "Алдаа гарлаа");
    }
    setLoading(false);
  };

  return (
    <>
      <PageHeader
        title="Шинэ компьютер бүртгэх"
        description="Хатуу хангамж, эзэмшигч, хадгалах төхөөрөмж"
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassPanel>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Эзэмшил
            </h3>
            <div className="space-y-4">
              <SearchableSelect
                label="Компани"
                options={companies.map((c) => ({ value: c.id, label: c.name }))}
                value={companyId}
                onChange={(val) => {
                  setCompanyId(val);
                  setOwnerUserId("");
                  setDepartment("");
                }}
                placeholder="Компани сонгох"
                emptyMessage="Компани олдсонгүй"
                required
              />

              <SearchableSelect
                label="Эзэмшигч ажилтан"
                options={users.map((u) => ({
                  value: u.id,
                  label: u.fullName,
                  sublabel: [u.departmentName, u.position].filter(Boolean).join(" · "),
                }))}
                value={ownerUserId}
                onChange={setOwnerUserId}
                placeholder={
                  companyId ? "Ажилтан сонгох (хайж болно)" : "Эхлээд компани сонгоно уу"
                }
                emptyMessage="Ажилтан олдсонгүй"
                disabled={!companyId}
                required
              />

              <Input
                label="Албан тушаал (snapshot)"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Жишээ: НББ-ийн ахлах"
                required
              />

              {companyDepartments.length > 0 ? (
                <div>
                  <Select
                    label="Хэлтэс"
                    options={[
                      { value: "", label: "Сонгох..." },
                      ...companyDepartments.map((d) => ({
                        value: d.name,
                        label: d.name,
                      })),
                    ]}
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Эзэмшигч сонгоход хэлтэс автомат бөглөгдөнө
                  </p>
                </div>
              ) : (
                <Input
                  label="Хэлтэс"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Жишээ: НББ"
                  helperText="Энэ компанид хэлтэс бүртгэгдээгүй байна"
                />
              )}
            </div>
          </GlassPanel>

          <GlassPanel>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Сүлжээ
            </h3>
            <div className="space-y-4">
              <Input
                label="Домэйн нэр"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
                placeholder="DESKTOP-AB12CD"
              />
            </div>
          </GlassPanel>

          <GlassPanel className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Тоног төхөөрөмж
            </h3>

            {/* Kind selector — Суурин / Зөөврийн */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
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
                          "w-6 h-6",
                          selected ? "text-primary" : "text-gray-400"
                        )}
                      />
                      <div>
                        <div
                          className={cn(
                            "text-sm font-semibold",
                            selected ? "text-primary" : "text-gray-700"
                          )}
                        >
                          {COMPUTER_KIND_LABELS[k]}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {k === "Desktop"
                            ? "Workstation, Tower"
                            : "Laptop, Notebook"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Брэнд"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Dell, HP, Lenovo..."
                required
              />
              <Input
                label="Загвар"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="OptiPlex 7090"
                required
              />
              <Input
                label="CPU"
                value={cpu}
                onChange={(e) => setCpu(e.target.value)}
                placeholder="Intel Core i5-11500"
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
                placeholder="Intel UHD 750"
              />
              <Input
                label="Дэлгэц"
                value={monitor}
                onChange={(e) => setMonitor(e.target.value)}
                placeholder="Dell P2422H 24''"
              />
            </div>
          </GlassPanel>

          <GlassPanel className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              MAC хаягууд
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              LAN, Wi-Fi, Bluetooth гэх мэт олон сүлжээний интерфэйс байж болно.
              ⭐ товч дарж үндсэн MAC-ыг сонгоно уу.
            </p>
            <MacAddressInputList
              items={macAddresses}
              onChange={setMacAddresses}
            />
          </GlassPanel>

          <GlassPanel className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Хадгалах төхөөрөмж
            </h3>
            <StorageInputList storages={storages} onChange={setStorages} />
          </GlassPanel>

          <GlassPanel className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Дагалдах хэрэгсэл
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Хулгана, гар, цүнх, чихэвч, цэнэглэгч гэх мэт компьютертэй
              хамт дагалдах эд зүйлсийг бүртгэнэ үү (заавал биш).
            </p>
            <AccessoryInputList items={accessories} onChange={setAccessories} />
          </GlassPanel>

          <GlassPanel className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Зураг (заавал биш)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  jpg/png/webp · 5MB-аас бага · эхний зураг үндсэн болно
                </p>
              </div>
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15">
                <Upload className="w-4 h-4" />
                Зураг сонгох
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    addImages(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>

            {images.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 rounded-xl py-10 flex flex-col items-center text-gray-400">
                <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-xs">Зураг сонгож амжаагүй байна</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {imagePreviews.map((src, i) => (
                  <div
                    key={i}
                    className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    {i === 0 && (
                      <span className="absolute top-1 left-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        Үндсэн
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Хасах"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5 truncate">
                      {images[i]?.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <Button type="submit" loading={loading}>
            Бүртгэх
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Буцах
          </Button>
        </div>
      </form>
    </>
  );
}
