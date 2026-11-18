import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import Formatter from '@controleonline/ui-common/src/utils/formatter';
import { colors } from '@controleonline/../../src/styles/colors';
import styles from './index.styles';
import { buildProposalProductsParams, buildProposalDetailsParams } from './proposalNavigation';

/**
 * Card for a single proposal in the list.
 * Exposes an explicit "Produtos" action so users know where to associate products/services.
 */
const ProposalCard = ({
  contract,
  navigation,
  getStatusColor,
  getStatusLabel,
  getContractClientName,
  isContractClientPendingResolution,
}) => {
  const clientName = getContractClientName(contract);
  const isPendingClient = isContractClientPendingResolution(contract);
  const clientLabel = clientName
    ? clientName
    : isPendingClient
      ? global.t?.t('contract', 'label', 'loadingClient')
      : global.t?.t('contract', 'label', 'clientNotInformed');

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.cardTitle}>
            {contract.contractModel?.model || global.t?.t('contract', 'label', 'untitled')}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(contract.status?.status) },
            ]}>
            <Text style={styles.statusText}>{getStatusLabel(contract.status?.status)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.clientRow}>
          <MaterialIcon name="person" size={14} color="#64748B" />
          <Text style={styles.clientText}>
            {global.t?.t('contract', 'label', 'client')}: {clientLabel}
          </Text>
        </View>

        <View style={styles.datesContainer}>
          <View style={styles.dateBadge}>
            <MaterialIcon name="event" size={14} color="#64748B" />
            <Text style={styles.dateText}>
              {global.t?.t('contract', 'label', 'startDate')}:{' '}
              {contract.startDate
                ? Formatter.formatDateYmdTodmY(contract.startDate)
                : global.t?.t('contract', 'label', 'na')}
            </Text>
          </View>
          {contract.endDate && (
            <View style={styles.dateBadge}>
              <MaterialIcon name="event-available" size={14} color="#64748B" />
              <Text style={styles.dateText}>
                {global.t?.t('contract', 'label', 'endDate')}:{' '}
                {Formatter.formatDateYmdTodmY(contract.endDate)}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.footerActions}>
          <TouchableOpacity
            style={styles.footerButton}
            onPress={() =>
              navigation.navigate(
                'ProposalDetails',
                buildProposalProductsParams(contract.id),
              )
            }
            activeOpacity={0.85}>
            <MaterialIcon name="inventory-2" size={16} color="#64748B" />
            <Text style={styles.footerButtonText}>Produtos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.footerButton, styles.footerButtonPrimary]}
            onPress={() =>
              navigation.navigate(
                'ProposalDetails',
                buildProposalDetailsParams(contract.id),
              )
            }
            activeOpacity={0.85}>
            <Text style={[styles.viewDetailsText, styles.footerButtonTextPrimary]}>
              {global.t?.t('contract', 'action', 'viewDetails')}
            </Text>
            <Icon name="chevron-right" size={12} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default ProposalCard;
