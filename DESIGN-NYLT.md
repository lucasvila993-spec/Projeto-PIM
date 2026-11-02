# Guia de design da Clínica Saúde NYLT

Guia para refazer a landing (`index.html`) sem cara de site gerado por IA. Vale também para `/entrar`, `/paciente` e `/admin`.

## 1. Skills para usar

Rode nesta ordem, sempre citando este arquivo no pedido (ex.: "siga o DESIGN-NYLT.md").

| Skill | Para quê | Quando |
| --- | --- | --- |
| `/design-taste-frontend` | Escolher a direção visual, montar as seções e conferir a página com o inspetor (`inspect.mjs`) | Primeiro, para a landing inteira |
| `/frontend-design` | Tipografia, paleta e cortar o que for enfeite genérico | Junto com a anterior, em cada seção |
| `/copywriting` | Reescrever títulos e textos com a voz da clínica | Antes de mexer no visual de cada seção |
| `/copy-editing` | Revisar o texto final (curto, claro, sem frases de propaganda) | No fim |
| `/cro` | Conferir se "Agendar consulta" e "Pedir vaga no social" estão fáceis de achar | No fim |

Para as telas da recepção e do paciente, use `/design-taste-frontend` no modo de tela de sistema (`app-screens`).

## 2. Cores

As cores vêm da identidade da NYLT: azul-marinho de uniforme e dourado de medalha, sobre um fundo creme de papel.

| Nome (CSS) | Hex | Uso |
| --- | --- | --- |
| `--tinta` | `#1B2F48` | Azul-marinho principal: títulos, texto, faixas escuras, botões |
| `--azul-2` | `#2A4465` | Azul de apoio: botão ao passar o mouse, detalhes em faixas escuras |
| `--tinta-2` | `#44566E` | Texto secundário (notas, legendas) |
| `--ouro` | `#B08D5B` | Dourado principal: destaques, ícones, bordas de ênfase |
| `--ouro-claro` | `#D6B57A` | Dourado sobre fundo azul (números, telefone, horários) |
| `--ouro-suave` | `#F3EBDC` | Fundo de destaque leve (horário social, avisos) |
| `--ouro-texto` | `#7A5E33` | Dourado para texto sobre fundo claro (passa no contraste) |
| `--creme` | `#F6F5F1` | Fundo principal da página |
| `--creme-2` | `#EFEDE6` | Fundo de seções alternadas e caixas fechadas |
| `--branco` | `#FFFFFF` | Cartões e formulários |
| `--linha` | `#E3DFD5` | Bordas e divisórias |

Na recepção, o dourado de texto é `#7E6236`.

**Proporção:** cerca de 70% creme e branco, 25% azul-marinho e no máximo 5% dourado. O dourado marca o que importa (o atendimento social das 16h e 17h, o próximo horário livre). Se aparecer em tudo, perde o sentido.

**Regras:**
- Dourado claro (`#D6B57A`) só sobre o azul. Sobre o creme, use `#7A5E33`.
- Sem gradientes, brilhos ou sombras coloridas. As cores aparecem em blocos chapados.
- Sem tema escuro.

## 3. Tipografia

- **Fonte:** Montserrat (400, 500, 600, 700), uma família só.
- **Tamanhos** (já no `:root`):
  - `--t1`: 36 a 56px, título do topo;
  - `--t2`: 28 a 40px, títulos das seções;
  - `--t3`: 20px, destaques;
  - `--t4`: 17px, texto;
  - `--t5`: 15px, notas.
- Títulos em peso 700, texto em 400 e rótulos de botão em 600.
- Títulos com no máximo duas linhas, por volta de 32 caracteres.
- Nada de letras gigantes decorativas.
- Texto corrido com no máximo uns 70 caracteres por linha.

## 4. Formas e espaços

- **Cantos:** use só três raios.
  - 8px para botões e campos;
  - 14px (`--raio`) para cartões;
  - 50% para círculos (marcadores, pontos de status).
  - A landing hoje tem nove raios diferentes (4, 8, 14, 18, 20, 22, 28, 32 e 99px), e essa mistura é um dos sinais de página genérica.
- **Margens:** a lateral é `--m` (20 a 48px), o espaço entre seções é `--secao` (80 a 136px) e a largura máxima é 1200px.
- **Sombras:** uma só, bem leve, e apenas em cartões que se destacam do fundo.

## 5. O que deixa a página com cara de IA (e o que fazer)

Situação atual da landing:

| Sinal | Onde está | O que fazer |
| --- | --- | --- |
| Todo título entra com animação de "subir e aparecer" | 40 elementos com `data-revela` | Deixar só um momento animado, o coração da semana no topo. O resto aparece parado. |
| Sequência padrão de seções: topo, 3 cartões, como funciona, depoimentos, FAQ, chamada final | `index.html` inteiro | Ordenar pelo que o paciente precisa saber: horários livres, social, especialidades, dúvidas |
| Três cartões iguais lado a lado | Especialidades | Cada especialidade com um formato próprio, mostrando o próximo horário livre como informação principal |
| "Agende em quatro passos" com números grandes | Como agendar | Mostrar o caminho real (cadastro, escolha do horário, confirmação) dentro de uma tela do sistema, não em cartões numerados |
| Depoimentos em cartões com aspas | Depoimentos | Poucos e curtos, ligados a uma especialidade e um horário (ex.: "Fisioterapia, terças às 10h") |
| Setas "→" no fim dos links | 4 lugares | Tirar. O texto do botão já diz para onde vai. |
| Títulos de propaganda ("Cuidado perto de casa") | Topo | Dizer o que é e para quem: clínica, especialidades, bairro, horário social |

## 6. A ideia que só a NYLT tem

Usar o que só existe nesta clínica, não o que toda clínica tem:

- **A agenda da semana**: 3 profissionais × 5 dias × 8 horários (10h às 17h). O coração da semana já é a peça mais original da página e deve ser o centro.
- **O atendimento social às 16h e 17h**, com a fila por pontuação (renda e urgência, ordenada pelo bubble sort do `nylt_agenda.c`). O simulador de pontuação é a parte interativa da página.
- **O endereço**: Rua Tuiuti, 1200, Tatuapé, São Paulo.
- **Os dados ao vivo do Supabase**: horários livres de verdade, não números inventados.

Frase-guia: *na landing da NYLT, a agenda real da semana vira a vitrine da clínica.*

## 7. Limites do projeto

- **Imagens:** só ilustrações em SVG (`i-psico`, `i-nutri`, `i-fisio` e o coração), sem fotos.
- **Tema:** sem tema escuro.
- **Letras:** sem letras gigantes decorativas.
- **Depoimentos:** podem ser fictícios (a NYLT é fictícia), com o aviso abaixo deles.
- **Avisos de LGPD:** sem.
- **Tecnologia:** HTML, CSS e JS puros, sem framework. Os dados vêm de `assets/nylt-dados.js`.
- **Celular:** tudo precisa funcionar a partir de 375px de largura, com foco visível no teclado e respeitando "reduzir movimento".
