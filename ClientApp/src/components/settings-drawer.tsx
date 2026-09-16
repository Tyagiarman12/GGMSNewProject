"use client";

import React, { useState } from "react";
import {
  X,
  Building2,
  Coins,
  CheckCircle2,
  Image as ImageIcon,
  Save,
  Sliders,
  Sparkles,
  ShieldCheck,
  Plus,
  UploadCloud
} from "lucide-react";
import { useCompany } from "../context/company-context";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const {
    activeCompany,
    updateCompany,
    addCompany,
    formatMoney,
    uploadCompanyLogo
  } = useCompany();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const currentUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {};
  const isAdmin = currentUser?.role === "Admin";

  // Form state initialized from activeCompany
  const [formData, setFormData] = useState({
    name: activeCompany.name || "",
    currency: activeCompany.currency || "OMR",
    logoUrl: activeCompany.logoUrl || "",
    address: activeCompany.address || "",
    branch: activeCompany.branch || "",
    taxNumber: activeCompany.taxNumber || "",
    crNumber: activeCompany.crNumber || "",
    contactNo: activeCompany.contactNo || "",
    email: activeCompany.email || "",
    website: activeCompany.website || ""
  });

  // State for new entity creator modal
  const [newEntityData, setNewEntityData] = useState({
    name: "",
    country: "Oman" as "Oman" | "Saudi Arabia" | "UAE",
    currency: "OMR" as "OMR" | "SAR" | "AED",
    branch: "Main Office",
    taxNumber: "",
    crNumber: "",
    contactNo: "",
    email: "",
    website: "",
    address: "",
    adminEmail: "",
    adminPassword: ""
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync form data if activeCompany changes
  React.useEffect(() => {
    setFormData({
      name: activeCompany.name || "",
      currency: activeCompany.currency || "OMR",
      logoUrl: activeCompany.logoUrl || "",
      address: activeCompany.address || "",
      branch: activeCompany.branch || "",
      taxNumber: activeCompany.taxNumber || "",
      crNumber: activeCompany.crNumber || "",
      contactNo: activeCompany.contactNo || "",
      email: activeCompany.email || "",
      website: activeCompany.website || ""
    });
  }, [activeCompany]);

  // Lock background body scroll when Settings Drawer is open
  React.useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const mandatoryFields = [
    { key: "name", label: "Company Name", val: formData.name },
    { key: "currency", label: "Base Currency", val: formData.currency },
    { key: "address", label: "Address", val: formData.address },
    { key: "branch", label: "Branch", val: formData.branch },
    { key: "taxNumber", label: "VAT No.", val: formData.taxNumber },
    { key: "crNumber", label: "CR No.", val: formData.crNumber },
    { key: "contactNo", label: "Contact No.", val: formData.contactNo },
    { key: "email", label: "Email ID", val: formData.email },
    { key: "website", label: "Website", val: formData.website }
  ];

  const filledCount = mandatoryFields.filter((f) => f.val?.trim()?.length > 0).length;
  const completionPercent = Math.round((filledCount / mandatoryFields.length) * 100);

  const handleInputChange = (field: string, val: string) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateCompany(formData);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error("Failed to save company settings:", err);
    }
  };

  const handleCurrencySelect = (currencyCode: "OMR" | "SAR" | "AED") => {
    handleInputChange("currency", currencyCode);
    updateCompany({ currency: currencyCode });
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);

    // Instant local preview so image never displays broken while uploading
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const previewUrl = reader.result;
        handleInputChange("logoUrl", previewUrl);
        updateCompany({ logoUrl: previewUrl });
      }
    };
    reader.readAsDataURL(file);

    try {
      const serverLogoUrl = await uploadCompanyLogo(file);
      if (serverLogoUrl) {
        handleInputChange("logoUrl", serverLogoUrl);
        updateCompany({ logoUrl: serverLogoUrl });
      }
    } catch (err) {
      console.warn("Backend logo upload error", err);
    } finally {
      setUploadingLogo(false);
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  const handleCreateNewEntity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntityData.name.trim()) return;

    addCompany(newEntityData);
    setIsCreateModalOpen(false);
    setNewEntityData({
      name: "",
      country: "Oman",
      currency: "OMR",
      branch: "Main Office",
      taxNumber: "",
      crNumber: "",
      contactNo: "",
      email: "",
      website: "",
      address: "",
      adminEmail: "",
      adminPassword: ""
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-slate-950/70 backdrop-blur-md transition-all duration-300 animate-in fade-in">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-4 sm:pl-8">
        <div className="w-screen max-w-4xl border-l border-slate-200/80 bg-slate-50/95 shadow-2xl flex flex-col h-full backdrop-blur-xl">

          {/* Executive Header Banner */}
          <div className="relative border-b border-slate-200/80 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-xl shadow-blue-500/30 ring-2 ring-white/20">
                  <Sliders className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black tracking-tight text-white">Corporate Management & Settings</h2>
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-blue-300 border border-blue-400/30">
                      <Sparkles className="h-3 w-3" /> Executive Suite
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium">
                    Manage entity directory, add new companies, update legal registration & base currency standards
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition duration-200"
                aria-label="Close drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Active Company Status & Currency Pill Bar */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-white/10">

              {/* Active Entity Info + Add New Company Button */}
              <div className="flex items-center justify-between gap-2 rounded-xl bg-white/10 backdrop-blur-md px-3.5 py-2 border border-white/15">
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="h-4 w-4 text-blue-400 flex-shrink-0" />
                  <span className="text-xs font-bold text-slate-300 flex-shrink-0">Active Entity:</span>
                  <span className="text-xs font-black text-white truncate max-w-[180px]">
                    {activeCompany.name} ({activeCompany.country || "Oman"})
                  </span>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500 hover:bg-blue-400 text-xs font-extrabold text-white shadow transition flex-shrink-0"
                    title="Add New Subsidiary / Branch Entity"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Entity</span>
                  </button>
                )}
              </div>

              {/* Active Currency Badge & Completion Progress */}
              <div className="flex items-center justify-between gap-2 rounded-xl bg-white/10 backdrop-blur-md px-3.5 py-2 border border-white/15">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-300">Base Currency:</span>
                  <span className="rounded-lg bg-emerald-500/20 px-2 py-0.5 text-xs font-mono font-black text-emerald-300 border border-emerald-400/30">
                    {formData.currency}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-300">
                  <ShieldCheck className="h-4 w-4 text-blue-400" />
                  {completionPercent}% Complete
                </div>
              </div>

            </div>
          </div>

          {/* Main Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* CORPORATE IDENTITY & DETAILS */}
            <form onSubmit={handleSave} className="space-y-6 animate-in fade-in duration-200">

              {/* SECTION A: LOGO & MEDIA ASSET */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <ImageIcon className="h-4.5 w-4.5 text-blue-600" />
                    Company Logo & Branding Asset
                  </h3>
                  <Badge variant="info">App & Documents</Badge>
                </div>

                <div className="flex items-start gap-4">
                  {formData.logoUrl ? (
                    <div className="relative group flex h-20 w-28 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-sm flex-shrink-0">
                      <img src={formData.logoUrl} alt="Company logo preview" className="max-h-full max-w-full object-contain" />
                      <button
                        type="button"
                        onClick={() => handleInputChange("logoUrl", "")}
                        className="absolute -top-2 -right-2 rounded-full bg-rose-600 p-1 text-white shadow-md hover:bg-rose-700 transition"
                        title="Remove logo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-3xl shadow-lg ring-4 ring-blue-500/10 flex-shrink-0">
                      {formData.name?.charAt(0) || "G"}
                    </div>
                  )}

                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                        Upload Company Logo from System / Browser
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingLogo}
                          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 transition disabled:opacity-50"
                        >
                          <UploadCloud className="h-4 w-4" />
                          {uploadingLogo ? "Uploading File..." : "Choose File / Upload from Computer"}
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoFileChange}
                          className="hidden"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-500">
                        Or Enter Direct Image URL
                      </label>
                      <input
                        type="text"
                        placeholder="https://example.com/company-logo.png or /uploads/logos/logo.png"
                        value={formData.logoUrl}
                        onChange={(e) => handleInputChange("logoUrl", e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2 text-xs font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Automatically embedded on executive dashboards, tax invoices, client RFQs, purchase orders, and PDF downloads.
                    </p>
                  </div>
                </div>
              </div>

              {/* OPTION 1: COMPANY BRANDING & MANDATORY DETAILS */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Building2 className="h-4.5 w-4.5 text-blue-600" />
                    Company Profile & Mandatory Branding Details
                  </h3>
                  <Badge variant="info">All Pages Sync</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* 1. Company Name */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xs font-extrabold text-slate-800">
                      Company Name <span className="text-rose-500">*</span>
                      <span className="text-[10px] text-slate-500 font-normal ml-2">(Fetched in Quotations, Invoices, Orders & all pages)</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="e.g. GGMS Global IT Solutions SPC"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition"
                    />
                  </div>

                  {/* 2. Branch Name */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Branch Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.branch}
                      onChange={(e) => handleInputChange("branch", e.target.value)}
                      placeholder="e.g. Muscat Main HQ"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition"
                    />
                  </div>

                  {/* 3. Contact Tel */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Contact No <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.contactNo}
                      onChange={(e) => handleInputChange("contactNo", e.target.value)}
                      placeholder="e.g. +968 2449 0011"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition"
                    />
                  </div>

                  {/* 4. VAT No */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      VAT Registration No. <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.taxNumber}
                      onChange={(e) => handleInputChange("taxNumber", e.target.value)}
                      placeholder="e.g. OM11023891"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono font-black text-blue-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition"
                    />
                  </div>

                  {/* 5. CR No */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Commercial Reg. (CR) No. <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.crNumber}
                      onChange={(e) => handleInputChange("crNumber", e.target.value)}
                      placeholder="e.g. CR-1049281"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition"
                    />
                  </div>

                  {/* 6. Email ID */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Email ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="e.g. billing@ggms.om"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition"
                    />
                  </div>

                  {/* 7. Website */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Website <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.website}
                      onChange={(e) => handleInputChange("website", e.target.value)}
                      placeholder="e.g. https://www.ggms.om"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition"
                    />
                  </div>

                  {/* 8. Address */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      placeholder="e.g. Building 42, Street 19, Al Khuwair, Muscat, Sultanate of Oman"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition"
                    />
                  </div>

                </div>
              </div>

              {/* OPTION 2: BASE OPERATING CURRENCY DROPDOWN */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Coins className="h-4.5 w-4.5 text-emerald-600" />
                    Base Operating Currency
                  </h3>
                  <span className="font-mono text-xs font-black bg-emerald-600 text-white px-2 py-0.5 rounded-lg shadow-sm">
                    {formatMoney(12, formData.currency)}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-800">
                      Select Application Currency Standard <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => handleCurrencySelect(e.target.value as any)}
                      className="w-full rounded-xl border border-emerald-300 bg-white px-4 py-3 text-xs font-black text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition shadow-sm"
                    >
                      <option value="OMR">1. OMR (3 Decimals)</option>
                      <option value="DHR">2. DHR (2 Decimals)</option>
                      <option value="SAR">3. SAR (2 Decimals)</option>
                    </select>
                  </div>


                </div>
              </div>

              {/* Sticky Action Footer Bar */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-4 pb-2 border-t border-slate-200 flex items-center justify-between gap-4">
                {savedSuccess ? (
                  <div className="flex items-center gap-2 text-emerald-600 font-black text-xs animate-in fade-in">
                    <CheckCircle2 className="h-4.5 w-4.5" />
                    Corporate profile & currency updated live!
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    <span>Real-time updates apply across all ERP modules</span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Button type="button" variant="secondary" size="md" onClick={onClose} className="h-10 px-5 rounded-xl font-bold text-slate-700 border-slate-300 hover:bg-slate-100">
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="md" className="h-10 px-6 rounded-xl font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20">
                    <Save className="h-4 w-4 mr-1.5" />
                    Save Corporate Settings
                  </Button>
                </div>
              </div>

            </form>

          </div>
        </div>
      </div>

      {/* CREATE SUBSIDIARY / ENTITY MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Add New Subsidiary Entity</h3>
                  <p className="text-xs text-slate-500 font-medium">Create a new corporate branch or subsidiary profile</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewEntity} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-extrabold text-slate-800">
                  Company / Entity Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newEntityData.name}
                  onChange={(e) => setNewEntityData({ ...newEntityData, name: e.target.value })}
                  placeholder="e.g. GGMS Tech Qatar WLL"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Country</label>
                  <select
                    value={newEntityData.country}
                    onChange={(e) => setNewEntityData({ ...newEntityData, country: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
                  >
                    <option value="Oman">Oman 🇴🇲</option>
                    <option value="Saudi Arabia">Saudi Arabia 🇸🇦</option>
                    <option value="UAE">UAE 🇦🇪</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Base Currency</label>
                  <select
                    value={newEntityData.currency}
                    onChange={(e) => setNewEntityData({ ...newEntityData, currency: e.target.value as any })}
                    className="w-full rounded-xl border border-blue-300 bg-blue-50/40 px-3 py-2 text-xs font-black text-slate-900 outline-none focus:border-blue-500"
                  >
                    <option value="OMR">OMR (3 Decimals)</option>
                    <option value="AED">AED (2 Decimals)</option>
                    <option value="SAR">SAR (2 Decimals)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Branch Name</label>
                  <input
                    type="text"
                    value={newEntityData.branch}
                    onChange={(e) => setNewEntityData({ ...newEntityData, branch: e.target.value })}
                    placeholder="e.g. Muscat HQ"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">VAT / TRN No.</label>
                  <input
                    type="text"
                    value={newEntityData.taxNumber}
                    onChange={(e) => setNewEntityData({ ...newEntityData, taxNumber: e.target.value })}
                    placeholder="e.g. OM1029381"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono font-bold outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">CR No.</label>
                  <input
                    type="text"
                    value={newEntityData.crNumber}
                    onChange={(e) => setNewEntityData({ ...newEntityData, crNumber: e.target.value })}
                    placeholder="e.g. CR-901928"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono font-bold outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Contact Tel</label>
                  <input
                    type="text"
                    value={newEntityData.contactNo}
                    onChange={(e) => setNewEntityData({ ...newEntityData, contactNo: e.target.value })}
                    placeholder="e.g. +968 2400 1122"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Email ID</label>
                  <input
                    type="email"
                    value={newEntityData.email}
                    onChange={(e) => setNewEntityData({ ...newEntityData, email: e.target.value })}
                    placeholder="billing@company.com"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Website</label>
                  <input
                    type="text"
                    value={newEntityData.website}
                    onChange={(e) => setNewEntityData({ ...newEntityData, website: e.target.value })}
                    placeholder="https://company.com"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Address</label>
                <input
                  type="text"
                  value={newEntityData.address}
                  onChange={(e) => setNewEntityData({ ...newEntityData, address: e.target.value })}
                  placeholder="e.g. Building 12, Street 4, Muscat, Oman"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium outline-none focus:border-blue-500"
                />
              </div>

              {/* Company Admin Credentials Section */}
              <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Initial Admin Credentials</h4>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Admin Email <span className="text-rose-500">*</span></label>
                    <input
                      type="email"
                      required
                      value={newEntityData.adminEmail}
                      onChange={(e) => setNewEntityData({ ...newEntityData, adminEmail: e.target.value })}
                      placeholder="admin@newcompany.com"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Admin Password <span className="text-rose-500">*</span></label>
                    <input
                      type="password"
                      required
                      value={newEntityData.adminPassword}
                      onChange={(e) => setNewEntityData({ ...newEntityData, adminPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button type="button" variant="secondary" size="md" onClick={() => setIsCreateModalOpen(false)} className="h-10 px-4 rounded-xl font-bold text-slate-700 border-slate-300 hover:bg-slate-100">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" className="h-10 px-5 rounded-xl font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Create Entity & Set Active
                </Button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
