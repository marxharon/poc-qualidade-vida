import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Carregar dados
interacoes = pd.read_csv('analytics/hipoteses_validation/interacoes.csv')

# Remover valores nulos na coluna 'pergunta_ia' e garantir que todas sejam tratadas como texto
interacoes = interacoes.dropna(subset=['pergunta_ia'])
interacoes['pergunta_ia'] = interacoes['pergunta_ia'].astype(str)

total_perguntas = 0
total_unicas = 0

# Agrupar por persona
for persona_id in interacoes['id_persona'].unique():
    perguntas = interacoes[interacoes['id_persona'] == persona_id]['pergunta_ia'].values
    n_perguntas = len(perguntas)
    total_perguntas += n_perguntas
    
    # Calcular TF-IDF
    vectorizer = TfidfVectorizer(analyzer='word', ngram_range=(1, 2))
    tfidf_matrix = vectorizer.fit_transform(perguntas)
    
    # Calcular cosine similarity entre todas as perguntas
    similarities = cosine_similarity(tfidf_matrix)
    
    # Identificar perguntas repetidas/muito similares para a MESMA persona (>0.8)
    indices_duplicados = set()
    for i in range(n_perguntas):
        for j in range(i+1, n_perguntas):
            if similarities[i][j] > 0.8:
                indices_duplicados.add(j)
    
    unicas_persona = n_perguntas - len(indices_duplicados)
    total_unicas += unicas_persona
    
    print(f"Persona {persona_id}: {n_perguntas} perguntas, {len(indices_duplicados)} consideradas repetições")

# Calcular taxa de unicidade global
taxa_unicidade = (total_unicas / total_perguntas) * 100

print(f"\n=== RESULTADO H1' ===")
print(f"Total de perguntas: {total_perguntas}")
print(f"Perguntas únicas (considerando contexto individual): {total_unicas}")
print(f"Taxa de Unicidade: {taxa_unicidade:.2f}%")
print(f"Critério: ≥95% | Passou: {'✅' if taxa_unicidade >= 95 else '❌'}")