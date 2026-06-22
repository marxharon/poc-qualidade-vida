import pandas as pd

try:
    interacoes = pd.read_csv('analytics/hipoteses_validation/interacoes.csv')
except FileNotFoundError:
    print("Erro: Arquivos 'interacoes.csv' não encontrado.")
    exit()

print("=== RESULTADO H5: Identificação Precoce de Padrões de Risco ===")

# Filtrar interações com indício de risco (Adesão <= 75%) MAS que tenham sugestão válida gerada
riscos = interacoes[
    (interacoes['percentual_adesao'] <= 75) & 
    (interacoes['sugestao_ia'].notna()) & 
    (interacoes['sugestao_ia'].astype(str).str.strip() != '')
]

# Palavras-chave que indicam uma intervenção preventiva por parte da IA
keywords = ['prioridad', 'deleg', 'desconect', 'pausa', 'limite', 'relaxa', 
            'apoio', 'ajud', 'profissional', 'descans', 'medita', 'respira', 
            'saudável', 'cuid', 'rotina', 'tempo', 'curso', 'conversa', 'capacita', 'desenvolv',
            'inclusão', 'comitê', 'feedback', 'alonga',
            'escuta', 'colabora', 'equipe', 'comunica', 'acolhe', 'emocion', 
            'integra', 'vínculo', 'transparen', 'cultura', 'aprend', 'relacionamento', 
            'fortalece', 'atividade', 'compartilha', 'melhora', 'ambiente', 'horário']

intervencoes_validas = 0
for sugestao in riscos['sugestao_ia']:
    sugestao_lower = str(sugestao).lower()
    if any(kw in sugestao_lower for kw in keywords):
        intervencoes_validas += 1

taxa_intervencao = (intervencoes_validas / len(riscos)) * 100 if len(riscos) > 0 else 0

print(f"Total de interações com indícios de risco e diálogo ativo: {len(riscos)}")
print(f"Intervenções preventivas geradas de forma assertiva pela IA: {intervencoes_validas}")
print(f"Taxa de Prevenção Precoce: {taxa_intervencao:.2f}%")
passou = taxa_intervencao >= 80
print(f"Critério: ≥80% | Passou: {'✅' if passou else '❌'}")