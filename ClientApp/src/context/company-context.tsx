"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { companies as defaultCompanies, type Company } from "../data/mock";
import { money } from "../lib/utils";

interface CompanyContextType {
  activeCompany: Company;
  companiesList: Company[];
  filteredCompaniesList: Company[];
  selectedCountry: string;
  setSelectedCountry: (country: string) => void;
  availableCountries: string[];
  setActiveCompanyId: (id: string) => void;
  updateCompany: (updatedFields: Partial<Company>) => void;
  addCompany: (newCompany: Partial<Company> & { name: string }) => void;
  resetCompanies: () => void;
  formatMoney: (amount: number, currencyOverride?: string) => string;
  uploadCompanyLogo: (file: File) => Promise<string | undefined>;
}

const STORAGE_KEY_ACTIVE = "ggms_active_company_id";
const STORAGE_KEY_DATA = "ggms_companies_data";
const STORAGE_KEY_COUNTRY = "ggms_selected_country";

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [companiesList, setCompaniesList] = useState<Company[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY_DATA);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch (e) {
          console.error("Failed to parse saved companies data", e);
        }
      }
    }
    return defaultCompanies;
  });

  const [selectedCountry, setSelectedCountryState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const savedCountry = localStorage.getItem(STORAGE_KEY_COUNTRY);
      if (savedCountry) return savedCountry;
    }
    return "All Regions";
  });

  const [activeCompanyId, setActiveCompanyIdState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const savedUserStr = localStorage.getItem("user");
      if (savedUserStr) {
        try {
          const savedUser = JSON.parse(savedUserStr);
          if (savedUser && savedUser.companyId) {
            return savedUser.companyId;
          }
        } catch (e) {}
      }
      const savedId = localStorage.getItem(STORAGE_KEY_ACTIVE);
      if (savedId) {
        return savedId;
      }
    }
    return defaultCompanies[0]?.id || "ggms-oman";
  });

  // Sync activeCompanyId whenever logged-in user changes in localStorage
  useEffect(() => {
    function checkUserCompany() {
      if (typeof window !== "undefined") {
        const savedUserStr = localStorage.getItem("user");
        if (savedUserStr) {
          try {
            const savedUser = JSON.parse(savedUserStr);
            if (savedUser && savedUser.companyId && savedUser.companyId !== activeCompanyId) {
              setActiveCompanyIdState(savedUser.companyId);
            }
          } catch (e) {}
        }
      }
    }
    checkUserCompany();
  }, [activeCompanyId]);

  // Fetch companies from SQL Database endpoint on mount
  useEffect(() => {
    async function fetchDatabaseCompanies() {
      try {
        const response = await fetch("/api/companies");
        if (response.ok) {
          const dbCompanies: Company[] = await response.json();
          if (Array.isArray(dbCompanies) && dbCompanies.length > 0) {
            setCompaniesList(dbCompanies);
            if (typeof window !== "undefined") {
              localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(dbCompanies));
            }
          }
        }
      } catch (err) {
        console.warn("Using cached companies (Backend DB API offline or unreachable)", err);
      }
    }
    fetchDatabaseCompanies();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(companiesList));
    }
  }, [companiesList]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_ACTIVE, activeCompanyId);
    }
  }, [activeCompanyId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_COUNTRY, selectedCountry);
    }
  }, [selectedCountry]);

  // Compute unique countries from company list
  const availableCountries = ["All Regions", ...Array.from(new Set(companiesList.map((c) => c.country)))];

  // Filtered companies based on selectedCountry
  const filteredCompaniesList =
    selectedCountry === "All Regions"
      ? companiesList
      : companiesList.filter((c) => c.country === selectedCountry);

  const setSelectedCountry = (country: string) => {
    setSelectedCountryState(country);
    // If current active company is not in the newly selected country, switch to first company in that country
    if (country !== "All Regions") {
      const matching = companiesList.filter((c) => c.country === country);
      if (matching.length > 0 && !matching.some((c) => c.id === activeCompanyId)) {
        setActiveCompanyIdState(matching[0].id);
      }
    }
  };

  const activeCompany =
    companiesList.find((c) => c.id === activeCompanyId) || companiesList[0] || defaultCompanies[0];

  const setActiveCompanyId = (id: string) => {
    const targetCompany = companiesList.find((c) => c.id === id);
    if (targetCompany) {
      setActiveCompanyIdState(id);
    }
  };

  const updateCompany = async (updatedFields: Partial<Company>) => {
    const targetId = activeCompany.id;
    setCompaniesList((prev) =>
      prev.map((c) => {
        if (c.id === targetId) {
          return { ...c, ...updatedFields };
        }
        return c;
      })
    );

    try {
      await fetch(`/api/companies/${targetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...activeCompany, ...updatedFields })
      });
    } catch (err) {
      console.warn("Failed to persist company update to DB backend", err);
    }
  };

  const addCompany = async (newCompanyData: Partial<Company> & { name: string; adminEmail?: string; adminPassword?: string }) => {
    try {
      const response = await fetch("/api/companies/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCompanyData.name,
          country: newCompanyData.country || "Oman",
          countryCode: newCompanyData.country === "Saudi Arabia" ? "SA" : newCompanyData.country === "UAE" ? "AE" : "OM",
          currency: newCompanyData.currency || "OMR",
          currencyCode: newCompanyData.currency || "OMR",
          currencySymbol: newCompanyData.currency || "OMR",
          currencyDecimals: ["OMR", "KWD", "BHD"].includes(newCompanyData.currency || "OMR") ? 3 : 2,
          defaultVatRate: 5.0,
          taxNumber: newCompanyData.taxNumber || "",
          adminEmail: newCompanyData.adminEmail || "",
          adminPassword: newCompanyData.adminPassword || ""
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.company) {
          const createdComp: Company = {
            id: data.company.id,
            name: data.company.name,
            country: data.company.country || "Oman",
            currency: data.company.currency || "OMR",
            taxNumber: data.company.taxNumber || newCompanyData.taxNumber || "",
            crNumber: newCompanyData.crNumber || "",
            branch: newCompanyData.branch || "Main HQ",
            address: newCompanyData.address || "",
            contactNo: newCompanyData.contactNo || "",
            email: newCompanyData.email || "",
            website: newCompanyData.website || "",
            logoUrl: data.company.logoUrl || "",
            profit: 0
          };
          setCompaniesList((prev) => [...prev.filter((c) => c.id !== createdComp.id), createdComp]);
          setActiveCompanyIdState(createdComp.id);
          return createdComp;
        }
      }
    } catch (err) {
      console.warn("Failed to onboard company via backend", err);
    }

    // Fallback local state insertion
    const id = newCompanyData.id || `entity-${Date.now()}`;
    const fallbackComp: Company = {
      id,
      name: newCompanyData.name,
      country: newCompanyData.country || "UAE",
      currency: newCompanyData.currency || "AED",
      taxNumber: newCompanyData.taxNumber || "",
      crNumber: newCompanyData.crNumber || "",
      branch: newCompanyData.branch || "Dubai Branch",
      address: newCompanyData.address || "",
      contactNo: newCompanyData.contactNo || "",
      email: newCompanyData.email || "",
      website: newCompanyData.website || "",
      logoUrl: newCompanyData.logoUrl || "",
      profit: newCompanyData.profit ?? 0
    };

    setCompaniesList((prev) => [...prev, fallbackComp]);
    setActiveCompanyIdState(id);
  };

  const resetCompanies = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY_DATA);
      localStorage.removeItem(STORAGE_KEY_ACTIVE);
      localStorage.removeItem(STORAGE_KEY_COUNTRY);
    }

    try {
      const response = await fetch("/api/companies");
      if (response.ok) {
        const dbCompanies: Company[] = await response.json();
        if (Array.isArray(dbCompanies) && dbCompanies.length > 0) {
          setCompaniesList(dbCompanies);
          setActiveCompanyIdState(dbCompanies[0].id);
          setSelectedCountryState("All Regions");
          return;
        }
      }
    } catch (e) {
      console.warn("Failed to re-fetch DB list during reset", e);
    }

    setCompaniesList(defaultCompanies);
    setActiveCompanyIdState(defaultCompanies[0].id);
    setSelectedCountryState("All Regions");
  };

  const uploadCompanyLogo = async (file: File): Promise<string | undefined> => {
    const targetId = activeCompany.id;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/companies/${targetId}/logo`, {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        if (data.logoUrl) {
          updateCompany({ logoUrl: data.logoUrl });
          return data.logoUrl;
        }
      }
    } catch (err) {
      console.warn("Failed to upload company logo", err);
    }
    return undefined;
  };

  const formatMoney = (amount: number, currencyOverride?: string) => {
    const code = currencyOverride || activeCompany.currencyCode || activeCompany.currency || "OMR";
    const decimals = activeCompany.currencyDecimals ?? (["OMR", "KWD", "BHD"].includes(code) ? 3 : 2);
    return money(amount, code, decimals);
  };

  return (
    <CompanyContext.Provider
      value={{
        activeCompany,
        companiesList,
        filteredCompaniesList,
        selectedCountry,
        setSelectedCountry,
        availableCountries,
        setActiveCompanyId,
        updateCompany,
        addCompany,
        resetCompanies,
        formatMoney,
        uploadCompanyLogo
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}
