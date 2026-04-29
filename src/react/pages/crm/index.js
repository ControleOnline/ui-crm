import React, { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import { ActivityIndicator, View, ScrollView, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { Text } from 'react-native-animatable';
import Icon from 'react-native-vector-icons/FontAwesome';
import IconAdd from 'react-native-vector-icons/MaterialIcons';
import IconWhatsApp from 'react-native-vector-icons/FontAwesome';

import AnimatedModal from '../../components/AnimatedModal';
import { FlatList } from 'react-native';
import { env } from '@env';
import { useStore } from '@store';
import { colors } from '@controleonline/../../src/styles/colors';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  getOpportunityStatusFilterKey,
  resolveDefaultOpportunityStatusFilterKey,
} from '../../utils/opportunityStatusFilter';
import useToastMessage from '../../hooks/useToastMessage';
import styles from './index.styles';

const FONT_AWESOME_GLYPH_MAP = Icon?.getRawGlyphMap
  ? Icon.getRawGlyphMap()
  : null;

const extractCollectionItems = response => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.['hydra:member'])) {
    return response['hydra:member'];
  }

  return [];
};

const normalizePeopleReferenceValue = value => {
  if (!value) {
    return '';
  }

  const rawValue =
    typeof value === 'object' ? value['@id'] ?? value.id : value;

  if (rawValue == null) {
    return '';
  }

  const normalized = String(rawValue).trim();
  if (!normalized) {
    return '';
  }

  if (normalized.startsWith('/people/') || normalized.startsWith('/peoples/')) {
    return normalized;
  }

  if (normalized.startsWith('/')) {
    return normalized;
  }

  if (/^\d+$/.test(normalized)) {
    return `/people/${normalized}`;
  }

  return normalized;
};

const extractId = value => String(value || '').replace(/\D/g, '');

const mergePeopleEntries = (currentItems = [], nextItems = []) => {
  const itemsByReference = new Map();

  [...currentItems, ...nextItems].forEach((item, index) => {
    const reference = normalizePeopleReferenceValue(item);
    const fallbackKey = `person-${item?.id || 'sem-id'}-${item?.document || 'sem-doc'}-${item?.name || 'sem-nome'}-${index}`;
    itemsByReference.set(reference || fallbackKey, item);
  });

  return Array.from(itemsByReference.values());
};

export default function CrmIndex() {
  const { showSuccess, showError } = useToastMessage();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newOpportunity, setNewOpportunity] = useState(null);
  const [statusPickerVisible, setStatusPickerVisible] = useState(false);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [criticalityPickerVisible, setCriticalityPickerVisible] = useState(false);
  const [providerPickerVisible, setProviderPickerVisible] = useState(false);
  const [reasonPickerVisible, setReasonPickerVisible] = useState(false);
  const [providerSearchText, setProviderSearchText] = useState('');
  const [providerSearchQuery, setProviderSearchQuery] = useState('');
  const [providerOptions, setProviderOptions] = useState([]);
  const [knownPeople, setKnownPeople] = useState([]);
  const [isProviderSearchLoading, setIsProviderSearchLoading] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilterKey, setSelectedStatusFilterKey] = useState('');
  const [isStatusFilterBootstrapping, setIsStatusFilterBootstrapping] =
    useState(true);
  const [isStatusFilterApplying, setIsStatusFilterApplying] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [allOpportunities, setAllOpportunities] = useState([]);
  const [dueDateDayPickerVisible, setDueDateDayPickerVisible] = useState(false);
  const [dueDateMonthPickerVisible, setDueDateMonthPickerVisible] =
    useState(false);
  const [alterDateDayPickerVisible, setAlterDateDayPickerVisible] =
    useState(false);
  const [alterDateMonthPickerVisible, setAlterDateMonthPickerVisible] =
    useState(false);
  const hasInitializedStatusFilter = useRef(false);
  const providerFetchKeyRef = useRef('');
  const tasksStore = useStore('tasks');
  const opportunitiesGetters = tasksStore.getters;
  const opportunitiesActions = tasksStore.actions;
  const {
    items: opportunities,
    totalItems,
    isLoading,
    error,
  } = opportunitiesGetters;
  const peopleStore = useStore('people');
  const getters = peopleStore.getters;
  const peopleActions = peopleStore.actions;
  const statusStore = useStore('status');
  const statusGetters = statusStore.getters;
  const statusActions = statusStore.actions;
  const { items: status, isLoading: isStatusLoading } = statusGetters;
  const categoriesStore = useStore('categories');
  const categoriesGetters = categoriesStore.getters;
  const categoriesActions = categoriesStore.actions;
  const { items: categories } = categoriesGetters;
  const { currentCompany, isLoading: isPeopleLoading } = getters;
  const authStore = useStore('auth');
  const authGetters = authStore.getters;
  const { user } = authGetters;


  const getStatusFilterKey = useCallback(item => {
    return getOpportunityStatusFilterKey(item);
  }, []);

  const getStatusFilterLabel = useCallback(item => {
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
  }, []);

  const getOptionIdentity = useCallback(item => {
    if (!item) {
      return '';
    }
    return (
      item['@id'] ||
      item.id ||
      item.value ||
      item.status ||
      item.name ||
      ''
    );
  }, []);

  const isQuestionLikeIcon = useCallback(iconName => {
    const normalized = String(iconName || '')
      .trim()
      .toLowerCase();
    if (!normalized) {
      return true;
    }

    if (
      normalized === '?' ||
      normalized === 'help' ||
      normalized === 'unknown' ||
      normalized.includes('question') ||
      normalized.includes('help')
    ) {
      return true;
    }

    return false;
  }, []);

  const isValidFontAwesomeIcon = useCallback(iconName => {
    const normalized = String(iconName || '').trim();
    if (!normalized) {
      return false;
    }

    if (!FONT_AWESOME_GLYPH_MAP) {
      return true;
    }

    return Object.prototype.hasOwnProperty.call(
      FONT_AWESOME_GLYPH_MAP,
      normalized,
    );
  }, []);

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
          itemsPerPage: 100,
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
      taskFor: env.APP_TYPE === 'CRM' && user?.people ? `/people/${user.people}` : null, //Tasks for this user only
      provider: currentCompany.id,
      page,
      itemsPerPage: itemsPerPage,
    };

    if (query) {
      params['peoples.people.name'] = query;
    }

    if (filterParam) {
      if (filterParam.startsWith('/statuses/')) {
        params.taskStatus = filterParam;
      } else if (filterParam.startsWith('realStatus:')) {
        params['taskStatus.realStatus'] = filterParam.replace(
          'realStatus:',
          '',
        );
      }
    }

    return params;
  }, [
    currentCompany?.id,
    currentPage,
    itemsPerPage,
    searchQuery,
    statusFilterParam,
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

      return () => { };
    }, [buildOpportunityParams, currentCompany?.id, fetchProviderOptions]),
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
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: global.t?.t('people', 'header', 'opportunities'),
    });
  }, [navigation]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage, selectedStatusFilterKey]);

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
      item => getStatusFilterKey(item) === selectedStatusFilterKey,
    );

    if (!statusExists) {
      setSelectedStatusFilterKey('');
    }
  }, [status, selectedStatusFilterKey, getStatusFilterKey]);

  useEffect(() => {
    if (selectedStatusFilterKey || status.length === 0) {
      return;
    }

    const defaultStatusFilterKey = resolveDefaultOpportunityStatusFilterKey(
      status,
    );

    if (defaultStatusFilterKey) {
      setSelectedStatusFilterKey(defaultStatusFilterKey);
    }
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

  const normalizeSearchValue = useCallback(value => {
    if (value == null) {
      return '';
    }

    return String(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }, []);

  const normalizePeopleReferenceForSearch = useCallback(value => {
    if (!value) {
      return '';
    }

    const rawValue = typeof value === 'object' ? value?.['@id'] ?? value?.id : value;
    const normalized = String(rawValue || '').trim();
    if (!normalized) {
      return '';
    }

    if (normalized.startsWith('/people/') || normalized.startsWith('/peoples/')) {
      return normalized;
    }

    if (/^\d+$/.test(normalized)) {
      return `/people/${normalized}`;
    }

    return normalized;
  }, []);

  const getOpportunityClientIdentity = useCallback(
    opportunity => {
      const client = opportunity?.client;
      let name = '';
      let alias = '';

      if (client && typeof client === 'object') {
        name = String(client?.name || client?.realname || '').trim();
        alias = String(client?.alias || client?.nickname || '').trim();
      }

      const clientReference = normalizePeopleReferenceForSearch(client);
      if (clientReference && Array.isArray(knownPeople)) {
        const matched = knownPeople.find(item => {
          return normalizePeopleReferenceForSearch(item) === clientReference;
        });

        if (matched) {
          if (!name) {
            name = String(matched?.name || matched?.realname || '').trim();
          }
          if (!alias) {
            alias = String(matched?.alias || matched?.nickname || '').trim();
          }
        }
      }

      return { name, alias };
    },
    [knownPeople, normalizePeopleReferenceForSearch],
  );

  const visibleOpportunities = React.useMemo(() => {
    const normalizedQuery = normalizeSearchValue(searchQuery);
    if (!normalizedQuery) {
      return allOpportunities;
    }

    return allOpportunities.filter(opportunity => {
      const clientIdentity = getOpportunityClientIdentity(opportunity);
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
  }, [
    allOpportunities,
    getOpportunityClientIdentity,
    normalizeSearchValue,
    searchQuery,
  ]);

  const showStatusFilterSkeleton =
    isStatusLoading || isStatusFilterBootstrapping;

  const getCurrentDateComponents = () => {
    const today = new Date();
    return {
      day: String(today.getDate()).padStart(2, '0'),
      month: String(today.getMonth() + 1).padStart(2, '0'),
      year: String(today.getFullYear()),
    };
  };

  const productCategories = categories.filter(
    cat => cat.context === 'relationship',
  );

  const criticalityCategories = categories.filter(
    cat => cat.context === 'relationship-criticality',
  );
  const reasonCategories = categories.filter(
    cat => cat.context === 'relationship-reason',
  );

  const onRefresh = async () => {
    setRefreshing(true);
    const params = buildOpportunityParams({ page: 1 });
    if (params) {
      opportunitiesActions.getItems(params);
    }
    setCurrentPage(1);
    setRefreshing(false);
  };

  const getStageColor = status => {
    const colors = {
      open: '#f39c12',
      closed: '#27ae60',
      pending: '#3498db',
      canceled: '#e74c3c',
    };
    return colors[status] || '#95a5a6';
  };

  const getStageLabel = status => {
    const labels = {
      open: global.t?.t('people', 'status', 'open'),
      closed: global.t?.t('people', 'status', 'closed'),
      pending: global.t?.t('people', 'status', 'pending'),
      canceled: global.t?.t('people', 'status', 'canceled'),
    };
    return labels[status] || status || global.t?.t('people', 'status', 'noStatus');
  };

  const getColorWithAlpha = (colorValue, alpha = '20') => {
    const color = String(colorValue || '').trim();
    return /^#[0-9a-fA-F]{6}$/.test(color) ? `${color}${alpha}` : '#EEF2FF';
  };

  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-br', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateForInput = dateString => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDateComponents = dateString => {
    if (!dateString) {
      return { day: '', month: '', year: '' };
    }
    const date = new Date(dateString);
    return {
      day: String(date.getDate()).padStart(2, '0'),
      month: String(date.getMonth() + 1).padStart(2, '0'),
      year: String(date.getFullYear()),
    };
  };

  const formatDateFromComponents = (day, month, year) => {
    if (!day || !month || !year) {
      return '';
    }
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const normalizePeopleReference = normalizePeopleReferenceValue;

  const getPersonByReference = useCallback(
    value => {
      const reference = normalizePeopleReference(value);
      if (!reference || !Array.isArray(knownPeople)) {
        return null;
      }

      return (
        knownPeople.find(item => normalizePeopleReference(item) === reference) || null
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

  const getDaysArray = () => {
    return Array.from({ length: 31 }, (_, i) => ({
      id: String(i + 1).padStart(2, '0'),
      name: String(i + 1).padStart(2, '0'),
    }));
  };

  const getMonthsArray = () => {
    const months = [
      global.t?.t('people', 'month', 'january'),
      global.t?.t('people', 'month', 'february'),
      global.t?.t('people', 'month', 'march'),
      global.t?.t('people', 'month', 'april'),
      global.t?.t('people', 'month', 'may'),
      global.t?.t('people', 'month', 'june'),
      global.t?.t('people', 'month', 'july'),
      global.t?.t('people', 'month', 'august'),
      global.t?.t('people', 'month', 'september'),
      global.t?.t('people', 'month', 'october'),
      global.t?.t('people', 'month', 'november'),
      global.t?.t('people', 'month', 'december'),
    ];
    return months.map((month, index) => ({
      id: String(index + 1).padStart(2, '0'),
      name: month,
    }));
  };

  const handleOpportunityPress = opportunity => {
    navigation.navigate('CrmConversation', { opportunity });
  };

  const handleEditProvider = useCallback(
    opportunity => {
      const reference = normalizePeopleReference(opportunity?.client);
      if (!reference) {
        showError?.(
          global.t?.t('people', 'toast', 'providerNotIdentified'),
        );
        return;
      }

      const matchedPerson = getPersonByReference(opportunity?.client);
      const selectedClient =
        matchedPerson ||
        (typeof opportunity?.client === 'object' && opportunity?.client
          ? opportunity.client
          : null) ||
        {
          id: extractId(reference),
          '@id': reference,
          name: getProviderName(opportunity?.client) || global.t?.t('people', 'label', 'client'),
        };

      navigation.navigate('ClientDetails', { client: selectedClient });
    },
    [
      getProviderName,
      getPersonByReference,
      navigation,
      normalizePeopleReference,
      showError,
    ],
  );

  const sanitizePhoneValue = value =>
    String(value || '')
      .replace(/\D/g, '')
      .slice(0, 11);

  const hasDuplicatePhones = phones => {
    const uniquePhones = new Set();

    for (const phone of phones) {
      if (uniquePhones.has(phone)) {
        return true;
      }
      uniquePhones.add(phone);
    }

    return false;
  };

  const formatPhoneValue = value => {
    const digits = sanitizePhoneValue(value);
    if (!digits) {
      return '';
    }

    const ddd = digits.slice(0, 2);
    const number = digits.slice(2);

    if (digits.length <= 2) {
      return `(${ddd}`;
    }

    if (number.length <= 4) {
      return `(${ddd}) ${number}`;
    }

    if (number.length <= 8) {
      return `(${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`;
    }

    return `(${ddd}) ${number.slice(0, 5)}-${number.slice(5, 9)}`;
  };

  const parsePhoneNumbers = announce => {
    if (!announce) {
      return [];
    }

    const asFormattedList = value => {
      const formatted = formatPhoneValue(value);
      return formatted ? [formatted] : [];
    };

    try {
      const parsed = JSON.parse(announce);

      if (Array.isArray(parsed)) {
        return parsed.map(item => formatPhoneValue(item)).filter(Boolean);
      }

      if (typeof parsed === 'string' || typeof parsed === 'number') {
        return asFormattedList(parsed);
      }

      if (parsed && typeof parsed === 'object') {
        const mergedPhone = parsed.ddd && parsed.phone
          ? `${parsed.ddd}${parsed.phone}`
          : parsed.phone || parsed.number || parsed.value;
        return asFormattedList(mergedPhone);
      }

      return [];
    } catch {
      return asFormattedList(announce);
    }
  };

  const handleEditOpportunity = opportunity => {
    const dueDateComponents = parseDateComponents(opportunity.dueDate);
    const alterDateComponents = parseDateComponents(opportunity.alterDate);
    const phones = parsePhoneNumbers(opportunity.announce);
    const todayComponents = getCurrentDateComponents();
    setEditingOpportunity({
      ...opportunity,
      dueDate: opportunity.dueDate
        ? formatDateForInput(opportunity.dueDate)
        : '',
      alterDate: opportunity.alterDate
        ? formatDateForInput(opportunity.alterDate)
        : '',
      dueDateDay: dueDateComponents.day || todayComponents.day,
      dueDateMonth: dueDateComponents.month || todayComponents.month,
      dueDateYear: dueDateComponents.year || todayComponents.year,
      alterDateDay: alterDateComponents.day,
      alterDateMonth: alterDateComponents.month,
      alterDateYear: alterDateComponents.year,
      announce: opportunity.announce || '',
      phones: phones,
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    try {
      const dueDate = formatDateFromComponents(
        editingOpportunity.dueDateDay,
        editingOpportunity.dueDateMonth,
        editingOpportunity.dueDateYear,
      );
      const alterDate = formatDateFromComponents(
        editingOpportunity.alterDateDay,
        editingOpportunity.alterDateMonth,
        editingOpportunity.alterDateYear,
      );

      const validPhones = (editingOpportunity.phones || [])
        .map(phone => sanitizePhoneValue(phone))
        .filter(Boolean);

      if (hasDuplicatePhones(validPhones)) {
        showError(global.t?.t('people', 'toast', 'duplicatePhone'));
        return;
      }

      const phoneData =
        validPhones.length > 0 ? JSON.stringify(validPhones) : '';

      const dataToSave = {
        id: editingOpportunity.id,
        client: normalizePeopleReference(editingOpportunity?.client),
        taskStatus:
          editingOpportunity.taskStatus?.['@id'] ||
          editingOpportunity.taskStatus?.id,
        category:
          editingOpportunity.category?.['@id'] ||
          editingOpportunity.category?.id,
        criticality:
          editingOpportunity.criticality?.['@id'] ||
          editingOpportunity.criticality?.id,
        reason:
          editingOpportunity.reason?.['@id'] || editingOpportunity.reason?.id,
        dueDate: dueDate,
        alterDate: alterDate,
        announce: phoneData,
        provider_id: currentCompany.id,
      };
      await opportunitiesActions.save(dataToSave);

      setEditModalVisible(false);
      setEditingOpportunity(null);

      showSuccess(global.t?.t('people', 'toast', 'opportunityUpdated'));
    } catch (error) {
      console.error('Erro ao salvar:', error);
      showError(global.t?.t('people', 'toast', 'saveChangesError'));
    }
  };

  const handleSaveNewOpportunity = async () => {
    try {
      const clientId = normalizePeopleReference(newOpportunity?.client);
      const taskStatusId =
        newOpportunity?.taskStatus?.['@id'] || newOpportunity?.taskStatus?.id;
      const categoryId =
        newOpportunity?.category?.['@id'] || newOpportunity?.category?.id;
      const criticalityId =
        newOpportunity?.criticality?.['@id'] ||
        newOpportunity?.criticality?.id;
      const reasonId =
        newOpportunity?.reason?.['@id'] || newOpportunity?.reason?.id;

      const dueDateDay = newOpportunity?.dueDateDay;
      const dueDateMonth = newOpportunity?.dueDateMonth;
      const dueDateYear = (newOpportunity?.dueDateYear || '').trim();

      const missingFields = [];
      if (!clientId) missingFields.push(global.t?.t('people', 'required', 'provider'));
      if (!taskStatusId) missingFields.push(global.t?.t('people', 'required', 'status'));
      if (!categoryId) missingFields.push(global.t?.t('people', 'required', 'category'));
      if (!criticalityId) missingFields.push(global.t?.t('people', 'required', 'criticality'));
      if (!reasonId) missingFields.push(global.t?.t('people', 'required', 'leadSource'));
      if (!dueDateDay || !dueDateMonth || !dueDateYear) {
        missingFields.push(global.t?.t('people', 'required', 'returnDate'));
      }

      if (missingFields.length > 0) {
        showError(
          global.t?.t('people', 'toast', 'requiredFieldsPrefix') +
          ` ${missingFields.join(', ')}.`,
        );
        return;
      }

      if (!/^\d{4}$/.test(dueDateYear)) {
        showError(global.t?.t('people', 'toast', 'invalidDueYear'));
        return;
      }

      const dueDate = formatDateFromComponents(
        dueDateDay,
        dueDateMonth,
        dueDateYear,
      );

      const dueDateObj = new Date(`${dueDate}T00:00:00`);
      const isValidDueDate =
        dueDate &&
        !Number.isNaN(dueDateObj.getTime()) &&
        String(dueDateObj.getDate()).padStart(2, '0') === dueDateDay &&
        String(dueDateObj.getMonth() + 1).padStart(2, '0') === dueDateMonth &&
        String(dueDateObj.getFullYear()) === dueDateYear;

      if (!isValidDueDate) {
        showError(global.t?.t('people', 'toast', 'invalidReturnDate'));
        return;
      }

      const validPhones = (newOpportunity?.phones || [])
        .map(phone => sanitizePhoneValue(phone))
        .filter(Boolean);

      if (hasDuplicatePhones(validPhones)) {
        showError(global.t?.t('people', 'toast', 'duplicatePhone'));
        return;
      }

      const phoneData =
        validPhones.length > 0 ? JSON.stringify(validPhones) : '';

      const dataToSave = {
        client: clientId,
        registeredBy: clientId,
        taskStatus: taskStatusId,
        category: categoryId,
        criticality: criticalityId,
        reason: reasonId,
        type: 'relationship',
        dueDate: dueDate,
        announce: phoneData,
        provider: '/people/' + currentCompany.id,
      };

      await opportunitiesActions.save(dataToSave);

      setAddModalVisible(false);
      setNewOpportunity(null);

      showSuccess(global.t?.t('people', 'toast', 'opportunityCreated'));

      const params = buildOpportunityParams({ page: 1 });
      if (params) {
        opportunitiesActions.getItems(params);
      }
      setCurrentPage(1);
    } catch (error) {
      console.error('Erro ao criar:', error);
      showError(global.t?.t('people', 'toast', 'createOpportunityError'));
    }
  };

  const toggleStatus = opportunity => {
    const newStatus =
      opportunity.taskStatus.realStatus === 'open' ? 'closed' : 'open';
    console.log(
      `Alterando status da oportunidade ${opportunity.id} para: ${newStatus}`,
    );
  };

  const addPhoneInput = (isEdit = true) => {
    if (isEdit) {
      setEditingOpportunity(prev => ({
        ...prev,
        phones: [...(prev.phones || []), ''],
      }));
    } else {
      setNewOpportunity(prev => ({
        ...prev,
        phones: [...(prev.phones || []), ''],
      }));
    }
  };

  const removePhoneInput = (index, isEdit = true) => {
    if (isEdit) {
      setEditingOpportunity(prev => ({
        ...prev,
        phones: prev.phones.filter((_, i) => i !== index),
      }));
    } else {
      setNewOpportunity(prev => ({
        ...prev,
        phones: prev.phones.filter((_, i) => i !== index),
      }));
    }
  };

  const updatePhoneInput = (index, value, isEdit = true) => {
    const maskedValue = formatPhoneValue(value);

    if (isEdit) {
      setEditingOpportunity(prev => ({
        ...prev,
        phones: prev.phones.map((phone, i) => (i === index ? maskedValue : phone)),
      }));
    } else {
      setNewOpportunity(prev => ({
        ...prev,
        phones: prev.phones.map((phone, i) => (i === index ? maskedValue : phone)),
      }));
    }
  };

  const renderSkeletonCard = () => (
    <View style={styles.cardWrapper}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <View style={[styles.skeletonLine, { width: '60%', height: 16, marginBottom: 8 }]} />
            <View style={[styles.skeletonLine, { width: '80%', height: 13 }]} />
          </View>
          <View style={[styles.skeletonLine, { width: 72, height: 28, borderRadius: 10 }]} />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <View style={[styles.skeletonLine, { flex: 1, height: 12, marginRight: 8 }]} />
            <View style={[styles.skeletonLine, { flex: 1, height: 12 }]} />
          </View>
          <View style={styles.infoRow}>
            <View style={[styles.skeletonLine, { flex: 1, height: 12, marginRight: 8 }]} />
            <View style={[styles.skeletonLine, { flex: 1, height: 12 }]} />
          </View>
        </View>
        <View style={[styles.actionContainer, { marginTop: 12 }]}>
          <View style={[styles.skeletonLine, { flex: 1, height: 40, borderRadius: 12 }]} />
          <View style={[styles.skeletonLine, { flex: 1, height: 40, borderRadius: 12 }]} />
        </View>
      </View>
    </View>
  );

  const showInitialSkeleton =
    isLoading && allOpportunities.length === 0 && !isStatusFilterApplying;
  const showOpportunityCardsSkeleton =
    isStatusFilterApplying || (isLoading && allOpportunities.length === 0);

  const renderTopSkeleton = () => (
    <View style={styles.subHeader}>
      <View style={styles.searchRow}>
        <View style={[styles.skeletonLine, styles.searchSkeletonInput]} />
        <View style={[styles.skeletonLine, styles.searchSkeletonButton]} />
      </View>

      <View style={styles.statusFilterSection}>
        <View style={[styles.skeletonLine, styles.statusLabelSkeleton]} />
        <View style={styles.statusSkeletonRow}>
          {[1, 2, 3, 4].map(key => (
            <View
              key={key}
              style={[styles.skeletonLine, styles.statusChipSkeleton]}
            />
          ))}
        </View>
      </View>
    </View>
  );

  const renderOpportunityCard = opportunity => {
    const providerName = getProviderName(opportunity?.client);
    const showClientSkeleton =
      !providerName && isPeopleLoading && knownPeople.length === 0;

    return (
      <View key={opportunity.id} style={styles.cardWrapper}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.titleContainer}>
              {showClientSkeleton ? (
                <View style={[styles.skeletonLine, styles.opportunityTitleSkeleton]} />
              ) : (
                <Text style={styles.opportunityTitle}>
                  {providerName ||
                    global.t?.t('people', 'card', 'clientNotInformed')}
                </Text>
              )}
              <View style={styles.clientNameRow}>
                <Text style={styles.clientName}>#{opportunity.id}</Text>
                <TouchableOpacity
                  style={styles.editClientButton}
                  onPress={() => handleEditProvider(opportunity)}
                  activeOpacity={0.8}>
                  <Icon name="edit" size={12} color={colors.primary} />
                </TouchableOpacity>
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
                  {
                    backgroundColor:
                      getStageColor(opportunity.taskStatus?.realStatus) + '20',
                  },
                ]}
                onPress={() => toggleStatus(opportunity)}>
                <Text
                  style={[
                    styles.stageText,
                    { color: getStageColor(opportunity.taskStatus?.realStatus) },
                  ]}>
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
                  {opportunity.category?.name || global.t?.t('people', 'card', 'withoutCategory')}
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
                {parsePhoneNumbers(opportunity.announce).join(', ') || global.t?.t('people', 'card', 'notAvailable')}
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
              <Icon name="edit" size={16} color="#f39c12" />
              <Text style={[styles.actionButtonText, { color: '#f39c12' }]}>
                {global.t?.t('people', 'action', 'edit')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const getSelectModalEmptyConfig = (title) => {
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

    if (
      normalizedTitle.includes('dia') ||
      normalizedTitle.includes('mês')
    ) {
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

  const renderSelectModal = (
    title,
    items,
    selectedItem,
    onSelect,
    visible,
    setVisible,
    renderKey = 'name',
  ) => {
    const emptyCfg = getSelectModalEmptyConfig(title);
    const safeItems = Array.isArray(items) ? items : [];
    const normalizedTitle = String(title || '').toLowerCase();
    const selectedIdentity = getOptionIdentity(selectedItem);
    const isStatusModal =
      normalizedTitle.includes('status') ||
      renderKey === 'status';
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
      <AnimatedModal
        visible={visible}
        onRequestClose={() => setVisible(false)}>
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
                  : item[renderKey] || item.name || item.status || global.t?.t('people', 'label', 'withoutName');

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
                          color={
                            isSelected ? colors.primary : '#3498db'
                          }
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

  const renderPhoneInputs = (phones = [], isEdit = true) => (
    <View style={styles.phoneInputsContainer}>
      {phones.length === 0 && (
        <TouchableOpacity
          style={styles.addPhoneButton}
          onPress={() => addPhoneInput(isEdit)}>
          <Icon name="plus" size={16} color="#27ae60" />
          <Text style={styles.addPhoneText}>{global.t?.t('people', 'action', 'addPhone')}</Text>
        </TouchableOpacity>
      )}

      {phones.map((phone, index) => (
        <View key={index} style={styles.phoneInputRow}>
          <TextInput
            style={[styles.textInput, styles.phoneInput]}
            value={phone}
            onChangeText={text => updatePhoneInput(index, text, isEdit)}
            placeholder="(11) 99999-9999"
            placeholderTextColor="#6c757d"
            keyboardType="phone-pad"
            maxLength={15}
          />
          <TouchableOpacity
            style={styles.removePhoneButton}
            onPress={() => removePhoneInput(index, isEdit)}>
            <Icon name="trash" size={16} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      ))}

      {phones.length > 0 && (
        <TouchableOpacity
          style={styles.addPhoneButton}
          onPress={() => addPhoneInput(isEdit)}>
          <Icon name="plus" size={16} color="#27ae60" />
          <Text style={styles.addPhoneText}>{global.t?.t('people', 'action', 'addAnotherPhone')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderProviderSelectModal = () => (
    <AnimatedModal
      visible={providerPickerVisible}
      onRequestClose={closeProviderPicker}>
      <View style={styles.selectModalContent}>
        <View style={styles.selectModalHeader}>
          <Text style={styles.selectModalTitle}>
            {global.t?.t('people', 'modal', 'selectProvider')}
          </Text>
          <TouchableOpacity
            onPress={closeProviderPicker}
            style={styles.closeButton}>
            <Icon name="times" size={20} color="#7f8c8d" />
          </TouchableOpacity>
        </View>

        <View style={styles.selectModalSearchSection}>
          <View style={styles.searchInputContainer}>
            <Icon name="search" size={16} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder={global.t?.t('people', 'search', 'placeholder')}
              placeholderTextColor="#94A3B8"
              value={providerSearchText}
              onChangeText={setProviderSearchText}
            />
            {providerSearchText.length > 0 && (
              <TouchableOpacity
                onPress={() => setProviderSearchText('')}
                style={styles.clearSearchButton}>
                <Icon name="times-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView style={styles.selectModalBody}>
          {isProviderSearchLoading && providerOptions.length === 0 ? (
            <View style={styles.providerSearchLoadingState}>
              <ActivityIndicator color={colors.primary} size="small" />
            </View>
          ) : providerOptions.length > 0 ? (
            providerOptions
              .filter((person, index, source) => {
                const currentRef = normalizePeopleReference(person);
                if (!currentRef) {
                  return true;
                }

                return (
                  source.findIndex(
                    candidate =>
                      normalizePeopleReference(candidate) === currentRef,
                  ) === index
                );
              })
              .map((person, index) => {
                const selectedClientRef = normalizePeopleReference(
                  editModalVisible
                    ? editingOpportunity?.client
                    : newOpportunity?.client,
                );
                const personRef = normalizePeopleReference(person);
                const personKey =
                  personRef ||
                  `person-${person.id || 'sem-id'}-${person.document || 'sem-doc'}-${person.name || 'sem-nome'}-${index}`;
                const isSelected =
                  Boolean(selectedClientRef) &&
                  Boolean(personRef) &&
                  selectedClientRef === personRef;

                return (
                  <TouchableOpacity
                    key={personKey}
                    style={[
                      styles.selectOption,
                      isSelected && styles.selectOptionActive,
                    ]}
                    onPress={() => {
                      const clientData = {
                        '@id': personRef || person['@id'] || '',
                        id: person.id ?? personRef,
                        name: person.name,
                        document: person.document,
                      };

                      if (editModalVisible) {
                        setEditingOpportunity(prev => ({
                          ...prev,
                          client: clientData,
                        }));
                      } else {
                        setNewOpportunity(prev => ({
                          ...prev,
                          client: clientData,
                        }));
                      }
                      closeProviderPicker();
                    }}>
                    <View style={styles.personInfo}>
                      <View style={styles.avatarContainer}>
                        <Icon name="user" size={20} color="#3498db" />
                      </View>
                      <View style={styles.personDetails}>
                        <Text
                          style={[
                            styles.personAlias,
                            isSelected && styles.selectOptionTextActive,
                          ]}>
                          {person.alias}
                        </Text>
                        <Text style={styles.personName}>
                          {person.peopleType === 'J' ? ' (PJ)' : ' (PF)'} {person.name}
                        </Text>
                      </View>
                    </View>
                    {isSelected && (
                      <Icon name="check-circle" size={20} color="#27ae60" />
                    )}
                  </TouchableOpacity>
                );
              })
          ) : (
            <View style={styles.emptyState}>
              <Icon name="user" size={48} color="#bdc3c7" />
              <Text style={styles.emptyText}>
                {global.t?.t('people', 'empty', 'noProviderFound')}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </AnimatedModal>
  );

  const renderEditModal = () => (
    <AnimatedModal
      visible={editModalVisible}
      onRequestClose={() => setEditModalVisible(false)}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {global.t?.t('people', 'modal', 'editOpportunity')}
            {editingOpportunity?.id}
          </Text>
          <TouchableOpacity
            onPress={() => setEditModalVisible(false)}
            style={styles.closeButton}>
            <Icon name="times" size={20} color="#7f8c8d" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalBody}>
          <View style={styles.editSection}>
            <Text style={styles.editLabel}>{global.t?.t('people', 'form', 'provider')}</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setProviderPickerVisible(true)}>
              <View style={styles.selectButtonContent}>
                <Icon
                  name="user"
                  size={16}
                  color="#3498db"
                  style={styles.selectButtonIcon}
                />
                <Text style={styles.selectButtonText}>
                  {getProviderName(editingOpportunity?.client) ||
                    global.t?.t('people', 'form', 'selectProvider')}
                </Text>
              </View>
              <Icon name="chevron-down" size={16} color="#7f8c8d" />
            </TouchableOpacity>
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editLabel}>{global.t?.t('people', 'form', 'status')}</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setStatusPickerVisible(true)}>
              <View style={styles.selectButtonContent}>
                {editingOpportunity?.taskStatus?.color && (
                  <View
                    style={[
                      styles.selectButtonDot,
                      { backgroundColor: editingOpportunity.taskStatus.color },
                    ]}
                  />
                )}
                <Text style={styles.selectButtonText}>
                  {getStatusFilterLabel(editingOpportunity?.taskStatus) ||
                    global.t?.t('people', 'form', 'selectStatus')}
                </Text>
              </View>
              <Icon name="chevron-down" size={16} color="#7f8c8d" />
            </TouchableOpacity>
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editLabel}>{global.t?.t('people', 'form', 'category')}</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setCategoryPickerVisible(true)}>
              <View style={styles.selectButtonContent}>
                <Text style={styles.selectButtonText}>
                  {editingOpportunity?.category?.name ||
                    global.t?.t('people', 'form', 'selectCategory')}
                </Text>
              </View>
              <Icon name="chevron-down" size={16} color="#7f8c8d" />
            </TouchableOpacity>
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editLabel}>{global.t?.t('people', 'form', 'criticality')}</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setCriticalityPickerVisible(true)}>
              <View style={styles.selectButtonContent}>
                <Text style={styles.selectButtonText}>
                  {editingOpportunity?.criticality?.name ||
                    global.t?.t('people', 'form', 'selectCriticality')}
                </Text>
              </View>
              <Icon name="chevron-down" size={16} color="#7f8c8d" />
            </TouchableOpacity>
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editLabel}>{global.t?.t('people', 'form', 'leadSource')}</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setReasonPickerVisible(true)}>
              <View style={styles.selectButtonContent}>
                {editingOpportunity?.reason?.icon &&
                  isValidFontAwesomeIcon(editingOpportunity?.reason?.icon) &&
                  !isQuestionLikeIcon(editingOpportunity?.reason?.icon) && (
                    <Icon
                      name={editingOpportunity.reason.icon}
                      size={16}
                      color="#9b59b6"
                      style={styles.selectButtonIcon}
                    />
                  )}
                <Text style={styles.selectButtonText}>
                  {editingOpportunity?.reason?.name || global.t?.t('people', 'form', 'selectReason')}
                </Text>
              </View>
              <Icon name="chevron-down" size={16} color="#7f8c8d" />
            </TouchableOpacity>
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editLabel}>{global.t?.t('people', 'form', 'phones')}</Text>
            {renderPhoneInputs(editingOpportunity?.phones || [], true)}
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editLabel}>{global.t?.t('people', 'form', 'returnDate')}</Text>
            <View style={styles.datePickerContainer}>
              <TouchableOpacity
                style={[styles.dateSelectButton, { flex: 1 }]}
                onPress={() => setDueDateDayPickerVisible(true)}>
                <Text style={styles.dateSelectText}>
                  {editingOpportunity?.dueDateDay || global.t?.t('people', 'form', 'day')}
                </Text>
                <Icon name="chevron-down" size={16} color="#7f8c8d" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dateSelectButton, { flex: 2 }]}
                onPress={() => setDueDateMonthPickerVisible(true)}>
                <Text style={styles.dateSelectText}>
                  {editingOpportunity?.dueDateMonth
                    ? getMonthsArray().find(
                      m => m.id === editingOpportunity.dueDateMonth,
                    )?.name
                    : global.t?.t('people', 'form', 'month')}
                </Text>
                <Icon name="chevron-down" size={16} color="#7f8c8d" />
              </TouchableOpacity>

              <TextInput
                style={[styles.dateSelectButton, styles.yearInput, { flex: 1 }]}
                value={editingOpportunity?.dueDateYear || ''}
                onChangeText={text => {
                  setEditingOpportunity(prev => ({
                    ...prev,
                    dueDateYear: text,
                  }));
                }}
                placeholder={global.t?.t('people', 'form', 'year')}
                placeholderTextColor="#6c757d"
                keyboardType="numeric"
                maxLength={4}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButton]}
            onPress={() => setEditModalVisible(false)}>
            <Text style={styles.cancelButtonText}>{global.t?.t('people', 'action', 'cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.saveButton]}
            onPress={handleSaveEdit}>
            <Text style={styles.saveButtonText}>{global.t?.t('people', 'action', 'save')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AnimatedModal>
  );

  const renderAddModal = () => (
    <AnimatedModal
      visible={addModalVisible}
      onRequestClose={() => setAddModalVisible(false)}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{global.t?.t('people', 'modal', 'newOpportunity')}</Text>
          <TouchableOpacity
            onPress={() => setAddModalVisible(false)}
            style={styles.closeButton}>
            <Icon name="times" size={20} color="#7f8c8d" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalBody}>
          <View style={styles.editSection}>
            <Text style={styles.editLabel}>{global.t?.t('people', 'form', 'provider')}</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setProviderPickerVisible(true)}>
              <View style={styles.selectButtonContent}>
                <Icon
                  name="user"
                  size={16}
                  color="#3498db"
                  style={styles.selectButtonIcon}
                />
                <Text style={styles.selectButtonText}>
                  {getProviderName(newOpportunity?.client) ||
                    global.t?.t('people', 'form', 'selectProvider')}
                </Text>
              </View>
              <Icon name="chevron-down" size={16} color="#7f8c8d" />
            </TouchableOpacity>
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editLabel}>{global.t?.t('people', 'form', 'status')}</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setStatusPickerVisible(true)}>
              <View style={styles.selectButtonContent}>
                {newOpportunity?.taskStatus?.color && (
                  <View
                    style={[
                      styles.selectButtonDot,
                      { backgroundColor: newOpportunity.taskStatus.color },
                    ]}
                  />
                )}
                <Text style={styles.selectButtonText}>
                  {getStatusFilterLabel(newOpportunity?.taskStatus) ||
                    global.t?.t('people', 'form', 'selectStatus')}
                </Text>
              </View>
              <Icon name="chevron-down" size={16} color="#7f8c8d" />
            </TouchableOpacity>
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editLabel}>{global.t?.t('people', 'form', 'category')}</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setCategoryPickerVisible(true)}>
              <View style={styles.selectButtonContent}>
                <Text style={styles.selectButtonText}>
                  {newOpportunity?.category?.name ||
                    global.t?.t('people', 'form', 'selectCategory')}
                </Text>
              </View>
              <Icon name="chevron-down" size={16} color="#7f8c8d" />
            </TouchableOpacity>
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editLabel}>{global.t?.t('people', 'form', 'criticality')}</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setCriticalityPickerVisible(true)}>
              <View style={styles.selectButtonContent}>
                <Text style={styles.selectButtonText}>
                  {newOpportunity?.criticality?.name ||
                    global.t?.t('people', 'form', 'selectCriticality')}
                </Text>
              </View>
              <Icon name="chevron-down" size={16} color="#7f8c8d" />
            </TouchableOpacity>
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editLabel}>{global.t?.t('people', 'form', 'leadSource')}</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setReasonPickerVisible(true)}>
              <View style={styles.selectButtonContent}>
                {newOpportunity?.reason?.icon &&
                  isValidFontAwesomeIcon(newOpportunity?.reason?.icon) &&
                  !isQuestionLikeIcon(newOpportunity?.reason?.icon) && (
                    <Icon
                      name={newOpportunity.reason.icon}
                      size={16}
                      color="#9b59b6"
                      style={styles.selectButtonIcon}
                    />
                  )}
                <Text style={styles.selectButtonText}>
                  {newOpportunity?.reason?.name || global.t?.t('people', 'form', 'selectReason')}
                </Text>
              </View>
              <Icon name="chevron-down" size={16} color="#7f8c8d" />
            </TouchableOpacity>
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editLabel}>{global.t?.t('people', 'form', 'phones')}</Text>
            {renderPhoneInputs(newOpportunity?.phones || [], false)}
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editLabel}>{global.t?.t('people', 'form', 'returnDate')}</Text>
            <View style={styles.datePickerContainer}>
              <TouchableOpacity
                style={[styles.dateSelectButton, { flex: 1 }]}
                onPress={() => setDueDateDayPickerVisible(true)}>
                <Text style={styles.dateSelectText}>
                  {newOpportunity?.dueDateDay || global.t?.t('people', 'form', 'day')}
                </Text>
                <Icon name="chevron-down" size={16} color="#7f8c8d" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dateSelectButton, { flex: 2 }]}
                onPress={() => setDueDateMonthPickerVisible(true)}>
                <Text style={styles.dateSelectText}>
                  {newOpportunity?.dueDateMonth
                    ? getMonthsArray().find(
                      m => m.id === newOpportunity.dueDateMonth,
                    )?.name
                    : global.t?.t('people', 'form', 'month')}
                </Text>
                <Icon name="chevron-down" size={16} color="#7f8c8d" />
              </TouchableOpacity>

              <TextInput
                style={[styles.dateSelectButton, styles.yearInput, { flex: 1 }]}
                value={newOpportunity?.dueDateYear || ''}
                onChangeText={text => {
                  setNewOpportunity(prev => ({
                    ...prev,
                    dueDateYear: text,
                  }));
                }}
                placeholder={global.t?.t('people', 'form', 'year')}
                placeholderTextColor="#6c757d"
                keyboardType="numeric"
                maxLength={4}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButton]}
            onPress={() => setAddModalVisible(false)}>
            <Text style={styles.cancelButtonText}>{global.t?.t('people', 'action', 'cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.saveButton]}
            onPress={handleSaveNewOpportunity}>
            <Text style={styles.saveButtonText}>{global.t?.t('people', 'action', 'create')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AnimatedModal>
  );

  return (
    <View style={styles.container}>

      {showInitialSkeleton ? (
        renderTopSkeleton()
      ) : (
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
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                const todayComponents = getCurrentDateComponents();
                setNewOpportunity({
                  phones: [],
                  dueDateDay: todayComponents.day,
                  dueDateMonth: todayComponents.month,
                  dueDateYear: todayComponents.year,
                });
                setAddModalVisible(true);
              }}>
              <IconAdd name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.statusFilterSection}>
            <Text style={styles.statusFilterLabel}>{global.t?.t('people', 'filter', 'status')}</Text>
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
      )}

      <FlatList
        data={showOpportunityCardsSkeleton ? [] : visibleOpportunities}
        keyExtractor={item => String(item.id)}
        renderItem={({ item, index }) => renderOpportunityCard(item, index)}
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
                <View key={key}>{renderSkeletonCard()}</View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              {error ? (
                <>
                  <Icon name="exclamation-triangle" size={48} color="#e74c3c" />
                  <Text style={styles.loadingText}>{global.t?.t('people', 'state', 'loadError')}</Text>
                </>
              ) : (
                <>
                  <Icon name="line-chart" size={64} color="#bdc3c7" />
                  <Text style={styles.emptyTitle}>
                    {searchQuery
                      ? global.t?.t('people', 'state', 'noOpportunityFound')
                      : global.t?.t('people', 'state', 'noOpportunity')}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {searchQuery
                      ? global.t?.t('people', 'state', 'tryOtherTerms')
                      : global.t?.t('people', 'state', 'addFirstOpportunity')}
                  </Text>
                </>
              )}
            </View>
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
              {renderSkeletonCard()}
              {renderSkeletonCard()}
            </View>
          ) : null
        }
      />

      {renderEditModal()}
      {renderAddModal()}

      {
        renderSelectModal(
          global.t?.t('people', 'modal', 'selectStatus'),
          status,
          editModalVisible
            ? editingOpportunity?.taskStatus
            : newOpportunity?.taskStatus,
          item => {
            if (editModalVisible) {
              setEditingOpportunity(prev => ({ ...prev, taskStatus: item }));
            } else {
              setNewOpportunity(prev => ({ ...prev, taskStatus: item }));
            }
          },
          statusPickerVisible,
          setStatusPickerVisible,
          'status',
        )
      }

      {
        renderSelectModal(
          global.t?.t('people', 'modal', 'selectCategory'),
          productCategories,
          editModalVisible
            ? editingOpportunity?.category
            : newOpportunity?.category,
          item => {
            if (editModalVisible) {
              setEditingOpportunity(prev => ({ ...prev, category: item }));
            } else {
              setNewOpportunity(prev => ({ ...prev, category: item }));
            }
          },
          categoryPickerVisible,
          setCategoryPickerVisible,
          'name',
        )
      }

      {
        renderSelectModal(
          global.t?.t('people', 'modal', 'selectCriticality'),
          criticalityCategories,
          editModalVisible
            ? editingOpportunity?.criticality
            : newOpportunity?.criticality,
          item => {
            if (editModalVisible) {
              setEditingOpportunity(prev => ({ ...prev, criticality: item }));
            } else {
              setNewOpportunity(prev => ({ ...prev, criticality: item }));
            }
          },
          criticalityPickerVisible,
          setCriticalityPickerVisible,
          'name',
        )
      }

      {
        renderSelectModal(
          global.t?.t('people', 'modal', 'selectReason'),
          reasonCategories,
          editModalVisible ? editingOpportunity?.reason : newOpportunity?.reason,
          item => {
            if (editModalVisible) {
              setEditingOpportunity(prev => ({ ...prev, reason: item }));
            } else {
              setNewOpportunity(prev => ({ ...prev, reason: item }));
            }
          },
          reasonPickerVisible,
          setReasonPickerVisible,
          'name',
        )
      }

      {renderProviderSelectModal()}

      {
        renderSelectModal(
          global.t?.t('people', 'modal', 'selectDay'),
          getDaysArray(),
          {
            id: editModalVisible
              ? editingOpportunity?.dueDateDay
              : newOpportunity?.dueDateDay,
          },
          item => {
            if (editModalVisible) {
              setEditingOpportunity(prev => ({ ...prev, dueDateDay: item.id }));
            } else {
              setNewOpportunity(prev => ({ ...prev, dueDateDay: item.id }));
            }
          },
          dueDateDayPickerVisible,
          setDueDateDayPickerVisible,
          'name',
        )
      }

      {
        renderSelectModal(
          global.t?.t('people', 'modal', 'selectMonth'),
          getMonthsArray(),
          {
            id: editModalVisible
              ? editingOpportunity?.dueDateMonth
              : newOpportunity?.dueDateMonth,
          },
          item => {
            if (editModalVisible) {
              setEditingOpportunity(prev => ({ ...prev, dueDateMonth: item.id }));
            } else {
              setNewOpportunity(prev => ({ ...prev, dueDateMonth: item.id }));
            }
          },
          dueDateMonthPickerVisible,
          setDueDateMonthPickerVisible,
          'name',
        )
      }

      {
        renderSelectModal(
          global.t?.t('people', 'modal', 'selectDay'),
          getDaysArray(),
          {
            id: editModalVisible
              ? editingOpportunity?.alterDateDay
              : newOpportunity?.alterDateDay,
          },
          item => {
            if (editModalVisible) {
              setEditingOpportunity(prev => ({ ...prev, alterDateDay: item.id }));
            } else {
              setNewOpportunity(prev => ({ ...prev, alterDateDay: item.id }));
            }
          },
          alterDateDayPickerVisible,
          setAlterDateDayPickerVisible,
          'name',
        )
      }

      {
        renderSelectModal(
          global.t?.t('people', 'modal', 'selectMonth'),
          getMonthsArray(),
          {
            id: editModalVisible
              ? editingOpportunity?.alterDateMonth
              : newOpportunity?.alterDateMonth,
          },
          item => {
            if (editModalVisible) {
              setEditingOpportunity(prev => ({ ...prev, alterDateMonth: item.id }));
            } else {
              setNewOpportunity(prev => ({ ...prev, alterDateMonth: item.id }));
            }
          },
          alterDateMonthPickerVisible,
          setAlterDateMonthPickerVisible,
          'name',
        )
      }

      {

      }
    </View >
  );
}
