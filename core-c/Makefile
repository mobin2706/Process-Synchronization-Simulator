# Makefile for Process Synchronization Simulator (C Engine)
# Supports macOS (Apple Clang) and Linux (GCC)

CC       = gcc
CFLAGS   = -Wall -Wextra -O2 -I./include -pthread
LDFLAGS  = -pthread
SRC_DIR  = src
INC_DIR  = include
BUILD_DIR = build
TARGET   = simulator

# Source files
SRCS = $(SRC_DIR)/main.c \
       $(SRC_DIR)/buffer.c \
       $(SRC_DIR)/sync.c \
       $(SRC_DIR)/logger.c \
       $(SRC_DIR)/producer.c \
       $(SRC_DIR)/consumer.c

OBJS = $(patsubst $(SRC_DIR)/%.c,$(BUILD_DIR)/%.o,$(SRCS))

# Default target
all: $(BUILD_DIR) $(TARGET)

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

$(TARGET): $(OBJS)
	$(CC) $(LDFLAGS) -o $@ $^

$(BUILD_DIR)/%.o: $(SRC_DIR)/%.c
	$(CC) $(CFLAGS) -c -o $@ $<

# Run with default parameters
run: $(TARGET)
	./$(TARGET) --producers 2 --consumers 2 --buffer-size 5 --iterations 10 --delay 500

# Build and run tests
test: $(BUILD_DIR) $(BUILD_DIR)/test_buffer
	./$(BUILD_DIR)/test_buffer

$(BUILD_DIR)/test_buffer: tests/test_buffer.c $(SRC_DIR)/buffer.c
	$(CC) $(CFLAGS) -o $@ $^

clean:
	rm -rf $(BUILD_DIR) $(TARGET)

.PHONY: all run test clean
