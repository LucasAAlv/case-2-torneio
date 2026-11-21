# Contrato do Simulador de Batalhas

O que o enunciado define e o que foi observado em testes manuais, em 18/11/2026.

## Requisição

```http
POST https://ipaas.pipefy.com/api/v1/webhooks/PcRpsKsO0mvhKEpimpZ9i
Content-Type: application/json

{
  "player1": "Batman",
  "player2": "Hulk",
  "url_retorno": "<webhook que recebe o resultado>",
  "identificador_da_rodada": "QF-1"
}
```

- **O método precisa ser POST.** Com GET, o simulador responde 200 `{}` e não processa a batalha.
- A resposta imediata é 200 `{}`. Ela só confirma o recebimento, não traz o resultado.
- O domínio `ipaas.pipefy.com` é o mesmo dos webhooks do Integration Hub. Isso indica que o próprio simulador é uma receita, e que o `url_retorno` pode ser o webhook de entrada de uma receita do torneio. Ainda não foi testado.

## Callback

```json
{ "winner": "Batman", "identificador": "QF-1" }
```

- O campo de volta se chama **`identificador`**, e não `identificador_da_rodada`. Ele devolve o valor enviado na requisição.
- O callback traz só o vencedor. O perdedor é deduzido do estado da partida.
- **Não há autenticação.** Qualquer um que conheça a URL pode enviar um resultado.

## Comportamento observado

| Observação | Consequência para o desenho |
| --- | --- |
| O callback chega em segundos, até cerca de 20 s. | O torneio inteiro leva cerca de 1 min em três rodadas. |
| Os callbacks chegam **fora da ordem** de envio. | Cada resultado precisa trazer a sua posição na chave pelo `identificador`. |
| Num teste, repetir o mesmo par deu o mesmo vencedor. | Não dá para depender disso: a amostra é de um caso. |
| Não há autenticação. | Só é aceito resultado de partida existente, em andamento e com vencedor entre os dois jogadores dela. |

## Pontos ainda não verificados

- Se o simulador reenvia o callback quando o webhook de retorno falha ou demora.
- Se ele envia mais de um callback para a mesma requisição.
- Qual é o limite de tamanho e de caracteres do `identificador_da_rodada`.
- O formato exato do `winner`: se vem igual ao nome enviado, com a mesma caixa e os mesmos espaços.
