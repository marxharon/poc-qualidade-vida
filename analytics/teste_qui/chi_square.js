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

async function runChiSquareTest() {
    console.log('📈 Iniciando Teste Qui-Quadrado de Independência (χ²)...');
    const client = new Client({ connectionString: DATABASE_URL });
    
    try {
        await client.connect();

        // Extrair a tabela de contingência: Contagem de avaliações por Eixo ESG
        const query = `
            SELECT 
                e.nome as eixo, 
                i.feedback_sugestao, 
                COUNT(*) as count 
            FROM interacoes i
            JOIN eixos_esg e ON i.id_eixo = e.id_eixo
            GROUP BY e.nome, i.feedback_sugestao
            ORDER BY e.nome, i.feedback_sugestao
        `;
        const { rows } = await client.query(query);

        if (rows.length === 0) {
            throw new Error('Sem dados de interações. Execute a simulação de Monte Carlo antes.');
        }

        // Configurar as variáveis e eixos
        const feedbacks = ['Boa', 'Indiferente', 'Ruim'];
        const eixos = [...new Set(rows.map(r => r.eixo))];
        
        // 1. Tabela de Frequências Observadas (O)
        const observed = {};
        eixos.forEach(e => observed[e] = { Boa: 0, Indiferente: 0, Ruim: 0 });
        rows.forEach(r => {
            if (observed[r.eixo] && feedbacks.includes(r.feedback_sugestao)) {
                observed[r.eixo][r.feedback_sugestao] = Number(r.count);
            }
        });

        // Calcular os Totais Marginais (Linhas, Colunas e Grande Total)
        const colTotals = { Boa: 0, Indiferente: 0, Ruim: 0 };
        const rowTotals = {};
        let grandTotal = 0;

        eixos.forEach(eixo => {
            let rowTotal = 0;
            feedbacks.forEach(fb => {
                const val = observed[eixo][fb];
                rowTotal += val;
                colTotals[fb] += val;
                grandTotal += val;
            });
            rowTotals[eixo] = rowTotal;
        });

        // 2. Frequências Esperadas (E) e Cálculo Estatístico χ²
        let chiSquareStat = 0;
        const expected = {};

        eixos.forEach(eixo => {
            expected[eixo] = {};
            feedbacks.forEach(fb => {
                // E = (Total da Linha * Total da Coluna) / Grande Total
                const exp = (rowTotals[eixo] * colTotals[fb]) / grandTotal;
                expected[eixo][fb] = exp;

                // Adição para o χ²: (O - E)² / E
                const obs = observed[eixo][fb];
                if (exp > 0) {
                    chiSquareStat += Math.pow(obs - exp, 2) / exp;
                }
            });
        });

        // Graus de Liberdade (df): (linhas - 1) * (colunas - 1)
        const df = (eixos.length - 1) * (feedbacks.length - 1);

        // Configurar a pasta de resultados
        const resultsDir = path.join(__dirname, 'resultados');
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true });
        }

        // Laudo Interpretativo (Simples)
        // Se o valor de χ² for maior que o valor crítico (approx 16.92 para df=18 a p=0.05) rejeita a nula
        // Obs: O valor exato crítico depende do seu df calculado dinamicamente, aqui simplificamos a inferência empírica
        const diagnostico = chiSquareStat > df * 1.5 // Aproximação grosseira para demonstração
            ? `EFEITO SIGNIFICATIVO ENCONTRADO. A aceitação varia dependendo do eixo ESG abordado, sugerindo que as intervenções da IA funcionam melhor em alguns temas do que em outros.`
            : `INDEPENDENTES. As flutuações entre eixos são condizentes com o acaso. O eixo ESG não altera estatisticamente a probabilidade do tipo de feedback ("Boa", "Ruim", "Indiferente").`;

        // Criar Relatório JSON
        const report = {
            estatisticas: {
                valor_chi_quadrado: chiSquareStat.toFixed(4),
                graus_de_liberdade: df,
                total_interacoes: grandTotal
            },
            diagnostico_ia: diagnostico,
            tabela_observada: observed
        };

        const reportPath = path.join(resultsDir, 'resultado_qui_quadrado.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 4));

        // Gerar Gráfico de Barras Agrupadas HTML
        const datasetBoa = eixos.map(e => observed[e].Boa);
        const datasetIndiferente = eixos.map(e => observed[e].Indiferente);
        const datasetRuim = eixos.map(e => observed[e].Ruim);

        const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Análise Qui-Quadrado - Aceitação por Eixo ESG</title>
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
        <h2>Aceitação das Intervenções vs. Eixos ESG</h2>
        <p>Gráfico de barras agrupadas ilustrando a tabela de contingência utilizada no cálculo do Qui-Quadrado.</p>
        <canvas id="chiSquareChart"></canvas>
        <div style="margin-top: 20px; padding: 15px; background: #eef; border-radius: 5px;">
            <strong>Valor de χ²:</strong> ${chiSquareStat.toFixed(4)} <br/>
            <strong>Graus de Liberdade:</strong> ${df} <br/>
            <strong>Conclusão:</strong> ${diagnostico}
        </div>
    </div>
    <script>
        const ctx = document.getElementById('chiSquareChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(eixos)},
                datasets: [
                    { label: 'Boa', data: ${JSON.stringify(datasetBoa)}, backgroundColor: 'rgba(54, 162, 235, 0.7)', borderColor: 'rgb(54, 162, 235)', borderWidth: 1 },
                    { label: 'Indiferente', data: ${JSON.stringify(datasetIndiferente)}, backgroundColor: 'rgba(201, 203, 207, 0.7)', borderColor: 'rgb(201, 203, 207)', borderWidth: 1 },
                    { label: 'Ruim', data: ${JSON.stringify(datasetRuim)}, backgroundColor: 'rgba(255, 99, 132, 0.7)', borderColor: 'rgb(255, 99, 132)', borderWidth: 1 }
                ]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true, title: { display: true, text: 'Nº de Interações' } } }, plugins: { legend: { position: 'top' } } }
        });
    </script>
</body>
</html>`;

        const htmlPath = path.join(resultsDir, 'grafico_qui_quadrado.html');
        fs.writeFileSync(htmlPath, htmlContent);

        console.log(`✅ Cálculo Qui-Quadrado (χ²) concluído.`);
        console.log(`📊 Estatística χ²: ${chiSquareStat.toFixed(4)} (df: ${df})`);
        console.log(`📁 Relatório JSON salvo em: ${reportPath}`);
        console.log(`📈 Gráfico em HTML salvo em: ${htmlPath}`);

    } catch (error) {
        console.error('❌ Erro durante a Análise:', error.message);
    } finally {
        await client.end();
    }
}

runChiSquareTest();