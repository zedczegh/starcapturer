
/**
 * Simple store for managing current SIQS value across components
 */
class SIQSStore {
  private value: number | null = null;

  public set(value: number): void {
    this.value = value;
  }

  public getValue(): number | null {
    return this.value;
  }

  public setValue(value: number | null): void {
    this.value = value;
  }
}

// Export a singleton instance
export const currentSiqsStore = new SIQSStore();
