import React from 'react';

// Dados simulados baseados no cruzamento de vetores anômalos da IA
const heatmapData = [
  { departamento: 'Tecnologia', eixos: [ { nome: 'Burnout', nivel: 'alto' }, { nome: 'Isolamento', nivel: 'medio' }, { nome: 'Sedentarismo', nivel: 'alto' }, { nome: 'Conflitos', nivel: 'baixo' } ] },
  { departamento: 'Operações', eixos: [ { nome: 'Burnout', nivel: 'medio' }, { nome: 'Isolamento', nivel: 'baixo' }, { nome: 'Sedentarismo', nivel: 'alto' }, { nome: 'Conflitos', nivel: 'medio' } ] },
  { departamento: 'Vendas', eixos: [ { nome: 'Burnout', nivel: 'alto' }, { nome: 'Isolamento', nivel: 'baixo' }, { nome: 'Sedentarismo', nivel: 'medio' }, { nome: 'Conflitos', nivel: 'baixo' } ] },
  { departamento: 'Recursos Humanos', eixos: [ { nome: 'Burnout', nivel: 'baixo' }, { nome: 'Isolamento', nivel: 'baixo' }, { nome: 'Sedentarismo', nivel: 'baixo' }, { nome: 'Conflitos', nivel: 'baixo' } ] },
];

const getBgColor = (nivel) => {
  if (nivel === 'alto') return 'bg-red-500';
  if (nivel === 'medio') return 'bg-yellow-400';
  return 'bg-green-400';
};

export default function HeatmapChartComponent() {
  return (
    <div className="w-full bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-700 mb-1">Mapa de Calor (Heatmap) de Riscos</h3>
      <p className="text-sm text-gray-500 mb-6">Concentração de anomalias emergentes por departamento.</p>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr>
              <th className="py-2 px-4 text-gray-600 font-medium">Departamento</th>
              {heatmapData[0].eixos.map((eixo, i) => (
                <th key={i} className="py-2 px-4 text-gray-600 font-medium text-center">{eixo.nome}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heatmapData.map((row, i) => (
              <tr key={i} className="border-t border-gray-50">
                <td className="py-3 px-4 font-medium text-gray-800">{row.departamento}</td>
                {row.eixos.map((eixo, j) => (
                  <td key={j} className="py-3 px-4">
                    <div className={`h-8 w-full rounded-md flex items-center justify-center text-xs text-white shadow-sm font-semibold ${getBgColor(eixo.nivel)}`}>
                      {eixo.nivel === 'alto' && 'Crítico'}
                      {eixo.nivel === 'medio' && 'Alerta'}
                      {eixo.nivel === 'baixo' && 'Saudável'}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}