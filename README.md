# NYLT Agenda — PIM II

Sistema de agendamento da clínica Saúde NYLT, em C (PIM II — ADS — UNIP).

**Grupo:** Lucas Vila da Silva, Nicolas Paranhos Lambiase de Matos, Tiago Araujo De Jesus, Yuri Lima Moreira da Silva.

## Site no ar

- **Vercel:** https://nylt.vercel.app (cada push no `main` publica de novo)
- **GitHub Pages:** https://lucasvila993-spec.github.io/Projeto-PIM/home/

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
- A recepção usa `/admin` (link "Área da recepção" no rodapé da landing). A página pede login: usuário `recepcao`, senha `nylt2026`. O acesso vale até fechar a aba ou clicar em "Sair da recepção".
- Todas as páginas usam o mesmo banco de dados no Supabase (veja abaixo). O que o paciente marca aparece na recepção em qualquer computador ou celular, e a landing mostra os horários livres e o coração da semana a partir dessa agenda.

### Banco de dados (Supabase)

Os dados ficam no projeto **nylt-agenda** do Supabase (servidor de São Paulo), em tabelas com as mesmas estruturas do `nylt_agenda.c`:

| Tabela | O que guarda |
| --- | --- |
| `pacientes` | `struct Paciente`: código, nome, telefone, idade e se é do social (até 100) |
| `consultas` | A agenda: profissional, dia, horário, paciente e situação (agendada, confirmada, compareceu, faltou) |
| `fila_social` | `struct ItemFila`: renda por pessoa, urgência, pontuação e a ordem do bubble sort (até 50) |
| `historico` | Revisões manuais da fila |
| `contas` | Login dos pacientes: telefone e senha (guardada com bcrypt) |
| `recepcao` | Login da recepção (senha com bcrypt) |
| `sessoes` | Logins abertos, válidos por 12 horas |
| `controle` | Versão dos dados, que muda a cada gravação |

- **Como o site acessa:** as páginas não leem as tabelas direto. Elas chamam funções do banco (por exemplo `paciente_agendar` e `recepcao_salvar`), que conferem o login antes de ler ou gravar. As tabelas têm RLS ligado e nenhuma regra de acesso, então a chave pública do site sozinha não lê nada. Visitantes veem só a ocupação da semana, sem nomes; o paciente vê só os próprios dados.
- **Recepção e pacientes ao mesmo tempo:** a recepção grava com a versão que leu. Se um paciente marcou ou cancelou pelo site nesse meio tempo, o banco recusa, a tela recarrega e avisa para refazer a última ação, sem apagar o que o paciente fez. A recepção também confere a cada 15 segundos se houve mudança.
- **Onde está no código:** a conexão (endereço e chave pública) fica no início de `assets/nylt-dados.js`. As tabelas e funções podem ser vistas no painel do Supabase, em Table Editor e Database > Functions.
- **Trocar a senha da recepção:** no SQL Editor do Supabase, rode `update recepcao set senha_hash = extensions.crypt('senha nova', extensions.gen_salt('bf')) where usuario = 'recepcao';`.
- **Dados de exemplo:** entram sozinhos no primeiro login da recepção, quando o banco ainda está vazio. Para voltar a eles, use "Carregar dados de exemplo" na aba Dados. São 24 pacientes fictícios, 83 consultas (69% da semana, com 15 horários lotados), consultas confirmadas, comparecimentos e faltas, e 7 pessoas na fila social.

### Acessos de teste

| Quem | Telefone (login) | Senha | Para testar |
| --- | --- | --- | --- |
| Recepção | usuário `recepcao` | `nylt2026` | Área da recepção (`/admin`) |
| João Pedro Lima | (11) 97652-1180 | `teste123` | Particular com 4 consultas: uma para confirmar, duas confirmadas e uma em que compareceu |
| Beatriz Nunes | (11) 95533-8019 | `teste123` | Atendimento social com consulta às 16h confirmada |
| Diego Martins | (11) 96451-8870 | `teste123` | Atendimento social esperando na fila (2º lugar) |
| Gabriel Souza | (11) 98112-3344 | `teste123` | Particular sem consultas, para marcar a primeira |

As contas dos pacientes ficam na tabela `contas` e não fazem parte dos arquivos `.txt`. "Carregar dados de exemplo" mantém essas contas, porque os pacientes voltam com o mesmo código e telefone.

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
