import pandas as pd

# Carregar dados
try:
    interacoes = pd.read_csv('analytics/hipoteses_validation/interacoes.csv')
    personas = pd.read_csv('analytics/hipoteses_validation/personas.csv')
except FileNotFoundError:
    print("Erro: Arquivos 'interacoes.csv' ou 'personas.csv' não encontrados na pasta 'analytics/hipoteses_validation/'.")
    print("Execute primeiro o script 'export_data.py' a partir da raiz do projeto (POC1).")
    exit()

print("=== RESULTADO H3': Taxa de Aceitação e Qualidade do Texto ===")

# --- Parte 1: Taxa de Aceitação (Métrica Quantitativa) ---
total_sugestoes = len(interacoes)
sugestoes_boas_count = (interacoes['feedback_sugestao'] == 'Boa').sum()
taxa_boa = (sugestoes_boas_count / total_sugestoes) * 100 if total_sugestoes > 0 else 0

print(f"\n[MÉTRICA QUANTITATIVA]")
print(f"Taxa de Aceitação de Sugestões ('Boa'): {taxa_boa:.2f}%")
passou_quantitativo = taxa_boa >= 60
print(f"Critério: ≥60% | Passou: {'✅' if passou_quantitativo else '❌'}")
print("-" * 50)

# --- Parte 2: Análise Qualitativa de Personalização ---
sugestoes_boas_df = interacoes[interacoes['feedback_sugestao'] == 'Boa']
referencias_pessoais_count = 0

for _, row in sugestoes_boas_df.iterrows():
    persona_info = personas[personas['id_persona'] == row['id_persona']]
    if persona_info.empty:
        continue
    
    persona = persona_info.iloc[0]
    sugestao = str(row['sugestao_ia']).lower()
    pergunta = str(row['pergunta_ia']).lower()
    
    nome = persona.get('nome_preferido')
    if nome:
        primeiro_nome = str(nome).split()[0].lower()
        if primeiro_nome in sugestao or primeiro_nome in pergunta:
            referencias_pessoais_count += 1
            continue 

taxa_personalizacao = (referencias_pessoais_count / sugestoes_boas_count) * 100 if sugestoes_boas_count > 0 else 0

print("[MÉTRICA QUALITATIVA ADAPTADA]")
print(f"Total de Sugestões 'Boas' analisadas: {sugestoes_boas_count}")
print(f"Sugestões 'Boas' com referências pessoais (nome): {referencias_pessoais_count}")
print(f"Taxa de Personalização em Sugestões 'Boas': {taxa_personalizacao:.2f}%")
passou_qualitativo = taxa_personalizacao > 10
print(f"Critério: >10% | Passou: {'✅' if passou_qualitativo else '❌'}")
print("-" * 50)

if passou_quantitativo and passou_qualitativo:
    print("Conclusão Final: ✅ Hipótese H3' validada com sucesso!")
else:
    print("Conclusão Final: ❌ Hipótese H3' não atingiu todos os critérios.")