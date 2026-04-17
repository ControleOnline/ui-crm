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

import css from '@controleonline/ui-orders/src/react/css/orders';
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
  const {globalStyles} = css();
  const {
    currentCompany,
    effectiveCompanyConfigs,
    isSaving,
    saveConfigs,
  } = useGeneralSettingsConfig();

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

  const toggleOrderPrintDevice = useCallback(deviceId => {
    if (!deviceId) {
      return;
    }

    setOrderPrintDevices(current =>
      current.includes(deviceId)
        ? current.filter(item => item !== deviceId)
        : [...current, deviceId],
    );
  }, []);

  const saveOrderPrintDevices = useCallback(async () => {
    const normalizedDevices = Array.from(
      new Set(
        orderPrintDevices
          .map(item => String(item || '').trim())
          .filter(Boolean),
      ),
    );

    if (orderPrintEnabled && normalizedDevices.length === 0) {
      Alert.alert(
        'Impressora padrao',
        'Selecione pelo menos um device para ativar a impressao remota de pedidos.',
      );
      return;
    }

    await saveConfigs({
      [ORDER_PRINT_DEVICES_CONFIG_KEY]: orderPrintEnabled ? normalizedDevices : [],
      [ORDER_PRINT_FOOTER_TEXT_CONFIG_KEY]: orderPrintFooterText,
    });
  }, [
    orderPrintDevices,
    orderPrintEnabled,
    orderPrintFooterText,
    saveConfigs,
  ]);

  return (
    <GeneralSettingsSection
      description="Define quais devices da empresa recebem a copia completa do pedido para conferencia e qual texto livre sai no rodape usando as configs `order-print-devices` e `order-print-footer-text`."
      icon="print"
      iconBackgroundColor="#DBEAFE"
      iconColor="#2563EB"
      title="Impressao de conferencia">
      <View style={localStyles.statusRow}>
        <Text style={localStyles.statusLabel}>Impressao padrao</Text>
        <TouchableOpacity
          style={[
            localStyles.statusChip,
            orderPrintEnabled
              ? localStyles.statusChipEnabled
              : localStyles.statusChipDisabled,
          ]}
          activeOpacity={0.85}
          onPress={() => setOrderPrintEnabled(current => !current)}>
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
            Nenhum device com impressao disponivel
          </Text>
          <Text style={localStyles.emptyText}>
            Cadastre e configure um equipamento com suporte a impressao, como
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
          placeholder="Mensagem exibida no rodape da impressao"
        />
        <Text style={localStyles.helperText}>
          Esse conteudo e salvo na config da empresa e sai no rodape de todas as
          impressoes de pedido.
        </Text>
      </View>

      <TouchableOpacity
        style={[
          globalStyles.button,
          localStyles.primaryButton,
          (!currentCompany?.id || isSaving) && localStyles.primaryButtonDisabled,
        ]}
        disabled={!currentCompany?.id || isSaving}
        onPress={saveOrderPrintDevices}>
        <Text style={localStyles.primaryButtonText}>
          Salvar configuracoes de impressao
        </Text>
      </TouchableOpacity>
    </GeneralSettingsSection>
  );
};

export default OrderPrintSection;
