# Real-Time Process Synchronization Simulator

A production-level project that simulates the **Producer-Consumer problem** using POSIX semaphores, with a C-based core engine, a Node.js backend API, and a modern React frontend visualization.

![Architecture](https://img.shields.io/badge/Architecture-C_%7C_Node.js_%7C_React-blue)
![Sync](https://img.shields.io/badge/Sync-POSIX_Semaphores-green)
![UI](https://img.shields.io/badge/UI-Glassmorphism-purple)

---

## Architecture

```
┌─────────────────┐    WebSocket     ┌─────────────────┐   spawn/stdout   ┌─────────────────┐
│   React Frontend │ ◄──────────────► │  Node.js Backend │ ◄──────────────► │    C Engine      │
│  (Vite+Tailwind) │    REST API     │  (Express + ws)  │   JSON lines    │ (pthreads + sem) │
└─────────────────┘                  └─────────────────┘                  └─────────────────┘
```

### Components

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Core Engine** | C (pthreads, semaphores) | Producer-Consumer synchronization logic |
| **Backend** | Node.js, Express, ws | Bridge between C engine and frontend |
| **Frontend** | React, Tailwind CSS v4, Framer Motion | Real-time visualization dashboard |

---

## Features

- ✅ Multiple producers and consumers with configurable count
- ✅ Circular buffer with visual representation
- ✅ Three POSIX semaphores: `mutex`, `empty`, `full`
- ✅ Real-time WebSocket streaming
- ✅ Animated thread state indicators (Running/Waiting/Blocked/Done)
- ✅ Event timeline with color-coded entries
- ✅ Performance metrics (throughput, uptime)
- ✅ Glassmorphism dark-mode UI
- ✅ Configurable parameters via slider controls
- ✅ Makefile for C compilation
- ✅ Unit tests for buffer module

---

## Project Structure

```
CSE-316/
├── core-c/                  # C Engine
│   ├── Makefile
│   ├── include/             # Header files
│   │   ├── common.h         # Shared types, platform detection
│   │   ├── buffer.h         # Circular buffer interface
│   │   ├── sync.h           # Semaphore abstraction
│   │   └── logger.h         # JSON logging interface
│   ├── src/                 # Source files
│   │   ├── main.c           # Entry point, thread creation
│   │   ├── producer.c       # Producer thread logic
│   │   ├── consumer.c       # Consumer thread logic
│   │   ├── buffer.c         # Circular buffer implementation
│   │   ├── sync.c           # Named semaphore operations
│   │   └── logger.c         # Thread-safe JSON output
│   └── tests/
│       └── test_buffer.c    # Buffer unit tests
├── backend/                 # Node.js Backend
│   ├── server.js            # Express + WebSocket server
│   ├── routes/simulation.js # REST API endpoints
│   ├── services/engine.js   # C engine process manager
│   └── utils/logger.js      # Winston logging
├── frontend/                # React Frontend
│   ├── src/
│   │   ├── App.jsx          # Root layout
│   │   ├── index.css        # Design system (glassmorphism)
│   │   ├── components/      # UI components
│   │   └── hooks/           # WebSocket hook
│   └── vite.config.js
├── docker-compose.yml
├── Dockerfile.backend
└── README.md
```

---

## Setup & Run

### Prerequisites

- **macOS** or **Linux**
- **GCC** or **Clang** compiler
- **Node.js** v18+ and **npm**

### 1. Build the C Engine

```bash
cd core-c
make clean && make all
```

Run tests:
```bash
make test
```

Test standalone:
```bash
./simulator --producers 2 --consumers 2 --buffer-size 5 --iterations 10 --delay 500
```

### 2. Start the Backend

```bash
cd backend
npm install
npm start
```

Server runs on `http://localhost:3001`

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

### 4. Use the Simulator

1. Open `http://localhost:5173` in your browser
2. Configure parameters using the sidebar sliders
3. Click **Start Simulation**
4. Watch real-time visualization of producers, consumers, buffer, and semaphores
5. Click **Stop** to end the simulation

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/start-simulation` | Start simulation with config body |
| `POST` | `/api/stop-simulation` | Stop running simulation |
| `POST` | `/api/config` | Validate configuration |
| `GET`  | `/api/status` | Get current simulation status |
| `WS`   | `ws://localhost:3001` | Real-time event stream |

---

## Sample JSON Output (C Engine)

```json
{
  "type": "event",
  "timestamp": 1700000000000,
  "thread": "Producer-1",
  "action": "produce",
  "value": 42,
  "buffer_index": 2,
  "buffer": [10, 42, null, null, null],
  "buffer_count": 2,
  "buffer_in": 3,
  "buffer_out": 0,
  "semaphores": { "mutex": 1, "empty": 3, "full": 2 }
}
```

---

## How It Works

### The Producer-Consumer Problem

The Producer-Consumer problem is a classic synchronization challenge:
- **Producers** generate data and place it in a shared buffer
- **Consumers** remove and process data from the buffer
- The buffer has a **fixed size** — producers must wait if it's full, consumers must wait if it's empty

### Semaphore Protocol

```
Producer:                          Consumer:
  sem_wait(empty)  ← block if     sem_wait(full)   ← block if
                     buffer full                      buffer empty
  sem_wait(mutex)  ← enter        sem_wait(mutex)  ← enter
                     critical                         critical
                     section                          section
  [INSERT ITEM]                    [REMOVE ITEM]
  sem_post(mutex)  ← leave        sem_post(mutex)  ← leave
                     critical                         critical
                     section                          section
  sem_post(full)   ← signal       sem_post(empty)  ← signal
                     item ready                       slot freed
```

### Why This Order Matters

If a producer locked `mutex` before checking `empty`, and the buffer was full, it would hold the lock forever — no consumer could acquire `mutex` to free a slot. This would cause a **deadlock**.

---

## Docker Support

```bash
docker-compose up --build
```

---

## Credits

CSE-316 Operating Systems — Process Synchronization Project
