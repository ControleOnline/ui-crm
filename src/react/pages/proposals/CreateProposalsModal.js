import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Keyboard, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useStore } from '@store';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AnimatedModal from '@controleonline/ui-common/src/react/components/AnimatedModal';
import useToastMessage from '../../hooks/useToastMessage';
import { buildOwnedClientsParams, getPeopleDisplayName } from '@controleonline/ui-common/src/react/utils/peopleDisplay';
import styles, {
  inlineStyle_482_6,
  inlineStyle_502_67,
  inlineStyle_517_71,
} from './CreateProposalsModal.styles';

import {
  addProductsToOrder,
  createLinkedOrder,
  normalizeEntityId,
  searchCompanyProducts,
} from '@controleonline/ui-common/src/react/utils/commercialDocumentOrders';

const {
  formatApiError,
  formatProposalStartDate,
  MONTHS_SHORT,
} = require('../../utils/proposalCreateHelpers');

const {
  filterProductsByModelCategory,
  getProposalModelCategoryId,
  getProposalModelCategoryName,
  keepCompatibleSelectedProducts,
} = require('../../utils/proposalProductSelection');

import CreateProposalsProductSection from './CreateProposalsProductSection';
import {
  ModelSelectModal,
  ClientSelectModal,
  DayPickerModal,
  MonthPickerModal,
} from './CreateProposalsPickers';
const CreateProposalsModal = ({ visible, onClose, onSuccess }) => {
  const { showError, showSuccess } = useToastMessage();
  const contractStore = useStore('contract');
  const contractActions = contractStore.actions;
  const peopleStore = useStore('people');
  const peopleGetters = peopleStore.getters;
  const peopleActions = peopleStore.actions;
  const modelsStore = useStore('models');
  const modelsActions = modelsStore.actions;

  const { currentCompany } = peopleGetters;
  const people = useMemo(
    () => (Array.isArray(peopleGetters?.items) ? peopleGetters.items : []),
    [peopleGetters?.items],
  );

  const [isLoading, setIsLoading] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [contractModels, setContractModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [startDay, setStartDay] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [startYear, setStartYear] = useState('');
  const [modelPickerVisible, setModelPickerVisible] = useState(false);
  const [clientPickerVisible, setClientPickerVisible] = useState(false);
  const [dayPickerVisible, setDayPickerVisible] = useState(false);
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [productSearchLoading, setProductSearchLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);

  const selectedContractModel = useMemo(
    () => contractModels.find(model => model['@id'] === selectedModel) || null,
    [contractModels, selectedModel],
  );

  const selectedModelCategoryId = useMemo(
    () => getProposalModelCategoryId(selectedContractModel),
    [selectedContractModel],
  );

  const selectedModelCategoryName = useMemo(
    () => getProposalModelCategoryName(selectedContractModel),
    [selectedContractModel],
  );

  useEffect(() => {
    if (visible) {
      loadInitialData();
    }
  }, [visible, currentCompany?.id]);

  useEffect(() => {
    if (!visible || !currentCompany?.id) {
      setProductResults([]);
      setProductSearchLoading(false);
      return undefined;
    }

    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      setProductSearchLoading(true);
      try {
        const results = await searchCompanyProducts({
          companyId: currentCompany.id,
          query: productQuery,
        });

        const filteredResults = filterProductsByModelCategory({
          products: results,
          selectedModelCategoryId,
        });

        if (!cancelled) {
          setProductResults(filteredResults);
        }
      } catch (error) {
        if (!cancelled) {
          setProductResults([]);
        }
      } finally {
        if (!cancelled) {
          setProductSearchLoading(false);
        }
      }
    }, String(productQuery || '').trim() ? 250 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [visible, currentCompany?.id, productQuery, selectedModelCategoryId]);

  useEffect(() => {
    setSelectedProducts(currentItems =>
      keepCompatibleSelectedProducts({
        selectedProducts: currentItems,
        selectedModelCategoryId,
      }),
    );
  }, [selectedModelCategoryId]);

  const selectedProductIds = useMemo(
    () => new Set(selectedProducts.map(product => normalizeEntityId(product))),
    [selectedProducts],
  );

  const selectedClientName = useMemo(
    () => getPeopleDisplayName(people.find(person => person['@id'] === selectedClient)) || '',
    [people, selectedClient],
  );

  const selectedModelName = useMemo(
    () => selectedContractModel?.model || selectedContractModel?.name || '',
    [selectedContractModel],
  );

  const loadInitialData = async () => {
    try {
      if (!currentCompany?.id) {
        return;
      }

      const clientParams = buildOwnedClientsParams({
        currentCompanyId: currentCompany.id,
      });

      await Promise.all([
        clientParams ? peopleActions.getItems(clientParams) : Promise.resolve([]),
        loadContractModels(),
      ]);
    } catch (error) {
      showError(formatApiError(error));
    }
  };

  const loadContractModels = async () => {
    setLoadingModels(true);
    try {
      if (!currentCompany?.id) {
        setContractModels([]);
        return;
      }

      const currentCompanyId = normalizeEntityId(currentCompany.id);
      const companyIri = `/people/${currentCompanyId}`;
      const response = await modelsActions.getItems({
        context: 'proposal',
        company: companyIri,
        people: currentCompanyId,
      });

      const filteredModels = Array.isArray(response)
        ? response.filter(model => {
            const modelCompanyId = normalizeEntityId(
              model?.people?.['@id'] ||
                model?.people ||
                model?.company?.['@id'] ||
                model?.company,
            );

            return !modelCompanyId || modelCompanyId === currentCompanyId;
          })
        : [];

      setContractModels(filteredModels);
    } catch (error) {
      setContractModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  const toggleSelectedProduct = product => {
    const productId = normalizeEntityId(product);
    if (!productId) {
      return;
    }

    setSelectedProducts(currentItems => {
      if (currentItems.some(item => normalizeEntityId(item) === productId)) {
        return currentItems.filter(item => normalizeEntityId(item) !== productId);
      }

      return [...currentItems, product];
    });
  };

  const handleSubmit = async () => {
    const startDate = formatProposalStartDate(startYear, startMonth, startDay);

    if (!selectedModel || !selectedClient) {
      showError('Selecione o modelo e o responsavel da empresa cliente.');
      return;
    }

    if (!startDate) {
      showError('Informe uma data inicial valida.');
      return;
    }

    setIsLoading(true);
    try {
      const contractData = {
        contractModel: selectedModel,
        provider: `/people/${currentCompany.id}`,
        client: selectedClient,
        startDate,
      };

      const createdProposal = await contractActions.save(contractData);
      const createdOrder = await createLinkedOrder({
        contractRef: createdProposal?.['@id'],
        provider: `/people/${currentCompany.id}`,
        client: selectedClient,
        payer: selectedClient,
        app: 'CRM',
        orderType: 'sale',
      });

      if (selectedProducts.length > 0) {
        await addProductsToOrder({
          orderId: createdOrder?.id || createdOrder?.['@id'],
          products: selectedProducts.map(product => ({
            product,
            quantity: 1,
          })),
        });
      }

      showSuccess(
        selectedProducts.length > 0
          ? 'Proposta criada com os produtos selecionados.'
          : 'Proposta criada. Voce podera adicionar produtos depois.',
      );
      onSuccess?.();
      handleClose();
    } catch (error) {
      showError(formatApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedModel('');
    setSelectedClient('');
    setStartDay('');
    setStartMonth('');
    setStartYear('');
    setProductQuery('');
    setProductResults([]);
    setSelectedProducts([]);
  };

  const handleClose = () => {
    resetForm();
    onClose?.();
  };

  return (
    <AnimatedModal
      visible={visible}
      onRequestClose={handleClose}
      style={inlineStyle_482_6}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Criar nova proposta</Text>
          <TouchableOpacity onPress={handleClose} style={styles.headerCloseButton}>
            <Icon name="close" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalBody}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Modelo da proposta <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity style={styles.selectInput} onPress={() => setModelPickerVisible(true)}>
              <View style={styles.selectInputContent}>
                <Icon name="description" size={20} color="#2529a1" style={inlineStyle_502_67} />
                <Text style={[styles.selectInputText, { color: selectedModel ? '#1A1A1A' : '#999999' }]}>
                  {selectedModelName || 'Selecionar modelo'}
                </Text>
              </View>
              <Icon name="keyboard-arrow-down" size={24} color="#666666" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Responsavel / cliente <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity style={styles.selectInput} onPress={() => setClientPickerVisible(true)}>
              <View style={styles.selectInputContent}>
                <Icon name="business-center" size={20} color="#2529a1" style={inlineStyle_517_71} />
                <Text style={[styles.selectInputText, { color: selectedClient ? '#1A1A1A' : '#999999' }]}>
                  {selectedClientName || 'Selecionar responsavel'}
                </Text>
              </View>
              <Icon name="keyboard-arrow-down" size={24} color="#666666" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Data de inicio <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.dateContainer}>
              <TouchableOpacity style={styles.selectInputDate} onPress={() => setDayPickerVisible(true)}>
                <Text style={[styles.selectInputText, !startDay && styles.placeholderText]}>
                  {startDay || 'Dia'}
                </Text>
                <Icon name="arrow-drop-down" size={20} color="#666666" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.selectInputDate} onPress={() => setMonthPickerVisible(true)}>
                <Text style={[styles.selectInputText, !startMonth && styles.placeholderText]}>
                  {startMonth ? MONTHS_SHORT[parseInt(startMonth, 10) - 1] : 'Mes'}
                </Text>
                <Icon name="arrow-drop-down" size={20} color="#666666" />
              </TouchableOpacity>
              <TextInput
                style={styles.yearInput}
                value={startYear}
                onChangeText={text =>
                  setStartYear(String(text || '').replace(/\D/g, '').slice(0, 4))
                }
                placeholder="2026"
                placeholderTextColor="#999999"
                keyboardType="numeric"
                maxLength={4}
              />
            </View>
          </View>

          <CreateProposalsProductSection
            productQuery={productQuery}
            onChangeQuery={setProductQuery}
            productSearchLoading={productSearchLoading}
            productResults={productResults}
            selectedProducts={selectedProducts}
            selectedProductIds={selectedProductIds}
            onToggleProduct={toggleSelectedProduct}
            categoryName={selectedModelCategoryName}
            normalizeEntityId={normalizeEntityId}
          />
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              Keyboard.dismiss();
              handleClose();
            }}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.createButton,
              (!selectedModel || !selectedClient || !formatProposalStartDate(startYear, startMonth, startDay)) &&
                styles.createButtonDisabled,
            ]}
            onPress={() => {
              Keyboard.dismiss();
              handleSubmit();
            }}
            disabled={isLoading || !selectedModel || !selectedClient || !formatProposalStartDate(startYear, startMonth, startDay)}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.createButtonText}>Salvar proposta</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
      <ModelSelectModal
        visible={modelPickerVisible}
        onClose={() => setModelPickerVisible(false)}
        loadingModels={loadingModels}
        contractModels={contractModels}
        selectedModel={selectedModel}
        onSelect={modelId => {
          setSelectedModel(modelId);
          setModelPickerVisible(false);
        }}
      />
      <ClientSelectModal
        visible={clientPickerVisible}
        onClose={() => setClientPickerVisible(false)}
        people={people}
        selectedClient={selectedClient}
        onSelect={clientId => {
          setSelectedClient(clientId);
          setClientPickerVisible(false);
        }}
      />
      <DayPickerModal
        visible={dayPickerVisible}
        onClose={() => setDayPickerVisible(false)}
        startDay={startDay}
        onSelect={day => {
          setStartDay(day);
          setDayPickerVisible(false);
        }}
      />
      <MonthPickerModal
        visible={monthPickerVisible}
        onClose={() => setMonthPickerVisible(false)}
        startMonth={startMonth}
        onSelect={month => {
          setStartMonth(month);
          setMonthPickerVisible(false);
        }}
      />
    </AnimatedModal>
  );
};

export default CreateProposalsModal;
