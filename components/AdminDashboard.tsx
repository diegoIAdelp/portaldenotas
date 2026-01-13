
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Invoice } from '../types';
import { generateAdminSummary } from '../services/geminiService';

interface AdminDashboardProps {
  invoices: Invoice[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ invoices }) => {
  const [summary, setSummary] = useState<string>('Gerando análise financeira inteligente...');

  useEffect(() => {
    const fetchSummary = async () => {
      if (invoices.length > 0) {
        const text = await generateAdminSummary(invoices);
        setSummary(text || "Sem dados suficientes para análise.");
      } else {
        setSummary("Nenhuma nota fiscal postada até o momento.");
      }
    };
    fetchSummary();
  }, [invoices]);

  const supplierData = Object.values(
    invoices.reduce((acc: any, inv) => {
      if (!acc[inv.supplierName]) {
        acc[inv.supplierName] = { name: inv.supplierName, count: 0, totalValue: 0 };
      }
      acc[inv.supplierName].count += 1;
      acc[inv.supplierName].totalValue += (inv.value || 0);
      return acc;
    }, {})
  ).sort((a: any, b: any) => b.totalValue - a.totalValue);

  const totalValue = invoices.reduce((sum, inv) => sum + (inv.value || 0), 0);

  const stats = [
    { label: 'Valor Total Acumulado', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue), color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total de Notas', value: invoices.length, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Fornecedores Ativos', value: supplierData.length, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-lg ${stat.bg} flex items-center justify-center`}>
               <svg className={`w-6 h-6 ${stat.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Investimento por Fornecedor (R$)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={supplierData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={10} interval={0} tick={false} />
                <YAxis fontSize={12} />
                <Tooltip 
                   formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="totalValue" fill="#ef4444" radius={[4, 4, 0, 0]}>
                  {supplierData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#dc2626', '#f43f5e', '#fb7185', '#991b1b', '#e11d48'][index % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <div className="p-2 bg-red-100 rounded-lg text-red-600">
               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800">IA Financial Insights (Gemini)</h3>
          </div>
          <div className="prose prose-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
            {summary}
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100">
             <div className="flex items-center text-xs text-slate-400">
               <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               Gerado via Gemini AI
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Fixing the missing default export reported in App.tsx
export default AdminDashboard;
