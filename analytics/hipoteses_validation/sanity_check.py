import pandas as pd

print("🔍 Verificando consistência dos dados de entrada...")
interacoes = pd.read_csv('analytics/hipoteses_validation/interacoes.csv')
personas = pd.read_csv('analytics/hipoteses_validation/personas.csv')

assert len(personas) == 40, f"Erro: Esperado 40 personas, encontrado {len(personas)}"
assert len(interacoes) >= 200, f"Erro: Poucas interações exportadas ({len(interacoes)}). A simulação falhou?"
assert interacoes['feedback_sugestao'].isnull().sum() == 0, "Erro: Encontrados feedbacks nulos nas interações."
assert interacoes['percentual_adesao'].isnull().sum() == 0, "Erro: Valores nulos na coluna percentual_adesao."

print("✅ Sanity check passou com sucesso! Os datasets estão íntegros e prontos para a validação das hipóteses.")