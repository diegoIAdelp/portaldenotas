
import React, { useState, useEffect } from 'react';
import { User, UserRole, Invoice, InvoiceStatus } from './types';
import { DEFAULT_ADMIN, MOCK_STANDARD_USER, APP_NAME, APP_SUBTITLE } from './constants';
import Sidebar from './components/Sidebar';
import InvoiceForm from './components/InvoiceForm';
import InvoiceList from './components/InvoiceList';
import AdminDashboard from './components/AdminDashboard';
import AdminManagement from './components/AdminManagement';
import { DelpLogoFull } from './components/Logo';

type ViewType = 'dashboard' | 'upload' | 'list' | 'management';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewType>('upload');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Inicialização de dados persistentes
  useEffect(() => {
    const savedInvoices = localStorage.getItem('noteflow_invoices');
    if (savedInvoices) {
      setInvoices(JSON.parse(savedInvoices));
    }

    const savedUsers = localStorage.getItem('noteflow_users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      const initialUsers = [DEFAULT_ADMIN, MOCK_STANDARD_USER];
      setUsers(initialUsers);
      localStorage.setItem('noteflow_users', JSON.stringify(initialUsers));
    }
  }, []);

  const handleSaveInvoice = (newInvoice: any) => {
    // Garante que a nota nasce "Em Análise"
    const invoiceWithStatus = { ...newInvoice, status: InvoiceStatus.EM_ANALISE };
    const updated = [invoiceWithStatus, ...invoices];
    setInvoices(updated);
    localStorage.setItem('noteflow_invoices', JSON.stringify(updated));
    setView('list');
  };

  const handleUpdateInvoice = (updatedInvoice: Invoice) => {
    const updated = invoices.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv);
    setInvoices(updated);
    localStorage.setItem('noteflow_invoices', JSON.stringify(updated));
  };

  const handleUpdateUsers = (newUsers: User[]) => {
    setUsers(newUsers);
    localStorage.setItem('noteflow_users', JSON.stringify(newUsers));
    const loggedUserStillExists = newUsers.find(u => u.id === currentUser?.id);
    if (!loggedUserStillExists) {
      setCurrentUser(null);
    } else {
      setCurrentUser(loggedUserStillExists);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => 
      (u.email.toLowerCase() === loginIdentifier.toLowerCase() || u.id === loginIdentifier) && 
      u.password === loginPassword
    );

    if (user) {
      setCurrentUser(user);
      setView(user.role === UserRole.ADMIN ? 'dashboard' : 'upload');
    } else {
      alert('Credenciais inválidas. Verifique seu usuário e senha.');
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="mb-8">
           <DelpLogoFull className="h-24 scale-125" />
        </div>
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
          <div className="p-6 bg-white border-b border-slate-100 text-center">
            <h1 className="text-2xl font-bold text-slate-800">{APP_NAME}</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">{APP_SUBTITLE}</p>
          </div>
          <form onSubmit={handleLogin} className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Usuário ou E-mail</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-red-500 transition-all"
                placeholder="Ex: delp ou nome@delp.com.br"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Senha</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-red-500 transition-all"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-95"
            >
              Entrar no Portal
            </button>
            <div className="text-center pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400">Acesso Master:</p>
              <p className="text-xs text-slate-600 font-medium">Usuário: delp | Senha: delp1234</p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar 
        user={currentUser} 
        activeView={view} 
        onNavigate={setView as any} 
        onLogout={() => {
          setCurrentUser(null);
          setLoginIdentifier('');
          setLoginPassword('');
        }} 
      />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8 flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {view === 'dashboard' ? 'Painel Administrativo' : 
                 view === 'management' ? 'Gerenciamento de Notas e Usuários' :
                 view === 'upload' ? 'Postagem de Notas' : 'Minhas Notas'}
              </h2>
              <p className="text-slate-500 text-sm">
                {view === 'dashboard' ? 'Visão geral do sistema e análise Delp.' : 
                 view === 'management' ? 'Controle total, exportação para excel e gestão de usuários.' :
                 view === 'upload' ? 'Envie seus documentos de forma rápida.' : 'Gerencie e acompanhe o status de suas notas.'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
          </header>

          {view === 'dashboard' && currentUser.role === UserRole.ADMIN && (
            <AdminDashboard invoices={invoices} />
          )}

          {view === 'management' && currentUser.role === UserRole.ADMIN && (
            <AdminManagement 
              invoices={invoices} 
              users={users} 
              onUpdateUsers={handleUpdateUsers}
            />
          )}

          {view === 'upload' && (
            <InvoiceForm 
              onSuccess={handleSaveInvoice} 
              userId={currentUser.id} 
              userName={currentUser.name} 
            />
          )}

          {view === 'list' && (
            <InvoiceList invoices={invoices} user={currentUser} onUpdateInvoice={handleUpdateInvoice} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
