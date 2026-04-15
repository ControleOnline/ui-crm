import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useStore } from '@store';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AnimatedModal from '@controleonline/ui-crm/src/react/components/AnimatedModal';
import useToastMessage from '../../hooks/useToastMessage';
import Formatter from '@controleonline/ui-common/src/utils/formatter';
import { buildOwnedClientsParams, getPeopleDisplayName } from '@controleonline/ui-common/src/react/utils/peopleDisplay';
import {
  addProductsToOrder,
  createLinkedOrder,
  normalizeEntityId,
  searchCompanyProducts,
} from '@controleonline/ui-common/src/react/utils/commercialDocumentOrders';

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
          itemsPerPage: 8,
        });

        if (!cancelled) {
          setProductResults(results);
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
  }, [visible, currentCompany?.id, productQuery]);

  const selectedProductIds = useMemo(
    () => new Set(selectedProducts.map(product => normalizeEntityId(product))),
    [selectedProducts],
  );

  const selectedClientName = useMemo(
    () => getPeopleDisplayName(people.find(person => person['@id'] === selectedClient)) || '',
    [people, selectedClient],
  );

  const selectedModelName = useMemo(
    () => contractModels.find(model => model['@id'] === selectedModel)?.model || '',
    [contractModels, selectedModel],
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
      style={{ justifyContent: 'flex-end' }}>
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
                <Icon name="description" size={20} color="#2529a1" style={{ marginRight: 8 }} />
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
                <Icon name="business-center" size={20} color="#2529a1" style={{ marginRight: 8 }} />
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
                placeholder="Buscar produto da empresa..."
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
                      <View style={{ flex: 1 }}>
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
                    <View style={{ flex: 1 }}>
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

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
  },
  required: {
    color: '#FF4444',
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
  },
  selectInputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectInputText: {
    fontSize: 16,
    flex: 1,
    color: '#1A1A1A',
  },
  placeholderText: {
    color: '#999999',
  },
  dateContainer: {
    flexDirection: 'row',
  },
  selectInputDate: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    marginRight: 8,
  },
  yearInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#F8F9FA',
    textAlign: 'center',
  },
  productsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  selectedCountBadge: {
    minWidth: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2529a1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  selectedCountText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
  },
  searchInput: {
    flex: 1,
    minHeight: 48,
    fontSize: 15,
    color: '#0F172A',
    paddingHorizontal: 8,
  },
  selectedProductsWrap: {
    marginTop: 12,
  },
  selectedProductChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCE4FF',
    borderRadius: 12,
    backgroundColor: '#F8F9FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  selectedProductTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  selectedProductMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748B',
  },
  productResultsWrap: {
    marginTop: 12,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  productRowSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#F5FFF7',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  productMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748B',
  },
  noProductsText: {
    paddingVertical: 8,
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6C757D',
    alignItems: 'center',
    marginRight: 6,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C757D',
  },
  createButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#007BFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  createButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    maxHeight: '55%',
    elevation: 10,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  pickerModalBody: {
    maxHeight: '100%',
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  selectOptionActive: {
    backgroundColor: '#F8F9FF',
  },
  selectOptionTextActive: {
    color: '#2529a1',
    fontWeight: '600',
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionName: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
    marginTop: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
  },
});

export default CreateProposalsModal;
