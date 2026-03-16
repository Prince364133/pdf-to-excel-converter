'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import UploadZone from '@/components/UploadZone';
import DataTable from '@/components/DataTable';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Dashboard() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<any[]>([]);
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error', message: string }>({
    type: 'idle',
    message: ''
  });

  const handleUpload = async (files: File[]) => {
    setIsProcessing(true);
    setStatus({ type: 'loading', message: 'Reading PDF and extracting tables...' });
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setExtractedData(response.data.data);
        setStatus({ type: 'success', message: `Successfully extracted ${response.data.count} rows.` });
      } else {
        setStatus({ type: 'error', message: 'Failed to extract data. Is the extraction service running?' });
      }
    } catch (err: any) {
      console.error(err);
      setStatus({ 
        type: 'error', 
        message: err.response?.data?.error || 'Connection error. Please check if the backend services are running.' 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0F172A] selection:bg-cyan-500/30">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight">
              Enterprise <span className="text-transparent bg-clip-text timeloop-gradient">PDF Table</span> Intelligence
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto mt-4">
              Automated extraction engine for structured data. Upload multiple PDFs and instantly convert them into premium Excel spreadsheets.
            </p>
          </motion.div>
        </section>

        {/* Status indicator */}
        <AnimatePresence>
          {status.type !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`flex items-center gap-3 p-4 rounded-2xl border ${
                status.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-400' :
                status.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' :
                'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'
              }`}
            >
              {status.type === 'error' ? <AlertCircle className="w-5 h-5" /> : 
               status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
               <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />}
              <span className="text-sm font-medium">{status.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Section */}
        <section>
          {extractedData.length === 0 ? (
            <UploadZone onUpload={handleUpload} isProcessing={isProcessing} />
          ) : (
            <DataTable initialData={extractedData} />
          )}
        </section>

        {/* Stats / Features */}
        {extractedData.length === 0 && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
            {[
              { title: 'High Accuracy', desc: 'Lattice and Stream detection algorithms ensure 99% data integrity.' },
              { title: 'Multi-Merge', desc: 'Automatically merge 100+ PDFs into a single continuous dataset.' },
              { title: 'TanStack Powered', desc: 'Fully editable spreadsheet-style interface before final export.' }
            ].map((feature, i) => (
              <div key={i} className="p-6 timeloop-card rounded-3xl group hover:border-cyan-500/50 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-4 group-hover:timeloop-gradient transition-all">
                  <div className="w-6 h-6 border-2 border-slate-600 rounded group-hover:border-white transition-colors" />
                </div>
                <h4 className="text-white font-bold mb-2">{feature.title}</h4>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </section>
        )}
      </div>

      <footer className="border-t border-slate-800/50 py-8 px-6 mt-12 bg-slate-900/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-xs font-mono tracking-widest uppercase">
            © 2026 TIMELOOP SYSTEMS // CORE ENGINE v1.0.4
          </p>
          <div className="flex gap-4">
            <div className="h-1 w-20 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full w-2/3 timeloop-gradient" />
            </div>
            <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Processing Node: ALPHA-9</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
