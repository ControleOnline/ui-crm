/*
 * @agents This section controls the POS defaults for statuses, wallets, and notifications.
 * The visible options must come from the shared stores and save back through the config contract.
 */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Text, TextInput, View} from 'react-native';
import {Picker} from '@react-native-picker/picker';

import css from '@controleonline/ui-orders/src/react/css/orders';
import {useStore} from '@store';
import useToastMessage from '@controleonline/ui-crm/src/react/hooks/useToastMessage';

import {
  useGeneralSettingsPalette,
  useGeneralSettingsStyles,
} from '../GeneralSettings.styles';
import GeneralSettingsSection from '../GeneralSettingsSection';
import {
  GENERAL_SETTINGS_PICKER_MODE,
  normalizeNotificationTargets,
  useGeneralSettingsConfig,
} from '../GeneralSettings.shared';

const OperationsSection = () => {
  const {styles} = css();
  const localStyles = useGeneralSettingsStyles();
  const themePalette = useGeneralSettingsPalette();
  const {showError, showSuccess} = useToastMessage();
  const {currentCompany, effectiveCompanyConfigs, saveConfigs} =
    useGeneralSettingsConfig();

  const statusStore = useStore('status');
  const {items: statuses = []} = statusStore.getters;
  const statusActions = statusStore.actions;

  const walletStore = useStore('wallet');
  const {items: wallets = []} = walletStore.getters;
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

    statusActions.getItems({}).catch(() => {});
    walletActions
      .getItems({people: currentCompany.id})
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

  const saveOperationalConfigs = useCallback(
    async ({
      nextCashRegisterNotifications = cashRegisterNotifications,
      nextPosCashWallet = posCashWallet,
      nextPosCieloWallet = posCieloWallet,
      nextPosDefaultStatus = posDefaultStatus,
      nextPosInfinitePayWallet = posInfinitePayWallet,
      nextPosPaidStatus = posPaidStatus,
      nextPosWithdrawWallet = posWithdrawWallet,
    } = {}) => {
      if (!currentCompany?.id) {
        showError('Selecione uma empresa para salvar as configuracoes.');
        return false;
      }

      const success = await saveConfigs(
        {
          'pos-default-status': String(nextPosDefaultStatus || '').trim(),
          'pos-paid-status': String(nextPosPaidStatus || '').trim(),
          'pos-cash-wallet': String(nextPosCashWallet || '').trim(),
          'pos-withdrawl-wallet': String(nextPosWithdrawWallet || '').trim(),
          'pos-cielo-wallet': String(nextPosCieloWallet || '').trim(),
          'pos-infinite-pay-wallet': String(nextPosInfinitePayWallet || '').trim(),
          'cash-register-notifications': normalizeNotificationTargets(
            nextCashRegisterNotifications,
          ),
        },
        {
          suppressAlert: true,
        },
      );

      if (!success) {
        showError('Nao foi possivel salvar as configuracoes de Operacao e PDV.');
        return false;
      }

      showSuccess('Configuracoes de Operacao e PDV salvas com sucesso.');
      return true;
    },
    [
      cashRegisterNotifications,
      currentCompany?.id,
      posCashWallet,
      posCieloWallet,
      posDefaultStatus,
      posInfinitePayWallet,
      posPaidStatus,
      posWithdrawWallet,
      saveConfigs,
      showError,
      showSuccess,
    ],
  );

  return (
    <GeneralSettingsSection
      description="Status, carteiras e notificacoes usadas pelos fluxos de pedido, pagamento e fechamento de caixa."
      icon="point-of-sale"
      iconBackgroundColor={themePalette.cardIconBackground}
      iconColor={themePalette.cardIconColor}
      title="Operacao e PDV">
      <View style={localStyles.fieldBlock}>
        <Text style={localStyles.fieldLabel}>Status padrao do PDV</Text>
        <Picker
          selectedValue={posDefaultStatus}
          mode={GENERAL_SETTINGS_PICKER_MODE}
          onValueChange={value => {
            const nextValue = String(value || '');
            setPosDefaultStatus(nextValue);
            saveOperationalConfigs({nextPosDefaultStatus: nextValue});
          }}
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
          onValueChange={value => {
            const nextValue = String(value || '');
            setPosPaidStatus(nextValue);
            saveOperationalConfigs({nextPosPaidStatus: nextValue});
          }}
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
          onValueChange={value => {
            const nextValue = String(value || '');
            setPosCashWallet(nextValue);
            saveOperationalConfigs({nextPosCashWallet: nextValue});
          }}
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
          onValueChange={value => {
            const nextValue = String(value || '');
            setPosWithdrawWallet(nextValue);
            saveOperationalConfigs({nextPosWithdrawWallet: nextValue});
          }}
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
          onValueChange={value => {
            const nextValue = String(value || '');
            setPosCieloWallet(nextValue);
            saveOperationalConfigs({nextPosCieloWallet: nextValue});
          }}
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
          onValueChange={value => {
            const nextValue = String(value || '');
            setPosInfinitePayWallet(nextValue);
            saveOperationalConfigs({nextPosInfinitePayWallet: nextValue});
          }}
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
          onBlur={() => saveOperationalConfigs()}
          placeholder="Um numero por linha ou separado por virgula"
        />
      </View>

    </GeneralSettingsSection>
  );
};

export default OperationsSection;
