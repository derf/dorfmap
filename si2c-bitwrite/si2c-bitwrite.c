#include <err.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

#include "../semop/semctl.c"

#define BUFSIZE 64

void writepin(char *pinstr, char val)
{
	FILE *fh;

	fh = fopen(pinstr, "w");
	fprintf(fh, "%d\n", val);
	fclose(fh);
	usleep(1);
}

int main(int argc, char **argv)
{
	char line[BUFSIZE];
	char buf[BUFSIZE];
	short int buf_pos = 0;
	short int number, i;

	int sdapin = 0, sclpin = 0;
	char sdastr[64];
	char sclstr[64];

	if (argc < 2)
		errx(1, "usage: avrshiftd <sdapin> <sclpin>");

	sdapin = atoi(argv[1]);
	sclpin = atoi(argv[2]);

	snprintf(sdastr, 64, "/sys/class/gpio/gpio%d/value", sdapin);
	snprintf(sclstr, 64, "/sys/class/gpio/gpio%d/value", sclpin);

	sem_init(12);

	while (fgets(line, BUFSIZE, stdin) != NULL) {
		if (sscanf(line, "%hi\n", &number) == 1) {
			if (buf_pos <= BUFSIZE) {
				buf[buf_pos++] = number;
			}
		}
	}
	sem_enter();
	for (i = 0; i < buf_pos; i++) {
		writepin(sdastr, 0);
		writepin(sclstr, 0);
		writepin(sdastr, buf[i]);
		writepin(sclstr, 1);
	}
	writepin(sdastr, 1);
	writepin(sclstr, 0);
	writepin(sdastr, 0);
	sem_leave();
	return 0;
}
