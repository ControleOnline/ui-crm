import React from 'react';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AnimatedModal from '@controleonline/ui-common/src/react/components/AnimatedModal';
import styles from './index.styles';
import {inlineStyle_353_8, inlineStyle_365_47} from './index.styles';
import {formatCurrency} from './incomeStatementsHelpers';

const CategoryBlocks = ({parents, emptyText}) => {
  if (!Array.isArray(parents) || parents.length === 0) {
    return <Text style={styles.modalEmptyText}>{emptyText}</Text>;
  }
  return parents.map(parent => (
    <View key={`parent-${parent.parentId}`} style={styles.modalGroupBlock}>
      <View style={styles.modalGroupHeader}>
        <Text style={styles.modalGroupTitle}>{parent.parentName}</Text>
        <Text style={styles.modalGroupAmount}>
          {formatCurrency(parent.total)}
        </Text>
      </View>
      {(parent.categories || []).map(category => (
        <View key={`cat-${category.id}`} style={styles.modalCategoryRow}>
          <Text style={styles.modalCategoryText}>{category.name}</Text>
          <Text style={styles.modalCategoryAmount}>
            {formatCurrency(category.total)}
          </Text>
        </View>
      ))}
    </View>
  ));
};

/**
 * Detail modal for a single month of the company Income Statements view.
 */
const IncomeStatementDetailsModal = ({
  visible,
  statement,
  onClose,
  closeLabel = 'Fechar',
}) => {
  const balancePositive = (statement?.balance || 0) >= 0;

  return (
    <AnimatedModal
      visible={visible}
      onRequestClose={onClose}
      style={inlineStyle_353_8}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Detalhes do Mês</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Icon name="close" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalBody}
          contentContainerStyle={inlineStyle_365_47}>
          <View style={styles.modalSummaryCard}>
            <Text style={styles.modalAmount}>
              {formatCurrency(statement?.balance)}
            </Text>
            <View
              style={[
                styles.modalStatusPill,
                {backgroundColor: balancePositive ? '#16A34A' : '#DC2626'},
              ]}>
              <Text style={styles.modalStatusText}>
                {balancePositive ? 'SALDO POSITIVO' : 'SALDO NEGATIVO'}
              </Text>
            </View>
          </View>

          <View style={styles.modalDetailsCard}>
            <Text style={styles.modalSectionTitle}>Receitas por Categoria</Text>
            <CategoryBlocks
              parents={statement?.receiveParents}
              emptyText="Sem receitas no período."
            />
          </View>

          <View style={styles.modalDetailsCard}>
            <Text style={styles.modalSectionTitle}>Despesas por Categoria</Text>
            <CategoryBlocks
              parents={statement?.payParents}
              emptyText="Sem despesas no período."
            />
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.modalPrimaryButton} onPress={onClose}>
            <Text style={styles.modalPrimaryButtonText}>{closeLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AnimatedModal>
  );
};

export default IncomeStatementDetailsModal;
