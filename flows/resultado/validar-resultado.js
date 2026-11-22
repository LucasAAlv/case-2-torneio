// Flow Resultado, etapa "Validar resultado".
// Entradas: identificador e winner (do callback) e read (resposta da leitura das fases de rodada da Arena).
// Saída: valid, e, quando válido, a mutation que move o vencedor e o perdedor (e cria o card final na F-1).

const NEXT_PHASE = { QF: '344803534', SF: '344803536', F: '344739164' };
const GRAVE_PHASE = { QF: '344803533', SF: '344803535', F: '344803537' };
const READ_KEY = { QF: 'q', SF: 's', F: 'f' };
const MATCH_SIZE = { QF: 2, SF: 4, F: 8 };
const FINAL_PIPE = 307434674;
const PARTICIPANT = 'Lucas Alves';
const CARD_FIELDS = 'id started_current_phase_at fields { field { id } value }';

const parse = (value) => (typeof value === 'string' ? JSON.parse(value) : value);
const normalize = (text) => String(text ?? '').trim().toLowerCase();

const toCard = (edge) => {
  const fields = Object.fromEntries(edge.node.fields.map((f) => [f.field.id, f.value]));
  return {
    id: edge.node.id,
    heroi: fields.heroi,
    torneio: fields.torneio,
    posicao: Number(fields.posicao),
    entrou: edge.node.started_current_phase_at,
  };
};

export const code = async (inputs) => {
  const identificador = String(inputs.identificador ?? '').trim();
  const match = identificador.match(/^([a-z0-9-]+):(QF|SF|F)-(\d)$/);
  if (!match) return { valid: false, reason: `identificador inválido: ${identificador}` };

  const [, torneio, round, number] = match;
  const n = Number(number);
  const size = MATCH_SIZE[round];
  if (n < 1 || n > 8 / size) return { valid: false, reason: `partida inexistente: ${identificador}` };

  const read = parse(inputs.read);
  if (read.errors) throw new Error(`leitura da Arena falhou: ${JSON.stringify(read.errors)}`);

  const low = (n - 1) * size + 1;
  const high = n * size;
  const players = (read.data[READ_KEY[round]].cards.edges || [])
    .map(toCard)
    .filter((c) => c.torneio === torneio && c.posicao >= low && c.posicao <= high);
  if (players.length !== 2) {
    return { valid: false, reason: `partida ${identificador} não está em andamento` };
  }

  const winner = players.find((c) => normalize(c.heroi) === normalize(inputs.winner));
  if (!winner) return { valid: false, reason: `${inputs.winner} não joga a partida ${identificador}` };
  const loser = players.find((c) => c.id !== winner.id);
  const final = round === 'F';

  let query = 'mutation {'
    + ` w: moveCardToPhase(input: {card_id: ${winner.id}, destination_phase_id: ${NEXT_PHASE[round]}})`
    + ` { card { id current_phase { cards(first: 50) { edges { node { ${CARD_FIELDS} } } } } } }`
    + ` l: moveCardToPhase(input: {card_id: ${loser.id}, destination_phase_id: ${GRAVE_PHASE[round]}}) { card { id } }`;
  if (final) {
    query += ` champion: createCard(input: {pipe_id: ${FINAL_PIPE}, fields_attributes: [`
      + `{field_id: "nome_do_participante_do_processo_seletivo", field_value: ${JSON.stringify(PARTICIPANT)}}, `
      + `{field_id: "nome_do_campe_o", field_value: ${JSON.stringify(winner.heroi)}}]}) { card { id } }`;
  }
  query += ' }';

  return { valid: true, final, torneio, round, n, winner, loser, payload: { query } };
};
