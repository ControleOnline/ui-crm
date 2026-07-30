export const normalizeEntityId = value =>
  String(value?.id ?? value?.['@id'] ?? value ?? '').replace(/\D+/g, '');

export const resolveDomainId = domain => normalizeEntityId(domain);

export const resolveShowcaseDomainId = showcase =>
  normalizeEntityId(showcase?.peopleDomain);

const sortByDomain = (left, right) =>
  String(left?.domain || '').localeCompare(String(right?.domain || ''));

export const buildDomainRows = ({domains, showcases}) => {
  const showcasesByDomainId = new Map();

  showcases.forEach(showcase => {
    const domainId = resolveShowcaseDomainId(showcase);
    if (domainId) {
      showcasesByDomainId.set(domainId, showcase);
    }
  });

  return domains.sort(sortByDomain).map(domain => {
    const domainId = resolveDomainId(domain);

    return {
      domain,
      domainId,
      showcase: showcasesByDomainId.get(domainId) || null,
    };
  });
};

export const buildShowcasePayload = ({companyId, row, patch = {}}) => {
  const showcase = row?.showcase || {};
  const domainId = row?.domainId || resolveShowcaseDomainId(showcase);

  return {
    active: showcase.active !== false,
    company: `/people/${companyId}`,
    id: showcase.id,
    integrationKey: showcase.integrationKey || 'shop',
    name: showcase.name || row?.domain?.domain,
    peopleDomain: `/people_domains/${domainId}`,
    settings: showcase.settings || {},
    ...patch,
  };
};
