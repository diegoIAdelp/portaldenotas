
import React, { useState, useRef, useMemo } from 'react';
import { analyzeInvoiceImage } from '../services/geminiService';
import { Supplier, ViewType } from '../types';

interface InvoiceFormProps {
  onSuccess: (invoice: any) => void;
  onNavigate: (view: ViewType) => void;
  userId: string;
  userName: string;
  userSector: string;
  suppliers: Supplier[];
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onSuccess, onNavigate, userId, userName, userSector, suppliers }) => {
  const [loading, setLoading] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [docType, setDocType] = useState<'OSV' | 'CONTRATO'>('OSV');
  
  const [formData, setFormData] = useState({
    supplierName: '',
    supplierCnpj: '',
    supplierId: '',
    invoiceNumber: '',
    emissionDate: '',
    orderNumber: '',
    value: '',
    observations: '',
  });
  
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch) return [];
    const search = supplierSearch.toLowerCase();
    return suppliers.filter(s => 
      s.name.toLowerCase().includes(search) || 
      s.cnpj.includes(search)
    ).slice(0, 5);
  }, [suppliers, supplierSearch]);

  const handleSelectSupplier = (s: Supplier) => {
    setFormData(prev => ({ 
      ...prev, 
      supplierName: s.name, 
      supplierCnpj: s.cnpj, 
      supplierId: s.id 
    }));
    setSupplierSearch(s.name);
    setShowSupplierDropdown(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        setLoading(true);
        try {
          const reader = new FileReader();
          reader.onload = async () => {
            const base64 = (reader.result as string).split(',')[1];
            const data = await analyzeInvoiceImage(base64);
            if (data) {
              setFormData(prev => ({
                ...prev,
                supplierName: data.supplierName || prev.supplierName,
                invoiceNumber: data.invoiceNumber || prev.invoiceNumber,
                emissionDate: data.emissionDate || prev.emissionDate,
                orderNumber: data.orderNumber || prev.orderNumber,
                value: data.value?.toString() || prev.value,
              }));
              setSupplierSearch(data.supplierName || '');
            }
          };
          reader.readAsDataURL(selectedFile);
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert('Por favor, selecione um arquivo.');

    const newInvoice = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      docType,
      value: parseFloat(formData.value) || 0,
      pdfUrl: URL.createObjectURL(file),
      fileName: file.name,
      uploadedBy: userId,
      userName: userName,
      userSector: userSector,
      createdAt: new Date().toISOString(),
    };

    onSuccess(newInvoice);
    setFormData({ supplierName: '', supplierCnpj: '', supplierId: '', invoiceNumber: '', emissionDate: '', orderNumber: '', value: '', observations: '' });
    setSupplierSearch('');
    setFile(null);
    setDocType('OSV');
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Postar Nota Fiscal</h2>
        <div className="text-[10px] font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full uppercase tracking-widest">{userSector}</div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="space-y-2 relative">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-semibold text-slate-700">Buscar Fornecedor (Nome ou CNPJ)</label>
              <button 
                type="button"
                onClick={() => onNavigate('suppliers')}
                className="text-[10px] font-bold text-red-600 hover:underline uppercase"
              >
                + Cadastrar novo
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none pr-10"
                placeholder="Digite o nome ou CNPJ..."
                value={supplierSearch}
                onChange={(e) => {
                  setSupplierSearch(e.target.value);
                  setFormData(prev => ({ ...prev, supplierName: e.target.value, supplierId: '', supplierCnpj: '' }));
                  setShowSupplierDropdown(true);
                }}
                onFocus={() => setShowSupplierDropdown(true)}
              />
              <div className="absolute right-3 top-2.5 text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
            {showSupplierDropdown && filteredSuppliers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                {filteredSuppliers.map(s => (
                  <button key={s.id} type="button" onClick={() => handleSelectSupplier(s)} className="w-full text-left px-4 py-2 hover:bg-red-50 transition-colors border-b last:border-0 border-slate-100">
                    <div className="font-bold text-sm text-slate-800">{s.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{s.cnpj}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Número da Nota Fiscal</label>
            <input type="text" required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" placeholder="Ex: 000.123.456" value={formData.invoiceNumber} onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })} />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Data de Emissão</label>
            <input type="date" required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" value={formData.emissionDate} onChange={(e) => setFormData({ ...formData, emissionDate: e.target.value })} />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Valor Total (R$)</label>
            <input type="number" step="0.01" required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none font-bold text-red-700" placeholder="0,00" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} />
          </div>

          <div className="space-y-3 col-span-1 md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-6">
              <label className="text-sm font-bold text-slate-700">Vínculo de Faturamento:</label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" checked={docType === 'OSV'} onChange={() => setDocType('OSV')} className="w-4 h-4 text-red-600 focus:ring-red-500" />
                  <span className="text-sm font-medium text-slate-600">OSV</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" checked={docType === 'CONTRATO'} onChange={() => setDocType('CONTRATO')} className="w-4 h-4 text-red-600 focus:ring-red-500" />
                  <span className="text-sm font-medium text-slate-600">Contrato</span>
                </label>
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {docType === 'OSV' ? 'Número da Ordem de Serviço / OSV' : 'Número da Ordem de Serviço / OSV (Opcional)'}
              </label>
              <input 
                type="text" 
                required={docType === 'OSV'}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" 
                placeholder={docType === 'OSV' ? "Ex: 017543" : "Não obrigatório para Contratos"} 
                value={formData.orderNumber} 
                onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })} 
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Observações (Opcional)</label>
          <textarea className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none min-h-[80px]" placeholder="..." value={formData.observations} onChange={(e) => setFormData({ ...formData, observations: e.target.value })} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Anexo (PDF ou Imagem)</label>
          <div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${file ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-red-400 hover:bg-slate-50'}`}>
            {loading ? (
              <div className="flex flex-col items-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500 mb-2"></div><p className="text-sm text-slate-600">IA analisando documento...</p></div>
            ) : file ? (
              <div className="text-center"><svg className="w-12 h-12 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><p className="text-sm font-medium text-slate-900">{file.name}</p></div>
            ) : (
              <div className="text-center"><svg className="w-12 h-12 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg><p className="text-sm font-medium text-slate-900">Clique para enviar</p></div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,image/*" />
          </div>
        </div>

        <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transform transition-all active:scale-95 shadow-md uppercase tracking-widest text-sm">Postar Nota Fiscal</button>
      </form>
    </div>
  );
};

export default InvoiceForm;
