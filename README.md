# POC - Plataforma Inteligente de Qualidade de Vida (ESG)

Esta é a Prova de Conceito (POC) de uma plataforma inteligente para o monitoramento contínuo, anonimizado e não clínico da qualidade de vida dos empregados, baseada em Inteligência Artificial e Gêmeos Digitais para apoio ao pilar ESG corporativo.

## Estrutura do Projeto (Monorepo)

- `/backend`: API Node.js com Drizzle ORM (Rotas, Controladores, Serviços, Modelos).
- `/frontend`: Aplicação Web/Next.js do Painel do Gestor (Dashboard analítico).
- `/mobile`: App React Native/Expo do Colaborador.
- `/ia-service`: Serviço dedicado ao processamento de LLM e integração com a memória do Gêmeo Digital (ChromaDB).
- `/infra`: Arquivos de configuração da infraestrutura (Docker compose para serviços conteinerizados).

## Pré-requisitos

Para rodar este projeto localmente para o desenvolvimento da POC, você precisará das seguintes ferramentas instaladas:

1. **PostgreSQL**: Deve estar instalado **localmente** na sua máquina (não via Docker para este ambiente de desenvolvimento).
   - Crie um banco de dados chamado `beqv_db`.
2. **Docker e Docker Compose**: Necessário exclusivamente para rodar o banco de dados vetorial ChromaDB.
3. **Node.js**: Versão 18 ou superior.
4. **Conta na OpenAI**: Para obtenção de uma chave de API válida (`OPENAI_API_KEY`) para o LLM.
5. **Expo Go (Opcional)**: App de celular para simular a aplicação móvel.

## Passos Iniciais para Instalação e Configuração

### 1. Clonar o repositório
```bash
git clone <URL_DO_SEU_REPOSITORIO>
cd poc-qualidade-vida
```

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env` nas seguintes pastas com as configurações necessárias:

**Exemplo básico de `.env` para o `/backend`:**
```env
DATABASE_URL=postgres://usuario_local:senha_local@localhost:5432/beqv_db
PORT=3000
```

**Exemplo básico de `.env` para o `/ia-service`:**
```env
# URL da API do LLM local (ex: Ollama com Llama 3) ou serviço externo
LLM_API_URL=http://localhost:11434/api/generate
CHROMADB_URL=http://localhost:8000
```

### 3. Subir a Infraestrutura Vetorial (ChromaDB)
```bash
cd infra
docker-compose up -d
```
*Nota: Certifique-se de que o PostgreSQL local também esteja rodando.*

### 4. Configurar e Iniciar o Backend (API Principal)
O backend é responsável pelas regras de negócios e por salvar as informações estruturadas no PostgreSQL. Abra um terminal e execute:
```bash
cd backend
npm install
npm run db:generate   # Gera as migrações estruturais do banco
npm run db:migrate    # Aplica as tabelas no banco de dados local
npm run db:seed       # Popula a tabela com os 10 Eixos ESG
npm run dev           # Inicia o servidor na porta 3000
```

### 5. Configurar e Iniciar o IA Service (Cérebro da Plataforma)
Serviço dedicado à comunicação com a OpenAI e a memória no ChromaDB. Abra um novo terminal:
```bash
cd ia-service
npm install --legacy-peer-deps
npm run dev           # Inicia o servidor na porta 3002
```

### 6. Iniciar o Aplicativo Móvel (Colaborador)
O app em React Native servirá como a interface do mentor. Abra um novo terminal:
```bash
cd mobile
npm install
npm start
```
*Dica: Após o script rodar, pressione a tecla `w` no terminal para simular o app diretamente no seu navegador web.*

### 7. Iniciar o Dashboard Web (Gestor)
Painel de consumo dos dados anonimizados. Abra um novo terminal:
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

## Fluxo de Teste da POC (End-to-End)

Para avaliar a jornada completa planejada no artigo, siga este roteiro prático:

1. **Criação do Gêmeo Digital Individual:** Acesse o app móvel, inicie o onboarding, preencha as 8 perguntas sobre seu perfil e aceite a política de privacidade (LGPD). A IA resumirá sua "essência" semanticamente e armazenará o vetor base no banco `ChromaDB`.
2. **Mentor Conversacional Diário:** No chat do app, responda como você está se sentindo. A IA processará seu relato em linguagem natural (utilizando a OpenAI) atrelado a um Eixo ESG sorteado do dia, gerando uma sugestão corporativa e acolhedora, sem vieses médicos.
3. **Aceitação do Usuário:** Dentro do chat, consulte o painel de Transparência da IA (botão "Ver Detalhes") e realize a avaliação geral da ferramenta (Estrelas) para testar a aderência do colaborador.
4. **Motor de Agrupamento Anonimizado:** Pelo navegador, simule a rotina noturna (cronjob) do motor analítico acessando o endpoint oculto: `http://localhost:3000/api/admin/run-analyst`. O backend buscará os humores estruturados e categorizará os colaboradores em 10 grupos de riscos comportamentais.
5. **Plataforma Analítica:** Acesse o dashboard web (`http://localhost:3001` ou a porta indicada no terminal do frontend). Observe os Gráficos de Radar (aderência real vs meta ESG) e o Gráfico de Linhas (tendência preditiva), provando que o Gestor pode realizar a tomada de decisões preventivas mantendo 100% da privacidade do trabalhador individual (Gêmeos Organizacionais).