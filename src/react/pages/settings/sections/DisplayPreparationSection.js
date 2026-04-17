import React, {useEffect, useMemo} from 'react';
import {ActivityIndicator, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {
  filterDeviceConfigsByCompany,
} from '@controleonline/ui-common/src/react/utils/paymentDevices';
import {useStore} from '@store';

import localStyles from '../GeneralSettings.styles';
import GeneralSettingsSection from '../GeneralSettingsSection';
import {
  DISPLAY_DEVICE_LINK_CONFIG_KEY,
  DISPLAY_DEVICE_PRINTER_CONFIG_KEY,
  DISPLAY_DEVICE_TYPE,
  parseDeviceConfigs,
  useGeneralSettingsConfig,
} from '../GeneralSettings.shared';

const DisplayPreparationSection = () => {
  const {currentCompany} = useGeneralSettingsConfig();

  const deviceConfigStore = useStore('device_config');
  const {
    items: companyDeviceConfigs = [],
    isLoading: isLoadingDeviceConfigs,
  } = deviceConfigStore.getters;
  const deviceConfigActions = deviceConfigStore.actions;

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

  const displayPreparationDevices = useMemo(
    () =>
      scopedCompanyDeviceConfigs.filter(deviceConfig => {
        const deviceType = String(
          deviceConfig?.type || deviceConfig?.device?.type || '',
        )
          .trim()
          .toUpperCase();
        if (deviceType !== DISPLAY_DEVICE_TYPE) {
          return false;
        }

        const configs = parseDeviceConfigs(deviceConfig?.configs);
        const linkedDisplayId = String(
          configs?.[DISPLAY_DEVICE_LINK_CONFIG_KEY] || '',
        )
          .replace(/\D+/g, '')
          .trim();
        const printerId = String(
          configs?.[DISPLAY_DEVICE_PRINTER_CONFIG_KEY] || '',
        ).trim();

        return linkedDisplayId !== '' && printerId !== '';
      }),
    [scopedCompanyDeviceConfigs],
  );

  const configuredDisplayPreparationCount = displayPreparationDevices.length;

  return (
    <GeneralSettingsSection
      description="A copia de preparo e gerada automaticamente por fila nos devices do tipo DISPLAY. Cada DISPLAY precisa estar vinculado a um display e a uma impressora no detalhe do device para que o backend envie a copia correta."
      icon="receipt-long"
      iconBackgroundColor="#FEF3C7"
      iconColor="#B45309"
      title="Impressao de preparo por fila">
      <Text style={localStyles.helperText}>
        {configuredDisplayPreparationCount > 0
          ? `${configuredDisplayPreparationCount} device(s) DISPLAY prontos para imprimir filas automaticamente.`
          : 'Nenhum DISPLAY com display vinculado e impressora configurada ainda.'}
      </Text>

      {isLoadingDeviceConfigs ? (
        <ActivityIndicator size="small" style={localStyles.sectionLoader} />
      ) : configuredDisplayPreparationCount > 0 ? (
        <View style={localStyles.printerList}>
          {displayPreparationDevices.map(deviceConfig => {
            const configs = parseDeviceConfigs(deviceConfig?.configs);
            const printerId = String(
              configs?.[DISPLAY_DEVICE_PRINTER_CONFIG_KEY] || '',
            ).trim();
            const displayId = String(
              configs?.[DISPLAY_DEVICE_LINK_CONFIG_KEY] || '',
            )
              .replace(/\D+/g, '')
              .trim();
            const alias =
              deviceConfig?.device?.alias ||
              deviceConfig?.device?.device ||
              `Device #${deviceConfig?.id || '--'}`;

            return (
              <View
                key={`display-print-${deviceConfig?.id || alias}`}
                style={[localStyles.printerItem, localStyles.printerItemActive]}>
                <Icon name="check-circle" size={20} color="#B45309" />
                <View style={localStyles.printerCopy}>
                  <Text style={localStyles.printerName}>{alias}</Text>
                  <Text style={localStyles.printerDevice}>
                    {`Display #${displayId || '--'} • Impressora ${printerId || '--'}`}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={localStyles.emptyBox}>
          <Text style={localStyles.emptyTitle}>
            Nenhum DISPLAY preparado para a fila
          </Text>
          <Text style={localStyles.emptyText}>
            Abra o detalhe do device DISPLAY, selecione o display vinculado e a
            impressora da fila. Sem isso, a impressao automatica por preparo nao
            e disparada.
          </Text>
        </View>
      )}
    </GeneralSettingsSection>
  );
};

export default DisplayPreparationSection;
