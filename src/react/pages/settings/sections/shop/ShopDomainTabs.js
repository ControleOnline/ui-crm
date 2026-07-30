import React from 'react';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import useShopDomainShowcasesStyles from './ShopDomainShowcasesSection.styles';

const t = (type, key) => global.t?.t?.('configs', type, key);

const ShopDomainTabs = ({
  onCreatePress,
  onSelect,
  rows,
  selectedDomainId,
  palette,
}) => {
  const styles = useShopDomainShowcasesStyles();

  return (
    <View style={styles.tabsBlock}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}>
        {rows.map(row => {
          const selected = String(row.domainId) === String(selectedDomainId);

          return (
            <TouchableOpacity
              key={`shop-domain-tab-${row.domainId}`}
              activeOpacity={0.85}
              onPress={() => onSelect(row.domainId)}
              style={[styles.tabButton, selected && styles.tabButtonActive]}>
              <Icon
                name="language"
                size={14}
                color={selected ? palette.buttonText : palette.listItemText}
              />
              <Text
                numberOfLines={1}
                style={[
                  styles.tabText,
                  selected && {color: palette.buttonText},
                ]}>
                {row.domain.domain}
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onCreatePress}
          style={styles.addTabButton}>
          <Icon name="add" size={16} color={palette.buttonText} />
          <Text style={styles.addTabText}>{t('button', 'addShopDomain')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default ShopDomainTabs;
