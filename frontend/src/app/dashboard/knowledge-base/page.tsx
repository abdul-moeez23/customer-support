"use client";

import { useState } from "react";

export default function KnowledgeBasePage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const companyId = localStorage.getItem("company_id");
    if (!companyId) {
      setMessage("❌ Error: No company ID found. Please sign up or log in again.");
      return;
    }

    setUploading(true);
    setMessage("");

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

      setMessage(`✅ Success! "${data.filename}" was uploaded, processed, and securely stored as ${data.chunks_processed} semantic chunks in your isolated vector database.`);
      setFile(null); // Reset file input
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Knowledge Base</h2>
        <p className="text-gray-500 mt-2">Upload your company's PDFs or Text documents. They will be securely processed and added to your isolated AI brain.</p>
      </header>

      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        <form onSubmit={handleUpload} className="space-y-6">
          <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
            <div className="space-y-1 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex text-sm text-gray-600 justify-center">
                <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                  <span>Upload a file</span>
                  <input 
                    type="file" 
                    className="sr-only" 
                    accept=".pdf,.txt"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                PDF or TXT formats supported
              </p>
            </div>
          </div>
          
          {file && (
            <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded-md border border-gray-200 font-medium">
              📄 Selected file: {file.name}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={!file || uploading}
              className="w-full inline-flex justify-center py-2.5 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 transition-colors"
            >
              {uploading ? "Processing Document (Extracting, Chunking, Embedding)..." : "Upload to Knowledge Base"}
            </button>
          </div>
        </form>

        {message && (
          <div className={`mt-6 p-4 rounded-md font-medium text-sm ${message.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
