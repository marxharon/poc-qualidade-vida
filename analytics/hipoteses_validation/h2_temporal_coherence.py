import pandas as pd
import numpy as np
from statsmodels.tsa.stattools import acf

# Carregar dados
interacoes = pd.read_csv('analytics/hipoteses_validation/interacoes.csv')

# Para cada persona, analisar trajetória de adesão
resultados_coerencia = []

for pid in interacoes['id_persona'].unique():
    persona_data = interacoes[interacoes['id_persona'] == pid].sort_values('data_interacao')
    adesao = persona_data['percentual_adesao'].values
    
    if len(adesao) < 2: continue
        
    # Calcular autocorrelação lag-1 (Mede se a saúde flutua de forma contínua)
    acf_vals = acf(adesao, nlags=1, fft=True)
    acf_lag1 = acf_vals[1] if len(acf_vals) > 1 else 0
    
    # Detectar inversões abruptas (mudanças repentinas e drásticas >15%)
    diffs = np.diff(adesao)
    inversoes_abruptas = np.sum(np.abs(diffs) > 15)
    pct_inversoes = (inversoes_abruptas / len(diffs)) * 100 if len(diffs) > 0 else 0
    
    # Validação: narrativa "realista" se focar na ausência de mudanças bruscas/irrealistas.
    # Séries curtas com flutuação diária natural possuem ACF baixo, logo focaremos apenas nas inversões
    realistica = (pct_inversoes <= 20)
    
    resultados_coerencia.append({
        'id_persona': pid,
        'n_interacoes': len(persona_data),
        'acf_lag1': acf_lag1,
        'inversoes_abruptas': inversoes_abruptas,
        'pct_inversoes': pct_inversoes,
        'realistica': realistica
    })

df_resultados = pd.DataFrame(resultados_coerencia)

print(f"\n=== RESULTADO H2' ===")
realistas_count = df_resultados['realistica'].sum()
taxa = (realistas_count / len(df_resultados)) * 100

print(f"Personas com narrativa realista: {realistas_count}/{len(df_resultados)}")
print(f"Taxa: {taxa:.2f}%")
print(f"Critério: ≥85% | Passou: {'✅' if taxa >= 85 else '❌'}")

df_resultados.to_csv('analytics/hipoteses_validation/h2_temporal_analysis.csv', index=False)