/**
 * producer.c - Producer thread implementation
 * 
 * Each producer thread generates random values and inserts them into
 * the shared circular buffer. The classic Producer-Consumer semaphore
 * protocol is followed:
 * 
 *   1. sem_wait(empty)  — Wait for an empty slot (block if buffer full)
 *   2. sem_wait(mutex)  — Enter critical section (exclusive buffer access)
 *   3. [CRITICAL SECTION] Insert item into buffer
 *   4. sem_post(mutex)  — Leave critical section
 *   5. sem_post(full)   — Signal that a new item is available
 * 
 * The order of semaphore operations is CRITICAL:
 *   - empty MUST be waited on BEFORE mutex to avoid deadlock.
 *   - If we locked mutex first, and the buffer was full, we'd hold
 *     the mutex while waiting on empty — no consumer could acquire
 *     mutex to free a slot → DEADLOCK.
 */

#include "common.h"
#include "buffer.h"
#include "sync.h"
#include "logger.h"

/* External shared buffer (defined in main.c) */
extern CircularBuffer g_buffer;

/**
 * Producer thread function.
 * 
 * @param arg  Pointer to ThreadArg containing thread ID and config
 * @return     NULL
 */
void *producer_func(void *arg) {
    ThreadArg *targ = (ThreadArg *)arg;
    SimConfig *config = targ->config;

    /* Seed random number generator uniquely per thread */
    unsigned int seed = (unsigned int)(time(NULL) + targ->id * 37);

    for (int i = 0; i < config->iterations && g_running; i++) {
        /* Generate a random value to produce */
        int value = rand_r(&seed) % 100 + 1;

        /* ── Step 1: Wait for an empty slot ─────────────────────────
         * Decrements the 'empty' semaphore.
         * If empty == 0 (buffer is full), the producer BLOCKS here
         * until a consumer frees a slot by calling sem_post(empty).
         */
        logger_thread_state(targ->name, "waiting");
        sync_empty_wait();

        if (!g_running) break;  /* Check if simulation was stopped */

        /* ── Step 2: Enter critical section ─────────────────────────
         * Decrements the 'mutex' semaphore from 1 to 0.
         * This ensures exclusive access to the shared buffer.
         * Only ONE thread (producer or consumer) can be inside
         * the critical section at any time.
         */
        logger_thread_state(targ->name, "running");
        sync_mutex_wait();

        /* ══════════════════════════════════════════════════════════
         *  CRITICAL SECTION START
         *  Only this thread can access the buffer right now.
         * ══════════════════════════════════════════════════════════ */

        /* Insert the item into the buffer */
        int index = buffer_insert(&g_buffer, value);

        /* Get semaphore state for logging */
        SemaphoreState sem_state = sync_get_state();

        /* Log the produce event with full state snapshot */
        logger_event(targ->name, "produce", value, index, &g_buffer, sem_state);

        /* ══════════════════════════════════════════════════════════
         *  CRITICAL SECTION END
         * ══════════════════════════════════════════════════════════ */

        /* ── Step 3: Leave critical section ─────────────────────────
         * Increments 'mutex' from 0 to 1, allowing other threads
         * to enter the critical section.
         */
        sync_mutex_signal();

        /* ── Step 4: Signal that a new item is available ────────────
         * Increments the 'full' semaphore, potentially waking up
         * a consumer that was blocked waiting for data.
         */
        sync_full_signal();

        /* Configurable delay to control simulation speed */
        if (config->delay_ms > 0) {
            usleep(config->delay_ms * 1000);
        }
    }

    logger_thread_state(targ->name, "done");
    return NULL;
}
