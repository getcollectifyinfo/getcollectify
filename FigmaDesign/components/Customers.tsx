import React, { useState } from 'react';
import { 
  Plus, 
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  totalOutstanding: number;
  overdueAmount: number;
  currentAmount: number;
  lastContactDate: string | null;
  riskLevel: 'low' | 'medium' | 'high';
  receivablesCount: number;
}

export function Customers() {
  const [searchQuery, setSearchQuery] = useState('');

  const customers: Customer[] = [
    {
      id: '1',
      name: 'Acme Corporation',
      totalOutstanding: 325000,
      overdueAmount: 125000,
      currentAmount: 200000,
      lastContactDate: '2024-12-18',
      riskLevel: 'high',
      receivablesCount: 3
    },
    {
      id: '2',
      name: 'TechStart Inc.',
      totalOutstanding: 187500,
      overdueAmount: 87500,
      currentAmount: 100000,
      lastContactDate: '2024-12-15',
      riskLevel: 'medium',
      receivablesCount: 2
    },
    {
      id: '3',
      name: 'Global Industries',
      totalOutstanding: 450000,
      overdueAmount: 0,
      currentAmount: 450000,
      lastContactDate: '2024-12-20',
      riskLevel: 'low',
      receivablesCount: 5
    },
    {
      id: '4',
      name: 'Metro Systems',
      totalOutstanding: 98000,
      overdueAmount: 42000,
      currentAmount: 56000,
      lastContactDate: null,
      riskLevel: 'high',
      receivablesCount: 2
    },
    {
      id: '5',
      name: 'Phoenix Trading',
      totalOutstanding: 310000,
      overdueAmount: 0,
      currentAmount: 310000,
      lastContactDate: '2024-12-19',
      riskLevel: 'low',
      receivablesCount: 4
    },
    {
      id: '6',
      name: 'Summit Enterprises',
      totalOutstanding: 125000,
      overdueAmount: 45000,
      currentAmount: 80000,
      lastContactDate: '2024-12-10',
      riskLevel: 'medium',
      receivablesCount: 3
    }
  ];

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalCustomers: customers.length,
    highRisk: customers.filter(c => c.riskLevel === 'high').length,
    neverContacted: customers.filter(c => c.lastContactDate === null).length,
    currentOnly: customers.filter(c => c.overdueAmount === 0).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-primary">Customers</h1>
          <p className="text-muted-foreground mt-1">Customer risk overview and management</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Customers"
          value={stats.totalCustomers.toString()}
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          label="High Risk"
          value={stats.highRisk.toString()}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          label="Never Contacted"
          value={stats.neverContacted.toString()}
          icon={Clock}
          color="orange"
        />
        <StatCard
          label="Current Only"
          value={stats.currentOnly.toString()}
          icon={CheckCircle}
          color="green"
        />
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg border border-transparent focus:border-primary focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Customer</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">Total Outstanding</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">Overdue</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">Current</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-muted-foreground">Last Contact</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-muted-foreground">Risk Level</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-muted-foreground">Receivables</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer, index) => (
                <tr 
                  key={customer.id}
                  className={`border-b border-border hover:bg-muted/30 transition-colors cursor-pointer ${
                    index % 2 === 1 ? 'bg-muted/10' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-primary">{customer.name}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-semibold text-primary">
                      ${customer.totalOutstanding.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {customer.overdueAmount > 0 ? (
                      <div className="font-semibold text-red-600">
                        ${customer.overdueAmount.toLocaleString()}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">—</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-green-700">
                      ${customer.currentAmount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {customer.lastContactDate ? (
                      <div className="text-sm">{customer.lastContactDate}</div>
                    ) : (
                      <div className="text-sm text-red-600">Never</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <RiskBadge level={customer.riskLevel} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm text-muted-foreground">
                      {customer.receivablesCount}
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
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-primary">{customer.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {customer.receivablesCount} receivables
                </p>
              </div>
              <RiskBadge level={customer.riskLevel} />
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Outstanding</span>
                <span className="font-semibold text-primary">
                  ${customer.totalOutstanding.toLocaleString()}
                </span>
              </div>
              {customer.overdueAmount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Overdue</span>
                  <span className="font-semibold text-red-600">
                    ${customer.overdueAmount.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current</span>
                <span className="text-green-700">
                  ${customer.currentAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Contact</span>
                <span className={customer.lastContactDate ? '' : 'text-red-600'}>
                  {customer.lastContactDate || 'Never'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  color: 'blue' | 'red' | 'orange' | 'green';
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-green-600'
  };

  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-semibold text-primary mb-1">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function RiskBadge({ level }: { level: 'low' | 'medium' | 'high' }) {
  const config = {
    low: { label: 'Low Risk', classes: 'bg-green-50 text-green-700' },
    medium: { label: 'Medium Risk', classes: 'bg-orange-50 text-orange-700' },
    high: { label: 'High Risk', classes: 'bg-red-50 text-red-700' }
  };

  const { label, classes } = config[level];

  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}
