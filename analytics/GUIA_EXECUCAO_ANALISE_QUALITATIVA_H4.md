# Guia de Execução da Análise Qualitativa (Hipótese H4)

Este documento orienta o preenchimento da planilha `matriz_analise_qualitativa_h4.csv` pelo pesquisador responsável. O objetivo é registrar sistematicamente a aplicação da **Análise Temática (Braun & Clarke)** associada à **Análise de Conteúdo (Bardin)**.

## Estrutura da Planilha

A planilha é composta por 7 colunas, que representam a esteira de processamento dos dados, do mais cru (bruto) ao mais refinado (síntese analítica).

### Ordem e Instruções de Preenchimento

#### Passo 1: Preparação do Dataset (Colunas 1 a 4)
*As colunas 1 a 4 contêm os dados brutos exportados do consolidador e não exigem esforço analítico, apenas organização.*
*   **[1] id_interacao:** Identificador único da interação para rastreabilidade.
*   **[2] avaliador:** Qual especialista fez o comentário.
*   **[3] notas_quanti_originais (P/S/E):** As três notas dadas (Pergunta / Sugestão / Eixo) para dar contexto à análise de triangulação.
*   **[4] comentario_original:** O texto completo e literal redigido pelo especialista.

#### Passo 2: Codificação Aberta - Fase 2 (Coluna 5)
*Esta é a primeira etapa ativa do pesquisador. O objetivo é resumir "do que se trata" o comentário em etiquetas curtas.*
*   **[5] codigos_abertos_fase2:** Leia o comentário original (Coluna 4). Extraia de 1 a 4 fragmentos ou palavras-chave que representem a essência da crítica. 
*   *Como preencher:* Use termos separados por vírgula. 
*   *Exemplos:* `Ausência de personalização`, `Acerto de persona`, `Eixo forçado`, `Redundância da IA`, `Ignorância do relato`.

#### Passo 3: Agrupamento em Temas / Categorias - Fase 3 (Coluna 6)
*Após preencher a Coluna 5 para várias linhas, você perceberá que os códigos se repetem. É hora de agrupá-los em grandes dimensões de avaliação.*
*   **[6] categoria_tematica_fase3:** Analise os códigos da Coluna 5 e os enquadre em um dos 3 grandes Temas Axiais definidos para a H4:
    1.  **Dimensão de Ancoragem de Persona:** Tudo o que envolver uso ou ausência de perfil, gostos, desgostos e personalização da pergunta.
    2.  **Dimensão de Acionabilidade da Sugestão:** Tudo o que disser respeito a sugestões genéricas, redundantes, condescendentes ou úteis.
    3.  **Dimensão de Acurácia de Classificação (Eixos):** Tudo relacionado a erros, acertos, eixos forçados ou alucinação de tema.
*   *Nota:* Uma mesma interação pode ter códigos pertencentes a mais de uma categoria. Escolha a categoria *principal* abordada pela crítica do especialista, ou duplique a linha se quiser analisar os temas separadamente.

#### Passo 4: Triangulação e Síntese - Fase 4 (Coluna 7)
*Esta é a etapa mais rica, que servirá de insumo direto (citações) para a redação do artigo científico.*
*   **[7] analise_triangulacao_fase4:** Responda mentalmente: *Como as notas dadas (Coluna 3) se relacionam com a categoria temática encontrada (Coluna 6)? E como isso se compara aos demais avaliadores?*
*   *Como preencher:* Escreva uma ou duas frases concluindo o achado daquela interação específica.
*   *Exemplo:* "Embora o avaliador 1 tenha dado nota máxima por educação gramatical da IA, a análise crítica revela que a IA falhou em Ancoragem de Persona, justificando as notas baixas na mesma iteração dadas por especialistas mais rigorosos."

---

## Dicas para Metodologia Acadêmica (Tier 1)

1. **Rastreabilidade (Audit Trail):** Mantenha um log de decisões. Se você mudar o nome de uma categoria temática no meio do processo, atualize as linhas anteriores. Isso garante a consistência (reliability) do estudo.
2. **Saturação Teórica:** Você notará que após analisar 20 ou 30 comentários, nenhuma "categoria nova" precisará ser criada na Coluna 6. Isso significa que você atingiu a *saturação teórica*, um argumento excelente para incluir na seção de metodologia do seu artigo para validar o tamanho da amostra qualitativa.
3. **Dissonância Evidenciada:** Dê atenção especial às linhas onde as notas de `[3]` foram altas, mas os comentários em `[4]` traziam ressalvas. Essa discrepância é a prova irrefutável da importância da sua hipótese H4 (o humano percebendo falhas sutis da IA).