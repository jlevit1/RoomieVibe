package com.example.project.security;

import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * In-memory sliding-window hit counter, keyed by an arbitrary string (IP,
 * user id, or a combination). All mutations run inside
 * {@link ConcurrentHashMap#compute} / {@link ConcurrentHashMap#computeIfPresent},
 * which execute atomically per key, so no extra locking is needed even though
 * each key's history is a plain (non-thread-safe) {@link ArrayDeque}.
 */
@Component
public class SlidingWindowRateLimiter {

    private final ConcurrentHashMap<String, Deque<Long>> hitsByKey = new ConcurrentHashMap<>();

    /** Records a hit and reports whether the key is still within maxHits for the trailing window. */
    public boolean tryConsume(String key, int maxHits, Duration window) {
        long cutoff = System.currentTimeMillis() - window.toMillis();
        AtomicBoolean allowed = new AtomicBoolean();

        hitsByKey.compute(key, (k, deque) -> {
            Deque<Long> d = prune(deque, cutoff);
            if (d.size() >= maxHits) {
                allowed.set(false);
            } else {
                d.addLast(System.currentTimeMillis());
                allowed.set(true);
            }
            return d;
        });

        return allowed.get();
    }

    /** Read-only check: has this key already reached maxHits within the trailing window? */
    public boolean isBlocked(String key, int maxHits, Duration window) {
        long cutoff = System.currentTimeMillis() - window.toMillis();
        AtomicBoolean blocked = new AtomicBoolean();

        hitsByKey.computeIfPresent(key, (k, deque) -> {
            Deque<Long> d = prune(deque, cutoff);
            blocked.set(d.size() >= maxHits);
            return d;
        });

        return blocked.get();
    }

    /** Records one hit without checking any limit (used to count failures only). */
    public void recordHit(String key) {
        hitsByKey.compute(key, (k, deque) -> {
            Deque<Long> d = deque != null ? deque : new ArrayDeque<>();
            d.addLast(System.currentTimeMillis());
            return d;
        });
    }

    /** Clears a key's history, e.g. after a successful login. */
    public void reset(String key) {
        hitsByKey.remove(key);
    }

    private Deque<Long> prune(Deque<Long> deque, long cutoff) {
        Deque<Long> d = deque != null ? deque : new ArrayDeque<>();
        while (!d.isEmpty() && d.peekFirst() < cutoff) {
            d.pollFirst();
        }
        return d;
    }

    // Sweeps out keys with no activity in the last 24h so idle IPs/users don't
    // accumulate in memory forever.
    @Scheduled(fixedRate = 30 * 60 * 1000)
    void cleanup() {
        long cutoff = System.currentTimeMillis() - Duration.ofHours(24).toMillis();
        hitsByKey.forEach((key, deque) -> hitsByKey.computeIfPresent(key, (k, d) -> {
            Deque<Long> pruned = prune(d, cutoff);
            return pruned.isEmpty() ? null : pruned;
        }));
    }
}
