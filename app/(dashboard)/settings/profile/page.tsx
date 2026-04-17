"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSessionStore } from "@/store/session-store";
import { ChevronLeft, Loader2, CheckCircle, Pencil, Building2, Mail, Shield, Calendar } from "lucide-react";

export default function ProfilePage() {
  const router  = useRouter();
  const { update: updateSession } = useSession();
  const { name: storeName, email, role, orgName, setSession } = useSessionStore();

  const [profile,   setProfile]   = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [editing,   setEditing]   = useState(false);
  const [newName,   setNewName]   = useState("");
  const [saving,    setSaving]    = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState("");

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setNewName(data.name ?? "");
      })
      .catch(() => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!newName.trim() || newName.trim() === profile?.name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res  = await fetch("/api/users/me", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save changes.");
        return;
      }
      // Update local state
      setProfile((p: any) => ({ ...p, name: newName.trim() }));
      // Sync Zustand store so sidebar/overview reflect the change immediately
      setSession(role!, newName.trim(), email!, orgName);
      // Sync NextAuth session token
      await updateSession({ name: newName.trim() });
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
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
    ? new Date(profile.joinedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })
    : null;

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
          {/* Avatar + Name block */}
          <Card className="p-6 rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-20 h-20 rounded-full bg-[#1B4332] flex items-center justify-center text-white font-bold text-2xl">
                {initials}
              </div>

              {editing ? (
                <div className="w-full max-w-xs space-y-3">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="text-center bg-white border-[#E2E8F0] rounded-xl text-sm h-11"
                    placeholder="Your full name"
                    autoFocus
                  />
                  {error && (
                    <p className="text-xs text-[#C0392B]">{error}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditing(false); setNewName(profile?.name ?? ""); setError(""); }}
                      className="flex-1 h-10 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#718096] hover:bg-[#F4F6F8] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 h-10 bg-[#1B4332] text-white rounded-xl text-sm font-semibold hover:bg-[#2D6A4F] transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-lg font-bold text-[#1A202C]">{profile?.name}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#F0FDF4] text-[#27AE60]">
                      {profile?.role ?? "viewer"}
                    </span>
                  </div>
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#1B4332] hover:underline"
                  >
                    <Pencil size={12} />
                    Edit name
                  </button>
                  {success && (
                    <div className="flex items-center gap-1.5 text-xs text-[#27AE60] font-semibold">
                      <CheckCircle size={14} />
                      Name updated successfully
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* Details */}
          <Card className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm divide-y divide-[#E2E8F0]">
            {[
              {
                icon: Mail,
                label: "Email address",
                value: profile?.email,
              },
              {
                icon: Building2,
                label: "Organisation",
                value: profile?.orgName ?? "—",
              },
              {
                icon: Shield,
                label: "Role",
                value: profile?.role
                  ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
                  : "—",
              },
              ...(joinedDate ? [{
                icon: Calendar,
                label: "Member since",
                value: joinedDate,
              }] : []),
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-4 px-5 py-4">
                <div className="w-8 h-8 rounded-lg bg-[#F4F6F8] flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-[#1B4332]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-[#A0AEC0] font-medium uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-semibold text-[#1A202C] truncate">{value}</p>
                </div>
              </div>
            ))}
          </Card>

          {/* Note about email */}
          <p className="text-xs text-[#A0AEC0] text-center px-4">
            To change your email address or role, contact your organisation admin.
          </p>
        </>
      )}
    </div>
  );
}
