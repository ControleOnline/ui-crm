/**
 * Smoke browser: Manager /general-settings → aba Mapas (#360).
 * fluxo: manager-general-settings-maps
 * Refs: app-community#360
 *
 * Criteria:
 * - Aba Mapas visível com seletor de tela principal (quando opções ativas)
 * - Lista/secao de franquias/endereços presente na aba Mapas (sem apontar aba Shop)
 * - Helper de lat/long e seção de mapa sem mensagem residual "aba Shop"
 * - Módulos de settings ≤ 500 linhas
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
  name: 'FRANQUIA SMOKE',
  alias: 'FRANQUIA',
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

const MODULES_MAX_500 = [
  path.join(__dirname, '../../../react/pages/settings/sections/MapsSection.js'),
  path.join(
    __dirname,
    '../../../react/pages/settings/sections/shop/ShopFranchiseLocatorSection.js',
  ),
];

const mockGeneralSettingsApi = async page => {
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

    if (pathname === 'shop/franchises' || pathname.startsWith('shop/franchises')) {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection([franchiseCompany])),
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
    await mockGeneralSettingsApi(page);

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
  });
});
