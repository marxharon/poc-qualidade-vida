# Guia de Consenso Qualitativo (Codebook)

Este documento orienta os pesquisadores na utilização do artefato `dicionario_codigos_h4.csv`. Ele age como uma ponte entre a **Fase 2 (Codificação Aberta)** e a **Fase 3 (Categorização)** da Análise Temática.

## Por que usar o Dicionário de Códigos?
Durante a análise, os pesquisadores preencherão a coluna `[5] codigos_abertos_fase2` da matriz principal com termos livres. O Dicionário de Códigos garante que todos estejam falando a mesma língua. Se o pesquisador A anotar "Alucinação de Tema" e o pesquisador B anotar "Eixo Errado", o Dicionário estabelece qual será o termo oficial e padronizado para o artigo.

## Colunas do Dicionário

1. **codigo_padronizado:** O nome oficial e final do código (Ex: *Erro de Enquadramento de Eixo*).
2. **definicao_criterio_inclusao:** A regra de ouro. O que *precisa* acontecer no comentário do especialista para que ele receba esta etiqueta? Isso evita ambiguidades.
3. **exemplo_de_citacao_ancora:** Uma citação real (extraída da matriz principal) que serve como o "exemplo perfeito" daquele código. Útil para calibrar novos pesquisadores que entrarem no projeto.
4. **categoria_tematica_vinculada:** A qual das 3 grandes Dimensões (definidas na Fase 3 da matriz principal) este código pertence.
5. **status_consenso:** O estágio do debate entre os pesquisadores:
   - *Proposto:* Um pesquisador sugeriu, mas a equipe ainda não debateu.
   - *Em Discussão:* A equipe está debatendo se funde este código com outro.
   - *Aprovado:* Consenso atingido. A partir de agora, use apenas este nome na Matriz Qualitativa.

## Fluxo de Trabalho (Workflow) Sugerido

1. **Trabalho Individual (Divergência):** Cada pesquisador avalia uma amostra de linhas na `matriz_analise_qualitativa_h4.csv` de forma independente.
2. **Reunião de Alinhamento (Convergência):** Os pesquisadores abrem o `dicionario_codigos_h4.csv`. Eles comparam os códigos que criaram individualmente.
3. **Resolução de Conflitos:** 
   - *Sinônimos:* Fundem-se sob um único `codigo_padronizado`.
   - *Discordâncias:* Debatem a `definicao_criterio_inclusao` até concordarem sobre o que a IA de fato errou/acertou.
4. **Refinamento:** Voltam para a `matriz_analise_qualitativa_h4.csv` e limpam a Coluna 5 e 6, substituindo os termos soltos pelos termos "Aprovados" no Dicionário.

## Valor para o Artigo Científico
Mencionar este processo na seção de Metodologia é garantia de aprovação em crivos rigorosos. Você deve escrever algo como: 
> *"Para mitigar vieses interpretativos, os códigos extraídos na fase aberta foram submetidos a reuniões de consenso entre os pesquisadores. Elaborou-se um Codebook contendo definições operacionais e exemplos-âncora, garantindo o alinhamento inter-avaliadores (Inter-Coder Reliability) antes da consolidação dos eixos temáticos finais."*