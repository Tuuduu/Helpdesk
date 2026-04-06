"use client";

import { useState, useEffect } from "react";
import { Edit3, Save, X, User, Calendar, Tag } from "lucide-react";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel, Button, Input, Textarea, Spinner } from "@/components/ui";
import type { AboutResponse, UpdateAboutRequest } from "@/types/about";
import toast from "react-hot-toast";

export default function AboutPage() {
  const { isSuperAdmin } = useAuth();

  const [about, setAbout] = useState<AboutResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UpdateAboutRequest>({ content: "", version: "" });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.get<AboutResponse>("/about");
        if (res.success && res.data) {
          setAbout(res.data);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function startEdit() {
    if (!about) return;
    setForm({ content: about.content, version: about.version });
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  async function handleSave() {
    if (!form.content.trim()) {
      toast.error("Агуулга оруулна уу");
      return;
    }
    if (!form.version.trim()) {
      toast.error("Хувилбар оруулна уу");
      return;
    }

    setSaving(true);
    try {
      const res = await api.put<AboutResponse>("/about", form);
      if (res.success && res.data) {
        setAbout(res.data);
        setEditing(false);
        toast.success("Амжилттай хадгаллаа");
      } else {
        toast.error(res.message || "Алдаа гарлаа");
      }
    } catch {
      toast.error("Алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Тухай" description="Системийн мэдээлэл" />
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      </>
    );
  }

  if (!about) {
    return (
      <>
        <PageHeader title="Тухай" description="Системийн мэдээлэл" />
        <GlassPanel>
          <p className="text-center text-gray-500 py-10">
            Мэдээлэл олдсонгүй
          </p>
        </GlassPanel>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Тухай"
        description="Системийн мэдээлэл"
        actions={
          isSuperAdmin && !editing ? (
            <Button variant="secondary" size="sm" onClick={startEdit}>
              <Edit3 className="w-4 h-4 mr-1.5" />
              Засах
            </Button>
          ) : undefined
        }
      />

      <GlassPanel>
        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Хувилбар
              </label>
              <Input
                value={form.version}
                onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
                placeholder="1.0.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Агуулга
              </label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                rows={12}
                placeholder="Системийн тухай мэдээлэл..."
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleSave} loading={saving} size="sm">
                <Save className="w-4 h-4 mr-1.5" />
                Хадгалах
              </Button>
              <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={saving}>
                <X className="w-4 h-4 mr-1.5" />
                Болих
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Content */}
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
              {about.content}
            </div>

            {/* Meta info */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Хувилбар: {about.version}</span>
                </div>
                {about.updatedByName && (
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>Шинэчилсэн: {about.updatedByName}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDateTime(about.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </GlassPanel>
    </>
  );
}
