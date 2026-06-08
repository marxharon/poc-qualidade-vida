"use client";
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function LineChartComponent({ data }) {
  // Como a POC tem apenas 1 fotografia de tempo (o último Analista IA rodado), 
  // vamos simular as 3 semanas anteriores para visualizarmos a predição da tendência
  const chartData = [
    { semana: 'Semana 1', saude: 65, engajamento: 60 },
    { semana: 'Semana 2', saude: 70, engajamento: 65 },
    { semana: 'Semana 3', saude: 75, engajamento: 72 },
    { semana: 'Atual', saude: data?.historico[0]?.pontuacao_agregada || 80, engajamento: data?.historico[1]?.pontuacao_agregada || 85 },
  ];

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="semana" tick={{ fill: '#6b7280' }} />
        <YAxis domain={[0, 100]} tick={{ fill: '#6b7280' }} />
        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
        <Legend />
        <Line type="monotone" dataKey="saude" stroke="#ef4444" strokeWidth={3} name="Saúde Mental (Agregada)" dot={{ r: 5 }} />
        <Line type="monotone" dataKey="engajamento" stroke="#3b82f6" strokeWidth={3} name="Engajamento Geral" dot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}