/*
 * @agents Shop configuration is domain-first: each SHOP people_domain owns one
 * product_showcase with its own settings and catalog.
 */
import React, {useEffect, useMemo, useState} from 'react';
import {Text, View} from 'react-native';

import {useStore} from '@store';
import {
  SHOP_SHOWCASE_TYPE_MENU,
  SHOP_SHOWCASE_TYPE_SETTING_KEY,
} from '@controleonline/ui-common/src/react/utils/shopConfig';

import {
  useGeneralSettingsPalette,
  useGeneralSettingsStyles,
} from '../../GeneralSettings.styles';
import GeneralSettingsSection from '../../GeneralSettingsSection';
import {useGeneralSettingsConfig} from '../../GeneralSettings.shared';

import ShopDomainCreateForm from './ShopDomainCreateForm';
import ShopDomainPanel from './ShopDomainPanel';
import ShopDomainTabs from './ShopDomainTabs';
import {
  buildDomainRows,
  buildShowcasePayload,
  normalizeEntityId,
  resolveDomainId,
} from './shopDomainShowcasesUtils';

const t = (type, key) => global.t?.t?.('configs', type, key);

const ShopDomainShowcasesSection = () => {
  const palette = useGeneralSettingsPalette();
  const localStyles = useGeneralSettingsStyles();
  const {currentCompany} = useGeneralSettingsConfig();
  const peopleDomainsStore = useStore('people_domains');
  const productShowcasesStore = useStore('product_showcases');
  const companyId = currentCompany?.id;
  const [selectedDomainId, setSelectedDomainId] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!companyId) {
      return;
    }

    peopleDomainsStore.actions.getItems({
      domainType: 'SHOP',
      itemsPerPage: 100,
      'order[domain]': 'ASC',
      people: `/people/${companyId}`,
    });
    productShowcasesStore.actions.getItems({
      company: `/people/${companyId}`,
      itemsPerPage: 100,
      'order[name]': 'ASC',
    });
  }, [companyId]);

  const rows = useMemo(
    () =>
      buildDomainRows({
        domains: [...(peopleDomainsStore.getters.items || [])],
        showcases: productShowcasesStore.getters.items || [],
      }),
    [peopleDomainsStore.getters.items, productShowcasesStore.getters.items],
  );

  useEffect(() => {
    if (!selectedDomainId && rows[0]?.domainId) {
      setSelectedDomainId(rows[0].domainId);
    }
  }, [rows, selectedDomainId]);

  const selectedRow = rows.find(
    row => String(row.domainId) === String(selectedDomainId),
  );
  const catalogs = useMemo(
    () =>
      (productShowcasesStore.getters.items || []).filter(
        showcase => showcase?.integrationKey === 'shop',
      ),
    [productShowcasesStore.getters.items],
  );

  const reload = () => {
    if (!companyId) {
      return;
    }
    peopleDomainsStore.actions.getItems({
      domainType: 'SHOP',
      itemsPerPage: 100,
      people: `/people/${companyId}`,
    });
    productShowcasesStore.actions.getItems({
      company: `/people/${companyId}`,
      itemsPerPage: 100,
    });
  };

  const createShowcase = async row => {
    if (!companyId || !row?.domainId) {
      return null;
    }

    return productShowcasesStore.actions.save(
      buildShowcasePayload({
        companyId,
        row,
        patch: {
          active: true,
          settings: {[SHOP_SHOWCASE_TYPE_SETTING_KEY]: SHOP_SHOWCASE_TYPE_MENU},
        },
      }),
    );
  };

  const createDomain = async domain => {
    if (!companyId) {
      return;
    }

    const savedDomain = await peopleDomainsStore.actions.save({
      domain,
      domainType: 'SHOP',
      people: `/people/${companyId}`,
    });
    const domainId = resolveDomainId(savedDomain);
    await createShowcase({domain: savedDomain, domainId});
    setSelectedDomainId(domainId);
    setCreating(false);
    reload();
  };

  const saveShowcase = async (row, patch) => {
    if (!companyId || !row?.showcase) {
      return;
    }

    await productShowcasesStore.actions.save(
      buildShowcasePayload({companyId, row, patch}),
    );
    reload();
  };

  const associateCatalog = async (row, catalog) => {
    if (!companyId || !row?.domainId || !catalog) {
      return;
    }

    const currentShowcaseId = normalizeEntityId(row.showcase);
    const catalogId = normalizeEntityId(catalog);

    if (currentShowcaseId && currentShowcaseId !== catalogId) {
      await productShowcasesStore.actions.save(
        buildShowcasePayload({
          companyId,
          row,
          patch: {peopleDomain: null},
        }),
      );
    }

    await productShowcasesStore.actions.save(
      buildShowcasePayload({
        companyId,
        row: {...row, showcase: catalog},
        patch: {
          active: true,
          peopleDomain: `/people_domains/${row.domainId}`,
        },
      }),
    );
    reload();
  };

  return (
    <GeneralSettingsSection
      description={t('description', 'shopDomainShowcases')}
      icon="shopping-bag"
      iconBackgroundColor={palette.cardIconBackground}
      iconColor={palette.cardIconColor}
      title={t('title', 'shopDomainShowcases')}>
      {rows.length === 0 && !creating ? (
        <View style={localStyles.emptyBox}>
          <Text style={localStyles.emptyTitle}>
            {t('title', 'shopDomainShowcasesEmpty')}
          </Text>
          <Text style={localStyles.emptyText}>
            {t('message', 'shopDomainShowcasesEmpty')}
          </Text>
        </View>
      ) : null}

      {!creating ? (
        <ShopDomainTabs
          onCreatePress={() => setCreating(true)}
          onSelect={setSelectedDomainId}
          palette={palette}
          rows={rows}
          selectedDomainId={selectedDomainId}
        />
      ) : null}

      {creating ? (
        <ShopDomainCreateForm
          onCancel={() => setCreating(false)}
          onCreate={createDomain}
          palette={palette}
        />
      ) : (
        <ShopDomainPanel
          catalogs={catalogs}
          onAssociateCatalog={associateCatalog}
          onEnsureShowcase={async row => {
            await createShowcase(row);
            reload();
          }}
          onSaveActive={(row, active) => saveShowcase(row, {active})}
          onSaveType={(row, type) =>
            saveShowcase(row, {
              settings: {
                ...(row?.showcase?.settings || {}),
                [SHOP_SHOWCASE_TYPE_SETTING_KEY]: type,
              },
            })
          }
          palette={palette}
          row={selectedRow}
        />
      )}
    </GeneralSettingsSection>
  );
};

export default ShopDomainShowcasesSection;
