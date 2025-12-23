import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertCircle,
  Clock,
  UserX,
  Award,
  Activity
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export function Dashboard() {
  // Mock data
  const agingData = [
    { name: '0-30 days', value: 125000 },
    { name: '31-60 days', value: 85000 },
    { name: '61-90 days', value: 45000 },
    { name: '90+ days', value: 32000 }
  ];

  const weeklyCollections = [
    { day: 'Mon', amount: 45000 },
    { day: 'Tue', amount: 52000 },
    { day: 'Wed', amount: 38000 },
    { day: 'Thu', amount: 61000 },
    { day: 'Fri', amount: 55000 },
    { day: 'Sat', amount: 12000 },
    { day: 'Sun', amount: 8000 }
  ];

  const monthlyTrend = [
    { month: 'Jul', collections: 820000, target: 850000 },
    { month: 'Aug', collections: 905000, target: 900000 },
    { month: 'Sep', collections: 1050000, target: 950000 },
    { month: 'Oct', collections: 980000, target: 1000000 },
    { month: 'Nov', collections: 1120000, target: 1050000 },
    { month: 'Dec', collections: 950000, target: 1100000 }
  ];

  const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#dc2626'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-primary">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your receivables and collections</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Receivables"
          value="$2,847,500"
          change="+12.5%"
          trend="up"
          icon={DollarSign}
        />
        <MetricCard
          title="Overdue Receivables"
          value="$287,000"
          change="-8.2%"
          trend="down"
          icon={AlertCircle}
          alert
        />
        <MetricCard
          title="Collection Rate"
          value="94.2%"
          change="+3.1%"
          trend="up"
          icon={TrendingUp}
        />
        <MetricCard
          title="Avg. Days Outstanding"
          value="38 days"
          change="-5 days"
          trend="down"
          icon={Clock}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aging Analysis */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-primary mb-4">Overdue Aging Buckets</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={agingData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {agingData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Collections */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-primary mb-4">Weekly Collections</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyCollections}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#64748b" />
              <YAxis stroke="#64748b" tickFormatter={(value) => `$${value / 1000}k`} />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Bar dataKey="amount" fill="#1e293b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-primary mb-4">Monthly Collections Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#64748b" />
            <YAxis stroke="#64748b" tickFormatter={(value) => `$${value / 1000}k`} />
            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="collections" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Collections"
            />
            <Line 
              type="monotone" 
              dataKey="target" 
              stroke="#64748b" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Target"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <InsightCard
          icon={Clock}
          title="Oldest Overdue"
          value="156 days"
          subtitle="Acme Corp - $45,000"
          color="red"
        />
        <InsightCard
          icon={UserX}
          title="Never Contacted"
          value="12 customers"
          subtitle="Total outstanding: $180,000"
          color="orange"
        />
        <InsightCard
          icon={Award}
          title="Top Performer"
          value="Sarah Johnson"
          subtitle="$820k collected this month"
          color="green"
        />
        <InsightCard
          icon={Activity}
          title="Activity Rate"
          value="87%"
          subtitle="Contacts made this week"
          color="blue"
        />
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ElementType;
  alert?: boolean;
}

function MetricCard({ title, value, change, trend, icon: Icon, alert }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl border border-border p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-2">{title}</p>
          <p className="text-3xl font-semibold text-primary mb-2">{value}</p>
          <div className={`flex items-center gap-1 text-sm ${
            alert
              ? trend === 'down' ? 'text-green-600' : 'text-red-600'
              : trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{change} vs last month</span>
          </div>
        </div>
        <div className={`p-3 rounded-lg ${alert ? 'bg-red-50' : 'bg-blue-50'}`}>
          <Icon className={`w-6 h-6 ${alert ? 'text-red-600' : 'text-blue-600'}`} />
        </div>
      </div>
    </div>
  );
}

interface InsightCardProps {
  icon: React.ElementType;
  title: string;
  value: string;
  subtitle: string;
  color: 'red' | 'orange' | 'green' | 'blue';
}

function InsightCard({ icon: Icon, title, value, subtitle, color }: InsightCardProps) {
  const colorClasses = {
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600'
  };

  return (
    <div className="bg-white rounded-xl border border-border p-5 hover:shadow-lg transition-shadow">
      <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-sm text-muted-foreground mb-1">{title}</p>
      <p className="text-xl font-semibold text-primary mb-1">{value}</p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}
