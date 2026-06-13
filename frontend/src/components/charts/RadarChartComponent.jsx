import React, { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const data = [
  { eixo: 'Saúde Física', atual: 75, ideal: 90 },
  { eixo: 'Saúde Mental', atual: 55, ideal: 85 },
  { eixo: 'Clima & Engajam.', atual: 80, ideal: 85 },
  { eixo: 'Equilíbrio Vida/Trab.', atual: 60, ideal: 90 },
  { eixo: 'Segurança Ocupac.', atual: 95, ideal: 100 },
  { eixo: 'Diversidade & Inclusão', atual: 70, ideal: 95 },
  { eixo: 'Crescimento Profis.', atual: 65, ideal: 80 },
  { eixo: 'Reconhecimento', atual: 50, ideal: 85 },
  { eixo: 'Relações Interpes.', atual: 85, ideal: 90 },
  { eixo: 'Segurança Psicológ.', atual: 60, ideal: 95 },
];

export default function RadarChartComponent() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  return (
    <div className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-700 mb-2">Adesão Global aos 10 Eixos ESG</h3>
      <div style={{ width: '100%', height: 300 }}>
        {isClient && (
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
        )}
      </div>
    </div>
  );
}