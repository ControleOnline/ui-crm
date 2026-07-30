import React, {useState} from 'react';
import {Text, TextInput, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import useShopDomainShowcasesStyles from './ShopDomainShowcasesSection.styles';

const t = (type, key) => global.t?.t?.('configs', type, key);

const normalizeDomain = value =>
  String(value || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/u, '')
    .toLowerCase();

const ShopDomainCreateForm = ({onCancel, onCreate, palette}) => {
  const styles = useShopDomainShowcasesStyles();
  const [domain, setDomain] = useState('');
  const normalizedDomain = normalizeDomain(domain);
  const disabled = normalizedDomain === '';

  return (
    <View style={styles.createPanel}>
      <Text style={styles.panelTitle}>{t('title', 'newShopDomain')}</Text>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={setDomain}
        placeholder={t('placeholder', 'shopDomain')}
        style={styles.domainInput}
        value={domain}
      />
      <View style={styles.createActions}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onCancel}
          style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>
            {t('button', 'cancel')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={disabled}
          onPress={() => onCreate(normalizedDomain)}
          style={[styles.primaryButton, disabled && styles.disabledButton]}>
          <Icon name="add" size={16} color={palette.buttonText} />
          <Text style={styles.primaryButtonText}>
            {t('button', 'createShopDomain')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ShopDomainCreateForm;
