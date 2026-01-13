
import React, { useState, useMemo } from 'react';
import { Invoice, UserRole, User, FilterOptions } from '../types';

interface InvoiceListProps {
  invoices: Invoice[];
  user: User;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, user }) => {
  const [filters, setFilters] = useState<FilterOptions>({
    supplierName: '',
    invoiceNumber: '',
    dateFrom: '',
    dateTo: '',
    userName: '',
  });

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(inv => {
        if (user.role !== UserRole.ADMIN && inv.uploadedBy !== user.id) {
          return false;
        }

        const matchSupplier = inv.supplierName.toLowerCase().includes(filters.supplierName.toLowerCase());
        const matchNumber = inv.invoiceNumber.includes(filters.invoiceNumber);
        const matchUser = inv.userName.toLowerCase().includes(filters.userName.toLowerCase());
        
        let matchDate = true;
        if (filters.dateFrom) matchDate = matchDate && inv.emissionDate >= filters.dateFrom;
        if (filters.dateTo) matchDate = matchDate && inv.emissionDate <= filters.dateTo;

        return matchSupplier && matchNumber && matchUser && matchDate;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [invoices, user, filters]);

  const resetFilters = () => {
    setFilters({
      supplierName: '',
      invoiceNumber: '',
      dateFrom: '',
      dateTo: '',
      userName: '',
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800">Filtros de Busca</h3>
          <button onClick={resetFilters} className="text-sm text-red-600 hover:underline">Limpar filtros</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Fornecedor..."
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
            value={filters.supplierName}
            onChange={(e) => setFilters({ ...filters, supplierName: e.target.value })}
          />
          <input
            type="text"
            placeholder="Nº da Nota..."
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
            value={filters.invoiceNumber}
            onChange={(e) => setFilters({ ...filters, invoiceNumber: e.target.value })}
          />
          {user.role === UserRole.ADMIN && (
            <input
              type="text"
              placeholder="Postado por..."
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
              value={filters.userName}
              onChange={(e) => setFilters({ ...filters, userName: e.target.value })}
            />
          )}
          <div className="flex space-x-2">
            <input
              type="date"
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
            <input
              type="date"
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Fornecedor</th>
                <th className="px-6 py-4">Nº Nota</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-6 py-4">Pedido / OS</th>
                <th className="px-6 py-4">Emissão</th>
                <th className="px-6 py-4">Data Postagem</th>
                {user.role === UserRole.ADMIN && <th className="px-6 py-4">Postado Por</th>}
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{inv.supplierName}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">{inv.fileName}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-mono">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right whitespace-nowrap">
                      {formatCurrency(inv.value || 0)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {inv.orderNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                      {formatDate(inv.emissionDate)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                      {formatDateTime(inv.createdAt)}
                    </td>
                    {user.role === UserRole.ADMIN && (
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {inv.userName}
                      </td>
                    )}
                    <td className="px-6 py-4 text-center">
                      <a
                        href={inv.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 inline-block transition-all"
                        title="Ver PDF"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={user.role === UserRole.ADMIN ? 8 : 7} className="px-6 py-20 text-center text-slate-500">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <p>Nenhuma nota encontrada.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvoiceList;
