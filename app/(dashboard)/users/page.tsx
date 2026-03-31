"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSessionStore } from "@/store/session-store";
import {
  Plus,
  Search,
  Shield,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  X,
  ChevronRight,
} from "lucide-react";

const roles = [
  "admin",
  "initiator",
  "reviewer",
  "approver",
  "executor",
  "viewer",
];

const roleColors: Record<string, { bg: string; text: string }> = {
  admin: { bg: "#FFF7ED", text: "#D4A017" },
  initiator: { bg: "#EFF6FF", text: "#2980B9" },
  reviewer: { bg: "#F5F3FF", text: "#7C3AED" },
  approver: { bg: "#F0FDF4", text: "#27AE60" },
  executor: { bg: "#FFF1F2", text: "#C0392B" },
  viewer: { bg: "#F4F6F8", text: "#718096" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function UsersPage() {
  const { role: currentRole } = useSessionStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "viewer",
  });

  const isAdmin = currentRole === "admin";

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddUser() {
    setError("");
    if (!form.name || !form.email || !form.password) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create user.");
        return;
      }

      setShowAddForm(false);
      setForm({ name: "", email: "", password: "", role: "viewer" });
      fetchUsers();
    } catch (error) {
      setError("Failed to create user. Please try again.");
    }
  }

  async function handleUpdateRole(id: string, role: string) {
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role }),
    });
    setEditingUser(null);
    fetchUsers();
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    fetchUsers();
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this user?")) return;
    await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchUsers();
  }

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = users.filter((u) => u.isActive).length;
  const inactiveCount = users.filter((u) => !u.isActive).length;

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Users", value: users.length, color: "#1B4332" },
          { label: "Active", value: activeCount, color: "#27AE60" },
          { label: "Inactive", value: inactiveCount, color: "#C0392B" },
        ].map(({ label, value, color }) => (
          <Card
            key={label}
            className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-sm text-center"
          >
            <p className="text-xl font-bold" style={{ color }}>
              {String(value).padStart(2, "0")}
            </p>
            <p className="text-[10px] text-[#718096] mt-0.5">{label}</p>
          </Card>
        ))}
      </div>

      {/* Search + Add */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0AEC0]"
          />
          <Input
            placeholder="Search users by name, email or role..."
            className="pl-9 bg-white border-[#E2E8F0] rounded-xl text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B4332] text-white text-xs font-semibold hover:bg-[#2D6A4F] transition-colors flex-shrink-0"
          >
            <Plus size={14} />
            Add User
          </button>
        )}
      </div>

      {/* Users List */}
      <Card className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm divide-y divide-[#E2E8F0]">
        {loading ? (
          <div className="py-12 text-center text-sm text-[#A0AEC0]">
            Loading users...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#A0AEC0]">
            No users found
          </div>
        ) : (
          filtered.map((user) => {
            const roleStyle = roleColors[user.role] ?? roleColors.viewer;
            return (
              <div key={user.id} className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{
                        backgroundColor: roleStyle.bg,
                        color: roleStyle.text,
                      }}
                    >
                      {user.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#1A202C] truncate">
                          {user.name}
                        </p>
                        {!user.isActive && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#F4F6F8] text-[#A0AEC0]">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#718096] truncate">
                        {user.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-lg capitalize"
                          style={{
                            backgroundColor: roleStyle.bg,
                            color: roleStyle.text,
                          }}
                        >
                          {user.role}
                        </span>
                        <span className="text-[10px] text-[#A0AEC0]">
                          Since {formatDate(user.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {isAdmin && (
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="w-8 h-8 rounded-xl bg-[#EFF6FF] flex items-center justify-center hover:bg-[#BFDBFE] transition-colors"
                        title="Edit role"
                      >
                        <Edit2 size={13} className="text-[#2980B9]" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(user.id, user.isActive)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                          user.isActive
                            ? "bg-[#FFF1F2] hover:bg-[#FFC5C5]"
                            : "bg-[#F0FDF4] hover:bg-[#BBF7D0]"
                        }`}
                        title={user.isActive ? "Deactivate" : "Activate"}
                      >
                        {user.isActive ? (
                          <UserX size={13} className="text-[#C0392B]" />
                        ) : (
                          <UserCheck size={13} className="text-[#27AE60]" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="w-8 h-8 rounded-xl bg-[#FFF1F2] flex items-center justify-center hover:bg-[#FFC5C5] transition-colors"
                        title="Delete user"
                      >
                        <Trash2 size={13} className="text-[#C0392B]" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </Card>

      {/* Add User Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
          <div className="bg-white w-full lg:max-w-md rounded-t-3xl lg:rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-base font-bold text-[#1A202C]">Add New User</h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setError("");
                }}
                className="w-8 h-8 rounded-full bg-[#F4F6F8] flex items-center justify-center"
              >
                <X size={16} className="text-[#718096]" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {error && (
                <div className="px-4 py-3 rounded-xl bg-[#FFF1F2] border border-[#FFC5C5] text-sm text-[#C0392B]">
                  {error}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-1.5 block">
                  Full Name *
                </label>
                <Input
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-[#F4F6F8] border-[#E2E8F0] rounded-xl text-sm h-11"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-1.5 block">
                  Email Address *
                </label>
                <Input
                  type="email"
                  placeholder="john@company.co.za"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="bg-[#F4F6F8] border-[#E2E8F0] rounded-xl text-sm h-11"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-1.5 block">
                  Password *
                </label>
                <Input
                  type="password"
                  placeholder="Set a password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="bg-[#F4F6F8] border-[#E2E8F0] rounded-xl text-sm h-11"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-1.5 block">
                  Role *
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border border-[#E2E8F0] bg-[#F4F6F8] text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#1B4332] capitalize"
                >
                  {roles.map((r) => (
                    <option key={r} value={r} className="capitalize">
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role description */}
              <div className="p-3 rounded-xl bg-[#F4F6F8] border border-[#E2E8F0]">
                <div className="flex items-center gap-2 mb-1">
                  <Shield size={13} className="text-[#1B4332]" />
                  <p className="text-xs font-semibold text-[#1B4332] capitalize">
                    {form.role} permissions
                  </p>
                </div>
                <p className="text-xs text-[#718096]">
                  {form.role === "admin" && "Full access to all features including user management."}
                  {form.role === "initiator" && "Can create and submit payment requests."}
                  {form.role === "reviewer" && "Can review and flag payments for approval."}
                  {form.role === "approver" && "Can approve or reject payment requests."}
                  {form.role === "executor" && "Can execute approved payments to the bank."}
                  {form.role === "viewer" && "Read-only access to dashboard and reports."}
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#E2E8F0] flex gap-3">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setError("");
                }}
                className="flex-1 h-11 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#718096]"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                className="flex-1 h-11 rounded-xl bg-[#1B4332] text-white text-sm font-semibold hover:bg-[#2D6A4F] transition-colors"
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-base font-bold text-[#1A202C]">Edit Role</h2>
              <button
                onClick={() => setEditingUser(null)}
                className="w-8 h-8 rounded-full bg-[#F4F6F8] flex items-center justify-center"
              >
                <X size={16} className="text-[#718096]" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F4F6F8]">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    backgroundColor: roleColors[editingUser.role]?.bg,
                    color: roleColors[editingUser.role]?.text,
                  }}
                >
                  {editingUser.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1A202C]">{editingUser.name}</p>
                  <p className="text-xs text-[#718096]">{editingUser.email}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-2 block">
                  Select New Role
                </label>
                <div className="space-y-2">
                  {roles.map((r) => (
                    <button
                      key={r}
                      onClick={() => handleUpdateRole(editingUser.id, r)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                        editingUser.role === r
                          ? "border-[#1B4332] bg-[#F0FDF4] text-[#1B4332]"
                          : "border-transparent bg-[#F4F6F8] text-[#1A202C] hover:border-[#E2E8F0]"
                      }`}
                    >
                      <span className="capitalize">{r}</span>
                      {editingUser.role === r && (
                        <ChevronRight size={14} className="text-[#1B4332]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}