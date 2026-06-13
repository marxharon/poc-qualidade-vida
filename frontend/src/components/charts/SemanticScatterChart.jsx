import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';

// Dados simulados baseados na saída do nosso ia-service (Fase 2)
const defaultData = [
  { nome: 'Desenvolvedores em Isolamento', risco_burnout: 65, engajamento: 40, volume: 120, fill: '#f59e0b' },
  { nome: 'Lideranças Sobrecarregadas', risco_burnout: 85, engajamento: 30, volume: 45, fill: '#ef4444' },
  { nome: 'Novos Talentos Engajados', risco_burnout: 20, engajamento: 95, volume: 80, fill: '#10b981' },
  { nome: 'Operacional Estagnado', risco_burnout: 50, engajamento: 55, volume: 200, fill: '#6366f1' },
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 border border-gray-200 shadow-lg rounded-md">
        <p className="font-bold text-gray-800">{data.nome}</p>
        <p className="text-sm text-gray-600">Volume (Gêmeos): {data.volume} pessoas</p>
        <p className="text-sm text-red-600 font-semibold mt-2">Alerta Preditivo da IA:</p>
        <p className="text-xs text-gray-500 max-w-xs">
          {data.risco_burnout > 70 
            ? "Deslocando rapidamente para quadrante de Risco de Afastamento. Ação imediata necessária."
            : "Estável. Mantenha as políticas atuais de bem-estar."}
        </p>
      </div>
    );
  }
  return null;
};

export default function SemanticScatterChart({ customData }) {
  // Usa os dados reais vindos da API. Se for vazio, exibe o fallback simulado
  const chartData = customData && customData.length > 0 ? customData : defaultData;

  return (
    <div className="w-full h-80 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Mapa Vetorial: Deslocamento de Risco Preditivo</h3>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          {/* Eixo X: Nível de risco previsto pela IA */}
          <XAxis type="number" dataKey="risco_burnout" name="Risco Futuro" domain={[0, 100]} label={{ value: "Risco Comportamental (Predição)", position: "insideBottom", offset: -10 }} />
          {/* Eixo Y: Nível atual de engajamento */}
          <YAxis type="number" dataKey="engajamento" name="Engajamento" domain={[0, 100]} label={{ value: "Engajamento Atual", angle: -90, position: "insideLeft" }} />
          {/* ZAxis define o tamanho da bolha baseado na quantidade de pessoas no Gêmeo Organizacional */}
          <ZAxis type="number" dataKey="volume" range={[100, 1000]} name="Volume" />
          <Tooltip content={<CustomTooltip />} />
          {/* Área de Risco Crítico em Vermelho Claro */}
          <ReferenceArea x1={70} x2={100} y1={0} y2={50} fill="#fee2e2" opacity={0.5} />
          <Scatter name="Gêmeos Organizacionais" data={chartData} fill="#8884d8" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}