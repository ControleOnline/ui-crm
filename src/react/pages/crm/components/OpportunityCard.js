import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-animatable';
import Icon from 'react-native-vector-icons/FontAwesome';
import IconWhatsApp from 'react-native-vector-icons/FontAwesome';

import { colors } from '@controleonline/../../src/styles/colors';
import { formatDate } from '../../../utils/opportunityDate';
import { parsePhoneNumbers } from '../../../utils/opportunityPhone';
import { getStageColor, getStageLabel } from '../../../utils/opportunityStage';
import styles from '../index.styles';

const OpportunityCard = ({
  opportunity,
  getProviderName,
  handleEditProvider,
  handleEditOpportunity,
  handleOpportunityPress,
  isPeopleLoading,
  isStatusLoading,
  knownPeople,
  toggleStatus,
}) => {
  const providerName = getProviderName(opportunity?.client);
  const showClientSkeleton =
    !providerName && isPeopleLoading && knownPeople.length === 0;
  const stageColor = getStageColor(opportunity.taskStatus?.realStatus);

  return (
    <View style={styles.cardWrapper}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            {showClientSkeleton ? (
              <View style={[styles.skeletonLine, styles.opportunityTitleSkeleton]} />
            ) : (
              <View style={styles.clientNameRow}>
                <Text style={styles.opportunityTitle}>
                  {providerName ||
                    global.t?.t('people', 'card', 'clientNotInformed')}
                </Text>
                <TouchableOpacity
                  style={styles.editClientButton}
                  onPress={() => handleEditProvider(opportunity)}
                  activeOpacity={0.8}
                  accessibilityLabel={global.t?.t('people', 'action', 'editClient') || 'Editar cliente'}>
                  <Icon name="edit" size={12} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.clientNameRow}>
              <Text style={styles.clientName}>#{opportunity.id}</Text>
            </View>
          </View>
          {!opportunity?.taskStatus?.realStatus && isStatusLoading ? (
            <View style={[styles.stageTag, styles.stageTagSkeleton]}>
              <View style={[styles.skeletonLine, styles.stageTextSkeleton]} />
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.stageTag,
                { backgroundColor: `${stageColor}20` },
              ]}
              onPress={() => toggleStatus(opportunity)}>
              <Text style={[styles.stageText, { color: stageColor }]}>
                {getStageLabel(opportunity.taskStatus?.realStatus)}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <View style={styles.infoContainer}>
              <Icon name="tag" size={14} color="#9b59b6" />
              <Text style={styles.infoText}>
                {opportunity.category?.name ||
                  global.t?.t('people', 'card', 'withoutCategory')}
              </Text>
            </View>
            <View style={styles.infoContainer}>
              <Icon name="exclamation-circle" size={14} color="#e67e22" />
              <Text style={styles.infoText}>
                {opportunity.criticality?.name || 'Normal'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoContainer}>
              <Icon name="calendar" size={14} color="#3498db" />
              <Text style={styles.infoText}>
                {formatDate(opportunity.dueDate)}
              </Text>
            </View>
            <View style={styles.infoContainer}>
              <Icon name="clock-o" size={14} color="#95a5a6" />
              <Text style={styles.infoText}>
                {formatDate(opportunity.alterDate)}
              </Text>
            </View>
          </View>
        </View>

        {opportunity.announce && (
          <View style={styles.announceContainer}>
            <Icon name="bullhorn" size={12} color="#9b59b6" />
            <Text style={styles.announceText}>
              {global.t?.t('people', 'card', 'phones')}:{' '}
              {parsePhoneNumbers(opportunity.announce).join(', ') ||
                global.t?.t('people', 'card', 'notAvailable')}
            </Text>
          </View>
        )}

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.chatButton]}
            onPress={() => handleOpportunityPress(opportunity)}>
            <IconWhatsApp name="whatsapp" size={16} color="#25D366" />
            <Text style={[styles.actionButtonText, { color: '#25D366' }]}>
              {global.t?.t('people', 'action', 'chat')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditOpportunity(opportunity)}>
            <Icon name="edit" size={16} color="#e67e22" />
            <Text style={[styles.actionButtonText, { color: '#e67e22' }]}>
              {global.t?.t('people', 'action', 'edit')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default OpportunityCard;
