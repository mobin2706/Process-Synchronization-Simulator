/**
 * buffer.c - Circular buffer implementation
 * 
 * Implements a fixed-size circular (ring) buffer for the Producer-Consumer
 * problem. The buffer wraps around using modular arithmetic on the 'in'
 * and 'out' indices.
 * 
 * Thread Safety: These functions are NOT thread-safe. The caller MUST
 * hold the mutex semaphore before calling buffer_insert() or buffer_remove().
 */

#include "buffer.h"

/**
 * Initialize the circular buffer.
 * Sets all slots to BUFFER_EMPTY_SLOT (-1) to indicate they are unused.
 * Resets in/out pointers and count to zero.
 */
void buffer_init(CircularBuffer *buf, int size) {
    if (size > MAX_BUFFER_SIZE) {
        fprintf(stderr, "Error: buffer size %d exceeds MAX_BUFFER_SIZE (%d)\n",
                size, MAX_BUFFER_SIZE);
        exit(EXIT_FAILURE);
    }

    buf->size  = size;
    buf->count = 0;
    buf->in    = 0;  /* Next position to write (producer) */
    buf->out   = 0;  /* Next position to read  (consumer) */

    /* Mark all slots as empty */
    for (int i = 0; i < size; i++) {
        buf->items[i] = BUFFER_EMPTY_SLOT;
    }
}

/**
 * Insert an item into the buffer.
 * 
 * The item is placed at buf->items[buf->in], then 'in' is advanced
 * with wrap-around: in = (in + 1) % size
 * 
 * Preconditions (enforced by semaphore 'empty' in the caller):
 *   - Buffer is not full (count < size)
 *   - Mutex is held
 * 
 * @return The index where the item was inserted
 */
int buffer_insert(CircularBuffer *buf, int item) {
    int index = buf->in;

    buf->items[index] = item;

    /* Advance the write pointer with circular wrap-around */
    buf->in = (buf->in + 1) % buf->size;
    buf->count++;

    return index;
}

/**
 * Remove an item from the buffer.
 * 
 * The item is read from buf->items[buf->out], the slot is cleared,
 * then 'out' is advanced with wrap-around: out = (out + 1) % size
 * 
 * Preconditions (enforced by semaphore 'full' in the caller):
 *   - Buffer is not empty (count > 0)
 *   - Mutex is held
 * 
 * @param index  Output parameter set to the index where the item was removed
 * @return       The value that was removed
 */
int buffer_remove(CircularBuffer *buf, int *index) {
    *index = buf->out;
    int item = buf->items[buf->out];

    /* Clear the slot to indicate it is now empty */
    buf->items[buf->out] = BUFFER_EMPTY_SLOT;

    /* Advance the read pointer with circular wrap-around */
    buf->out = (buf->out + 1) % buf->size;
    buf->count--;

    return item;
}

/**
 * Take a snapshot of the current buffer state.
 * This copies all slot values into a separate array so that
 * the JSON logger can format the output without holding the lock.
 */
void buffer_snapshot(const CircularBuffer *buf, int *snapshot) {
    for (int i = 0; i < buf->size; i++) {
        snapshot[i] = buf->items[i];
    }
}
