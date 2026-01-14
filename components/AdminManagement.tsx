
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
                <p className="text-sm text-slate-500">Controle níveis de acesso e setores.</p>
              </div>
              <button onClick={() => { setEditingUser({name: '', email: '', role: UserRole.USER, sector: ''}); setIsEditingUser(true); }} className="bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-red-200">
                + Novo Usuário
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map(u => (
                <div key={u.id} className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 flex items-center justify-between hover:bg-white transition-all">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 uppercase">{u.name.charAt(0)}</div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{u.name}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-red-100 text-red-600">{u.role}</span>
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-600">{u.sector || 'Sem Setor'}</span>
                      </div>
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
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">E-mail / Login</label>
                <input type="email" required className="w-full px-4 py-3 border rounded-xl text-sm" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Setor Delp</label>
                <input type="text" required className="w-full px-4 py-3 border rounded-xl text-sm uppercase" placeholder="Ex: FINANCEIRO, RH, PRODUÇÃO" value={editingUser.sector} onChange={e => setEditingUser({...editingUser, sector: e.target.value.toUpperCase()})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nível de Acesso</label>
                <select className="w-full px-4 py-3 border rounded-xl text-sm font-bold bg-white" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}>
                  <option value={UserRole.USER}>Usuário Comum (Vê apenas as suas)</option>
                  <option value={UserRole.MANAGER}>Gestor de Setor (Vê o setor inteiro)</option>
                  <option value={UserRole.ADMIN}>Administrador Master (Vê tudo)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Senha</label>
                <input type="text" required className="w-full px-4 py-3 border rounded-xl text-sm" value={editingUser.password} onChange={e => setEditingUser({...editingUser, password: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setIsEditingUser(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl">Voltar</button>
              <button type="submit" className="px-8 py-2.5 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200">Gravar Usuário</button>
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
      </div>
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-4 text-center">
         <p className="text-sm text-slate-500">Funções de exportação de dados globais e backups.</p>
         <button onClick={() => {
            const backupData = { invoices, users, suppliers, exportDate: new Date().toISOString() };
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `BACKUP_DELP.json`; link.click();
         }} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold">Exportar Backup Completo</button>
      </div>
    </div>
  );
};

export default AdminManagement;
