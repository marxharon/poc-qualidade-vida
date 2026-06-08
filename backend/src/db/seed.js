import { db } from './index.js';
import { eixosESG } from './schema.js';

const eixos = [
  { nome: 'Saúde física', descricao_foco: 'Avalia condições gerais de saúde e prevenção de doenças.' },
  { nome: 'Saúde mental e emocional', descricao_foco: 'Foca no equilíbrio psicológico e prevenção de transtornos.' },
  { nome: 'Clima organizacional e engajamento', descricao_foco: 'Mede o ambiente de trabalho e a motivação dos colaboradores.' },
  { nome: 'Equilíbrio entre vida pessoal e profissional (work-life balance)', descricao_foco: 'Avalia a sustentabilidade da jornada de trabalho.' },
  { nome: 'Segurança e saúde ocupacional', descricao_foco: 'Relaciona-se à prevenção de acidentes e riscos no trabalho.' },
  { nome: 'Diversidade, equidade e inclusão (DEI)', descricao_foco: 'Reflete a justiça social dentro da organização.' },
  { nome: 'Desenvolvimento e crescimento profissional', descricao_foco: 'Avalia oportunidades de carreira e aprendizado.' },
  { nome: 'Reconhecimento e recompensas', descricao_foco: 'Mede a valorização dos colaboradores.' },
  { nome: 'Qualidade das relações interpessoais', descricao_foco: 'Avalia o ambiente social e colaboração interna.' },
  { nome: 'Segurança psicológica e cultura de escuta', descricao_foco: 'Mede o quanto os colaboradores se sentem seguros para se expressar e contribuir.' }
];

async function main() {
  console.log('Populando tabela de Eixos ESG...');
  await db.insert(eixosESG).values(eixos);
  console.log('10 Eixos ESG inseridos com sucesso!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Erro ao popular o banco:', err);
  process.exit(1);
});