"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Upload,
  History,
  Monitor as MonitorIcon,
  ArrowLeftRight,
  Wrench,
  Archive,
  Star,
  X,
} from "lucide-react";
import { Modal, Textarea } from "@/components/ui";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { api, getAccessToken } from "@/lib/api";
import { formatDateTime, getImageUrl } from "@/lib/utils";
import {
  COMPUTER_STATUS_LABELS,
  COMPUTER_STATUS_COLORS,
  COMPUTER_KIND_LABELS,
  COMPUTER_KIND_COLORS,
  STORAGE_TYPE_LABELS,
  MAC_TYPE_LABELS,
  MAC_TYPE_COLORS,
  type ComputerStatus,
  type ComputerKind,
  type StorageType,
  type MacAddressType,
} from "@/lib/constants";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  GlassPanel,
  Button,
  Badge,
  Spinner,
  ConfirmDialog,
} from "@/components/ui";
import type {
  ComputerResponse,
  ComputerImageDto,
} from "@/types/computer";
import {
  PROCESS_TYPE_LABELS,
  PROCESS_STATUS_LABELS,
  PROCESS_STATUS_COLORS,
  type ProcessRequestListItem,
  type ProcessRequestStatus,
} from "@/types/computerProcess";

export default function ComputerDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { isSuperAdmin, isAdminOrAbove, user } = useAuth();

  const [computer, setComputer] = useState<ComputerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Засвар / Акт хасах хүсэлт modal
  const [processType, setProcessType] = useState<"Repair" | "Retirement" | null>(null);
  const [processDescription, setProcessDescription] = useState("");
  const [processSubmitting, setProcessSubmitting] = useState(false);

  // Process түүх (Засвар + Акт)
  const [processes, setProcesses] = useState<ProcessRequestListItem[]>([]);

  const fetchComputer = useCallback(async () => {
    setLoading(true);
    const [cRes, pRes] = await Promise.all([
      api.get<ComputerResponse>(`/computers/${id}`),
      api.get<ProcessRequestListItem[]>(`/computers/${id}/processes`),
    ]);
    if (cRes.success && cRes.data) setComputer(cRes.data);
    else toast.error(cRes.errors?.[0] || "Олдсонгүй");
    if (pRes.success && pRes.data) setProcesses(pRes.data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchComputer();
  }, [fetchComputer]);

  const handleUpload = async (file: File, isPrimary: boolean) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("isPrimary", String(isPrimary));

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/computers/${id}/images`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAccessToken() ?? ""}`,
          },
          body: formData,
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Зураг хадгалагдлаа");
        fetchComputer();
      } else {
        toast.error(data.errors?.[0] || "Алдаа");
      }
    } catch {
      toast.error("Сүлжээний алдаа");
    }
    setUploading(false);
  };

  const handleDeleteImage = async (imageId: string) => {
    const res = await api.delete(`/computers/${id}/images/${imageId}`);
    if (res.success) {
      toast.success("Зураг устгагдлаа");
      fetchComputer();
    } else {
      toast.error(res.errors?.[0] || "Алдаа");
    }
  };

  const handleDelete = async () => {
    const res = await api.delete(`/computers/${id}`);
    if (res.success) {
      toast.success("Компьютер устгагдлаа");
      router.push("/computers");
    } else {
      toast.error(res.errors?.[0] || "Алдаа");
    }
    setDeleteOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!computer) return null;

  const isOwner = user?.id === computer.ownerUserId;
  const canTransfer = isOwner && computer.status === "Active";
  const canRequestProcess = isOwner && computer.status === "Active";

  const submitProcessRequest = async () => {
    if (!processType || !processDescription.trim()) {
      toast.error("Тайлбар бичнэ үү");
      return;
    }
    setProcessSubmitting(true);
    const url =
      processType === "Repair" ? "/computer-repairs" : "/computer-retirements";
    const res = await api.post(url, {
      computerId: id,
      description: processDescription.trim(),
    });
    if (res.success) {
      toast.success(
        processType === "Repair"
          ? "Засварын хүсэлт илгээгдлээ"
          : "Акт хасагдалтын хүсэлт илгээгдлээ"
      );
      setProcessType(null);
      setProcessDescription("");
      fetchComputer();
    } else {
      toast.error(res.errors?.[0] || "Алдаа");
    }
    setProcessSubmitting(false);
  };

  return (
    <>
      <PageHeader
        title={`${computer.brand} ${computer.model}`}
        description={computer.assetCode}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => router.push("/computers")}
            >
              Буцах
            </Button>
            {isAdminOrAbove && (
              <Button
                variant="secondary"
                icon={<History className="w-4 h-4" />}
                onClick={() => router.push(`/computers/${id}/history`)}
              >
                Түүх
              </Button>
            )}
            {canTransfer && (
              <Button
                icon={<ArrowLeftRight className="w-4 h-4" />}
                onClick={() => router.push(`/my-computers/${id}/transfer`)}
              >
                Шилжүүлэх
              </Button>
            )}
            {canRequestProcess && (
              <>
                <Button
                  variant="secondary"
                  icon={<Wrench className="w-4 h-4" />}
                  onClick={() => {
                    setProcessType("Repair");
                    setProcessDescription("");
                  }}
                >
                  Засвар хүсэх
                </Button>
                <Button
                  variant="secondary"
                  icon={<Archive className="w-4 h-4" />}
                  onClick={() => {
                    setProcessType("Retirement");
                    setProcessDescription("");
                  }}
                >
                  Акт хасах
                </Button>
              </>
            )}
            {isSuperAdmin && (
              <>
                <Button
                  variant="secondary"
                  icon={<Edit className="w-4 h-4" />}
                  onClick={() => router.push(`/computers/${id}/edit`)}
                >
                  Засах
                </Button>
                <Button
                  variant="danger"
                  icon={<Trash2 className="w-4 h-4" />}
                  onClick={() => setDeleteOpen(true)}
                >
                  Устгах
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <GlassPanel className="lg:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Үндсэн мэдээлэл
            </h3>
            <div className="flex items-center gap-2">
              {computer.kind && (
                <Badge
                  variant="custom"
                  className={
                    COMPUTER_KIND_COLORS[computer.kind as ComputerKind]
                  }
                >
                  {COMPUTER_KIND_LABELS[computer.kind as ComputerKind]}
                </Badge>
              )}
              <Badge
                variant="custom"
                className={
                  COMPUTER_STATUS_COLORS[computer.status as ComputerStatus]
                }
              >
                {COMPUTER_STATUS_LABELS[computer.status as ComputerStatus]}
              </Badge>
            </div>
          </div>

          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Field label="Брэнд" value={computer.brand} />
            <Field label="Загвар" value={computer.model} />
            <Field label="CPU" value={computer.cpu} />
            <Field label="RAM" value={`${computer.ramGb} GB`} />
            <Field label="GPU" value={computer.gpu || "—"} />
            <Field label="Дэлгэц" value={computer.monitor || "—"} />
            <Field label="Домэйн" value={computer.domainName || "—"} />
            <Field label="Эзэмшигч" value={computer.ownerName} />
            <Field label="Албан тушаал" value={computer.position} />
            <Field label="Компани" value={computer.companyName} />
            <Field
              label="Бүртгэсэн"
              value={formatDateTime(computer.createdAt)}
            />
          </dl>

          <h3 className="text-sm font-semibold text-gray-900 mt-6 mb-3">
            MAC хаягууд
          </h3>
          {computer.macAddresses.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Бүртгэгдээгүй</p>
          ) : (
            <ul className="space-y-2 mb-2">
              {computer.macAddresses.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 bg-white/50 border border-gray-100 rounded-lg px-3 py-2 text-sm"
                >
                  <Badge
                    variant="custom"
                    size="sm"
                    className={
                      MAC_TYPE_COLORS[m.type as MacAddressType]
                    }
                  >
                    {MAC_TYPE_LABELS[m.type as MacAddressType]}
                  </Badge>
                  <span className="font-mono text-gray-800">
                    {m.address}
                  </span>
                  {m.label && (
                    <span className="text-xs text-gray-500">— {m.label}</span>
                  )}
                  {m.isPrimary && (
                    <span className="ml-auto text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      ⭐ ҮНДСЭН
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          <h3 className="text-sm font-semibold text-gray-900 mt-6 mb-3">
            Хадгалах төхөөрөмж
          </h3>
          {computer.storages.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Бүртгэгдээгүй</p>
          ) : (
            <ul className="space-y-2">
              {computer.storages.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between bg-white/50 border border-gray-100 rounded-lg px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="info" size="sm">
                      {STORAGE_TYPE_LABELS[s.type as StorageType]}
                    </Badge>
                    <span className="text-gray-700">{s.capacityGb} GB</span>
                    {s.modelName && (
                      <span className="text-xs text-gray-500">
                        ({s.modelName})
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Дагалдах хэрэгсэл */}
          <h3 className="text-sm font-semibold text-gray-900 mt-6 mb-3">
            Дагалдах хэрэгсэл ({computer.accessories?.length ?? 0})
          </h3>
          {!computer.accessories || computer.accessories.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Бүртгэгдээгүй</p>
          ) : (
            <ul className="space-y-2">
              {computer.accessories.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start gap-3 bg-white/50 border border-gray-100 rounded-lg px-3 py-2 text-sm"
                >
                  <span className="text-primary">📦</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{a.name}</div>
                    {a.note && (
                      <div className="text-xs text-gray-500">{a.note}</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Засвар + Акт-н түүх */}
          <h3 className="text-sm font-semibold text-gray-900 mt-6 mb-3 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-primary" />
            Засвар & Акт түүх ({processes.length})
          </h3>
          {processes.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              Засварын болон актын бичлэг алга
            </p>
          ) : (
            <ul className="space-y-2">
              {processes.map((p) => (
                <li
                  key={p.id}
                  className="bg-white/50 border border-gray-100 rounded-lg px-3 py-2.5 text-sm cursor-pointer hover:bg-white/80 transition-colors"
                  onClick={() => router.push(`/processes/${p.id}`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={p.type === "Repair" ? "info" : "warning"}
                          size="sm"
                        >
                          {PROCESS_TYPE_LABELS[p.type]}
                        </Badge>
                        <Badge
                          variant="custom"
                          size="sm"
                          className={
                            PROCESS_STATUS_COLORS[
                              p.status as ProcessRequestStatus
                            ]
                          }
                        >
                          {
                            PROCESS_STATUS_LABELS[
                              p.status as ProcessRequestStatus
                            ]
                          }
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {p.description}
                      </p>
                      <div className="text-[11px] text-gray-500 mt-1">
                        Хүсэлт гаргасан:{" "}
                        <span className="font-medium">
                          {p.requestedByName}
                        </span>
                      </div>
                    </div>
                    <div className="text-[11px] text-gray-400 whitespace-nowrap">
                      {formatDateTime(p.createdAt)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </GlassPanel>

        {/* Images */}
        <GlassPanel>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Зураг</h3>
            {isAdminOrAbove && (
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f, computer.images.length === 0);
                    e.target.value = "";
                  }}
                />
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-700">
                  <Upload className="w-3.5 h-3.5" />
                  {uploading ? "Илгээж байна..." : "Зураг нэмэх"}
                </span>
              </label>
            )}
          </div>

          {computer.images.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-gray-400">
              <MonitorIcon className="w-10 h-10 mb-2" />
              <p className="text-xs">Зураг ороогүй</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {computer.images.map((img) => (
                <ImageThumb
                  key={img.id}
                  image={img}
                  canDelete={isAdminOrAbove}
                  onClick={() => setLightboxUrl(img.imageUrl)}
                  onDelete={() => handleDeleteImage(img.id)}
                />
              ))}
            </div>
          )}
        </GlassPanel>
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            onClick={() => setLightboxUrl(null)}
            aria-label="Хаах"
          >
            <X className="w-8 h-8" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getImageUrl(lightboxUrl)}
            alt=""
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Компьютер устгах уу?"
        description={`${computer.assetCode} компьютерийг устгасны дараа сэргээх боломжгүй.`}
        confirmLabel="Устгах"
        variant="danger"
      />

      <Modal
        open={processType !== null}
        onClose={() => setProcessType(null)}
        title={
          processType === "Repair"
            ? "Засварын хүсэлт"
            : "Акт хасагдалтын хүсэлт"
        }
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setProcessType(null)}
              disabled={processSubmitting}
            >
              Цуцлах
            </Button>
            <Button onClick={submitProcessRequest} loading={processSubmitting}>
              Илгээх
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
            <b>Анхааруулга:</b> Хүсэлт илгээсний дараа компьютер{" "}
            <b>{processType === "Repair" ? "Засварт" : "Шилжиж буй"}</b>{" "}
            төлөвт орох ба workflow-ын алхам бүрийг батлуулсны дараа эцсийнхэд
            компьютер{" "}
            <b>
              {processType === "Repair" ? "Идэвхтэй" : "Хасагдсан"}
            </b>{" "}
            болно.
          </div>
          <Textarea
            label={
              processType === "Repair"
                ? "Гэмтлийн тайлбар"
                : "Акт хасагдах шалтгаан"
            }
            value={processDescription}
            onChange={(e) => setProcessDescription(e.target.value)}
            rows={4}
            placeholder={
              processType === "Repair"
                ? "Жишээ: Дэлгэц асахгүй болсон, хатуу диск алдаа гаргаж буй..."
                : "Жишээ: Уртын хугацааны эвдрэл, хуучирсан..."
            }
            required
          />
        </div>
      </Modal>
    </>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-gray-500 mb-0.5">{label}</dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  );
}

function ImageThumb({
  image,
  canDelete,
  onClick,
  onDelete,
}: {
  image: ComputerImageDto;
  canDelete: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="relative group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getImageUrl(image.imageUrl)}
        alt=""
        onClick={onClick}
        className="w-full h-28 object-cover rounded-lg border border-gray-200 cursor-pointer"
      />
      {image.isPrimary && (
        <span className="absolute top-1 left-1 inline-flex items-center gap-0.5 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
          <Star className="w-2.5 h-2.5 fill-white" /> Үндсэн
        </span>
      )}
      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Устгах"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
