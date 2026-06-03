import { useState } from 'react';
import { toast } from '../lib/toast';
import type { Bolao } from '../types';
import { brl } from '../lib/scoring';

type Props = {
  bolao: Bolao;
  link: string;
  open: boolean;
  onClose: () => void;
};

export function ShareModal({ bolao, link, open, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const prize = bolao.totalShares * bolao.shareValue * (1 - bolao.commissionPercent / 100);

  const whatsappMsg =
    `🏆 *${bolao.name}*\n\n` +
    `⚽ Bolão da Copa do Mundo 2026\n` +
    `💰 Cota: ${brl(bolao.shareValue)}\n` +
    `🎟️ Vagas: ${bolao.totalShares} cotas\n` +
    `🏆 Prêmio total: ${brl(prize)}\n` +
    `📅 Prazo: ${new Date(bolao.deadline).toLocaleDateString('pt-BR')}\n\n` +
    `👉 Participe aqui: ${link}`;

  const telegramMsg = `🏆 ${bolao.name}\n⚽ Copa 2026 · Cota: ${brl(bolao.shareValue)}\n🏆 Prêmio: ${brl(prize)}\n\nParticipar: ${link}`;

  function copyLink() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Link copiado!', 'Cole no grupo ou mande direto para a galera.');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md animate-scaleIn shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl">✕</button>

        <div className="text-center mb-6">
          <div className="text-4xl mb-2">📲</div>
          <h2 className="text-xl font-black">Compartilhar bolão</h2>
          <p className="text-sm text-slate-400 mt-1">Convide a galera para participar!</p>
        </div>

        {/* Link box */}
        <div className="bg-slate-800/60 border border-white/10 rounded-xl p-3 mb-4">
          <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Link do bolão</div>
          <div className="text-xs font-mono text-emerald-300 break-all mb-2">{link}</div>
          <button
            onClick={copyLink}
            className={`w-full py-2 rounded-lg text-sm font-bold transition ${
              copied
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
            }`}
          >
            {copied ? '✓ Copiado!' : '📋 Copiar link'}
          </button>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(whatsappMsg)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] font-bold text-sm hover:bg-[#25D366]/30 transition"
          >
            <span className="text-xl">💬</span> WhatsApp
          </a>
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(telegramMsg)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0088cc]/20 border border-[#0088cc]/40 text-[#0088cc] font-bold text-sm hover:bg-[#0088cc]/30 transition"
          >
            <span className="text-xl">✈️</span> Telegram
          </a>
        </div>

        {/* Quick text */}
        <div className="bg-slate-800/40 rounded-xl p-3 border border-white/5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-wide">Texto pronto</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(whatsappMsg.replace(/\*/g, ''));
                toast.success('Texto copiado!');
              }}
              className="text-[10px] text-emerald-400 hover:underline"
            >Copiar texto</button>
          </div>
          <p className="text-xs text-slate-400 whitespace-pre-line leading-relaxed">{whatsappMsg.replace(/\*/g, '')}</p>
        </div>
      </div>
    </div>
  );
}
