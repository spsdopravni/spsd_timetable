interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>();
  private stats: CacheStats = { hits: 0, misses: 0, size: 0 };
  private maxSize = 100;
  private defaultTTL = 5 * 60 * 1000; // 5 minut

  // Nastavení TTL pro různé typy dat
  private TTL_CONFIG = {
    departures: 20 * 1000,        // 20 sekund pro odjezdy
    weather: 10 * 60 * 1000,      // 10 minut pro počasí
    routes: 60 * 60 * 1000,       // 1 hodina pro trasy
    stations: 24 * 60 * 60 * 1000 // 24 hodin pro stanice
  };

  set<T>(key: string, data: T, type?: keyof typeof this.TTL_CONFIG): void {
    const ttl = type ? this.TTL_CONFIG[type] : this.defaultTTL;

    // Pokud je cache plná, odstraň nejstarší záznamy
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    this.stats.size = this.cache.size;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Kontrola expirace
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.size = this.cache.size;
      return null;
    }

    this.stats.hits++;
    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.size = this.cache.size;
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.stats.size = this.cache.size;
  }

  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, size: 0 };
  }

  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // Vyčištění expirovaných záznamů
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
    this.stats.size = this.cache.size;
  }

  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? this.stats.hits / total : 0
    };
  }

  // Předběžné načítání dat
  async prefetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    type?: keyof typeof this.TTL_CONFIG
  ): Promise<void> {
    if (!this.has(key)) {
      try {
        const data = await fetchFn();
        this.set(key, data, type);
      } catch (error) {
        console.warn('Cache prefetch failed:', error);
      }
    }
  }

  // Batch operace
  setMany<T>(entries: Array<{ key: string; data: T; type?: keyof typeof this.TTL_CONFIG }>): void {
    entries.forEach(({ key, data, type }) => {
      this.set(key, data, type);
    });
  }

  getMany<T>(keys: string[]): Array<{ key: string; data: T | null }> {
    return keys.map(key => ({
      key,
      data: this.get<T>(key)
    }));
  }
}

// Singleton instance
export const apiCache = new APICache();

// Periodické čištění cache
setInterval(() => {
  apiCache.cleanup();
}, 60 * 1000); // Každou minutu

// Export cache decorator pro funkce
export function cached<T extends (...args: any[]) => Promise<any>>(
  type: keyof APICache['TTL_CONFIG'],
  keyGenerator?: (...args: Parameters<T>) => string
) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: Parameters<T>) {
      const key = keyGenerator
        ? `${propertyKey}_${keyGenerator(...args)}`
        : `${propertyKey}_${JSON.stringify(args)}`;

      // Zkus získat z cache
      let cached = apiCache.get(key);
      if (cached !== null) {
        return cached;
      }

      // Načti nová data
      try {
        const result = await originalMethod.apply(this, args);
        apiCache.set(key, result, type);
        return result;
      } catch (error) {
        // V případě chyby zkus vrátit starší data z cache (pokud existují)
        // ale nevaliduj TTL
        const staleEntry = apiCache.cache?.get(key);
        if (staleEntry) {
          console.warn('Using stale cache data due to API error');
          return staleEntry.data;
        }
        throw error;
      }
    };
  };
}