// Flow Início, etapa "Disparar quartas".
// Entradas: draw (saída de "Sortear chave") e moved (resposta da movimentação para as quartas).
// Envia as quatro partidas das quartas ao simulador, depois que os cards já estão em "Quartas de final".

const SIMULATOR = 'https://ipaas.pipefy.com/api/v1/webhooks/PcRpsKsO0mvhKEpimpZ9i';
const RETURN_URL = 'https://ipaas.pipefy.com/api/v1/webhooks/kWlKlvHypIipDk8w7Gyq9';

const parse = (value) => (typeof value === 'string' ? JSON.parse(value) : value);
// A saída inteira de uma etapa Code pode chegar embrulhada em { output }.
const unwrap = (value) => {
  const data = parse(value);
  return data && data.output && typeof data.output === 'object' ? data.output : data;
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
  const draw = unwrap(inputs.draw);
  const moved = parse(inputs.moved);
  if (moved.errors) throw new Error(`movimentação para as quartas falhou: ${JSON.stringify(moved.errors)}`);

  const enviadas = [];
  for (const n of [1, 2, 3, 4]) {
    const body = {
      player1: draw.chave[2 * n - 2].heroi,
      player2: draw.chave[2 * n - 1].heroi,
      url_retorno: RETURN_URL,
      identificador_da_rodada: `${draw.torneio}:QF-${n}`,
    };
    await post(body);
    enviadas.push(body.identificador_da_rodada);
  }
  return { torneio: draw.torneio, enviadas };
};
