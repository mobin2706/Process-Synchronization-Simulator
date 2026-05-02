/**
 * sync.c - Semaphore synchronization implementation
 * 
 * This module manages three POSIX named semaphores for the
 * Producer-Consumer problem:
 * 
 *   /sim_mutex  — Binary semaphore (init=1) for mutual exclusion.
 *                 Ensures only one thread accesses the buffer at a time.
 * 
 *   /sim_empty  — Counting semaphore (init=buffer_size).
 *                 Represents the number of empty slots available.
 *                 Producers decrement this (wait) before producing.
 *                 Consumers increment this (signal) after consuming.
 * 
 *   /sim_full   — Counting semaphore (init=0).
 *                 Represents the number of filled slots available.
 *                 Consumers decrement this (wait) before consuming.
 *                 Producers increment this (signal) after producing.
 * 
 * Named semaphores are used because macOS deprecated sem_init().
 * The names are unique per process run using PID-based suffixes
 * to avoid collisions when multiple instances run simultaneously.
 */

#include "sync.h"

/* ── Internal State ─────────────────────────────────────────────────── */
static sem_t *sem_mutex = NULL;
static sem_t *sem_empty = NULL;
static sem_t *sem_full  = NULL;

/* Semaphore names (unique per process using PID) */
static char name_mutex[64];
static char name_empty[64];
static char name_full[64];

/**
 * Initialize all three semaphores.
 * 
 * Uses sem_open() with O_CREAT|O_EXCL to create new semaphores.
 * The semaphore names include the PID to avoid conflicts.
 * 
 * @param buffer_size  The buffer capacity; used to initialize 'empty'
 * @return             0 on success, -1 on failure
 */
int sync_init(int buffer_size) {
    pid_t pid = getpid();

    /* Generate unique semaphore names using PID */
    snprintf(name_mutex, sizeof(name_mutex), "/sim_mutex_%d", pid);
    snprintf(name_empty, sizeof(name_empty), "/sim_empty_%d", pid);
    snprintf(name_full,  sizeof(name_full),  "/sim_full_%d",  pid);

    /* Unlink any stale semaphores from previous crashed runs */
    sem_unlink(name_mutex);
    sem_unlink(name_empty);
    sem_unlink(name_full);

    /*
     * Create the mutex semaphore (binary, initial value = 1).
     * Value of 1 means the critical section is currently UNLOCKED.
     * When a thread calls sem_wait(mutex), it decrements to 0 (locked).
     * Any other thread calling sem_wait will block until sem_post restores it to 1.
     */
    sem_mutex = sem_open(name_mutex, O_CREAT | O_EXCL, 0644, 1);
    if (sem_mutex == SEM_FAILED) {
        perror("sem_open(mutex)");
        return -1;
    }

    /*
     * Create the 'empty' semaphore (counting, initial = buffer_size).
     * Starts at buffer_size because all slots are initially empty.
     * Each producer decrements it by 1 before writing (occupying a slot).
     * Each consumer increments it by 1 after reading (freeing a slot).
     * When it reaches 0, producers must block — the buffer is full.
     */
    sem_empty = sem_open(name_empty, O_CREAT | O_EXCL, 0644, buffer_size);
    if (sem_empty == SEM_FAILED) {
        perror("sem_open(empty)");
        return -1;
    }

    /*
     * Create the 'full' semaphore (counting, initial = 0).
     * Starts at 0 because no items have been produced yet.
     * Each producer increments it by 1 after writing (filling a slot).
     * Each consumer decrements it by 1 before reading (consuming a slot).
     * When it reaches 0, consumers must block — the buffer is empty.
     */
    sem_full = sem_open(name_full, O_CREAT | O_EXCL, 0644, 0);
    if (sem_full == SEM_FAILED) {
        perror("sem_open(full)");
        return -1;
    }

    return 0;
}

/**
 * Destroy and unlink all semaphores.
 * Called during cleanup to release system resources.
 * sem_close() releases the process's reference.
 * sem_unlink() removes the semaphore from the filesystem.
 */
void sync_destroy(void) {
    if (sem_mutex) { sem_close(sem_mutex); sem_unlink(name_mutex); }
    if (sem_empty) { sem_close(sem_empty); sem_unlink(name_empty); }
    if (sem_full)  { sem_close(sem_full);  sem_unlink(name_full);  }
}

/* ── Semaphore Operations ───────────────────────────────────────────── */

/**
 * sem_wait(mutex): Decrements mutex from 1→0, entering the critical section.
 * If mutex is already 0, the calling thread BLOCKS until another thread
 * calls sem_post(mutex) to release it.
 */
void sync_mutex_wait(void) {
    sem_wait(sem_mutex);
}

/**
 * sem_post(mutex): Increments mutex from 0→1, leaving the critical section.
 * This unblocks one waiting thread (if any).
 */
void sync_mutex_signal(void) {
    sem_post(sem_mutex);
}

/**
 * sem_wait(empty): Producer calls this BEFORE producing.
 * Decrements the empty slot count. If empty==0, the producer
 * blocks until a consumer frees a slot.
 */
void sync_empty_wait(void) {
    sem_wait(sem_empty);
}

/**
 * sem_post(empty): Consumer calls this AFTER consuming.
 * Increments the empty slot count, potentially unblocking a producer.
 */
void sync_empty_signal(void) {
    sem_post(sem_empty);
}

/**
 * sem_wait(full): Consumer calls this BEFORE consuming.
 * Decrements the full slot count. If full==0, the consumer
 * blocks until a producer fills a slot.
 */
void sync_full_wait(void) {
    sem_wait(sem_full);
}

/**
 * sem_post(full): Producer calls this AFTER producing.
 * Increments the full slot count, potentially unblocking a consumer.
 */
void sync_full_signal(void) {
    sem_post(sem_full);
}

/**
 * Get the current values of all three semaphores.
 * 
 * Uses sem_getvalue() on Linux. On macOS, sem_getvalue() is not
 * supported, so we maintain approximate tracking. For accurate
 * reporting, we use a best-effort approach.
 * 
 * Note: These values are approximate since other threads may
 * modify them between the individual sem_getvalue() calls.
 */
SemaphoreState sync_get_state(void) {
    SemaphoreState state = {0, 0, 0};

#if PLATFORM_MACOS
    /*
     * macOS does not support sem_getvalue() for named semaphores.
     * We return -1 as a sentinel; the logger will handle this
     * by tracking values based on operations instead.
     */
    state.mutex_val = -1;
    state.empty_val = -1;
    state.full_val  = -1;
#else
    sem_getvalue(sem_mutex, &state.mutex_val);
    sem_getvalue(sem_empty, &state.empty_val);
    sem_getvalue(sem_full,  &state.full_val);
#endif

    return state;
}
