export const EVENT_LABELS = {
  page_view: 'Page view',
  form_submit: 'Form submit',
  whatsapp_click: 'WhatsApp click',
  lead_created: 'Lead created',
};

export const normalizePeopleIri = value => {
  if (!value) return '';
  const raw = typeof value === 'object' ? value['@id'] ?? value.id : value;
  if (raw == null) return '';
  const normalized = String(raw).trim();
  if (!normalized) return '';
  if (normalized.startsWith('/people/') || normalized.startsWith('/peoples/')) {
    return normalized.replace('/peoples/', '/people/');
  }
  if (/^\d+$/.test(normalized)) {
    return `/people/${normalized}`;
  }
  return normalized;
};

export const extractCollection = response => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response['hydra:member'])) return response['hydra:member'];
  if (Array.isArray(response.member)) return response.member;
  if (Array.isArray(response.items)) return response.items;
  return [];
};

export const buildUtmSummary = event => {
  const parts = [
    event?.utmSource && `src=${event.utmSource}`,
    event?.utmMedium && `med=${event.utmMedium}`,
    event?.utmCampaign && `cmp=${event.utmCampaign}`,
    event?.utmTerm && `term=${event.utmTerm}`,
    event?.utmContent && `cnt=${event.utmContent}`,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
};
