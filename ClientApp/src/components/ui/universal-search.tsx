import React, { useState, useEffect, useRef } from "react";
import { Search, X, Check, Package, FileText, ChevronDown } from "lucide-react";
import type { ProductItem } from "../../modules/shared/domain";

interface UniversalProductSearchProps {
  products: ProductItem[];
  selectedProductId: string;
  onSelectProduct: (product: ProductItem | null) => void;
  placeholder?: string;
  className?: string;
  dropdownDirection?: "bottom" | "top";
}

export function UniversalProductSearch({
  products,
  selectedProductId,
  onSelectProduct,
  placeholder = "Search product by name, code, category...",
  className = "",
  dropdownDirection = "bottom"
}: UniversalProductSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Selected product reference
  const selectedProduct = products.find((p) => p.id === selectedProductId) || null;

  // Preserves backend insertion order (newest product first at index 0)
  const fifoProducts = [...products];

  // Filter matching records universally
  const filteredProducts = fifoProducts.filter((p) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (p.name && String(p.name).toLowerCase().includes(term)) ||
      (p.category && String(p.category).toLowerCase().includes(term)) ||
      (p.barcode && String(p.barcode).toLowerCase().includes(term)) ||
      (p.id !== undefined && p.id !== null && String(p.id).toLowerCase().includes(term)) ||
      (p.type && String(p.type).toLowerCase().includes(term))
    );
  });

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (product: ProductItem) => {
    onSelectProduct(product);
    setSearchTerm("");
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectProduct(null);
    setSearchTerm("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < filteredProducts.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : filteredProducts.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < filteredProducts.length) {
        handleSelect(filteredProducts[focusedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${isOpen ? "z-[999]" : "z-10"} ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          value={isOpen ? searchTerm : selectedProduct ? selectedProduct.name : searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
            setFocusedIndex(-1);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm("");
          }}
          onKeyDown={handleKeyDown}
          placeholder={selectedProduct ? selectedProduct.name : placeholder}
          className="block w-full h-10 pl-9 pr-16 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 font-semibold outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
        />
        <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
          {selectedProduct && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition"
              title="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div className={`absolute ${dropdownDirection === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"} z-[9999] max-h-[280px] w-full overflow-y-auto custom-dropdown-scroll rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl animate-in fade-in duration-150`}>
          {filteredProducts.length === 0 ? (
            <div className="p-3 text-center text-xs font-semibold text-slate-400">
              No products found matching "{searchTerm}"
            </div>
          ) : (
            filteredProducts.map((product, idx) => {
              const isSelected = product.id === selectedProductId;
              const isFocused = idx === focusedIndex;
              return (
                <div
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  onMouseEnter={() => setFocusedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                    isSelected
                      ? "bg-blue-50 text-blue-900 font-bold"
                      : isFocused
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div className="h-7 w-7 rounded-md bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
                      <Package className="h-3.5 w-3.5" />
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-slate-800 truncate flex items-center gap-1.5">
                        <span>{product.name}</span>
                        {product.barcode && (
                          <span className="text-[10px] font-mono font-normal text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {product.barcode}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 font-medium">
                        <span>{product.category || "General"}</span>
                        <span>•</span>
                        <span>Stock: {product.stock ?? 0} {product.uom || "pcs"}</span>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center text-[10px] font-bold text-blue-600">
                        <Check className="h-3 w-3 mr-0.5" /> Selected
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

interface UniversalQuotationSearchProps {
  quotations: any[];
  selectedQuotationId: string;
  onSelectQuotation: (quotationId: string) => void;
  customer?: string;
  placeholder?: string;
  className?: string;
}

export function UniversalQuotationSearch({
  quotations,
  selectedQuotationId,
  onSelectQuotation,
  customer = "",
  placeholder = "Search quotation by ID, customer...",
  className = ""
}: UniversalQuotationSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedQuote = quotations.find((q) => q.id === selectedQuotationId) || null;

  // Show newest / latest quotations first
  const sortedQuotations = [...quotations].sort((a, b) => (b.id || "").localeCompare(a.id || ""));

  // Filter matching quotations universally
  const filteredQuotations = sortedQuotations.filter((q) => {
    // If customer is set on invoice, prioritize/filter by customer
    if (customer && q.customer !== customer && !searchTerm.trim()) {
      return false;
    }
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (q.id !== undefined && q.id !== null && String(q.id).toLowerCase().includes(term)) ||
      (q.customer && String(q.customer).toLowerCase().includes(term)) ||
      (q.salesperson && String(q.salesperson).toLowerCase().includes(term)) ||
      (q.status && String(q.status).toLowerCase().includes(term))
    );
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (qId: string) => {
    onSelectQuotation(qId);
    setSearchTerm("");
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectQuotation("");
    setSearchTerm("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < filteredQuotations.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : filteredQuotations.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < filteredQuotations.length) {
        handleSelect(filteredQuotations[focusedIndex].id);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${isOpen ? "z-[999]" : "z-10"} ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          value={isOpen ? searchTerm : selectedQuote ? `${selectedQuote.id} - ${selectedQuote.customer}` : searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
            setFocusedIndex(-1);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm("");
          }}
          onKeyDown={handleKeyDown}
          placeholder={selectedQuote ? `${selectedQuote.id} - ${selectedQuote.customer}` : placeholder}
          className="block w-full h-10 pl-9 pr-16 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 font-semibold outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
        />
        <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
          {selectedQuote && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition"
              title="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div className="absolute z-[9999] mt-1.5 max-h-[280px] w-full overflow-y-auto custom-dropdown-scroll rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl animate-in fade-in duration-150">
          {filteredQuotations.length === 0 ? (
            <div className="p-3 text-center text-xs font-semibold text-slate-400">
              No matching quotations found
            </div>
          ) : (
            filteredQuotations.map((q, idx) => {
              const isSelected = q.id === selectedQuotationId;
              const isFocused = idx === focusedIndex;
              return (
                <div
                  key={q.id}
                  onClick={() => handleSelect(q.id)}
                  onMouseEnter={() => setFocusedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                    isSelected
                      ? "bg-blue-50 text-blue-900 font-bold"
                      : isFocused
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div className="h-7 w-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="h-3.5 w-3.5" />
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-slate-900 truncate flex items-center gap-2">
                        <span className="font-mono text-blue-700">{q.id}</span>
                        <span className="text-slate-600">{q.customer}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {q.date || "Quotation"} • {q.salesperson || "Agent"}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center text-[10px] font-bold text-blue-600">
                        <Check className="h-3 w-3 mr-0.5" /> Selected
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

interface UniversalCustomerSearchProps {
  clients: any[];
  selectedCustomer: string;
  onSelectCustomer: (clientName: string, clientObj?: any) => void;
  placeholder?: string;
  className?: string;
  dropdownDirection?: "bottom" | "top";
}

export function UniversalCustomerSearch({
  clients,
  selectedCustomer,
  onSelectCustomer,
  placeholder = "Type or search customer name, ID, email...",
  className = "",
  dropdownDirection = "bottom"
}: UniversalCustomerSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedClient = clients.find(
    (c) => c.name === selectedCustomer || c.id === selectedCustomer
  ) || null;

  const filteredClients = clients.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (c.name && String(c.name).toLowerCase().includes(term)) ||
      (c.id !== undefined && c.id !== null && String(c.id).toLowerCase().includes(term)) ||
      (c.email && String(c.email).toLowerCase().includes(term)) ||
      (c.contactPersonName && String(c.contactPersonName).toLowerCase().includes(term)) ||
      (c.vatNumber && String(c.vatNumber).toLowerCase().includes(term)) ||
      (c.industry && String(c.industry).toLowerCase().includes(term))
    );
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (client: any) => {
    onSelectCustomer(client.name, client);
    setSearchTerm("");
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectCustomer("", null);
    setSearchTerm("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < filteredClients.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : filteredClients.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < filteredClients.length) {
        handleSelect(filteredClients[focusedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${isOpen ? "z-[999]" : "z-10"} ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          value={isOpen ? searchTerm : (selectedClient ? selectedClient.name : selectedCustomer)}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
            setFocusedIndex(-1);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm("");
          }}
          onKeyDown={handleKeyDown}
          placeholder={selectedClient ? selectedClient.name : (selectedCustomer || placeholder)}
          className="block w-full h-10 pl-9 pr-16 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 font-bold outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
        />
        <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
          {(selectedClient || selectedCustomer) && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition"
              title="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div className={`absolute ${dropdownDirection === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"} z-[9999] max-h-[220px] w-full overflow-y-scroll custom-dropdown-scroll rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl animate-in fade-in duration-150`}>
          {filteredClients.length === 0 ? (
            <div className="p-3 text-center text-xs font-semibold text-slate-400">
              No customers found matching "{searchTerm}"
            </div>
          ) : (
            filteredClients.map((client, idx) => {
              const isSelected = client.name === selectedCustomer || client.id === selectedCustomer;
              const isFocused = idx === focusedIndex;
              return (
                <div
                  key={client.id || idx}
                  onClick={() => handleSelect(client)}
                  onMouseEnter={() => setFocusedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                    isSelected
                      ? "bg-blue-50 text-blue-900 font-bold"
                      : isFocused
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center min-w-0 pr-2">
                    <div className="font-bold text-slate-800 text-xs truncate">
                      {client.name}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center text-[10px] font-bold text-blue-600">
                        <Check className="h-3 w-3 mr-0.5" /> Selected
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

interface UniversalUserSearchProps {
  users: any[];
  selectedUser: string;
  onSelectUser: (userVal: string, userObj?: any) => void;
  placeholder?: string;
  className?: string;
  dropdownDirection?: "bottom" | "top";
}

export function UniversalUserSearch({
  users,
  selectedUser,
  onSelectUser,
  placeholder = "Search salesperson by name, email...",
  className = "",
  dropdownDirection = "bottom"
}: UniversalUserSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedUserObj = users.find(
    (u) => u.email === selectedUser || u.name === selectedUser || u.id === selectedUser
  ) || null;

  const filteredUsers = users.filter((u) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (u.name && String(u.name).toLowerCase().includes(term)) ||
      (u.email && String(u.email).toLowerCase().includes(term)) ||
      (u.role && String(u.role).toLowerCase().includes(term)) ||
      (u.id !== undefined && u.id !== null && String(u.id).toLowerCase().includes(term))
    );
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (user: any) => {
    const val = user.email || user.name || user.id;
    onSelectUser(val, user);
    setSearchTerm("");
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectUser("", null);
    setSearchTerm("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < filteredUsers.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : filteredUsers.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < filteredUsers.length) {
        handleSelect(filteredUsers[focusedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const displayVal = selectedUserObj
    ? (selectedUserObj.name ? `${selectedUserObj.name} (${selectedUserObj.email})` : selectedUserObj.email)
    : selectedUser;

  return (
    <div ref={containerRef} className={`relative w-full ${isOpen ? "z-[999]" : "z-10"} ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          value={isOpen ? searchTerm : displayVal}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
            setFocusedIndex(-1);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm("");
          }}
          onKeyDown={handleKeyDown}
          placeholder={displayVal || placeholder}
          className="block w-full h-10 pl-9 pr-16 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 font-semibold outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
        />
        <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
          {(selectedUserObj || selectedUser) && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition"
              title="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div className={`absolute ${dropdownDirection === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"} z-[9999] max-h-[180px] w-full overflow-y-scroll custom-dropdown-scroll rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl animate-in fade-in duration-150`}>
          {filteredUsers.length === 0 ? (
            <div className="p-3 text-center text-xs font-semibold text-slate-400">
              No salespersons found matching "{searchTerm}"
            </div>
          ) : (
            filteredUsers.map((user, idx) => {
              const userVal = user.email || user.name || user.id;
              const isSelected = userVal === selectedUser;
              const isFocused = idx === focusedIndex;
              return (
                <div
                  key={user.id || idx}
                  onClick={() => handleSelect(user)}
                  onMouseEnter={() => setFocusedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                    isSelected
                      ? "bg-blue-50 text-blue-900 font-bold"
                      : isFocused
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div className="h-7 w-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs">
                      {(user.name || user.email || "U").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-slate-800 truncate">
                        {user.name || user.email}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 font-medium">
                        <span>{user.email}</span>
                        {user.role && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{user.role}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center text-[10px] font-bold text-blue-600">
                        <Check className="h-3 w-3 mr-0.5" /> Selected
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
