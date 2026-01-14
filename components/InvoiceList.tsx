
import React, { useState, useMemo } from 'react';
import { Invoice, UserRole, User, FilterOptions, InvoiceStatus } from '../types';

interface InvoiceListProps {
  invoices: Invoice[];
  user: User;
  onUpdateInvoice?: (invoice: Invoice) => void;
  onDeleteInvoice?: (invoiceId: string) => void;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, user, onUpdateInvoice, onDeleteInvoice }) => {
  const [filters, setFilters] = useState<FilterOptions>({
    supplierName: '',
    invoiceNumber: '',
    dateFrom: '',
    dateTo: '',
    userName: '',
    sector: '',
  });

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempObservation, setTempObservation] = useState('');
  const [userResponse, setUserResponse] = useState('');

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(inv => {
        // SEGURANÇA: Lógica de Permissões baseada em Hierarquia
        if (user.role === UserRole.ADMIN) {
          // Admin master: acesso total
        } else if (user.role === UserRole.MANAGER) {
          // Gestor: restrito ao próprio setor (ignora filtro de setor se tentar buscar outro)
          if (inv.userSector !== user.sector) return false;
        } else {
          // Usuário Comum: restrito às próprias notas
          if (inv.uploadedBy !== user.id) return false;
        }

        const matchSupplier = inv.supplierName.toLowerCase().includes(filters.supplierName.toLowerCase());
        const matchNumber = inv.invoiceNumber.includes(filters.invoiceNumber);
        const matchUser = inv.userName.toLowerCase().includes(filters.userName.toLowerCase());
        
        // Filtro de setor só funciona para Admin (Gestor já está travado no dele)
        const matchSector = user.role === UserRole.ADMIN 
          ? inv.userSector.toLowerCase().includes(filters.sector.toLowerCase())
          : true;
        
        let matchDate = true;
        if (filters.dateFrom) matchDate = matchDate && inv.emissionDate >= filters.dateFrom;
        if (filters.dateTo) matchDate = matchDate && inv.emissionDate <= filters.dateTo;

        return matchSupplier && matchNumber && matchUser && matchDate && matchSector;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [invoices, user, filters]);

  const handleStatusChange = (invoice: Invoice, newStatus: InvoiceStatus) => {
    if (!onUpdateInvoice) return;
    onUpdateInvoice({ ...invoice, status: newStatus });
  };

  const handleDelete = (invoice: Invoice) => {
    if (!onDeleteInvoice) return;
    if (window.confirm(`ATENÇÃO: Deseja excluir permanentemente a nota ${invoice.invoiceNumber}? Esta ação não pode ser revertida.`)) {
      onDeleteInvoice(invoice.id);
    }
  };

  const exportToExcel = () => {
    // Cabeçalho atualizado conforme solicitado
    const headers = ['Status', 'Setor', 'Usuário', 'Fornecedor', 'CNPJ', 'Nº Nota', 'Emissão', 'Postagem', 'Vínculo', 'OSV/Contrato', 'Valor', 'Observações'];
    const rows = filteredInvoices.map(inv => [
      inv.status,
      inv.userSector,
      inv.userName,
      inv.supplierName,
      inv.supplierCnpj || '',
      inv.invoiceNumber,
      inv.emissionDate,
      new Date(inv.createdAt).toLocaleString('pt-BR'),
      inv.docType,
      inv.orderNumber,
      inv.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      inv.observations || ''
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RELATORIO_NOTAS_DELP_${user.sector}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`;
    link.click();
  };

  const downloadAllFilteredPDFs = () => {
    if (filteredInvoices.length > 5 && !window.confirm(`Você está prestes a baixar ${filteredInvoices.length} arquivos. Continuar?`)) return;
    
    filteredInvoices.forEach((inv, index) => {
      setTimeout(() => {
        const firstName = inv.userName.split(' ')[0].toUpperCase();
        const fileName = `${firstName}_${inv.invoiceNumber}.pdf`;
        
        const link = document.createElement('a');
        link.href = inv.pdfUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 600);
    });
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.RECEBIDA: return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase border border-green-200">Recebida</span>;
      case InvoiceStatus.PENDENTE: return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase border border-red-200">Pendente</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase border border-slate-200">Em Análise</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Gerenciamento de Documentos</h3>
            <p className="text-xs text-slate-500">Exibindo {filteredInvoices.length} notas conforme filtros aplicados.</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={exportToExcel} className="flex-1 sm:flex-none bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Exportar Excel
            </button>
            <button onClick={downloadAllFilteredPDFs} className="flex-1 sm:flex-none bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download PDFs
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Fornecedor</label>
            <input type="text" placeholder="Buscar..." className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none" value={filters.supplierName} onChange={e => setFilters({...filters, supplierName: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Nº Nota</label>
            <input type="text" placeholder="Buscar..." className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none" value={filters.invoiceNumber} onChange={e => setFilters({...filters, invoiceNumber: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Colaborador</label>
            <input type="text" placeholder="Buscar..." className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none" value={filters.userName} onChange={e => setFilters({...filters, userName: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Setor</label>
            <input 
              type="text" 
              placeholder={user.role === UserRole.ADMIN ? "Filtrar setor..." : user.sector} 
              disabled={user.role !== UserRole.ADMIN}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 disabled:text-slate-400 outline-none" 
              value={user.role === UserRole.ADMIN ? filters.sector : user.sector} 
              onChange={e => setFilters({...filters, sector: e.target.value})} 
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">De (Emissão)</label>
            <input type="date" className="w-full px-3 py-2 border rounded-lg text-sm outline-none" value={filters.dateFrom} onChange={e => setFilters({...filters, dateFrom: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Até (Emissão)</label>
            <input type="date" className="w-full px-3 py-2 border rounded-lg text-sm outline-none" value={filters.dateTo} onChange={e => setFilters({...filters, dateTo: e.target.value})} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold border-b">
              <tr>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Fornecedor / Nota</th>
                <th className="px-4 py-4">Usuário</th>
                <th className="px-4 py-4">Setor</th>
                <th className="px-4 py-4">Vínculo</th>
                <th className="px-4 py-4">OSV / OS</th>
                <th className="px-4 py-4 text-right">Valor</th>
                <th className="px-4 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length > 0 ? filteredInvoices.map((inv) => (
                <React.Fragment key={inv.id}>
                  <tr className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-4">{getStatusBadge(inv.status)}</td>
                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-900 text-xs line-clamp-1">{inv.supplierName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">NF: {inv.invoiceNumber}</div>
                    </td>
                    <td className="px-4 py-4 text-[11px] font-medium text-slate-700">{inv.userName}</td>
                    <td className="px-4 py-4">
                       <span className="text-[9px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase">{inv.userSector}</span>
                    </td>
                    <td className="px-4 py-4">
                       <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${inv.docType === 'CONTRATO' ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'bg-blue-100 text-blue-600 border border-blue-200'}`}>
                         {inv.docType}
                       </span>
                    </td>
                    <td className="px-4 py-4 text-[11px] text-slate-600 font-mono font-bold">
                      {inv.orderNumber || <span className="text-slate-300 font-normal italic">N/A</span>}
                    </td>
                    <td className="px-4 py-4 text-xs font-bold text-slate-900 text-right">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inv.value)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <a href={inv.pdfUrl} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Visualizar documento">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </a>
                        
                        {(user.role === UserRole.ADMIN || (user.role === UserRole.MANAGER && inv.userSector === user.sector) || inv.uploadedBy === user.id) && 
                         (inv.status !== InvoiceStatus.RECEBIDA) && (
                          <button onClick={() => handleDelete(inv)} className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Excluir (Erro de postagem)">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}

                        {user.role === UserRole.ADMIN && (
                          <div className="flex space-x-1 border-l pl-2 border-slate-200">
                             <button onClick={() => handleStatusChange(inv, InvoiceStatus.RECEBIDA)} className="p-1.5 text-green-600 hover:bg-green-600 hover:text-white rounded transition-all" title="Confirmar Recebimento"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg></button>
                             <button onClick={() => { setEditingNoteId(inv.id); setTempObservation(inv.adminObservations || ''); }} className="p-1.5 text-red-600 hover:bg-red-600 hover:text-white rounded transition-all" title="Apontar Pendência"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              )) : (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-400 italic text-sm">Nenhuma nota fiscal encontrada com os filtros atuais.</td>
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
