"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSessionStore } from "@/store/session-store";
import {
  ChevronLeft, ChevronRight, Loader2, CheckCircle,
  Pencil, Building2, Mail, Shield, Calendar, AlertTriangle,
} from "lucide-react";

type EditField = "name" | "email" | null;

export default function ProfilePage() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const { name: storeN, email: storeE, role: storeRole, orgName: storeOrg, setSession } = useSessionStore();

  const [profile,   setProfile]   = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [editing,   setEditing]   = useState<EditField>(null);
  const [newName,   setNewName]   = useState(storeN ?? "");
  const [newEmail,  setNewEmail]  = useState(storeE ?? "");
  const [saving,    setSaving]    = useState(false);
  const [success,   setSuccess]   = useState<string | null>(null);
  const [error,     setError]     = useState("");

  // Seed a minimal profile from the Zustand store immediately so the page
  // is never fully blank while the API call is in-flight.
  const role   = profile?.role    ?? storeRole   ?? null;
  const orgName = profile?.orgName ?? storeOrg   ?? null;

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setProfile(data);
        setNewName(data.name ?? "");
        setNewEmail(data.email ?? "");
      })
      .catch(() => {
        // Fall back gracefully — show what we have from the session store
        setProfile({
          name:    storeN    ?? "",
          email:   storeE    ?? "",
          role:    storeRole ?? "",
          orgName: storeOrg  ?? null,
        });
        setNewName(storeN  ?? "");
        setNewEmail(storeE ?? "");
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cancelEdit() {
    setEditing(null);
    setNewName(profile?.name ?? "");
    setNewEmail(profile?.email ?? "");
    setError("");
  }

  async function handleSave() {
    setError("");
    const payload: Record<string, string> = {};

    if (editing === "name") {
      if (!newName.trim() || newName.trim() === profile?.name) { cancelEdit(); return; }
      payload.name = newName.trim();
    }
    if (editing === "email") {
      const trimmed = newEmail.trim().toLowerCase();
      if (!trimmed || trimmed === profile?.email) { cancelEdit(); return; }
      payload.email = trimmed;
    }

    setSaving(true);
    try {
      const res  = await fetch("/api/users/me", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not save changes.");
        return;
      }

      if (data.emailChanged) {
        // Email changed — must sign out so NextAuth re-issues a token with the new email
        await signOut({ callbackUrl: "/login" });
        return;
      }

      // Name change: update store + session in place
      const updatedName = data.user.name;
      setProfile((p: any) => ({ ...p, name: updatedName }));
      setSession(role ?? "viewer", updatedName, profile?.email ?? storeE ?? "", orgName);
      await updateSession({ name: updatedName });

      setEditing(null);
      setSuccess("Name updated successfully.");
      setTimeout(() => setSuccess(null), 4000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const initials = profile?.name
    ? profile.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
    : "U";

  const joinedDate = profile?.joinedAt
    ? new Date(profile.joinedAt).toLocaleDateString("en-ZA", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;

  const isAdmin = role === "admin";

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Back + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center hover:bg-[#F4F6F8] transition-colors"
        >
          <ChevronLeft size={16} className="text-[#1A202C]" />
        </button>
        <h1 className="text-lg font-bold text-[#1A202C]">My Profile</h1>
      </div>

      {loading ? (
        <Card className="p-10 rounded-xl border border-[#E2E8F0] bg-white flex justify-center">
          <Loader2 size={24} className="text-[#1B4332] animate-spin" />
        </Card>
      ) : (
        <>
          {/* Avatar block */}
          <Card className="p-6 rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-20 h-20 rounded-full bg-[#1B4332] flex items-center justify-center text-white font-bold text-2xl">
                {initials}
              </div>
              <div>
                <p className="text-lg font-bold text-[#1A202C]">{profile?.name}</p>
                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#F0FDF4] text-[#27AE60]">
                  {role ?? "viewer"}
                </span>
              </div>
              {success && (
                <div className="flex items-center gap-1.5 text-xs text-[#27AE60] font-semibold">
                  <CheckCircle size={14} /> {success}
                </div>
              )}
            </div>
          </Card>

          {/* Editable fields */}
          <Card className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm divide-y divide-[#E2E8F0]">

            {/* ── Name ── */}
            <div className="px-5 py-4">
              {isAdmin && editing === "name" ? (
                <div className="space-y-3">
                  <p className="text-[11px] text-[#A0AEC0] font-medium uppercase tracking-wide">Full Name</p>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-white border-[#E2E8F0] rounded-xl text-sm h-11"
                    placeholder="Your full name"
                    autoFocus
                  />
                  {error && <p className="text-xs text-[#C0392B]">{error}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={cancelEdit}
                      className="flex-1 h-10 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#718096] hover:bg-[#F4F6F8] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 h-10 bg-[#1B4332] text-white rounded-xl text-sm font-semibold hover:bg-[#2D6A4F] transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                    >
                      {saving && <Loader2 size={14} className="animate-spin" />}
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`flex items-center gap-4 ${isAdmin ? "cursor-pointer group" : ""}`}
                  onClick={isAdmin ? () => { setEditing("name"); setError(""); } : undefined}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#F4F6F8] flex items-center justify-center flex-shrink-0">
                    <Pencil size={14} className={isAdmin ? "text-[#1B4332]" : "text-[#A0AEC0]"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-[#A0AEC0] font-medium uppercase tracking-wide">Full Name</p>
                    <p className="text-sm font-semibold text-[#1A202C] truncate">{profile?.name}</p>
                    {!isAdmin && (
                      <p className="text-[10px] text-[#A0AEC0] mt-0.5">To change, contact your admin</p>
                    )}
                  </div>
                  {isAdmin && (
                    <ChevronRight size={14} className="text-[#A0AEC0] group-hover:text-[#1B4332] transition-colors" />
                  )}
                </div>
              )}
            </div>

            {/* ── Email ── */}
            <div className="px-5 py-4">
              {isAdmin && editing === "email" ? (
                <div className="space-y-3">
                  <p className="text-[11px] text-[#A0AEC0] font-medium uppercase tracking-wide">Email Address</p>
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="bg-white border-[#E2E8F0] rounded-xl text-sm h-11"
                    placeholder="new@email.com"
                    autoFocus
                  />
                  {/* Warning */}
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[#FFF8EC] border border-[#D4A017]/30">
                    <AlertTriangle size={14} className="text-[#D4A017] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-[#92650A] leading-relaxed">
                      Changing your email will sign you out immediately. Use the new address to log back in.
                    </p>
                  </div>
                  {error && <p className="text-xs text-[#C0392B]">{error}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={cancelEdit}
                      className="flex-1 h-10 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#718096] hover:bg-[#F4F6F8] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 h-10 bg-[#1B4332] text-white rounded-xl text-sm font-semibold hover:bg-[#2D6A4F] transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                    >
                      {saving && <Loader2 size={14} className="animate-spin" />}
                      Save &amp; Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`flex items-center gap-4 ${isAdmin ? "cursor-pointer group" : ""}`}
                  onClick={isAdmin ? () => { setEditing("email"); setError(""); } : undefined}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#F4F6F8] flex items-center justify-center flex-shrink-0">
                    <Mail size={14} className={isAdmin ? "text-[#1B4332]" : "text-[#A0AEC0]"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-[#A0AEC0] font-medium uppercase tracking-wide">Email Address</p>
                    <p className="text-sm font-semibold text-[#1A202C] truncate">{profile?.email}</p>
                    {!isAdmin && (
                      <p className="text-[10px] text-[#A0AEC0] mt-0.5">To change, contact your admin</p>
                    )}
                  </div>
                  {isAdmin && (
                    <ChevronRight size={14} className="text-[#A0AEC0] group-hover:text-[#1B4332] transition-colors" />
                  )}
                </div>
              )}
            </div>

            {/* ── Organisation (read-only) ── */}
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-8 h-8 rounded-lg bg-[#F4F6F8] flex items-center justify-center flex-shrink-0">
                <Building2 size={14} className="text-[#1B4332]" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-[#A0AEC0] font-medium uppercase tracking-wide">Organisation</p>
                <p className="text-sm font-semibold text-[#1A202C] truncate">{orgName ?? "—"}</p>
              </div>
            </div>

            {/* ── Role (read-only) ── */}
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-8 h-8 rounded-lg bg-[#F4F6F8] flex items-center justify-center flex-shrink-0">
                <Shield size={14} className="text-[#1B4332]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-[#A0AEC0] font-medium uppercase tracking-wide">Role</p>
                <p className="text-sm font-semibold text-[#1A202C]">
                  {role
                    ? role.charAt(0).toUpperCase() + role.slice(1)
                    : "—"}
                </p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => router.push("/users")}
                  className="text-[11px] font-semibold text-[#1B4332] hover:underline whitespace-nowrap"
                >
                  Manage roles →
                </button>
              )}
            </div>

            {/* ── Member since (read-only) ── */}
            {joinedDate && (
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="w-8 h-8 rounded-lg bg-[#F4F6F8] flex items-center justify-center flex-shrink-0">
                  <Calendar size={14} className="text-[#1B4332]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-[#A0AEC0] font-medium uppercase tracking-wide">Member Since</p>
                  <p className="text-sm font-semibold text-[#1A202C]">{joinedDate}</p>
                </div>
              </div>
            )}
          </Card>

          {/* Contextual footer note */}
          <p className="text-xs text-[#A0AEC0] text-center px-4 pb-2">
            {isAdmin
              ? "Your role is protected. Use Users & Roles to manage your team's permissions."
              : "To change your role, ask your organisation admin."}
          </p>
        </>
      )}
    </div>
  );
}
