/*
 * @agents Home for APP_TYPE=MKT (#105). Tiles navegáveis para as telas
 * da epic de marketing. Quando o admin configurar menus runtime do tipo
 * 'home' para MKT, AppMenuGrid toma o lugar do fallback.
 */
import React, {useMemo} from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';

import {useStore} from '@store';
import AppMenuGrid from '@controleonline/ui-layout/src/react/components/AppMenuGrid';

import useChatPalette from '../../components/conversation/useChatPalette';

const FALLBACK_TILES = [
  {
    key: 'marketing-ai',
    labelFallback: 'Chat com IA',
    icon: 'message-circle',
    route: 'MarketingAiPage',
  },
  {
    key: 'marketing-dashboard',
    labelFallback: 'Dashboard',
    icon: 'bar-chart-2',
    route: 'MarketingDashboardPage',
  },
  {
    key: 'marketing-integrations',
    labelFallback: 'Conectar Google',
    icon: 'link',
    route: 'IntegrationsPage',
  },
  {
    key: 'marketing-events',
    labelFallback: 'Eventos de marketing',
    icon: 'activity',
    route: 'MarketingEventsPage',
  },
];

export default function MarketingHomePage({navigation}) {
  const palette = useChatPalette();
  const themeStore = useStore('theme');
  const menus = themeStore?.getters?.menus || [];
  const styles = useLocalStyles(palette);

  const hasRuntimeMenus = useMemo(
    () => Array.isArray(menus) && menus.some(m => (m?.menu_type || m?.menuType) === 'home'),
    [menus],
  );

  if (hasRuntimeMenus) {
    return (
      <ScrollView style={styles.container}>
        <AppMenuGrid menus={menus} navigation={navigation} menuType="home" />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.fallback}>
      <Text style={styles.title}>
        {global.t?.t('marketing', 'home', 'title', 'Marketing')}
      </Text>
      <Text style={styles.subtitle}>
        {global.t?.t(
          'marketing',
          'home',
          'subtitle',
          'Escolha onde começar. Nenhum menu foi configurado pelo administrador ainda.',
        )}
      </Text>
      <View style={styles.grid}>
        {FALLBACK_TILES.map(tile => (
          <TouchableOpacity
            key={tile.key}
            style={styles.tile}
            onPress={() => navigation?.navigate?.(tile.route)}
            accessibilityRole="button">
            <Text style={styles.tileLabel}>
              {global.t?.t('marketing', 'home', tile.key, tile.labelFallback)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const useLocalStyles = palette =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: palette.background},
    fallback: {padding: 24, backgroundColor: palette.background, flexGrow: 1},
    title: {color: palette.text, fontSize: 22, fontWeight: '700'},
    subtitle: {color: palette.muted, fontSize: 13, marginTop: 8, marginBottom: 20},
    grid: {flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 12},
    tile: {
      minWidth: 160,
      flexGrow: 1,
      maxWidth: 220,
      backgroundColor: palette.panel,
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 12,
      padding: 20,
    },
    tileLabel: {color: palette.text, fontWeight: '700', fontSize: 15},
  });
