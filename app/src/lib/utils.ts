import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `${minutes}${minutes === 1 ? ' min' : ' mins'} ago`;
  } else if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `${hours}${hours === 1 ? ' hour' : ' hours'} ago`;
  } else if (diff < week) {
    const days = Math.floor(diff / day);
    return `${days}${days === 1 ? ' day' : ' days'} ago`;
  } else {
    const weeks = Math.floor(diff / week);
    return `${weeks}${weeks === 1 ? ' week' : ' weeks'} ago`;
  }
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
