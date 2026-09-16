"use client";

import React from "react";
import type { Company } from "../data/mock";

interface CompanyDocumentHeaderProps {
  company: Company;
  documentTitle?: string;
  documentNumber?: string;
  documentDate?: string;
  dueDate?: string;
  badgeLabel?: string;
}

export function CompanyDocumentHeader({
  company,
  documentTitle,
  documentNumber,
  documentDate,
  dueDate,
  badgeLabel
}: CompanyDocumentHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-6 gap-4">
      {/* Left: Logo & Company Profile */}
      <div className="flex items-start gap-4">
        <img
          src={company.logoUrl || "/ggms-logo-horizontal.png"}
          alt={company.name}
          className="h-14 w-auto max-w-[220px] object-contain rounded-lg border border-slate-100 p-1 shadow-sm bg-white"
        />

        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-black text-slate-950 leading-snug tracking-tight">
              {company.name || "Company Name"}
            </h2>
            {company.branch && (
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 border border-slate-200">
                {company.branch}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500 flex-wrap">
            {company.taxNumber && (
              <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-mono font-bold">
                VAT / TRN: {company.taxNumber}
              </span>
            )}
            {company.crNumber && (
              <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                CR No: {company.crNumber}
              </span>
            )}
          </div>

          <div className="text-xs text-slate-600 space-y-0.5 pt-1">
            {company.address && <p className="font-medium text-slate-700">{company.address}</p>}
            <div className="flex items-center gap-3 text-slate-500 text-[11px] flex-wrap">
              {company.contactNo && <span>Tel: <strong className="text-slate-800">{company.contactNo}</strong></span>}
              {company.email && <span>Email: <strong className="text-slate-800">{company.email}</strong></span>}
              {company.website && <span>Web: <strong className="text-slate-800">{company.website}</strong></span>}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Document Details (Invoice/Quotation metadata) */}
      {(documentTitle || documentNumber) && (
        <div className="text-right sm:self-start space-y-1 bg-slate-50/80 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-slate-200/80 w-full sm:w-auto">
          {badgeLabel && (
            <span className="inline-block mb-1 text-[11px] uppercase px-3 py-1 font-extrabold tracking-wider rounded-lg bg-blue-600 text-white shadow-sm">
              {badgeLabel}
            </span>
          )}
          {documentTitle && (
            <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">
              {documentTitle}
            </h1>
          )}
          <div className="text-xs text-slate-500 space-y-1 font-semibold">
            {documentNumber && (
              <p>
                <span className="font-extrabold text-slate-700 uppercase text-[10px] tracking-wider mr-1">Doc No:</span>
                <span className="font-mono text-slate-900 font-bold">{documentNumber}</span>
              </p>
            )}
            {documentDate && (
              <p>
                <span className="font-extrabold text-slate-700 uppercase text-[10px] tracking-wider mr-1">Date:</span>
                <span>{documentDate}</span>
              </p>
            )}
            {dueDate && (
              <p>
                <span className="font-extrabold text-slate-700 uppercase text-[10px] tracking-wider mr-1">Due Date:</span>
                <span>{dueDate}</span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
