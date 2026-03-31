"use client";

import { useState } from "react";
import { Download, FileText, Table, ChevronDown } from "lucide-react";

interface ExportButtonProps {
  onExportPDF?: () => void;
  onExportExcel?: () => void;
  label?: string;
}

export default function ExportButton({
  onExportPDF,
  onExportExcel,
  label = "Export",
}: ExportButtonProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B4332] text-white text-xs font-semibold hover:bg-[#2D6A4F] transition-colors"
      >
        <Download size={14} />
        {label}
        <ChevronDown size={12} />
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-10 bg-white rounded-xl shadow-lg border border-[#E2E8F0] z-50 overflow-hidden min-w-[160px]">
            {onExportPDF && (
              <button
                onClick={() => {
                  onExportPDF();
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 w-full px-4 py-3 text-xs font-medium text-[#1A202C] hover:bg-[#F4F6F8] transition-colors"
              >
                <FileText size={14} className="text-[#C0392B]" />
                Export as PDF
              </button>
            )}
            {onExportExcel && (
              <button
                onClick={() => {
                  onExportExcel();
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 w-full px-4 py-3 text-xs font-medium text-[#1A202C] hover:bg-[#F4F6F8] transition-colors border-t border-[#F4F6F8]"
              >
                <Table size={14} className="text-[#27AE60]" />
                Export as Excel
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}