/**
 * logger.c - Thread-safe JSON structured logging
 * 
 * All simulation events are output as single-line JSON objects to stdout.
 * The backend (Node.js) reads these lines and streams them via WebSocket
 * to the frontend for visualization.
 * 
 * Thread safety is achieved using a pthread_mutex to ensure that
 * only one thread writes to stdout at a time, preventing interleaved
 * or corrupted JSON output.
 * 
 * Output is flushed after every line (fflush) to ensure real-time
 * streaming when stdout is piped to the backend process.
 */

#include "logger.h"
#include <sys/time.h>

/* ── Internal mutex for thread-safe output ──────────────────────────── */
static pthread_mutex_t log_mutex = PTHREAD_MUTEX_INITIALIZER;

/* ── Tracked semaphore values (for macOS where sem_getvalue is unavailable) */
static int tracked_mutex = 1;
static int tracked_empty = 0;
static int tracked_full  = 0;
static int tracked_buffer_size = 0;

/**
 * Get current timestamp in milliseconds since epoch.
 */
static long long get_timestamp_ms(void) {
    struct timeval tv;
    gettimeofday(&tv, NULL);
    return (long long)tv.tv_sec * 1000 + tv.tv_usec / 1000;
}

/**
 * Initialize the logger.
 * Sets stdout to line-buffered mode for real-time output.
 */
void logger_init(void) {
    /* Line buffer stdout so each JSON line is flushed immediately */
    setvbuf(stdout, NULL, _IOLBF, 0);
}

/**
 * Destroy the logger (cleanup mutex).
 */
void logger_destroy(void) {
    pthread_mutex_destroy(&log_mutex);
}

/**
 * Emit a simulation start event.
 * This is the first JSON line output, informing the frontend
 * about the simulation configuration.
 */
void logger_start(const SimConfig *config) {
    tracked_empty = config->buffer_size;
    tracked_full  = 0;
    tracked_mutex = 1;
    tracked_buffer_size = config->buffer_size;

    pthread_mutex_lock(&log_mutex);
    printf("{\"type\":\"start\","
           "\"timestamp\":%lld,"
           "\"producers\":%d,"
           "\"consumers\":%d,"
           "\"buffer_size\":%d,"
           "\"iterations\":%d,"
           "\"delay_ms\":%d}\n",
           get_timestamp_ms(),
           config->num_producers,
           config->num_consumers,
           config->buffer_size,
           config->iterations,
           config->delay_ms);
    fflush(stdout);
    pthread_mutex_unlock(&log_mutex);
}

/**
 * Emit a simulation end event.
 * This is the last JSON line, providing summary statistics.
 */
void logger_end(int total_produced, int total_consumed) {
    pthread_mutex_lock(&log_mutex);
    printf("{\"type\":\"end\","
           "\"timestamp\":%lld,"
           "\"total_produced\":%d,"
           "\"total_consumed\":%d}\n",
           get_timestamp_ms(),
           total_produced,
           total_consumed);
    fflush(stdout);
    pthread_mutex_unlock(&log_mutex);
}

/**
 * Emit a produce/consume event with full state snapshot.
 * 
 * Each event includes:
 *   - Thread name and action
 *   - The value produced/consumed
 *   - The buffer index affected
 *   - Complete buffer state (array snapshot)
 *   - Semaphore values
 *   - Timestamp
 * 
 * This gives the frontend everything it needs to reconstruct
 * the simulation state at each step.
 */
void logger_event(
    const char     *thread_name,
    const char     *action,
    int             value,
    int             buf_index,
    const CircularBuffer *buf,
    SemaphoreState  sem_state
) {
    int snapshot[MAX_BUFFER_SIZE];
    int buf_size = 0;

    /* Take a buffer snapshot while we're still inside the critical section */
    if (buf) {
        buf_size = buf->size;
        buffer_snapshot(buf, snapshot);
    }

    /* Update tracked semaphore values for macOS */
    if (sem_state.mutex_val == -1) {
        /* Use tracked values instead */
        sem_state.mutex_val = tracked_mutex;
        sem_state.empty_val = tracked_empty;
        sem_state.full_val  = tracked_full;
    } else {
        /* Update tracked values from actual values */
        tracked_mutex = sem_state.mutex_val;
        tracked_empty = sem_state.empty_val;
        tracked_full  = sem_state.full_val;
    }

    /* Update tracked values based on action */
    if (strcmp(action, "produce") == 0) {
        tracked_full  = buf ? buf->count : tracked_full;
        tracked_empty = buf ? (buf->size - buf->count) : tracked_empty;
    } else if (strcmp(action, "consume") == 0) {
        tracked_full  = buf ? buf->count : tracked_full;
        tracked_empty = buf ? (buf->size - buf->count) : tracked_empty;
    }

    pthread_mutex_lock(&log_mutex);

    /* Build the JSON output */
    printf("{\"type\":\"event\","
           "\"timestamp\":%lld,"
           "\"thread\":\"%s\","
           "\"action\":\"%s\","
           "\"value\":%d,"
           "\"buffer_index\":%d,",
           get_timestamp_ms(),
           thread_name,
           action,
           value,
           buf_index);

    /* Buffer array */
    printf("\"buffer\":[");
    for (int i = 0; i < buf_size; i++) {
        if (i > 0) printf(",");
        if (snapshot[i] == BUFFER_EMPTY_SLOT) {
            printf("null");
        } else {
            printf("%d", snapshot[i]);
        }
    }
    printf("],");

    /* Buffer metadata */
    if (buf) {
        printf("\"buffer_count\":%d,"
               "\"buffer_in\":%d,"
               "\"buffer_out\":%d,",
               buf->count, buf->in, buf->out);
    }

    /* Semaphore state */
    printf("\"semaphores\":{\"mutex\":%d,\"empty\":%d,\"full\":%d}}\n",
           tracked_mutex,
           tracked_empty,
           tracked_full);

    fflush(stdout);
    pthread_mutex_unlock(&log_mutex);
}

/**
 * Emit a thread state change event.
 * Used to inform the frontend when a thread transitions between
 * states: "running", "waiting", "blocked", "done".
 */
void logger_thread_state(const char *thread_name, const char *state) {
    pthread_mutex_lock(&log_mutex);
    printf("{\"type\":\"state\","
           "\"timestamp\":%lld,"
           "\"thread\":\"%s\","
           "\"state\":\"%s\"}\n",
           get_timestamp_ms(),
           thread_name,
           state);
    fflush(stdout);
    pthread_mutex_unlock(&log_mutex);
}
