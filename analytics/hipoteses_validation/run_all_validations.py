import subprocess
import os
import sys

def main():
    # Identifica o diretório atual e a raiz do projeto para evitar problemas de caminhos relativos
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(base_dir, "..", ".."))
    
    scripts = [
        ("Sanity Check", "sanity_check.py", "Verifica a integridade básica dos dados simulados e previne inconsistências em tempo de execução."),
        ("H1' - Unicidade e Hiper-personalização", "h1_uniqueness.py", "Valida se a IA gera perguntas únicas, dinâmicas e baseadas na memória semântica do Gêmeo Digital, evitando questionários repetitivos."),
        ("H2' - Coerência Temporal", "h2_temporal_coherence.py", "Comprova que a evolução temporal dos sentimentos ao longo da simulação de Monte Carlo apresenta coerência narrativa realista sem inversões abruptas injustificadas."),
        ("H2 - Teste Qui-Quadrado", "h2_chi_square.py", "Demonstra dependência e viabilidade estatística atestando que os eixos ESG não enviesam sistematicamente os feedbacks, simulando uma amostra humana randômica."),
        ("H3 - Capacidade Preditiva (Tendência Temporal)", "h3_predictive_trend.py", "Valida a viabilidade de modelagem matemática (OLS) sobre a base temporal para viabilizar projeções preditivas futuras aos gestores."),
        ("H3' - Qualidade do Texto e Aceitação", "h3_quality_text.py", "Avalia a proporção quantitativa de aceitação (Boas) e aplica mineração básica de texto para mensurar o acolhimento personalizado e nominativo."),
        ("H4' - Descoberta de Clusters Interpretáveis", "h4_cluster_validation.py", "Valida através de especialistas humanos a coerência e precisão das análises qualitativas (perguntas, sugestões e enquadramento de eixos) geradas pela IA."),
        ("H5' - Identificação Precoce de Risco", "h5_predictive_early.py", "Comprova semanticamente a capacidade da IA intervir de maneira acolhedora/preventiva quando detecta traços precoces de baixa adesão ao eixo ESG avaliado.")
    ]

    relatorio_path = os.path.join(base_dir, "relatorio_consolidado.txt")
    
    print("⏳ Iniciando execução em lote dos testes analíticos (H1, H2, H3, H5)...")

    with open(relatorio_path, "w", encoding="utf-8") as relatorio:
        relatorio.write("=== RELATÓRIO CONSOLIDADO DE VALIDAÇÃO DAS HIPÓTESES DE ARQUITETURA ===\n\n")
        
        for nome, script, explicacao in scripts:
            relatorio.write(f"--- {nome} ---\n")
            relatorio.write(f"Hipótese Corroborada / Objetivo: {explicacao}\n\n")
            
            script_full_path = os.path.join(base_dir, script)
            
            try:
                # Executar script a partir da raiz e capturar a saída
                # Configura a variável de ambiente para forçar o encoding UTF-8 nos scripts executados (evita erro no Windows)
                env = os.environ.copy()
                env["PYTHONIOENCODING"] = "utf-8"
                resultado = subprocess.run([sys.executable, script_full_path], cwd=project_root, capture_output=True, text=True, encoding="utf-8", env=env, check=True)
                relatorio.write(">> SAÍDA DO TERMINAL:\n")
                relatorio.write(resultado.stdout)
                relatorio.write("\n" + "="*80 + "\n\n")
            except subprocess.CalledProcessError as e:
                relatorio.write(f">> ERRO AO EXECUTAR SCRIPT:\n{e.stderr}\n\n" + "="*80 + "\n\n")
            except FileNotFoundError:
                relatorio.write(f">> SCRIPT NÃO ENCONTRADO: {script_full_path}\n\n" + "="*80 + "\n\n")

    print(f"✅ Execução concluída! Relatório consolidado gerado com sucesso em: {relatorio_path}")

if __name__ == "__main__":
    main()