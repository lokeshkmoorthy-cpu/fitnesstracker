import React, { useState, useEffect } from "react";
import { Loader2, User, Mail, Phone, MapPin, Edit2, Check, X, Users, Target, ChevronDown } from "lucide-react";
import { fitnessApi } from "@/src/services/api";
import type { AuthUser } from "@/src/types/fitness";

export const AdminUserInfoView = () => {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchUsers = async () => {
      try {
        const data = await fitnessApi.getAdminUsers();
        if (mounted) {
          setUsers(data);
          if (data.length > 0) setSelectedUser(data[0].userId);
        }
      } catch (err) {
        console.error("Failed to load users", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchUsers();
    return () => { mounted = false; };
  }, []);

  const handleUpdate = async (fieldKey: keyof AuthUser, value: string) => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const payload = { [fieldKey]: value };
      await fitnessApi.updateAdminUser(selectedUser, payload);
      setUsers((prev) =>
        prev.map((u) => (u.userId === selectedUser ? { ...u, ...payload } : u))
      );
      setEditingField(null);
    } catch (err) {
      console.error("Update failed", err);
      alert("Failed to update user info");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const user = users.find((u) => u.userId === selectedUser);

  const renderField = (
    label: string,
    fieldKey: keyof AuthUser,
    value: string | undefined,
    Icon: React.ElementType
  ) => {
    const isEditing = editingField === fieldKey;

    return (
      <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100/50 dark:border-white/5 transition-all">
        <div className="shrink-0 w-12 h-12 bg-purple-50 dark:bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400">
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
          {isEditing ? (
            <div className="flex items-center gap-2 mt-2">
              <input
                type={fieldKey === "email" ? "email" : "text"}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="flex-1 h-9 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-2 ring-purple-500/20 w-full shadow-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdate(fieldKey, editValue);
                  if (e.key === "Escape") setEditingField(null);
                }}
              />
              <button
                disabled={saving}
                onClick={() => handleUpdate(fieldKey, editValue)}
                className="w-9 h-9 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center shrink-0 disabled:opacity-50 shadow-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button
                disabled={saving}
                onClick={() => setEditingField(null)}
                className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 flex items-center justify-center shrink-0 disabled:opacity-50 shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between mt-1 gap-2">
              <p className="text-base font-bold text-slate-800 dark:text-slate-100 truncate">
                {value || <span className="text-slate-400 italic font-normal">Not provided</span>}
              </p>
              <button
                onClick={() => {
                  setEditingField(fieldKey);
                  setEditValue(value || "");
                }}
                className="shrink-0 w-8 h-8 rounded-lg text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm hover:text-purple-600 dark:hover:text-purple-400 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all flex items-center justify-center"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="shrink-0 bg-white dark:bg-slate-900 border border-slate-50 dark:border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-premium">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Administration</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">User Information</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mr-2">Select User:</span>
          <div className="relative group">
            <select
              value={selectedUser}
              onChange={(e) => {
                setSelectedUser(e.target.value);
                setEditingField(null);
              }}
              className="peer h-9 pl-3 pr-8 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-100 outline-none focus:ring-2 ring-purple-500/20 appearance-none cursor-pointer w-full transition-all hover:bg-white dark:hover:bg-slate-900 shadow-sm"
            >
              {users.map((u) => (
                <option key={u.userId} value={u.userId}>
                  {u.displayName} ({u.email})
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none transition-all">
              <ChevronDown className="w-4 h-4 text-slate-400 peer-hover:text-purple-500 peer-hover:filter peer-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] transition-all duration-300" />
            </div>
          </div>
        </div>
      </div>

      {user ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-6 shadow-premium mb-12">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100 dark:border-white/5">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm">
              <User className="w-6 h-6 text-slate-400 translate-y-1" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{user.displayName}</h2>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {renderField("Display Name", "displayName", user.displayName, User)}
            {renderField("Email Address", "email", user.email, Mail)}
            {renderField("Phone Number", "phoneNumber", user.phoneNumber, Phone)}
            {renderField("Home Address", "address", user.address, MapPin)}
            {renderField("Goals", "goals", user.goals, Target)}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <User className="w-12 h-12 mb-4 opacity-20" />
          <p>No user selected or available.</p>
        </div>
      )}
    </div>
  );
};
