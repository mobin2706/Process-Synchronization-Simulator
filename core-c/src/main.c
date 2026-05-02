/**
 * main.c - Entry point for the Process Synchronization Simulator
 * 
 * Parses CLI arguments, creates producer/consumer threads,
 * and orchestrates the simulation lifecycle.
 */

#include "common.h"
#include "buffer.h"
#include "sync.h"
#include "logger.h"

/* Global shared buffer */
CircularBuffer g_buffer;

/* Global running flag */
volatile sig_atomic_t g_running = 1;

/* External thread functions */
extern void *producer_func(void *arg);
extern void *consumer_func(void *arg);

/* Signal handler for graceful shutdown */
static void signal_handler(int sig) {
    (void)sig;
    g_running = 0;
}

static void print_usage(const char *prog) {
    fprintf(stderr, "Usage: %s [options]\n"
            "  --producers N    Number of producers (default: 2)\n"
            "  --consumers N    Number of consumers (default: 2)\n"
            "  --buffer-size N  Buffer capacity (default: 5)\n"
            "  --iterations N   Items per thread (default: 10)\n"
            "  --delay N        Delay in ms (default: 500)\n",
            prog);
}

int main(int argc, char *argv[]) {
    /* Default configuration */
    SimConfig config = {
        .num_producers = 2,
        .num_consumers = 2,
        .buffer_size   = 5,
        .iterations    = 10,
        .delay_ms      = 500
    };

    /* Parse command-line arguments */
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--producers") == 0 && i + 1 < argc)
            config.num_producers = atoi(argv[++i]);
        else if (strcmp(argv[i], "--consumers") == 0 && i + 1 < argc)
            config.num_consumers = atoi(argv[++i]);
        else if (strcmp(argv[i], "--buffer-size") == 0 && i + 1 < argc)
            config.buffer_size = atoi(argv[++i]);
        else if (strcmp(argv[i], "--iterations") == 0 && i + 1 < argc)
            config.iterations = atoi(argv[++i]);
        else if (strcmp(argv[i], "--delay") == 0 && i + 1 < argc)
            config.delay_ms = atoi(argv[++i]);
        else if (strcmp(argv[i], "--help") == 0) {
            print_usage(argv[0]);
            return 0;
        }
    }

    /* Validate */
    if (config.num_producers < 1 || config.num_producers > MAX_THREADS ||
        config.num_consumers < 1 || config.num_consumers > MAX_THREADS ||
        config.buffer_size < 1   || config.buffer_size > MAX_BUFFER_SIZE) {
        fprintf(stderr, "Invalid configuration\n");
        print_usage(argv[0]);
        return 1;
    }

    /* Setup signal handlers */
    signal(SIGINT, signal_handler);
    signal(SIGTERM, signal_handler);

    /* Initialize subsystems */
    logger_init();
    buffer_init(&g_buffer, config.buffer_size);
    if (sync_init(config.buffer_size) != 0) {
        fprintf(stderr, "Failed to initialize semaphores\n");
        return 1;
    }

    /* Log simulation start */
    logger_start(&config);

    /* Create thread arguments and threads */
    int total = config.num_producers + config.num_consumers;
    pthread_t threads[MAX_THREADS * 2];
    ThreadArg args[MAX_THREADS * 2];

    /* Create producer threads */
    for (int i = 0; i < config.num_producers; i++) {
        args[i].id = i;
        args[i].config = &config;
        snprintf(args[i].name, MAX_THREAD_NAME, "Producer-%d", i + 1);
        pthread_create(&threads[i], NULL, producer_func, &args[i]);
    }

    /* Create consumer threads */
    for (int i = 0; i < config.num_consumers; i++) {
        int idx = config.num_producers + i;
        args[idx].id = i;
        args[idx].config = &config;
        snprintf(args[idx].name, MAX_THREAD_NAME, "Consumer-%d", i + 1);
        pthread_create(&threads[idx], NULL, consumer_func, &args[idx]);
    }

    /* Wait for all threads to complete */
    for (int i = 0; i < total; i++) {
        pthread_join(threads[i], NULL);
    }

    /* Log simulation end */
    int total_produced = config.num_producers * config.iterations;
    int total_consumed = config.num_consumers * config.iterations;
    logger_end(total_produced, total_consumed);

    /* Cleanup */
    sync_destroy();
    logger_destroy();

    return 0;
}
