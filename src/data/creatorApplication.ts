export interface CreatorApplicationPayload {
  fullName: string
  email: string
  country: string
  language: string
  platforms: string[]
  profileUrls: string
  followers: string
  niche: string
  communityFit: string
  amazonAffiliate: 'yes' | 'no'
}

export function creatorApplicationMailto(
  email: string,
  payload: CreatorApplicationPayload,
  labels: { subject: string; fields: string[] },
): string {
  const values = [
    payload.fullName,
    payload.email,
    payload.country,
    payload.language,
    payload.platforms.join(', '),
    payload.profileUrls,
    payload.followers,
    payload.niche,
    payload.communityFit,
    payload.amazonAffiliate,
  ]
  const body = labels.fields.map((label, index) => `${label}:\n${values[index] || '–'}`).join('\n\n')
  return `mailto:${email}?subject=${encodeURIComponent(labels.subject)}&body=${encodeURIComponent(body)}`
}
