import React from 'react';

interface HeaderProps {
  titulo: string;
  subtitulo?: string;
}

export function Header({ titulo, subtitulo }: HeaderProps) {
  return (
    <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
      <h1 className="text-2xl font-bold text-white">{titulo}</h1>
      {subtitulo && <p className="text-slate-400 mt-1">{subtitulo}</p>}
    </header>
  );
}
