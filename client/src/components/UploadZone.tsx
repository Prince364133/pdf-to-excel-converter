'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadZoneProps {
  onUpload: (files: File[]) => void;
  isProcessing: boolean;
}

export default function UploadZone({ onUpload, isProcessing }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
    if (droppedFiles.length > 0) {
      const newFiles = [...files, ...droppedFiles];
      setFiles(newFiles);
      onUpload(newFiles);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const newFiles = [...files, ...selectedFiles];
      setFiles(newFiles);
      onUpload(newFiles);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center transition-all duration-300 ${
          isDragging 
            ? 'border-cyan-400 bg-cyan-950/20' 
            : 'border-slate-700 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/60'
        }`}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept=".pdf"
          className="hidden"
          title="Upload PDF files"
          aria-label="Upload PDF files"
          id="pdf-upload"
        />

        <div className={`p-6 rounded-full timeloop-gradient mb-6 transition-transform duration-500 group-hover:scale-110 ${isDragging ? 'scale-110' : ''}`}>
          {isProcessing ? (
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          ) : (
            <Upload className="w-10 h-10 text-white" />
          )}
        </div>

        <h3 className="text-2xl font-bold text-white mb-2">
          {isDragging ? 'Drop Your PDFs Here' : 'Drop your PDFs here'}
        </h3>
        <p className="text-slate-400 text-center max-w-md">
          {isProcessing 
            ? 'Analyzing table structures and extracting data...' 
            : 'Multi-PDF support enabled. Select one or more files to convert them all into a single Excel sheet.'}
        </p>
        
        <div className="mt-8 flex gap-2">
          <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-400 border border-slate-700">PDF ONLY</span>
          <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-400 border border-slate-700">UP TO 50MB</span>
        </div>
      </motion.div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {files.map((file, idx) => (
              <motion.div
                key={`${file.name}-${idx}`}
                layout
                className="flex items-center justify-between p-4 bg-slate-900/80 border border-slate-800 rounded-2xl group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-cyan-500" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-slate-200 truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                  className="p-2 hover:bg-red-500/10 hover:text-red-500 text-slate-500 rounded-lg transition-colors"
                  title="Remove file"
                  aria-label="Remove file"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
