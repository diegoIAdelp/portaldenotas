// src/services/geminiService.ts (frontend)
export async function analyzeInvoiceImage(base64Image: string) {
  const r = await fetch('/api/invoices/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Image }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function generateAdminSummary(invoices: any[]) {
  const r = await fetch('/api/invoices/summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invoices }),
  });
  if (!r.ok) throw new Error(await r.text());
  const { text } = await r.json();
  return text ?? '';
}
