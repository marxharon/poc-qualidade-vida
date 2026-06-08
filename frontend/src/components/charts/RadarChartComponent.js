"use client";
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function RadarChartComponent({ data }) {
  // Transforma os dados do PostgreSQL para o formato esperado pelo gráfico
  const chartData = data?.eixos?.map(eixo => {
    const historicoDoEixo = data.historico.find(h => h.id_eixo === eixo.id_eixo);
    return {
      subject: eixo.nome.substring(0, 15) + "...", // Encurta o nome para caber no gráfico
      EstadoAtual: historicoDoEixo ? historicoDoEixo.pontuacao_agregada : 50, // Pega a pontuação do banco
      EstadoIdeal: 100 // Meta da organização
    };
  }) || [];

  return (
    <ResponsiveContainer width="100%" height={350}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 12 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} />
        <Radar name="Meta ESG (Ideal)" dataKey="EstadoIdeal" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
        <Radar name="Agrupamento (Atual)" dataKey="EstadoAtual" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
}