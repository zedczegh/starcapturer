
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges TailwindCSS classes safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to locale string
 * @param date Date object or string
 * @param locale Locale string
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, locale: string = "en-US"): string {
  if (!date) return "";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Get current time formatted as string
 * @returns Formatted time string
 */
export function getCurrentTimeFormatted(): string {
  return new Date().toISOString();
}
