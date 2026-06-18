"use client";
import React, { useEffect, useState, useMemo } from 'react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar
} from 'recharts';

// Otimização Global: Utilitário super rápido para substituir toLocaleString() que causava travamentos em arrays longos
const formatMonthYear = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const meses = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
    return `${meses[d.getMonth()]} ${d.getFullYear()}`;
};

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState('Todos');

    useEffect(() => {
        // Realiza o fetch para o endpoint do backend. 
        // Ajuste a rota se a sua API estiver em outro caminho ou utilize o axios se preferir.
        fetch('http://localhost:3000/api/dashboard')
            .then(res => {
                if (!res.ok) throw new Error('Falha na rede ao buscar dados.');
                return res.json();
            })
            .then(resData => {
                setData(resData);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError('Erro ao carregar os dados do dashboard.');
                setLoading(false);
            });
    }, []);

    // Extrai os meses disponíveis para o filtro
    const months = useMemo(() => {
        if (!data?.historico) return [];
        const m = new Set(data.historico.map(h => formatMonthYear(h.data_medicao)));
        return Array.from(m);
    }, [data]);

    // Filtra o histórico com base no mês selecionado
    const filteredHistorico = useMemo(() => {
        if (!data?.historico) return [];
        if (selectedMonth === 'Todos') return data.historico;
        return data.historico.filter(h => formatMonthYear(h.data_medicao) === selectedMonth);
    }, [data, selectedMonth]);

    // Filtra as interações (para o Gráfico de Barras) com base no mês selecionado
    const filteredInteracoes = useMemo(() => {
        if (!data?.interacoes) return [];
        if (selectedMonth === 'Todos') return data.interacoes;
        return data.interacoes.filter(i => formatMonthYear(i.data_interacao) === selectedMonth);
    }, [data, selectedMonth]);

    // Otimização: Mapa de personas únicas por Eixo e Mês para evitar lentidão extrema na renderização
    const uniquePersonasMap = useMemo(() => {
        if (!data?.interacoes) return {};
        const map = {};
        data.interacoes.forEach(inter => {
            const key = `${formatMonthYear(inter.data_interacao)}-${inter.id_eixo}`;
            if (!map[key]) {
                map[key] = new Set();
            }
            map[key].add(inter.id_persona);
        });
        const finalMap = {};
        for (const key in map) finalMap[key] = map[key].size;
        return finalMap;
    }, [data]);

    // Recalcula os dados do Gráfico de Radar
    const chartRadarData = useMemo(() => {
        if (!data?.eixos || !data?.historico) return [];
        const hist = selectedMonth === 'Todos' ? data.historico : filteredHistorico;
        return data.eixos.map(eixo => {
            const historicoEixo = hist.filter(h => h.id_eixo === eixo.id_eixo);
            const mediaAtual = historicoEixo.length > 0 
                ? Math.round(historicoEixo.reduce((acc, curr) => acc + curr.pontuacao_agregada, 0) / historicoEixo.length)
                : 70;
            return { eixo: eixo.nome, atual: mediaAtual, ideal: 90 };
        });
    }, [data, filteredHistorico, selectedMonth]);

    // Recalcula os dados do Gráfico de Barras (Eficácia das Sugestões)
    const chartFeedbackData = useMemo(() => {
        if (!data?.interacoes) return [];
        const interacoes = selectedMonth === 'Todos' ? data.interacoes : filteredInteracoes;
        const feedbackCounts = interacoes.reduce((acc, curr) => {
            const feedback = curr.feedback_sugestao || 'Indiferente';
            acc[feedback] = (acc[feedback] || 0) + 1;
            return acc;
        }, {});
        return [
            { name: 'Boa', value: feedbackCounts.Boa || 0 },
            { name: 'Indiferente', value: feedbackCounts.Indiferente || 0 },
            { name: 'Ruim', value: feedbackCounts.Ruim || 0 },
        ];
    }, [data, filteredInteracoes, selectedMonth]);

    // Recalcula os dados do Mapa de Calor (Heatmap)
    const chartHeatmapData = useMemo(() => {
        if (!data?.grupos || !data?.eixos || !data?.historico) return [];
        const hist = selectedMonth === 'Todos' ? data.historico : filteredHistorico;
        const heatmap = [];
        data.grupos.forEach(grupo => {
            data.eixos.forEach(eixo => {
                const historicoGrupoEixo = hist.filter(h => 
                    h.id_agrupamento === grupo.id_agrupamento && h.id_eixo === eixo.id_eixo
                );
                // Cria um clone ([...historico]) para não mutar os dados originais no filtro com o `.sort()`
                const lastScore = [...historicoGrupoEixo].sort((a, b) => new Date(b.data_medicao).getTime() - new Date(a.data_medicao).getTime())[0];
                heatmap.push({
                    grupo: grupo.nome_categoria,
                    eixo: eixo.nome,
                    valor: lastScore ? lastScore.pontuacao_agregada : 0
                });
            });
        });
        return heatmap;
    }, [data, filteredHistorico, selectedMonth]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 text-xl text-gray-500">
                Analisando Gêmeos Organizacionais...
            </div>
        );
    }

    if (error || !data) {
        return <div className="p-8 text-center text-red-500">{error || "Nenhum dado encontrado"}</div>;
    }

    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

    return (
        <div className="min-h-screen bg-gray-50 p-4 lg:p-8 font-sans text-gray-800">
            <header className="mb-8 flex flex-col lg:flex-row lg:justify-between lg:items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Plataforma Analítica do Gestor</h1>
                    <div className="flex items-center mt-2">
                        <p className="text-gray-600">Visão Preditiva e Dinâmica de Gêmeos Organizacionais (V2)</p>
                        <div className="relative flex items-center group cursor-help ml-2">
                            <svg className="w-5 h-5 text-gray-400 hover:text-blue-500 transition-colors" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path></svg>
                            <div className="absolute top-full left-0 mt-2 hidden group-hover:block w-80 p-3 bg-gray-800 text-white text-xs rounded shadow-lg z-50 leading-relaxed">
                                <span className="font-bold">Gêmeos Organizacionais</span> são clusters comportamentais gerados organicamente pela IA via similaridade vetorial. Eles agrupam colaboradores com sentimentos, rotinas e personalidades parecidas de forma totalmente anonimizada, permitindo ao gestor identificar tendências de grupo sem expor o indivíduo.
                            </div>
                        </div>
                    </div>
                </div>
                {/* NOVO: Dropdown do Filtro Mensal */}
                <div className="mt-4 lg:mt-0 flex items-center space-x-3 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                    <label htmlFor="monthFilter" className="text-gray-700 font-semibold text-sm">Filtro Mensal:</label>
                    <select id="monthFilter" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none">
                        <option value="Todos">Todos os Meses</option>
                        {months.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 2.1.3 Gráfico de Radar: Atual vs Ideal */}
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                    <div className="flex justify-center items-center mb-4">
                        <h2 className="text-xl font-semibold text-center">Adesão aos Eixos ESG vs Estado Ideal</h2>
                        <div className="relative flex items-center group cursor-help ml-2">
                            <svg className="w-5 h-5 text-gray-400 hover:text-blue-500 transition-colors" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path></svg>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-3 bg-gray-800 text-white text-xs rounded shadow-lg z-50 text-center leading-relaxed">
                                Indica a média atual de adesão dos colaboradores a cada eixo ESG em comparação com a meta ideal definida pela organização (90%). Analise os eixos mais retraídos para direcionar novas campanhas corporativas.
                            </div>
                        </div>
                    </div>
                    <div className="w-full">
                        <ResponsiveContainer width="100%" height={320}>
                            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartRadarData}>
                                <PolarGrid />
                                {/* dataKey deve ser 'eixo' conforme enviado pelo backend */}
                                <PolarAngleAxis dataKey="eixo" tick={{ fill: '#4b5563', fontSize: 11 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                {/* dataKey deve ser 'atual' e 'ideal' */}
                                <Radar name="Estado Atual" dataKey="atual" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                                <Radar name="Meta (Ideal)" dataKey="ideal" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                                <Legend />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2.1.5 Gráfico de Barras: Adesão e Eficácia das Sugestões */}
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                    <div className="flex justify-center items-center mb-4">
                        <h2 className="text-xl font-semibold text-center">Eficácia das Sugestões Preditivas (IA)</h2>
                        <div className="relative flex items-center group cursor-help ml-2">
                            <svg className="w-5 h-5 text-gray-400 hover:text-blue-500 transition-colors" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path></svg>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-3 bg-gray-800 text-white text-xs rounded shadow-lg z-50 text-center leading-relaxed">
                                Mede o nível de aceitação das sugestões de bem-estar geradas pela IA. Analise se as orientações estão sendo bem recebidas pela equipe (Boa) ou se demandam ajuste de foco corporativo (Ruim/Indiferente).
                            </div>
                        </div>
                    </div>
                    <div className="w-full">
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={chartFeedbackData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} name="Qtd de Avaliações" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2.1.4 Mapa de Calor (Heatmap) Customizado */}
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100 lg:col-span-2 relative z-10">
                    <div className="flex justify-center items-center mb-4">
                        <h2 className="text-xl font-semibold text-center">Heatmap: Concentração de Anomalias por Grupo e Eixo</h2>
                        <div className="relative flex items-center group cursor-help ml-2">
                            <svg className="w-5 h-5 text-gray-400 hover:text-blue-500 transition-colors" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path></svg>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-80 p-3 bg-gray-800 text-white text-xs rounded shadow-lg z-50 text-center leading-relaxed">
                                Exibe a concentração analítica de riscos cruzando os clusters (Gêmeos Organizacionais) com os Eixos ESG. Tons de vermelho indicam zonas de alerta (menor saúde/engajamento) que demandam intervenção imediata da liderança.
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto pb-4">
                        <table className="w-full text-sm text-left text-gray-500 border-collapse">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                <tr>
                                    <th scope="col" className="px-4 py-3 border border-gray-200">
                                        <div className="flex items-center">
                                            Cluster Comportamental
                                            <div className="relative flex items-center group cursor-help ml-2">
                                                <svg className="w-4 h-4 text-gray-400 hover:text-blue-500 transition-colors" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path></svg>
                                                <div className="absolute top-full left-0 mt-2 hidden group-hover:block w-72 p-3 bg-gray-800 text-white text-xs rounded shadow-lg z-50 font-normal leading-relaxed normal-case">
                                                    Estes clusters não são fixos! Foram escolhidos organicamente pela IA utilizando similaridade vetorial matemática para identificar a proximidade entre os sentimentos e personalidades de toda a empresa, descobrindo padrões emergentes e não óbvios.
                                                </div>
                                            </div>
                                        </div>
                                    </th>
                                    {data.eixos?.map(eixo => (
                                        <th key={eixo.id_eixo} scope="col" className="px-2 py-3 text-center border border-gray-200 min-w-[100px]" title={eixo.nome}>
                                            {eixo.nome.substring(0, 15)}...
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.grupos?.map(grupo => (
                                    <tr key={grupo.id_agrupamento} className="bg-white">
                                        <th scope="row" className="px-4 py-3 font-medium text-gray-900 border border-gray-200">
                                            {grupo.nome_categoria}
                                        </th>
                                        {data.eixos?.map(eixo => {
                                            const point = chartHeatmapData?.find(h => h.grupo === grupo.nome_categoria && h.eixo === eixo.nome);
                                            const score = point ? point.valor : 0;
                                            
                                            // Definição de Cores de Risco (Heatmap)
                                            let bgColor = 'bg-gray-50';
                                            let textColor = 'text-gray-400';
                                            if (score > 0) {
                                                if (score >= 80) { bgColor = 'bg-emerald-100'; textColor = 'text-emerald-800'; }
                                                else if (score >= 60) { bgColor = 'bg-amber-100'; textColor = 'text-amber-800'; }
                                                else { bgColor = 'bg-rose-200'; textColor = 'text-rose-900'; }
                                            }
                                            
                                            return (
                                                <td key={eixo.id_eixo} className="p-1 border border-gray-200 text-center">
                                                    <div className={`w-full h-full py-2 rounded text-center font-bold transition-colors ${bgColor} ${textColor}`}>
                                                        {score > 0 ? `${score}%` : '-'}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* NOVO: Seção de Agrupamentos por Eixo dos Gêmeos Digitais */}
            <div className="mt-12">
                <div className="flex items-center mb-6 border-b pb-2">
                    <h2 className="text-2xl font-bold text-gray-900">
                        Recomendações Estratégicas Preditivas (Por Gêmeo Organizacional e Eixo)
                    </h2>
                    <div className="relative flex items-center group cursor-help ml-2">
                        <svg className="w-6 h-6 text-gray-400 hover:text-blue-500 transition-colors" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path></svg>
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-72 p-3 bg-gray-800 text-white text-xs rounded shadow-lg z-50 font-normal leading-relaxed">
                            A <span className="font-bold">Saúde Atual</span> exibida nos cards é calculada pela média da adesão (0 a 100%) dos colaboradores a cada eixo. O Analista IA determina dinamicamente esse percentual interpretando o sentimento das respostas em linguagem natural no período.
                        </div>
                    </div>
                </div>
                
                {filteredHistorico.length === 0 ? (
                    <div className="text-center p-12 bg-white rounded-xl shadow border border-gray-100 text-gray-500">
                        Nenhuma informação encontrada para o período selecionado.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {data.grupos?.map(grupo => {
                            const historicoGrupo = filteredHistorico.filter(h => h.id_agrupamento === grupo.id_agrupamento);
                            if (historicoGrupo.length === 0) return null;

                            return (
                                <div key={grupo.id_agrupamento} className="bg-white p-6 rounded-xl shadow border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow">
                                    <h3 className="text-lg font-bold text-blue-700 mb-1">{grupo.nome_categoria}</h3>
                                    <p className="text-sm text-gray-500 mb-4 italic">{grupo.descricao_perfil}</p>
                                    
                                    <div className="flex-1 space-y-4 overflow-y-auto pr-2 max-h-96">
                                        {historicoGrupo.map((h, i) => {
                                            const eixo = data.eixos?.find(e => e.id_eixo === h.id_eixo);
                                            const mesAno = formatMonthYear(h.data_medicao);
                                            // Consulta rápida e otimizada (O(1)) do mapa processado fora do loop de renderização
                                            const uniquePersonas = uniquePersonasMap[`${mesAno}-${h.id_eixo}`] || 0;

                                            return (
                                                <div key={i} className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500 relative">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex flex-col items-start gap-1">
                                                            <span className="text-xs font-bold text-blue-900 uppercase tracking-wide bg-blue-100 px-2 py-1 rounded">{eixo?.nome}</span>
                                                            <span className="text-[10px] font-semibold text-gray-500">{uniquePersonas} {uniquePersonas === 1 ? 'Gêmeo mapeado' : 'Gêmeos mapeados'}</span>
                                                        </div>
                                                        <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded shadow-sm">{mesAno}</span>
                                                    </div>
                                                    <div className="mb-2 flex items-center">
                                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${h.pontuacao_agregada >= 80 ? 'bg-green-100 text-green-800' : h.pontuacao_agregada >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                            Saúde Atual: {h.pontuacao_agregada}%
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                                                        <span className="font-semibold text-gray-900 text-xs uppercase block mb-1">Análise da IA:</span>
                                                        {h.sugestao_estrategica_ia || "Nenhuma sugestão registrada para este período."}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}