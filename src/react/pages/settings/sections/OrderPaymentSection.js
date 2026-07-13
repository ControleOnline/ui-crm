/*
 * @agents This section controls remote payment routing and terminal ordering.
 * Keep the visible list and save behavior tied to the shared device config store.
 */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {
  filterDeviceConfigsByCompany,
  getCompanyPaymentDeviceOptions,
  isOrderChargeOnDeliveryEnabled,
  isOrderPaymentDeviceChangeAllowed,
  ORDER_CHARGE_ON_DELIVERY_ENABLED_CONFIG_KEY,
  ORDER_PAYMENT_DEVICE_CHANGE_ALLOWED_CONFIG_KEY,
  ORDER_PAYMENT_DEVICES_CONFIG_KEY,
  normalizeDeviceIds,
} from '@controleonline/ui-common/src/react/utils/paymentDevices';
import {useStore} from '@store';

import localStyles from '../GeneralSettings.styles';
import GeneralSettingsSection from '../GeneralSettingsSection';
import {useGeneralSettingsConfig} from '../GeneralSettings.shared';

const OrderPaymentSection = () => {
  const {currentCompany, effectiveCompanyConfigs, saveConfigs} =
    useGeneralSettingsConfig();

  const deviceConfigStore = useStore('device_config');
  const {
    items: companyDeviceConfigs = [],
    isLoading: isLoadingDeviceConfigs,
  } = deviceConfigStore.getters;
  const deviceConfigActions = deviceConfigStore.actions;

  const [orderPaymentEnabled, setOrderPaymentEnabled] = useState(false);
  const [orderPaymentDevices, setOrderPaymentDevices] = useState([]);
  const [chargeOnDeliveryEnabled, setChargeOnDeliveryEnabled] = useState(false);
  const [allowPaymentDeviceChange, setAllowPaymentDeviceChange] =
    useState(false);

  useEffect(() => {
    const nextOrderPaymentDevices = normalizeDeviceIds(
      effectiveCompanyConfigs[ORDER_PAYMENT_DEVICES_CONFIG_KEY],
    );
    setOrderPaymentDevices(nextOrderPaymentDevices);
    setOrderPaymentEnabled(nextOrderPaymentDevices.length > 0);
    setChargeOnDeliveryEnabled(
      isOrderChargeOnDeliveryEnabled(effectiveCompanyConfigs),
    );
    setAllowPaymentDeviceChange(
      isOrderPaymentDeviceChangeAllowed(effectiveCompanyConfigs),
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

  const saveOrderPaymentSettings = useCallback(
    async ({
      nextAllowPaymentDeviceChange = allowPaymentDeviceChange,
      nextChargeOnDeliveryEnabled = chargeOnDeliveryEnabled,
      nextOrderPaymentDevices = orderPaymentDevices,
      nextOrderPaymentEnabled = orderPaymentEnabled,
    } = {}) => {
      const normalizedDevices = nextOrderPaymentDevices
        .map(item => String(item || '').trim())
        .filter(Boolean);

      if (nextOrderPaymentEnabled && normalizedDevices.length === 0) {
        Alert.alert(
          'Pagamento remoto',
          'Selecione pelo menos um device para ativar o pagamento remoto de pedidos.',
        );
        return false;
      }

      await saveConfigs({
        [ORDER_PAYMENT_DEVICES_CONFIG_KEY]: nextOrderPaymentEnabled
          ? normalizedDevices
          : [],
        [ORDER_PAYMENT_DEVICE_CHANGE_ALLOWED_CONFIG_KEY]:
          nextAllowPaymentDeviceChange,
        [ORDER_CHARGE_ON_DELIVERY_ENABLED_CONFIG_KEY]:
          nextChargeOnDeliveryEnabled,
      });

      return true;
    },
    [
      allowPaymentDeviceChange,
      chargeOnDeliveryEnabled,
      orderPaymentDevices,
      orderPaymentEnabled,
      saveConfigs,
    ],
  );

  const toggleOrderPaymentEnabled = useCallback(() => {
    const nextEnabled = !orderPaymentEnabled;

    if (!nextEnabled) {
      setOrderPaymentEnabled(false);
      setOrderPaymentDevices([]);
      saveOrderPaymentSettings({
        nextOrderPaymentDevices: [],
        nextOrderPaymentEnabled: false,
      });
      return;
    }

    if (orderPaymentDevices.length === 0) {
      Alert.alert(
        'Pagamento remoto',
        'Selecione pelo menos um device para ativar o pagamento remoto de pedidos.',
      );
      return;
    }

    setOrderPaymentEnabled(true);
    saveOrderPaymentSettings({
      nextOrderPaymentEnabled: true,
    });
  }, [orderPaymentDevices.length, orderPaymentEnabled, saveOrderPaymentSettings]);

  const toggleOrderPaymentDevice = useCallback(
    deviceId => {
      if (!deviceId) {
        return;
      }

      const nextOrderPaymentDevices = orderPaymentDevices.includes(deviceId)
        ? orderPaymentDevices.filter(item => item !== deviceId)
        : [...orderPaymentDevices, deviceId];
      const nextOrderPaymentEnabled = nextOrderPaymentDevices.length > 0;

      setOrderPaymentDevices(nextOrderPaymentDevices);
      setOrderPaymentEnabled(nextOrderPaymentEnabled);
      saveOrderPaymentSettings({
        nextOrderPaymentDevices,
        nextOrderPaymentEnabled,
      });
    },
    [orderPaymentDevices, saveOrderPaymentSettings],
  );

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
          onPress={toggleOrderPaymentEnabled}>
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
          ? `${selectedPaymentDeviceCount} device(s) configurado(s). O primeiro vira o equipamento padrao do pagamento remoto.`
          : 'Quando desativado, a barra unica nao oferece destino remoto padrao para manager, celulares e PDVs Android.'}
      </Text>

      <View style={localStyles.settingRow}>
        <View style={localStyles.settingCopy}>
          <Text style={localStyles.statusLabel}>
            Pode trocar de equipamento no pagamento?
          </Text>
          <Text style={localStyles.settingDescription}>
            Quando desativado, o checkout remoto usa sempre o primeiro device
            configurado acima. Quando ativado, o operador pode trocar o
            equipamento na hora do pagamento.
          </Text>
        </View>
        <TouchableOpacity
          style={[
            localStyles.statusChip,
            allowPaymentDeviceChange
              ? localStyles.statusChipEnabled
              : localStyles.statusChipDisabled,
          ]}
          activeOpacity={0.85}
          onPress={() => {
            const nextValue = !allowPaymentDeviceChange;
            setAllowPaymentDeviceChange(nextValue);
            saveOrderPaymentSettings({
              nextAllowPaymentDeviceChange: nextValue,
            });
          }}>
          <Icon
            name={allowPaymentDeviceChange ? 'check-circle' : 'block'}
            size={16}
            color={allowPaymentDeviceChange ? '#166534' : '#991B1B'}
          />
          <Text
            style={[
              localStyles.statusChipText,
              {color: allowPaymentDeviceChange ? '#166534' : '#991B1B'},
            ]}>
            {allowPaymentDeviceChange ? 'Ativado' : 'Desativado'}
          </Text>
        </TouchableOpacity>
      </View>

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
          onPress={() => {
            const nextValue = !chargeOnDeliveryEnabled;
            setChargeOnDeliveryEnabled(nextValue);
            saveOrderPaymentSettings({
              nextChargeOnDeliveryEnabled: nextValue,
            });
          }}>
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

    </GeneralSettingsSection>
  );
};

export default OrderPaymentSection;
