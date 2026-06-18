import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Simulação dos dados de feedback vindos das interações diárias
const mockFeedbackData = [
  { cluster: 'Devs Isolados', Boa: 75, Indiferente: 15, Ruim: 10 },
  { cluster: 'Líderes', Boa: 50, Indiferente: 30, Ruim: 20 },
  { cluster: 'Novos Talentos', Boa: 90, Indiferente: 5, Ruim: 5 },
];

export default function EffectivenessBarChartComponent() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  return (
    <div className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-700 mb-1">Eficácia das Ações Preventivas (IA)</h3>
      <p className="text-sm text-gray-500 mb-4">Nível de adesão e feedback dos colaboradores por cluster</p>
      <div style={{ width: '100%', height: 300 }}>
        {isClient && (
          <ResponsiveContainer width="99%" height={300}>
            <BarChart data={mockFeedbackData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="cluster" type="category" tick={{ fontSize: 11 }} width={90} />
              <Tooltip cursor={{ fill: 'transparent' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Boa" stackId="a" fill="#10b981" name="Sugestão Útil" />
              <Bar dataKey="Indiferente" stackId="a" fill="#fbbf24" name="Indiferente" />
              <Bar dataKey="Ruim" stackId="a" fill="#ef4444" name="Não ajudou" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}