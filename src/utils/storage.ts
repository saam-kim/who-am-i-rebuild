// 브라우저의 서드파티 쿠키 차단, 시크릿 모드, 보안 정책 등으로 인해
// localStorage 또는 sessionStorage 접근 시 SecurityError (DOMException)가 발생하는 것을 방지합니다.
// 예외 발생 시 메모리 맵(in-memory map)으로 투명하게 fallback 됩니다.

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

class MemoryStorage implements StorageLike {
  private memory = new Map<string, string>();

  getItem(key: string): string | null {
    return this.memory.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.memory.set(key, String(value));
  }

  removeItem(key: string): void {
    this.memory.delete(key);
  }
}

function createSafeStorage(type: "localStorage" | "sessionStorage"): StorageLike {
  const fallback = new MemoryStorage();
  const fallbackKeys = new Set<string>();

  return {
    getItem(key: string): string | null {
      if (fallbackKeys.has(key)) return fallback.getItem(key);
      try {
        if (typeof window !== "undefined" && window[type]) {
          return window[type].getItem(key);
        }
      } catch (err) {
        console.warn(`[storage] ${type}.getItem("${key}") failed, using fallback:`, err);
      }
      return fallback.getItem(key);
    },

    setItem(key: string, value: string): void {
      fallback.setItem(key, value);
      try {
        if (typeof window !== "undefined" && window[type]) {
          window[type].setItem(key, value);
          fallbackKeys.delete(key);
          return;
        }
      } catch (err) {
        console.warn(`[storage] ${type}.setItem("${key}") failed, using fallback:`, err);
      }
      fallbackKeys.add(key);
    },

    removeItem(key: string): void {
      fallback.removeItem(key);
      fallbackKeys.add(key);
      try {
        if (typeof window !== "undefined" && window[type]) {
          window[type].removeItem(key);
          fallbackKeys.delete(key);
          return;
        }
      } catch (err) {
        console.warn(`[storage] ${type}.removeItem("${key}") failed, using fallback:`, err);
      }
    },
  };
}

export const safeLocalStorage = createSafeStorage("localStorage");
export const safeSessionStorage = createSafeStorage("sessionStorage");
