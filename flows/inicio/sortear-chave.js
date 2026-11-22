// Flow Início, etapa "Sortear chave".
// Entrada: read (heróis do database e total de cards da Arena).
// Saída: nome e slug do torneio, a chave sorteada e a mutation que cria os 8 cards em "Não iniciada".

const ARENA_PIPE = 307434666;
const PLACES = [
  'Gotham', 'Metrópolis', 'Asgard', 'Wakanda', 'Themyscira', 'Nova York', 'Sokovia', 'Latvéria',
  'Atlântida', 'Kamar-Taj', 'Star City', 'Central City', 'Coast City', 'Blüdhaven', "Hell's Kitchen",
  'Xandar', 'Lugar Nenhum', 'Apokolips', 'Krypton', 'Oa', 'Genosha', 'Madripoor', 'Terra Selvagem',
  'Arkham', 'Westchester', 'Fortaleza da Solidão', 'Batcaverna', 'Salão da Justiça',
  'Torre dos Vingadores', 'Zona Negativa', 'Mundo Bizarro', 'Monte Olimpo', 'Nova Gênesis',
  'Thanagar', 'Sakaar', 'Jotunheim', 'Nidavellir', 'Ilha da Caveira', 'Triskelion', 'Quinta Dimensão',
];

const parse = (value) => (typeof value === 'string' ? JSON.parse(value) : value);

const slugify = (text) => text
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const shuffle = (items) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const code = async (inputs) => {
  const read = parse(inputs.read);
  if (read.errors) throw new Error(`leitura falhou: ${JSON.stringify(read.errors)}`);

  const heroes = read.data.table.table_records.edges.map((edge) => edge.node.record_fields
    .find((f) => f.field.id === 'nome_participante').value.trim());
  if (heroes.length !== 8) throw new Error(`o database tem ${heroes.length} heróis, e não 8`);

  const numero = Math.ceil(read.data.pipe.cards_count / 8) + 1;
  const lugar = PLACES[Math.floor(Math.random() * PLACES.length)];
  const torneio = `${slugify(lugar)}-${numero}`;
  const nome = `${lugar} #${numero}`;
  const chave = shuffle(heroes).map((heroi, i) => ({ posicao: i + 1, heroi, titulo: `${nome} · ${heroi}` }));

  const creates = chave.map((c) => `c${c.posicao}: createCard(input: {pipe_id: ${ARENA_PIPE}, fields_attributes: [`
    + `{field_id: "titulo", field_value: ${JSON.stringify(c.titulo)}}, `
    + `{field_id: "heroi", field_value: ${JSON.stringify(c.heroi)}}, `
    + `{field_id: "torneio", field_value: "${torneio}"}, `
    + `{field_id: "posicao", field_value: "${c.posicao}"}]}) { card { id } }`);

  return {
    nome: `Batalha em ${nome}`,
    torneio,
    chave,
    payload: { query: `mutation { ${creates.join(' ')} }` },
  };
};
