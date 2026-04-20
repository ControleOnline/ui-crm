import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import css from '@controleonline/ui-orders/src/react/css/orders';
import {
  filterDeviceConfigsByCompany,
  getCompanyPaymentDeviceOptions,
  isOrderChargeOnDeliveryEnabled,
  ORDER_CHARGE_ON_DELIVERY_ENABLED_CONFIG_KEY,
  ORDER_PAYMENT_DEVICES_CONFIG_KEY,
  normalizeDeviceIds,
} from '@controleonline/ui-common/src/react/utils/paymentDevices';
import {useStore} from '@store';

import localStyles from '../GeneralSettings.styles';
import GeneralSettingsSection from '../GeneralSettingsSection';
import {useGeneralSettingsConfig} from '../GeneralSettings.shared';

const OrderPaymentSection = () => {
  const {globalStyles} = css();
  const {
    currentCompany,
    effectiveCompanyConfigs,
    isSaving,
    saveConfigs,
  } = useGeneralSettingsConfig();

  const deviceConfigStore = useStore('device_config');
  const {
    items: companyDeviceConfigs = [],
    isLoading: isLoadingDeviceConfigs,
  } = deviceConfigStore.getters;
  const deviceConfigActions = deviceConfigStore.actions;

  const [orderPaymentEnabled, setOrderPaymentEnabled] = useState(false);
  const [orderPaymentDevices, setOrderPaymentDevices] = useState([]);
  const [chargeOnDeliveryEnabled, setChargeOnDeliveryEnabled] = useState(false);

  useEffect(() => {
    const nextOrderPaymentDevices = normalizeDeviceIds(
      effectiveCompanyConfigs[ORDER_PAYMENT_DEVICES_CONFIG_KEY],
    );
    setOrderPaymentDevices(nextOrderPaymentDevices);
    setOrderPaymentEnabled(nextOrderPaymentDevices.length > 0);
    setChargeOnDeliveryEnabled(
      isOrderChargeOnDeliveryEnabled(effectiveCompanyConfigs),
    );
  }, [effectiveCompanyConfigs]);

  useEffect(() => {
    if (!currentCompany?.id) {
      return;
    }

    deviceConfigActions
      .getItems({people: '/people/' + currentCompany.id})
      .catch(() => {});
  }, [currentCompany?.id, deviceConfigActions]);

  const scopedCompanyDeviceConfigs = useMemo(
    () =>
      filterDeviceConfigsByCompany(companyDeviceConfigs, currentCompany?.id),
    [companyDeviceConfigs, currentCompany?.id],
  );

  const paymentDevices = useMemo(
    () => getCompanyPaymentDeviceOptions(scopedCompanyDeviceConfigs),
    [scopedCompanyDeviceConfigs],
  );

  const selectedPaymentDeviceCount = orderPaymentDevices.length;

  const toggleOrderPaymentDevice = useCallback(deviceId => {
    if (!deviceId) {
      return;
    }

    setOrderPaymentDevices(current =>
      current.includes(deviceId)
        ? current.filter(item => item !== deviceId)
        : [...current, deviceId],
    );
  }, []);

  const saveOrderPaymentSettings = useCallback(async () => {
    const normalizedDevices = orderPaymentDevices
      .map(item => String(item || '').trim())
      .filter(Boolean);

    if (orderPaymentEnabled && normalizedDevices.length === 0) {
      Alert.alert(
        'Pagamento remoto',
        'Selecione pelo menos um device para ativar o pagamento remoto de pedidos.',
      );
      return;
    }

    await saveConfigs({
      [ORDER_PAYMENT_DEVICES_CONFIG_KEY]: orderPaymentEnabled
        ? normalizedDevices
        : [],
      [ORDER_CHARGE_ON_DELIVERY_ENABLED_CONFIG_KEY]: chargeOnDeliveryEnabled,
    });
  }, [
    chargeOnDeliveryEnabled,
    orderPaymentDevices,
    orderPaymentEnabled,
    saveConfigs,
  ]);

  return (
    <GeneralSettingsSection
      description="Define a ordem padrao dos terminais com gateway local que podem receber cobrancas remotas. Esse destino atende manager web, celulares e tambem PDVs Android quando o operador escolhe cobrar em outro terminal pela barra unica."
      icon="credit-card"
      iconBackgroundColor="#EDE9FE"
      iconColor="#7C3AED"
      title="Pagamento remoto de pedidos">
      <View style={localStyles.statusRow}>
        <Text style={localStyles.statusLabel}>Pagamento padrao</Text>
        <TouchableOpacity
          style={[
            localStyles.statusChip,
            orderPaymentEnabled
              ? localStyles.statusChipEnabled
              : localStyles.statusChipDisabled,
          ]}
          activeOpacity={0.85}
          onPress={() => setOrderPaymentEnabled(current => !current)}>
          <Icon
            name={orderPaymentEnabled ? 'check-circle' : 'block'}
            size={16}
            color={orderPaymentEnabled ? '#166534' : '#991B1B'}
          />
          <Text
            style={[
              localStyles.statusChipText,
              {color: orderPaymentEnabled ? '#166534' : '#991B1B'},
            ]}>
            {orderPaymentEnabled ? 'Ativado' : 'Desativado'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={localStyles.helperText}>
        {orderPaymentEnabled
          ? `${selectedPaymentDeviceCount} device(s) configurado(s) para fallback remoto.`
          : 'Quando desativado, a barra unica nao oferece destino remoto padrao para manager, celulares e PDVs Android.'}
      </Text>

      <View style={localStyles.settingRow}>
        <View style={localStyles.settingCopy}>
          <Text style={localStyles.statusLabel}>Cobrar na entrega</Text>
          <Text style={localStyles.settingDescription}>
            Libera na barra unica de pagamentos a opcao de registrar o pedido
            para cobrar manualmente na entrega.
          </Text>
        </View>
        <TouchableOpacity
          style={[
            localStyles.statusChip,
            chargeOnDeliveryEnabled
              ? localStyles.statusChipEnabled
              : localStyles.statusChipDisabled,
          ]}
          activeOpacity={0.85}
          onPress={() => setChargeOnDeliveryEnabled(current => !current)}>
          <Icon
            name={chargeOnDeliveryEnabled ? 'check-circle' : 'block'}
            size={16}
            color={chargeOnDeliveryEnabled ? '#166534' : '#991B1B'}
          />
          <Text
            style={[
              localStyles.statusChipText,
              {color: chargeOnDeliveryEnabled ? '#166534' : '#991B1B'},
            ]}>
            {chargeOnDeliveryEnabled ? 'Ativado' : 'Desativado'}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoadingDeviceConfigs ? (
        <ActivityIndicator size="small" style={localStyles.sectionLoader} />
      ) : paymentDevices.length === 0 ? (
        <View style={localStyles.emptyBox}>
          <Text style={localStyles.emptyTitle}>
            Nenhum device com pagamento remoto disponivel
          </Text>
          <Text style={localStyles.emptyText}>
            Configure ao menos um PDV da empresa com gateway Cielo ou
            Infinite Pay para receber o fallback remoto.
          </Text>
        </View>
      ) : (
        <View style={localStyles.printerList}>
          {paymentDevices.map(paymentDevice => {
            const deviceId = String(paymentDevice.deviceId || '').trim();
            const active =
              deviceId !== '' && orderPaymentDevices.includes(deviceId);

            return (
              <TouchableOpacity
                key={deviceId}
                style={[
                  localStyles.printerItem,
                  active && localStyles.printerItemActive,
                ]}
                activeOpacity={0.85}
                onPress={() => toggleOrderPaymentDevice(deviceId)}>
                <Icon
                  name={active ? 'check-circle' : 'radio-button-unchecked'}
                  size={20}
                  color={active ? '#7C3AED' : '#94A3B8'}
                />
                <View style={localStyles.printerCopy}>
                  <Text style={localStyles.printerName}>
                    {paymentDevice.alias}
                  </Text>
                  <Text style={localStyles.printerDevice}>
                    {paymentDevice.gatewayLabel} • {deviceId}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <TouchableOpacity
        style={[
          globalStyles.button,
          localStyles.primaryButton,
          (!currentCompany?.id || isSaving) && localStyles.primaryButtonDisabled,
        ]}
        disabled={!currentCompany?.id || isSaving}
        onPress={saveOrderPaymentSettings}>
        <Text style={localStyles.primaryButtonText}>
          Salvar regras de pagamento
        </Text>
      </TouchableOpacity>
    </GeneralSettingsSection>
  );
};

export default OrderPaymentSection;
