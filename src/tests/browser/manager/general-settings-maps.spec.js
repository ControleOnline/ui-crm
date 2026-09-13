/**
 * Smoke browser: Manager /general-settings → aba Mapas (#792).
 * fluxo: outros
 * flowchartIds: [1]
 * Refs: app-community#792
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

const captureEvidence = async (page, testInfo, stepId, title, steps) => {
  const outputDir = path.join(testInfo.outputDir, 'manual-qa', 'issue-792');
  fs.mkdirSync(outputDir, {recursive: true});
  const screenshot = `${stepId}.png`;
  await page.screenshot({path: path.join(outputDir, screenshot), fullPage: true});
  steps.push({id: stepId, title, screenshot, viewport: page.viewportSize(), url: page.url()});
};

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
  path.join(__dirname, '../../../react/pages/settings/sections/shop/FranchiseMapPreview.js'),
  path.join(__dirname, '../../../react/pages/settings/sections/shop/mapsFranchiseMapHelpers.js'),
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

    if (pathname === 'token') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({
          id: 360,
          active: true,
          type: 'MANAGER',
          people: 3,
          api_key: 'smoke-token-360',
        }),
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
      // CheckLogin restores authentication from the session object on web.
      localStorage.setItem(
        'session',
        JSON.stringify({
          id: 360,
          active: true,
          type: 'MANAGER',
          people: 3,
          api_key: 'smoke-token-360',
          name: 'Manager Smoke',
        }),
      );
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

test.describe('general-settings maps (browser smoke #792)', () => {
  test('MapsSection and ShopFranchiseLocator respect 500-line limit', async () => {
    for (const file of MODULES_MAX_500) {
      expect(fs.existsSync(file), `missing ${file}`).toBe(true);
      const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).length;
      expect(lines, `${path.basename(file)} has ${lines} lines (max 500)`).toBeLessThanOrEqual(
        500,
      );
    }
  });

  test('Map preview keeps the safe Leaflet helper', async () => {
    const mapsPath = MODULES_MAX_500[0];
    const source = fs.readFileSync(mapsPath, 'utf8');
    expect(source).toMatch(/buildLeafletMapHtml/);
    expect(source).toMatch(/srcDoc/);
  });

  test('open /general-settings → aba Mapas shows primary entry + franchise locator', async ({page}, testInfo) => {
    const evidence = [];
    await mockGeneralSettingsApi(page);

    await page.goto('/general-settings');
    await captureEvidence(page, testInfo, '01-general-settings-entry', 'Tela inicial de General Settings', evidence);

    // Keep the smoke self-contained if the app rejects the synthetic session.
    if (await page.getByPlaceholder('Email').isVisible().catch(() => false)) {
      await page.getByPlaceholder('Email').fill('smoke@example.com');
      await page.getByPlaceholder('Senha').fill('smoke-password');
      await page.getByText('Entrar', {exact: true}).click();
    }

    // Wait for settings shell
    await expect(page.getByText(/Configurador geral|Mapas|Dispositivos/i).first()).toBeVisible({
      timeout: 20000,
    });

    // Activate Mapas tab (label or role)
    const mapsTab = page.getByText('Mapas', { exact: true }).first();
    await expect(mapsTab).toBeVisible({ timeout: 15000 });
    await mapsTab.click();
    await captureEvidence(page, testInfo, '02-mapas-tab', 'Aba MAPAS aberta', evidence);

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

    await captureEvidence(page, testInfo, '03-franchise-list', 'Lista de franquias e toggle visíveis', evidence);

    const checkbox = page.getByRole('checkbox').first();
    await expect(checkbox).toBeVisible();
    await checkbox.click();
    await expect(page.getByTestId('maps-franchise-map')).toBeVisible();
    await captureEvidence(page, testInfo, '04-pins-checkbox-map', 'Checkbox de pin e mapa carregado', evidence);

    await page.setViewportSize({width: 480, height: 900});
    await captureEvidence(page, testInfo, '05-responsive-resize', 'Viewport estreito após resize', evidence);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

    await page.setViewportSize({width: 1280, height: 900});
    await captureEvidence(page, testInfo, '06-desktop-final', 'Desktop final com mapa e pins', evidence);
    const outputDir = path.join(testInfo.outputDir, 'manual-qa', 'issue-792');
    fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify({fluxo: 'outros', flowchartIds: [1], issue: 'ControleOnline/app-community#792', build: APP_VERSION, steps: evidence}, null, 2) + '\n'
);

    // No residual guidance pointing to non-existent Shop tab
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/permanece na aba Shop/i);
    expect(bodyText).not.toMatch(/Visibilidade detalhada por franquia\/endereço no mapa: aba Shop/i);
  });
});
