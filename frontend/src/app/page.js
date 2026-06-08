"use client";
import { useRouter } from 'next/navigation';
import { Activity } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  
  return (
    <div className="flex h-screen items-center justify-center bg-slate-100">
      <div className="p-10 bg-white rounded-xl shadow-lg w-full max-w-md border border-slate-200 flex flex-col items-center">
        <div className="bg-blue-100 p-4 rounded-full mb-4">
          <Activity size={32} className="text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2 text-center">Gestão BEQV</h1>
        <p className="text-slate-500 mb-8 text-center text-sm">Painel Analítico de Gêmeos Digitais e ESG (Acesso Restrito)</p>
        
        <button onClick={() => router.push('/dashboard')} className="w-full bg-blue-600 hover:bg-blue-700 transition-colors text-white font-semibold py-3 px-4 rounded-lg shadow-sm">
          Entrar no Dashboard
        </button>
      </div>
    </div>
  );
}
