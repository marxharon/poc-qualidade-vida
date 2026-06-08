CREATE TABLE "colaboradores" (
	"id_colaborador" serial PRIMARY KEY NOT NULL,
	"credenciais_acesso" text NOT NULL,
	"data_criacao" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "eixos_esg" (
	"id_eixo" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"descricao_foco" text
);
--> statement-breakpoint
CREATE TABLE "gemeos_organizacionais" (
	"id_agrupamento" serial PRIMARY KEY NOT NULL,
	"nome_categoria" text,
	"descricao_perfil" text
);
--> statement-breakpoint
CREATE TABLE "historico_evolucao_esg" (
	"id_historico" serial PRIMARY KEY NOT NULL,
	"id_agrupamento" integer,
	"id_eixo" integer,
	"data_medicao" timestamp DEFAULT now(),
	"pontuacao_agregada" integer,
	"sugestao_estrategica_ia" text
);
--> statement-breakpoint
CREATE TABLE "interacoes" (
	"id_interacao" serial PRIMARY KEY NOT NULL,
	"id_persona" integer,
	"id_eixo" integer,
	"data_interacao" timestamp DEFAULT now(),
	"pergunta_ia" text,
	"resposta_colaborador" text,
	"percentual_adesao" integer,
	"sugestao_ia" text,
	"feedback_sugestao" text
);
--> statement-breakpoint
CREATE TABLE "personas" (
	"id_persona" serial PRIMARY KEY NOT NULL,
	"id_colaborador" integer,
	"nome_preferido" text,
	"personalidade" text,
	"gostos" text,
	"desgostos" text,
	"relacao_equipe" text,
	"sentimento_trabalho" text,
	"motivacoes" text,
	"hardskills_softskills" text,
	"aceite_lgpd_termos" boolean DEFAULT false
);
--> statement-breakpoint
ALTER TABLE "historico_evolucao_esg" ADD CONSTRAINT "historico_evolucao_esg_id_agrupamento_gemeos_organizacionais_id_agrupamento_fk" FOREIGN KEY ("id_agrupamento") REFERENCES "public"."gemeos_organizacionais"("id_agrupamento") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historico_evolucao_esg" ADD CONSTRAINT "historico_evolucao_esg_id_eixo_eixos_esg_id_eixo_fk" FOREIGN KEY ("id_eixo") REFERENCES "public"."eixos_esg"("id_eixo") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interacoes" ADD CONSTRAINT "interacoes_id_persona_personas_id_persona_fk" FOREIGN KEY ("id_persona") REFERENCES "public"."personas"("id_persona") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interacoes" ADD CONSTRAINT "interacoes_id_eixo_eixos_esg_id_eixo_fk" FOREIGN KEY ("id_eixo") REFERENCES "public"."eixos_esg"("id_eixo") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personas" ADD CONSTRAINT "personas_id_colaborador_colaboradores_id_colaborador_fk" FOREIGN KEY ("id_colaborador") REFERENCES "public"."colaboradores"("id_colaborador") ON DELETE no action ON UPDATE no action;