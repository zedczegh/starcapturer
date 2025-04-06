
/**
 * Utility for fetch operations with timeout support
 */

/**
 * Fetch with timeout capability
 * @param url URL to fetch
 * @param options Fetch options
 * @param timeoutMs Timeout in milliseconds (default: 10000ms)
 * @returns Promise with fetch response
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  
  const response = await fetch(url, {
    ...options,
    signal: controller.signal
  });
  
  clearTimeout(id);
  return response;
}

/**
 * Check if a response is valid JSON
 * @param response Fetch response
 * @returns Promise with JSON data
 * @throws Error if response is not valid JSON
 */
export async function checkJsonResponse(response: Response): Promise<any> {
  try {
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error parsing JSON response:", error);
    throw new Error("Invalid JSON response");
  }
}
