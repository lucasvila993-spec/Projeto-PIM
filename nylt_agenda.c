/*
 * NYLT Agenda - Sistema de agendamento da clinica Saude NYLT
 * PIM II - Analise e Desenvolvimento de Sistemas - UNIP
 *
 * Grupo:
 *   Lucas Vila da Silva                 - RA F369IA4
 *   Nicolas Paranhos Lambiase de Matos  - RA R314AD1
 *   Tiago Araujo De Jesus               - RA H93CJA9
 *   Yuri Lima Moreira da Silva          - RA H956EG4
 *
 * Funcionalidades principais:
 *   1. Cadastro e listagem de pacientes
 *   2. Agenda semanal por profissional (matriz dia x horario)
 *   3. Bloqueio de horario duplicado e de horarios reservados ao social
 *   4. Fila de espera do atendimento social, ordenada por pontuacao
 *      de prioridade (bubble sort)
 *   5. Relatorio da semana
 *   6. Gravacao e leitura dos dados em arquivos .txt
 *
 * Compilar:  gcc nylt_agenda.c -o nylt_agenda
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* ---------- Constantes do sistema ---------- */
#define MAX_PACIENTES   100
#define MAX_FILA        50
#define NUM_PROF        3      /* profissionais da clinica          */
#define DIAS            5      /* segunda a sexta                   */
#define HORARIOS        8      /* 10h as 17h, um atendimento por hora */
#define PRIMEIRO_SOCIAL 6      /* horarios 6 e 7 (16h e 17h) sao sociais */

#define ARQ_PACIENTES "pacientes.txt"
#define ARQ_AGENDA    "agenda.txt"
#define ARQ_FILA      "fila.txt"

/* ---------- Estruturas (struct) ---------- */
typedef struct {
    int  id;
    char nome[60];
    char telefone[20];
    int  idade;
    int  social;          /* 1 = paciente do atendimento social */
} Paciente;

typedef struct {
    int   idPaciente;
    float rendaPerCapita;
    int   urgencia;       /* 1 = baixa, 2 = media, 3 = alta */
    int   pontuacao;
} ItemFila;

/* ---------- Dados globais (vetores e matrizes) ---------- */
Paciente pacientes[MAX_PACIENTES];
int      totalPacientes = 0;

ItemFila fila[MAX_FILA];
int      totalFila = 0;

/* agenda[profissional][dia][horario] guarda o id do paciente (0 = livre) */
int agenda[NUM_PROF][DIAS][HORARIOS];

const char *profissionais[NUM_PROF] = {
    "Psicologia", "Nutricao", "Fisioterapia"
};
const char *nomesDias[DIAS] = {
    "Segunda", "Terca", "Quarta", "Quinta", "Sexta"
};

/* ---------- Funcoes auxiliares de entrada ---------- */
void limparBuffer(void) {
    int c;
    while ((c = getchar()) != '\n' && c != EOF) { }
}

int lerInteiro(const char *mensagem) {
    int valor;
    printf("%s", mensagem);
    while (scanf("%d", &valor) != 1) {
        limparBuffer();
        printf("Valor invalido. %s", mensagem);
    }
    limparBuffer();
    return valor;
}

float lerReal(const char *mensagem) {
    float valor;
    printf("%s", mensagem);
    while (scanf("%f", &valor) != 1) {
        limparBuffer();
        printf("Valor invalido. %s", mensagem);
    }
    limparBuffer();
    return valor;
}

void lerTexto(const char *mensagem, char *destino, int tamanho) {
    printf("%s", mensagem);
    if (fgets(destino, tamanho, stdin) != NULL) {
        destino[strcspn(destino, "\n")] = '\0';  /* remove o Enter */
    }
}

int horaDoIndice(int horario) {
    return 10 + horario;   /* indice 0 = 10h ... indice 7 = 17h */
}

/* Procura o paciente pelo id. Retorna a posicao no vetor ou -1. */
int buscarPaciente(int id) {
    int i;
    for (i = 0; i < totalPacientes; i++) {
        if (pacientes[i].id == id) {
            return i;
        }
    }
    return -1;
}

/* ---------- Arquivos ---------- */
void salvarDados(void) {
    FILE *arq;
    int i, p, d, h;

    arq = fopen(ARQ_PACIENTES, "w");
    if (arq != NULL) {
        for (i = 0; i < totalPacientes; i++) {
            fprintf(arq, "%d;%s;%s;%d;%d\n", pacientes[i].id,
                    pacientes[i].nome, pacientes[i].telefone,
                    pacientes[i].idade, pacientes[i].social);
        }
        fclose(arq);
    }

    arq = fopen(ARQ_AGENDA, "w");
    if (arq != NULL) {
        for (p = 0; p < NUM_PROF; p++)
            for (d = 0; d < DIAS; d++)
                for (h = 0; h < HORARIOS; h++)
                    if (agenda[p][d][h] != 0)
                        fprintf(arq, "%d;%d;%d;%d\n", p, d, h, agenda[p][d][h]);
        fclose(arq);
    }

    arq = fopen(ARQ_FILA, "w");
    if (arq != NULL) {
        for (i = 0; i < totalFila; i++) {
            fprintf(arq, "%d;%.2f;%d;%d\n", fila[i].idPaciente,
                    fila[i].rendaPerCapita, fila[i].urgencia,
                    fila[i].pontuacao);
        }
        fclose(arq);
    }
}

void carregarDados(void) {
    FILE *arq;
    int p, d, h, id;
    Paciente pac;
    ItemFila item;

    arq = fopen(ARQ_PACIENTES, "r");
    if (arq != NULL) {
        while (totalPacientes < MAX_PACIENTES &&
               fscanf(arq, "%d;%59[^;];%19[^;];%d;%d\n", &pac.id, pac.nome,
                      pac.telefone, &pac.idade, &pac.social) == 5) {
            pacientes[totalPacientes] = pac;
            totalPacientes++;
        }
        fclose(arq);
    }

    arq = fopen(ARQ_AGENDA, "r");
    if (arq != NULL) {
        while (fscanf(arq, "%d;%d;%d;%d\n", &p, &d, &h, &id) == 4) {
            if (p >= 0 && p < NUM_PROF && d >= 0 && d < DIAS &&
                h >= 0 && h < HORARIOS) {
                agenda[p][d][h] = id;
            }
        }
        fclose(arq);
    }

    arq = fopen(ARQ_FILA, "r");
    if (arq != NULL) {
        while (totalFila < MAX_FILA &&
               fscanf(arq, "%d;%f;%d;%d\n", &item.idPaciente,
                      &item.rendaPerCapita, &item.urgencia,
                      &item.pontuacao) == 4) {
            fila[totalFila] = item;
            totalFila++;
        }
        fclose(arq);
    }
}

/* ---------- Pacientes ---------- */
void cadastrarPaciente(void) {
    Paciente novo;

    if (totalPacientes >= MAX_PACIENTES) {
        printf("Limite de pacientes atingido.\n");
        return;
    }

    novo.id = (totalPacientes == 0) ? 1 : pacientes[totalPacientes - 1].id + 1;
    lerTexto("Nome completo: ", novo.nome, sizeof(novo.nome));
    lerTexto("Telefone: ", novo.telefone, sizeof(novo.telefone));
    novo.idade  = lerInteiro("Idade: ");
    novo.social = lerInteiro("Atendimento social? (1-Sim / 0-Nao): ");
    if (novo.social != 1) {
        novo.social = 0;
    }

    pacientes[totalPacientes] = novo;
    totalPacientes++;
    salvarDados();
    printf("Paciente cadastrado com o codigo %d.\n", novo.id);
}

void listarPacientes(void) {
    int i;
    if (totalPacientes == 0) {
        printf("Nenhum paciente cadastrado.\n");
        return;
    }
    printf("\n%-4s %-30s %-15s %-6s %s\n", "ID", "NOME", "TELEFONE",
           "IDADE", "TIPO");
    for (i = 0; i < totalPacientes; i++) {
        printf("%-4d %-30s %-15s %-6d %s\n", pacientes[i].id,
               pacientes[i].nome, pacientes[i].telefone, pacientes[i].idade,
               pacientes[i].social ? "Social" : "Particular");
    }
}

/* ---------- Agenda ---------- */
int escolherProfissional(void) {
    int i, op;
    for (i = 0; i < NUM_PROF; i++) {
        printf("%d - %s\n", i + 1, profissionais[i]);
    }
    do {
        op = lerInteiro("Profissional: ");
    } while (op < 1 || op > NUM_PROF);
    return op - 1;
}

void mostrarAgenda(void) {
    int p, d, h, pos;

    p = escolherProfissional();
    printf("\nAgenda de %s (S = horario reservado ao social)\n", profissionais[p]);
    printf("%-6s", "Hora");
    for (d = 0; d < DIAS; d++) {
        printf("%-12s", nomesDias[d]);
    }
    printf("\n");

    for (h = 0; h < HORARIOS; h++) {
        printf("%2dh%s  ", horaDoIndice(h), h >= PRIMEIRO_SOCIAL ? "S" : " ");
        for (d = 0; d < DIAS; d++) {
            if (agenda[p][d][h] == 0) {
                printf("%-12s", "livre");
            } else {
                pos = buscarPaciente(agenda[p][d][h]);
                if (pos >= 0) {
                    printf("%-12.11s", pacientes[pos].nome);
                } else {
                    printf("%-12s", "ocupado");
                }
            }
        }
        printf("\n");
    }
}

/* Regra de negocio: verifica se o horario pode receber o paciente.
 * Retorna 1 se pode, 0 se nao pode (e mostra o motivo). */
int horarioDisponivel(int p, int d, int h, int posPaciente) {
    if (agenda[p][d][h] != 0) {
        printf("Horario ja ocupado. Escolha outro.\n");
        return 0;
    }
    if (h >= PRIMEIRO_SOCIAL && pacientes[posPaciente].social == 0) {
        printf("Este horario e reservado ao atendimento social.\n");
        return 0;
    }
    return 1;
}

void agendarConsulta(void) {
    int id, pos, p, d, h;

    id = lerInteiro("Codigo do paciente: ");
    pos = buscarPaciente(id);
    if (pos < 0) {
        printf("Paciente nao encontrado.\n");
        return;
    }

    p = escolherProfissional();
    d = lerInteiro("Dia (1-Seg 2-Ter 3-Qua 4-Qui 5-Sex): ") - 1;
    h = lerInteiro("Hora (10 a 17): ") - 10;

    if (d < 0 || d >= DIAS || h < 0 || h >= HORARIOS) {
        printf("Dia ou hora invalidos.\n");
        return;
    }

    if (horarioDisponivel(p, d, h, pos)) {
        agenda[p][d][h] = id;
        salvarDados();
        printf("Consulta marcada: %s, %s as %dh com %s.\n",
               pacientes[pos].nome, nomesDias[d], horaDoIndice(h),
               profissionais[p]);
    }
}

void cancelarConsulta(void) {
    int p, d, h;

    p = escolherProfissional();
    d = lerInteiro("Dia (1-Seg 2-Ter 3-Qua 4-Qui 5-Sex): ") - 1;
    h = lerInteiro("Hora (10 a 17): ") - 10;

    if (d < 0 || d >= DIAS || h < 0 || h >= HORARIOS) {
        printf("Dia ou hora invalidos.\n");
        return;
    }
    if (agenda[p][d][h] == 0) {
        printf("Nao ha consulta nesse horario.\n");
        return;
    }
    agenda[p][d][h] = 0;
    salvarDados();
    printf("Consulta cancelada. O horario esta livre.\n");
}

/* ---------- Fila do atendimento social ---------- */

/* Calcula a pontuacao de prioridade com criterios publicos e objetivos */
int calcularPontuacao(float renda, int idade, int urgencia) {
    int pontos = 0;

    if (renda <= 300) {
        pontos += 40;
    } else if (renda <= 700) {
        pontos += 25;
    } else if (renda <= 1500) {
        pontos += 10;
    }

    if (idade >= 60) {
        pontos += 20;
    } else if (idade < 12) {
        pontos += 15;
    }

    pontos += urgencia * 10;   /* urgencia de 1 a 3 */
    return pontos;
}

/* Bubble sort: ordena a fila da maior para a menor pontuacao */
void ordenarFila(void) {
    int i, j;
    ItemFila aux;

    for (i = 0; i < totalFila - 1; i++) {
        for (j = 0; j < totalFila - 1 - i; j++) {
            if (fila[j].pontuacao < fila[j + 1].pontuacao) {
                aux = fila[j];
                fila[j] = fila[j + 1];
                fila[j + 1] = aux;
            }
        }
    }
}

void incluirNaFila(void) {
    int id, pos, i;
    ItemFila item;

    if (totalFila >= MAX_FILA) {
        printf("Fila cheia.\n");
        return;
    }

    id = lerInteiro("Codigo do paciente: ");
    pos = buscarPaciente(id);
    if (pos < 0) {
        printf("Paciente nao encontrado.\n");
        return;
    }
    if (pacientes[pos].social == 0) {
        printf("A fila e exclusiva para pacientes do atendimento social.\n");
        return;
    }
    for (i = 0; i < totalFila; i++) {
        if (fila[i].idPaciente == id) {
            printf("Paciente ja esta na fila.\n");
            return;
        }
    }

    printf("--- Triagem ---\n");
    item.idPaciente     = id;
    item.rendaPerCapita = lerReal("Renda por pessoa da familia (R$): ");
    do {
        item.urgencia = lerInteiro("Urgencia (1-Baixa 2-Media 3-Alta): ");
    } while (item.urgencia < 1 || item.urgencia > 3);
    item.pontuacao = calcularPontuacao(item.rendaPerCapita,
                                       pacientes[pos].idade, item.urgencia);

    fila[totalFila] = item;
    totalFila++;
    ordenarFila();
    salvarDados();
    printf("Incluido na fila com %d pontos.\n", item.pontuacao);
}

void listarFila(void) {
    int i, pos;
    if (totalFila == 0) {
        printf("Fila vazia.\n");
        return;
    }
    printf("\n%-4s %-30s %-8s %s\n", "POS", "PACIENTE", "PONTOS", "URGENCIA");
    for (i = 0; i < totalFila; i++) {
        pos = buscarPaciente(fila[i].idPaciente);
        printf("%-4d %-30s %-8d %d\n", i + 1,
               pos >= 0 ? pacientes[pos].nome : "(removido)",
               fila[i].pontuacao, fila[i].urgencia);
    }
}

/* Chama o primeiro da fila e marca no primeiro horario social livre */
void chamarProximo(void) {
    int p, d, h, i, pos;

    if (totalFila == 0) {
        printf("Fila vazia.\n");
        return;
    }
    p = escolherProfissional();
    pos = buscarPaciente(fila[0].idPaciente);

    for (d = 0; d < DIAS; d++) {
        for (h = PRIMEIRO_SOCIAL; h < HORARIOS; h++) {
            if (agenda[p][d][h] == 0) {
                agenda[p][d][h] = fila[0].idPaciente;

                /* remove o primeiro da fila deslocando os demais */
                for (i = 0; i < totalFila - 1; i++) {
                    fila[i] = fila[i + 1];
                }
                totalFila--;
                salvarDados();
                printf("%s agendado(a): %s as %dh com %s.\n",
                       pos >= 0 ? pacientes[pos].nome : "Paciente",
                       nomesDias[d], horaDoIndice(h), profissionais[p]);
                return;
            }
        }
    }
    printf("Nao ha horario social livre para %s nesta semana.\n",
           profissionais[p]);
}

/* ---------- Relatorio ---------- */
void relatorioSemana(void) {
    int p, d, h, pos;
    int total, sociais, geral = 0, geralSocial = 0;
    int capacidade = DIAS * HORARIOS;

    printf("\n=== Relatorio da semana ===\n");
    for (p = 0; p < NUM_PROF; p++) {
        total = 0;
        sociais = 0;
        for (d = 0; d < DIAS; d++) {
            for (h = 0; h < HORARIOS; h++) {
                if (agenda[p][d][h] != 0) {
                    total++;
                    pos = buscarPaciente(agenda[p][d][h]);
                    if (pos >= 0 && pacientes[pos].social == 1) {
                        sociais++;
                    }
                }
            }
        }
        printf("%-13s: %2d consultas (%d sociais) - ocupacao %.0f%%\n",
               profissionais[p], total, sociais,
               100.0 * total / capacidade);
        geral += total;
        geralSocial += sociais;
    }
    printf("Total: %d consultas, %d no atendimento social.\n",
           geral, geralSocial);
    printf("Pessoas aguardando na fila social: %d\n", totalFila);
}

/* ---------- Menu principal ---------- */
int main(void) {
    int opcao;

    carregarDados();

    do {
        printf("\n===== NYLT Agenda - Saude NYLT =====\n");
        printf("1 - Cadastrar paciente\n");
        printf("2 - Listar pacientes\n");
        printf("3 - Agendar consulta\n");
        printf("4 - Cancelar consulta\n");
        printf("5 - Ver agenda da semana\n");
        printf("6 - Incluir na fila social (triagem)\n");
        printf("7 - Ver fila social\n");
        printf("8 - Chamar proximo da fila social\n");
        printf("9 - Relatorio da semana\n");
        printf("0 - Sair\n");
        opcao = lerInteiro("Opcao: ");

        switch (opcao) {
            case 1: cadastrarPaciente(); break;
            case 2: listarPacientes();   break;
            case 3: agendarConsulta();   break;
            case 4: cancelarConsulta();  break;
            case 5: mostrarAgenda();     break;
            case 6: incluirNaFila();     break;
            case 7: listarFila();        break;
            case 8: chamarProximo();     break;
            case 9: relatorioSemana();   break;
            case 0: printf("Dados salvos. Ate logo!\n"); break;
            default: printf("Opcao invalida.\n");
        }
    } while (opcao != 0);

    salvarDados();
    return 0;
}
