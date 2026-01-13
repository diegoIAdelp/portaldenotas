
import React, { useState } from 'react';
import { Invoice, User, UserRole } from '../types';

interface AdminManagementProps {
  invoices: Invoice[];
  users: User[];
  onUpdateUsers: (users: User[]) => void;
}

const AdminManagement: React.FC<AdminManagementProps> = ({ invoices, users, onUpdateUsers }) => {
  const [activeTab, setActiveTab] = useState<'notas' | 'usuarios'>('notas');
  const [isEditingUser, setIsEditingUser] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({
    name: '',
    email: '',
    password: '',
    role: UserRole.USER
  });

  // Funções de Gerenciamento de Notas
  const exportToExcel = () => {
    const headers = ['Fornecedor', 'Numero Nota', 'Valor (R$)', 'Pedido/OS', 'Data Emissao', 'Observacoes', 'Postado Por', 'Data Cadastro (Portal)'];
    const rows = invoices.map(inv => [
      inv.supplierName,
      inv.invoiceNumber,
      inv.value.toFixed(2).replace('.', ','),
      inv.orderNumber,
      inv.emissionDate,
      inv.observations || '',
      inv.userName,
      new Date(inv.createdAt).toLocaleString('pt-BR')
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `PortalDelp_Relatorio_Geral_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllPDFs = () => {
    invoices.forEach((inv, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = inv.pdfUrl;
        link.download = `${inv.supplierName}_${inv.invoiceNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 300);
    });
    alert('Os downloads foram iniciados. Verifique se o seu navegador não bloqueou janelas pop-up.');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  };

  // Funções de Gerenciamento de Usuários
  const startCreateUser = () => {
    setEditingUser({ name: '', email: '', password: '', role: UserRole.USER });
    setIsEditingUser(true);
  };

  const startEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditingUser(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    let newUsers = [...users];

    if (editingUser.id) {
      // Editar existente
      newUsers = newUsers.map(u => u.id === editingUser.id ? (editingUser as User) : u);
    } else {
      // Criar novo
      const newUser = {
        ...editingUser,
        id: Math.random().toString(36).substr(2, 9),
      } as User;
      newUsers.push(newUser);
    }

    onUpdateUsers(newUsers);
    setIsEditingUser(false);
  };

  const deleteUser = (id: string) => {
    if (id === 'admin-master') return alert('O usuário master não pode ser excluído.');
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      onUpdateUsers(users.filter(u => u.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab('notas')}
            className={`px-6 py-4 font-bold text-sm transition-all border-b-2 ${
              activeTab === 'notas' ? 'border-red-600 text-red-600 bg-red-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Gerenciar Notas
          </button>
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`px-6 py-4 font-bold text-sm transition-all border-b-2 ${
              activeTab === 'usuarios' ? 'border-red-600 text-red-600 bg-red-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Gerenciar Usuários
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'notas' ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Relatório e Backup</h3>
                  <p className="text-sm text-slate-500">Extração de dados consolidados e download em massa.</p>
                </div>
                <div className="flex space-x-2 w-full sm:w-auto">
                  <button onClick={exportToExcel} className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <span>Extrair Excel</span>
                  </button>
                  <button onClick={downloadAllPDFs} className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    <span>Baixar Tudo</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-4 py-3 border-b">Fornecedor / Arquivo</th>
                      <th className="px-4 py-3 border-b text-right">Valor</th>
                      <th className="px-4 py-3 border-b">Data Emissão</th>
                      <th className="px-4 py-3 border-b">Data Postagem</th>
                      <th className="px-4 py-3 border-b">Usuário</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map(inv => (
                      <tr key={inv.id} className="text-[13px] hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{inv.supplierName}</p>
                          <p className="font-mono text-[10px] text-slate-400">NF: {inv.invoiceNumber}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-800">
                          {formatCurrency(inv.value || 0)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {new Date(inv.emissionDate).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {formatDateTime(inv.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-medium">{inv.userName}</td>
                      </tr>
                    ))}
                    {invoices.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-slate-400">Nenhum dado para exibição.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {!isEditingUser ? (
                <>
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">Controle de Usuários</h3>
                    <button onClick={startCreateUser} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-md shadow-red-100">
                      + Novo Usuário
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {users.map(u => (
                      <div key={u.id} className="p-4 border rounded-xl flex items-center justify-between hover:bg-slate-50 transition-all group">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${u.role === UserRole.ADMIN ? 'bg-red-600' : 'bg-slate-400'}`}>
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{u.name}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => startEditUser(u)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Editar">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => deleteUser(u.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Excluir">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-4">
                  <h4 className="text-lg font-bold text-slate-800 mb-6">{editingUser.id ? 'Alterar Credenciais' : 'Novo Usuário'}</h4>
                  <form onSubmit={handleSaveUser} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase">Nome Completo</label>
                        <input 
                          type="text" 
                          required 
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                          value={editingUser.name} 
                          onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase">E-mail / Usuário</label>
                        <input 
                          type="text" 
                          required 
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                          value={editingUser.email} 
                          onChange={e => setEditingUser({...editingUser, email: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase">Senha do Portal</label>
                        <input 
                          type="text" 
                          required 
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                          value={editingUser.password} 
                          onChange={e => setEditingUser({...editingUser, password: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase">Perfil de Acesso</label>
                        <select 
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                          value={editingUser.role}
                          onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}
                        >
                          <option value={UserRole.USER}>Colaborador (Apenas envio)</option>
                          <option value={UserRole.ADMIN}>Fiscal / Master (Controle total)</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <button type="button" onClick={() => setIsEditingUser(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Cancelar</button>
                      <button type="submit" className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-all">Salvar Usuário</button>
                    </div>
                  </form>
                </div>
              )}
              <p className="text-xs text-slate-400 italic font-medium">Nota: O usuário master (delp) tem privilégios de alteração de todas as credenciais do portal.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminManagement;
