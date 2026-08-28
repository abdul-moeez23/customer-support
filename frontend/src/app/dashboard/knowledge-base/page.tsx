"use client";

import { useState } from "react";
import { BookOpen, UploadCloud, FileText, CheckCircle2, AlertCircle, X } from "lucide-react";

export default function KnowledgeBasePage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [dragOver, setDragOver] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const companyId = localStorage.getItem("company_id");
    if (!companyId) {
      setMessage({ text: "No company ID found. Please sign in again.", type: "error" });
      return;
    }

    setUploading(true);
    setMessage({ text: "", type: "" });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("company_id", companyId);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documents`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Upload failed");
      }

      setMessage({
        text: `"${data.filename}" was processed and stored as ${data.chunks_processed} semantic chunks in your knowledge base.`,
        type: "success",
      });
      setFile(null);
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Page header */}
      <div className="pt-2">
        <div className="flex items-center gap-2.5 mb-1">
          <BookOpen className="w-5 h-5 text-zinc-400" />
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Knowledge Base</h1>
        </div>
        <p className="text-sm text-zinc-500 ml-7.5">Upload documents to train your AI assistant.</p>
      </div>

      {/* Upload card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-900 mb-4">Upload Document</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const dropped = e.dataTransfer.files[0];
              if (dropped) setFile(dropped);
            }}
            className={`relative flex flex-col items-center justify-center px-6 py-12 border-2 border-dashed rounded-xl transition-colors cursor-pointer ${
              dragOver
                ? "border-zinc-500 bg-zinc-50"
                : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50"
            }`}
          >
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".pdf,.txt"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              aria-label="Upload file"
            />
            <UploadCloud className={`w-10 h-10 mb-3 transition-colors ${dragOver ? "text-zinc-700" : "text-zinc-300"}`} />
            <p className="text-sm font-semibold text-zinc-700">
              Drop your file here, or <span className="text-zinc-900 underline underline-offset-2">browse</span>
            </p>
            <p className="text-xs text-zinc-400 mt-1.5">PDF or TXT &mdash; max 10MB</p>
          </div>

          {/* Selected file */}
          {file && (
            <div className="flex items-center gap-3 text-sm bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-lg">
              <FileText className="w-4 h-4 text-zinc-500 flex-shrink-0" />
              <span className="flex-1 truncate font-medium text-zinc-700">{file.name}</span>
              <span className="text-xs text-zinc-400 flex-shrink-0">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                aria-label="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={!file || uploading}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] cursor-pointer"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Upload to Knowledge Base</span>
              </>
            )}
          </button>

          {message.text && (
            <div className={`flex items-start gap-2.5 text-sm p-3.5 rounded-lg border ${
              message.type === "error"
                ? "bg-red-50 border-red-100 text-red-700"
                : "bg-emerald-50 border-emerald-100 text-emerald-700"
            }`}>
              {message.type === "error"
                ? <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />
                : <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500 mt-0.5" />
              }
              <span className="leading-relaxed">{message.text}</span>
            </div>
          )}
        </form>
      </div>

      {/* Info panel */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <h2 className="text-sm font-bold text-zinc-900 mb-3">How it works</h2>
        <ol className="space-y-2.5">
          {[
            "Your document is chunked into semantic segments.",
            "Each chunk is embedded as a vector and stored in your isolated database.",
            "When a customer asks a question, the AI searches your knowledge base first.",
            "Answers are grounded in your own content — not generic AI responses.",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-zinc-600">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-zinc-100 text-zinc-500 text-[11px] font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
