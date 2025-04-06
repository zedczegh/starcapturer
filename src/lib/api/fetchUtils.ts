
/**
 * Fetch with timeout utility
 */
export const fetchWithTimeout = async (resource: string, options: RequestInit = {}, timeout = 8000): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal
  });
  
  clearTimeout(id);
  return response;
};
