import React, { useState } from 'react';
import { 
  Plus, 
  Upload, 
  Filter, 
  Search,
  MoreVertical,
  Edit,
  Trash2,
  FileText,
  MessageSquare
} from 'lucide-react';

interface Receivable {
  id: string;
  customer: string;
  salesRep: string;
  amount: number;
  currency: string;
  dueDate: string;
  delayDays: number;
  status: 'current' | 'overdue';
  hasNotes: boolean;
  hasPromise: boolean;
}

export function Receivables() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'current' | 'overdue'>('all');

  const receivables: Receivable[] = [
    {
      id: '1',
      customer: 'Acme Corporation',
      salesRep: 'Sarah Johnson',
      amount: 125000,
      currency: 'USD',
      dueDate: '2024-08-15',
      delayDays: 156,
      status: 'overdue',
      hasNotes: true,
      hasPromise: true
    },
    {
      id: '2',
      customer: 'TechStart Inc.',
      salesRep: 'Michael Chen',
      amount: 87500,
      currency: 'USD',
      dueDate: '2024-11-20',
      delayDays: 32,
      status: 'overdue',
      hasNotes: true,
      hasPromise: false
    },
    {
      id: '3',
      customer: 'Global Industries',
      salesRep: 'Sarah Johnson',
      amount: 215000,
      currency: 'EUR',
      dueDate: '2025-01-10',
      delayDays: 0,
      status: 'current',
      hasNotes: false,
      hasPromise: false
    },
    {
      id: '4',
      customer: 'Metro Systems',
      salesRep: 'David Martinez',
      amount: 42000,
      currency: 'USD',
      dueDate: '2024-10-05',
      delayDays: 78,
      status: 'overdue',
      hasNotes: true,
      hasPromise: true
    },
    {
      id: '5',
      customer: 'Phoenix Trading',
      salesRep: 'Michael Chen',
      amount: 156000,
      currency: 'GBP',
      dueDate: '2025-01-05',
      delayDays: 0,
      status: 'current',
      hasNotes: false,
      hasPromise: false
    }
  ];

  const filteredReceivables = receivables.filter(r => {
    const matchesSearch = r.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.salesRep.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || r.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-primary">Receivables</h1>
          <p className="text-muted-foreground mt-1">Manage and track all receivables</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-lg hover:bg-muted transition-colors">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import CSV</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Receivable</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-border p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by customer or sales rep..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg border border-transparent focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'all' 
                  ? 'bg-primary text-white' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              All
            </button>
            <button 
              onClick={() => setFilterStatus('current')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'current' 
                  ? 'bg-primary text-white' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Current
            </button>
            <button 
              onClick={() => setFilterStatus('overdue')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'overdue' 
                  ? 'bg-primary text-white' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Overdue
            </button>
            <button className="px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Customer</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Sales Rep</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">Amount</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Due Date</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-muted-foreground">Delay</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReceivables.map((receivable, index) => (
                <tr 
                  key={receivable.id}
                  className={`border-b border-border hover:bg-muted/30 transition-colors ${
                    index % 2 === 1 ? 'bg-muted/10' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-primary">{receivable.customer}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-muted-foreground">{receivable.salesRep}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-semibold text-primary">
                      {receivable.currency} {receivable.amount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">{receivable.dueDate}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {receivable.delayDays > 0 ? (
                      <span className="text-red-600 font-medium">{receivable.delayDays} days</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                      receivable.status === 'overdue'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-green-50 text-green-700'
                    }`}>
                      {receivable.status === 'overdue' ? 'Overdue' : 'Current'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1">
                      {receivable.hasNotes && (
                        <button className="p-2 hover:bg-muted rounded-lg transition-colors text-blue-600">
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                      {receivable.hasPromise && (
                        <button className="p-2 hover:bg-muted rounded-lg transition-colors text-green-600">
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      )}
                      <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-muted rounded-lg transition-colors text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredReceivables.map((receivable) => (
          <div key={receivable.id} className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-primary">{receivable.customer}</h3>
                <p className="text-sm text-muted-foreground">{receivable.salesRep}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                receivable.status === 'overdue'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-green-50 text-green-700'
              }`}>
                {receivable.status === 'overdue' ? 'Overdue' : 'Current'}
              </span>
            </div>
            
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-2xl font-semibold text-primary">
                  {receivable.currency} {receivable.amount.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Due: {receivable.dueDate}</p>
              </div>
              {receivable.delayDays > 0 && (
                <div className="text-right">
                  <p className="text-red-600 font-medium">{receivable.delayDays}</p>
                  <p className="text-xs text-muted-foreground">days late</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {receivable.hasNotes && (
                <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-700 rounded-lg">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">Notes</span>
                </button>
              )}
              {receivable.hasPromise && (
                <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-50 text-green-700 rounded-lg">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm">Promise</span>
                </button>
              )}
              <button className="p-2 bg-muted rounded-lg">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
