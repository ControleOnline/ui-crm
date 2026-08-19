import React from 'react';
import {ScrollView, Text, TextInput, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from './index.styles';

const ChipRow = ({options, selectedId, onSelect}) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    style={styles.monthList}
    contentContainerStyle={styles.monthListContent}>
    {options.map(option => {
      const active = selectedId === option.id;
      return (
        <TouchableOpacity
          key={`chip-${option.id}`}
          style={[styles.monthChip, active && styles.monthChipActive]}
          onPress={() => onSelect(option.id)}>
          <Text
            style={[styles.monthChipText, active && styles.monthChipTextActive]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

/**
 * Filters for company Income Statements: year, month, nature, category query.
 */
const IncomeStatementsFilters = ({
  selectedYear,
  onYearChange,
  monthOptions,
  selectedMonth,
  onMonthChange,
  natureOptions,
  natureFilter,
  onNatureChange,
  categoryQuery,
  onCategoryQueryChange,
  yearLabel = 'Ano',
  categoryPlaceholder = 'Categoria (comissão, royalties…)',
}) => {
  const stepYear = delta => {
    const current = parseInt(selectedYear || '0', 10);
    if (!current) return;
    onYearChange(String(current + delta));
  };

  return (
    <View style={styles.filtersContainer}>
      <View style={styles.yearRow}>
        <Text style={styles.filterLabel}>{yearLabel}</Text>
        <View style={styles.yearControl}>
          <TouchableOpacity
            style={styles.yearStepButton}
            onPress={() => stepYear(-1)}>
            <Text style={styles.yearStepButtonText}>-</Text>
          </TouchableOpacity>
          <TextInput
            value={selectedYear}
            onChangeText={text => {
              const cleaned = text.replace(/\D/g, '').slice(0, 4);
              onYearChange(cleaned);
            }}
            onBlur={() => {
              if (String(selectedYear).length !== 4) {
                onYearChange(String(new Date().getFullYear()));
              }
            }}
            keyboardType="number-pad"
            style={styles.yearInput}
          />
          <TouchableOpacity
            style={styles.yearStepButton}
            onPress={() => stepYear(1)}>
            <Text style={styles.yearStepButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ChipRow
        options={monthOptions}
        selectedId={selectedMonth}
        onSelect={onMonthChange}
      />

      <ChipRow
        options={natureOptions}
        selectedId={natureFilter}
        onSelect={onNatureChange}
      />

      <View style={styles.categoryFilterRow}>
        <Icon
          name="search"
          size={18}
          color="#64748B"
          style={styles.categoryFilterIcon}
        />
        <TextInput
          value={categoryQuery}
          onChangeText={onCategoryQueryChange}
          placeholder={categoryPlaceholder}
          placeholderTextColor="#94A3B8"
          style={styles.categoryFilterInput}
        />
        {categoryQuery ? (
          <TouchableOpacity onPress={() => onCategoryQueryChange('')}>
            <Icon name="close" size={18} color="#64748B" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

export default IncomeStatementsFilters;
