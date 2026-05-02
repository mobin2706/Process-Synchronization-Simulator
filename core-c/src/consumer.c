/**
 * consumer.c - Consumer thread implementation
 * 
 * Mirrors the producer protocol:
 *   wait(full) → wait(mutex) → consume → post(mutex) → post(empty)
 */

#include "common.h"
#include "buffer.h"
#include "sync.h"
#include "logger.h"

extern CircularBuffer g_buffer;

void *consumer_func(void *arg) {
    ThreadArg *targ = (ThreadArg *)arg;
    SimConfig *config = targ->config;

    for (int i = 0; i < config->iterations && g_running; i++) {
        /* Wait for a filled slot */
        logger_thread_state(targ->name, "waiting");
        sync_full_wait();
        if (!g_running) break;

        /* Enter critical section */
        logger_thread_state(targ->name, "running");
        sync_mutex_wait();

        /* === CRITICAL SECTION === */
        int index;
        int value = buffer_remove(&g_buffer, &index);
        SemaphoreState sem_state = sync_get_state();
        logger_event(targ->name, "consume", value, index, &g_buffer, sem_state);
        /* === END CRITICAL SECTION === */

        sync_mutex_signal();
        sync_empty_signal();

        if (config->delay_ms > 0) {
            usleep(config->delay_ms * 1000);
        }
    }

    logger_thread_state(targ->name, "done");
    return NULL;
}
