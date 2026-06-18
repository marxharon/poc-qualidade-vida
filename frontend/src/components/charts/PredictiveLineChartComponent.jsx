import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea } from 'recharts';

export default function PredictiveLineChartComponent({ data }) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  if (!data || data.length === 0) {
    return <div className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center h-80 text-gray-400">Carregando tendências preditivas...</div>;
  }

  // Extrai dinamicamente os nomes dos clusters (Gêmeos Organizacionais) para gerar as linhas
  const clustersNames = Object.keys(data[0]).filter(key => key !== 'mes' && key !== 'isProjecao');
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-700 mb-1">Tendência Preditiva Longitudinal</h3>
      <p className="text-sm text-gray-500 mb-4">Evolução do engajamento e simulação futura (Monte Carlo)</p>
      <div style={{ width: '100%', height: 300 }}>
        {isClient && (
          <ResponsiveContainer width="99%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '8px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              {/* Cria uma área destacada caso existam meses que sejam marcados como projeção pela IA */}
              <ReferenceArea x1={data.find(d => d.isProjecao)?.mes} strokeOpacity={0.3} fill="#f3f4f6" />
              {clustersNames.map((cluster, index) => (
                <Line key={cluster} type="monotone" dataKey={cluster} stroke={colors[index % colors.length]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}