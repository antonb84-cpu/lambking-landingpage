export const CREATOR_PARTNER_PATH = '/creator-partner'

export function isCreatorPartnerPath(pathname = window.location.pathname): boolean {
  const normalized = pathname.replace(/\/+$/, '')
  return normalized.endsWith(CREATOR_PARTNER_PATH)
}

export function homeHref(anchor = ''): string {
  return isCreatorPartnerPath() ? `./${anchor}` : anchor || '#top'
}

export function creatorPartnerHref(): string {
  return isCreatorPartnerPath() ? './creator-partner/' : 'creator-partner/'
}
