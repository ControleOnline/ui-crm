import React from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { Text } from 'react-native-animatable';
import Icon from 'react-native-vector-icons/FontAwesome';

import OpportunityCard from './OpportunityCard';
import { OpportunitySkeletonCard } from './OpportunitySkeletons';
import styles from '../index.styles';

const EmptyOpportunities = ({ error, opportunityEmptyStateMode }) => (
  <View style={styles.emptyContainer}>
    {error ? (
      <>
        <Icon name="exclamation-triangle" size={48} color="#c10015" />
        <Text style={styles.loadingText}>
          {global.t?.t('people', 'state', 'loadError')}
        </Text>
      </>
    ) : (
      <>
        <Icon name="line-chart" size={64} color="#bdc3c7" />
        <Text style={styles.emptyTitle}>
          {opportunityEmptyStateMode === 'filtered'
            ? global.t?.t('people', 'state', 'noOpportunityFound')
            : global.t?.t('people', 'state', 'noOpportunity')}
        </Text>
        <Text style={styles.emptySubtitle}>
          {opportunityEmptyStateMode === 'filtered'
            ? global.t?.t('people', 'state', 'tryOtherTerms')
            : global.t?.t('people', 'state', 'addFirstOpportunity')}
        </Text>
      </>
    )}
  </View>
);

const OpportunityList = ({
  allOpportunities,
  error,
  getProviderName,
  handleEditProvider,
  handleEditOpportunity,
  handleOpportunityPress,
  isLoading,
  isPeopleLoading,
  isStatusLoading,
  knownPeople,
  onRefresh,
  opportunityEmptyStateMode,
  refreshing,
  setCurrentPage,
  showOpportunityCardsSkeleton,
  toggleStatus,
  totalItems,
  visibleOpportunities,
}) => (
  <FlatList
    data={showOpportunityCardsSkeleton ? [] : visibleOpportunities}
    keyExtractor={item => String(item.id)}
    renderItem={({ item }) => (
      <OpportunityCard
        opportunity={item}
        getProviderName={getProviderName}
        handleEditProvider={handleEditProvider}
        handleEditOpportunity={handleEditOpportunity}
        handleOpportunityPress={handleOpportunityPress}
        isPeopleLoading={isPeopleLoading}
        isStatusLoading={isStatusLoading}
        knownPeople={knownPeople}
        toggleStatus={toggleStatus}
      />
    )}
    refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
    }
    contentContainerStyle={[
      styles.scrollContent,
      showOpportunityCardsSkeleton && styles.scrollContentSkeleton,
    ]}
    ListEmptyComponent={() =>
      showOpportunityCardsSkeleton ? (
        <View style={styles.skeletonListWrapper}>
          {[1, 2, 3, 4, 5].map(key => (
            <View key={key}>
              <OpportunitySkeletonCard />
            </View>
          ))}
        </View>
      ) : (
        <EmptyOpportunities
          error={error}
          opportunityEmptyStateMode={opportunityEmptyStateMode}
        />
      )
    }
    onEndReached={() => {
      if (!isLoading && allOpportunities.length < totalItems) {
        setCurrentPage(prev => prev + 1);
      }
    }}
    onEndReachedThreshold={0.5}
    ListFooterComponent={() =>
      isLoading && allOpportunities.length > 0 ? (
        <View style={styles.skeletonFooter}>
          <OpportunitySkeletonCard />
          <OpportunitySkeletonCard />
        </View>
      ) : null
    }
  />
);

export default OpportunityList;
