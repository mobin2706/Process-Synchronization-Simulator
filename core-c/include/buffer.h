/**
 * buffer.h - Circular buffer interface
 * 
 * Implements a fixed-size circular (ring) buffer used as the shared
 * resource between producer and consumer threads. The buffer uses
 * two indices ('in' for the next write position, 'out' for the next
 * read position) to manage wrap-around access.
 * 
 * IMPORTANT: Buffer operations are NOT thread-safe on their own.
 * Callers must acquire the mutex semaphore before calling insert/remove.
 */

#ifndef BUFFER_H
#define BUFFER_H

#include "common.h"

/* Special value indicating an empty buffer slot */
#define BUFFER_EMPTY_SLOT -1

/* ── Circular Buffer Structure ──────────────────────────────────────── */
typedef struct {
    int  items[MAX_BUFFER_SIZE]; /* Storage array                       */
    int  size;                   /* Maximum capacity                    */
    int  count;                  /* Current number of items             */
    int  in;                     /* Next write index (producer side)    */
    int  out;                    /* Next read index  (consumer side)    */
} CircularBuffer;

/**
 * Initialize the buffer with a given capacity.
 * All slots are set to BUFFER_EMPTY_SLOT.
 * 
 * @param buf   Pointer to the buffer structure
 * @param size  Capacity (must be <= MAX_BUFFER_SIZE)
 */
void buffer_init(CircularBuffer *buf, int size);

/**
 * Insert an item into the buffer at the 'in' position.
 * Advances the 'in' pointer with wrap-around.
 * 
 * @param buf   Pointer to the buffer
 * @param item  Value to insert
 * @return      The index where the item was placed
 */
int buffer_insert(CircularBuffer *buf, int item);

/**
 * Remove an item from the buffer at the 'out' position.
 * Advances the 'out' pointer with wrap-around.
 * 
 * @param buf   Pointer to the buffer
 * @param index Output parameter: index from which item was removed
 * @return      The value that was removed
 */
int buffer_remove(CircularBuffer *buf, int *index);

/**
 * Copy the current buffer contents into a snapshot array.
 * Used for JSON logging without holding the lock too long.
 * 
 * @param buf       Pointer to the buffer
 * @param snapshot  Output array (must be at least buf->size elements)
 */
void buffer_snapshot(const CircularBuffer *buf, int *snapshot);

#endif /* BUFFER_H */
