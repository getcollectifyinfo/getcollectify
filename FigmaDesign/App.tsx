import React, { useState } from 'react';
import { Sidebar, BottomNav } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { Receivables } from './components/Receivables';
import { Customers } from './components/Customers';
import { CalendarView } from './components/CalendarView';
import { Users } from './components/Users';
import { Settings } from './components/Settings';

export default function App() {
  const [activeScreen, setActiveScreen] = useState('dashboard');

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return <Dashboard />;
      case 'receivables':
        return <Receivables />;
      case 'customers':
        return <Customers />;
      case 'calendar':
        return <CalendarView />;
      case 'users':
        return <Users />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Sidebar - Desktop */}
      <Sidebar activeScreen={activeScreen} onNavigate={setActiveScreen} />
      
      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pb-20 lg:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {renderScreen()}
        </div>
      </main>

      {/* Bottom Navigation - Mobile */}
      <BottomNav activeScreen={activeScreen} onNavigate={setActiveScreen} />
    </div>
  );
}
