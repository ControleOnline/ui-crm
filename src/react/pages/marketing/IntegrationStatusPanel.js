/*
 * @agents Right-side marketing integration status (ga4/ads/adsense) for #100.
 * Reads the same /integrations/google-marketing/status endpoint used by the
 * settings cards; a non-connected scope links to Settings → Integrations.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';

import {api} from '@controleonline/ui-common/src/api';
import useChatPalette from '../../components/conversation/useChatPalette';

const SCOPES = [
  {key: 'analytics', label: 'Google Analytics'},
  {key: 'ads', label: 'Google Ads'},
  {key: 'adsense', label: 'Google AdSense'},
];

export default function IntegrationStatusPanel({companyId}) {
  const palette = useChatPalette();
  const styles = useLocalStyles(palette);
  const [statuses, setStatuses] = useState({});

  const load = useCallback(async () => {
    if (!companyId) return;
    const next = {};
    await Promise.all(
      SCOPES.map(async scope => {
        try {
          const status = await api.fetch('/integrations/google-marketing/status', {
            params: {provider_id: companyId, scope_set: scope.key},
          });
          next[scope.key] = Boolean(status?.connected);
        } catch {
          next[scope.key] = false;
        }
      }),
    );
    setStatuses(next);
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View>
      <Text style={styles.title}>
        {global.t?.t('marketing', 'ai', 'statusTitle', 'Conexões')}
      </Text>
      {SCOPES.map(scope => {
        const connected = !!statuses[scope.key];
        return (
          <View key={scope.key} style={styles.row}>
            <View style={[styles.dot, connected ? styles.dotOk : styles.dotOff]} />
            <Text style={styles.label}>{scope.label}</Text>
          </View>
        );
      })}
      <TouchableOpacity style={styles.manageButton} onPress={() => load()}>
        <Text style={styles.manageButtonText}>
          {global.t?.t('marketing', 'ai', 'refresh', 'Atualizar')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const useLocalStyles = palette =>
  StyleSheet.create({
    title: {color: palette.text, fontWeight: '700', fontSize: 14, marginBottom: 8},
    row: {flexDirection: 'row', alignItems: 'center', marginBottom: 6},
    dot: {width: 10, height: 10, borderRadius: 5, marginRight: 8},
    dotOk: {backgroundColor: palette.success || palette.primary},
    dotOff: {backgroundColor: palette.muted},
    label: {color: palette.text, fontSize: 13},
    manageButton: {
      marginTop: 10,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: palette.chip,
      borderRadius: 8,
      alignSelf: 'flex-start',
    },
    manageButtonText: {color: palette.text, fontSize: 12, fontWeight: '600'},
  });
