export const BROCHURE_FILENAME = 'Iston-Builder-Group-Brochure.pdf';

// Returns a URL that forces a file download (Supabase Storage honours ?download=).
export function brochureDownloadUrl(url: string) {
  if (!url) return '';
  if (url.includes('/storage/v1/object/public/')) {
    return url + (url.includes('?') ? '&' : '?') + 'download=' + encodeURIComponent(BROCHURE_FILENAME);
  }
  return url;
}
