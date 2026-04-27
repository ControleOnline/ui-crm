import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Keyboard, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useStore } from '@store';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AnimatedModal from '@controleonline/ui-crm/src/react/components/AnimatedModal';
import useToastMessage from '../../hooks/useToastMessage';
import Formatter from '@controleonline/ui-common/src/utils/formatter';
import { buildOwnedClientsParams, getPeopleDisplayName } from '@controleonline/ui-common/src/react/utils/peopleDisplay';
import styles from './CreateProposalsModal.styles';

import {
  addProductsToOrder,
  createLinkedOrder,
  normalizeEntityId,
  searchCompanyProducts,
} from '@controleonline/ui-common/src/react/utils/commercialDocumentOrders';

import {
  inlineStyle_482_6,
  inlineStyle_502_67,
  inlineStyle_517_71,
  inlineStyle_588_28,
  inlineStyle_615_26,
} from './CreateProposalsModal.styles';

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Marco',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const formatApiError = error => {
  if (!error) return 'Nao foi possivel criar a proposta.';
  if (typeof error === 'string') return error;
  if (Array.isArray(error?.message)) {
    return error.message
      .map(item => item?.message || item?.title || String(item))
      .filter(Boolean)
      .join('\n');
  }

  return error?.message || error?.description || error?.errmsg || 'Nao foi possivel criar a proposta.';
};

const normalizeCategoryId = value =>
  normalizeEntityId(
    value?.category ||
      value?.parent ||
      value?.['@id'] ||
      value?.id ||
      value,
  );

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
    () => normalizeCategoryId(selectedContractModel?.category),
    [selectedContractModel?.category],
  );
  const selectedModelCategoryName = useMemo(
    () => String(selectedContractModel?.category?.name || '').trim(),
    [selectedContractModel?.category?.name],
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
          itemsPerPage: selectedModelCategoryId ? 100 : 8,
        });
        const normalizedResults = Array.isArray(results) ? results : [];
        const filteredResults = selectedModelCategoryId
          ? normalizedResults.filter(
              product => normalizeCategoryId(product?.category) === selectedModelCategoryId,
            )
          : normalizedResults;

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
    if (!selectedModelCategoryId) {
      return;
    }

    setSelectedProducts(currentItems =>
      currentItems.filter(
        product => normalizeCategoryId(product?.category) === selectedModelCategoryId,
      ),
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
    () => selectedContractModel?.model || '',
    [selectedContractModel],
  );

  const loadInitialData = async () => {
    try {
      if (!currentCompany?.id) {
        return;
      }

      const clientParams = buildOwnedClientsParams({
        currentCompanyId: currentCompany.id,
        itemsPerPage: 100,
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

  const formatDate = (year, month, day) => {
    const normalizedYear = String(year || '').replace(/\D/g, '');
    const normalizedMonth = String(month || '').replace(/\D/g, '');
    const normalizedDay = String(day || '').replace(/\D/g, '');

    if (normalizedYear.length !== 4 || !normalizedMonth || !normalizedDay) {
      return null;
    }

    const parsedYear = parseInt(normalizedYear, 10);
    const parsedMonth = parseInt(normalizedMonth, 10);
    const parsedDay = parseInt(normalizedDay, 10);
    const candidate = new Date(parsedYear, parsedMonth - 1, parsedDay);
    const isValidDate =
      candidate.getFullYear() === parsedYear &&
      candidate.getMonth() === parsedMonth - 1 &&
      candidate.getDate() === parsedDay;

    if (!isValidDate) {
      return null;
    }

    return `${normalizedYear}-${normalizedMonth.padStart(2, '0')}-${normalizedDay.padStart(2, '0')}`;
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
    const startDate = formatDate(startYear, startMonth, startDay);

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

  const renderModelSelectModal = () => (
    <Modal
      animationType="slide"
      transparent
      visible={modelPickerVisible}
      onRequestClose={() => setModelPickerVisible(false)}>
      <View style={styles.pickerModalOverlay}>
        <View style={styles.pickerModalContent}>
          <View style={styles.pickerModalHeader}>
            <Text style={styles.pickerModalTitle}>Selecionar modelo da proposta</Text>
            <TouchableOpacity onPress={() => setModelPickerVisible(false)}>
              <Icon name="close" size={24} color="#666666" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerModalBody}>
            {loadingModels ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#2529a1" />
                <Text style={styles.loadingText}>Carregando modelos...</Text>
              </View>
            ) : contractModels.length > 0 ? (
              contractModels.map(model => (
                <TouchableOpacity
                  key={model['@id']}
                  style={[styles.selectOption, selectedModel === model['@id'] && styles.selectOptionActive]}
                  onPress={() => {
                    setSelectedModel(model['@id']);
                    setProductQuery('');
                    setProductResults([]);
                    setSelectedProducts([]);
                    setModelPickerVisible(false);
                  }}>
                  <View style={styles.optionInfo}>
                    <View style={styles.iconContainer}>
                      <Icon name="description" size={20} color="#2529a1" />
                    </View>
                    <Text style={[styles.optionName, selectedModel === model['@id'] && styles.selectOptionTextActive]}>
                      {model.model}
                    </Text>
                  </View>
                  {selectedModel === model['@id'] && (
                    <Icon name="check-circle" size={24} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Icon name="description" size={48} color="#CCCCCC" />
                <Text style={styles.emptyText}>Nenhum modelo encontrado.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderClientSelectModal = () => (
    <Modal
      animationType="slide"
      transparent
      visible={clientPickerVisible}
      onRequestClose={() => setClientPickerVisible(false)}>
      <View style={styles.pickerModalOverlay}>
        <View style={styles.pickerModalContent}>
          <View style={styles.pickerModalHeader}>
            <Text style={styles.pickerModalTitle}>Selecionar responsavel do cliente</Text>
            <TouchableOpacity onPress={() => setClientPickerVisible(false)}>
              <Icon name="close" size={24} color="#666666" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerModalBody}>
            {people.length > 0 ? (
              people.map(person => (
                <TouchableOpacity
                  key={person['@id']}
                  style={[styles.selectOption, selectedClient === person['@id'] && styles.selectOptionActive]}
                  onPress={() => {
                    setSelectedClient(person['@id']);
                    setClientPickerVisible(false);
                  }}>
                  <View style={styles.optionInfo}>
                    <View style={styles.iconContainer}>
                      <Icon name="person" size={20} color="#2529a1" />
                    </View>
                    <Text style={[styles.optionName, selectedClient === person['@id'] && styles.selectOptionTextActive]}>
                      {getPeopleDisplayName(person)}
                    </Text>
                  </View>
                  {selectedClient === person['@id'] && (
                    <Icon name="check-circle" size={24} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Icon name="business" size={48} color="#CCCCCC" />
                <Text style={styles.emptyText}>Nenhum cliente encontrado.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderDayPicker = () => (
    <Modal
      transparent
      visible={dayPickerVisible}
      animationType="slide"
      onRequestClose={() => setDayPickerVisible(false)}>
      <View style={styles.pickerModalOverlay}>
        <View style={styles.pickerModalContent}>
          <View style={styles.pickerModalHeader}>
            <Text style={styles.pickerModalTitle}>Selecionar dia</Text>
            <TouchableOpacity onPress={() => setDayPickerVisible(false)}>
              <Icon name="close" size={24} color="#666666" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerModalBody}>
            {Array.from({ length: 31 }, (_, index) => index + 1).map(day => (
              <TouchableOpacity
                key={day}
                style={[styles.selectOption, startDay === String(day) && styles.selectOptionActive]}
                onPress={() => {
                  setStartDay(String(day));
                  setDayPickerVisible(false);
                }}>
                <Text style={[styles.optionName, startDay === String(day) && styles.selectOptionTextActive]}>
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderMonthPicker = () => (
    <Modal
      transparent
      visible={monthPickerVisible}
      animationType="slide"
      onRequestClose={() => setMonthPickerVisible(false)}>
      <View style={styles.pickerModalOverlay}>
        <View style={styles.pickerModalContent}>
          <View style={styles.pickerModalHeader}>
            <Text style={styles.pickerModalTitle}>Selecionar mes</Text>
            <TouchableOpacity onPress={() => setMonthPickerVisible(false)}>
              <Icon name="close" size={24} color="#666666" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerModalBody}>
            {MONTHS.map((month, index) => (
              <TouchableOpacity
                key={month}
                style={[styles.selectOption, startMonth === String(index + 1) && styles.selectOptionActive]}
                onPress={() => {
                  setStartMonth(String(index + 1));
                  setMonthPickerVisible(false);
                }}>
                <Text style={[styles.optionName, startMonth === String(index + 1) && styles.selectOptionTextActive]}>
                  {month}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

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

          <View style={styles.inputGroup}>
            <View style={styles.productsHeader}>
              <View>
                <Text style={styles.inputLabel}>Produtos da proposta</Text>
                <Text style={styles.helperText}>
                  Escolha os produtos que serao encaminhados agora. Voce podera ajustar depois na proposta.
                </Text>
                {selectedModelCategoryName ? (
                  <Text style={styles.helperText}>
                    Produtos filtrados pela categoria {selectedModelCategoryName}.
                  </Text>
                ) : null}
              </View>
              <View style={styles.selectedCountBadge}>
                <Text style={styles.selectedCountText}>{selectedProducts.length}</Text>
              </View>
            </View>

            <View style={styles.searchBox}>
              <Icon name="search" size={18} color="#64748B" />
              <TextInput
                style={styles.searchInput}
                value={productQuery}
                onChangeText={setProductQuery}
                placeholder={
                  selectedModelCategoryName
                    ? `Buscar produto em ${selectedModelCategoryName}...`
                    : 'Buscar produto da empresa...'
                }
                placeholderTextColor="#94A3B8"
              />
              {productSearchLoading && <ActivityIndicator size="small" color="#2529a1" />}
            </View>

            {selectedProducts.length > 0 && (
              <View style={styles.selectedProductsWrap}>
                {selectedProducts.map(product => {
                  const productId = normalizeEntityId(product);
                  return (
                    <View key={product?.['@id'] || productId} style={styles.selectedProductChip}>
                      <View style={inlineStyle_588_28}>
                        <Text style={styles.selectedProductTitle} numberOfLines={1}>
                          {product?.product || 'Produto'}
                        </Text>
                        <Text style={styles.selectedProductMeta} numberOfLines={1}>
                          {product?.sku ? `SKU ${product.sku}` : Formatter.formatMoney(Number(product?.price || 0))}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => toggleSelectedProduct(product)}>
                        <Icon name="close" size={18} color="#64748B" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.productResultsWrap}>
              {productResults.map(product => {
                const productId = normalizeEntityId(product);
                const isSelected = selectedProductIds.has(productId);

                return (
                  <TouchableOpacity
                    key={product?.['@id'] || productId}
                    style={[styles.productRow, isSelected && styles.productRowSelected]}
                    onPress={() => toggleSelectedProduct(product)}>
                    <View style={inlineStyle_615_26}>
                      <Text style={styles.productName} numberOfLines={1}>
                        {product?.product || 'Produto'}
                      </Text>
                      <Text style={styles.productMeta} numberOfLines={1}>
                        {[product?.sku ? `SKU ${product.sku}` : null, Formatter.formatMoney(Number(product?.price || 0))]
                          .filter(Boolean)
                          .join(' • ')}
                      </Text>
                    </View>
                    <Icon
                      name={isSelected ? 'check-circle' : 'add-circle-outline'}
                      size={22}
                      color={isSelected ? '#4CAF50' : '#2529a1'}
                    />
                  </TouchableOpacity>
                );
              })}

              {!productSearchLoading && productResults.length === 0 && (
                <Text style={styles.noProductsText}>Nenhum produto disponivel para esta busca.</Text>
              )}
            </View>
          </View>
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
              (!selectedModel || !selectedClient || !formatDate(startYear, startMonth, startDay)) &&
                styles.createButtonDisabled,
            ]}
            onPress={() => {
              Keyboard.dismiss();
              handleSubmit();
            }}
            disabled={isLoading || !selectedModel || !selectedClient || !formatDate(startYear, startMonth, startDay)}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.createButtonText}>Salvar proposta</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
      {renderModelSelectModal()}
      {renderClientSelectModal()}
      {renderDayPicker()}
      {renderMonthPicker()}
    </AnimatedModal>
  );
};

export default CreateProposalsModal;
