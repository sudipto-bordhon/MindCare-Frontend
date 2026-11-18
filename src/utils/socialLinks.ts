export const SOCIAL_LINK_PLATFORMS = ['facebook', 'linkedin', 'instagram', 'twitter'] as const;

export type SocialLinkPlatform = typeof SOCIAL_LINK_PLATFORMS[number];

export interface SocialLinks {
  facebook: string;
  linkedin: string;
  instagram: string;
  twitter: string;
}

export function normalizeSocialLink(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.length > 500) return null;

  const withProtocol = /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function normalizeSocialLinks(value: unknown): SocialLinks | null {
  if (value !== undefined && value !== null && (typeof value !== 'object' || Array.isArray(value))) return null;
  const links = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const normalized: SocialLinks = { facebook: '', linkedin: '', instagram: '', twitter: '' };
  for (const platform of SOCIAL_LINK_PLATFORMS) {
    const link = links[platform] === undefined ? '' : normalizeSocialLink(links[platform]);
    if (link === null) return null;
    normalized[platform] = link;
  }
  return normalized;
}
