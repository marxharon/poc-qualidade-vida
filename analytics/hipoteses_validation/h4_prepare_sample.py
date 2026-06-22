import pandas as pd
import os

try:
    interacoes = pd.read_csv('analytics/hipoteses_validation/interacoes.csv')
    personas = pd.read_csv('analytics/hipoteses_validation/personas.csv')
    
    eixos_path = 'analytics/hipoteses_validation/eixos_esg.csv'
    if os.path.exists(eixos_path):
        eixos = pd.read_csv(eixos_path)
    else:
        eixos = None
except FileNotFoundError:
    print("Erro: Arquivos necessários não encontrados.")
    exit()

print("=== RESULTADO H4: Preparação de Amostra para RH ===")

# Filtrar interacoes: pergunta_ia não vazia e feedback válido
feedbacks_validos = ['Boa', 'Ruim', 'Indiferente']
interacoes_validas = interacoes[
    interacoes['pergunta_ia'].notna() & 
    (interacoes['pergunta_ia'].astype(str).str.strip() != '') & 
    interacoes['resposta_colaborador'].notna() &
    (interacoes['resposta_colaborador'].astype(str).str.strip() != '') &
    interacoes['sugestao_ia'].notna() &
    (interacoes['sugestao_ia'].astype(str).str.strip() != '') &
    interacoes['id_eixo'].notna() &
    interacoes['feedback_sugestao'].isin(feedbacks_validos)
]

# Garantir que só vamos sortear personas que possuem interações válidas
personas_com_interacoes = interacoes_validas['id_persona'].unique()
personas_validas = personas[personas['id_persona'].isin(personas_com_interacoes)]

# Selecionar 4 personas aleatórias para amostra qualitativa
sample_personas = personas_validas.sample(n=min(4, len(personas_validas)), random_state=42)
sample_ids = sample_personas['id_persona'].tolist()

sample_interacoes = interacoes_validas[interacoes_validas['id_persona'].isin(sample_ids)].copy()

# Trazer o nome do eixo classificado pela IA
if eixos is not None and 'id_eixo' in eixos.columns and 'nome' in eixos.columns:
    sample_interacoes = sample_interacoes.merge(eixos[['id_eixo', 'nome']], on='id_eixo', how='left')
    sample_interacoes.rename(columns={'nome': 'eixo_classificado_ia'}, inplace=True)
else:
    sample_interacoes['eixo_classificado_ia'] = sample_interacoes['id_eixo']

# Mesclar informações para facilitar a leitura do especialista humano
df_final = sample_interacoes.merge(sample_personas[['id_persona', 'nome_preferido', 'personalidade', 'gostos', 'desgostos']], on='id_persona')
df_final = df_final.sort_values(by=['id_persona', 'data_interacao'])

# Adicionar colunas vazias para a avaliação do especialista
df_final['parecer_enquadramento_eixo (1-5)'] = ''
df_final['parecer_pergunta_ia (1-5)'] = ''
df_final['parecer_sugestao_ia (1-5)'] = ''
df_final['comentarios_especialista'] = ''

# Ordenar colunas para leitura do especialista
colunas_ordenadas = [
    'nome_preferido', 'personalidade', 'gostos', 'desgostos',
    'id_interacao', 'id_persona', 'data_interacao', 'pergunta_ia', 
    'resposta_colaborador', 'percentual_adesao', 'sugestao_ia', 
    'feedback_sugestao', 'eixo_classificado_ia',
    'parecer_pergunta_ia (1-5)', 'parecer_sugestao_ia (1-5)', 
    'parecer_enquadramento_eixo (1-5)', 'comentarios_especialista'
]

colunas_presentes = [col for col in colunas_ordenadas if col in df_final.columns]
df_final = df_final[colunas_presentes]

df_final.to_csv('analytics/hipoteses_validation/h4_amostra_rh.csv', index=False)
print(f"✅ Arquivo 'h4_amostra_rh.csv' gerado com sucesso!")
print(f"Amostra contém {len(df_final)} interações das personas: {', '.join(sample_personas['nome_preferido'].tolist())}.")
print("Este arquivo está pronto para ser enviado ao Especialista de RH para validação qualitativa.")