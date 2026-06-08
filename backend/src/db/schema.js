import { pgTable, serial, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

export const colaboradores = pgTable('colaboradores', {
  id_colaborador: serial('id_colaborador').primaryKey(),
  credenciais_acesso: text('credenciais_acesso').notNull(),
  data_criacao: timestamp('data_criacao').defaultNow(),
});

export const personas = pgTable('personas', {
  id_persona: serial('id_persona').primaryKey(),
  id_colaborador: integer('id_colaborador').references(() => colaboradores.id_colaborador),
  nome_preferido: text('nome_preferido'),
  personalidade: text('personalidade'),
  gostos: text('gostos'),
  desgostos: text('desgostos'),
  relacao_equipe: text('relacao_equipe'),
  sentimento_trabalho: text('sentimento_trabalho'),
  motivacoes: text('motivacoes'),
  hardskills_softskills: text('hardskills_softskills'),
  aceite_lgpd_termos: boolean('aceite_lgpd_termos').default(false),
});

export const eixosESG = pgTable('eixos_esg', {
  id_eixo: serial('id_eixo').primaryKey(),
  nome: text('nome').notNull(),
  descricao_foco: text('descricao_foco'),
});

export const interacoes = pgTable('interacoes', {
  id_interacao: serial('id_interacao').primaryKey(),
  id_persona: integer('id_persona').references(() => personas.id_persona),
  id_eixo: integer('id_eixo').references(() => eixosESG.id_eixo),
  data_interacao: timestamp('data_interacao').defaultNow(),
  pergunta_ia: text('pergunta_ia'),
  resposta_colaborador: text('resposta_colaborador'),
  percentual_adesao: integer('percentual_adesao'),
  sugestao_ia: text('sugestao_ia'),
  feedback_sugestao: text('feedback_sugestao'), // boa, ruim, indiferente
});

export const gemeosOrganizacionais = pgTable('gemeos_organizacionais', {
  id_agrupamento: serial('id_agrupamento').primaryKey(),
  nome_categoria: text('nome_categoria'), // ex: Sedentarismo, Risco Burnout
  descricao_perfil: text('descricao_perfil'),
});

export const historicoEvolucaoESG = pgTable('historico_evolucao_esg', {
  id_historico: serial('id_historico').primaryKey(),
  id_agrupamento: integer('id_agrupamento').references(() => gemeosOrganizacionais.id_agrupamento),
  id_eixo: integer('id_eixo').references(() => eixosESG.id_eixo),
  data_medicao: timestamp('data_medicao').defaultNow(),
  pontuacao_agregada: integer('pontuacao_agregada'),
  sugestao_estrategica_ia: text('sugestao_estrategica_ia'),
});