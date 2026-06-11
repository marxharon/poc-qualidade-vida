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

// ==========================================
// MOTOR ESTATÍSTICO: CORRELAÇÃO DE PEARSON
// ==========================================
function pearsonCorrelation(x, y) {
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    let n = 0;

    for (let i = 0; i < x.length; i++) {
        if (x[i] != null && y[i] != null) {
            sumX += x[i];
            sumY += y[i];
            sumXY += x[i] * y[i];
            sumX2 += x[i] * x[i];
            sumY2 += y[i] * y[i];
            n++;
        }
    }

    if (n === 0) return 0;
    
    const numerator = (n * sumXY) - (sumX * sumY);
    const denominator = Math.sqrt(((n * sumX2) - (sumX * sumX)) * ((n * sumY2) - (sumY * sumY)));
    
    if (denominator === 0) return 0;
    return numerator / denominator;
}

async function runPearsonAnalysis() {
    console.log('📈 Iniciando Análise de Correlação de Pearson...');
    const client = new Client({ connectionString: DATABASE_URL });
    
    try {
        await client.connect();

        // Extrair a média de adesão consolidada para formar a base do Gêmeo Organizacional
        // Utilizaremos o histórico riquíssimo das interações das personas
        const query = `
            SELECT 
                p.id_persona, 
                e.nome as eixo, 
                AVG(i.percentual_adesao) as media_adesao
            FROM interacoes i
            JOIN eixos_esg e ON i.id_eixo = e.id_eixo
            JOIN personas p ON i.id_persona = p.id_persona
            GROUP BY p.id_persona, e.nome
        `;
        const { rows } = await client.query(query);

        if (rows.length === 0) {
            throw new Error('Sem dados suficientes. Execute a simulação de Monte Carlo primeiro.');
        }

        // Estruturar dados: pivotar para que cada linha seja um colaborador e cada coluna um eixo ESG
        const sujetos = {};
        const eixosSet = new Set();
        
        rows.forEach(r => {
            if (!sujetos[r.id_persona]) sujetos[r.id_persona] = {};
            sujetos[r.id_persona][r.eixo] = Number(r.media_adesao);
            eixosSet.add(r.eixo);
        });

        const eixos = Array.from(eixosSet).sort();
        const numEixos = eixos.length;

        console.log(`🤖 Calculando matriz de covariância linear para ${numEixos} eixos transversais...`);

        // Matriz de Resultados (N x N)
        const matriz = Array(numEixos).fill(null).map(() => Array(numEixos).fill(0));
        const correlacoesGerais = [];

        for (let i = 0; i < numEixos; i++) {
            for (let j = 0; j < numEixos; j++) {
                if (i === j) {
                    matriz[i][j] = 1.0; // Correlação consigo mesmo é sempre 1 perfeita
                } else {
                    let arrX = [];
                    let arrY = [];
                    for (let id in sujetos) {
                        if (sujetos[id][eixos[i]] !== undefined && sujetos[id][eixos[j]] !== undefined) {
                            arrX.push(sujetos[id][eixos[i]]);
                            arrY.push(sujetos[id][eixos[j]]);
                        }
                    }
                    const correlacao = pearsonCorrelation(arrX, arrY);
                    matriz[i][j] = correlacao;
                    
                    if (i < j) { // Para não duplicar log, pois r(x,y) = r(y,x)
                        correlacoesGerais.push({ eixoA: eixos[i], eixoB: eixos[j], coeficiente: correlacao });
                    }
                }
            }
        }

        // Preparar diretório de saídas
        const resultsDir = path.join(__dirname, 'resultados');
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true });
        }

        // Salvar Json Analítico
        const report = {
            metadados: { num_amostras_gemeos: Object.keys(sujetos).length, num_eixos: numEixos },
            nota_cientifica: "Devido aos dados serem baseados numa Simulação Randomizada de Monte Carlo, as correlações naturalmente apresentarão valores muito próximos a 0 (estatisticamente fracos e independentes). Em dados humanos reais capturados pela POC, observar-se-á maiores tendências (ex: > 0.6).",
            pares_de_correlacao: correlacoesGerais.sort((a, b) => Math.abs(b.coeficiente) - Math.abs(a.coeficiente))
        };

        const reportPath = path.join(resultsDir, 'resultado_pearson.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 4));

        // ==========================================
        // GERAR VISUALIZAÇÃO: HEATMAP (Matriz Dinâmica HTML)
        // ==========================================
        let rowsHtml = '';
        for (let i = 0; i < numEixos; i++) {
            rowsHtml += `<tr><th>${eixos[i]}</th>`;
            for (let j = 0; j < numEixos; j++) {
                const val = matriz[i][j];
                const absVal = Math.abs(val);
                // Lógica de Cor do Heatmap: Azul/Verde para Positivo, Vermelho/Laranja para Negativo. Intensidade pela força da correlação.
                const color = val > 0 
                    ? `rgba(0, 128, 255, ${absVal === 1 ? 0.8 : absVal * 3 + 0.1})` // Multiplicador para dar destaque em flutuações pequenas simuladas
                    : `rgba(255, 0, 0, ${absVal * 3 + 0.1})`;
                const fontColor = absVal > 0.5 ? '#fff' : '#333';
                rowsHtml += `<td style="background-color: ${color}; color: ${fontColor};" title="${eixos[i]} vs ${eixos[j]}"> ${val.toFixed(3)} </td>`;
            }
            rowsHtml += `</tr>`;
        }

        const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Matriz de Correlação de Pearson</title>
    <style>
        body { font-family: sans-serif; margin: 40px; background-color: #f4f4f9; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow-x: auto; }
        h2 { text-align: center; }
        p { text-align: center; color: #666; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; font-size: 13px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold; min-width: 60px; }
        th { background-color: #eaeaea; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Interdependência entre Eixos ESG (Heatmap de Pearson)</h2>
        <p>Valores próximos a +1 indicam forte correlação direta. Próximos a -1 indicam correlação inversa. Zero indica independência.</p>
        <table>
            <tr><th>Eixos Analisados</th>${eixos.map(e => `<th>${e.substring(0, 15)}...</th>`).join('')}</tr>
            ${rowsHtml}
        </table>
    </div>
</body>
</html>`;

        const htmlPath = path.join(resultsDir, 'matriz_correlacao_pearson.html');
        fs.writeFileSync(htmlPath, htmlContent);

        console.log(`✅ Cálculo de Pearson concluído com sucesso.`);
        console.log(`📁 Relatório JSON salvo em: ${reportPath}`);
        console.log(`📈 Heatmap Interativo (Matriz) salvo em: ${htmlPath}`);

    } catch (error) {
        console.error('❌ Erro durante a Análise de Pearson:', error.message);
    } finally {
        await client.end();
    }
}

runPearsonAnalysis();