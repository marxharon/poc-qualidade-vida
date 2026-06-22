# Guia de Avaliação Qualitativa para Especialistas (ESG e RH)

Prezado(a) Especialista,

Este guia tem como objetivo orientar o preenchimento da planilha de validação qualitativa da Prova de Conceito (POC) da **Plataforma Inteligente de Qualidade de Vida**. Você está recebendo uma amostra de interações entre colaboradores (Gêmeos Digitais) e o nosso Mentor Conversacional de Inteligência Artificial.

Sua missão é avaliar a coerência, a empatia e a precisão técnica das análises feitas pela IA em três frentes principais: a formulação de perguntas, o direcionamento de sugestões e a classificação temática (Eixos ESG).

---

## 1. Como realizar a análise da planilha

Na planilha enviada (ex: `h4_amostra_rh.csv`), cada linha representa **uma interação**. Você terá acesso:
- **Ao Perfil da Persona:** Nome, traços de personalidade, gostos e desgostos.
- **Ao Diálogo:** A pergunta feita pela IA (`pergunta_ia`) e o relato natural do colaborador (`resposta_colaborador`).
- **À Ação da IA:** A sugestão de melhoria proposta (`sugestao_ia`) e o eixo ESG no qual a IA enquadrou a conversa (`eixo_classificado_ia`).

Você deverá preencher **4 colunas em branco** localizadas no final da planilha para cada linha avaliada:
1. `parecer_pergunta_ia (1-5)`
2. `parecer_sugestao_ia (1-5)`
3. `parecer_enquadramento_eixo (1-5)`
4. `comentarios_especialista` (Opcional, mas recomendado em caso de notas 1 ou 2 para fins de calibragem da IA).

---

## 2. Escala de Avaliação (1 a 5)

Utilize estritamente valores numéricos inteiros de 1 a 5 para as notas, considerando a seguinte régua:

*   **1 - Totalmente Inadequado:** A IA falhou criticamente. A resposta é desconexa, o eixo está completamente errado, ou a sugestão beira o risco clínico/antiético.
*   **2 - Inadequado:** A IA cometeu erros conceituais visíveis. Ignorou o perfil da persona ou forçou um contexto que não existia no relato.
*   **3 - Aceitável / Neutro:** A IA foi genérica. Não errou gravemente, mas usou abordagens padrão de "horóscopo", sem personalização profunda baseada no perfil ou na dor relatada.
*   **4 - Adequado:** A IA fez um bom trabalho. A pergunta fez sentido, o eixo foi bem escolhido e a sugestão é válida, acolhedora e aplicável.
*   **5 - Totalmente Adequado:** Excelência. A IA cruzou perfeitamente os gostos/desgostos da persona com o relato diário, fez uma sugestão altamente empática e assertiva, classificando no eixo ESG perfeito.

---

## 3. Critérios de Análise

### A. Avaliação da Pergunta gerada pela IA (`parecer_pergunta_ia`)
*   **O que observar:** A pergunta inicial formulada pela IA faz sentido com a personalidade da persona? Ela demonstra empatia e continuidade (memória) em relação ao perfil descrito?
*   **Nota Alta (4-5):** Perguntas que soam naturais, usam uma linguagem alinhada à persona e citam sutilmente seus interesses ou sua rotina.
*   **Nota Baixa (1-2):** Perguntas robóticas, engessadas ou que ignorem sumariamente o contexto prévio do colaborador.

### B. Avaliação da Sugestão da IA (`parecer_sugestao_ia`)
*   **O que observar:** Analise a `resposta_colaborador` e verifique se a `sugestao_ia` ataca a questão relatada de forma prática e não-clínica.
*   **Nota Alta (4-5):** Ações práticas, curtas, exequíveis no ambiente corporativo e que respeitam os limites do RH (foco em melhoria contínua e bem-estar).
*   **Nota Baixa (1-2):** Sugestões irreais, invasivas, que soem como reprimendas ou que prescrevam condutas médicas/psicológicas (que fogem do escopo do bot).

### C. Avaliação do Enquadramento no Eixo ESG (`parecer_enquadramento_eixo`)
*   **O que observar:** O tema central do desabafo ou relato do colaborador (`resposta_colaborador`) corresponde de fato ao `eixo_classificado_ia` apontado pela IA?

---

## 4. Guia de Eixos ESG (Para avaliação do enquadramento)

Abaixo estão os 10 eixos utilizados pelo sistema e o que você deve buscar no relato para validar se a nota do enquadramento deve ser alta:

**1. Saúde Física**
*   *Foco:* Condições corporais gerais, dores, sedentarismo, ergonomia, prevenção de doenças.
*   *Como avaliar:* Se o relato citar dor nas costas, cansaço físico extremo, falta de tempo para exercícios físicos ou má postura no trabalho, o enquadramento neste eixo está correto.

**2. Saúde Mental e Emocional**
*   *Foco:* Equilíbrio psicológico, estresse, sinais de burnout, ansiedade, exaustão.
*   *Como avaliar:* Correto se a pessoa relata estar "no limite", com dificuldade para respirar ou focar devido ao estresse, chorosa, ansiosa com prazos, sentindo-se exausta mentalmente ou apática.

**3. Clima Organizacional e Engajamento**
*   *Foco:* Motivação macro, orgulho de pertencer à empresa, moral da equipe como um todo.
*   *Como avaliar:* Correto se o relato falar sobre a energia geral do departamento, desmotivação sistêmica, falta de propósito nos projetos corporativos ou alto engajamento com a missão da empresa.

**4. Equilíbrio entre Vida Pessoal e Profissional (Work-life Balance)**
*   *Foco:* Sustentabilidade da jornada, horas extras excessivas, incapacidade de desconectar.
*   *Como avaliar:* Relatos sobre "trabalhar até tarde frequentemente", "não conseguir desligar nos fins de semana", "responder e-mails de madrugada" ou "impactos do trabalho na família" devem ser enquadrados aqui.

**5. Segurança e Saúde Ocupacional**
*   *Foco:* Prevenção de acidentes físicos no trabalho, riscos estruturais ou de deslocamento.
*   *Como avaliar:* Adequado para relatos objetivos sobre equipamentos perigosos, falta de estrutura física segura ou incidentes/quase acidentes na rotina.

**6. Diversidade, Equidade e Inclusão (DEI)**
*   *Foco:* Justiça social, discriminação, representatividade, machismo, racismo, capacitismo.
*   *Como avaliar:* Correto se o colaborador relatar ser interrompido por questões de gênero, piadas preconceituosas na equipe ou sentimento claro de exclusão e tratamento desigual.

**7. Desenvolvimento e Crescimento Profissional**
*   *Foco:* Oportunidades de carreira, falta de treinamento, estagnação, aprendizado.
*   *Como avaliar:* Relatos do tipo "estou fazendo a mesma coisa há 5 anos", "gostaria de mais autonomia", "preciso de um curso" ou "sinto que não estou evoluindo aqui" pertencem a este eixo.

**8. Reconhecimento e Recompensas**
*   *Foco:* Valorização explícita, remuneração, feedback positivo e bônus.
*   *Como avaliar:* Adequado quando a dor central é "não sou notado pelo meu esforço", "trabalhei dobrado em um projeto e não ganhei nem um obrigado" ou insatisfação com a falta de mérito/benefícios.

**9. Qualidade das Relações Interpessoais**
*   *Foco:* Conflitos diretos, ambiente social, amizades, trabalho em equipe.
*   *Como avaliar:* Correto se a narrativa for sobre atritos com indivíduos ("briguei com um par"), problemas pontuais de colaboração no time ou dificuldades de se relacionar com a equipe de forma geral.

**10. Segurança Psicológica e Cultura de Escuta**
*   *Foco:* Medo de errar, retaliação por expressar ideias, liderança que não ouve, ambiente punitivo.
*   *Como avaliar:* Enquadramento ideal se o colaborador relatar "tenho medo de dar minha opinião e sofrer retaliação", "se eu cometer um erro aqui não serei amparado" ou percepção de portas fechadas na liderança.

---
*Agradecemos a sua contribuição técnica para a validação desta arquitetura preditiva.*