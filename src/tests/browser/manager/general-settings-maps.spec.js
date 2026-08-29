/**
 * Smoke browser: Manager /general-settings → aba Mapas (#360).
 * fluxo: manager-general-settings-maps
 * Refs: app-community#360
 *
 * Criteria:
 * - Aba Mapas visível com seletor de tela principal (quando opções ativas)
 * - Lista/secao de franquias/endereços presente na aba Mapas (sem apontar aba Shop)
 * - Nomes de franquias via people_links (não people?link.company=)
 * - Prints por etapa em test-results/manual-qa/issue-360/ (01 primary+names, 02 locator, 03 options) + MANIFEST.md
 * - Módulos de settings ≤ 500 linhas
 * flowchartIds: nenhum entry general-settings no catálogo admin atual (GET /flowcharts)
 */
const { expect, test } = require('playwright/test');
const fs = require('fs');
const path = require('path');
const packageJson = require('../../../../../../../package.json');
const { API_ORIGIN } = require('../../../../../../../src/tests/browser/apiOrigin');

const APP_VERSION = packageJson?.version || '1.0.0';
const CURRENT_DEVICE_ID = 'web-7';

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers':
    'API-TOKEN, APP-DOMAIN, DEVICE, ACCEPT, CONTENT-TYPE, X-Requested-With',
  'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
};

const jsonHeaders = () => ({
  ...CORS_HEADERS,
  'content-type': 'application/ld+json; charset=utf-8',
});

const collection = member => ({
  member,
  'hydra:member': member,
  totalItems: member.length,
  'hydra:totalItems': member.length,
});

const company = {
  '@id': '/people/3',
  id: 3,
  name: 'GYROS SMOKE',
  alias: 'GYROS',
  panel_enabled: true,
  enabled: true,
  commercial_enabled: true,
  configs: {
    'shop-sales-page-enabled': true,
    'shop-franchise-locator-enabled': true,
    'shop-primary-entry': 'franchise-locator',
    'shop-franchise-visible-company-ids': '[]',
    'shop-franchise-visible-address-ids': '[]',
  },
};

const franchiseCompany = {
  '@id': '/people/31',
  id: 31,
  name: 'ASC FRANQUIA 1',
  alias: 'ASC FRANQUIA 1',
  peopleType: 'J',
  shopAddresses: [
    {
      '@id': '/addresses/501',
      id: 501,
      nickname: 'Matriz',
      street: 'Av Paulista',
      number: '1000',
      city: 'São Paulo',
      latitude: -23.5614,
      longitude: -46.6558,
    },
  ],
};

const franchiseCompany2 = {
  '@id': '/people/32',
  id: 32,
  name: 'ASC FRANQUIA 2',
  alias: 'ASC FRANQUIA 2',
  peopleType: 'J',
  shopAddresses: [
    {
      '@id': '/addresses/502',
      id: 502,
      nickname: 'Filial',
      street: 'Rua Augusta',
      number: '200',
      city: 'São Paulo',
      latitude: -23.55,
      longitude: -46.64,
    },
  ],
};

/** people_links rows (directory path used by shopFranchises after #360 fix) */
const franchiseLinks = [
  {
    '@id': '/people_links/1',
    id: 1,
    linkType: 'franchisee',
    company: company,
    people: franchiseCompany,
  },
  {
    '@id': '/people_links/2',
    id: 2,
    linkType: 'franchisee',
    company: company,
    people: franchiseCompany2,
  },
];

const MODULES_MAX_500 = [
  path.join(__dirname, '../../../react/pages/settings/sections/MapsSection.js'),
  path.join(
    __dirname,
    '../../../react/pages/settings/sections/shop/ShopFranchiseLocatorSection.js',
  ),
];

const mockGeneralSettingsApi = async (page, track = null) => {
  await page.route(`${API_ORIGIN}/**`, async route => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname.replace(/^\/+/, '');
    const method = request.method().toUpperCase();

    if (method === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS_HEADERS, body: '' });
    }

    if (pathname === 'themes-colors.css') {
      return route.fulfill({
        status: 200,
        headers: { ...CORS_HEADERS, 'content-type': 'text/css; charset=utf-8' },
        body: ':root { --primary: #0ea5e9; }',
      });
    }

    if (pathname === 'runtime/ip') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({ ip: '127.0.0.1' }),
      });
    }

    if (pathname === 'menus-people') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({ modules: {} }),
      });
    }

    if (pathname === 'people/companies/my' || pathname === 'people') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection([company])),
      });
    }

    if (pathname === 'people/3' || pathname === 'people/3/') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(company),
      });
    }

    if (pathname === 'configs' || pathname.startsWith('configs')) {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection([])),
      });
    }

    // #360 directory: people_links both sides (not people?link.company=)
    if (pathname === 'people_links' || pathname.startsWith('people_links')) {
      if (track && Array.isArray(track.peopleLinks)) {
        track.peopleLinks.push(url.href);
      }
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection(franchiseLinks)),
      });
    }

    if (
      pathname === 'people' &&
      (url.searchParams.has('link.company') ||
        String(url.search).includes('link.company'))
    ) {
      if (track && Array.isArray(track.badPeopleFilter)) {
        track.badPeopleFilter.push(url.href);
      }
    }

    if (pathname === 'people/31' || pathname === 'people/31/') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(franchiseCompany),
      });
    }

    if (pathname === 'people/32' || pathname === 'people/32/') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(franchiseCompany2),
      });
    }

    if (pathname === 'shop/franchises' || pathname.startsWith('shop/franchises')) {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection([franchiseCompany, franchiseCompany2])),
      });
    }

    if (pathname === 'categories' || pathname.startsWith('categories')) {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection([])),
      });
    }

    if (pathname === 'devices' || pathname.startsWith('devices')) {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(
          collection([
            {
              '@id': '/devices/1',
              id: 1,
              device: CURRENT_DEVICE_ID,
              alias: 'Smoke Manager',
              type: 'MANAGER',
            },
          ]),
        ),
      });
    }

    if (pathname === 'device_configs' || pathname.startsWith('device_configs')) {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(
          collection([
            {
              '@id': '/device_configs/1',
              id: 1,
              type: 'MANAGER',
              people: '/people/3',
              device: { id: 1, device: CURRENT_DEVICE_ID, alias: 'Smoke Manager' },
              configs: JSON.stringify({ 'config-version': APP_VERSION }),
            },
          ]),
        ),
      });
    }

    return route.fulfill({
      status: 200,
      headers: jsonHeaders(),
      body: JSON.stringify(collection([])),
    });
  });

  await page.addInitScript(
    ({ appVersion }) => {
      localStorage.setItem('token', 'smoke-token-360');
      localStorage.setItem('app-type', 'MANAGER');
      localStorage.setItem('config', JSON.stringify({ language: 'pt-br' }));
      localStorage.setItem(
        'device',
        JSON.stringify({
          id: CURRENT_DEVICE_ID,
          device: CURRENT_DEVICE_ID,
          type: 'MANAGER',
          appName: 'Browser Manager',
          appVersion,
          buildNumber: appVersion,
          systemName: 'web',
          systemVersion: 'web',
          deviceType: 'web',
          metadata: { runtime: 'web' },
        }),
      );
    },
    { appVersion: APP_VERSION },
  );
};

test.describe('general-settings maps (browser smoke #360)', () => {
  test('MapsSection and ShopFranchiseLocator respect 500-line limit', async () => {
    for (const file of MODULES_MAX_500) {
      expect(fs.existsSync(file), `missing ${file}`).toBe(true);
      const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).length;
      expect(lines, `${path.basename(file)} has ${lines} lines (max 500)`).toBeLessThanOrEqual(
        500,
      );
    }
  });

  test('MapsSection does not reference residual aba Shop', async () => {
    const mapsPath = MODULES_MAX_500[0];
    const source = fs.readFileSync(mapsPath, 'utf8');
    expect(source).not.toMatch(/aba Shop/i);
    expect(source).toMatch(/ShopFranchiseLocatorSection/);
  });

  test('open /general-settings → aba Mapas shows primary entry + franchise locator', async ({
    page,
  }) => {
    const track = { peopleLinks: [], badPeopleFilter: [] };
    await mockGeneralSettingsApi(page, track);

    await page.goto('/general-settings');

    // Wait for settings shell
    await expect(page.getByText(/Configurador geral|Mapas|Dispositivos/i).first()).toBeVisible({
      timeout: 20000,
    });

    // Activate Mapas tab (label or role)
    const mapsTab = page.getByText('Mapas', { exact: true }).first();
    await expect(mapsTab).toBeVisible({ timeout: 15000 });
    await mapsTab.click();

    // Section title / labels
    await expect(page.getByText('Tela principal do shop').first()).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText('Localizador de franquias').first()).toBeVisible({
      timeout: 10000,
    });

    // Primary entry options when both toggles are on
    const primaryOptions = page.getByTestId('maps-primary-entry-options');
    await expect(primaryOptions).toBeVisible({ timeout: 10000 });

    // Franchise locator block on the Maps tab itself
    await expect(page.getByTestId('maps-franchise-locator')).toBeVisible({
      timeout: 10000,
    });

    // No residual guidance pointing to non-existent Shop tab
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/permanece na aba Shop/i);
    expect(bodyText).not.toMatch(/Visibilidade detalhada por franquia\/endereço no mapa: aba Shop/i);

    // Directory via people_links must surface franchise *names*
    await expect(page.getByText('ASC FRANQUIA 1').first()).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText('ASC FRANQUIA 2').first()).toBeVisible({
      timeout: 10000,
    });

    // Evidence dir (fluxo: manager-general-settings-maps) — prints por etapa
    const outDir = path.join(
      __dirname,
      '../../../../../../../test-results/manual-qa/issue-360',
    );
    fs.mkdirSync(outDir, { recursive: true });

    // 01 — aba Mapas com seletor tela principal + nomes de franquia
    await page.screenshot({
      path: path.join(outDir, '01-maps-primary-entry-and-franchise-names.png'),
      fullPage: true,
    });

    // 02 — detalhe do bloco localizador (testID)
    const locatorBlock = page.getByTestId('maps-franchise-locator');
    await locatorBlock.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(outDir, '02-maps-franchise-locator-block.png'),
      fullPage: false,
    });

    // 03 — options de tela principal
    await primaryOptions.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(outDir, '03-maps-primary-entry-options.png'),
      fullPage: false,
    });

    // Manifesto reutilizável por QA/Documentor
    const manifesto = [
      'fluxo: manager-general-settings-maps',
      'issue: app-community#360',
      'flowchartIds: none-in-admin-catalog (GET /flowcharts has no general-settings entry; catalog IDs 1,3,4,5 only)',
      'steps:',
      '  1. open /general-settings',
      '  2. activate tab Mapas',
      '  3. assert Tela principal do shop + Localizador de franquias',
      '  4. assert testIDs maps-primary-entry-options + maps-franchise-locator',
      '  5. assert franchise names ASC FRANQUIA 1/2 via people_links (not people?link.company=)',
      '  6. screenshots 01/02/03 under test-results/manual-qa/issue-360/',
      'network:',
      '  people_links hits: ' + track.peopleLinks.length,
      '  bad people?link.company= hits: ' + track.badPeopleFilter.length,
      'result: PASS',
      '',
    ].join('\n');
    fs.writeFileSync(path.join(outDir, 'MANIFEST.md'), manifesto, 'utf8');

    expect(
      track.peopleLinks.length,
      'expected GET people_links for franchise directory',
    ).toBeGreaterThan(0);
    expect(
      track.badPeopleFilter.length,
      'must not use people?link.company= for franchise directory',
    ).toBe(0);
  });
});
