/**
 * test_buffer.c - Unit tests for the circular buffer
 */

#include <stdio.h>
#include <assert.h>
#include "buffer.h"

static int tests_passed = 0;
static int tests_total  = 0;

#define TEST(name) do { tests_total++; printf("  TEST: %s ... ", name); } while(0)
#define PASS() do { tests_passed++; printf("PASS\n"); } while(0)

void test_init(void) {
    TEST("buffer_init");
    CircularBuffer buf;
    buffer_init(&buf, 4);
    assert(buf.size == 4);
    assert(buf.count == 0);
    assert(buf.in == 0);
    assert(buf.out == 0);
    for (int i = 0; i < 4; i++)
        assert(buf.items[i] == BUFFER_EMPTY_SLOT);
    PASS();
}

void test_insert(void) {
    TEST("buffer_insert");
    CircularBuffer buf;
    buffer_init(&buf, 4);
    int idx = buffer_insert(&buf, 42);
    assert(idx == 0);
    assert(buf.items[0] == 42);
    assert(buf.count == 1);
    assert(buf.in == 1);
    PASS();
}

void test_remove(void) {
    TEST("buffer_remove");
    CircularBuffer buf;
    buffer_init(&buf, 4);
    buffer_insert(&buf, 42);
    int index;
    int val = buffer_remove(&buf, &index);
    assert(val == 42);
    assert(index == 0);
    assert(buf.count == 0);
    assert(buf.out == 1);
    PASS();
}

void test_wraparound(void) {
    TEST("circular_wraparound");
    CircularBuffer buf;
    buffer_init(&buf, 3);
    buffer_insert(&buf, 10);
    buffer_insert(&buf, 20);
    buffer_insert(&buf, 30);
    assert(buf.in == 0); /* wrapped around */
    int idx;
    buffer_remove(&buf, &idx); /* removes 10 */
    buffer_insert(&buf, 40);   /* goes to index 0 */
    assert(buf.items[0] == 40);
    assert(buf.in == 1);
    PASS();
}

void test_snapshot(void) {
    TEST("buffer_snapshot");
    CircularBuffer buf;
    buffer_init(&buf, 4);
    buffer_insert(&buf, 10);
    buffer_insert(&buf, 20);
    int snap[4];
    buffer_snapshot(&buf, snap);
    assert(snap[0] == 10);
    assert(snap[1] == 20);
    assert(snap[2] == BUFFER_EMPTY_SLOT);
    assert(snap[3] == BUFFER_EMPTY_SLOT);
    PASS();
}

int main(void) {
    printf("Running buffer tests...\n");
    test_init();
    test_insert();
    test_remove();
    test_wraparound();
    test_snapshot();
    printf("\nResults: %d/%d passed\n", tests_passed, tests_total);
    return (tests_passed == tests_total) ? 0 : 1;
}
