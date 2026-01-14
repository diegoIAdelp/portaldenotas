
import React, { useState, useMemo } from 'react';
import { Invoice, UserRole, User, FilterOptions, InvoiceStatus } from '../types';

interface InvoiceListProps {
  invoices: Invoice[];
  user: User;
  onUpdateInvoice?: (invoice: Invoice) => void;
  onDeleteInvoice?: (invoiceId: string) => void;
  onEditInvoice?: (invoice: Invoice) => void;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, user, onUpdateInvoice, onDeleteInvoice, onEditInvoice }) => {
  const [filters, setFilters] = useState<FilterOptions>({
    supplierName: '',
    invoiceNumber: '',
    dateFrom: '',
    dateTo: '',
    postDateFrom: '',
    postDateTo: '',
    userName: '',
    sector: '',
  });

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempObservation, setTempObservation] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [notifyManager, setNotifyManager] = useState(false);

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(inv => {
        if (user.role === UserRole.ADMIN) {
          // Admin master: acesso total
        } else if (user.role === UserRole.MANAGER) {
          if (inv.userSector !== user.sector) return false;
        } else {
          if (inv.uploadedBy !== user.id) return false;
        }

        const matchSupplier = inv.supplierName.toLowerCase().includes(filters.supplierName.toLowerCase());
        const matchNumber = inv.invoiceNumber.includes(filters.invoiceNumber);
        const matchUser = inv.userName.toLowerCase().includes(filters.userName.toLowerCase());
        
        const matchSector = user.role === UserRole.ADMIN 
          ? inv.userSector.toLowerCase().includes(filters.sector.toLowerCase())
          : true;
        
        let matchDate = true;
        if (filters.dateFrom) matchDate = matchDate && inv.emissionDate >= filters.dateFrom;
        if (filters.dateTo) matchDate = matchDate && inv.emissionDate <= filters.dateTo;

        let matchPostDate = true;
        const postDate = inv.createdAt.split('T')[0];
        if (filters.postDateFrom) matchPostDate = matchPostDate && postDate >= filters.postDateFrom;
        if (filters.postDateTo) matchPostDate = matchPostDate && postDate <= filters.postDateTo;

        return matchSupplier && matchNumber && matchUser && matchDate && matchSector && matchPostDate;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [invoices, user, filters]);

  const handleStatusChange = (invoice: Invoice, newStatus: InvoiceStatus) => {
    if (!onUpdateInvoice) return;
    onUpdateInvoice({ ...invoice, status: newStatus });
  };

  const handleSavePendency = () => {
    if (!editingNoteId || !onUpdateInvoice) return;
    const invoice = invoices.find(i => i.id === editingNoteId);
    if (invoice) {
      onUpdateInvoice({ 
        ...invoice, 
        status: InvoiceStatus.PENDENTE, 
        adminObservations: tempObservation,
        managerNotifiedEmail: notifyManager ? managerEmail : undefined
      });
      
      if (notifyManager) {
        alert(`Sucesso: A pendência foi salva e o gestor (${managerEmail}) foi informado.`);
      }

      setEditingNoteId(null);
      setTempObservation('');
      setManagerEmail('');
      setNotifyManager(false);
    }
  };

  const handleDelete = (invoice: Invoice) => {
    if (!onDeleteInvoice) return;
    if (window.confirm(`Tem certeza que deseja excluir a nota ${invoice.invoiceNumber}?`)) {
      onDeleteInvoice(invoice.id);
    }
  };

  const downloadAllPDFs = () => {
    if (filteredInvoices.length === 0) return alert("Nenhuma nota para baixar.");
    filteredInvoices.forEach((inv, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = inv.pdfUrl;
        link.download = `NOTA_${inv.invoiceNumber}_${inv.supplierName.substring(0,10).toUpperCase()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 500);
    });
  };

  const exportToExcel = () => {
    const headers = ['Status', 'Setor', 'Colaborador', 'Fornecedor', 'Nº Nota', 'Emissão', 'Postagem', 'Vínculo', 'OS/OSV', 'Valor', 'Obs Admin', 'E-mail Gestor'];
    const rows = filteredInvoices.map(inv => [
      inv.status,
      inv.userSector,
      inv.userName,
      inv.supplierName,
      inv.invoiceNumber,
      inv.emissionDate,
      new Date(inv.createdAt).toLocaleString('pt-BR'),
      inv.docType,
      inv.orderNumber || '',
      inv.value.toFixed(2),
      inv.adminObservations || '',
      inv.managerNotifiedEmail || ''
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `RELATORIO_NOTAS_DELP_${new Date().getTime()}.csv`;
    link.click();
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.RECEBIDA: return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase border border-green-200">Recebida</span>;
      case InvoiceStatus.PENDENTE: return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase border border-red-200 animate-pulse">Pendência</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase border border-slate-200">Em Análise</span>;
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* MODAL DE PENDÊNCIA (ADMIN) */}
      {editingNoteId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200 border border-red-100">
            <div className="p-6 bg-red-600 text-white flex justify-between items-center">
              <div>
                <h4 className="font-black uppercase text-sm tracking-widest">Apontar Pendência</h4>
                <p className="text-[10px] opacity-80 font-bold uppercase mt-1">Nota: {invoices.find(i=>i.id===editingNoteId)?.invoiceNumber}</p>
              </div>
              <button onClick={() => setEditingNoteId(null)} className="hover:rotate-90 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l18 18" /></svg>
              </button>
            </div>
            <div className="p-8 space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Motivo da Pendência</p>
                <textarea 
                  className="w-full h-28 p-4 border-2 border-slate-100 rounded-2xl focus:border-red-500 outline-none transition-all text-sm font-medium bg-slate-50"
                  placeholder="Explique o que deve ser corrigido pelo colaborador..."
                  value={tempObservation}
                  onChange={e => setTempObservation(e.target.value)}
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                    checked={notifyManager}
                    onChange={e => setNotifyManager(e.target.checked)}
                  />
                  <span className="text-xs font-bold text-slate-700 uppercase">Notificar Gestor do Setor por E-mail</span>
                </label>

                {notifyManager && (
                  <div className="animate-in slide-in-from-top-2 duration-200">
                    <input 
                      type="email" 
                      placeholder="E-mail corporativo do gestor..."
                      className="w-full px-4 py-3 border-2 border-white rounded-xl text-sm font-bold focus:border-red-500 outline-none transition-all"
                      value={managerEmail}
                      onChange={e => setManagerEmail(e.target.value)}
                    />
                    <p className="text-[9px] text-slate-400 mt-1 ml-1 uppercase font-bold">* O sistema registrará o envio da cópia ao gestor.</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setEditingNoteId(null)} className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all uppercase text-xs">Cancelar</button>
                <button 
                  onClick={handleSavePendency}
                  disabled={!tempObservation.trim() || (notifyManager && !managerEmail.includes('@'))}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 disabled:opacity-50 transition-all uppercase text-xs"
                >
                  Confirmar e Notificar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Gerenciador de Notas Fiscais</h3>
            <p className="text-xs text-slate-500 font-medium tracking-tight">Monitoramento e conferência de documentos recebidos.</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={downloadAllPDFs} className="flex-1 sm:flex-none bg-slate-800 text-white px-4 py-2.5 rounded-lg text-[11px] font-bold hover:bg-slate-900 transition-all uppercase tracking-tighter shadow-sm">
              Baixar Documentos
            </button>
            <button onClick={exportToExcel} className="flex-1 sm:flex-none bg-green-600 text-white px-4 py-2.5 rounded-lg text-[11px] font-bold hover:bg-green-700 transition-all uppercase tracking-tighter shadow-sm">
              Extrair Excel
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Fornecedor</label>
            <input type="text" placeholder="Pesquisar..." className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none" value={filters.supplierName} onChange={e => setFilters({...filters, supplierName: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Nº Nota</label>
            <input type="text" placeholder="Pesquisar..." className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none" value={filters.invoiceNumber} onChange={e => setFilters({...filters, invoiceNumber: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Colaborador</label>
            <input type="text" placeholder="Pesquisar..." className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none" value={filters.userName} onChange={e => setFilters({...filters, userName: e.target.value})} />
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
            <label className="text-[10px] font-bold text-slate-400 uppercase">Emissão De</label>
            <input type="date" className="w-full px-3 py-2 border rounded-lg text-sm outline-none" value={filters.dateFrom} onChange={e => setFilters({...filters, dateFrom: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Emissão Até</label>
            <input type="date" className="w-full px-3 py-2 border rounded-lg text-sm outline-none" value={filters.dateTo} onChange={e => setFilters({...filters, dateTo: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-red-600 uppercase">Postagem De</label>
            <input type="date" className="w-full px-3 py-2 border border-red-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500" value={filters.postDateFrom} onChange={e => setFilters({...filters, postDateFrom: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-red-600 uppercase">Postagem Até</label>
            <input type="date" className="w-full px-3 py-2 border border-red-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500" value={filters.postDateTo} onChange={e => setFilters({...filters, postDateTo: e.target.value})} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold border-b">
              <tr>
                <th className="px-4 py-4">Status / Detalhes</th>
                <th className="px-4 py-4">Fornecedor</th>
                <th className="px-4 py-4">Colaborador</th>
                <th className="px-4 py-4">Setor</th>
                <th className="px-4 py-4">Vínculo</th>
                <th className="px-4 py-4">Emissão</th>
                <th className="px-4 py-4">Postagem</th>
                <th className="px-4 py-4 text-right">Valor</th>
                <th className="px-4 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length > 0 ? filteredInvoices.map((inv) => (
                <tr key={inv.id} className={`hover:bg-slate-50 transition-colors ${inv.status === InvoiceStatus.PENDENTE ? 'bg-red-50/40' : ''}`}>
                  <td className="px-4 py-4">
                    <div className="space-y-1.5">
                      {getStatusBadge(inv.status)}
                      {inv.status === InvoiceStatus.PENDENTE && inv.adminObservations && (
                        <div className="space-y-1">
                           <div className="text-[10px] font-black text-red-600 uppercase bg-white border border-red-100 p-2 rounded shadow-sm max-w-[220px] leading-tight">
                              PENDÊNCIA: {inv.adminObservations}
                           </div>
                           {inv.managerNotifiedEmail && (
                             <div className="flex items-center gap-1 text-[9px] text-slate-500 font-bold uppercase">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                Gestor: {inv.managerNotifiedEmail}
                             </div>
                           )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-900 text-xs">{inv.supplierName}</div>
                    <div className="text-[9px] text-slate-400 font-mono">NF: {inv.invoiceNumber}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-[11px] font-bold text-slate-700">{inv.userName}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-[9px] text-red-600 uppercase font-black">{inv.userSector}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase border ${inv.docType === 'CONTRATO' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                      {inv.docType} {inv.orderNumber && `- ${inv.orderNumber}`}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-[10px] font-medium text-slate-600 whitespace-nowrap">
                    {inv.emissionDate.split('-').reverse().join('/')}
                  </td>
                  <td className="px-4 py-4 text-[10px] font-medium text-slate-400 whitespace-nowrap">
                    <div className="font-bold text-slate-700">{new Date(inv.createdAt).toLocaleDateString('pt-BR')}</div>
                    <div>{new Date(inv.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</div>
                  </td>
                  <td className="px-4 py-4 text-xs font-black text-slate-900 text-right">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inv.value)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <a href={inv.pdfUrl} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Visualizar documento">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </a>
                      
                      {/* CONTROLE DE STATUS (EXCLUSIVO ADMIN) - Permite trocar em qualquer estado */}
                      {user.role === UserRole.ADMIN && (
                        <div className="flex space-x-1 border-l pl-2 border-slate-200">
                           {inv.status !== InvoiceStatus.RECEBIDA && (
                             <button onClick={() => handleStatusChange(inv, InvoiceStatus.RECEBIDA)} className="p-1.5 text-green-600 hover:bg-green-600 hover:text-white rounded transition-all" title="Marcar como Recebida">
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                             </button>
                           )}
                           {inv.status !== InvoiceStatus.PENDENTE && (
                             <button onClick={() => { setEditingNoteId(inv.id); setTempObservation(inv.adminObservations || ''); }} className="p-1.5 text-red-600 hover:bg-red-600 hover:text-white rounded transition-all" title="Apontar Pendência">
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                             </button>
                           )}
                           {inv.status !== InvoiceStatus.EM_ANALISE && (
                             <button onClick={() => handleStatusChange(inv, InvoiceStatus.EM_ANALISE)} className="p-1.5 text-slate-500 hover:bg-slate-500 hover:text-white rounded transition-all" title="Voltar para Análise">
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                             </button>
                           )}
                        </div>
                      )}

                      {/* EDIÇÃO FORMULÁRIO: Admin sempre pode; Usuário apenas se não estiver RECEBIDA */}
                      {((user.role === UserRole.ADMIN) || (inv.uploadedBy === user.id && inv.status !== InvoiceStatus.RECEBIDA)) && onEditInvoice && (
                        <button onClick={() => onEditInvoice(inv)} className="p-1.5 bg-slate-100 text-slate-700 hover:bg-red-600 hover:text-white rounded-lg transition-all" title="Editar Informações">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                      )}

                      {(user.role === UserRole.ADMIN || (inv.uploadedBy === user.id && inv.status !== InvoiceStatus.RECEBIDA)) && (
                        <button onClick={() => handleDelete(inv)} className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Excluir Registro">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400 italic text-sm">Nenhum registro encontrado com os filtros atuais.</td>
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
