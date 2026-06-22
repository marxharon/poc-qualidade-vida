# POC: Monitoramento Preditivo de Bem-Estar e Qualidade de Vida (Gêmeos Digitais e IA)

Este repositório contém a Prova de Conceito (POC) da arquitetura baseada em Gêmeos Digitais Dinâmicos e Inteligência Artificial Generativa para monitoramento contínuo dos eixos ESG em ambientes corporativos.

## 📖 Documentação e Modelagem do Projeto

Para compreender a fundo a concepção teórica e estrutural desta Prova de Conceito, consulte os documentos fundacionais do projeto:
- **[Modelo do Framework Atualizado (V2)](./modelo_atualizado.txt)**: Detalha as regras de negócio, o fluxo operacional do Gêmeo Digital Preditivo, a modelagem dinâmica dos agrupamentos organizacionais e a lista completa dos 10 eixos ESG de acompanhamento.
- **[Plano de Atualização (Gêmeos Digitais V2)](./atualizacao_gemeo_digital.txt)**: Documenta a evolução do plano de implementação inicial, detalhando a refatoração para incorporar os conceitos de gêmeos digitais dinâmicos e preditivos utilizando o banco vetorial ChromaDB.
- **[Plano de Implementação da POC](./plano.txt)**: Descreve a diretriz arquitetural (monorepo), a stack tecnológica escolhida e o roteiro passo a passo adotado pela equipe técnica para o desenvolvimento e modularização de cada ecossistema.

## � Pré-requisitos de Infraestrutura

Antes de executar a aplicação ou os scripts de análise, certifique-se de ter os seguintes componentes instalados:
- **Node.js** (v18+ recomendada)
- **Python** (v3.9+ recomendada para os scripts de análise estatística)
- **Docker Desktop** (Obrigatório para instanciar o banco vetorial ChromaDB localmente). [Baixe e instale através do site oficial](https://www.docker.com/products/docker-desktop/). Certifique-se de iniciar o aplicativo Docker após a instalação.
- **PostgreSQL** (Rodando localmente para armazenamento relacional dos perfis gerados)

> **Atenção:** Configure as variáveis de ambiente baseadas nos arquivos de exemplo (ex: `.env.example`). O `.gitignore` do repositório garante que chaves sensíveis de API (OpenAI) e credenciais de banco não sejam expostas.

## 🚀 Instalação e Configuração

A arquitetura de persistência deste projeto adota um **modelo de dados misto (híbrido)**:
- **Relacional (PostgreSQL):** Requer instalação local direta, responsável por armazenar dados estruturados, histórico e cadastros.
- **Vetorial (ChromaDB):** Executado isoladamente em contêiner (Docker), responsável por armazenar os *embeddings* processados pela IA e garantir a memória semântica do Gêmeo Digital.

Siga os passos abaixo para configurar e executar os ecossistemas do projeto localmente de forma modular.

### 1. Clonar o Repositório e Configurar Variáveis de Ambiente
```bash
git clone <url-do-repositorio>
cd POC1
cp .env.example .env
```
Edite o arquivo `.env` inserindo sua chave de API da OpenAI (`OPENAI_API_KEY`) e ajustando eventuais strings de conexão.

### 2. Subir a Infraestrutura (Bancos de Dados)
**PostgreSQL Relacional:**
Certifique-se de que o PostgreSQL está instalado e rodando localmente (na porta padrão 5432). Crie um banco de dados vazio chamado `beqv_db`.

**ChromaDB Vetorial (Docker):**
Com o Docker Desktop aberto e em execução no seu computador, navegue até a pasta de infraestrutura e inicie o contêiner responsável pela memória da IA:
```bash
cd infra
docker-compose up -d
cd ..
```

### 3. Iniciar o Backend Principal
Responsável por gerenciar as regras de negócio relacional e as rotas principais.
```bash
cd backend
npm install
# Executar as migrações para criar as tabelas estruturais no banco local
npx drizzle-kit push
# Popular o banco relacional com os 10 Eixos ESG de avaliação (Seed inicial)
npm run seed
# Iniciar a API Node.js
npm run dev
cd ..
```

### 4. Iniciar o Serviço de IA (`ia-service`)
Microsserviço isolado dedicado para a comunicação com a API da OpenAI e acesso ao ChromaDB.
```bash
cd ia-service
npm install
npm run dev
cd ..
```

### 5. Iniciar o Dashboard Web (Acesso do Gestor)
Plataforma em Next.js exibindo métricas analíticas e preditivas dos Gêmeos Organizacionais.
```bash
cd frontend
npm install
npm run dev
# Acesse http://localhost:3000 no seu navegador web
cd ..
```

### 6. Iniciar o Aplicativo Móvel (Acesso do Colaborador)
O app do colaborador, construído em React Native com Expo, que sustenta as conversas fluídas.
```bash
cd mobile
npm install
npm start
```
Ao surgir o QR Code no terminal, pressione a tecla `w` para simular direto no navegador, ou use a tecla `a`/`i` caso possua os emuladores Android Studio/Xcode abertos. Para usar em um celular físico, baixe o app gratuito **Expo Go** e leia o QR Code.

---

## 📊 Roteiro de Replicação das Análises e Validação das Hipóteses

Para comprovar o embasamento científico desta POC, o experimento foi dividido em duas macrotapas: a **geração do córtex de dados sintéticos** e a **esteira de testes analíticos automatizados** para validação das hipóteses (H1' a H5'). 

Todos os scripts de simulação e análise encontram-se organizados no diretório `/analytics` e na subpasta `/analytics/hipoteses_validation`. Siga a ordem abaixo rigorosamente para reproduzir os resultados da POC.

### Passo 1: Geração de Dados Sintéticos (Simulação de Monte Carlo)
**Script:** `monte_carlo.js` (localizado em `/analytics`)

* **O que faz:** Para respeitar o preceito de *Safety-by-Design* (não testando IA preditiva em humanos reais logo de início), este script instancia dezenas de "Personas" (Gêmeos Digitais base). Ele simula o recorte temporal, fazendo a IA interagir diariamente com as entidades virtuais e populando tanto o banco relacional (PostgreSQL) quanto a memória vetorial (ChromaDB) com as interações e sentimentos gerados.
* **Como usar:**
  ```bash
  cd analytics
  node monte_carlo.js
  ```
* **Saída Esperada:** Confirmação de inserção no banco de dados com a amostra de interações sintéticas.

### Passo 2: Exportação e Preparação do Dataset
**Script:** `export_data.py`

* **O que faz:** Conecta-se ao banco de dados relacional (PostgreSQL) local e exporta as tabelas geradas na simulação para arquivos CSV. Esses arquivos serão consumidos pelas análises estatísticas subsequentes.
* **Como usar:**
  ```bash
  python export_data.py
  ```
* **Saída Esperada:** Arquivos `.csv` (ex: `personas.csv`, `interacoes.csv`) gerados na pasta de validação.

### Passo 3: Verificação de Integridade (Sanity Check)
**Script:** `sanity_check.py`

* **O que faz:** Executa uma checagem rápida para garantir que os dados exportados estão íntegros e consistentes antes de prosseguir com as validações (ex: valida a quantidade correta de personas extraídas e a ausência de valores nulos nos feedbacks).
* **Como usar:**
  ```bash
  python sanity_check.py
  ```
* **Saída Esperada:** Mensagem de sucesso atestando que os dados estão prontos e confiáveis para análise.

### Passo 4: Teste de Unicidade e Hiper-personalização (H1')
**Script:** `h1_uniqueness.py`

* **O que faz:** Combate o efeito *Survey Fatigue* aferindo se a IA gerou perguntas realmente únicas ou apenas repetiu padrões. Valida se a IA gera abordagens dinâmicas e baseadas na memória semântica do Gêmeo Digital, avaliando a similaridade (TF-IDF/Cosseno) entre os *prompts*.
* **Como usar:**
  ```bash
  python h1_uniqueness.py
  ```
* **Saída Esperada:** Um relatório indicando a taxa de unicidade semântica (espera-se `> 95%`), validando a H1'.

### Passo 5: Teste de Independência Estatística e Coerência (H2 e H2')
**Scripts:** `h2_chi_square.py` e `h2_temporal_coherence.py`

* **O que fazem:** 
  - `h2_chi_square.py` (H2): Demonstra dependência e viabilidade estatística atestando que os eixos ESG não enviesam sistematicamente os feedbacks, simulando uma amostra humana randômica.
  - `h2_temporal_coherence.py` (H2'): Comprova que a evolução temporal dos sentimentos ao longo da simulação de Monte Carlo apresenta coerência narrativa realista sem inversões abruptas injustificadas.
* **Como usar:**
  ```bash
  python h2_chi_square.py
  python h2_temporal_coherence.py
  ```
* **Saída Esperada:** O valor do $\chi^2$ e do *p-valor*. Um *p-valor > 0.05* valida formalmente a ausência de *prompt bias* (independência) e valida as hipóteses H2 e H2'.

### Passo 6: Predição Longitudinal e Qualidade de Texto (H3 e H3')
**Scripts:** `h3_predictive_trend.py` e `h3_quality_text.py`

* **O que fazem:**
  - `h3_predictive_trend.py` (H3): Valida a viabilidade de modelagem matemática (OLS) sobre a base temporal para viabilizar projeções preditivas futuras aos gestores.
  - `h3_quality_text.py` (H3'): Avalia a proporção quantitativa de aceitação (Boas) e aplica mineração básica de texto para mensurar o acolhimento personalizado e nominativo.
* **Como usar:**
  ```bash
  python h3_predictive_trend.py
  python h3_quality_text.py
  ```
* **Saída Esperada:** O coeficiente de determinação (R²) apontando a previsibilidade e suporte para grafismos longitudinais de predição.

### Passo 7: Identificação Precoce de Risco (H5')
**Script:** `h5_predictive_early.py`

* **O que faz:** Comprova semanticamente a capacidade da IA intervir de maneira acolhedora/preventiva quando detecta traços precoces de baixa adesão ao eixo ESG avaliado.
* **Como usar:**
  ```bash
  python h5_predictive_early.py
  ```
* **Saída Esperada:** Um compilado numérico ou gráfico (semelhante ao gráfico de barras do artigo) mostrando a Contagem de Diagnósticos de Risco vs. Intervenções Proativas (espera-se uma eficácia elevada, $\sim 90\%$), validando o H5'.

### Passo 8: Preparação da Amostra para Avaliação Qualitativa (H4')
**Script:** `h4_prepare_sample.py`

* **O que faz:** Seleciona aleatoriamente uma amostra de 4 personas e suas interações correspondentes, gerando uma planilha CSV (`h4_amostra_rh.csv`) formatada com colunas em branco, pronta para ser distribuída.
* **Como usar:**
  ```bash
  python h4_prepare_sample.py
  ```
* **Saída Esperada:** Arquivo CSV com interações formatadas aguardando a avaliação humana.

### Documento de Suporte: Guia de Avaliação de Especialistas
**Documento:** `GUIA_AVALIACAO_ESPECIALISTAS.md`

* **O que é:** Um manual de apoio fundamental que deve ser entregue junto à planilha do passo 8. Ele orienta os especialistas humanos de RH/ESG sobre os critérios de análise às cegas da IA, detalhando as justificativas de cada nota na escala Likert (1 a 5) para a dimensão de adequação da IA.

### Passo 9: Validação Qualitativa de Especialistas (H4')
**Script:** `h4_cluster_validation.py`

* **O que faz:** Processa e compila as planilhas previamente preenchidas pela banca de especialistas humanos. Calcula a média da escala Likert (avaliação subjetiva) de todas as notas e determina a efetividade qualitativa da interpretação gerada pelo LLM.
* **Datasets (Planilhas de Avaliação):**
  - Especialista 1: `h4_amostra_rh_preenchida_especialista1.csv`
  - Especialista 2: `h4_amostra_rh_preenchida_especialista2.csv`
  - Especialista 3: `h4_amostra_rh_preenchida_especialista3.csv`
  - Especialista 4: `h4_amostra_rh_preenchida_especialista4.csv`
* **Como usar:**
  ```bash
  python h4_cluster_validation.py
  ```
* **Saída Esperada:** Média global de aprovação qualitativa (esperado $\ge 3.5$), atestando a validade técnica e confiabilidade do motor de IA na percepção humana e validando, em definitivo, a H4'.

### ⚡ Orquestração: Execução Automatizada (Opcional)
**Script:** `run_all_validations.py`

* **O que faz:** Este script funciona como um orquestrador central de conveniência. Ele engatilha todos os scripts de exportação, validação de integridade e os testes estatísticos (H1' a H5') sequencialmente e de forma totalmente automatizada.
* **Como usar:**
  ```bash
  python run_all_validations.py
  ```
* **Saída Esperada:** Um relatório contínuo impresso no terminal com a aprovação ou rejeição consolidadas das hipóteses e da simulação.

---

**Fim da execução.** Após rodar estes passos metodologicamente, você terá replicado e comprovado localmente todas as hipóteses apresentadas na Prova de Conceito do projeto.