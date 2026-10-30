# NYLT Agenda — PIM II

Sistema de agendamento da clínica Saúde NYLT, em C (PIM II — ADS — UNIP).

**Grupo:** Lucas Vila da Silva, Nicolas Paranhos Lambiase de Matos, Tiago Araujo De Jesus, Yuri Lima Moreira da Silva.

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
