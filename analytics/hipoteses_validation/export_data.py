import pandas as pd
from sqlalchemy import create_engine

# Conectar ao banco local conforme .env padrão da POC
engine = create_engine('postgresql://postgres:postgres@localhost:5432/beqv_db')

tabelas = ['personas', 'interacoes', 'gemeos_organizacionais', 'historico_evolucao_esg', 'eixos_esg']
for tabela in tabelas:
    print(f"Exportando {tabela} para CSV...")
    df = pd.read_sql_table(tabela, con=engine)
    df.to_csv(f"analytics/hipoteses_validation/{tabela}.csv", index=False)

print("✅ Exportação concluída com sucesso!")