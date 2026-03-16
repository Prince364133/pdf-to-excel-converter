import { Layout, History, Settings, User } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 py-4 timeloop-glass sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg timeloop-gradient neon-glow">
          <Layout className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white neon-text">
          TimeLoop <span className="text-cyan-400">PDF Converter</span>
        </h1>
      </div>
      
      <div className="flex items-center gap-6">
        <button className="flex items-center gap-2 text-slate-300 hover:text-cyan-400 transition-colors">
          <History className="w-5 h-5" />
          <span className="text-sm font-medium">History</span>
        </button>
        <button className="flex items-center gap-2 text-slate-300 hover:text-cyan-400 transition-colors">
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium">Settings</span>
        </button>
        <div className="h-6 w-[1px] bg-slate-700/50 mx-2" />
        <button className="flex items-center gap-2 bg-slate-800/50 p-1 pr-3 rounded-full border border-slate-700 hover:border-cyan-500/50 transition-all">
          <div className="w-8 h-8 rounded-full timeloop-gradient flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-medium text-slate-200">Admin</span>
        </button>
      </div>
    </nav>
  );
}
