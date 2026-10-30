/* Wrapper para rodar o nylt_agenda.c no navegador: desliga o buffer
 * do stdout para que os prompts aparecam na hora. Nao altera o original. */
#include <stdio.h>
#define main nylt_main
#include "../nylt_agenda.c"
#undef main
int main(void) {
    setvbuf(stdout, NULL, _IONBF, 0);
    return nylt_main();
}
