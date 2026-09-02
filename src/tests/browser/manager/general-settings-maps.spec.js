/**
 * fluxo: manager-general-settings-maps
 * flowchartIds: [1]
 * app-community#360 — General Settings / Mapas (tela principal + localizador).
 *
 * Justificativa flowchartIds [1]: catálogo admin não tem entry de general-settings
 * (ids históricos 1, 3, 4, 5). Âncora no flowchart habilitado #1.
 *
 * Sem page.route em endpoints de produto (people, people_links, configs, addresses).
 * Sessão via SMOKE_API_TOKEN (localStorage) quando presente; senão UI de login real.
 */
const fs = require('fs');
const path = require('path');
const { expect, test } = require('playwright/test');
const packageJson = require('../../../../../../../package.json');

const APP_VERSION = packageJson?.version || '1.0.0';
const FLOW_ID = 'manager-general-settings-maps';
const FLOWCHART_IDS = [1];
const FLOWCHART_LINKS = FLOWCHART_IDS.map(
  id => `https://admin.controleonline.com/admin/flowcharts/${id}`,
);

const MODULES_MAX_500 = [
  path.join(__dirname, '../../../react/pages/settings/sections/MapsSection.js'),
  path.join(
    __dirname,
    '../../../react/pages/settings/sections/shop/ShopFranchiseLocatorSection.js',
  ),
];

const evidenceSteps = [];

const writeEvidence = async (page, outputDir, stepId, title) => {
  fs.mkdirSync(outputDir, { recursive: true });
  const fileName = `${stepId}.png`;
  const filePath = path.join(outputDir, fileName);
  await page.screenshot({ path: filePath, fullPage: true });
  evidenceSteps.push({
    id: stepId,
    title,
    screenshot: fileName,
    url: page.url(),
  });
  return filePath;
};

const writeManifest = outputDir => {
  const manifest = {
    fluxo: FLOW_ID,
    flowchartIds: FLOWCHART_IDS,
    flowchartLinks: FLOWCHART_LINKS,
    title: 'General Settings / Mapas: tela principal + localizador de franquias',
    issue: 'ControleOnline/app-community#360',
    steps: evidenceSteps,
  };
  fs.writeFileSync(
    path.join(outputDir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(outputDir, 'MANIFEST.md'),
    [
      `# ${manifest.title}`,
      '',
      `- fluxo: ${FLOW_ID}`,
      `- flowchartIds: ${JSON.stringify(FLOWCHART_IDS)}`,
      `- issue: ${manifest.issue}`,
      '',
      ...evidenceSteps.map(
        step => `- ${step.id}: ${step.title} (${step.screenshot})`,
      ),
      '',
    ].join('\n'),
  );
  return manifest;
};

const seedApiSession = async page => {
  const token = String(
    process.env.SMOKE_API_TOKEN ||
      process.env.SMOKE_ADMIN_API_TOKEN ||
      process.env.API_TOKEN ||
      '',
  ).trim();
  if (!token) return false;
  const peopleId = String(
    process.env.SMOKE_ADMIN_PEOPLE_ID || process.env.ADMIN_PEOPLE_ID || '7',
  ).trim();
  const userId = String(
    process.env.SMOKE_ADMIN_USER_ID || process.env.ADMIN_USER_ID || peopleId,
  ).trim();
  const session = {
    id: Number(userId) || userId,
    people: `/people/${peopleId}`,
    api_key: token,
    active: 1,
  };
  await page.addInitScript(payload => {
    window.localStorage.setItem('session', JSON.stringify(payload));
  }, session);
  return true;
};

test.describe('general-settings maps (browser smoke #360)', () => {
  test.describe.configure({ timeout: 90000 });

  test('MapsSection and ShopFranchiseLocator respect 500-line limit', async () => {
    for (const file of MODULES_MAX_500) {
      expect(fs.existsSync(file), `missing ${file}`).toBe(true);
      const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).length;
      expect(
        lines,
        `${path.basename(file)} has ${lines} lines (max 500)`,
      ).toBeLessThanOrEqual(500);
    }
  });

  test('MapsSection does not reference residual aba Shop', async () => {
    const source = fs.readFileSync(MODULES_MAX_500[0], 'utf8');
    expect(source).not.toMatch(/aba Shop/i);
    expect(source).toMatch(/ShopFranchiseLocatorSection/);
  });

  test('open /general-settings → aba Mapas on live API', async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push({ type: 'fluxo', description: FLOW_ID });
    testInfo.annotations.push({
      type: 'flowchartIds',
      description: JSON.stringify(FLOWCHART_IDS),
    });

    const outputDir = path.join(
      testInfo.outputDir,
      'manual-qa',
      'issue-360',
    );
    evidenceSteps.length = 0;

    const seeded = await seedApiSession(page);
    await page.goto('/general-settings');
    await writeEvidence(page, outputDir, '01-general-settings-entry', 'Abrir /general-settings');

    const loginVisible = await page
      .getByPlaceholder('Email')
      .isVisible()
      .catch(() => false);
    if (loginVisible && !seeded) {
      await writeEvidence(page, outputDir, '01b-login-gate', 'Tela de login (sem SMOKE_API_TOKEN)');
      writeManifest(outputDir);
      test.info().annotations.push({
        type: 'note',
        description:
          'SMOKE_API_TOKEN ausente; runner precisa credencial para ultrapassar o login',
      });
    }

    if (loginVisible && seeded) {
      await page.reload();
    }

    const mapsHint = page.getByText(/Configurador geral|Mapas|Dispositivos/i).first();
    await expect(mapsHint).toBeVisible({ timeout: 25000 });

    const mapsTab = page.getByText('Mapas', { exact: true }).first();
    await expect(mapsTab).toBeVisible({ timeout: 20000 });
    await mapsTab.click();
    await writeEvidence(page, outputDir, '02-maps-tab', 'Aba Mapas aberta');

    await expect(page.getByText('Tela principal do shop').first()).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByText('Localizador de franquias').first()).toBeVisible({
      timeout: 15000,
    });

    const primaryOptions = page.getByTestId('maps-primary-entry-options');
    if (await primaryOptions.count()) {
      await expect(primaryOptions.first()).toBeVisible({ timeout: 10000 });
    }
    await writeEvidence(
      page,
      outputDir,
      '03-maps-primary-entry',
      'Seletor de tela principal / toggles',
    );

    const locator = page.getByTestId('maps-franchise-locator');
    await expect(locator).toBeVisible({ timeout: 20000 });
    await writeEvidence(
      page,
      outputDir,
      '04-maps-franchise-locator',
      'Bloco localizador de franquias (API real)',
    );

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/permanece na aba Shop/i);
    expect(bodyText).not.toMatch(
      /Visibilidade detalhada por franquia\/endereço no mapa: aba Shop/i,
    );

    const lat = page.getByTestId('address-latitude-input');
    const lon = page.getByTestId('address-longitude-input');
    if ((await lat.count()) || (await lon.count())) {
      await writeEvidence(
        page,
        outputDir,
        '05-address-lat-long',
        'Campos Latitude/Longitude visíveis',
      );
    }

    const manifest = writeManifest(outputDir);
    expect(manifest.fluxo).toBe(FLOW_ID);
    expect(manifest.flowchartIds).toEqual(FLOWCHART_IDS);
    expect(manifest.steps.length).toBeGreaterThanOrEqual(3);
    expect(APP_VERSION).toBeTruthy();
  });
});
