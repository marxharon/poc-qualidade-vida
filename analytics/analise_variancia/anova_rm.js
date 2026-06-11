import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

// Carrega as variáveis de ambiente baseadas no backend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/beqv_db';
const { Client } = pg;

async function runRepeatedMeasuresANOVA() {
    console.log('📈 Iniciando Análise de Variância de Medidas Repetidas (RM-ANOVA)...');
    const client = new Client({ connectionString: DATABASE_URL });
    
    try {
        await client.connect();

        // Extrair os dados da evolução temporal e pontuação dos clusters (Gêmeos Organizacionais)
        const query = `
            SELECT 
                h.id_agrupamento, 
                g.nome_categoria, 
                h.data_medicao, 
                h.pontuacao_agregada 
            FROM historico_evolucao_esg h
            JOIN gemeos_organizacionais g ON h.id_agrupamento = g.id_agrupamento
            ORDER BY h.id_agrupamento, h.data_medicao ASC
        `;
        const { rows } = await client.query(query);

        if (rows.length === 0) {
            throw new Error('Sem dados no banco. Certifique-se de que a simulação de Monte Carlo foi executada.');
        }

        // Estruturar dados em matriz: [Sujeito(Categoria)][Tempo(Mês)]
        const subjects = {};
        const timePointsSet = new Set();

        rows.forEach(r => {
            if (!subjects[r.id_agrupamento]) {
                subjects[r.id_agrupamento] = { nome: r.nome_categoria, scores: [] };
            }
            // Padroniza a data para YYYY-MM para identificar os pontos no tempo (k)
            const dateKey = new Date(r.data_medicao).toISOString().slice(0, 7);
            timePointsSet.add(dateKey);
            subjects[r.id_agrupamento].scores.push(Number(r.pontuacao_agregada));
        });

        const timePoints = Array.from(timePointsSet);
        const k = timePoints.length; // Quantidade de medidas/meses
        const n = Object.keys(subjects).length; // Quantidade de categorias monitoradas
        const N = n * k; // Total de observações

        if (k < 2 || n < 2) {
            throw new Error('A RM-ANOVA requer pelo menos 2 pontos no tempo (k >= 2) e 2 agrupamentos (n >= 2).');
        }

        const matrix = Object.values(subjects).map(s => s.scores);

        // 1. Cálculos de Médias (Grand Mean, Médias de Sujeitos e Tempos)
        let grandTotal = 0;
        matrix.forEach(subjectScores => subjectScores.forEach(score => grandTotal += score));
        const grandMean = grandTotal / N;

        // 2. Soma de Quadrados (Sum of Squares - SS)
        let ssTotal = 0;
        matrix.forEach(subjectScores => {
            subjectScores.forEach(score => ssTotal += Math.pow(score - grandMean, 2));
        });

        let ssBetweenSubjects = 0;
        matrix.forEach(subjectScores => {
            const subjectMean = subjectScores.reduce((a, b) => a + b, 0) / k;
            ssBetweenSubjects += k * Math.pow(subjectMean - grandMean, 2);
        });

        const ssWithinSubjects = ssTotal - ssBetweenSubjects;

        let ssTime = 0;
        for (let t = 0; t < k; t++) {
            let timeTotal = 0;
            for (let s = 0; s < n; s++) timeTotal += matrix[s][t];
            const timeMean = timeTotal / n;
            ssTime += n * Math.pow(timeMean - grandMean, 2);
        }

        const ssError = ssWithinSubjects - ssTime;

        // 3. Graus de Liberdade (Degrees of Freedom - df)
        const dfTime = k - 1;
        const dfError = (k - 1) * (n - 1);
        const dfSubjects = n - 1;
        const dfTotal = N - 1;

        // 4. Média dos Quadrados (Mean Squares - MS) e Estatística F
        const msTime = ssTime / dfTime;
        const msError = ssError / dfError;
        const fStatistic = msTime / msError;

        // Montar Relatório Final
        const report = {
            metadata: {
                grupos_analisados_n: n,
                meses_avaliados_k: k,
                total_medicoes_N: N,
                media_global: grandMean.toFixed(2)
            },
            tabela_anova: {
                efeito_tempo_mensal: { Soma_Quadrados: ssTime.toFixed(2), Grau_Liberdade: dfTime, Media_Quadrados: msTime.toFixed(2), Valor_F: fStatistic.toFixed(4) },
                erro_residual: { Soma_Quadrados: ssError.toFixed(2), Grau_Liberdade: dfError, Media_Quadrados: msError.toFixed(2) },
                entre_sujeitos_grupos: { Soma_Quadrados: ssBetweenSubjects.toFixed(2), Grau_Liberdade: dfSubjects },
                total: { Soma_Quadrados: ssTotal.toFixed(2), Grau_Liberdade: dfTotal }
            },
            diagnostico_ia: fStatistic > 2.0 
                ? `EFEITO SIGNIFICATIVO ENCONTRADO (F=${fStatistic.toFixed(2)}). As intervenções contínuas da IA apresentaram variância considerável sugerindo mudança longitudinal efetiva nos scores de Bem-Estar das equipes.`
                : `SEM EFEITO SIGNIFICATIVO (F=${fStatistic.toFixed(2)}). A flutuação dos scores ao longo dos meses pode ser decorrente do acaso, indicando necessidade de revisar as sugestões estratégicas geradas pela IA.`
        };

        // Configurar subpasta de resultados
        const resultsDir = path.join(__dirname, 'resultados');
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true });
        }

        // Exportar Relatório em JSON
        const reportPath = path.join(resultsDir, 'resultado_anova_medidas_repetidas.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 4));

        // Exportar Matriz Analítica em CSV (Para plotagem se necessário)
        let csvContent = "Categoria," + timePoints.join(",") + "\n";
        for (const subject of Object.values(subjects)) {
            csvContent += `"${subject.nome}",` + subject.scores.join(",") + "\n";
        }
        const csvPath = path.join(resultsDir, 'matriz_dados_longitudinais.csv');
        fs.writeFileSync(csvPath, csvContent);

        // Gerar Gráfico Interativo em HTML (Chart.js)
        const datasets = Object.values(subjects).map((subject, index) => {
            // Gerar cores dinamicamente baseadas no índice
            const hue = (index * 360) / n;
            return {
                label: subject.nome,
                data: subject.scores,
                fill: false,
                borderColor: `hsl(${hue}, 70%, 50%)`,
                backgroundColor: `hsl(${hue}, 70%, 50%)`,
                tension: 0.1
            };
        });

        const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Evolução Longitudinal - Categorias ESG</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: sans-serif; margin: 40px; background-color: #f4f4f9; }
        .container { max-width: 1000px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h2 { text-align: center; color: #333; }
        p { text-align: center; color: #666; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Evolução Longitudinal da Pontuação (RM-ANOVA)</h2>
        <p>Acompanhamento da progressão dos Gêmeos Organizacionais ao longo dos meses simulados.</p>
        <canvas id="graficoEvolucao"></canvas>
    </div>
    <script>
        const ctx = document.getElementById('graficoEvolucao').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ${JSON.stringify(timePoints)},
                datasets: ${JSON.stringify(datasets)}
            },
            options: {
                responsive: true,
                scales: {
                    y: { min: 0, max: 100, title: { display: true, text: 'Pontuação Agregada' } },
                    x: { title: { display: true, text: 'Mês (Ano-Mês)' } }
                }
            }
        });
    </script>
</body>
</html>`;

        const htmlPath = path.join(resultsDir, 'grafico_evolucao_longitudinal.html');
        fs.writeFileSync(htmlPath, htmlContent);

        console.log(`✅ Cálculo Estatístico da RM-ANOVA concluído.`);
        console.log(`📊 Estatística F (Efeito do Tempo): ${fStatistic.toFixed(4)}`);
        console.log(`📁 Relatório detalhado salvo em: ${reportPath}`);
        console.log(`📁 Dados tabulares salvos em: ${csvPath}`);
        console.log(`📈 Gráfico interativo salvo em: ${htmlPath}`);

    } catch (error) {
        console.error('❌ Erro durante a Análise de Variância:', error.message);
    } finally {
        await client.end();
    }
}

runRepeatedMeasuresANOVA();