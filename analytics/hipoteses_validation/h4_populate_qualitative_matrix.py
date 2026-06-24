import pandas as pd
import os

# Definição dos caminhos dos arquivos (relativos à execução na raiz POC1 ou pasta atual)
input_file = 'analytics/hipoteses_validation/h4_resultados_consolidados.csv'
output_file = 'analytics/matriz_analise_qualitativa_h4.csv'

print("⏳ Iniciando a extração dos comentários para a Matriz Qualitativa...")

try:
    # Carregar o dataset consolidado dos especialistas
    df_consol = pd.read_csv(input_file)
    
    # Filtrar apenas linhas onde a coluna 'comentarios_especialista' não está vazia
    df_com_comentarios = df_consol[df_consol['comentarios_especialista'].notna() & (df_consol['comentarios_especialista'].str.strip() != '')].copy()
    
    if df_com_comentarios.empty:
        print("⚠️ Nenhum comentário encontrado na planilha consolidada para extração.")
    else:
        # Preparar o dicionário com as colunas da Matriz Qualitativa (Fases 1 a 4)
        matriz_data = {
            '[1] id_interacao': df_com_comentarios.get('id_interacao', ''),
            '[2] avaliador': df_com_comentarios.get('avaliador', 'Avaliador Não Identificado'),
            # Concatena as 3 notas no formato "P / S / E" para contexto na coluna 3
            '[3] notas_quanti_originais (P/S/E)': df_com_comentarios.apply(
                lambda row: f"{row.get('parecer_pergunta_ia (1-5)', '?')} / {row.get('parecer_sugestao_ia (1-5)', '?')} / {row.get('parecer_enquadramento_eixo (1-5)', '?')}", 
                axis=1
            ),
            '[4] comentario_original': df_com_comentarios.get('comentarios_especialista', ''),
            # Deixa as colunas analíticas em branco para o pesquisador preencher (Fases 2, 3 e 4)
            '[5] codigos_abertos_fase2': '',
            '[6] categoria_tematica_fase3': '',
            '[7] analise_triangulacao_fase4': ''
        }
        
        df_matriz = pd.DataFrame(matriz_data)
        df_matriz.to_csv(output_file, index=False)
        print(f"✅ Matriz preenchida com sucesso!")
        print(f"📊 Total de {len(df_matriz)} comentários importados e prontos para codificação no arquivo: {output_file}")
except FileNotFoundError:
    print(f"⚠️ Erro: O arquivo de origem não foi encontrado no caminho '{input_file}'. Certifique-se de já ter executado o h4_cluster_validation.py antes.")
except Exception as e:
    print(f"⚠️ Ocorreu um erro ao processar os dados: {e}")