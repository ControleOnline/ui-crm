import React from 'react';
import { ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-animatable';
import Icon from 'react-native-vector-icons/FontAwesome';
import IconAdd from 'react-native-vector-icons/MaterialIcons';

import { colors } from '@controleonline/../../src/styles/colors';
import { getColorWithAlpha } from '../../../utils/opportunityStage';
import styles from '../index.styles';

const CrmHeader = ({
  getStatusFilterKey,
  getStatusFilterLabel,
  onAddOpportunity,
  searchText,
  selectedStatusFilterKey,
  setSearchText,
  setSelectedStatusFilterKey,
  showStatusFilterSkeleton,
  status,
}) => (
  <View style={styles.subHeader}>
    <View style={styles.searchRow}>
      <View style={styles.searchInputContainer}>
        <Icon name="search" size={16} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder={global.t?.t('people', 'search', 'placeholder')}
          placeholderTextColor="#94A3B8"
          value={searchText}
          onChangeText={setSearchText}
          underlineColorAndroid="transparent"
        />
        {searchText.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchText('')}
            style={styles.clearSearchButton}>
            <Icon name="times-circle" size={16} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity style={styles.addButton} onPress={onAddOpportunity}>
        <IconAdd name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>

    <View style={styles.statusFilterSection}>
      <Text style={styles.statusFilterLabel}>
        {global.t?.t('people', 'filter', 'status')}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statusFilterRow}>
        {showStatusFilterSkeleton ? (
          [1, 2, 3, 4].map(key => (
            <View
              key={`status-skeleton-${key}`}
              style={[styles.skeletonLine, styles.statusChipSkeleton]}
            />
          ))
        ) : (
          <>
            <TouchableOpacity
              onPress={() => setSelectedStatusFilterKey('')}
              style={[
                styles.statusFilterChip,
                !selectedStatusFilterKey && styles.statusFilterChipActive,
              ]}>
              <Text
                style={[
                  styles.statusFilterChipText,
                  !selectedStatusFilterKey && styles.statusFilterChipTextActive,
                ]}>
                {global.t?.t('people', 'filter', 'all')}
              </Text>
            </TouchableOpacity>

            {status.map(item => {
              const statusKey = getStatusFilterKey(item);
              const isActive =
                selectedStatusFilterKey &&
                selectedStatusFilterKey === statusKey;
              const chipColor = item?.color || colors.primary;

              return (
                <TouchableOpacity
                  key={statusKey || String(item.id || item.status)}
                  onPress={() => setSelectedStatusFilterKey(statusKey)}
                  style={[
                    styles.statusFilterChip,
                    isActive && styles.statusFilterChipActive,
                    {
                      borderColor: isActive ? chipColor : '#DCE3EC',
                      backgroundColor: isActive
                        ? getColorWithAlpha(chipColor, '24')
                        : '#F8FAFC',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.statusFilterChipText,
                      { color: isActive ? chipColor : '#64748B' },
                    ]}>
                    {getStatusFilterLabel(item)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  </View>
);

export default CrmHeader;
