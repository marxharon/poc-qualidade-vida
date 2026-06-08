"use client";
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import RadarChartComponent from '../../components/charts/RadarChartComponent';
import LineChartComponent from '../../components/charts/LineChartComponent';
import { ShieldAlert, TrendingUp, Users } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Busca os dados consolidados pelo Motor de IA do backend
    api.get('/dashboard').then(res => setData(res.data)).catch(console.error);
  }, []);

  if (!data) return <div className="flex h-screen items-center justify-center"><p className="text-lg text-gray-500 animate-pulse">Anonimizando e carregando Gêmeos Organizacionais...</p></div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-800">Plataforma Analítica BEQV</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2"><ShieldAlert size={16}/> Dados estritamente anonimizados em conformidade com a LGPD.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gráfico 1: Radar de Aderência ESG */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="font-bold text-lg mb-6 text-slate-700 flex items-center gap-2"><Users size={20} className="text-blue-500"/> Mapeamento dos 10 Eixos ESG (Radar)</h2>
            <RadarChartComponent data={data} />
          </div>

          {/* Gráfico 2: Linha de Tendência */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="font-bold text-lg mb-6 text-slate-700 flex items-center gap-2"><TrendingUp size={20} className="text-emerald-500"/> Evolução Preditiva e Engajamento</h2>
            <LineChartComponent data={data} />
          </div>
        </div>

        {/* Aba de Sugestões Estratégicas para o Gestor (Item 2.2 do Framework) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="font-bold text-lg mb-4 text-slate-700">Sugestões Estratégicas da IA por Agrupamento</h2>
          <ul className="space-y-3">
            {data.historico.slice(0, 5).map((hist, idx) => (
              <li key={idx} className="p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-lg text-slate-700 text-sm font-medium">{hist.sugestao_estrategica_ia}</li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}