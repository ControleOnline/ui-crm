export const SHOP_DOMAIN_TYPE = 'SHOP';

export const normalizeEntityId = value =>
  String(value?.id ?? value?.['@id'] ?? value ?? '').replace(/\D+/g, '');

export const resolveDomainId = domain => normalizeEntityId(domain);

export const resolveShowcaseDomainId = showcase =>
  normalizeEntityId(showcase?.peopleDomain);

export const normalizeDomainType = value =>
  String(value ?? '')
    .trim()
    .toUpperCase();

export const isShopDomain = domain =>
  normalizeDomainType(domain?.domainType ?? domain?.domain_type) ===
  SHOP_DOMAIN_TYPE;

const sortByDomain = (left, right) =>
  String(left?.domain || '').localeCompare(String(right?.domain || ''));

/**
 * Builds domain rows for the Shop settings tab.
 * Only domains with domainType SHOP are included (defensive client filter;
 * the store query also requests domainType=SHOP).
 */
export const buildDomainRows = ({domains, showcases}) => {
  const showcasesByDomainId = new Map();
  const domainList = Array.isArray(domains) ? domains : [];
  const showcaseList = Array.isArray(showcases) ? showcases : [];

  showcaseList.forEach(showcase => {
    const domainId = resolveShowcaseDomainId(showcase);
    if (domainId) {
      showcasesByDomainId.set(domainId, showcase);
    }
  });

  return domainList
    .filter(isShopDomain)
    .sort(sortByDomain)
    .map(domain => {
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
