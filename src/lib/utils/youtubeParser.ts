export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([^&#]+)/,
    /(?:youtu\.be\/)([^?&#]+)/,
    /(?:youtube\.com\/embed\/)([^?&#]+)/,
    /(?:youtube\.com\/shorts\/)([^?&#]+)/,
    /(?:youtube\.com\/v\/)([^?&#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
    return url.trim();
  }

  return null;
}

export function isValidYoutubeUrl(url: string): boolean {
  return extractVideoId(url) !== null;
}
