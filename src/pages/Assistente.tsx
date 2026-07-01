import { useEffect, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import ReactMarkdown from 'react-markdown';
import { Header } from '../components/Header';
import { chatOpenAI } from '../lib/assistente.functions';
import { Bot, Send, Loader2, User, Trash2 } from 'lucide-react';

type Msg = { role: 'user' | 'assistant'; content: string };

export function Assistente() {
  const chat = useServerFn(chatOpenAI);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [loading]);

  const enviar = async () => {
    const texto = input.trim();
    if (!texto || loading) return;
    setErro(null);
    const novas: Msg[] = [...messages, { role: 'user', content: texto }];
    setMessages(novas);
    setInput('');
    setLoading(true);
    try {
      const r = await chat({ data: { messages: novas } });
      setMessages([...novas, { role: 'assistant', content: r.content }]);
    } catch (e: any) {
      setErro(e?.message || 'Erro ao consultar o assistente');
      setMessages(novas);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <Header titulo="Assistente IA" subtitulo="Chat inteligente com OpenAI" />
      <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-4 gap-4">
        <div className="flex justify-end">
          <button
            onClick={() => { setMessages([]); setErro(null); }}
            disabled={loading || messages.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg border border-slate-700"
          >
            <Trash2 size={14} /> Nova conversa
          </button>
        </div>

        <div className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-4 overflow-y-auto space-y-4 min-h-[50vh]">
          {messages.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 gap-3 py-16">
              <div className="p-4 rounded-full bg-blue-600/20">
                <Bot className="h-10 w-10 text-blue-400" />
              </div>
              <p className="text-white font-medium">Como posso ajudar?</p>
              <p className="text-sm max-w-md">Pergunte sobre orçamentos, descrições de produtos, textos de e-mail para clientes ou qualquer dúvida do dia a dia.</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-blue-400" />
                </div>
              )}
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : 'bg-slate-700 text-slate-100 rounded-tl-sm'
              }`}>
                {m.role === 'assistant' ? (
                  <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-pre:bg-slate-900 prose-pre:text-xs">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{m.content}</div>
                )}
              </div>
              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-slate-200" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center">
                <Bot size={16} className="text-blue-400" />
              </div>
              <div className="bg-slate-700 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2 text-slate-300 text-sm">
                <Loader2 size={14} className="animate-spin" /> Pensando...
              </div>
            </div>
          )}

          {erro && (
            <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
              {erro}
            </div>
          )}

          <div ref={endRef} />
        </div>

        <div className="flex gap-2 items-end bg-slate-800 border border-slate-700 rounded-lg p-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Escreva sua mensagem..."
            rows={1}
            className="flex-1 bg-transparent text-white placeholder-slate-500 resize-none px-3 py-2 focus:outline-none max-h-40"
            disabled={loading}
          />
          <button
            onClick={enviar}
            disabled={loading || !input.trim()}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}