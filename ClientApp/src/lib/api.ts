const BASE_URL = process.env.REACT_APP_API_URL || "";

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}/${endpoint.replace(/^\//, "")}`;
  
  let activeCompanyId = "ggms-oman";
  if (typeof window !== "undefined") {
    const savedUserStr = localStorage.getItem("user");
    if (savedUserStr) {
      try {
        const savedUser = JSON.parse(savedUserStr);
        if (savedUser && savedUser.companyId) {
          activeCompanyId = savedUser.companyId;
        }
      } catch (e) {}
    }
    if (!activeCompanyId || activeCompanyId === "ggms-oman") {
      const savedId = localStorage.getItem("ggms_active_company_id");
      if (savedId) {
        activeCompanyId = savedId;
      }
    }
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Company-ID": activeCompanyId,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`);
  }

  return response.json() as Promise<T>;
}
