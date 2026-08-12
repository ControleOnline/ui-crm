import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-animatable';
import Icon from 'react-native-vector-icons/FontAwesome';

import AnimatedModal from '@controleonline/ui-common/src/react/components/AnimatedModal';
import { colors } from '@controleonline/../../src/styles/colors';
import styles from '../index.styles';

const getSelectModalEmptyConfig = title => {
  const normalizedTitle = String(title || '').toLowerCase();

  if (normalizedTitle.includes('categoria')) {
    return {
      icon: 'tags',
      title: global.t?.t('people', 'modal', 'noCategories'),
      subtitle: global.t?.t('people', 'modal', 'noCategoriesHint'),
    };
  }

  if (normalizedTitle.includes('status')) {
    return {
      icon: 'flag',
      title: global.t?.t('people', 'modal', 'noStatus'),
      subtitle: global.t?.t('people', 'modal', 'noStatusHint'),
    };
  }

  if (normalizedTitle.includes('criticidade')) {
    return {
      icon: 'exclamation-circle',
      title: global.t?.t('people', 'modal', 'noCriticalities'),
      subtitle: global.t?.t('people', 'modal', 'noCriticalitiesHint'),
    };
  }

  if (normalizedTitle.includes('motivo')) {
    return {
      icon: 'question-circle',
      title: global.t?.t('people', 'modal', 'noReasons'),
      subtitle: global.t?.t('people', 'modal', 'noReasonsHint'),
    };
  }

  if (normalizedTitle.includes('dia') || normalizedTitle.includes('mês')) {
    return {
      icon: 'calendar',
      title: global.t?.t('people', 'modal', 'noOptions'),
      subtitle: global.t?.t('people', 'modal', 'tryAgainSoon'),
    };
  }

  return {
    icon: 'inbox',
    title: global.t?.t('people', 'modal', 'nothingToShow'),
    subtitle: global.t?.t('people', 'modal', 'noOptionsNow'),
  };
};

const SelectModal = ({
  getOptionIdentity,
  getStatusFilterLabel,
  isQuestionLikeIcon,
  isValidFontAwesomeIcon,
  items,
  onSelect,
  renderKey = 'name',
  selectedItem,
  setVisible,
  title,
  visible,
}) => {
  const emptyCfg = getSelectModalEmptyConfig(title);
  const safeItems = Array.isArray(items) ? items : [];
  const normalizedTitle = String(title || '').toLowerCase();
  const selectedIdentity = getOptionIdentity(selectedItem);
  const isStatusModal =
    normalizedTitle.includes('status') || renderKey === 'status';
  const isCategoryOrCriticalityModal =
    normalizedTitle.includes('categoria') ||
    normalizedTitle.includes('criticidade');
  const isReasonModal = normalizedTitle.includes('motivo');
  const itemsToRender =
    selectedItem && selectedIdentity
      ? safeItems.some(item => getOptionIdentity(item) === selectedIdentity)
        ? safeItems
        : [selectedItem, ...safeItems]
      : safeItems;

  return (
    <AnimatedModal visible={visible} onRequestClose={() => setVisible(false)}>
      <View style={styles.selectModalContent}>
        <View style={styles.selectModalHeader}>
          <Text style={styles.selectModalTitle}>{title}</Text>
          <TouchableOpacity
            onPress={() => setVisible(false)}
            style={styles.closeButton}>
            <Icon name="times" size={20} color="#7f8c8d" />
          </TouchableOpacity>
        </View>

        {itemsToRender.length === 0 ? (
          <View style={styles.selectModalEmptyState}>
            <View style={styles.selectModalEmptyIcon}>
              <Icon name={emptyCfg.icon} size={22} color="#94A3B8" />
            </View>
            <Text style={styles.selectModalEmptyTitle}>{emptyCfg.title}</Text>
            <Text style={styles.selectModalEmptySubtitle}>
              {emptyCfg.subtitle}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.selectModalBody}
            contentContainerStyle={styles.selectModalBodyContent}>
            {itemsToRender.map(item => {
              const optionIdentity = getOptionIdentity(item);
              const isSelected = selectedIdentity === optionIdentity;
              const optionLabel = isStatusModal
                ? getStatusFilterLabel(item)
                : item[renderKey] ||
                  item.name ||
                  item.status ||
                  global.t?.t('people', 'label', 'withoutName');

              return (
                <TouchableOpacity
                  key={String(optionIdentity || item[renderKey])}
                  style={[
                    styles.selectOption,
                    isSelected && styles.selectOptionActive,
                  ]}
                  onPress={() => {
                    onSelect(item);
                    setVisible(false);
                  }}>
                  {item.color && (
                    <View
                      style={[
                        styles.selectOptionDot,
                        { backgroundColor: item.color },
                      ]}
                    />
                  )}
                  {item.icon &&
                    !isCategoryOrCriticalityModal &&
                    (!isReasonModal ||
                      (isValidFontAwesomeIcon(item.icon) &&
                        !isQuestionLikeIcon(item.icon))) && (
                      <Icon
                        name={
                          item.icon === 'keyboard-arrow-down'
                            ? 'angle-down'
                            : item.icon
                        }
                        size={16}
                        color={isSelected ? colors.primary : '#3498db'}
                        style={styles.selectOptionIcon}
                      />
                    )}
                  <Text
                    style={[
                      styles.selectOptionText,
                      isSelected && styles.selectOptionTextActive,
                    ]}>
                    {optionLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    </AnimatedModal>
  );
};

export default SelectModal;
