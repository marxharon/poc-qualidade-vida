"use client";
import { useEffect, useState, useMemo } from 'react';
import { api } from '../../services/api';
import RadarChartComponent from '../../components/charts/RadarChartComponent';
import LineChartComponent from '../../components/charts/LineChartComponent';
import { ShieldAlert, TrendingUp, Users } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [selectedMonthYear, setSelectedMonthYear] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [activeTab, setActiveTab] = useState('agrupamento');

  useEffect(() => {
    // Busca os dados consolidados pelo Motor de IA do backend
    api.get('/dashboard').then(res => setData(res.data)).catch(console.error);
  }, []);

  const availableMonths = useMemo(() => {
    if (!data) return [];
    const months = new Set();
    const addDate = (dateStr) => {
      if (!dateStr) return;
      const d = new Date(dateStr);
      months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    };
    data.historico?.forEach(h => addDate(h.data_medicao));
    data.interacoes?.forEach(i => addDate(i.data_interacao));
    months.add(selectedMonthYear);
    return Array.from(months).sort().reverse();
  }, [data, selectedMonthYear]);

  const filteredData = useMemo(() => {
    if (!data) return null;
    const [year, month] = selectedMonthYear.split('-');
    
    const filterByDate = (dateStr) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d.getFullYear() === parseInt(year) && (d.getMonth() + 1) === parseInt(month);
    };

    return {
      ...data,
      historico: data.historico.filter(h => filterByDate(h.data_medicao)),
      interacoes: data.interacoes.filter(i => filterByDate(i.data_interacao))
    };
  }, [data, selectedMonthYear]);

  if (!filteredData) return <div className="flex h-screen items-center justify-center"><p className="text-lg text-gray-500 animate-pulse">Anonimizando e carregando Gêmeos Organizacionais...</p></div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-800">Plataforma Analítica BEQV</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2"><ShieldAlert size={16}/> Dados estritamente anonimizados em conformidade com a LGPD.</p>
        </header>

        <div className="mb-6 flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <label className="font-semibold text-slate-700">Filtrar Histórico de Evolução por Mês/Ano:</label>
          <select 
            className="border border-slate-300 rounded-md p-2 text-slate-700 outline-none focus:border-blue-500"
            value={selectedMonthYear} 
            onChange={(e) => setSelectedMonthYear(e.target.value)}
          >
            {availableMonths.map(m => {
              const [y, mo] = m.split('-');
              return <option key={m} value={m}>{`${mo}/${y}`}</option>;
            })}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gráfico 1: Radar de Aderência ESG */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="font-bold text-lg mb-6 text-slate-700 flex items-center gap-2"><Users size={20} className="text-blue-500"/> Mapeamento dos 10 Eixos ESG (Radar)</h2>
            <RadarChartComponent data={filteredData} />
          </div>

          {/* Gráfico 2: Linha de Tendência */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="font-bold text-lg mb-6 text-slate-700 flex items-center gap-2"><TrendingUp size={20} className="text-emerald-500"/> Evolução Preditiva e Engajamento</h2>
            <LineChartComponent data={filteredData} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex border-b border-slate-200 mb-4">
            <button 
              className={`py-2 px-4 font-bold text-sm focus:outline-none ${activeTab === 'agrupamento' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('agrupamento')}
            >
              Sugestões por Agrupamento
            </button>
            <button 
              className={`py-2 px-4 font-bold text-sm focus:outline-none ${activeTab === 'eixo' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('eixo')}
            >
              Visão por Eixo ESG
            </button>
          </div>

          {activeTab === 'agrupamento' && (
            <ul className="space-y-3">
              {filteredData.historico.length > 0 ? (
                filteredData.historico.slice(0, 5).map((hist, idx) => (
                  <li key={idx} className="p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-lg text-slate-700 text-sm font-medium">{hist.sugestao_estrategica_ia}</li>
                ))
              ) : (
                <li className="p-4 bg-slate-50 rounded-lg text-slate-500 text-sm italic">Nenhuma sugestão registrada para o período selecionado.</li>
              )}
            </ul>
          )}

          {activeTab === 'eixo' && (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {filteredData.eixos.map(eixo => {
                // Filtra as interações por eixo (já filtrado pelo mês na raiz)
                const interacoesDoEixo = filteredData.interacoes?.filter(i => i.id_eixo === eixo.id_eixo) || [];

                const personasUnicas = new Set(interacoesDoEixo.map(i => i.id_persona)).size;
                const historicoEixo = filteredData.historico.filter(h => h.id_eixo === eixo.id_eixo);
                
                // Extrai nome das categorias e sugestões de IA de forma não repetida
                const categoriasIds = new Set(historicoEixo.map(h => h.id_agrupamento));
                const categoriasNomes = Array.from(categoriasIds).map(id => filteredData.grupos.find(g => g.id_agrupamento === id)?.nome_categoria).filter(Boolean).join(', ');
                const sugestoes = Array.from(new Set(historicoEixo.map(h => h.sugestao_estrategica_ia)));

                return (
                  <div key={eixo.id_eixo} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <h3 className="font-bold text-slate-800 text-md mb-2">{eixo.nome}</h3>
                    <div className="text-sm text-slate-600 mb-1"><span className="font-semibold text-slate-700">Personas engajadas no mês:</span> {personasUnicas}</div>
                    {categoriasNomes && (<div className="text-sm text-slate-600 mb-1"><span className="font-semibold text-slate-700">Categorias classificadas:</span> {categoriasNomes}</div>)}
                    {sugestoes.length > 0 ? (
                      <div className="text-sm text-slate-600 mt-2">
                        <span className="font-semibold text-slate-700">Sugestões da IA:</span>
                        <ul className="list-disc pl-5 mt-1 space-y-1">{sugestoes.map((s, i) => <li key={i}>{s}</li>)}</ul>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500 italic mt-2">Nenhuma sugestão para este eixo no período.</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}