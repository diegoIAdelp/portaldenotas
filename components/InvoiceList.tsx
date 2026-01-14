
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
  });

  // Estado para edição (Admin ou Repostagem de Usuário)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempObservation, setTempObservation] = useState('');
  const [extraEmail, setExtraEmail] = useState('');
  const [userResponse, setUserResponse] = useState('');

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

  const handleDelete = (invoice: Invoice) => {
    if (!onDeleteInvoice) return;
    if (window.confirm(`Tem certeza que deseja excluir a nota ${invoice.invoiceNumber} do fornecedor ${invoice.supplierName}? Esta ação não pode ser desfeita.`)) {
      onDeleteInvoice(invoice.id);
    }
  };

  // Lógica do Admin para aplicar pendência
  const handleApplyPendency = (invoice: Invoice, sendEmail: boolean = false) => {
    if (!onUpdateInvoice) return;
    
    const updatedInvoice = { 
      ...invoice, 
      adminObservations: tempObservation, 
      status: InvoiceStatus.PENDENTE,
      userResponse: '' // Limpa resposta anterior se houver nova pendência
    };
    
    onUpdateInvoice(updatedInvoice);

    if (sendEmail) {
      const savedUsers = JSON.parse(localStorage.getItem('noteflow_users') || '[]');
      const author = savedUsers.find((u: User) => u.id === invoice.uploadedBy);
      const targetEmail = author?.email || '';
      
      const recipients = [targetEmail, extraEmail].filter(e => e.trim() !== '').join(',');
      const subject = encodeURIComponent(`PENDÊNCIA: Nota Fiscal ${invoice.invoiceNumber} - ${invoice.supplierName}`);
      const body = encodeURIComponent(
        `Olá,\n\nIdentificamos uma pendência na nota fiscal postada no Portal Delp:\n\n` +
        `Fornecedor: ${invoice.supplierName}\n` +
        `Nº Nota: ${invoice.invoiceNumber}\n` +
        `Motivo da Pendência: ${tempObservation}\n\n` +
        `Por favor, acesse o portal e realize as correções necessárias.\n\n` +
        `Atenciosamente,\nEquipe Delp`
      );
      
      window.location.href = `mailto:${recipients}?subject=${subject}&body=${body}`;
    }

    setEditingNoteId(null);
    setTempObservation('');
    setExtraEmail('');
  };

  // Lógica do Usuário para Repostar
  const handleRepost = (invoice: Invoice) => {
    if (!onUpdateInvoice) return;

    const updatedInvoice = {
      ...invoice,
      status: InvoiceStatus.EM_ANALISE,
      createdAt: new Date().toISOString(), // Atualiza data de postagem
      adminObservations: '', // Oculta a justificativa anterior
      userResponse: userResponse, // Grava a resposta do usuário
    };

    onUpdateInvoice(updatedInvoice);
    setEditingNoteId(null);
    setUserResponse('');
  };

  const resetFilters = () => {
    setFilters({ supplierName: '', invoiceNumber: '', dateFrom: '', dateTo: '', userName: '' });
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.RECEBIDA:
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase">Recebida</span>;
      case InvoiceStatus.PENDENTE:
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase flex items-center space-x-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"/></svg><span>Pendente</span></span>;
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
          <button onClick={resetFilters} className="text-xs text-red-600 hover:underline font-bold uppercase tracking-tighter">Limpar filtros</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <input type="text" placeholder="Fornecedor..." className="px-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500" value={filters.supplierName} onChange={e => setFilters({...filters, supplierName: e.target.value})} />
          <input type="text" placeholder="Nº da Nota..." className="px-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500" value={filters.invoiceNumber} onChange={e => setFilters({...filters, invoiceNumber: e.target.value})} />
          <input type="text" placeholder="Usuário..." className="px-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500" value={filters.userName} onChange={e => setFilters({...filters, userName: e.target.value})} />
          <div className="flex space-x-2 lg:col-span-2">
            <input type="date" className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm" value={filters.dateFrom} onChange={e => setFilters({...filters, dateFrom: e.target.value})} />
            <input type="date" className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm" value={filters.dateTo} onChange={e => setFilters({...filters, dateTo: e.target.value})} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Fornecedor / Nota</th>
                <th className="px-4 py-4">Usuário</th>
                <th className="px-4 py-4">Emissão</th>
                <th className="px-4 py-4">Postagem</th>
                <th className="px-4 py-4 text-right">Valor</th>
                <th className="px-4 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => (
                <React.Fragment key={inv.id}>
                  <tr className={`hover:bg-slate-50 transition-colors ${inv.status === InvoiceStatus.PENDENTE ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-4">{getStatusBadge(inv.status)}</td>
                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-900 text-xs">{inv.supplierName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">NF: {inv.invoiceNumber}</div>
                    </td>
                    <td className="px-4 py-4">
                       <span className="text-[11px] font-medium text-slate-700">{inv.userName}</span>
                    </td>
                    <td className="px-4 py-4 text-[11px] text-slate-600 font-medium">
                      {new Date(inv.emissionDate).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-4 text-[11px] text-slate-600 font-medium">
                      <div className="flex flex-col">
                        <span>{new Date(inv.createdAt).toLocaleDateString('pt-BR')}</span>
                        <span className="text-[9px] text-slate-400 font-bold">{new Date(inv.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs font-bold text-slate-900 text-right">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inv.value)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <a href={inv.pdfUrl} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Ver Arquivo">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </a>

                        {/* Botão de Excluir - Disponível para Admin ou Dono se status for Analise ou Pendente */}
                        {(user.role === UserRole.ADMIN || inv.uploadedBy === user.id) && 
                         (inv.status === InvoiceStatus.EM_ANALISE || inv.status === InvoiceStatus.PENDENTE) && (
                          <button 
                            onClick={() => handleDelete(inv)} 
                            className="p-2 text-slate-400 hover:text-red-600 transition-colors" 
                            title="Excluir Nota (Erro de Postagem)"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                        
                        {user.role === UserRole.ADMIN ? (
                          <div className="flex space-x-1 border-l pl-2 border-slate-200">
                            <button onClick={() => handleStatusChange(inv, InvoiceStatus.RECEBIDA)} className={`p-1.5 rounded ${inv.status === InvoiceStatus.RECEBIDA ? 'bg-green-600 text-white' : 'text-green-600 hover:bg-green-50'}`} title="Marcar Recebida"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg></button>
                            <button onClick={() => { setEditingNoteId(inv.id); setTempObservation(inv.adminObservations || ''); }} className={`p-1.5 rounded ${inv.status === InvoiceStatus.PENDENTE ? 'bg-red-600 text-white' : 'text-red-600 hover:bg-red-50'}`} title="Apontar Pendência"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></button>
                          </div>
                        ) : (
                          inv.status === InvoiceStatus.PENDENTE && (
                            <button 
                              onClick={() => { setEditingNoteId(inv.id); setUserResponse(''); }}
                              className="px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded hover:bg-red-700 transition-all uppercase tracking-tighter"
                            >
                              Repostar
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>

                  {inv.status === InvoiceStatus.PENDENTE && inv.adminObservations && editingNoteId !== inv.id && (
                    <tr className="bg-red-50/70 border-l-4 border-l-red-600">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-start space-x-3 text-red-900">
                             <div className="font-bold text-[10px] uppercase bg-red-100 px-2 py-1 rounded">Justificativa Admin:</div>
                             <p className="text-sm italic font-medium">"{inv.adminObservations}"</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                  {inv.userResponse && (
                    <tr className="bg-slate-50/50 border-l-4 border-l-slate-400">
                      <td colSpan={7} className="px-6 py-2">
                        <div className="flex items-center space-x-3 text-slate-600">
                           <div className="font-bold text-[9px] uppercase bg-slate-100 px-2 py-1 rounded">Resposta Usuário:</div>
                           <p className="text-[11px] italic font-medium">"{inv.userResponse}"</p>
                        </div>
                      </td>
                    </tr>
                  )}

                  {editingNoteId === inv.id && (
                    <tr className="bg-slate-100">
                      <td colSpan={7} className="px-6 py-6 shadow-inner">
                        {user.role === UserRole.ADMIN ? (
                          <div className="max-w-3xl space-y-4">
                            <h4 className="font-bold text-slate-800 text-sm">Configurar Pendência e Notificação</h4>
                            
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Motivo da Pendência</label>
                              <textarea className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-red-500" rows={2} value={tempObservation} placeholder="Descreva o que precisa ser corrigido..." onChange={e => setTempObservation(e.target.value)} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">E-mail Adicional (Opcional)</label>
                                <input type="email" className="w-full px-3 py-2 border rounded-lg text-sm" value={extraEmail} placeholder="exemplo@delp.com.br" onChange={e => setExtraEmail(e.target.value)} />
                              </div>
                              <div className="flex items-end space-x-2">
                                 <button onClick={() => setEditingNoteId(null)} className="flex-1 px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition-all">Cancelar</button>
                                 <button onClick={() => handleApplyPendency(inv, false)} className="flex-1 px-4 py-2 text-sm font-bold bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-all">Salvar s/ E-mail</button>
                                 <button onClick={() => handleApplyPendency(inv, true)} className="flex-[1.5] px-4 py-2 text-sm font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center justify-center space-x-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    <span>Salvar e Notificar</span>
                                 </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="max-w-3xl space-y-4">
                            <div className="bg-red-50 p-4 rounded-lg border border-red-100 mb-4">
                               <p className="text-xs font-bold text-red-800 uppercase mb-1">Motivo apontado pelo Admin:</p>
                               <p className="text-sm italic text-red-900 font-medium">"{inv.adminObservations}"</p>
                            </div>
                            <h4 className="font-bold text-slate-800 text-sm">Repostagem de Nota</h4>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Sua Justificativa de Correção / Comentário</label>
                              <textarea 
                                className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-green-500" 
                                rows={2} 
                                value={userResponse} 
                                placeholder="Informe o que foi corrigido ou sua resposta à pendência..." 
                                onChange={e => setUserResponse(e.target.value)} 
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                               <button onClick={() => setEditingNoteId(null)} className="px-6 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-lg">Cancelar</button>
                               <button onClick={() => handleRepost(inv)} className="px-8 py-2 text-sm font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md">Confirmar e Repostar Nota</button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvoiceList;
