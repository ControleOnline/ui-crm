import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {
  filterDeviceConfigsByCompany,
  normalizeDeviceIds,
} from '@controleonline/ui-common/src/react/utils/paymentDevices';
import {
  getDeviceTypeLabel,
  getPrinterOptionValue,
  getPrinterLabel,
  getPrinterOptions,
} from '@controleonline/ui-common/src/react/utils/printerDevices';
import {useStore} from '@store';

import localStyles from '../GeneralSettings.styles';
import GeneralSettingsSection from '../GeneralSettingsSection';
import {
  normalizeTextConfigValue,
  ORDER_PRINT_DEVICES_CONFIG_KEY,
  ORDER_PRINT_FOOTER_TEXT_CONFIG_KEY,
  useGeneralSettingsConfig,
} from '../GeneralSettings.shared';

const OrderPrintSection = () => {
  const {currentCompany, effectiveCompanyConfigs, saveConfigs} =
    useGeneralSettingsConfig();

  const printerStore = useStore('printer');
  const {
    items: printers = [],
    isLoading: isLoadingPrinters,
  } = printerStore.getters;
  const printerActions = printerStore.actions;

  const deviceConfigStore = useStore('device_config');
  const {
    items: companyDeviceConfigs = [],
    isLoading: isLoadingDeviceConfigs,
  } = deviceConfigStore.getters;
  const deviceConfigActions = deviceConfigStore.actions;

  const [orderPrintEnabled, setOrderPrintEnabled] = useState(false);
  const [orderPrintDevices, setOrderPrintDevices] = useState([]);
  const [orderPrintFooterText, setOrderPrintFooterText] = useState('');

  useEffect(() => {
    const nextOrderPrintDevices = normalizeDeviceIds(
      effectiveCompanyConfigs[ORDER_PRINT_DEVICES_CONFIG_KEY],
    );
    setOrderPrintDevices(nextOrderPrintDevices);
    setOrderPrintEnabled(nextOrderPrintDevices.length > 0);
    setOrderPrintFooterText(
      normalizeTextConfigValue(
        effectiveCompanyConfigs[ORDER_PRINT_FOOTER_TEXT_CONFIG_KEY],
      ),
    );
  }, [effectiveCompanyConfigs]);

  useEffect(() => {
    if (!currentCompany?.id) {
      return;
    }

    printerActions.getPrinters({people: currentCompany.id}).catch(() => {});
    deviceConfigActions
      .getItems({people: '/people/' + currentCompany.id})
      .catch(() => {});
  }, [currentCompany?.id, deviceConfigActions, printerActions]);

  const scopedCompanyDeviceConfigs = useMemo(
    () =>
      filterDeviceConfigsByCompany(companyDeviceConfigs, currentCompany?.id),
    [companyDeviceConfigs, currentCompany?.id],
  );

  const printerOptions = useMemo(
    () =>
      getPrinterOptions({
        printers,
        deviceConfigs: scopedCompanyDeviceConfigs,
        companyId: currentCompany?.id,
      }),
    [currentCompany?.id, printers, scopedCompanyDeviceConfigs],
  );

  const selectedPrinterCount = orderPrintDevices.length;

  const saveOrderPrintDevices = useCallback(
    async ({
      nextEnabled = orderPrintEnabled,
      nextDevices = orderPrintDevices,
      nextFooterText = orderPrintFooterText,
    } = {}) => {
    const normalizedDevices = Array.from(
      new Set(
          nextDevices
          .map(item => String(item || '').trim())
          .filter(Boolean),
      ),
    );

      if (nextEnabled && normalizedDevices.length === 0) {
      Alert.alert(
        'Impressora padrao',
        'Selecione pelo menos um device para ativar a impressao remota de pedidos.',
      );
        return false;
    }

    await saveConfigs({
        [ORDER_PRINT_DEVICES_CONFIG_KEY]: nextEnabled ? normalizedDevices : [],
        [ORDER_PRINT_FOOTER_TEXT_CONFIG_KEY]: nextFooterText,
    });
      return true;
    },
    [orderPrintDevices, orderPrintEnabled, orderPrintFooterText, saveConfigs],
  );

  const toggleOrderPrintEnabled = useCallback(() => {
    const nextEnabled = !orderPrintEnabled;

    if (!nextEnabled) {
      setOrderPrintEnabled(false);
      setOrderPrintDevices([]);
      saveOrderPrintDevices({
        nextDevices: [],
        nextEnabled: false,
      });
      return;
    }

    if (orderPrintDevices.length === 0) {
      Alert.alert(
        'Impressora padrao',
        'Selecione pelo menos um device para ativar a impressao remota de pedidos.',
      );
      return;
    }

    setOrderPrintEnabled(true);
    saveOrderPrintDevices({
      nextEnabled: true,
    });
  }, [orderPrintDevices.length, orderPrintEnabled, saveOrderPrintDevices]);

  const toggleOrderPrintDevice = useCallback(
    deviceId => {
      if (!deviceId) {
        return;
      }

      const nextDevices = orderPrintDevices.includes(deviceId)
        ? orderPrintDevices.filter(item => item !== deviceId)
        : [...orderPrintDevices, deviceId];
      const nextEnabled = nextDevices.length > 0;

      setOrderPrintDevices(nextDevices);
      setOrderPrintEnabled(nextEnabled);
      saveOrderPrintDevices({
        nextDevices,
        nextEnabled,
      });
    },
    [orderPrintDevices, saveOrderPrintDevices],
  );

  return (
    <GeneralSettingsSection
      description="Define quais devices da empresa recebem a cópia completa do pedido para conferência e qual texto livre sai no rodapé usando as configs `order-print-devices` e `order-print-footer-text`."
      icon="print"
      iconBackgroundColor="#DBEAFE"
      iconColor="#2563EB"
      title="Impressão de conferência">
      <View style={localStyles.statusRow}>
        <Text style={localStyles.statusLabel}>Impressão padrão</Text>
        <TouchableOpacity
          style={[
            localStyles.statusChip,
            orderPrintEnabled
              ? localStyles.statusChipEnabled
              : localStyles.statusChipDisabled,
          ]}
          activeOpacity={0.85}
          onPress={toggleOrderPrintEnabled}>
          <Icon
            name={orderPrintEnabled ? 'check-circle' : 'block'}
            size={16}
            color={orderPrintEnabled ? '#166534' : '#991B1B'}
          />
          <Text
            style={[
              localStyles.statusChipText,
              {color: orderPrintEnabled ? '#166534' : '#991B1B'},
            ]}>
            {orderPrintEnabled ? 'Ativada' : 'Desativada'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={localStyles.helperText}>
        {orderPrintEnabled
          ? `${selectedPrinterCount} device(s) selecionado(s).`
          : 'Quando desativada, o backend nao usa impressoras padrao da empresa.'}
      </Text>

      {isLoadingPrinters || isLoadingDeviceConfigs ? (
        <ActivityIndicator size="small" style={localStyles.sectionLoader} />
      ) : printerOptions.length === 0 ? (
        <View style={localStyles.emptyBox}>
          <Text style={localStyles.emptyTitle}>
            Nenhum device com impressão disponível
          </Text>
          <Text style={localStyles.emptyText}>
            Cadastre e configure um equipamento com suporte a impressão, como
            uma Cielo, para a empresa ativa.
          </Text>
        </View>
      ) : (
        <View style={localStyles.printerList}>
          {printerOptions.map(printer => {
            const deviceId = String(printer?.device || '').trim();
            const printerValue = getPrinterOptionValue(printer);
            const active =
              printerValue !== '' && orderPrintDevices.includes(printerValue);

            return (
              <TouchableOpacity
                key={printerValue || deviceId}
                style={[
                  localStyles.printerItem,
                  active && localStyles.printerItemActive,
                ]}
                activeOpacity={0.85}
                onPress={() => toggleOrderPrintDevice(printerValue)}>
                <Icon
                  name={active ? 'check-circle' : 'radio-button-unchecked'}
                  size={20}
                  color={active ? '#2563EB' : '#94A3B8'}
                />
                <View style={localStyles.printerCopy}>
                  <Text style={localStyles.printerName}>
                    {getPrinterLabel(printer)}
                  </Text>
                  <Text style={localStyles.printerDevice}>
                    {`${getDeviceTypeLabel(printer?.type)} • ${deviceId}`}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={localStyles.fieldBlock}>
        <Text style={localStyles.fieldLabel}>Texto livre do rodape</Text>
        <TextInput
          style={[localStyles.input, localStyles.multilineInput]}
          value={orderPrintFooterText}
          multiline
          numberOfLines={4}
          onChangeText={setOrderPrintFooterText}
          onBlur={() => saveOrderPrintDevices()}
          placeholder="Mensagem exibida no rodapé da impressão"
        />
        <Text style={localStyles.helperText}>
          Esse conteúdo é salvo na config da empresa e sai no rodapé de todas as
          impressões de pedido.
        </Text>
      </View>
    </GeneralSettingsSection>
  );
};

export default OrderPrintSection;
