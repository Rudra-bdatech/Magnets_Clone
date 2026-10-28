"use client";

import React from "react";
import { Sparkles, Plus, Minus } from "lucide-react";
import { type Account, type CustomFormField } from "@/lib/data";

export interface CustomFieldsBuilderProps {
  account: Account | null;
  customFormFields: CustomFormField[];
  setCustomFormFields: React.Dispatch<React.SetStateAction<CustomFormField[]>>;
}

export default function CustomFieldsBuilder({
  account,
  customFormFields,
  setCustomFormFields,
}: CustomFieldsBuilderProps) {
  const isDark = (account?.themeMode || "light") === "dark";

  const fieldsList = customFormFields || [];

  return (
    <div className={`mt-6 max-w-6xl mx-auto rounded-2xl border p-5 transition ${isDark ? "border-white/10 bg-[#171717] text-white" : "border-zinc-200 bg-zinc-50 text-zinc-900"}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>Custom Form Fields Builder</span>
        </h4>
        <span className={`text-xs font-medium ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
          {fieldsList.length} field{fieldsList.length !== 1 ? "s" : ""} added
        </span>
      </div>

      {/* Quick Field Preset Buttons */}
      <p className={`text-xs mb-2 font-semibold ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>Quick Presets:</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Company Name Preset */}
        {(() => {
          const isAdded = fieldsList.some(f => f.id === "field_company");
          return (
            <button
              type="button"
              onClick={() => {
                if (isAdded) {
                  setCustomFormFields(prev => prev.filter(f => f.id !== "field_company"));
                } else {
                  setCustomFormFields(prev => [...prev, { id: "field_company", type: "text", label: "Company Name", placeholder: "Acme Inc.", required: false }]);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${isAdded
                ? "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                : isDark
                  ? "border-white/15 bg-white/10 text-zinc-100 hover:bg-indigo-500/20 hover:text-indigo-300 hover:border-indigo-500/40"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 shadow-xs"
                }`}
            >
              {isAdded ? "- Company Name" : "+ Company Name"}
            </button>
          );
        })()}

        {/* Phone Number Preset */}
        {(() => {
          const isAdded = fieldsList.some(f => f.id === "field_phone");
          return (
            <button
              type="button"
              onClick={() => {
                if (isAdded) {
                  setCustomFormFields(prev => prev.filter(f => f.id !== "field_phone"));
                } else {
                  setCustomFormFields(prev => [...prev, { id: "field_phone", type: "text", label: "Phone Number", placeholder: "+1 (555) 000-0000", required: false }]);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${isAdded
                ? "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                : isDark
                  ? "border-white/15 bg-white/10 text-zinc-100 hover:bg-indigo-500/20 hover:text-indigo-300 hover:border-indigo-500/40"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 shadow-xs"
                }`}
            >
              {isAdded ? "- Phone Number" : "+ Phone Number"}
            </button>
          );
        })()}

        {/* Company Size Preset */}
        {(() => {
          const isAdded = fieldsList.some(f => f.id === "field_team_size");
          return (
            <button
              type="button"
              onClick={() => {
                if (isAdded) {
                  setCustomFormFields(prev => prev.filter(f => f.id !== "field_team_size"));
                } else {
                  setCustomFormFields(prev => [...prev, { id: "field_team_size", type: "select", label: "Company Size", placeholder: "Select company size", required: false, options: ["1-10 employees", "11-50 employees", "51-200 employees", "201+ employees"] }]);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${isAdded
                ? "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                : isDark
                  ? "border-white/15 bg-white/10 text-zinc-100 hover:bg-indigo-500/20 hover:text-indigo-300 hover:border-indigo-500/40"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 shadow-xs"
                }`}
            >
              {isAdded ? "- Company Size Dropdown" : "+ Company Size Dropdown"}
            </button>
          );
        })()}

        {/* Notes / Message Preset */}
        {(() => {
          const isAdded = fieldsList.some(f => f.id === "field_notes");
          return (
            <button
              type="button"
              onClick={() => {
                if (isAdded) {
                  setCustomFormFields(prev => prev.filter(f => f.id !== "field_notes"));
                } else {
                  setCustomFormFields(prev => [...prev, { id: "field_notes", type: "textarea", label: "Additional Notes", placeholder: "Tell us about your project...", required: false }]);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${isAdded
                ? "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                : isDark
                  ? "border-white/15 bg-white/10 text-zinc-100 hover:bg-indigo-500/20 hover:text-indigo-300 hover:border-indigo-500/40"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 shadow-xs"
                }`}
            >
              {isAdded ? "- Notes / Message" : "+ Notes / Message"}
            </button>
          );
        })()}

        {/* Dynamically Added Custom Input Fields Pills (showing - minus sign) */}
        {fieldsList
          .filter(f => !["field_company", "field_phone", "field_team_size", "field_notes"].includes(f.id))
          .map((f, idx) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setCustomFormFields(prev => prev.filter(item => item.id !== f.id))}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
              title="Click to remove this custom field"
            >
              <Minus className="h-3.5 w-3.5" />
              <span>- {f.label || `Custom Field ${idx + 1}`}</span>
            </button>
          ))}
      </div>

      {/* Add Custom Field Form */}
      <button
        type="button"
        onClick={() => {
          const newId = `field_${Date.now()}`;
          setCustomFormFields(prev => [...(prev || []), { id: newId, type: "text", label: `Custom Field ${(prev || []).length + 1}`, placeholder: "Enter answer...", required: false }]);
        }}
        className="w-full py-2.5 rounded-xl border border-dashed border-indigo-500/40 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Add Custom Input Field</span>
      </button>

      {/* Active Fields List with Remove/Minus (-) buttons */}
      {fieldsList.length > 0 && (
        <div className="space-y-3 mt-4 pt-3 border-t border-indigo-500/20">
          <p className={`text-xs font-semibold ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
            Active Custom Fields ({fieldsList.length}):
          </p>
          <div className="space-y-2">
            {fieldsList.map((field) => (
              <div
                key={field.id}
                className={`p-3 rounded-xl border transition flex flex-col md:flex-row md:items-center gap-3 ${
                  isDark
                    ? "bg-zinc-900/60 border-white/10 text-white"
                    : "bg-white border-zinc-200 text-zinc-900 shadow-xs"
                }`}
              >
                {/* Field Label Input */}
                <div className="flex-1 min-w-0">
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                    Field Label
                  </label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => {
                      const newLabel = e.target.value;
                      setCustomFormFields(prev =>
                        prev.map(f => (f.id === field.id ? { ...f, label: newLabel } : f))
                      );
                    }}
                    placeholder="Field Label"
                    className={`w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none font-medium transition ${
                      isDark
                        ? "bg-black/50 border-white/10 focus:border-indigo-500 text-white"
                        : "bg-zinc-50 border-zinc-200 focus:border-indigo-500 text-zinc-900"
                    }`}
                  />
                </div>

                {/* Field Type Select */}
                <div className="w-full md:w-32">
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                    Type
                  </label>
                  <select
                    value={field.type}
                    onChange={(e) => {
                      const newType = e.target.value as CustomFormField["type"];
                      setCustomFormFields(prev =>
                        prev.map(f => (f.id === field.id ? { ...f, type: newType } : f))
                      );
                    }}
                    className={`w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none font-medium transition cursor-pointer ${
                      isDark
                        ? "bg-black/50 border-white/10 focus:border-indigo-500 text-white"
                        : "bg-zinc-50 border-zinc-200 focus:border-indigo-500 text-zinc-900"
                    }`}
                  >
                    <option value="text">Text</option>
                    <option value="textarea">Textarea</option>
                    <option value="number">Number</option>
                    <option value="select">Dropdown</option>
                    <option value="checkbox">Checkbox</option>
                  </select>
                </div>

                {/* Field Placeholder Input */}
                <div className="flex-1 min-w-0">
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                    Placeholder
                  </label>
                  <input
                    type="text"
                    value={field.placeholder || ""}
                    onChange={(e) => {
                      const newPlaceholder = e.target.value;
                      setCustomFormFields(prev =>
                        prev.map(f => (f.id === field.id ? { ...f, placeholder: newPlaceholder } : f))
                      );
                    }}
                    placeholder="Placeholder..."
                    className={`w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none font-medium transition ${
                      isDark
                        ? "bg-black/50 border-white/10 focus:border-indigo-500 text-white"
                        : "bg-zinc-50 border-zinc-200 focus:border-indigo-500 text-zinc-900"
                    }`}
                  />
                </div>

                {/* Remove Field (-) Button */}
                <div className="flex items-center justify-end self-end md:self-auto pt-1 md:pt-4">
                  <button
                    type="button"
                    title="Remove Field"
                    onClick={() => {
                      setCustomFormFields(prev => prev.filter(f => f.id !== field.id));
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Minus className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


