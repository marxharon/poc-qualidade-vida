import React, { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function RadarChartComponent({ data }) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  return (
    <div className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-700 mb-2">Adesão Global aos 10 Eixos ESG</h3>
      <div style={{ width: '100%', height: 300 }}>
        {isClient && data && data.length > 0 ? (
          <ResponsiveContainer width="99%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid opacity={0.5} />
              <PolarAngleAxis dataKey="eixo" tick={{ fill: '#4b5563', fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
              <Radar name="Estado Atual (Empresa)" dataKey="atual" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
              <Radar name="Meta Ideal ESG" dataKey="ideal" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">Carregando dados da base ESG...</div>
        )}
      </div>
    </div>
  );
}