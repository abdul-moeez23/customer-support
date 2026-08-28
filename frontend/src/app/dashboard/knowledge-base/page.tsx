"use client";

import { useState } from "react";
import { BookOpen, UploadCloud, FileText, CheckCircle2, AlertCircle } from "lucide-react";

export default function KnowledgeBasePage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const companyId = localStorage.getItem("company_id");
    if (!companyId) {
      setMessage({ text: "Error: No company ID found. Please sign up or log in again.", type: "error" });
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

      setMessage({ text: `Success! "${data.filename}" was uploaded, processed, and securely stored as ${data.chunks_processed} semantic chunks in your isolated vector database.`, type: "success" });
      setFile(null); // Reset file input
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          Knowledge Base
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Upload your company's PDFs or Text documents. They will be securely processed and added to your isolated AI brain.</p>
      </header>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <form onSubmit={handleUpload} className="space-y-6">
          <div className="flex justify-center px-6 pt-10 pb-12 border-2 border-slate-300 border-dashed rounded-2xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors group relative cursor-pointer">
            <input 
              type="file" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              accept=".pdf,.txt"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <div className="space-y-2 text-center pointer-events-none">
              <UploadCloud className="mx-auto h-12 w-12 text-slate-400 group-hover:text-indigo-500 transition-colors" />
              <div className="flex text-sm text-slate-600 justify-center font-medium">
                <span className="text-indigo-600 font-bold group-hover:text-indigo-700">Upload a file</span>
                <span className="pl-1">or drag and drop</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                PDF or TXT formats supported (Max 10MB)
              </p>
            </div>
          </div>
          
          {file && (
            <div className="flex items-center gap-3 text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 font-medium shadow-sm">
              <FileText className="w-5 h-5 text-indigo-500" />
              <div className="flex-1 truncate">
                {file.name}
              </div>
              <div className="text-xs text-slate-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={!file || uploading}
              className="w-full inline-flex justify-center items-center gap-2 py-3 px-4 rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-indigo-200 border-t-white rounded-full animate-spin"></div>
                  <span>Processing Document...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload to Knowledge Base</span>
                </>
              )}
            </button>
          </div>
        </form>

        {message.text && (
          <div className={`mt-6 p-4 rounded-xl font-medium text-sm flex items-start gap-3 ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
            {message.type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" /> : <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" />}
            <span className="leading-relaxed">{message.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}
