import "@testing-library/jest-dom";

// Node 22+ defines an experimental globalThis.localStorage that is undefined
// unless --localstorage-file is passed, and it shadows jsdom's implementation
// in the Vitest environment. Back-fill a real in-memory Storage so code under
// test can use window.localStorage normally.
if (!globalThis.localStorage) {
  const store = new Map();
  const memoryStorage = {
    getItem: (key) => (store.has(String(key)) ? store.get(String(key)) : null),
    setItem: (key, value) => store.set(String(key), String(value)),
    removeItem: (key) => store.delete(String(key)),
    clear: () => store.clear(),
    key: (index) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: memoryStorage,
    writable: true,
    configurable: true,
  });
}
