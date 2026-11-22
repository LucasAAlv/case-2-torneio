// Flow Resultado, etapa "Disparar próxima partida".
// Entradas: decision (saída de "Validar resultado") e moved (resposta da mutation que moveu os cards).
// Regra (D9): dispara quem entrou por último na fase; no empate, o card de maior posição.

const SIMULATOR = 'https://ipaas.pipefy.com/api/v1/webhooks/PcRpsKsO0mvhKEpimpZ9i';
const RETURN_URL = 'https://ipaas.pipefy.com/api/v1/webhooks/kWlKlvHypIipDk8w7Gyq9';
const NEXT_ROUND = { QF: 'SF', SF: 'F' };
const MATCH_SIZE = { SF: 4, F: 8 };

const parse = (value) => (typeof value === 'string' ? JSON.parse(value) : value);
// A saída inteira de uma etapa Code pode chegar embrulhada em { output }.
const unwrap = (value) => {
  const data = parse(value);
  return data && data.output && typeof data.output === 'object' ? data.output : data;
};

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

const post = async (body) => {
  let last;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(SIMULATOR, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (response.ok) return response.status;
      last = `HTTP ${response.status}`;
      if (response.status < 500) break;
    } catch (error) {
      last = error.message;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
  }
  throw new Error(`simulador não aceitou ${body.identificador_da_rodada}: ${last}`);
};

export const code = async (inputs) => {
  const decision = unwrap(inputs.decision);
  const moved = parse(inputs.moved);
  if (moved.errors) throw new Error(`movimentação falhou: ${JSON.stringify(moved.errors)}`);

  if (decision.final) {
    return { fired: false, campeao: decision.winner.heroi, card_final: moved.data.champion.card.id };
  }

  const round = NEXT_ROUND[decision.round];
  const size = MATCH_SIZE[round];
  const m = Math.ceil(decision.winner.posicao / size);
  const low = (m - 1) * size + 1;
  const high = m * size;
  const cards = moved.data.w.card.current_phase.cards.edges
    .map(toCard)
    .filter((c) => c.torneio === decision.torneio && c.posicao >= low && c.posicao <= high);

  const me = cards.find((c) => c.id === decision.winner.id);
  const rival = cards.find((c) => c.id !== decision.winner.id);
  if (!me) throw new Error(`card ${decision.winner.id} não apareceu na fase seguinte`);
  if (!rival) return { fired: false, reason: 'aguardando o adversário' };

  const mine = Date.parse(me.entrou);
  const theirs = Date.parse(rival.entrou);
  const iAmLast = mine > theirs || (mine === theirs && me.posicao > rival.posicao);
  if (!iAmLast) return { fired: false, reason: 'o adversário entrou por último e dispara a partida' };

  const [player1, player2] = [me, rival].sort((a, b) => a.posicao - b.posicao);
  const body = {
    player1: player1.heroi,
    player2: player2.heroi,
    url_retorno: RETURN_URL,
    identificador_da_rodada: `${decision.torneio}:${round}-${m}`,
  };
  const status = await post(body);
  return { fired: true, status, ...body };
};
