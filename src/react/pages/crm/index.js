import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
} from 'react-native';
import { Text } from 'react-native-animatable';
import Icon from 'react-native-vector-icons/FontAwesome';
import IconAdd from 'react-native-vector-icons/MaterialIcons';
import IconWhatsApp from 'react-native-vector-icons/FontAwesome';

import CompanySelector from '../../components/CompanySelector';
import AnimatedModal from '../../components/AnimatedModal';
import { FlatList } from 'react-native';

import { useStore } from '@store';
import { colors } from '@controleonline/../../src/styles/colors';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import useToastMessage from '../../hooks/useToastMessage';
import translateWithFallback from '../../utils/translateWithFallback';

const FONT_AWESOME_GLYPH_MAP = Icon?.getRawGlyphMap
  ? Icon.getRawGlyphMap()
  : null;

export default function CrmIndex() {
  const {showSuccess, showError} = useToastMessage();
  const navigation = useNavigation();
  const tr = useCallback(
    (type, key, fallback) => translateWithFallback('tasks', type, key, fallback),
    [],
  );
  // ... rest of component
  const [refreshing, setRefreshing] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newOpportunity, setNewOpportunity] = useState(null);
  const [statusPickerVisible, setStatusPickerVisible] = useState(false);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [criticalityPickerVisible, setCriticalityPickerVisible] =
    useState(false);
  const [beneficiaryPickerVisible, setBeneficiaryPickerVisible] =
    useState(false);
  const [reasonPickerVisible, setReasonPickerVisible] = useState(false);


  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState(''); // Debounced value
  const [selectedStatusFilterKey, setSelectedStatusFilterKey] = useState('');
  const [isStatusFilterBootstrapping, setIsStatusFilterBootstrapping] =
    useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [allOpportunities, setAllOpportunities] = useState([]);
  const [showItemsPerPageDropdown, setShowItemsPerPageDropdown] =
    useState(false);
  const [dueDateDayPickerVisible, setDueDateDayPickerVisible] = useState(false);
  const [dueDateMonthPickerVisible, setDueDateMonthPickerVisible] =
    useState(false);
  const [alterDateDayPickerVisible, setAlterDateDayPickerVisible] =
    useState(false);
  const [alterDateMonthPickerVisible, setAlterDateMonthPickerVisible] =
    useState(false);
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
  const { currentCompany, items: people, isLoading: isPeopleLoading } = getters;

  const getStatusFilterKey = useCallback(item => {
    if (!item) {
      return '';
    }

    if (item['@id']) {
      return item['@id'];
    }

    if (item.id != null) {
      return `/statuses/${item.id}`;
    }

    const realStatus = String(item.realStatus || item.status || '')
      .trim()
      .toLowerCase();
    return realStatus ? `realStatus:${realStatus}` : '';
  }, []);

  const getStatusFilterLabel = useCallback(item => {
    const normalized = String(item?.realStatus || item?.status || '')
      .trim()
      .toLowerCase();

    const labels = {
      open: tr('status', 'open', 'Em Aberto'),
      pending: tr('status', 'pending', 'Pendente'),
      closed: tr('status', 'closed', 'Fechado'),
      cancelled: tr('status', 'cancelled', 'Cancelado'),
      cancelado: tr('status', 'cancelledPt', 'Cancelado'),
      ativo: tr('status', 'active', 'Ativo'),
      inativo: tr('status', 'inactive', 'Inativo'),
    };

    return labels[normalized] || item?.status || tr('status', 'noStatus', 'Sem status');
  }, [tr]);

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
      provider_id: currentCompany.id,
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
      let isMounted = true;

      const params = buildOpportunityParams();
      if (params) {
        opportunitiesActions.getItems(params);
        peopleActions.getItems({
          company: '/people/' + currentCompany.id,
          link_type: 'client',
        });
      }

      const loadStatusFilters = async () => {
        setIsStatusFilterBootstrapping(true);
        try {
          await statusActions.getItems({ context: 'relationship' });
        } finally {
          if (isMounted) {
            setIsStatusFilterBootstrapping(false);
          }
        }
      };
      loadStatusFilters().catch(() => null);

      categoriesActions.getItems({
        context: [
          'relationship',
          'relationship-criticality',
          'relationship-reason',
          'products',
        ],
      });

      return () => {
        isMounted = false;
      };
    }, [buildOpportunityParams, currentCompany?.id]),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: tr('header', 'opportunities', 'Oportunidades'),
      headerRight: () => <CompanySelector mode="icon" />,
    });
  }, [navigation, tr]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage, selectedStatusFilterKey]);

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

  // Debounce search input


  // Debounce curto para busca em tempo real (300ms)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearchQuery(searchText.trim());
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchText]);

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
      if (clientReference && Array.isArray(people)) {
        const matched = people.find(item => {
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
    [normalizePeopleReferenceForSearch, people],
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
        // Keep server-side matched rows visible even if client data is partial.
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
      cancelled: '#e74c3c',
    };
    return colors[status] || '#95a5a6';
  };

  const getStageLabel = status => {
    const labels = {
      open: tr('status', 'open', 'Em Aberto'),
      closed: tr('status', 'closed', 'Fechado'),
      pending: tr('status', 'pending', 'Pendente'),
      cancelled: tr('status', 'cancelled', 'Cancelado'),
    };
    return labels[status] || status || tr('status', 'noStatus', 'Sem status');
  };

  const getColorWithAlpha = (colorValue, alpha = '20') => {
    const color = String(colorValue || '').trim();
    return /^#[0-9a-fA-F]{6}$/.test(color) ? `${color}${alpha}` : '#EEF2FF';
  };

  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
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

  const normalizePeopleReference = useCallback(value => {
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
  }, []);

  const getPersonByReference = useCallback(
    value => {
      const reference = normalizePeopleReference(value);
      if (!reference || !Array.isArray(people)) {
        return null;
      }

      return (
        people.find(item => normalizePeopleReference(item) === reference) || null
      );
    },
    [normalizePeopleReference, people],
  );

  const getBeneficiaryName = useCallback(
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
      tr('month', 'january', 'Janeiro'),
      tr('month', 'february', 'Fevereiro'),
      tr('month', 'march', 'Março'),
      tr('month', 'april', 'Abril'),
      tr('month', 'may', 'Maio'),
      tr('month', 'june', 'Junho'),
      tr('month', 'july', 'Julho'),
      tr('month', 'august', 'Agosto'),
      tr('month', 'september', 'Setembro'),
      tr('month', 'october', 'Outubro'),
      tr('month', 'november', 'Novembro'),
      tr('month', 'december', 'Dezembro'),
    ];
    return months.map((month, index) => ({
      id: String(index + 1).padStart(2, '0'),
      name: month,
    }));
  };

  const handleOpportunityPress = opportunity => {
    navigation.navigate('CrmConversation', { opportunity });
  };

  const handleEditBeneficiary = useCallback(
    opportunity => {
      const reference = normalizePeopleReference(opportunity?.client);
      if (!reference) {
        showError?.(
          tr(
            'toast',
            'beneficiaryNotIdentified',
            'Nao foi possivel identificar o beneficiario desta oportunidade.',
          ),
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
          name: getBeneficiaryName(opportunity?.client) || tr('label', 'client', 'Cliente'),
        };

      navigation.navigate('ClientDetails', { client: selectedClient });
    },
    [
      getBeneficiaryName,
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
      // If it's not JSON, treat as single phone number
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

      // Format phones as JSON array for API
      const validPhones = (editingOpportunity.phones || [])
        .map(phone => sanitizePhoneValue(phone))
        .filter(Boolean);

      if (hasDuplicatePhones(validPhones)) {
        showError(tr('toast', 'duplicatePhone', 'Nao e permitido salvar telefones duplicados.'));
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

      showSuccess(tr('toast', 'opportunityUpdated', 'Oportunidade atualizada com sucesso!'));
    } catch (error) {
      console.error('Erro ao salvar:', error);
      showError(tr('toast', 'saveChangesError', 'Nao foi possivel salvar as alteracoes'));
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
      if (!clientId) missingFields.push(tr('required', 'beneficiary', 'beneficiario'));
      if (!taskStatusId) missingFields.push(tr('required', 'status', 'status'));
      if (!categoryId) missingFields.push(tr('required', 'category', 'categoria'));
      if (!criticalityId) missingFields.push(tr('required', 'criticality', 'criticidade'));
      if (!reasonId) missingFields.push(tr('required', 'reason', 'motivo'));
      if (!dueDateDay || !dueDateMonth || !dueDateYear) {
        missingFields.push(tr('required', 'returnDate', 'data de retorno'));
      }

      if (missingFields.length > 0) {
        showError(
          tr('toast', 'requiredFieldsPrefix', 'Preencha os campos obrigatorios:') +
            ` ${missingFields.join(', ')}.`,
        );
        return;
      }

      if (!/^\d{4}$/.test(dueDateYear)) {
        showError(tr('toast', 'invalidDueYear', 'Ano da data de vencimento invalido.'));
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
        showError(tr('toast', 'invalidReturnDate', 'Data de retorno invalida.'));
        return;
      }

      // Format phones as JSON array for API
      const validPhones = (newOpportunity?.phones || [])
        .map(phone => sanitizePhoneValue(phone))
        .filter(Boolean);

      if (hasDuplicatePhones(validPhones)) {
        showError(tr('toast', 'duplicatePhone', 'Nao e permitido salvar telefones duplicados.'));
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

      showSuccess(tr('toast', 'opportunityCreated', 'Oportunidade criada com sucesso!'));

      const params = buildOpportunityParams({ page: 1 });
      if (params) {
        opportunitiesActions.getItems(params);
      }
      setCurrentPage(1);
    } catch (error) {
      console.error('Erro ao criar:', error);
      showError(tr('toast', 'createOpportunityError', 'Nao foi possivel criar a oportunidade'));
    }
  };

  const toggleStatus = opportunity => {
    const newStatus =
      opportunity.taskStatus.realStatus === 'open' ? 'closed' : 'open';
    console.log(
      `Alterando status da oportunidade ${opportunity.id} para: ${newStatus}`,
    );
    // opportunitiesActions.updateStatus(opportunity.id, newStatus);
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

  const showInitialSkeleton = isLoading && allOpportunities.length === 0;

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

  const renderOpportunityCard = (opportunity, index) => (
    <View key={opportunity.id} style={styles.cardWrapper}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.opportunityTitle}>
              {tr('card', 'opportunityNumber', 'Oportunidade #')}
              {opportunity.id}
            </Text>
            <View style={styles.clientNameRow}>
              {(() => {
                const beneficiaryName = getBeneficiaryName(opportunity?.client);
                const showClientSkeleton =
                  !beneficiaryName && (isPeopleLoading || people == null);

                if (showClientSkeleton) {
                  return (
                    <View
                      style={[styles.skeletonLine, styles.clientNameSkeleton]}
                    />
                  );
                }

                return (
                  <>
                    <Text style={styles.clientName}>
                      {beneficiaryName ||
                        tr('card', 'clientNotInformed', 'Cliente nao informado')}
                    </Text>
                    <TouchableOpacity
                      style={styles.editClientButton}
                      onPress={() => handleEditBeneficiary(opportunity)}
                      activeOpacity={0.8}>
                      <Icon name="edit" size={12} color={colors.primary} />
                    </TouchableOpacity>
                  </>
                );
              })()}
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
                {opportunity.category?.name || tr('card', 'withoutCategory', 'Sem categoria')}
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
              {tr('card', 'phones', 'Telefones')}:{' '}
              {parsePhoneNumbers(opportunity.announce).join(', ') || tr('card', 'notAvailable', 'N/A')}
            </Text>
          </View>
        )}

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.chatButton]}
            onPress={() => handleOpportunityPress(opportunity)}>
            <IconWhatsApp name="whatsapp" size={16} color="#25D366" />
            <Text style={[styles.actionButtonText, { color: '#25D366' }]}>
              {tr('action', 'chat', 'Conversar')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditOpportunity(opportunity)}>
            <Icon name="edit" size={16} color="#f39c12" />
            <Text style={[styles.actionButtonText, { color: '#f39c12' }]}>
              {tr('action', 'edit', 'Editar')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const getSelectModalEmptyConfig = (title) => {
    const normalizedTitle = String(title || '').toLowerCase();

    if (normalizedTitle.includes('categoria')) {
      return {
        icon: 'tags',
        title: tr('modal', 'noCategories', 'Nao ha categorias para exibir'),
        subtitle: tr(
          'modal',
          'noCategoriesHint',
          'Verifique se existem categorias cadastradas para esta empresa.',
        ),
      };
    }

    if (normalizedTitle.includes('status')) {
      return {
        icon: 'flag',
        title: tr('modal', 'noStatus', 'Nao ha status para exibir'),
        subtitle: tr(
          'modal',
          'noStatusHint',
          'Verifique a configuracao de status disponivel no contexto atual.',
        ),
      };
    }

    if (normalizedTitle.includes('criticidade')) {
      return {
        icon: 'exclamation-circle',
        title: tr('modal', 'noCriticalities', 'Nao ha criticidades para exibir'),
        subtitle: tr(
          'modal',
          'noCriticalitiesHint',
          'Verifique se ha opcoes cadastradas para esta empresa.',
        ),
      };
    }

    if (normalizedTitle.includes('motivo')) {
      return {
        icon: 'question-circle',
        title: tr('modal', 'noReasons', 'Nao ha motivos para exibir'),
        subtitle: tr(
          'modal',
          'noReasonsHint',
          'Verifique se ha motivos cadastrados no contexto atual.',
        ),
      };
    }

    if (
      normalizedTitle.includes('dia') ||
      normalizedTitle.includes('mês') ||
      normalizedTitle.includes('mes')
    ) {
      return {
        icon: 'calendar',
        title: tr('modal', 'noOptions', 'Nenhuma opcao disponivel'),
        subtitle: tr('modal', 'tryAgainSoon', 'Tente novamente em alguns instantes.'),
      };
    }

    return {
      icon: 'inbox',
      title: tr('modal', 'nothingToShow', 'Nada para exibir'),
      subtitle: tr('modal', 'noOptionsNow', 'Nao ha opcoes disponiveis no momento.'),
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
                  : item[renderKey] || item.name || item.status || tr('label', 'withoutName', 'Sem nome');

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
          <Text style={styles.addPhoneText}>{tr('action', 'addPhone', 'Adicionar telefone')}</Text>
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
          <Text style={styles.addPhoneText}>{tr('action', 'addAnotherPhone', 'Adicionar outro telefone')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderBeneficiarySelectModal = () => (
    <AnimatedModal
      visible={beneficiaryPickerVisible}
      onRequestClose={() => setBeneficiaryPickerVisible(false)}>
      <View style={styles.selectModalContent}>
        <View style={styles.selectModalHeader}>
          <Text style={styles.selectModalTitle}>
            {tr('modal', 'selectBeneficiary', 'Selecionar Beneficiario')}
          </Text>
          <TouchableOpacity
            onPress={() => setBeneficiaryPickerVisible(false)}
            style={styles.closeButton}>
            <Icon name="times" size={20} color="#7f8c8d" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.selectModalBody}>
          {people && people.length > 0 ? (
            people
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
                  setBeneficiaryPickerVisible(false);
                }}>
                <View style={styles.personInfo}>
                  <View style={styles.avatarContainer}>
                    <Icon name="user" size={20} color="#3498db" />
                  </View>
                  <View style={styles.personDetails}>
                    <Text
                      style={[
                        styles.personName,
                        isSelected && styles.selectOptionTextActive,
                      ]}>
                      {person.name}
                    </Text>
                    {person.document && (
                      <Text style={styles.personDocument}>
                        {typeof person.document === 'string'
                          ? person.document
                          : 'Documento disponível'}
                      </Text>
                    )}
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
                {tr('empty', 'noBeneficiaryFound', 'Nenhum beneficiario encontrado')}
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
            {tr('modal', 'editOpportunity', 'Editar Oportunidade #')}
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
            <Text style={styles.editLabel}>{tr('form', 'beneficiary', 'Beneficiario')}</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setBeneficiaryPickerVisible(true)}>
              <View style={styles.selectButtonContent}>
                <Icon
                  name="user"
                  size={16}
                  color="#3498db"
                  style={styles.selectButtonIcon}
                />
                <Text style={styles.selectButtonText}>
                  {getBeneficiaryName(editingOpportunity?.client) ||
                    tr('form', 'selectBeneficiary', 'Selecione um beneficiario')}
                </Text>
              </View>
              <Icon name="chevron-down" size={16} color="#7f8c8d" />
            </TouchableOpacity>
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editLabel}>{tr('form', 'status', 'Status')}</Text>
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
                    tr('form', 'selectStatus', 'Selecione um status')}
                </Text>
              </View>
              <Icon name="chevron-down" size={16} color="#7f8c8d" />
            </TouchableOpacity>
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editLabel}>{tr('form', 'category', 'Categoria')}</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setCategoryPickerVisible(true)}>
              <View style={styles.selectButtonContent}>
                <Text style={styles.selectButtonText}>
                  {editingOpportunity?.category?.name ||
                    tr('form', 'selectCategory', 'Selecione uma categoria')}
                </Text>
              </View>
              <Icon name="chevron-down" size={16} color="#7f8c8d" />
            </TouchableOpacity>
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editLabel}>{tr('form', 'criticality', 'Criticidade')}</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setCriticalityPickerVisible(true)}>
              <View style={styles.selectButtonContent}>
                <Text style={styles.selectButtonText}>
                  {editingOpportunity?.criticality?.name ||
                    tr('form', 'selectCriticality', 'Selecione uma criticidade')}
                </Text>
              </View>
              <Icon name="chevron-down" size={16} color="#7f8c8d" />
            </TouchableOpacity>
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editLabel}>{tr('form', 'reason', 'Motivo')}</Text>
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
                  {editingOpportunity?.reason?.name || tr('form', 'selectReason', 'Selecione um motivo')}
                </Text>
              </View>
              <Icon name="chevron-down" size={16} color="#7f8c8d" />
            </TouchableOpacity>
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editLabel}>{tr('form', 'phones', 'Telefones')}</Text>
            {renderPhoneInputs(editingOpportunity?.phones || [], true)}
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editLabel}>{tr('form', 'returnDate', 'Data de Retorno')}</Text>
            <View style={styles.datePickerContainer}>
              <TouchableOpacity
                style={[styles.dateSelectButton, { flex: 1 }]}
                onPress={() => setDueDateDayPickerVisible(true)}>
                <Text style={styles.dateSelectText}>
                  {editingOpportunity?.dueDateDay || tr('form', 'day', 'Dia')}
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
                    : tr('form', 'month', 'Mês')}
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
                placeholder={tr('form', 'year', 'Ano')}
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
            <Text style={styles.cancelButtonText}>{tr('action', 'cancel', 'Cancelar')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.saveButton]}
            onPress={handleSaveEdit}>
            <Text style={styles.saveButtonText}>{tr('action', 'save', 'Salvar')}</Text>
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
          <Text style={styles.modalTitle}>{tr('modal', 'newOpportunity', 'Nova Oportunidade')}</Text>
          <TouchableOpacity
            onPress={() => setAddModalVisible(false)}
            style={styles.closeButton}>
            <Icon name="times" size={20} color="#7f8c8d" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalBody}>
          <View style={styles.editSection}>
            <Text style={styles.editLabel}>{tr('form', 'beneficiary', 'Beneficiario')}</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setBeneficiaryPickerVisible(true)}>
              <View style={styles.selectButtonContent}>
                <Icon
                  name="user"
                  size={16}
                  color="#3498db"
                  style={styles.selectButtonIcon}
                />
                <Text style={styles.selectButtonText}>
                  {getBeneficiaryName(newOpportunity?.client) ||
                    tr('form', 'selectBeneficiary', 'Selecione um beneficiario')}
                </Text>
              </View>
              <Icon name="chevron-down" size={16} color="#7f8c8d" />
            </TouchableOpacity>
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editLabel}>{tr('form', 'status', 'Status')}</Text>
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
                    tr('form', 'selectStatus', 'Selecione um status')}
                </Text>
              </View>
              <Icon name="chevron-down" size={16} color="#7f8c8d" />
            </TouchableOpacity>
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editLabel}>{tr('form', 'category', 'Categoria')}</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setCategoryPickerVisible(true)}>
              <View style={styles.selectButtonContent}>
                <Text style={styles.selectButtonText}>
                  {newOpportunity?.category?.name ||
                    tr('form', 'selectCategory', 'Selecione uma categoria')}
                </Text>
              </View>
              <Icon name="chevron-down" size={16} color="#7f8c8d" />
            </TouchableOpacity>
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editLabel}>{tr('form', 'criticality', 'Criticidade')}</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setCriticalityPickerVisible(true)}>
              <View style={styles.selectButtonContent}>
                <Text style={styles.selectButtonText}>
                  {newOpportunity?.criticality?.name ||
                    tr('form', 'selectCriticality', 'Selecione uma criticidade')}
                </Text>
              </View>
              <Icon name="chevron-down" size={16} color="#7f8c8d" />
            </TouchableOpacity>
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editLabel}>{tr('form', 'reason', 'Motivo')}</Text>
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
                  {newOpportunity?.reason?.name || tr('form', 'selectReason', 'Selecione um motivo')}
                </Text>
              </View>
              <Icon name="chevron-down" size={16} color="#7f8c8d" />
            </TouchableOpacity>
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editLabel}>{tr('form', 'phones', 'Telefones')}</Text>
            {renderPhoneInputs(newOpportunity?.phones || [], false)}
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editLabel}>{tr('form', 'returnDate', 'Data de Retorno')}</Text>
            <View style={styles.datePickerContainer}>
              <TouchableOpacity
                style={[styles.dateSelectButton, { flex: 1 }]}
                onPress={() => setDueDateDayPickerVisible(true)}>
                <Text style={styles.dateSelectText}>
                  {newOpportunity?.dueDateDay || tr('form', 'day', 'Dia')}
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
                    : tr('form', 'month', 'Mês')}
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
                placeholder={tr('form', 'year', 'Ano')}
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
            <Text style={styles.cancelButtonText}>{tr('action', 'cancel', 'Cancelar')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.saveButton]}
            onPress={handleSaveNewOpportunity}>
            <Text style={styles.saveButtonText}>{tr('action', 'create', 'Criar')}</Text>
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
                placeholder={tr('search', 'placeholder', 'Buscar cliente...')}
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
            <Text style={styles.statusFilterLabel}>{tr('filter', 'status', 'Status')}</Text>
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
                      {tr('filter', 'all', 'Todos')}
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
        data={visibleOpportunities}
        keyExtractor={item => String(item.id)}
        renderItem={({ item, index }) => renderOpportunityCard(item, index)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={[
          styles.scrollContent,
          isLoading && allOpportunities.length === 0 && styles.scrollContentSkeleton,
        ]}
        ListEmptyComponent={() =>
          isLoading ? (
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
                  <Text style={styles.loadingText}>{tr('state', 'loadError', 'Erro ao carregar dados')}</Text>
                </>
              ) : (
                <>
                  <Icon name="line-chart" size={64} color="#bdc3c7" />
                  <Text style={styles.emptyTitle}>
                    {searchQuery
                      ? tr('state', 'noOpportunityFound', 'Nenhuma oportunidade encontrada')
                      : tr('state', 'noOpportunity', 'Nenhuma oportunidade')}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {searchQuery
                      ? tr('state', 'tryOtherTerms', 'Tente buscar com outros termos')
                      : tr('state', 'addFirstOpportunity', 'Adicione sua primeira oportunidade')}
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
          tr('modal', 'selectStatus', 'Selecionar Status'),
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
          tr('modal', 'selectCategory', 'Selecionar Categoria'),
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
          tr('modal', 'selectCriticality', 'Selecionar Criticidade'),
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
          tr('modal', 'selectReason', 'Selecionar Motivo'),
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

      {renderBeneficiarySelectModal()}

      {/* Date Pickers for Due Date */}
      {
        renderSelectModal(
          tr('modal', 'selectDay', 'Selecionar Dia'),
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
          tr('modal', 'selectMonth', 'Selecionar Mês'),
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

      {/* Date Pickers for Alter Date */}
      {
        renderSelectModal(
          tr('modal', 'selectDay', 'Selecionar Dia'),
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
          tr('modal', 'selectMonth', 'Selecionar Mês'),
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

      {/* Dropdown Overlay */}
      {

      }
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  subHeader: {
    paddingHorizontal: 16,
    paddingTop: 9,
    paddingBottom: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchSkeletonInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  searchSkeletonButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    height: 40,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 8,
    color: colors.text,
    fontSize: 14,
  },
  clearSearchButton: {
    padding: 4,
  },
  statusFilterSection: {
    marginTop: 10,
  },
  statusLabelSkeleton: {
    width: 52,
    height: 12,
    marginBottom: 8,
    borderRadius: 6,
  },
  statusSkeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  statusChipSkeleton: {
    width: 84,
    height: 30,
    borderRadius: 999,
    marginRight: 8,
  },
  statusFilterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  statusFilterRow: {
    paddingRight: 8,
  },
  statusFilterChip: {
    borderWidth: 1,
    borderColor: '#DCE3EC',
    backgroundColor: '#F8FAFC',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
  },
  statusFilterChipActive: {
    borderColor: colors.primary,
    backgroundColor: '#E7F3FF',
  },
  statusFilterChipText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  statusFilterChipTextActive: {
    color: colors.primary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  scrollContentSkeleton: {
    flexGrow: 1,
  },
  skeletonListWrapper: {
    paddingTop: 8,
  },
  skeletonFooter: {
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  skeletonLine: {
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    letterSpacing: -0.3,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 14,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  opportunitiesContainer: {
    gap: 12,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 10,
  },
  opportunityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  clientName: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '400',
    flex: 1,
  },
  clientNameSkeleton: {
    width: '68%',
    height: 12,
    borderRadius: 6,
    marginTop: 1,
    marginBottom: 1,
  },
  clientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  editClientButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E7F3FF',
    marginLeft: 8,
  },
  stageTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  stageText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  stageTagSkeleton: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 72,
  },
  stageTextSkeleton: {
    width: 52,
    height: 11,
    borderRadius: 6,
  },
  cardBody: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 5,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: 10,
  },
  responsibleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  responsibleText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 5,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  announceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  announceText: {
    fontSize: 12,
    color: '#8B5CF6',
    marginLeft: 5,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  chatButton: {
    borderColor: '#10B981',
    backgroundColor: '#10B98110',
  },
  editButton: {
    borderColor: '#F59E0B',
    backgroundColor: '#F59E0B10',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 5,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    height: '92%', // Almost full height
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 18,
  },
  editSection: {
    marginBottom: 18,
  },
  editLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  editInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
  },
  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectButtonDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  selectButtonIcon: {
    marginRight: 8,
  },
  selectButtonText: {
    fontSize: 15,
    color: '#0F172A',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
  },
  dateButtonText: {
    fontSize: 15,
    color: '#0F172A',
    marginLeft: 8,
  },
  selectModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    height: '82%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  selectModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  selectModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  selectModalBody: {
    flex: 1,
  },
  selectModalBodyContent: {
    paddingBottom: 8,
  },
  selectModalEmptyState: {
    flex: 1,
    paddingHorizontal: 22,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectModalEmptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectModalEmptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  selectModalEmptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  selectOptionActive: {
    backgroundColor: '#EEF2FF',
  },
  selectOptionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  selectOptionIcon: {
    marginRight: 10,
  },
  selectOptionText: {
    fontSize: 15,
    color: '#0F172A',
  },
  selectOptionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#94A3B8',
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  personDetails: {
    flex: 1,
  },
  personName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  personDocument: {
    fontSize: 12,
    color: '#94A3B8',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  datePickerContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dateSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
  },
  dateSelectText: {
    fontSize: 15,
    color: '#0F172A',
  },
  yearInput: {
    textAlign: 'center',
    justifyContent: 'center',
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  phoneInputsContainer: {
    gap: 10,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneInput: {
    flex: 1,
  },
  addPhoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 12,
    backgroundColor: '#10B98110',
    gap: 6,
  },
  addPhoneText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
  },
  removePhoneButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#F43F5E10',
  },
});
