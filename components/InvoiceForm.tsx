
import React, { useState, useRef } from 'react';
import { analyzeInvoiceImage } from '../services/geminiService';

interface InvoiceFormProps {
  onSuccess: (invoice: any) => void;
  userId: string;
  userName: string;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onSuccess, userId, userName }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    supplierName: '',
    invoiceNumber: '',
    emissionDate: '',
    orderNumber: '',
    value: '',
    observations: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      value: parseFloat(formData.value) || 0,
      pdfUrl: URL.createObjectURL(file),
      fileName: file.name,
      uploadedBy: userId,
      userName: userName,
      createdAt: new Date().toISOString(),
    };

    onSuccess(newInvoice);
    setFormData({ supplierName: '', invoiceNumber: '', emissionDate: '', orderNumber: '', value: '', observations: '' });
    setFile(null);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50">
        <h2 className="text-xl font-bold text-slate-800">Postar Nova Nota Fiscal</h2>
        <p className="text-sm text-slate-500">Preencha os dados abaixo e anexe o comprovante original.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Razão Social do Fornecedor</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all"
              placeholder="Ex: Empresa de Tecnologia LTDA"
              value={formData.supplierName}
              onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Número da Nota Fiscal</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all"
              placeholder="Ex: 000.123.456"
              value={formData.invoiceNumber}
              onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Data de Emissão</label>
            <input
              type="date"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all"
              value={formData.emissionDate}
              onChange={(e) => setFormData({ ...formData, emissionDate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Valor Total (R$)</label>
            <input
              type="number"
              step="0.01"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-red-700"
              placeholder="0,00"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Ordem de Compra / OSV / OS</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all"
              placeholder="Ex: OC-2024-001"
              value={formData.orderNumber}
              onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Observações (Opcional)</label>
          <textarea
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all min-h-[80px]"
            placeholder="Digite observações relevantes..."
            value={formData.observations}
            onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Anexo (PDF ou Imagem)</label>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
              file ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-red-400 hover:bg-slate-50'
            }`}
          >
            {loading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500 mb-2"></div>
                <p className="text-sm text-slate-600">IA analisando documento...</p>
              </div>
            ) : file ? (
              <div className="text-center">
                <svg className="w-12 h-12 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-sm font-medium text-slate-900">{file.name}</p>
                <p className="text-xs text-slate-500">Arquivo pronto para envio</p>
              </div>
            ) : (
              <div className="text-center">
                <svg className="w-12 h-12 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                <p className="text-sm font-medium text-slate-900">Clique ou arraste para enviar</p>
                <p className="text-xs text-slate-500">PDF, JPG ou PNG</p>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,image/*" />
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transform transition-all active:scale-95 shadow-md shadow-red-200"
          >
            Postar Nota Fiscal
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;
