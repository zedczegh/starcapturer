
// Create a global object to store the current SIQS value
export const currentSiqsStore = {
  value: null as number | null,
  setValue: (value: number | null) => {
    currentSiqsStore.value = value;
    // Also save to localStorage for persistence
    if (value !== null) {
      localStorage.setItem('current_siqs_value', value.toString());
    }
  },
  getValue: () => {
    // If no value in memory, try localStorage
    if (currentSiqsStore.value === null) {
      const storedValue = localStorage.getItem('current_siqs_value');
      if (storedValue) {
        const parsedValue = parseFloat(storedValue);
        if (!isNaN(parsedValue)) {
          currentSiqsStore.value = parsedValue;
        }
      }
    }
    return currentSiqsStore.value;
  }
};
