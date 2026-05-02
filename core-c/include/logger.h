/**
 * logger.h - Thread-safe JSON logging interface
 * 
 * All output from the C engine is structured as JSON lines,
 * one per event. This allows the Node.js backend to parse
 * each line and stream it to the frontend via WebSocket.
 * 
 * Output is written to stdout and flushed immediately to
 * ensure real-time streaming when the process is spawned
 * by the backend.
 */

#ifndef LOGGER_H
#define LOGGER_H

#include "common.h"
#include "buffer.h"
#include "sync.h"

/**
 * Initialize the logger (creates internal mutex for thread safety).
 */
void logger_init(void);

/**
 * Destroy the logger (cleans up internal mutex).
 */
void logger_destroy(void);

/**
 * Emit a simulation start event.
 * Output: {"type":"start","producers":N,"consumers":M,"buffer_size":B,...}
 */
void logger_start(const SimConfig *config);

/**
 * Emit a simulation end event.
 * Output: {"type":"end","total_produced":X,"total_consumed":Y}
 */
void logger_end(int total_produced, int total_consumed);

/**
 * Emit a produce/consume event with full state snapshot.
 * 
 * @param thread_name  e.g., "Producer-1"
 * @param action       "produce", "consume", "waiting", "blocked"
 * @param value        The item value produced/consumed
 * @param buf_index    Buffer index affected
 * @param buf          Pointer to the circular buffer (for snapshot)
 * @param sem_state    Current semaphore values
 */
void logger_event(
    const char     *thread_name,
    const char     *action,
    int             value,
    int             buf_index,
    const CircularBuffer *buf,
    SemaphoreState  sem_state
);

/**
 * Emit a thread state change (waiting/running/blocked).
 * 
 * @param thread_name  e.g., "Consumer-2"
 * @param state        "running", "waiting", "blocked", "done"
 */
void logger_thread_state(const char *thread_name, const char *state);

#endif /* LOGGER_H */
