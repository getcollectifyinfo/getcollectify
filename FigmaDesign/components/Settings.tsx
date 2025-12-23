import React, { useState } from 'react';
import { 
  Building2, 
  DollarSign, 
  FileText,
  Shield,
  Save
} from 'lucide-react';

export function Settings() {
  const [companyName, setCompanyName] = useState('Enterprise Solutions Inc.');
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [supportedCurrencies, setSupportedCurrencies] = useState(['USD', 'EUR', 'GBP']);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-primary">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage company configuration and preferences</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {/* Company Profile */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-primary">Company Profile</h2>
            <p className="text-sm text-muted-foreground">Basic company information</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-2 bg-muted rounded-lg border border-transparent focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Tax ID
              </label>
              <input
                type="text"
                placeholder="XX-XXXXXXX"
                className="w-full px-4 py-2 bg-muted rounded-lg border border-transparent focus:border-primary focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Country
              </label>
              <select className="w-full px-4 py-2 bg-muted rounded-lg border border-transparent focus:border-primary focus:outline-none transition-colors">
                <option>United States</option>
                <option>United Kingdom</option>
                <option>Canada</option>
                <option>Australia</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Address
            </label>
            <textarea
              rows={3}
              placeholder="Enter company address..."
              className="w-full px-4 py-2 bg-muted rounded-lg border border-transparent focus:border-primary focus:outline-none transition-colors resize-none"
            />
          </div>
        </div>
      </div>

      {/* Currency Settings */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-primary">Currency Settings</h2>
            <p className="text-sm text-muted-foreground">Configure base and supported currencies</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Base Currency
            </label>
            <select 
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value)}
              className="w-full px-4 py-2 bg-muted rounded-lg border border-transparent focus:border-primary focus:outline-none transition-colors"
            >
              <option value="USD">USD - United States Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="JPY">JPY - Japanese Yen</option>
              <option value="CAD">CAD - Canadian Dollar</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-3">
              Supported Currencies
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'].map(currency => (
                <label key={currency} className="flex items-center gap-2 p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors">
                  <input
                    type="checkbox"
                    checked={supportedCurrencies.includes(currency)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSupportedCurrencies([...supportedCurrencies, currency]);
                      } else {
                        setSupportedCurrencies(supportedCurrencies.filter(c => c !== currency));
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm">{currency}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Receivable Types */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
            <FileText className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-primary">Receivable Types</h2>
            <p className="text-sm text-muted-foreground">Define types of receivables your company manages</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { id: 'invoice', label: 'Invoice', description: 'Standard customer invoices' },
            { id: 'check', label: 'Check', description: 'Post-dated checks' },
            { id: 'promissory', label: 'Promissory Note', description: 'Written promises of payment' },
            { id: 'installment', label: 'Installment', description: 'Payment plans and installments' }
          ].map(type => (
            <label key={type.id} className="flex items-start gap-3 p-4 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors">
              <input
                type="checkbox"
                defaultChecked={type.id !== 'installment'}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
              />
              <div className="flex-1">
                <div className="font-medium text-primary">{type.label}</div>
                <div className="text-sm text-muted-foreground">{type.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Roles & Permissions */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
            <Shield className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-primary">Roles & Permissions</h2>
            <p className="text-sm text-muted-foreground">Configure user roles and access levels</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Administrator */}
          <div className="border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-primary">Administrator</h4>
                <p className="text-sm text-muted-foreground">Full system access</p>
              </div>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                Full Access
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span>Manage users</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span>Configure settings</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span>View all receivables</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span>Generate reports</span>
              </div>
            </div>
          </div>

          {/* Manager */}
          <div className="border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-primary">Manager</h4>
                <p className="text-sm text-muted-foreground">Team and receivables management</p>
              </div>
              <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                Team Access
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span>Manage team</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span>View team receivables</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span>Add receivables</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span>Configure settings</span>
              </div>
            </div>
          </div>

          {/* Collector */}
          <div className="border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-primary">Collector</h4>
                <p className="text-sm text-muted-foreground">Basic collection operations</p>
              </div>
              <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                Limited Access
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span>View assigned</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span>Add notes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span>Log contacts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span>Delete receivables</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-primary">Notification Preferences</h2>
          <p className="text-sm text-muted-foreground mt-1">Configure when you want to receive notifications</p>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Payment promises due today', defaultChecked: true },
            { label: 'New overdue receivables', defaultChecked: true },
            { label: 'Weekly collection summary', defaultChecked: true },
            { label: 'Monthly reports', defaultChecked: false }
          ].map((notification, index) => (
            <label key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors">
              <span className="text-sm text-primary">{notification.label}</span>
              <input
                type="checkbox"
                defaultChecked={notification.defaultChecked}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
