
import React, { useState, useMemo } from 'react';
import { Invoice, UserRole, User, FilterOptions, InvoiceStatus } from '../types';

interface InvoiceListProps {
  invoices: Invoice[];
  user: User;
  onUpdateInvoice?: (invoice: Invoice) => void;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, user, onUpdateInvoice }) => {
  const [filters, setFilters] = useState<FilterOptions>({
    supplierName: '',
    invoiceNumber: '',
    dateFrom: '',
    dateTo: '',
    userName: '',
  });

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempObservation, setTempObservation] = useState('');

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

  const handleStatusChange = (invoice: Invoice, newStatus: InvoiceStatus) => {
    if (!onUpdateInvoice) return;
    onUpdateInvoice({ ...invoice, status: newStatus });
  };

  const handleSaveObservation = (invoice: Invoice) => {
    if (!onUpdateInvoice) return;
    onUpdateInvoice({ ...invoice, adminObservations: tempObservation, status: InvoiceStatus.PENDENTE });
    setEditingNoteId(null);
    setTempObservation('');
  };

  const resetFilters = () => {
    setFilters({ supplierName: '', invoiceNumber: '', dateFrom: '', dateTo: '', userName: '' });
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.RECEBIDA:
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider">Recebida</span>;
      case InvoiceStatus.PENDENTE:
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" /></svg>
          <span>Pendente</span>
        </span>;
      default:
        return <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Em Análise</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800">Filtros de Busca</h3>
          <button onClick={resetFilters} className="text-sm text-red-600 hover:underline">Limpar filtros</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <input type="text" placeholder="Fornecedor..." className="px-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500" value={filters.supplierName} onChange={e => setFilters({...filters, supplierName: e.target.value})} />
          <input type="text" placeholder="Nº da Nota..." className="px-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500" value={filters.invoiceNumber} onChange={e => setFilters({...filters, invoiceNumber: e.target.value})} />
          {user.role === UserRole.ADMIN && (
            <input type="text" placeholder="Postado por..." className="px-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500" value={filters.userName} onChange={e => setFilters({...filters, userName: e.target.value})} />
          )}
          <div className="flex space-x-2">
            <input type="date" className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm" value={filters.dateFrom} onChange={e => setFilters({...filters, dateFrom: e.target.value})} />
            <input type="date" className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm" value={filters.dateTo} onChange={e => setFilters({...filters, dateTo: e.target.value})} />
          </div>
        </div>
      </div>

      {/* Tabela de Notas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Fornecedor</th>
                <th className="px-6 py-4">Nº Nota</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-6 py-4">Emissão</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <React.Fragment key={inv.id}>
                    <tr className={`hover:bg-slate-50 transition-colors ${inv.status === InvoiceStatus.PENDENTE ? 'bg-red-50/30' : ''}`}>
                      <td className="px-6 py-4">
                        {getStatusBadge(inv.status || InvoiceStatus.EM_ANALISE)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{inv.supplierName}</div>
                        <div className="text-[10px] text-slate-400 font-mono italic">Upload por: {inv.userName}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 font-mono">{inv.invoiceNumber}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inv.value || 0)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(inv.emissionDate).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <a href={inv.pdfUrl} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Ver Arquivo">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </a>
                          
                          {user.role === UserRole.ADMIN && (
                            <div className="flex space-x-1 border-l pl-2 border-slate-200">
                              <button 
                                onClick={() => handleStatusChange(inv, InvoiceStatus.RECEBIDA)}
                                className={`p-1.5 rounded ${inv.status === InvoiceStatus.RECEBIDA ? 'bg-green-600 text-white' : 'text-green-600 hover:bg-green-50'}`}
                                title="Marcar como Recebida"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                              </button>
                              <button 
                                onClick={() => {
                                  setEditingNoteId(inv.id);
                                  setTempObservation(inv.adminObservations || '');
                                }}
                                className={`p-1.5 rounded ${inv.status === InvoiceStatus.PENDENTE ? 'bg-red-600 text-white' : 'text-red-600 hover:bg-red-50'}`}
                                title="Marcar Pendência"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                    
                    {/* Linha de Mensagem de Pendência para o Usuário */}
                    {inv.status === InvoiceStatus.PENDENTE && inv.adminObservations && (
                      <tr className="bg-red-50/50">
                        <td colSpan={6} className="px-6 py-3">
                          <div className="flex items-start space-x-3 text-red-800 text-xs">
                             <div className="bg-red-100 p-1.5 rounded-lg">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                             </div>
                             <div>
                               <p className="font-bold uppercase tracking-tight mb-0.5">Pendência Informada pela Delp:</p>
                               <p className="leading-relaxed font-medium italic">"{inv.adminObservations}"</p>
                             </div>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Editor de Observação (Apenas Admin) */}
                    {editingNoteId === inv.id && (
                      <tr className="bg-slate-100">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="flex flex-col space-y-3">
                            <label className="text-xs font-bold text-slate-700">Informe o motivo da pendência desta nota:</label>
                            <textarea 
                              className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none shadow-inner"
                              rows={2}
                              value={tempObservation}
                              placeholder="Ex: Nota fiscal ilegível ou sem assinatura do recebedor..."
                              onChange={e => setTempObservation(e.target.value)}
                            />
                            <div className="flex justify-end space-x-2">
                              <button onClick={() => setEditingNoteId(null)} className="px-3 py-1 text-xs font-bold text-slate-500">Cancelar</button>
                              <button 
                                onClick={() => handleSaveObservation(inv)}
                                className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold shadow-md"
                              >
                                Aplicar Pendência
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-500">
                    Nenhuma nota encontrada.
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
