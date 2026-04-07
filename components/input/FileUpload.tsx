"use client";

import { useState, useRef, useCallback } from "react";
import { formatFileSize } from "@/lib/utils";

interface FileUploadProps {
  onFileAccepted: (file: File) => void;
  loading?: boolean;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function FileUpload({ onFileAccepted, loading = false }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function validateFile(file: File): string | null {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Invalid file type. Please upload a PDF or DOCX file.";
    }
    if (file.size > MAX_SIZE) {
      return "File too large. Maximum size is 10MB.";
    }
    return null;
  }

  function handleFile(file: File) {
    setError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSelectedFile(file);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleUpload() {
    if (selectedFile) {
      onFileAccepted(selectedFile);
    }
  }

  function handleRemove() {
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-4">

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !selectedFile && inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200
          ${isDragging
            ? "border-brand-500 bg-brand-500/10"
            : selectedFile
            ? "border-success/50 bg-success/5"
            : "border-surface-300 hover:border-brand-500/50 hover:bg-surface-50 cursor-pointer"
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={handleInputChange}
          className="hidden"
          disabled={loading}
        />

        {selectedFile ? (
          /* Selected file state */
          <div className="space-y-3">
            <div className="w-14 h-14 bg-success/20 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-7 h-7 text-success"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium">{selectedFile.name}</p>
              <p className="text-white/40 text-sm mt-1">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="space-y-3">
            <div className="w-14 h-14 bg-surface-200 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-7 h-7 text-white/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium">
                Drop your document here
              </p>
              <p className="text-white/40 text-sm mt-1">
                or click to browse
              </p>
            </div>
            <p className="text-white/30 text-xs">
              PDF or DOCX · Max 10MB
            </p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-error/10 border border-error/30 text-red-300 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Actions */}
      {selectedFile && (
        <div className="flex gap-3">
          <button
            onClick={handleRemove}
            disabled={loading}
            className="btn-secondary flex-1"
          >
            Remove
          </button>
          <button
            onClick={handleUpload}
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Extracting...
              </span>
            ) : (
              "Extract & Continue →"
            )}
          </button>
        </div>
      )}

      {/* Helper text */}
      <p className="text-center text-xs text-white/30">
        Your document is processed securely and never stored on our servers.
      </p>

    </div>
  );
}