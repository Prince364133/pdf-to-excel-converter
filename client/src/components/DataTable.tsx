'use client';

import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender, 
  createColumnHelper,
  ColumnDef 
} from '@tanstack/react-table';
import { Trash2, Plus, Download, Save, Edit3 } from 'lucide-react';
import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';

interface RowData {
  serial_no: string;
  reference_id: string;
  plate_number: string;
  description: string;
  rfid_status: string;
  [key: string]: any;
}

interface DataTableProps {
  initialData: RowData[];
}

export default function DataTable({ initialData }: DataTableProps) {
  const [data, setData] = useState<RowData[]>(initialData);
  const [exportName, setExportName] = useState('vehicle_rfid_data');

  const columnHelper = createColumnHelper<RowData>();

  const columns = useMemo(() => [
    columnHelper.accessor('serial_no', {
      header: 'Serial No',
      cell: info => <EditableCell value={info.getValue()} onChange={(val) => updateCell(info.row.index, 'serial_no', val)} />,
    }),
    columnHelper.accessor('reference_id', {
      header: 'Reference ID',
      cell: info => <EditableCell value={info.getValue()} onChange={(val) => updateCell(info.row.index, 'reference_id', val)} />,
    }),
    columnHelper.accessor('plate_number', {
      header: 'Plate Number',
      cell: info => <EditableCell value={info.getValue()} onChange={(val) => updateCell(info.row.index, 'plate_number', val)} />,
    }),
    columnHelper.accessor('description', {
      header: 'Description',
      cell: info => <EditableCell value={info.getValue()} onChange={(val) => updateCell(info.row.index, 'description', val)} />,
    }),
    columnHelper.accessor('rfid_status', {
      header: 'RFID Status',
      cell: info => <EditableCell value={info.getValue()} onChange={(val) => updateCell(info.row.index, 'rfid_status', val)} />,
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: props => (
        <button 
          onClick={() => deleteRow(props.row.index)}
          className="p-2 text-slate-500 hover:text-red-500 transition-colors"
          title="Delete row"
          aria-label="Delete row"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )
    })
  ], [data]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const updateCell = (index: number, columnId: string, value: any) => {
    setData(old => old.map((row, i) => {
      if (i === index) {
        return { ...row, [columnId]: value };
      }
      return row;
    }));
  };

  const deleteRow = (index: number) => {
    setData(old => old.filter((_, i) => i !== index));
  };

  const addRow = () => {
    setData([...data, {
      serial_no: (data.length + 1).toString(),
      reference_id: '',
      plate_number: '',
      description: '',
      rfid_status: 'Active'
    }]);
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RFID Data");
    XLSX.writeFile(wb, `${exportName}.xlsx`);
  };

  return (
    <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 timeloop-card rounded-3xl bg-slate-900/60">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-cyan-500" />
            Extracted Data Preview
          </h2>
          <p className="text-sm text-slate-400">Review and edit the extracted table rows below.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={addRow}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-all text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Row
          </button>
          
          <div className="h-8 w-[1px] bg-slate-800 mx-1 hidden md:block" />
          
          <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <input 
              type="text" 
              value={exportName}
              onChange={(e) => setExportName(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm text-slate-200 px-3 w-40"
              placeholder="Filename"
            />
            <button 
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 timeloop-gradient text-white rounded-lg shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all text-sm font-bold"
            >
              <Download className="w-4 h-4" />
              Download Excel
            </button>
          </div>
        </div>
      </div>

      <div className="timeloop-card rounded-3xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="bg-slate-800/50 border-b border-slate-700">
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="px-6 py-4 text-xs font-bold text-cyan-500 uppercase tracking-widest">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-cyan-500/5 transition-colors group">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-6 py-4 text-sm text-slate-300">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500 bg-slate-900/20">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin opacity-20" />
                    <p>No data available. Upload a PDF to get started.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900/40 rounded-2xl border border-slate-800/50">
        <p className="text-xs text-slate-500">
          Showing <span className="text-cyan-500 font-bold">{data.length}</span> objects processed from TimeLoop Engine
        </p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">System Ready</span>
        </div>
      </div>
    </div>
  );
}

function EditableCell({ value, onChange }: { value: any, onChange: (val: any) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(value);

  const onBlur = () => {
    setIsEditing(false);
    onChange(val);
  };

  if (isEditing) {
    return (
      <input 
        autoFocus
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={onBlur}
        title="Edit cell value"
        aria-label="Edit cell value"
        className="bg-slate-800 border border-cyan-500/50 rounded px-2 py-1 text-slate-200 w-full focus:outline-none focus:ring-1 focus:ring-cyan-500"
      />
    );
  }

  return (
    <div 
      onClick={() => setIsEditing(true)}
      className="cursor-text py-1 px-2 -mx-2 hover:bg-slate-800/50 rounded transition-colors"
    >
      {value || <span className="text-slate-600 text-xs italic">Empty</span>}
    </div>
  );
}

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);
