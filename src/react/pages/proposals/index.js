import React, {useCallback, useState, useEffect} from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {getStore} from '@store';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CreateProposalsModal from './CreateProposalsModal';

const ProposalsPage = () => {
  const {getters: peopleGetters} = getStore('people');
  const {currentCompany} = peopleGetters;
  const {getters: contractGetters, actions: contractActions} =
    getStore('contract');
  const {items: contracts, totalItems, isLoading, error} = contractGetters;
  const navigation = useNavigation();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showItemsPerPageDropdown, setShowItemsPerPageDropdown] =
    useState(false);

  useFocusEffect(
    useCallback(() => {
      const params = {
        beneficiary: currentCompany.id,
        'contractModel.context': 'proposal',
        page: currentPage,
        itemsPerPage: itemsPerPage,
      };

      // Adiciona o parâmetro de busca se houver
      if (search.trim()) {
        params['peoples.people.name'] = search.trim();
      }

      contractActions.getItems(params);
    }, [currentCompany.id, currentPage, itemsPerPage, search]),
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage]);

  const handleCreateSuccess = () => {
    const params = {
      beneficiary: currentCompany.id,
      'contractModel.context': 'proposal',
      page: currentPage,
      itemsPerPage: itemsPerPage,
      contractModel: 'proposal',
    };

    // Adiciona o parâmetro de busca se houver
    if (search.trim()) {
      params['peoples.people.name'] = search.trim();
    }

    contractActions.getItems(params);
  };

  const getStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'ativo':
        return '#4CAF50';
      case 'inativo':
        return '#F44336';
      case 'pendente':
        return '#FF9800';
      default:
        return '#757575';
    }
  };

  const renderContract = contract => (
    <View key={contract.id} style={contractStyles.contractCard}>
      <View style={contractStyles.contractHeader}>
        <View style={contractStyles.headerContent}>
          <Text style={contractStyles.contractTitle}>
            {contract.contractModel.model}
          </Text>
          <View
            style={[
              contractStyles.statusBadge,
              {backgroundColor: getStatusColor(contract.status.status)},
            ]}>
            <Text style={contractStyles.statusText}>
              {contract.status.status}
            </Text>
          </View>
        </View>
      </View>

      <View style={contractStyles.contractBody}>
        {/* People Section */}
        {contract.peoples && contract.peoples.length > 0 && (
          <View style={contractStyles.peopleSection}>
            <View style={contractStyles.sectionHeader}>
              <Icon name="people" size={16} color="#666" />
              <Text style={contractStyles.sectionTitle}>Pessoas</Text>
            </View>
            {contract.peoples.map((contractPeople, index) => (
              <View key={contractPeople.id} style={contractStyles.personItem}>
                <View style={contractStyles.personInfo}>
                  <Text style={contractStyles.personName}>
                    {contractPeople.people.name}
                  </Text>
                  <Text style={contractStyles.personType}>
                    {contractPeople.peopleType}
                  </Text>
                </View>
                <View style={contractStyles.personTypeIndicator}>
                  <Text style={contractStyles.personTypeText}>
                    {contractPeople.people.peopleType === 'F' ? 'PF' : 'PJ'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={contractStyles.dateContainer}>
          <View style={contractStyles.dateItem}>
            <Icon name="event" size={16} color="#666" />
            <Text style={contractStyles.dateLabel}>Início</Text>
            <Text style={contractStyles.dateValue}>
              {new Date(contract.startDate).toLocaleDateString('pt-BR')}
            </Text>
          </View>
          <View style={contractStyles.dateItem}>
            <Icon name="event-available" size={16} color="#666" />
            <Text style={contractStyles.dateLabel}>Término</Text>
            <Text style={contractStyles.dateValue}>
              {new Date(contract.endDate).toLocaleDateString('pt-BR')}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={contractStyles.viewButton}
        onPress={() =>
          navigation.navigate('ContractDetails', {contractId: contract.id})
        }>
        <Text style={contractStyles.viewButtonText}>Ver Detalhes</Text>
        <Icon name="arrow-forward" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={contractStyles.container}>
      {/* Header com botão de criar */}
      <View
        style={{
          backgroundColor: '#fff',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#e9ecef',
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2,
          margin: 20,
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#f8f9fa',
              borderRadius: 12,
              paddingHorizontal: 16,
              borderWidth: 1,
              borderColor: '#e9ecef',
            }}>
            <Icon name="search" size={20} color="#6c757d" />
            <TextInput
              placeholder="Buscar cliente..."
              value={search}
              onChangeText={setSearch}
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 12,
                color: '#212529',
                fontSize: 16,
                width: '100%',
              }}
              placeholderTextColor="#6c757d"
            />
          </View>
          <TouchableOpacity
            style={{
              backgroundColor: '#2529a1',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              elevation: 2,
              shadowColor: '#2529a1',
              shadowOffset: {width: 0, height: 2},
              shadowOpacity: 0.3,
              shadowRadius: 4,
            }}
            onPress={() => setCreateModalVisible(true)}>
            <Icon
              name="add"
              size={20}
              color="#FFFFFF"
              style={{marginRight: 4}}
            />
            <Text style={{color: '#FFFFFF', fontWeight: '600', fontSize: 14}}>
              Criar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {isLoading ? (
        <View style={contractStyles.centerContent}>
          <ActivityIndicator size="large" color="#2529a1" />
          <Text style={contractStyles.loadingText}>
            Carregando contratos...
          </Text>
        </View>
      ) : error ? (
        <View style={contractStyles.centerContent}>
          <Icon name="error-outline" size={48} color="#F44336" />
          <Text style={contractStyles.errorText}>
            Erro ao carregar contratos
          </Text>
          <Text style={contractStyles.errorDetail}>{error}</Text>
        </View>
      ) : contracts.length === 0 ? (
        <View style={contractStyles.centerContent}>
          <Icon name="description" size={48} color="#CCCCCC" />
          <Text style={contractStyles.emptyTitle}>
            Nenhum contrato encontrado
          </Text>
          <Text style={contractStyles.emptySubtitle}>
            Os contratos aparecerão aqui quando disponíveis
          </Text>
        </View>
      ) : (
        <>
          {/* Items per page selector */}
          {!isLoading && contracts && contracts.length > 0 && !error && (
            <View
              style={{
                backgroundColor: '#fff',
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#e9ecef',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginHorizontal: 20,
                marginBottom: 16,
              }}>
              <Text style={{color: '#6c757d', fontSize: 14}}>
                Mostrando {contracts.length} de {totalItems} propostas
              </Text>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={{color: '#6c757d', fontSize: 14, marginRight: 8}}>
                  Por página:
                </Text>
                <View style={{position: 'relative'}}>
                  <TouchableOpacity
                    onPress={() =>
                      setShowItemsPerPageDropdown(!showItemsPerPageDropdown)
                    }
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderWidth: 1,
                      borderColor: '#e9ecef',
                      borderRadius: 6,
                      backgroundColor: '#f8f9fa',
                      minWidth: 60,
                    }}>
                    <Text
                      style={{color: '#495057', fontSize: 14, marginRight: 4}}>
                      {itemsPerPage}
                    </Text>
                    <Icon
                      name={
                        showItemsPerPageDropdown
                          ? 'keyboard-arrow-up'
                          : 'keyboard-arrow-down'
                      }
                      size={16}
                      color="#6c757d"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          <ScrollView
            style={contractStyles.scrollView}
            showsVerticalScrollIndicator={false}>
            {contracts.map(renderContract)}

            {/* Pagination Controls */}
            {totalItems > itemsPerPage && (
              <View
                style={{
                  backgroundColor: '#fff',
                  marginHorizontal: 16,
                  marginTop: 16,
                  borderRadius: 16,
                  padding: 20,
                  shadowColor: '#000',
                  shadowOffset: {width: 0, height: 3},
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  elevation: 4,
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                  <TouchableOpacity
                    onPress={() =>
                      setCurrentPage(prev => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 8,
                      backgroundColor:
                        currentPage === 1 ? '#f8f9fa' : '#2529a1',
                      opacity: currentPage === 1 ? 0.5 : 1,
                    }}>
                    <Icon
                      name="chevron-left"
                      size={20}
                      color={currentPage === 1 ? '#6c757d' : '#fff'}
                    />
                    <Text
                      style={{
                        color: currentPage === 1 ? '#6c757d' : '#fff',
                        marginLeft: 4,
                        fontWeight: '600',
                      }}>
                      Anterior
                    </Text>
                  </TouchableOpacity>

                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Text style={{color: '#6c757d', fontSize: 14}}>
                      Página {currentPage} de{' '}
                      {Math.ceil(totalItems / itemsPerPage)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() =>
                      setCurrentPage(prev =>
                        Math.min(
                          Math.ceil(totalItems / itemsPerPage),
                          prev + 1,
                        ),
                      )
                    }
                    disabled={
                      currentPage >= Math.ceil(totalItems / itemsPerPage)
                    }
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 8,
                      backgroundColor:
                        currentPage >= Math.ceil(totalItems / itemsPerPage)
                          ? '#f8f9fa'
                          : '#2529a1',
                      opacity:
                        currentPage >= Math.ceil(totalItems / itemsPerPage)
                          ? 0.5
                          : 1,
                    }}>
                    <Text
                      style={{
                        color:
                          currentPage >= Math.ceil(totalItems / itemsPerPage)
                            ? '#6c757d'
                            : '#fff',
                        marginRight: 4,
                        fontWeight: '600',
                      }}>
                      Próxima
                    </Text>
                    <Icon
                      name="chevron-right"
                      size={20}
                      color={
                        currentPage >= Math.ceil(totalItems / itemsPerPage)
                          ? '#6c757d'
                          : '#fff'
                      }
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={contractStyles.bottomPadding} />
          </ScrollView>
        </>
      )}

      <CreateProposalsModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Dropdown Overlay */}
      {showItemsPerPageDropdown && (
        <TouchableWithoutFeedback
          onPress={() => setShowItemsPerPageDropdown(false)}>
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 998,
            }}>
            <View
              style={{
                position: 'absolute',
                top: 140,
                right: 20,
                backgroundColor: '#fff',
                borderWidth: 1,
                borderColor: '#e9ecef',
                borderRadius: 6,
                shadowColor: '#000',
                shadowOffset: {width: 0, height: 2},
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 999,
                zIndex: 999,
              }}>
              {[5, 10, 20, 50].map(size => (
                <TouchableOpacity
                  key={size}
                  onPress={() => {
                    setItemsPerPage(size);
                    setCurrentPage(1);
                    setShowItemsPerPageDropdown(false);
                  }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    backgroundColor:
                      itemsPerPage === size ? '#f8f9fa' : 'transparent',
                    borderBottomWidth: size !== 50 ? 1 : 0,
                    borderBottomColor: '#f1f3f4',
                  }}>
                  <Text
                    style={{
                      color: itemsPerPage === size ? '#2529a1' : '#495057',
                      fontSize: 14,
                      fontWeight: itemsPerPage === size ? '600' : '400',
                    }}>
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      )}
    </SafeAreaView>
  );
};

const contractStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6C757D',
  },
  scrollView: {
    flex: 1,
    paddingTop: 16,
  },
  contractCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  contractHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  contractTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  contractBody: {
    padding: 16,
  },
  peopleSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginLeft: 6,
  },
  personItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 6,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212529',
  },
  personType: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 2,
  },
  personTypeIndicator: {
    backgroundColor: '#E9ECEF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  personTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#495057',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6C757D',
    marginLeft: 8,
    marginRight: 8,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212529',
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  dateLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 4,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2529a1',
    margin: 16,
    marginTop: 0,
    paddingVertical: 12,
    borderRadius: 8,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#6C757D',
    marginTop: 12,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginTop: 16,
    textAlign: 'center',
  },
  errorDetail: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 8,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 20,
  },
});

export default ProposalsPage;
