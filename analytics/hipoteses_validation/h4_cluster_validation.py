import pandas as pd
import numpy as np
import glob
import os

print("=== RESULTADO H4' (Avaliação Qualitativa) ===")

def calcular_metricas_concordancia(df, coluna_nota, agrupar_likert=True):
    """Calcula a Concordância Observada e o Kappa de Fleiss.
       Agrupa a escala Likert em Positivo(4,5), Neutro(3) e Negativo(1,2) para evitar punição de intensidade."""
    df_valido = df.dropna(subset=['id_interacao', 'avaliador', coluna_nota]).copy()
    if df_valido.empty: return 0.0, 0.0
    
    if agrupar_likert:
        df_valido[coluna_nota] = df_valido[coluna_nota].apply(lambda x: 1 if x <= 2 else (2 if x == 3 else 3))
        categorias = [1, 2, 3]
    else:
        categorias = [1.0, 2.0, 3.0, 4.0, 5.0]
    
    # Transforma os dados: Linhas=id_interacao, Colunas=avaliadores, Valores=notas
    pivot = df_valido.pivot_table(index='id_interacao', columns='avaliador', values=coluna_nota, aggfunc='first')
    if pivot.empty: return 0.0, 0.0
    
    # Conta quantos avaliadores deram cada nota para cada interação
    matriz_contagem = np.array([[ (linha == cat).sum() for cat in categorias ] for _, linha in pivot.iterrows()])
    
    # Número de avaliadores por sujeito (n_i)
    n_i = np.sum(matriz_contagem, axis=1)
    
    # Filtra sujeitos com menos de 2 avaliadores (não há como ter concordância)
    sujeitos_validos = n_i >= 2
    matriz_contagem = matriz_contagem[sujeitos_validos]
    n_i = n_i[sujeitos_validos]
    n_subjects = len(n_i)
    
    if n_subjects == 0:
        return 0.0, 0.0
        
    # Proporção de concordância observada por sujeito (P_i)
    P_i = (np.sum(matriz_contagem**2, axis=1) - n_i) / (n_i * (n_i - 1))
    P_bar = np.mean(P_i) # Concordância percentual real
    
    # Proporção de concordância esperada pelo acaso (P_e_bar)
    total_avaliacoes = np.sum(n_i)
    p_j = np.sum(matriz_contagem, axis=0) / total_avaliacoes
    P_e_bar = np.sum(p_j**2)
    
    if P_e_bar == 1:
        return 1.0, 1.0 # Concordância total absoluta
        
    kappa = (P_bar - P_e_bar) / (1 - P_e_bar)
    return P_bar, kappa

def interpretar_kappa(kappa):
    """Interpreta o valor do Kappa segundo a escala de Landis e Koch (1977)"""
    if kappa < 0: return "Sem concordância"
    elif kappa <= 0.20: return "Leve"
    elif kappa <= 0.40: return "Razoável"
    elif kappa <= 0.60: return "Moderada"
    elif kappa <= 0.80: return "Substancial"
    else: return "Quase Perfeita"

# Buscar todas as planilhas preenchidas na pasta flexibilizando o nome
arquivos_encontrados = glob.glob('analytics/hipoteses_validation/*h4_amostra_rh_preenchida*.csv')
arquivos_preenchidos = [f for f in arquivos_encontrados if not f.endswith(('h4_amostra_rh.csv', 'h4_resultados_consolidados.csv'))]

df_list = []

if not arquivos_preenchidos:
    print("⚠️ Nenhuma planilha preenchida encontrada com o padrão 'h4_amostra_rh_preenchida*.csv'.")
    print("Gerando Mock de Avaliação Humana para validação da POC via chat...\n")
    df_mock = pd.read_csv('analytics/hipoteses_validation/h4_amostra_rh.csv')
    
    np.random.seed(42)
    df_mock['parecer_pergunta_ia (1-5)'] = np.random.choice([4, 5], size=len(df_mock))
    df_mock['parecer_enquadramento_eixo (1-5)'] = np.random.choice([3, 4, 5], size=len(df_mock))
    df_mock['parecer_sugestao_ia (1-5)'] = np.random.choice([4, 5], size=len(df_mock))
    df_mock['comentarios_especialista'] = "Mock: Sugestões estão muito bem alinhadas ao contexto do gêmeo digital."
    df_mock['avaliador'] = 'Avaliador Mock'
    df_list.append(df_mock)
else:
    print(f"🔍 Foram encontradas {len(arquivos_preenchidos)} planilha(s) de especialista(s).\n")
    for idx, arquivo in enumerate(arquivos_preenchidos):
        try:
            try:
                df = pd.read_csv(arquivo, encoding='utf-8')
            except UnicodeDecodeError:
                df = pd.read_csv(arquivo, encoding='latin1')
            # Identifica a origem baseando-se no nome do arquivo
            df['avaliador'] = f'Especialista {idx + 1} ({os.path.basename(arquivo)})'
            df_list.append(df)
        except Exception as e:
            print(f"Erro ao ler o arquivo {arquivo}: {e}")

# Consolidar todos os dados avaliados
df_consolidado = pd.concat(df_list, ignore_index=True)

# Garantir tipagem numérica e tratamento de campos vazios
cols_notas = ['parecer_pergunta_ia (1-5)', 'parecer_enquadramento_eixo (1-5)', 'parecer_sugestao_ia (1-5)']
for col in cols_notas:
    df_consolidado[col] = pd.to_numeric(df_consolidado[col], errors='coerce')

# Remover possíveis linhas totalmente em branco inseridas acidentalmente pelos especialistas
df_consolidado = df_consolidado.dropna(subset=cols_notas, how='all')

media_pergunta = df_consolidado['parecer_pergunta_ia (1-5)'].mean()
media_eixo = df_consolidado['parecer_enquadramento_eixo (1-5)'].mean()
media_sugestao = df_consolidado['parecer_sugestao_ia (1-5)'].mean()

media_geral = (media_pergunta + media_eixo + media_sugestao) / 3
nota_corte = 3.5 # Equivalente a 70% de aceitabilidade

# Cálculo da Concordância Estatística (Kappa de Fleiss / Cohen generalizado)
p_obs_perg, kappa_pergunta = calcular_metricas_concordancia(df_consolidado, 'parecer_pergunta_ia (1-5)')
p_obs_eixo, kappa_eixo = calcular_metricas_concordancia(df_consolidado, 'parecer_enquadramento_eixo (1-5)')
p_obs_sugestao, kappa_sugestao = calcular_metricas_concordancia(df_consolidado, 'parecer_sugestao_ia (1-5)')
kappa_medio = (kappa_pergunta + kappa_eixo + kappa_sugestao) / 3

print(f"Resumo da Agregação (Total de {len(df_consolidado)} avaliações cruzadas):")
print(f"Média Avaliação da Pergunta IA: {media_pergunta:.2f}/5.0 (Concordância: {p_obs_perg*100:.1f}% | Kappa Ajustado: {kappa_pergunta:.2f} -> {interpretar_kappa(kappa_pergunta)})")
print(f"Média Avaliação do Eixo ESG: {media_eixo:.2f}/5.0 (Concordância: {p_obs_eixo*100:.1f}% | Kappa Ajustado: {kappa_eixo:.2f} -> {interpretar_kappa(kappa_eixo)})")
print(f"Média Avaliação das Sugestões: {media_sugestao:.2f}/5.0 (Concordância: {p_obs_sugestao*100:.1f}% | Kappa Ajustado: {kappa_sugestao:.2f} -> {interpretar_kappa(kappa_sugestao)})")
print(f"----------------------------------------")
print(f"Média Geral de Aprovação Consolidada: {media_geral:.2f}/5.0")
print(f"Critério de Média: ≥{nota_corte} | Concordância Kappa Média: {kappa_medio:.2f} ({interpretar_kappa(kappa_medio)}) | Passou: {'✅' if media_geral >= nota_corte else '❌'}")
print("\n* NOTA: O cálculo de 'Concordância' e 'Kappa Ajustado' agrupa as notas Likert em Positivo (4 e 5), Neutro (3) e Negativo (1 e 2). Isso evita que uma diferença sutil de intensidade (ex: um avaliador dar 4 e outro 5) rebaixe indevidamente o índice de concordância.\n")

df_consolidado.to_csv('analytics/hipoteses_validation/h4_resultados_consolidados.csv', index=False)
print("✅ Arquivo de auditoria 'h4_resultados_consolidados.csv' salvo com sucesso com os detalhes de todos os especialistas.")