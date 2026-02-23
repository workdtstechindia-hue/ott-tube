class MemoryCache {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    const hit = this.store.get(key);
    if (!hit) {
      return null;
    }

    if (hit.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }

    return hit.value;
  }

  set(key, value, ttlMs) {
    const ttl = Number(ttlMs) || 0;
    if (ttl <= 0) {
      this.store.delete(key);
      return;
    }

    this.store.set(key, { value, expiresAt: Date.now() + ttl });
  }

  del(key) {
    this.store.delete(key);
  }

  clearPrefix(prefix) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }
}

const cache = new MemoryCache();

module.exports = { cache };
