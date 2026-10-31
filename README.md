# NYLT Agenda — PIM II

Sistema de agendamento da clínica Saúde NYLT, em C (PIM II — ADS — UNIP).

**Grupo:** Lucas Vila da Silva, Nicolas Paranhos Lambiase de Matos, Tiago Araujo De Jesus, Yuri Lima Moreira da Silva.

## Site (localhost)

Precisa só do Node.js (nenhuma instalação de pacotes). Na pasta do projeto:

```
node servidor.js
```

(ou `npm start`) e acesse:

| Endereço | Página | Arquivo |
| --- | --- | --- |
| `http://localhost:8080/home` | Landing page da clínica | `index.html` |
| `http://localhost:8080/admin` | Recepção: pacientes, agenda, fila social, relatório e dados | `admin.html` |
| `http://localhost:8080/entrar` | Login e cadastro do paciente | `entrar.html` |
| `http://localhost:8080/paciente` | Área do paciente: agendar, minhas consultas e atendimento social | `paciente.html` |

O endereço `/` leva para `/home`, e os endereços antigos com `.html` redirecionam para as rotas novas. Para usar outra porta: `PORT=3001 node servidor.js` (no PowerShell, `$env:PORT=3001; node servidor.js`).

### Como as páginas se ligam

- A landing (`/home`) leva para `/entrar` ("Entrar"), `/entrar#cadastro` ("Cadastrar-se" e "Agendar consulta") e `/entrar#cadastro-social` ("Pedir vaga no social").
- Depois do login ou do cadastro, o paciente vai para `/paciente`. Quem abre `/paciente` sem ter entrado é levado para `/entrar`; "Sair" volta para `/home`. Quem já entrou vê "Minha área" no menu da landing.
- A recepção usa `/admin` (link "Área da recepção" no rodapé da landing).
- Todas usam a mesma base de dados, `assets/nylt-dados.js`, gravada no armazenamento do navegador. O que o paciente marca aparece na recepção, e a landing mostra os horários livres e o coração da semana a partir dessa agenda. Como os dados ficam no navegador, use sempre o mesmo endereço (`localhost:8080`) e o mesmo navegador.

### Como editar a landing

- **Textos:** estão direto no `index.html`, cada seção marcada com um comentário (`===== Topo =====`, `===== Especialidades... =====` etc.).
- **Contatos:** endereço e telefone aparecem no rodapé, na seção de dúvidas e nos dados estruturados (`<script type="application/ld+json">` no início do arquivo). Troque nos três lugares para manter tudo igual. Os atuais são exemplos.
- **Perguntas frequentes:** se mudar uma pergunta na página, mude também no bloco `FAQPage` do início do arquivo.
- **Depoimentos:** são exemplos fictícios (a NYLT é uma clínica fictícia do PIM), com um aviso logo abaixo deles. Para trocar, edite os blocos `<figure class="fala">`.
- **Cores:** ficam nas variáveis do início do `<style>` (`--tinta`, `--ouro`, `--creme`...).
- **Ilustrações:** os desenhos das especialidades são `<symbol>` em SVG no início do `<body>` (`i-psico`, `i-nutri`, `i-fisio`). O coração da semana é montado pelo script `desenharSemana()`.
- **Ao publicar:** adicione `<link rel="canonical">` e os campos `url` e `image` (com o endereço completo do site) nos dados estruturados, e troque o `og:image` por um endereço completo.

## Rodar no terminal

```
gcc nylt_agenda.c -o nylt_agenda
./nylt_agenda
```

## Rodar no navegador (localhost)

A pasta `.web` roda o mesmo programa C e mostra o terminal numa página em `http://localhost:3000`. Precisa de Node.js e de um compilador C (gcc ou TinyCC).

```
cd .web
gcc wrapper.c -o nylt_agenda_web.exe
node server.js
```

O `wrapper.c` inclui o `nylt_agenda.c` sem alterá-lo, só desligando o buffer da saída para os prompts aparecerem na hora. Os arquivos `pacientes.txt`, `agenda.txt` e `fila.txt` são gravados na raiz do projeto.
