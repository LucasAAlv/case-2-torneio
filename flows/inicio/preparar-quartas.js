// Flow Início, etapa "Preparar quartas".
// Entradas: draw (saída de "Sortear chave") e created (resposta da criação dos cards).
// Saída: a mutation que leva os 8 cards para "Quartas de final".

const QUARTERS_PHASE = 344739163;

const parse = (value) => (typeof value === 'string' ? JSON.parse(value) : value);
// A saída inteira de uma etapa Code pode chegar embrulhada em { output }.
const unwrap = (value) => {
  const data = parse(value);
  return data && data.output && typeof data.output === 'object' ? data.output : data;
};

export const code = async (inputs) => {
  const draw = unwrap(inputs.draw);
  const created = parse(inputs.created);
  if (created.errors) throw new Error(`criação dos cards falhou: ${JSON.stringify(created.errors)}`);

  const chave = draw.chave.map((c) => ({ ...c, id: created.data[`c${c.posicao}`].card.id }));
  const moves = chave.map((c) => `m${c.posicao}: moveCardToPhase(input: {card_id: ${c.id}, `
    + `destination_phase_id: ${QUARTERS_PHASE}}) { card { id } }`);

  return { torneio: draw.torneio, payload: { query: `mutation { ${moves.join(' ')} }` } };
};
