
import React, { useState, useRef } from 'react';
import { Invoice, User, UserRole } from '../types';

interface AdminManagementProps {
  invoices: Invoice[];
  users: User[];
  onUpdateUsers: (users: User[]) => void;
}

const AdminManagement: React.FC<AdminManagementProps> = ({ invoices, users, onUpdateUsers }) => {
  const [activeTab, setActiveTab] = useState<'notas' | 'usuarios' | 'sistema'>('notas');
  const [isEditingUser, setIsEditingUser] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({
    name: '',
    email: '',
    password: '',
    role: UserRole.USER
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    alert('Downloads iniciados.');
  };

  // Novas funções de Backup Global
  const exportGlobalBackup = () => {
    const backupData = {
      invoices,
      users,
      exportDate: new Date().toISOString(),
      version: "1.0"
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BACKUP_PORTAL_DELP_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const importGlobalBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.invoices && data.users) {
          if (window.confirm("Isso irá substituir todos os dados atuais (notas e usuários). Deseja continuar?")) {
            localStorage.setItem('noteflow_invoices', JSON.stringify(data.invoices));
            localStorage.setItem('noteflow_users', JSON.stringify(data.users));
            window.location.reload(); // Recarrega para aplicar o backup
          }
        } else {
          alert("Arquivo de backup inválido.");
        }
      } catch (err) {
        alert("Erro ao ler o arquivo de backup.");
      }
    };
    reader.readAsText(file);
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
      newUsers = newUsers.map(u => u.id === editingUser.id ? (editingUser as User) : u);
    } else {
      const newUser = { ...editingUser, id: Math.random().toString(36).substr(2, 9) } as User;
      newUsers.push(newUser);
    }
    onUpdateUsers(newUsers);
    setIsEditingUser(false);
  };

  const deleteUser = (id: string) => {
    if (id === 'admin-master') return alert('O usuário master não pode ser excluído.');
    if (window.confirm('Excluir este usuário?')) {
      onUpdateUsers(users.filter(u => u.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('notas')}
            className={`px-6 py-4 font-bold text-xs uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'notas' ? 'border-red-600 text-red-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Relatórios e Notas
          </button>
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`px-6 py-4 font-bold text-xs uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'usuarios' ? 'border-red-600 text-red-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Acessos e Usuários
          </button>
          <button
            onClick={() => setActiveTab('sistema')}
            className={`px-6 py-4 font-bold text-xs uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'sistema' ? 'border-red-600 text-red-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Configuração / Backup
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'notas' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Relatório Consolidado</h3>
                  <p className="text-sm text-slate-500">Dados de todas as notas fiscais postadas.</p>
                </div>
                <div className="flex space-x-2 w-full sm:w-auto">
                  <button onClick={exportToExcel} className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <span>Excel</span>
                  </button>
                  <button onClick={downloadAllPDFs} className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    <span>PDFs</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-4 py-3 border-b">Fornecedor</th>
                      <th className="px-4 py-3 border-b text-right">Valor</th>
                      <th className="px-4 py-3 border-b">Emissão</th>
                      <th className="px-4 py-3 border-b">Postagem Portal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map(inv => (
                      <tr key={inv.id} className="text-[13px] hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{inv.supplierName}</p>
                          <p className="font-mono text-[10px] text-slate-400">NF: {inv.invoiceNumber} | {inv.userName}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-800">
                          {formatCurrency(inv.value || 0)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {new Date(inv.emissionDate).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-slate-500 italic">
                          {formatDateTime(inv.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'usuarios' && (
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
                          <button onClick={() => startEditUser(u)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                          <button onClick={() => deleteUser(u.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <h4 className="text-lg font-bold text-slate-800 mb-6">{editingUser.id ? 'Alterar Usuário' : 'Novo Usuário'}</h4>
                  <form onSubmit={handleSaveUser} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input type="text" required placeholder="Nome" className="w-full px-4 py-2 border rounded-lg" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
                      <input type="text" required placeholder="E-mail / Usuário" className="w-full px-4 py-2 border rounded-lg" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} />
                      <input type="text" required placeholder="Senha" className="w-full px-4 py-2 border rounded-lg" value={editingUser.password} onChange={e => setEditingUser({...editingUser, password: e.target.value})} />
                      <select className="w-full px-4 py-2 border rounded-lg" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}>
                        <option value={UserRole.USER}>Colaborador</option>
                        <option value={UserRole.ADMIN}>Administrador</option>
                      </select>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <button type="button" onClick={() => setIsEditingUser(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button>
                      <button type="submit" className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-bold">Salvar</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sistema' && (
            <div className="space-y-8 animate-in fade-in zoom-in duration-300">
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Salvar meu Projeto (Backup)</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-8">
                  Como este sistema roda localmente no seu navegador, é essencial exportar seus dados periodicamente para evitar perdas se o navegador for limpo.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button 
                    onClick={exportGlobalBackup}
                    className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-red-200"
                  >
                    <span>Baixar Arquivo de Backup (.json)</span>
                  </button>
                  
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white border-2 border-slate-200 hover:border-red-600 text-slate-700 px-8 py-4 rounded-xl font-bold transition-all"
                  >
                    <span>Restaurar de um Backup</span>
                  </button>
                  <input type="file" ref={fileInputRef} onChange={importGlobalBackup} className="hidden" accept=".json" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-6 bg-white border border-slate-200 rounded-xl">
                  <h4 className="font-bold text-slate-800 mb-2">Privacidade</h4>
                  <p className="text-sm text-slate-500">Nenhum dado financeiro ou arquivo PDF sai do seu navegador sem sua permissão. O processamento de IA é feito diretamente via API criptografada.</p>
                </div>
                <div className="p-6 bg-white border border-slate-200 rounded-xl">
                  <h4 className="font-bold text-slate-800 mb-2">Suporte Delp</h4>
                  <p className="text-sm text-slate-500">Para suporte técnico ou integração com o ERP da empresa, entre em contato com o departamento de TI da unidade.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminManagement;
