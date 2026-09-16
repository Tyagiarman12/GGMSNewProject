"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  AlertCircle,
  Loader,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Check,
  HelpCircle,
  X,
  Briefcase
} from "lucide-react";

export function LoginPage({ onLogin }: { onLogin: (user: any) => void }) {
  const [email, setEmail] = useState("md@ggms.ai");
  const [password, setPassword] = useState("demo1234");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [selectedDemoRole, setSelectedDemoRole] = useState<"admin" | "staff" | null>("admin");

  const [branding, setBranding] = useState({
    name: "GGMS IT Solutions",
    logoUrl: "/ggms-logo-horizontal.png",
    welcomeMessage: "Executive Command Suite & Operations"
  });

  useEffect(() => {
    async function loadTenantBranding() {
      try {
        const hostname = typeof window !== "undefined" ? window.location.hostname : "";
        const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
        const companyParam = urlParams.get("company") || "";

        let url = `/api/auth/tenant-branding?hostname=${hostname}&companyId=${companyParam}`;
        if (!companyParam && email && email.includes("@")) {
          url += `&email=${encodeURIComponent(email)}`;
        }

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data && data.name) {
            setBranding({
              name: data.name,
              logoUrl: data.logoUrl || "/ggms-logo-horizontal.png",
              welcomeMessage: data.welcomeMessage || "Executive Command Suite & Operations"
            });
          }
        }
      } catch (e) {
        console.warn("Failed to fetch tenant branding", e);
      }
    }
    loadTenantBranding();
  }, [email]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let errMsg = "Login failed. Please verify your credentials.";
        try {
          const errorData = await response.json();
          errMsg = errorData.message || errMsg;
        } catch (jsonErr) {
          console.error("Failed to parse error response as JSON:", jsonErr);
        }
        setError(errMsg);
        setLoading(false);
        return;
      }

      const user = await response.json();
      localStorage.setItem("user", JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      console.error("Login error details:", err);
      setError("An unexpected network error occurred. Please try again.");
      setLoading(false);
    }
  };

  const applyDemoCredentials = (role: "admin" | "staff") => {
    setSelectedDemoRole(role);
    setError("");
    if (role === "admin") {
      setEmail("md@ggms.ai");
      setPassword("demo1234");
    } else {
      setEmail("user@ggms.ai");
      setPassword("demo1234");
    }
  };

  const getCompanyInitials = (name: string) => {
    if (!name) return "CO";
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#070C18] text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-[32rem] w-[32rem] rounded-full bg-blue-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-[32rem] w-[32rem] rounded-full bg-indigo-600/15 blur-[120px]" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
          
          {/* Left Hero Column */}
          <div className="flex flex-col space-y-6 lg:col-span-6">
            
            {/* Logo Badge */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-2 pr-4 backdrop-blur-xl shadow-xl shadow-black/30">
                {branding.logoUrl ? (
                  <div className="flex h-10 items-center justify-center rounded-xl bg-white px-3 py-1 shadow-sm">
                    <img 
                      src={branding.logoUrl} 
                      alt={branding.name} 
                      className="h-7 w-auto max-w-[140px] object-contain" 
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-sm font-black text-white shadow-md">
                    {getCompanyInitials(branding.name)}
                  </div>
                )}
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-white">{branding.name}</h2>
                  <p className="text-[11px] font-medium text-blue-300/80">{branding.welcomeMessage}</p>
                </div>
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1.5 text-xs font-semibold text-blue-400 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                <span>Executive Command Suite</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Unified Multi-Tenant <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">Management Engine</span>
              </h1>
              
              <p className="text-sm leading-relaxed text-slate-300 max-w-xl">
                Access your organization dashboard to control quotations, lead tracking, project execution, VAT compliance, and real-time executive analytics.
              </p>
            </div>

            {/* Platform Status */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>All Multi-Tenant Services Operational</span>
            </div>

          </div>

          {/* Right Column: Clean Card */}
          <div className="flex justify-center lg:col-span-6">
            <div className="relative w-full max-w-md">
              
              <div className="relative rounded-2xl border border-slate-700/60 bg-slate-900/90 p-7 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-2xl">
                
                {/* Title */}
                <div className="mb-6 space-y-1">
                  <h3 className="text-xl font-bold tracking-tight text-white">
                    Sign in to your account
                  </h3>
                  <p className="text-xs text-slate-400">
                    Enter your email and password to proceed.
                  </p>
                </div>

                {/* Quick Demo Selector */}
                <div className="mb-5 rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
                  <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                    <span>QUICK DEMO ACCOUNTS:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => applyDemoCredentials("admin")}
                      className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        selectedDemoRole === "admin"
                          ? "bg-blue-600/30 text-blue-200 border border-blue-500/50"
                          : "bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <Briefcase className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                        <span className="truncate">Admin (MD)</span>
                      </div>
                      {selectedDemoRole === "admin" && <Check className="h-3.5 w-3.5 text-blue-400 shrink-0" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => applyDemoCredentials("staff")}
                      className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        selectedDemoRole === "staff"
                          ? "bg-indigo-600/30 text-indigo-200 border border-indigo-500/50"
                          : "bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <Building2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">Staff User</span>
                      </div>
                      {selectedDemoRole === "staff" && <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" />}
                    </button>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                  
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Email Address</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        required
                        className="h-10 w-full rounded-xl border border-slate-700/80 bg-slate-950/80 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setSelectedDemoRole(null);
                        }}
                        placeholder="name@company.com"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">Password</label>
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        className="h-10 w-full rounded-xl border border-slate-700/80 bg-slate-950/80 pl-10 pr-10 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setSelectedDemoRole(null);
                        }}
                        placeholder="••••••••••••"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-white transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember me */}
                  <div className="flex items-center justify-between pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500/30"
                      />
                      <span>Keep me signed in</span>
                    </label>
                  </div>

                  {/* Error Notification */}
                  {error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-950/50 p-3 flex items-start gap-2.5 text-xs text-red-300">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-400" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-sm font-semibold text-white shadow-md shadow-blue-900/30 transition-all hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader className="h-4 w-4 animate-spin text-white" />
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      <>
                        <span>Login to Dashboard</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </form>

                {/* Footer Security Note */}
                <div className="mt-5 border-t border-slate-800/80 pt-3 text-center">
                  <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Protected by 256-bit Enterprise Encryption</span>
                  </p>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Page Footer */}
      <footer className="relative z-10 w-full border-t border-white/5 bg-slate-950/40 py-3 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} GGMS IT Solutions. All rights reserved.
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 mb-3">
              <HelpCircle className="h-5 w-5" />
            </div>

            <h3 className="text-base font-bold text-white mb-1.5">Reset Password</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              To reset your password, contact your organization administrator or reach support at <strong className="text-blue-300">support@ggms.ai</strong>.
            </p>

            <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-xs space-y-1 mb-4">
              <div className="text-slate-400 font-semibold">Demo Credentials:</div>
              <div className="text-slate-300">• Admin: <code className="text-blue-300 font-mono">md@ggms.ai</code></div>
              <div className="text-slate-300">• Password: <code className="text-blue-300 font-mono">demo1234</code></div>
            </div>

            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-2 text-xs font-semibold text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </main>
  );
}

