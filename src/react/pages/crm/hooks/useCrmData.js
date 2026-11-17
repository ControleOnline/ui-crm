import React, { useCallback, useEffect, useRef, useState } from 'react';

import { app_type } from '@appType';
import { useStore } from '@store';
import { useFocusEffect } from '@react-navigation/native';
import {
  getOpportunityStatusFilterKey,
  resolveDefaultOpportunityStatusFilterKey,
} from '../../../utils/opportunityStatusFilter';
import {
  extractCollectionItems,
  getOpportunityClientIdentity,
  mergePeopleEntries,
  normalizePeopleReferenceValue,
  normalizeSearchValue,
} from '../../../utils/opportunityPeople';

const { getOpportunityEmptyStateMode } = require('../../../utils/opportunityEmptyState');

const getStatusFilterLabel = item => {
  const normalized = String(item?.realStatus || item?.status || '')
    .trim()
    .toLowerCase();

  const labels = {
    open: global.t?.t('people', 'status', 'open'),
    pending: global.t?.t('people', 'status', 'pending'),
    closed: global.t?.t('people', 'status', 'closed'),
    canceled: global.t?.t('people', 'status', 'canceled'),
    cancelado: global.t?.t('people', 'status', 'cancelledPt'),
    ativo: global.t?.t('people', 'status', 'active'),
    inativo: global.t?.t('people', 'status', 'inactive'),
  };

  return labels[normalized] || item?.status || global.t?.t('people', 'status', 'noStatus');
};

const getOptionIdentity = item => {
  if (!item) {
    return '';
  }
  return item['@id'] || item.id || item.value || item.status || item.name || '';
};

const buildIconValidators = iconComponent => {
  const glyphMap = iconComponent?.getRawGlyphMap
    ? iconComponent.getRawGlyphMap()
    : null;

  const isQuestionLikeIcon = iconName => {
    const normalized = String(iconName || '').trim().toLowerCase();
    return (
      !normalized ||
      normalized === '?' ||
      normalized === 'help' ||
      normalized === 'unknown' ||
      normalized.includes('question') ||
      normalized.includes('help')
    );
  };

  const isValidFontAwesomeIcon = iconName => {
    const normalized = String(iconName || '').trim();
    if (!normalized) {
      return false;
    }

    if (!glyphMap) {
      return true;
    }

    return Object.prototype.hasOwnProperty.call(glyphMap, normalized);
  };

  return { isQuestionLikeIcon, isValidFontAwesomeIcon };
};

const useCrmData = ({ iconComponent, navigation, showError }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [providerSearchText, setProviderSearchText] = useState('');
  const [providerSearchQuery, setProviderSearchQuery] = useState('');
  const [providerPickerVisible, setProviderPickerVisible] = useState(false);
  const [providerOptions, setProviderOptions] = useState([]);
  const [knownPeople, setKnownPeople] = useState([]);
  const [isProviderSearchLoading, setIsProviderSearchLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilterKey, setSelectedStatusFilterKey] = useState('');
  const [isStatusFilterBootstrapping, setIsStatusFilterBootstrapping] = useState(true);
  const [isStatusFilterApplying, setIsStatusFilterApplying] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [allOpportunities, setAllOpportunities] = useState([]);
  const hasInitializedStatusFilter = useRef(false);
  const statusFilterDefaultAppliedRef = useRef(false);
  const providerFetchKeyRef = useRef('');

  const tasksStore = useStore('tasks');
  const opportunitiesActions = tasksStore.actions;
  const opportunitiesGetters = tasksStore.getters;
  const { items: opportunities, totalItems, isLoading, error } = opportunitiesGetters;
  const peopleStore = useStore('people');
  const peopleActions = peopleStore.actions;
  const { currentCompany, isLoading: isPeopleLoading } = peopleStore.getters;
  const statusStore = useStore('status');
  const statusActions = statusStore.actions;
  const { items: status = [], isLoading: isStatusLoading } = statusStore.getters;
  const categoriesStore = useStore('categories');
  const categoriesActions = categoriesStore.actions;
  const { items: categories = [] } = categoriesStore.getters;
  const authStore = useStore('auth');
  const { user } = authStore.getters;

  const { isQuestionLikeIcon, isValidFontAwesomeIcon } =
    React.useMemo(() => buildIconValidators(iconComponent), [iconComponent]);

  const closeProviderPicker = useCallback(() => {
    setProviderPickerVisible(false);
    setProviderSearchText('');
    setProviderSearchQuery('');
  }, []);

  const fetchProviderOptions = useCallback(
    async (query = '') => {
      if (!currentCompany?.id) {
        setProviderOptions([]);
        return [];
      }

      setIsProviderSearchLoading(true);

      try {
        const normalizedQuery = String(query || '').trim();
        const params = {
          'link.company': `/people/${currentCompany.id}`,
          'link.linkType': ['client', 'prospect'],
        };
        const fetchKey = JSON.stringify({
          company: currentCompany.id,
          query: normalizedQuery,
        });

        providerFetchKeyRef.current = fetchKey;

        if (normalizedQuery) {
          params.search = normalizedQuery;
        }

        const response = await peopleActions.getItems(params);
        const nextItems = extractCollectionItems(response);

        if (providerFetchKeyRef.current !== fetchKey) {
          return [];
        }

        setProviderOptions(nextItems);
        setKnownPeople(previousItems =>
          mergePeopleEntries(previousItems, nextItems),
        );

        return nextItems;
      } catch {
        setProviderOptions([]);
        return [];
      } finally {
        setIsProviderSearchLoading(false);
      }
    },
    [currentCompany?.id, peopleActions],
  );

  const statusFilterParam = selectedStatusFilterKey || null;
  const buildOpportunityParams = useCallback((overrides = {}) => {
    if (!currentCompany?.id) {
      return null;
    }

    const page = overrides.page ?? currentPage;
    const query = String(overrides.searchQuery ?? searchQuery).trim();
    const filterParam = overrides.statusFilterParam ?? statusFilterParam;
    const params = {
      type: 'relationship',
      taskFor: app_type === 'CRM' && user?.people ? `/people/${user.people}` : null,
      provider: currentCompany.id,
      page,
    };

    if (query) {
      params['peoples.people.name'] = query;
    }

    if (filterParam?.startsWith('/statuses/')) {
      params.taskStatus = filterParam;
    } else if (filterParam?.startsWith('realStatus:')) {
      params['taskStatus.realStatus'] = filterParam.replace('realStatus:', '');
    }

    return params;
  }, [
    currentCompany?.id,
    currentPage,
    searchQuery,
    statusFilterParam,
    user?.people,
  ]);

  useFocusEffect(
    useCallback(() => {
      const params = buildOpportunityParams();
      if (params) {
        opportunitiesActions.getItems(params);
        fetchProviderOptions();
      }

      categoriesActions.getItems({
        context: [
          'relationship',
          'relationship-criticality',
          'relationship-reason',
          'products',
        ],
      });

      return () => {};
    }, [
      buildOpportunityParams,
      categoriesActions,
      fetchProviderOptions,
      opportunitiesActions,
    ]),
  );

  useEffect(() => {
    let mounted = true;

    setIsStatusFilterBootstrapping(true);
    statusActions
      .getItems({ context: 'relationship' })
      .catch(() => null)
      .finally(() => {
        if (mounted) {
          setIsStatusFilterBootstrapping(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [statusActions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatusFilterKey]);

  useEffect(() => {
    if (!hasInitializedStatusFilter.current) {
      hasInitializedStatusFilter.current = true;
      return;
    }

    setIsStatusFilterApplying(true);
    setAllOpportunities([]);
  }, [selectedStatusFilterKey]);

  useEffect(() => {
    if (isLoading) return;

    if (opportunities && Array.isArray(opportunities)) {
      if (currentPage === 1) {
        setAllOpportunities(opportunities);
      } else {
        setAllOpportunities(prev => {
          const newIds = new Set(opportunities.map(item => item.id));
          const filteredPrev = prev.filter(item => !newIds.has(item.id));
          return [...filteredPrev, ...opportunities];
        });
      }
    }
  }, [opportunities, currentPage, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      setIsStatusFilterApplying(false);
    }
  }, [isLoading]);

  useEffect(() => {
    if (!selectedStatusFilterKey || status.length === 0) {
      return;
    }

    const statusExists = status.some(
      item => getOpportunityStatusFilterKey(item) === selectedStatusFilterKey,
    );

    if (!statusExists) {
      setSelectedStatusFilterKey('');
    }
  }, [status, selectedStatusFilterKey]);

  useEffect(() => {
    if (status.length === 0 || selectedStatusFilterKey) {
      return;
    }

    // Empty key means intentional "all" after the default has been applied once.
    if (statusFilterDefaultAppliedRef.current) {
      return;
    }

    const defaultStatusFilterKey = resolveDefaultOpportunityStatusFilterKey(status);
    if (defaultStatusFilterKey) {
      setSelectedStatusFilterKey(defaultStatusFilterKey);
    }
    statusFilterDefaultAppliedRef.current = true;
  }, [status, selectedStatusFilterKey]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearchQuery(searchText.trim());
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchText]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setProviderSearchQuery(providerSearchText.trim());
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [providerSearchText]);

  useEffect(() => {
    if (!providerPickerVisible) {
      return;
    }

    fetchProviderOptions(providerSearchQuery);
  }, [fetchProviderOptions, providerPickerVisible, providerSearchQuery]);

  useEffect(() => {
    setProviderOptions([]);
    setKnownPeople([]);
    setProviderSearchText('');
    setProviderSearchQuery('');
    providerFetchKeyRef.current = '';
  }, [currentCompany?.id]);

  const getPersonByReference = useCallback(
    value => {
      const reference = normalizePeopleReferenceValue(value);
      if (!reference || !Array.isArray(knownPeople)) {
        return null;
      }

      return (
        knownPeople.find(item => normalizePeopleReferenceValue(item) === reference) ||
        null
      );
    },
    [knownPeople],
  );

  const getProviderName = useCallback(
    value => {
      if (value && typeof value === 'object') {
        const directName = value.name || value.realname || value.alias;
        if (directName) {
          return directName;
        }
      }

      return getPersonByReference(value)?.name || '';
    },
    [getPersonByReference],
  );

  const visibleOpportunities = React.useMemo(() => {
    const normalizedQuery = normalizeSearchValue(searchQuery);
    if (!normalizedQuery) {
      return allOpportunities;
    }

    return allOpportunities.filter(opportunity => {
      const clientIdentity = getOpportunityClientIdentity({
        opportunity,
        knownPeople,
      });
      const searchableFields = [
        clientIdentity.name,
        clientIdentity.alias,
        `${clientIdentity.name} ${clientIdentity.alias}`.trim(),
      ];
      const availableFields = searchableFields.filter(field =>
        normalizeSearchValue(field).length > 0,
      );

      if (availableFields.length === 0) {
        return true;
      }

      return availableFields.some(field =>
        normalizeSearchValue(field).includes(normalizedQuery),
      );
    });
  }, [allOpportunities, knownPeople, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    const params = buildOpportunityParams({ page: 1 });
    if (params) {
      opportunitiesActions.getItems(params);
    }
    setCurrentPage(1);
    setRefreshing(false);
  };

  const handleEditProvider = useCallback(
    opportunity => {
      const reference = normalizePeopleReferenceValue(opportunity?.client);
      if (!reference) {
        showError?.(global.t?.t('people', 'toast', 'providerNotIdentified'));
        return;
      }

      const matchedPerson = getPersonByReference(opportunity?.client);
      const selectedClient =
        matchedPerson ||
        (typeof opportunity?.client === 'object' && opportunity?.client
          ? opportunity.client
          : null) ||
        {
          id: String(reference || '').replace(/\D/g, ''),
          '@id': reference,
          name:
            getProviderName(opportunity?.client) ||
            global.t?.t('people', 'label', 'client'),
        };

      navigation.navigate('ClientDetails', { client: selectedClient });
    },
    [getPersonByReference, getProviderName, navigation, showError],
  );

  return {
    allOpportunities,
    buildOpportunityParams,
    categories,
    closeProviderPicker,
    currentCompany,
    currentPage,
    error,
    fetchProviderOptions,
    getOptionIdentity,
    getProviderName,
    getStatusFilterKey: getOpportunityStatusFilterKey,
    getStatusFilterLabel,
    handleEditProvider,
    isLoading,
    isPeopleLoading,
    isProviderSearchLoading,
    isQuestionLikeIcon,
    isStatusLoading,
    isValidFontAwesomeIcon,
    knownPeople,
    onRefresh,
    opportunitiesActions,
    opportunityEmptyStateMode: getOpportunityEmptyStateMode({
      searchQuery,
      selectedStatusFilterKey,
    }),
    providerOptions,
    providerPickerVisible,
    providerSearchText,
    refreshing,
    searchText,
    selectedStatusFilterKey,
    setCurrentPage,
    setProviderSearchText,
    setProviderPickerVisible,
    setSearchText,
    setSelectedStatusFilterKey,
    showInitialSkeleton:
      isLoading && allOpportunities.length === 0 && !isStatusFilterApplying,
    showOpportunityCardsSkeleton:
      isStatusFilterApplying || (isLoading && allOpportunities.length === 0),
    showStatusFilterSkeleton: isStatusLoading || isStatusFilterBootstrapping,
    status,
    totalItems,
    visibleOpportunities,
  };
};

export default useCrmData;
