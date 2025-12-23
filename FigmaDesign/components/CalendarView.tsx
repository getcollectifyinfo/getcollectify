import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface PaymentPromise {
  id: string;
  customer: string;
  amount: number;
  currency: string;
  date: string;
  status: 'pending' | 'confirmed' | 'missed';
}

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');

  const promises: PaymentPromise[] = [
    { id: '1', customer: 'Acme Corporation', amount: 125000, currency: 'USD', date: '2024-12-23', status: 'confirmed' },
    { id: '2', customer: 'TechStart Inc.', amount: 87500, currency: 'USD', date: '2024-12-24', status: 'pending' },
    { id: '3', customer: 'Metro Systems', amount: 42000, currency: 'USD', date: '2024-12-26', status: 'confirmed' },
    { id: '4', customer: 'Global Industries', amount: 215000, currency: 'EUR', date: '2024-12-28', status: 'pending' },
    { id: '5', customer: 'Phoenix Trading', amount: 156000, currency: 'GBP', date: '2024-12-30', status: 'pending' },
    { id: '6', customer: 'Summit Enterprises', amount: 45000, currency: 'USD', date: '2025-01-02', status: 'pending' }
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days in month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const weekDay = new Date(startOfWeek);
      weekDay.setDate(startOfWeek.getDate() + i);
      days.push(weekDay);
    }

    return days;
  };

  const getPromisesForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return promises.filter(p => p.date === dateStr);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-primary">Payment Calendar</h1>
          <p className="text-muted-foreground mt-1">Track payment promises and commitments</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Add Promise</span>
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => view === 'month' ? navigateMonth('prev') : navigateWeek('prev')}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-primary min-w-[200px] text-center">
              {formatDate(currentDate)}
            </h2>
            <button
              onClick={() => view === 'month' ? navigateMonth('next') : navigateWeek('next')}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                view === 'week' 
                  ? 'bg-primary text-white' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                view === 'month' 
                  ? 'bg-primary text-white' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      {view === 'month' ? (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          {/* Desktop Calendar */}
          <div className="hidden md:block">
            <div className="grid grid-cols-7 border-b border-border">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="px-4 py-3 text-center text-sm font-medium text-muted-foreground bg-muted/50">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {getDaysInMonth(currentDate).map((date, index) => {
                const dayPromises = getPromisesForDate(date);
                return (
                  <div
                    key={index}
                    className={`min-h-[120px] border-r border-b border-border p-2 ${
                      !date ? 'bg-muted/20' : 'hover:bg-muted/30 transition-colors'
                    }`}
                  >
                    {date && (
                      <>
                        <div className={`text-sm mb-2 ${
                          isToday(date) 
                            ? 'w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center font-semibold' 
                            : 'text-muted-foreground'
                        }`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayPromises.map(promise => (
                            <div
                              key={promise.id}
                              className={`text-xs p-1.5 rounded cursor-pointer ${
                                promise.status === 'confirmed' 
                                  ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                  : promise.status === 'missed'
                                  ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                              }`}
                            >
                              <div className="font-medium truncate">{promise.customer}</div>
                              <div className="truncate">{promise.currency} {promise.amount.toLocaleString()}</div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile Calendar - Simplified */}
          <div className="md:hidden p-4 space-y-2">
            {getDaysInMonth(currentDate).filter(date => date !== null).map((date) => {
              const dayPromises = getPromisesForDate(date);
              if (dayPromises.length === 0) return null;
              
              return (
                <div key={date!.toISOString()} className="border border-border rounded-lg p-3">
                  <div className="font-medium text-primary mb-2">
                    {date!.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="space-y-2">
                    {dayPromises.map(promise => (
                      <div
                        key={promise.id}
                        className={`p-2 rounded ${
                          promise.status === 'confirmed' 
                            ? 'bg-green-50'
                            : promise.status === 'missed'
                            ? 'bg-red-50'
                            : 'bg-blue-50'
                        }`}
                      >
                        <div className="font-medium text-sm">{promise.customer}</div>
                        <div className="text-sm">{promise.currency} {promise.amount.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Week View */
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <div className="grid grid-cols-7 min-w-[700px]">
              {getWeekDays(currentDate).map((date) => {
                const dayPromises = getPromisesForDate(date);
                return (
                  <div
                    key={date.toISOString()}
                    className="border-r border-b border-border"
                  >
                    <div className={`p-3 border-b border-border text-center ${
                      isToday(date) ? 'bg-primary/10' : 'bg-muted/50'
                    }`}>
                      <div className="text-xs text-muted-foreground">
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className={`text-lg font-semibold mt-1 ${
                        isToday(date) 
                          ? 'w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mx-auto' 
                          : 'text-primary'
                      }`}>
                        {date.getDate()}
                      </div>
                    </div>
                    <div className="p-2 space-y-2 min-h-[400px]">
                      {dayPromises.map(promise => (
                        <div
                          key={promise.id}
                          className={`p-2 rounded text-sm cursor-pointer ${
                            promise.status === 'confirmed' 
                              ? 'bg-green-50 text-green-700 hover:bg-green-100'
                              : promise.status === 'missed'
                              ? 'bg-red-50 text-red-700 hover:bg-red-100'
                              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                          }`}
                        >
                          <div className="font-medium">{promise.customer}</div>
                          <div className="text-xs mt-1">{promise.currency} {promise.amount.toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
