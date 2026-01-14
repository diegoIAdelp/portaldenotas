
import React, { useState, useRef } from 'react';
import { Invoice, User, UserRole, Supplier, ViewType } from '../types';

interface AdminManagementProps {
  invoices: Invoice[];
  users: User[];
  suppliers: Supplier[];
  onUpdateUsers: (users: User[]) => void;
  activeView: ViewType;
}

const AdminManagement: React.FC<AdminManagementProps> = ({ invoices, users, suppliers, onUpdateUsers, activeView }) => {
  const [isEditingUser, setIsEditingUser] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportGlobalBackup = () => {
    const backupData = { invoices, users, suppliers, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `BACKUP_PORTAL_DELP_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const importGlobalBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data && Array.isArray(data.invoices) && Array.isArray(data.users)) {
          localStorage.setItem('noteflow_invoices', JSON.stringify(data.invoices));
          localStorage.setItem('noteflow_users', JSON.stringify(data.users));
          if (data.suppliers) localStorage.setItem('noteflow_suppliers', JSON.stringify(data.suppliers));
          window.location.reload();
        }
      } catch (err) { alert("Erro ao ler backup."); }
    };
    reader.readAsText(file);
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

  if (activeView === 'users') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
        {!isEditingUser ? (
          <>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Gestão de Colaboradores</h3>
                <p className="text-sm text-slate-500">Controle quem tem acesso ao portal e seus níveis de permissão.</p>
              </div>
              <button onClick={() => { setEditingUser({name: '', email: '', role: UserRole.USER}); setIsEditingUser(true); }} className="bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-red-200">
                + Novo Usuário
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map(u => (
                <div key={u.id} className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 flex items-center justify-between hover:bg-white transition-all hover:shadow-md">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{u.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{u.email}</p>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md mt-1 inline-block ${u.role === UserRole.ADMIN ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-600'}`}>
                        {u.role}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => {setEditingUser(u); setIsEditingUser(true);}} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <form onSubmit={handleSaveUser} className="space-y-6 animate-in slide-in-from-top-2 duration-200">
             <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nome Completo</label>
                <input type="text" required className="w-full px-4 py-3 border rounded-xl text-sm" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">E-mail (Login)</label>
                <input type="email" required className="w-full px-4 py-3 border rounded-xl text-sm" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Senha de Acesso</label>
                <input type="text" required className="w-full px-4 py-3 border rounded-xl text-sm" value={editingUser.password} onChange={e => setEditingUser({...editingUser, password: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nível de Acesso</label>
                <select className="w-full px-4 py-3 border rounded-xl text-sm font-bold bg-white" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}>
                  <option value={UserRole.USER}>Colaborador (Usuário Comum)</option>
                  <option value={UserRole.ADMIN}>Administrador Master</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setIsEditingUser(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all">Voltar</button>
              <button type="submit" className="px-8 py-2.5 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all">Gravar Usuário</button>
            </div>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-8 py-10">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-slate-800">Manutenção de Sistema</h3>
        <p className="text-slate-500">Ferramentas de exportação e restauração completa de dados.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-8">
        <div className="space-y-4">
          <div className="p-6 bg-red-50 rounded-2xl border border-red-100 flex items-start space-x-4">
            <div className="p-3 bg-red-600 text-white rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </div>
            <div>
              <h4 className="font-bold text-red-900">Exportar Backup Completo</h4>
              <p className="text-xs text-red-700 mb-4">Gera um arquivo JSON contendo todas as Notas, Usuários e Fornecedores atuais.</p>
              <button onClick={exportGlobalBackup} className="px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-red-700 transition-all">Baixar Backup Geral</button>
            </div>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex items-start space-x-4">
            <div className="p-3 bg-slate-800 text-white rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            </div>
            <div>
              <h4 className="font-bold text-slate-800">Restaurar Sistema</h4>
              <p className="text-xs text-slate-500 mb-4">Atenção: Ao restaurar, todos os dados atuais serão substituídos pelo arquivo selecionado.</p>
              <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2 bg-white border-2 border-slate-300 text-slate-700 rounded-xl text-sm font-bold hover:border-red-600 transition-all">Selecionar Arquivo</button>
              <input type="file" ref={fileInputRef} onChange={importGlobalBackup} className="hidden" accept=".json" />
            </div>
          </div>
        </div>

        <div className="text-center pt-6 border-t border-slate-100">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NoteFlow Portal v1.5.0 • Delp Fabricação</p>
        </div>
      </div>
    </div>
  );
};

export default AdminManagement;
