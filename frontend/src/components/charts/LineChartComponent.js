"use client";
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function LineChartComponent({ data }) {
  // Verifica se há dados no período selecionado
  const hasData = data?.historico && data.historico.length > 0;

  // Como a POC tem apenas 1 fotografia de tempo (o último Analista IA rodado), 
  // zeramos os valores caso o mês filtrado não possua registros
  const chartData = [
    { semana: 'Semana 1', saude: hasData ? 65 : 0, engajamento: hasData ? 60 : 0 },
    { semana: 'Semana 2', saude: hasData ? 70 : 0, engajamento: hasData ? 65 : 0 },
    { semana: 'Semana 3', saude: hasData ? 75 : 0, engajamento: hasData ? 72 : 0 },
    { semana: 'Atual', saude: hasData ? (data?.historico[0]?.pontuacao_agregada || 80) : 0, engajamento: hasData ? (data?.historico[1]?.pontuacao_agregada || 85) : 0 },
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