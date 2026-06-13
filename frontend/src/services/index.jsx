import React from 'react';
import SemanticScatterChart from '../../components/charts/SemanticScatterChart';
import RadarChartComponent from '../../components/charts/RadarChartComponent';

export default function DashboardPreditivo() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Plataforma Analítica Preditiva</h1>
        <p className="text-gray-500 mt-2">
          Monitoramento anonimizado de Gêmeos Digitais Organizacionais baseados em similaridade semântica.
        </p>
      </header>

      {/* Mensagem de Erro de Conexão na Tela */}
      {errorMsg && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <strong className="font-bold">Aviso de Conexão: </strong>
          <span className="block sm:inline">{errorMsg}</span>
        </div>
      )}

      {/* Alerta de IA Estratégico (Simulando o output gerado na Fase 2) */}
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-md shadow-sm">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-red-500 text-xl">⚠️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Alerta Preditivo Sistêmico (IA BEQV)</h3>
            <div className="mt-1 text-sm text-red-700">
              <p>O Gêmeo Organizacional <strong>"Lideranças Intermediárias Sobrecarregadas"</strong> possui probabilidade de 72% de desenvolver Burnout coletivo nos próximos 3 meses. <br/>Ação sugerida pela IA: Redistribuição de carga ou bloqueio de agenda de 2h/semana sem reuniões.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Principal dos Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Esquerda: Mapa Vetorial Preditivo */}
        <SemanticScatterChart />
        
        {/* Direita: Radar dos Eixos ESG */}
        <RadarChartComponent />
      </div>

      {/* Tabela Rápida de Ações de Melhoria Corporativa */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Eficácia das Sugestões da IA</h3>
        <p className="text-sm text-gray-500 italic">
          * O componente do Gráfico de Barras e Mapa de Calor (Heatmap) podem ser adicionados aqui nas próximas iterações.
        </p>
        {/* Futuro componente de barras irá aqui */}
      </div>
    </div>
  );
}