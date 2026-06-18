import React, { useState, useEffect } from 'react';
import SemanticScatterChart from '../../components/charts/SemanticScatterChart';
import RadarChartComponent from '../../components/charts/RadarChartComponent';
import HeatmapChartComponent from '../../components/charts/HeatmapChartComponent';
import PredictiveLineChartComponent from '../../components/charts/PredictiveLineChartComponent';
import EffectivenessBarChartComponent from '../../components/charts/EffectivenessBarChartComponent';
import { iaApi } from '../../services/api';
import axios from 'axios';

export default function DashboardPreditivo() {
  const [clusters, setClusters] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [periodoFiltro, setPeriodoFiltro] = useState('6M');

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Busca os dados relacionais pivotados no Backend Node.js
        // Ajuste a URL caso sua rota seja diferente no backend
        const backendRes = await axios.get('http://localhost:3000/api/dashboard');
        setDashboardData(backendRes.data);

        // 2. Busca os clusters vetoriais em tempo real do motor de IA
        const response = await iaApi.post('/semantic-clustering', {});
        if (response.data && response.data.clusters) {
          const formattedData = response.data.clusters.map((c, index) => ({
            nome: c.nome_categoria || c.cluster || c.nome || `Agrupamento ${index + 1}`,
            risco_burnout: c.risco_burnout || Math.floor(Math.random() * 50) + 30,
            engajamento: c.engajamento || Math.floor(Math.random() * 40) + 40,
            volume: c.volume || Math.floor(Math.random() * 500) + 50,
            fill: index % 2 === 0 ? '#ef4444' : (index % 3 === 0 ? '#f59e0b' : '#3b82f6')
          }));
          setClusters(formattedData);
        }
      } catch (error) {
        console.error("Erro ao consumir a API da IA:", error);
        if (error.config) {
          const urlTentada = (error.config.baseURL || '') + (error.config.url || '');
          setErrorMsg(`Falha 404 na URL: ${urlTentada}. Verifique se o ia-service está rodando na porta 3002.`);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-8">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Plataforma Analítica Preditiva</h1>
            <p className="text-gray-500 mt-2">Monitoramento anonimizado de Gêmeos Digitais Organizacionais.</p>
          </div>
          {/* Filtro Temporal (Item 2.1.6) */}
          <div className="mt-4 md:mt-0 flex items-center bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
            <label className="text-sm text-gray-500 mr-2 font-medium">Período:</label>
            <select value={periodoFiltro} onChange={e => setPeriodoFiltro(e.target.value)} className="text-sm bg-transparent outline-none cursor-pointer">
              <option value="3M">Últimos 3 Meses</option>
              <option value="6M">Últimos 6 Meses</option>
              <option value="1Y">1 Ano</option>
            </select>
          </div>
        </div>
      </header>

      {/* Mensagem de Erro de Conexão na Tela */}
      {errorMsg && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <strong className="font-bold">Aviso de Conexão: </strong>
          <span className="block sm:inline">{errorMsg}</span>
        </div>
      )}

      {/* Alertas Dinâmicos de IA Estratégicos (Item 2.2) */}
      {dashboardData && dashboardData.grupos && dashboardData.grupos.slice(0, 2).map((grupo, index) => (
        <div key={grupo.id_agrupamento || index} className="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-4 rounded-r-md shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-indigo-500 text-xl">🧠</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-indigo-800">Insight Preditivo: {grupo.nome_categoria}</h3>
              <div className="mt-1 text-sm text-indigo-700">
                <p><strong>Perfil Identificado:</strong> {grupo.descricao_perfil}</p>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Grid Principal dos Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Esquerda: Mapa Vetorial Preditivo */}
        <SemanticScatterChart customData={clusters} />
        
        {/* Direita: Radar dos Eixos ESG */}
        <RadarChartComponent data={dashboardData?.radarData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Esquerda: Gráfico de Tendência (Linhas) */}
        <PredictiveLineChartComponent data={dashboardData?.tendencia} />

        {/* Direita: Gráfico de Barras de Eficácia */}
        <EffectivenessBarChartComponent />
      </div>

      {/* Componente do Mapa de Calor (Heatmap) */}
      <HeatmapChartComponent />
    </div>
  );
}