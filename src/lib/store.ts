
/**
 * Simple store implementation for sharing state across components
 */
export class Store<T> {
  private value: T;
  private listeners: ((value: T) => void)[] = [];

  constructor(initialValue: T) {
    this.value = initialValue;
  }

  getValue(): T {
    return this.value;
  }

  setValue(newValue: T): void {
    this.value = newValue;
    this.notifyListeners();
  }

  subscribe(listener: (value: T) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.value);
    }
  }
}
