import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';

import css from '@controleonline/ui-orders/src/react/css/orders';
import {useStore} from '@store';

import localStyles from '../GeneralSettings.styles';
import GeneralSettingsSection from '../GeneralSettingsSection';
import {
  GENERAL_SETTINGS_PICKER_MODE,
  normalizeNotificationTargets,
  useGeneralSettingsConfig,
} from '../GeneralSettings.shared';

const OperationsSection = () => {
  const {styles, globalStyles} = css();
  const {
    currentCompany,
    effectiveCompanyConfigs,
    isSaving,
    saveConfigs,
  } = useGeneralSettingsConfig();

  const statusStore = useStore('status');
  const {
    items: statuses = [],
    isLoading: isLoadingStatuses,
  } = statusStore.getters;
  const statusActions = statusStore.actions;

  const walletStore = useStore('wallet');
  const {
    items: wallets = [],
    isLoading: isLoadingWallets,
  } = walletStore.getters;
  const walletActions = walletStore.actions;

  const [posDefaultStatus, setPosDefaultStatus] = useState('');
  const [posPaidStatus, setPosPaidStatus] = useState('');
  const [posCashWallet, setPosCashWallet] = useState('');
  const [posWithdrawWallet, setPosWithdrawWallet] = useState('');
  const [posCieloWallet, setPosCieloWallet] = useState('');
  const [posInfinitePayWallet, setPosInfinitePayWallet] = useState('');
  const [cashRegisterNotifications, setCashRegisterNotifications] = useState('');

  useEffect(() => {
    setPosDefaultStatus(String(effectiveCompanyConfigs['pos-default-status'] || ''));
    setPosPaidStatus(String(effectiveCompanyConfigs['pos-paid-status'] || ''));
    setPosCashWallet(String(effectiveCompanyConfigs['pos-cash-wallet'] || ''));
    setPosWithdrawWallet(
      String(
        effectiveCompanyConfigs['pos-withdrawl-wallet'] ||
          effectiveCompanyConfigs['pos-withdrawal-wallet'] ||
          '',
      ),
    );
    setPosCieloWallet(String(effectiveCompanyConfigs['pos-cielo-wallet'] || ''));
    setPosInfinitePayWallet(
      String(effectiveCompanyConfigs['pos-infinite-pay-wallet'] || ''),
    );
    setCashRegisterNotifications(
      normalizeNotificationTargets(
        effectiveCompanyConfigs['cash-register-notifications'],
      ).join('\n'),
    );
  }, [effectiveCompanyConfigs]);

  useEffect(() => {
    if (!currentCompany?.id) {
      return;
    }

    statusActions.getItems({itemsPerPage: 200}).catch(() => {});
    walletActions
      .getItems({people: currentCompany.id, itemsPerPage: 200})
      .catch(() => {});
  }, [currentCompany?.id, statusActions, walletActions]);

  const normalizedStatusOptions = useMemo(
    () => (Array.isArray(statuses) ? statuses : []),
    [statuses],
  );
  const normalizedWalletOptions = useMemo(
    () => (Array.isArray(wallets) ? wallets : []),
    [wallets],
  );

  const saveOperationalConfigs = useCallback(async () => {
    await saveConfigs({
      'pos-default-status': String(posDefaultStatus || '').trim(),
      'pos-paid-status': String(posPaidStatus || '').trim(),
      'pos-cash-wallet': String(posCashWallet || '').trim(),
      'pos-withdrawl-wallet': String(posWithdrawWallet || '').trim(),
      'pos-cielo-wallet': String(posCieloWallet || '').trim(),
      'pos-infinite-pay-wallet': String(posInfinitePayWallet || '').trim(),
      'cash-register-notifications': normalizeNotificationTargets(
        cashRegisterNotifications,
      ),
    });
  }, [
    cashRegisterNotifications,
    posCashWallet,
    posCieloWallet,
    posDefaultStatus,
    posInfinitePayWallet,
    posPaidStatus,
    posWithdrawWallet,
    saveConfigs,
  ]);

  return (
    <GeneralSettingsSection
      description="Status, carteiras e notificacoes usadas pelos fluxos de pedido, pagamento e fechamento de caixa."
      icon="point-of-sale"
      iconBackgroundColor="#DCFCE7"
      iconColor="#166534"
      title="Operacao e PDV">
      <View style={localStyles.fieldBlock}>
        <Text style={localStyles.fieldLabel}>Status padrao do PDV</Text>
        <Picker
          selectedValue={posDefaultStatus}
          mode={GENERAL_SETTINGS_PICKER_MODE}
          onValueChange={value => setPosDefaultStatus(String(value || ''))}
          style={styles.Settings.picker}>
          <Picker.Item label="Selecione um status" value="" />
          {normalizedStatusOptions.map(statusOption => (
            <Picker.Item
              key={statusOption.id}
              label={`${statusOption.context || 'geral'} • ${statusOption.status}`}
              value={String(statusOption.id)}
            />
          ))}
        </Picker>
      </View>

      <View style={localStyles.fieldBlock}>
        <Text style={localStyles.fieldLabel}>Status pago</Text>
        <Picker
          selectedValue={posPaidStatus}
          mode={GENERAL_SETTINGS_PICKER_MODE}
          onValueChange={value => setPosPaidStatus(String(value || ''))}
          style={styles.Settings.picker}>
          <Picker.Item label="Selecione um status" value="" />
          {normalizedStatusOptions.map(statusOption => (
            <Picker.Item
              key={`paid-${statusOption.id}`}
              label={`${statusOption.context || 'geral'} • ${statusOption.status}`}
              value={String(statusOption.id)}
            />
          ))}
        </Picker>
      </View>

      <View style={localStyles.fieldBlock}>
        <Text style={localStyles.fieldLabel}>Carteira de dinheiro</Text>
        <Picker
          selectedValue={posCashWallet}
          mode={GENERAL_SETTINGS_PICKER_MODE}
          onValueChange={value => setPosCashWallet(String(value || ''))}
          style={styles.Settings.picker}>
          <Picker.Item label="Selecione uma carteira" value="" />
          {normalizedWalletOptions.map(walletOption => (
            <Picker.Item
              key={`cash-${walletOption.id}`}
              label={walletOption.wallet}
              value={String(walletOption.id)}
            />
          ))}
        </Picker>
      </View>

      <View style={localStyles.fieldBlock}>
        <Text style={localStyles.fieldLabel}>Carteira de sangria</Text>
        <Picker
          selectedValue={posWithdrawWallet}
          mode={GENERAL_SETTINGS_PICKER_MODE}
          onValueChange={value => setPosWithdrawWallet(String(value || ''))}
          style={styles.Settings.picker}>
          <Picker.Item label="Selecione uma carteira" value="" />
          {normalizedWalletOptions.map(walletOption => (
            <Picker.Item
              key={`withdraw-${walletOption.id}`}
              label={walletOption.wallet}
              value={String(walletOption.id)}
            />
          ))}
        </Picker>
      </View>

      <View style={localStyles.fieldBlock}>
        <Text style={localStyles.fieldLabel}>Carteira Cielo</Text>
        <Picker
          selectedValue={posCieloWallet}
          mode={GENERAL_SETTINGS_PICKER_MODE}
          onValueChange={value => setPosCieloWallet(String(value || ''))}
          style={styles.Settings.picker}>
          <Picker.Item label="Selecione uma carteira" value="" />
          {normalizedWalletOptions.map(walletOption => (
            <Picker.Item
              key={`cielo-${walletOption.id}`}
              label={walletOption.wallet}
              value={String(walletOption.id)}
            />
          ))}
        </Picker>
      </View>

      <View style={localStyles.fieldBlock}>
        <Text style={localStyles.fieldLabel}>Carteira Infinite Pay</Text>
        <Picker
          selectedValue={posInfinitePayWallet}
          mode={GENERAL_SETTINGS_PICKER_MODE}
          onValueChange={value => setPosInfinitePayWallet(String(value || ''))}
          style={styles.Settings.picker}>
          <Picker.Item label="Selecione uma carteira" value="" />
          {normalizedWalletOptions.map(walletOption => (
            <Picker.Item
              key={`infinite-${walletOption.id}`}
              label={walletOption.wallet}
              value={String(walletOption.id)}
            />
          ))}
        </Picker>
      </View>

      <View style={localStyles.fieldBlock}>
        <Text style={localStyles.fieldLabel}>
          Notificacoes de fechamento de caixa
        </Text>
        <TextInput
          style={[localStyles.input, localStyles.multilineInput]}
          value={cashRegisterNotifications}
          multiline
          numberOfLines={4}
          onChangeText={setCashRegisterNotifications}
          placeholder="Um numero por linha ou separado por virgula"
        />
      </View>

      {(isLoadingStatuses || isLoadingWallets) && (
        <ActivityIndicator size="small" style={localStyles.sectionLoader} />
      )}

      <TouchableOpacity
        style={[
          globalStyles.button,
          localStyles.primaryButton,
          (!currentCompany?.id || isSaving) && localStyles.primaryButtonDisabled,
        ]}
        disabled={!currentCompany?.id || isSaving}
        onPress={saveOperationalConfigs}>
        <Text style={localStyles.primaryButtonText}>
          Salvar configuracoes do PDV
        </Text>
      </TouchableOpacity>
    </GeneralSettingsSection>
  );
};

export default OperationsSection;
