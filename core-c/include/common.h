/**
 * common.h - Shared constants, types, and platform-specific includes
 * 
 * This header defines the core data structures used throughout the
 * Producer-Consumer synchronization simulator. It handles platform
 * differences between macOS and Linux for POSIX semaphore support.
 */

#ifndef COMMON_H
#define COMMON_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <pthread.h>
#include <semaphore.h>
#include <fcntl.h>
#include <time.h>
#include <signal.h>
#include <errno.h>

/* ── Platform Detection ─────────────────────────────────────────────── */
#ifdef __APPLE__
    /* macOS does not support unnamed POSIX semaphores (sem_init).
     * We use named semaphores via sem_open/sem_close/sem_unlink instead. */
    #define PLATFORM_MACOS 1
#else
    #define PLATFORM_MACOS 0
#endif

/* ── Limits ─────────────────────────────────────────────────────────── */
#define MAX_BUFFER_SIZE  64
#define MAX_THREADS      16
#define MAX_THREAD_NAME  32

/* ── Simulation Configuration ───────────────────────────────────────── */
typedef struct {
    int num_producers;      /* Number of producer threads               */
    int num_consumers;      /* Number of consumer threads               */
    int buffer_size;        /* Size of the circular buffer              */
    int iterations;         /* Items each producer/consumer processes    */
    int delay_ms;           /* Delay between operations (milliseconds)  */
} SimConfig;

/* ── Thread Argument ────────────────────────────────────────────────── */
typedef struct {
    int         id;                     /* Thread ID (0-indexed)        */
    char        name[MAX_THREAD_NAME];  /* e.g., "Producer-1"          */
    SimConfig  *config;                 /* Pointer to shared config     */
} ThreadArg;

/* ── Global running flag (set to 0 on SIGTERM/SIGINT) ───────────────── */
extern volatile sig_atomic_t g_running;

#endif /* COMMON_H */
