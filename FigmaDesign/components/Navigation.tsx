import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Users, 
  Calendar, 
  UserCog, 
  Settings 
} from 'lucide-react';

interface NavigationProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
}

export function Sidebar({ activeScreen, onNavigate }: NavigationProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'receivables', label: 'Receivables', icon: Receipt },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'users', label: 'Users', icon: UserCog },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-border h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-semibold text-primary">CollectPro</h1>
        <p className="text-sm text-muted-foreground mt-1">Receivables Management</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                ${isActive 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export function BottomNav({ activeScreen, onNavigate }: NavigationProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'receivables', label: 'Receivables', icon: Receipt },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px]
                ${isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
