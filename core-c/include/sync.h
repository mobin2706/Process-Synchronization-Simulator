/**
 * sync.h - Semaphore synchronization interface
 * 
 * This module wraps POSIX named semaphores to provide the three
 * semaphores required for the Producer-Consumer problem:
 * 
 *   mutex  (binary, init=1)  — Mutual exclusion for buffer access.
 *                               Only one thread can modify the buffer
 *                               at a time (critical section protection).
 * 
 *   empty  (counting, init=N) — Tracks the number of EMPTY slots.
 *                               Producers wait on this; if 0, the
 *                               buffer is full and producers block.
 * 
 *   full   (counting, init=0) — Tracks the number of FULL slots.
 *                               Consumers wait on this; if 0, the
 *                               buffer is empty and consumers block.
 * 
 * Named semaphores are used because macOS deprecated sem_init().
 */

#ifndef SYNC_H
#define SYNC_H

#include "common.h"

/* ── Semaphore State (for logging) ──────────────────────────────────── */
typedef struct {
    int mutex_val;
    int empty_val;
    int full_val;
} SemaphoreState;

/**
 * Initialize all three semaphores.
 * Creates named semaphores: /sim_mutex, /sim_empty, /sim_full
 * 
 * @param buffer_size  Used to initialize 'empty' count
 * @return             0 on success, -1 on error
 */
int sync_init(int buffer_size);

/**
 * Destroy and unlink all semaphores.
 * Must be called before program exit for clean resource release.
 */
void sync_destroy(void);

/* ── Semaphore Operations ───────────────────────────────────────────── */

/** Wait (decrement) on the mutex semaphore — enter critical section */
void sync_mutex_wait(void);

/** Signal (increment) the mutex semaphore — leave critical section */
void sync_mutex_signal(void);

/** Wait (decrement) on the empty semaphore — producer blocks if buffer full */
void sync_empty_wait(void);

/** Signal (increment) the empty semaphore — consumer frees a slot */
void sync_empty_signal(void);

/** Wait (decrement) on the full semaphore — consumer blocks if buffer empty */
void sync_full_wait(void);

/** Signal (increment) the full semaphore — producer fills a slot */
void sync_full_signal(void);

/**
 * Get the current values of all three semaphores.
 * Used for structured logging (JSON output).
 * 
 * @return  SemaphoreState with current values
 */
SemaphoreState sync_get_state(void);

#endif /* SYNC_H */
