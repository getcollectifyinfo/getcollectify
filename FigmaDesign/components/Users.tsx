import React, { useState } from 'react';
import { 
  Plus, 
  Upload, 
  Search,
  Shield,
  User
} from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'collector';
  manager: string | null;
  status: 'active' | 'inactive';
  teamSize?: number;
}

export function Users() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'manager' | 'collector'>('all');

  const users: UserData[] = [
    {
      id: '1',
      name: 'Robert Chen',
      email: 'robert.chen@company.com',
      role: 'admin',
      manager: null,
      status: 'active',
      teamSize: 12
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
      role: 'manager',
      manager: 'Robert Chen',
      status: 'active',
      teamSize: 4
    },
    {
      id: '3',
      name: 'Michael Chen',
      email: 'michael.chen@company.com',
      role: 'manager',
      manager: 'Robert Chen',
      status: 'active',
      teamSize: 3
    },
    {
      id: '4',
      name: 'David Martinez',
      email: 'david.martinez@company.com',
      role: 'collector',
      manager: 'Sarah Johnson',
      status: 'active'
    },
    {
      id: '5',
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@company.com',
      role: 'collector',
      manager: 'Sarah Johnson',
      status: 'active'
    },
    {
      id: '6',
      name: 'James Wilson',
      email: 'james.wilson@company.com',
      role: 'collector',
      manager: 'Sarah Johnson',
      status: 'active'
    },
    {
      id: '7',
      name: 'Lisa Anderson',
      email: 'lisa.anderson@company.com',
      role: 'collector',
      manager: 'Michael Chen',
      status: 'active'
    },
    {
      id: '8',
      name: 'John Smith',
      email: 'john.smith@company.com',
      role: 'collector',
      manager: 'Michael Chen',
      status: 'inactive'
    }
  ];

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-primary">Users</h1>
          <p className="text-muted-foreground mt-1">Manage team members and permissions</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-lg hover:bg-muted transition-colors">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Bulk Add</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg border border-transparent focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setFilterRole('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterRole === 'all' 
                  ? 'bg-primary text-white' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              All
            </button>
            <button 
              onClick={() => setFilterRole('admin')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterRole === 'admin' 
                  ? 'bg-primary text-white' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Admin
            </button>
            <button 
              onClick={() => setFilterRole('manager')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterRole === 'manager' 
                  ? 'bg-primary text-white' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Manager
            </button>
            <button 
              onClick={() => setFilterRole('collector')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterRole === 'collector' 
                  ? 'bg-primary text-white' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Collector
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
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">User</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Role</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Manager</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-muted-foreground">Team Size</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr 
                  key={user.id}
                  className={`border-b border-border hover:bg-muted/30 transition-colors ${
                    index % 2 === 1 ? 'bg-muted/10' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-medium text-primary">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-6 py-4">
                    {user.manager ? (
                      <div className="text-sm text-muted-foreground">{user.manager}</div>
                    ) : (
                      <div className="text-sm text-muted-foreground">—</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {user.teamSize !== undefined ? (
                      <div className="text-sm font-medium text-primary">{user.teamSize}</div>
                    ) : (
                      <div className="text-sm text-muted-foreground">—</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                      user.status === 'active'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-50 text-gray-700'
                    }`}>
                      {user.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <div className="font-medium text-primary">{user.name}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                user.status === 'active'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-gray-50 text-gray-700'
              }`}>
                {user.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Role</span>
                <RoleBadge role={user.role} />
              </div>
              {user.manager && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Manager</span>
                  <span className="text-sm">{user.manager}</span>
                </div>
              )}
              {user.teamSize !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Team Size</span>
                  <span className="text-sm font-medium">{user.teamSize}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Hierarchy Visualization - Desktop Only */}
      <div className="hidden lg:block bg-white rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-primary mb-6">Team Hierarchy</h3>
        <div className="space-y-6">
          {/* Admin Level */}
          {users.filter(u => u.role === 'admin').map(admin => (
            <div key={admin.id} className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-semibold text-primary">{admin.name}</div>
                  <div className="text-sm text-muted-foreground">Administrator</div>
                </div>
              </div>

              {/* Managers under this admin */}
              <div className="ml-8 space-y-4">
                {users.filter(u => u.role === 'manager' && u.manager === admin.name).map(manager => (
                  <div key={manager.id} className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <User className="w-5 h-5 text-green-600" />
                      <div className="flex-1">
                        <div className="font-medium text-primary">{manager.name}</div>
                        <div className="text-sm text-muted-foreground">Manager · {manager.teamSize} team members</div>
                      </div>
                    </div>

                    {/* Collectors under this manager */}
                    <div className="ml-8 space-y-2">
                      {users.filter(u => u.role === 'collector' && u.manager === manager.name).map(collector => (
                        <div key={collector.id} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                            {collector.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-primary">{collector.name}</div>
                            <div className="text-xs text-muted-foreground">Collector</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: 'admin' | 'manager' | 'collector' }) {
  const config = {
    admin: { label: 'Administrator', classes: 'bg-blue-50 text-blue-700' },
    manager: { label: 'Manager', classes: 'bg-green-50 text-green-700' },
    collector: { label: 'Collector', classes: 'bg-purple-50 text-purple-700' }
  };

  const { label, classes } = config[role];

  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}
