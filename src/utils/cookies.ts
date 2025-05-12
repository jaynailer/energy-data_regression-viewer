export function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2 && parts[1]) {
    const cookieValue = parts[1].split(';')[0];
    return cookieValue || null;
  }
  return null;
}

export function getUserId(): string {
  return getCookie('wp_id') || 'master';
}