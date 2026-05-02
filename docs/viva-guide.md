# Viva Guide — Process Synchronization Simulator

This document provides explanations for the key concepts, code walkthrough, and expected viva questions.

---

## 1. Core Concepts

### What is Process Synchronization?
Process synchronization is the coordination of concurrent processes to ensure correct execution when they access shared resources. Without synchronization, race conditions can cause data corruption.

### What is a Semaphore?
A semaphore is a synchronization primitive — an integer variable accessed through two atomic operations:
- **wait (P / sem_wait)**: Decrements the value. If the value becomes negative, the process blocks.
- **signal (V / sem_post)**: Increments the value. If processes are waiting, one is unblocked.

### Types of Semaphores Used

| Semaphore | Type | Initial Value | Purpose |
|-----------|------|---------------|---------|
| `mutex` | Binary (0 or 1) | 1 | Mutual exclusion — only one thread in the critical section at a time |
| `empty` | Counting | buffer_size | Tracks available empty slots. Producers block when 0 (buffer full) |
| `full` | Counting | 0 | Tracks available filled slots. Consumers block when 0 (buffer empty) |

### What is the Critical Section?
The critical section is the code segment where a thread accesses the shared buffer. Only one thread can execute this section at a time, enforced by the `mutex` semaphore.

### What is a Circular Buffer?
A fixed-size array that wraps around — when the write pointer reaches the end, it wraps to the beginning. This allows efficient reuse of space without shifting elements.

```
Index:  [0] [1] [2] [3] [4]
         ↑               ↑
        OUT              IN
        (read)          (write)
```

---

## 2. Code Walkthrough

### C Engine Architecture

```
main.c          → Parses args, creates threads, manages lifecycle
producer.c      → Producer thread: wait(empty) → wait(mutex) → produce → post(mutex) → post(full)
consumer.c      → Consumer thread: wait(full) → wait(mutex) → consume → post(mutex) → post(empty)
buffer.c        → Circular buffer: insert, remove, snapshot operations
sync.c          → POSIX named semaphore wrapper (sem_open, sem_wait, sem_post)
logger.c        → Thread-safe JSON output to stdout
```

### Producer Flow (producer.c)
```c
// 1. Wait for empty slot (blocks if buffer full)
sem_wait(empty);

// 2. Lock mutex (enter critical section)
sem_wait(mutex);

// === CRITICAL SECTION ===
buffer_insert(&g_buffer, value);  // Add item
// === END CRITICAL SECTION ===

// 3. Unlock mutex (leave critical section)
sem_post(mutex);

// 4. Signal that buffer has a new item
sem_post(full);
```

### Consumer Flow (consumer.c)
```c
// 1. Wait for filled slot (blocks if buffer empty)
sem_wait(full);

// 2. Lock mutex (enter critical section)
sem_wait(mutex);

// === CRITICAL SECTION ===
buffer_remove(&g_buffer, &index);  // Remove item
// === END CRITICAL SECTION ===

// 3. Unlock mutex (leave critical section)
sem_post(mutex);

// 4. Signal that a slot is now free
sem_post(empty);
```

### Backend Architecture
- **Express** serves REST API for start/stop/config
- **ws** (WebSocket) streams JSON events from C engine to frontend
- **child_process.spawn()** runs the compiled C binary
- Parses stdout line-by-line as JSON objects

### Frontend Architecture
- **React** with functional components and hooks
- **useWebSocket** custom hook manages connection and state
- **Framer Motion** animates state transitions
- Components: Dashboard → Buffer, Producers, Consumers, Semaphores, Timeline

---

## 3. Expected Viva Questions

### Q: What is the Producer-Consumer problem?
**A:** It's a classic synchronization problem where producer processes generate data into a shared, bounded buffer, and consumer processes remove data from it. The challenge is coordinating access so producers don't write to a full buffer and consumers don't read from an empty one.

### Q: Why do we need three semaphores?
**A:**
- `mutex` (binary): Prevents two threads from modifying the buffer simultaneously (mutual exclusion)
- `empty` (counting): Prevents producers from writing when the buffer is full
- `full` (counting): Prevents consumers from reading when the buffer is empty

### Q: What happens if we lock mutex before checking empty?
**A:** **Deadlock.** If a producer locks mutex and then finds the buffer full, it waits on empty while holding mutex. No consumer can acquire mutex to remove an item, so empty never gets signaled. Both producer and consumer are stuck forever.

### Q: What is a race condition?
**A:** When two or more threads access shared data concurrently and the outcome depends on the timing of their execution. For example, two producers writing to the same buffer index simultaneously could overwrite each other's data.

### Q: Why use named semaphores instead of unnamed?
**A:** macOS (Darwin) deprecated `sem_init()` for unnamed semaphores. Named semaphores (`sem_open`) work on both macOS and Linux, making the code portable.

### Q: How does the circular buffer work?
**A:** It uses two indices:
- `in`: Where the next item will be written (producer side)
- `out`: Where the next item will be read (consumer side)
- Both wrap around using modulo: `in = (in + 1) % size`
- This allows O(1) insert and remove without shifting elements.

### Q: How does real-time visualization work?
**A:**
1. C engine writes JSON to stdout (one event per line)
2. Backend spawns C as a child process and reads stdout
3. Each JSON line is parsed and broadcast via WebSocket
4. Frontend receives events and updates React state
5. Framer Motion animates the UI transitions

### Q: What is mutual exclusion?
**A:** The requirement that when one thread is executing in its critical section, no other thread can be in its critical section. We enforce this with the mutex semaphore.

### Q: Can deadlock occur in this implementation?
**A:** No, because we follow the correct semaphore ordering:
- Producers: `wait(empty)` → `wait(mutex)` → produce → `post(mutex)` → `post(full)`
- Consumers: `wait(full)` → `wait(mutex)` → consume → `post(mutex)` → `post(empty)`

The counting semaphores are always checked *before* the mutex, preventing the hold-and-wait condition.

### Q: What is thread safety?
**A:** Code is thread-safe if it functions correctly during simultaneous execution by multiple threads. In our project, the logger uses a pthread_mutex to ensure JSON output lines are not interleaved.

---

## 4. Key Files to Review Before Viva

| File | Focus On |
|------|----------|
| `core-c/src/producer.c` | Semaphore ordering, critical section |
| `core-c/src/consumer.c` | Mirror of producer protocol |
| `core-c/src/sync.c` | Named semaphore initialization |
| `core-c/src/buffer.c` | Circular buffer wrap-around |
| `backend/services/engine.js` | Process spawning, stdout parsing |
| `frontend/src/hooks/useWebSocket.js` | Real-time data flow |
