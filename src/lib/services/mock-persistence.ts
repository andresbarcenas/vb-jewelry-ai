const cache = new Map<string, unknown>();

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

export async function readPersistedValue<T>(
  key: string,
  seedValue: T,
  normalize: (raw: unknown, fallback: T) => T,
): Promise<T> {
  if (cache.has(key)) {
    return cloneValue(cache.get(key) as T);
  }

  const fallback = cloneValue(seedValue);

  if (!canUseStorage()) {
    cache.set(key, fallback);
    return cloneValue(fallback);
  }

  const storedValue = window.localStorage.getItem(key);

  if (!storedValue) {
    cache.set(key, fallback);
    return cloneValue(fallback);
  }

  try {
    const normalized = normalize(JSON.parse(storedValue), fallback);
    cache.set(key, normalized);
    return cloneValue(normalized);
  } catch {
    cache.set(key, fallback);
    return cloneValue(fallback);
  }
}

export async function writePersistedValue<T>(key: string, value: T): Promise<T> {
  const nextValue = cloneValue(value);
  cache.set(key, nextValue);

  if (canUseStorage()) {
    window.localStorage.setItem(key, JSON.stringify(nextValue));
  }

  return cloneValue(nextValue);
}

export async function resetPersistedValue<T>(key: string, seedValue: T): Promise<T> {
  const nextValue = cloneValue(seedValue);
  cache.set(key, nextValue);

  if (canUseStorage()) {
    window.localStorage.removeItem(key);
  }

  return cloneValue(nextValue);
}
