"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api";
import { Badge } from "../../components/ui/badge";
import { SectionTitle, ConfirmDeleteModal } from "../../modules/shared/screen-kit";
import { Button } from "../../components/ui/button";
import { X, Loader2, Edit, Trash2, Plus, User, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useCompany } from "../../context/company-context";

export function UsersPage() {
  const { companiesList, activeCompany } = useCompany();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [deletingUser, setDeletingUser] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "User",
    companyId: activeCompany.id || "ggms-oman",
    allowedCompanyIds: activeCompany.id || "ggms-oman",
    isActive: true
  });

  const fetchUsers = () => {
    setLoading(true);
    apiFetch<any[]>("api/Users")
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching users:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      email: "",
      password: "",
      role: "User",
      companyId: activeCompany.id || "ggms-oman",
      allowedCompanyIds: activeCompany.id || "ggms-oman",
      isActive: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: "",
      role: user.role,
      companyId: user.companyId || activeCompany.id,
      allowedCompanyIds: user.allowedCompanyIds || user.companyId || activeCompany.id,
      isActive: user.isActive
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError("");
    setEditingUser(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!editingUser && !formData.password) {
      setError("Password is required for new users.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      if (editingUser) {
        await apiFetch(`api/Users/${editingUser.id}`, {
          method: "PUT",
          body: JSON.stringify({
            email: formData.email.trim(),
            password: formData.password || "",
            role: formData.role,
            companyId: formData.companyId,
            allowedCompanyIds: formData.companyId,
            isActive: formData.isActive
          })
        });
      } else {
        await apiFetch("api/Users", {
          method: "POST",
          body: JSON.stringify({
            email: formData.email.trim(),
            password: formData.password,
            role: formData.role,
            companyId: formData.companyId,
            allowedCompanyIds: formData.companyId,
            isActive: formData.isActive
          })
        });
      }
      closeModal();
      fetchUsers();
    } catch (err: any) {
      console.error("Failed to save user:", err);
      setError(err?.message || "An error occurred while saving the user.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId: number) => {
    try {
      await apiFetch(`api/Users/${userId}`, { method: "DELETE" });
      fetchUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Users Master"
        subtitle="Manage system user credentials, dashboard access privileges, and account activity states."
      />

      {/* Register actions bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/50">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-550 border border-blue-100">
            <User className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">User Management</h4>
            <p className="text-[10px] text-slate-400">Total authorized system operators: {users.length}</p>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 rounded-xl shadow-md shadow-blue-500/10 flex items-center gap-1.5 transition active:scale-98"
        >
          <Plus className="h-4 w-4" /> New User
        </Button>
      </div>

      {/* Users Card Table */}
      <Card className="border-slate-200/80 shadow-md shadow-slate-200/50 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        <CardHeader className="bg-white border-b border-slate-100 py-4 flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-base font-bold text-slate-800">System Operator Directory</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Define access permissions and role parameters for your team</p>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading && users.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-200/80 border-b border-slate-300 text-[10px] font-extrabold uppercase text-slate-800 tracking-wider">
                  <th className="p-3.5 w-16 text-center">ID</th>
                  <th className="p-3.5">Email Address</th>
                  <th className="p-3.5 w-44">Assigned Company</th>
                  <th className="p-3.5 w-28">Role</th>
                  <th className="p-3.5 w-24 text-center">Status</th>
                  <th className="p-3.5 w-32">Created Date</th>
                  <th className="p-3.5 w-40">Last Login</th>
                  <th className="p-3.5 w-36 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100 font-semibold">
                {users.map((user) => {
                  const comp = companiesList.find((c) => c.id === user.companyId);
                  return (
                    <tr key={user.id} className="hover:bg-slate-200/60 transition duration-150">
                      <td className="p-3.5 font-bold text-slate-400 text-center font-mono">{user.id}</td>
                      <td className="p-3.5 font-bold text-slate-900">{user.email}</td>
                      <td className="p-3.5 text-slate-700 font-bold">
                        <span className="inline-flex items-center gap-1.5 rounded bg-blue-50 text-blue-700 px-2 py-1 text-[11px]">
                          <Building2 className="h-3 w-3 text-blue-500" />
                          {comp ? comp.name : (user.companyId || "ggms-oman")}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <Badge
                          variant={user.role === "Admin" ? "danger" : user.role === "Manager" ? "info" : "default"}
                          className="font-bold text-[10px] px-2 py-0.5 rounded"
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-center">
                        <Badge
                          variant={user.isActive ? "success" : "warning"}
                          className="font-bold text-[10px] px-2 py-0.5 rounded"
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="p-3.5 text-slate-500 font-mono">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never logged in"}
                      </td>
                      <td className="p-3.5">
                        <div className="flex justify-center items-center gap-1.5">
                          <button
                            onClick={() => openEditModal(user)}
                            className="inline-flex h-8 px-2.5 items-center gap-1 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 transition active:scale-95"
                            title="Edit User"
                          >
                            <Edit className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => setDeletingUser(user)}
                            className="inline-flex h-8 px-2.5 items-center gap-1 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition active:scale-95"
                            title="Delete User"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400 font-medium">
                      No system users registered. Click "New User" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/65 backdrop-blur-md p-4 overflow-y-auto animate-fade-in"
        >
          <div className="relative bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">{editingUser ? "Edit User Access" : "Create User Access"}</h3>
                <p className="text-xs text-slate-500 font-semibold">Specify access email, secure password, and role permissions.</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4 font-semibold">
              {error && (
                <div className="rounded-xl bg-red-50 p-3 text-xs text-red-655 border border-red-100 font-bold">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. user@ggms.ai"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Password {editingUser && <span className="text-slate-400 font-normal font-semibold">(leave blank to keep current)</span>} {!editingUser && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Access Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="block w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-850 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                >
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="User">User</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-blue-600" /> Target Company / Client Tenant
                </label>
                <select
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value, allowedCompanyIds: e.target.value })}
                  className="block w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-850 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                >
                  {companiesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.country || "Oman"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-slate-700">
                  Account Active and Enabled
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeModal}
                  disabled={submitting}
                  className="h-10 rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-5 rounded-xl shadow-md shadow-blue-500/10 min-w-[90px]"
                >
                  {submitting ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    "Save User"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingUser}
        title="Delete User Account"
        description="Are you sure you want to delete this user profile? This will immediately revoke their workspace access permissions."
        itemName={deletingUser?.email}
        onConfirm={() => {
          if (deletingUser) handleDelete(deletingUser.id);
          setDeletingUser(null);
        }}
        onClose={() => setDeletingUser(null)}
      />
    </div>
  );
}
