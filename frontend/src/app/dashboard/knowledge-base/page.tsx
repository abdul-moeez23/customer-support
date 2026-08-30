"use client";

import { useState, useEffect, useCallback } from "react";
import { BookOpen, UploadCloud, FileText, CheckCircle2, AlertCircle, X, Trash2, Edit } from "lucide-react";

export default function KnowledgeBasePage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [dragOver, setDragOver] = useState(false);

  const [widgets, setWidgets] = useState<Record<string, unknown>[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [docId, setDocId] = useState<string | null>(null);
  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([]);
  const [savingWidgets, setSavingWidgets] = useState(false);

  const fetchWidgets = useCallback(async () => {
    const companyId = localStorage.getItem("company_id");
    if (!companyId) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/widget-config/${companyId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setWidgets(data);
        }
      }
    } catch (err) {
      console.error("Failed to load widgets", err);
    }
  }, []);

  const fetchDocuments = useCallback(async () => {
    const companyId = localStorage.getItem("company_id");
    if (!companyId) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/documents/company/${companyId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setDocuments(data);
        }
      }
    } catch (err) {
      console.error("Failed to load documents", err);
    }
  }, []);

  useEffect(() => {
    fetchWidgets();
    fetchDocuments();
  }, [fetchWidgets, fetchDocuments]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const companyId = localStorage.getItem("company_id");
    if (!companyId) {
      setMessage({ text: "No company ID found. Please sign in again.", type: "error" });
      return;
    }

    setUploading(true);
    setMessage({ text: "Uploading...", type: "info" });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("company_id", companyId);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/documents`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");

      const newDocId = data.document_id;
      setMessage({ text: "Processing in background...", type: "info" });

      const poll = setInterval(async () => {
        try {
          const statusRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/documents/${newDocId}/status`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData.status === "completed") {
              clearInterval(poll);
              setUploading(false);
              setMessage({
                text: `"${statusData.filename}" was successfully processed.`,
                type: "success",
              });
              setFile(null);
              setDocId(newDocId);
              setSelectedWidgets(widgets.map(w => w.id as string));
              setShowWidgetModal(true);
              fetchDocuments();
            } else if (statusData.status === "failed") {
              clearInterval(poll);
              setUploading(false);
              setMessage({ text: "Document processing failed.", type: "error" });
              fetchDocuments();
            }
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 2000);

    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
      setUploading(false);
    }
  };

  const handleSaveWidgetAccess = async () => {
    if (!docId) return;
    setSavingWidgets(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/documents/${docId}/widgets`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widget_ids: selectedWidgets }),
      });
      if (!res.ok) throw new Error("Failed to save access.");
      
      setMessage({ text: "Document access saved.", type: "success" });
      setShowWidgetModal(false);
      setDocId(null);
      fetchDocuments();
    } catch (err) {
      console.error(err);
      setMessage({ text: "Failed to save widget access.", type: "error" });
    } finally {
      setSavingWidgets(false);
    }
  };

  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!documentToDelete) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/documents/${documentToDelete}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete document.");
      fetchDocuments();
    } catch (err) {
      console.error("Failed to delete document", err);
      alert("Failed to delete document.");
    } finally {
      setDocumentToDelete(null);
    }
  };

  const handleDelete = (id: string) => {
    setDocumentToDelete(id);
  };

  const openManageAccess = (doc: any) => {
    setDocId(doc.id);
    setSelectedWidgets(doc.widget_ids || []);
    setShowWidgetModal(true);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="pt-2">
        <div className="flex items-center gap-2.5 mb-1">
          <BookOpen className="w-5 h-5 text-zinc-400" />
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Knowledge Base</h1>
        </div>
        <p className="text-sm text-zinc-500 ml-7.5">Upload documents to train your AI assistant.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm transition-colors">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mb-4">Upload Document</h2>
        <form onSubmit={handleUpload} className="space-y-4">
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
              dragOver ? "border-zinc-500 bg-zinc-50" : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50"
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

          {message.text && !showWidgetModal && (
            <div className={`flex items-start gap-2.5 text-sm p-3.5 rounded-lg border ${
              message.type === "error" ? "bg-red-50 border-red-100 text-red-700" :
              message.type === "info" ? "bg-blue-50 border-blue-100 text-blue-700" :
              "bg-emerald-50 border-emerald-100 text-emerald-700"
            }`}>
              {message.type === "error" && <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />}
              {message.type === "info" && <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin flex-shrink-0 mt-0.5" />}
              {message.type === "success" && <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500 mt-0.5" />}
              <span className="leading-relaxed">{message.text}</span>
            </div>
          )}
        </form>
      </div>
      
      {documents.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-zinc-900 mb-4">Your Uploaded Documents</h2>
          <div className="space-y-3">
            {documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 border border-zinc-100 rounded-lg hover:bg-zinc-50 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-zinc-400" />
                  <div>
                    <p className="text-sm font-medium text-zinc-700 truncate max-w-xs">{doc.filename}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        doc.status === "completed" ? "bg-green-100 text-green-700" :
                        doc.status === "failed" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {doc.status}
                      </span>
                      <span className="text-xs text-zinc-400">Assigned to {doc.widget_ids?.length || 0} widgets</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openManageAccess(doc)} className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors" title="Manage Access">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showWidgetModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xl w-full max-w-md">
            <h2 className="text-sm font-bold text-zinc-900 mb-2">Assign Document to Widgets</h2>
            <p className="text-xs text-zinc-500 mb-4">Which widgets should be able to search this document?</p>
            
            <div className="space-y-2 mb-6 max-h-48 overflow-y-auto pr-2">
              {widgets.map(w => (
                <label key={w.id as string} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-50 cursor-pointer border border-zinc-100">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                    checked={selectedWidgets.includes(w.id as string)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedWidgets([...selectedWidgets, w.id as string]);
                      else setSelectedWidgets(selectedWidgets.filter(id => id !== w.id));
                    }}
                  />
                  <span className="text-sm font-medium text-zinc-700">{w.bot_name as string || `Widget ${w.id}`}</span>
                </label>
              ))}
              {widgets.length === 0 && (
                <div className="text-sm text-zinc-500">No widgets found. Please create one in Widget Settings.</div>
              )}
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowWidgetModal(false); setDocId(null); }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-50 border border-zinc-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWidgetAccess}
                disabled={savingWidgets}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50"
              >
                {savingWidgets ? (
                  <div className="w-4 h-4 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Save Access
              </button>
            </div>
          </div>
        </div>
      )}
      {documentToDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xl w-full max-w-sm">
            <h2 className="text-lg font-bold text-zinc-900 mb-2">Delete Document</h2>
            <p className="text-sm text-zinc-500 mb-6">Are you sure you want to delete this document? This action cannot be undone.</p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDocumentToDelete(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-50 border border-zinc-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
