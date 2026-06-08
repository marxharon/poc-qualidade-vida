# POC - Plataforma Inteligente de Qualidade de Vida (ESG)

Esta é a Prova de Conceito (POC) de uma plataforma inteligente para o monitoramento contínuo, anonimizado e não clínico da qualidade de vida dos empregados, baseada em Inteligência Artificial e Gêmeos Digitais.

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
4. **Gerenciador de Pacotes**: `npm` ou `yarn`.
5. **Git**: Para controle de versão.

## Passos Iniciais para Instalação e Configuração

### 1. Clonar o repositório
```bash
git clone <URL_DO_SEU_REPOSITORIO>
cd poc-qualidade-vida
```

### 2. Configurar Variáveis de Ambiente
Na raiz de cada projeto (`backend`, `frontend`, `mobile`, `ia-service`), você deverá criar um arquivo `.env` (que será ignorado pelo Git por segurança) contendo as configurações necessárias.

**Exemplo básico de `.env` para o `/backend`:**
```env
DATABASE_URL=postgres://usuario_local:senha_local@localhost:5432/beqv_db
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

> **Aviso:** As instruções específicas para inicializar cada módulo de software (backend, frontend, mobile e ia-service) serão adicionadas a este documento conforme o avanço dos próximos passos da implementação.