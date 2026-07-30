import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {
  SHOP_SHOWCASE_TYPE_ECOMMERCE,
  SHOP_SHOWCASE_TYPE_MENU,
  SHOP_SHOWCASE_TYPE_SETTING_KEY,
  normalizeShopShowcaseType,
} from '@controleonline/ui-common/src/react/utils/shopConfig';

import useShopDomainShowcasesStyles from './ShopDomainShowcasesSection.styles';
import {
  normalizeEntityId,
  resolveShowcaseDomainId,
} from './shopDomainShowcasesUtils';

const t = (type, key) => global.t?.t?.('configs', type, key);

const SHOP_TYPE_OPTIONS = [
  {key: SHOP_SHOWCASE_TYPE_MENU, icon: 'restaurant-menu'},
  {key: SHOP_SHOWCASE_TYPE_ECOMMERCE, icon: 'shopping-bag'},
];

const ShopDomainPanel = ({
  catalogs = [],
  onEnsureShowcase,
  onAssociateCatalog,
  onSaveActive,
  onSaveType,
  palette,
  row,
}) => {
  const styles = useShopDomainShowcasesStyles();
  const showcase = row?.showcase || null;
  const currentType = normalizeShopShowcaseType(
    showcase?.settings?.[SHOP_SHOWCASE_TYPE_SETTING_KEY],
  );
  const active = Boolean(showcase?.active);
  const currentShowcaseId = normalizeEntityId(showcase);

  if (!row) {
    return null;
  }

  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <View>
          <Text style={styles.panelEyebrow}>
            {t('label', 'shopDomain')}
          </Text>
          <Text style={styles.panelTitle}>{row.domain.domain}</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={!showcase}
          onPress={() => onSaveActive(row, !active)}
          style={[
            styles.statusButton,
            active ? styles.statusButtonActive : styles.statusButtonInactive,
          ]}>
          <Icon
            name={active ? 'check-circle' : 'block'}
            size={15}
            color={active ? palette.badgeSelectedText : palette.badgeDisabledText}
          />
          <Text
            style={[
              styles.statusButtonText,
              {color: active ? palette.badgeSelectedText : palette.badgeDisabledText},
            ]}>
            {active ? t('status', 'active') : t('status', 'inactive')}
          </Text>
        </TouchableOpacity>
      </View>

      {showcase ? (
        <>
          <Text style={styles.showcaseName}>{showcase.name}</Text>
          <View style={styles.segmentedRow}>
            {SHOP_TYPE_OPTIONS.map(option => {
              const selected = option.key === currentType;

              return (
                <TouchableOpacity
                  key={`shop-type-${option.key}`}
                  activeOpacity={0.85}
                  onPress={() => onSaveType(row, option.key)}
                  style={[
                    styles.segmentButton,
                    selected && styles.segmentButtonActive,
                  ]}>
                  <Icon
                    name={option.icon}
                    size={15}
                    color={selected ? palette.buttonText : palette.listItemText}
                  />
                  <Text
                    style={[
                      styles.segmentText,
                      selected && {color: palette.buttonText},
                    ]}>
                    {t('option', `shopType.${option.key}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      ) : (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onEnsureShowcase(row)}
          style={styles.primaryButton}>
          <Icon name="storefront" size={16} color={palette.buttonText} />
          <Text style={styles.primaryButtonText}>
            {t('button', 'createShowcaseForDomain')}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.catalogList}>
        <Text style={styles.panelEyebrow}>
          {t('label', 'showcaseCatalogAssociation')}
        </Text>
        {catalogs.length === 0 ? (
          <View style={styles.catalogEmpty}>
            <Text style={styles.catalogMeta}>
              {t('message', 'showcaseCatalogsEmpty')}
            </Text>
          </View>
        ) : null}
        {catalogs.map(catalog => {
          const catalogId = normalizeEntityId(catalog);
          const selected = catalogId === currentShowcaseId;
          const linkedDomainId = resolveShowcaseDomainId(catalog);
          const linkedElsewhere =
            linkedDomainId && linkedDomainId !== String(row.domainId);

          return (
            <TouchableOpacity
              key={`shop-domain-catalog-${catalogId}`}
              activeOpacity={0.85}
              onPress={() => onAssociateCatalog(row, catalog)}
              style={[
                styles.catalogItem,
                selected && styles.catalogItemActive,
              ]}>
              <Icon
                name={selected ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={17}
                color={selected ? palette.buttonText : palette.listItemText}
              />
              <View style={styles.catalogCopy}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.catalogTitle,
                    selected && {color: palette.buttonText},
                  ]}>
                  {catalog.name}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.catalogMeta,
                    selected && {color: palette.buttonText},
                  ]}>
                  {catalog.integrationKey}
                  {linkedElsewhere
                    ? ` • ${t('message', 'showcaseLinkedToAnotherDomain')}`
                    : ''}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default ShopDomainPanel;
