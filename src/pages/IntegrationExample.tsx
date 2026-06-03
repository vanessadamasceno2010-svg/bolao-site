import { useState } from 'react';
import { pushinPay } from '../lib/pushin-pay';
import { scraperClient, type ApiMatch } from '../lib/scraper-client';

/**
 * Exemplo de integração real com PushinPay + API-Football via Supabase.
 */
export function IntegrationExample() {
  const [matches, setMatches] = useState<ApiMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [txId, setTxId] = useState('');
  const [txStatus, setTxStatus] = useState('');

  async function fetchMatches() {
    setLoading(true);
    setMessage('Buscando jogos via API-Football...');
    try {
      const result = await scraperClient.getMatches();
      setMatches(result);
      setMessage(`✅ ${result.length} jogos encontrados`);
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function createPix() {
    setLoading(true);
    setMessage('Criando PIX via PushinPay...');
    try {
      // IDs fictícios para demonstração
      const result = await pushinPay.createPixPayment({
        pool_id: 'pool-demo',
        quantity: 1,
        user_id: 'user-demo',
      });
      setQrCode(result.qr_code);
      setTxId(result.transaction_id);
      setTxStatus('created');
      setMessage(`✅ PIX criado! ID: ${result.transaction_id}`);
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function checkPayment() {
    if (!txId) { setMessage('⚠️ Crie um pagamento primeiro.'); return; }
    setLoading(true);
    try {
      const result = await pushinPay.checkPayment(txId);
      setTxStatus(result.status);
      setMessage(`✅ Status: ${result.status}`);
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">🔌 Integrações Reais</h1>
      <p className="text-slate-400 mb-6">
        PushinPay (PIX) + API-Football (resultados) + Supabase (banco)
      </p>

      {message && (
        <div className={`mb-4 p-4 rounded-lg border ${
          message.startsWith('✅') ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
          : message.startsWith('❌') ? 'bg-red-500/10 border-red-500/30 text-red-200'
          : 'bg-blue-500/10 border-blue-500/30 text-blue-200'
        }`}>{message}</div>
      )}

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <button onClick={fetchMatches} disabled={loading}
          className="p-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 font-bold">
          ⚽ Buscar Jogos
        </button>
        <button onClick={createPix} disabled={loading}
          className="p-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-bold">
          💳 Criar PIX
        </button>
        <button onClick={checkPayment} disabled={loading}
          className="p-4 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 disabled:opacity-50 font-bold">
          🔍 Verificar Pagamento
        </button>
      </div>

      {qrCode && (
        <div className="mb-6 p-4 bg-white rounded-xl text-center">
          <p className="text-xs text-slate-500 mb-2">Status: {txStatus}</p>
          <code className="text-xs break-all block bg-slate-100 p-2 rounded text-slate-700">{qrCode}</code>
          <button onClick={() => { navigator.clipboard.writeText(qrCode); setMessage('📋 Copiado!'); }}
            className="mt-2 px-4 py-2 bg-emerald-500 text-white rounded text-sm">
            Copiar código PIX
          </button>
        </div>
      )}

      {matches.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-3">⚽ Jogos ({matches.length})</h2>
          <div className="space-y-2">
            {matches.slice(0, 10).map((m, i) => (
              <div key={i} className="p-3 bg-white/5 border border-white/10 rounded-lg flex justify-between items-center">
                <div>
                  <span className="font-bold">{m.home_team}</span>
                  <span className="text-slate-400 mx-2">vs</span>
                  <span className="font-bold">{m.away_team}</span>
                </div>
                <div>
                  {m.home_score !== null
                    ? <span className="font-bold text-emerald-300">{m.home_score} × {m.away_score}</span>
                    : <span className="text-xs text-slate-400">{new Date(m.match_date).toLocaleDateString('pt-BR')}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
