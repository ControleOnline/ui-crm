import React, {useEffect, useState} from 'react';
import {Text, TextInput, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {
  SHOP_LOYALTY_COUPONS_ENABLED_CONFIG_KEY,
  SHOP_LOYALTY_GIFT_PRODUCT_ID_CONFIG_KEY,
  SHOP_LOYALTY_PRODUCT_IDS_CONFIG_KEY,
  SHOP_LOYALTY_REQUIRED_SALES_CONFIG_KEY,
  normalizeBooleanConfig,
  normalizeShopEntityId,
  normalizeShopEntityIds,
  normalizeShopLoyaltyRequiredSales,
} from '@controleonline/ui-common/src/react/utils/shopConfig';

import {
  useGeneralSettingsPalette,
  useGeneralSettingsStyles,
} from '../GeneralSettings.styles';
import GeneralSettingsSection from '../GeneralSettingsSection';
import {useGeneralSettingsConfig} from '../GeneralSettings.shared';

const t = (type, key) => global.t?.t?.('configs', type, key);

const LoyaltySection = () => {
  const palette = useGeneralSettingsPalette();
  const styles = useGeneralSettingsStyles();
  const {effectiveCompanyConfigs, saveConfig} = useGeneralSettingsConfig();
  const [enabled, setEnabled] = useState(false);
  const [requiredSales, setRequiredSales] = useState('');
  const [productIds, setProductIds] = useState([]);
  const [giftProductId, setGiftProductId] = useState('');

  useEffect(() => {
    setEnabled(
      normalizeBooleanConfig(
        effectiveCompanyConfigs[SHOP_LOYALTY_COUPONS_ENABLED_CONFIG_KEY],
      ),
    );
    setRequiredSales(
      String(
        normalizeShopLoyaltyRequiredSales(
          effectiveCompanyConfigs[SHOP_LOYALTY_REQUIRED_SALES_CONFIG_KEY],
        ),
      ),
    );
    setProductIds(
      normalizeShopEntityIds(
        effectiveCompanyConfigs[SHOP_LOYALTY_PRODUCT_IDS_CONFIG_KEY],
      ),
    );
    setGiftProductId(
      normalizeShopEntityId(
        effectiveCompanyConfigs[SHOP_LOYALTY_GIFT_PRODUCT_ID_CONFIG_KEY],
      ),
    );
  }, [effectiveCompanyConfigs]);

  const toggleEnabled = () => {
    const nextValue = !enabled;
    setEnabled(nextValue);
    saveConfig(
      SHOP_LOYALTY_COUPONS_ENABLED_CONFIG_KEY,
      nextValue ? '1' : '0',
    );
  };

  const saveRequiredSales = value => {
    const normalizedValue = String(normalizeShopLoyaltyRequiredSales(value));
    setRequiredSales(normalizedValue);
    saveConfig(SHOP_LOYALTY_REQUIRED_SALES_CONFIG_KEY, normalizedValue);
  };

  return (
    <GeneralSettingsSection
      description={t('description', 'loyalty')}
      icon="loyalty"
      iconBackgroundColor={palette.cardIconBackground}
      iconColor={palette.cardIconColor}
      title={t('title', 'loyalty')}>
      <View style={styles.settingRow}>
        <View style={styles.settingCopy}>
          <Text style={styles.statusLabel}>{t('label', 'loyaltyEnabled')}</Text>
          <Text style={styles.settingDescription}>
            {t('description', 'loyaltyEnabled')}
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={toggleEnabled}
          style={[
            styles.statusChip,
            enabled ? styles.statusChipEnabled : styles.statusChipDisabled,
          ]}>
          <Icon
            name={enabled ? 'check-circle' : 'block'}
            size={16}
            color={enabled ? palette.badgeSelectedText : palette.badgeDisabledText}
          />
          <Text
            style={[
              styles.statusChipText,
              {color: enabled ? palette.badgeSelectedText : palette.badgeDisabledText},
            ]}>
            {enabled ? t('status', 'active') : t('status', 'inactive')}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.statusLabel}>{t('label', 'loyaltyRequiredSales')}</Text>
      <TextInput
        keyboardType="numeric"
        onBlur={() => saveRequiredSales(requiredSales)}
        onChangeText={setRequiredSales}
        style={styles.selectionSearchInput}
        value={requiredSales}
      />

      <View style={[styles.emptyBox, {marginTop: 14}]}>
        <Text style={styles.emptyTitle}>{t('label', 'loyaltyProducts')}</Text>
        <Text style={styles.emptyText}>
          {t('message', 'loyaltyProductsSummary')} {productIds.length}
        </Text>
        <Text style={[styles.emptyText, {marginTop: 6}]}>
          {t('message', 'loyaltyGiftProduct')} {giftProductId || '-'}
        </Text>
      </View>
    </GeneralSettingsSection>
  );
};

export default LoyaltySection;
