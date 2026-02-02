import React, {useState, useCallback} from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {useStore} from '@store';
import StateStore from '@controleonline/ui-layout/src/react/components/StateStore';
import css from '@controleonline/ui-orders/src/react/css/orders';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation, useFocusEffect} from '@react-navigation/native';

const Invoices = ({navigation}) => {
  const invoiceStore = useStore('invoice');
  const getters = invoiceStore.getters;
  const invoicesActions = invoiceStore.actions;
  const {items, item, isLoading, error, columns} = getters;
  const {styles, globalStyles} = css();
  const peopleStore = useStore('people');
  const peopleGetters = peopleStore.getters;
  const authStore = useStore('auth');
  const userGetters = authStore.getters;
  const authActions = authStore.actions;
  const {user} = userGetters;
  const {currentCompany, defaultCompany} = peopleGetters;
  const device_configStore = useStore('device_config');
  const deviceConfigGetters = device_configStore.getters;
  const {item: device} = deviceConfigGetters;
  const [refreshing, setRefreshing] = useState(false);

  const loadInvoices = useCallback(() => {
    if (
      currentCompany &&
      Object.entries(currentCompany).length > 0 &&
      device.configs
    ) {
      invoicesActions.getItems({
        payer: '/people/' + currentCompany.id,
        // receiver: '/people/' + user.id,
        // status: [6, 7],
      });
    }
  }, [currentCompany]);

  useFocusEffect(
    useCallback(() => {
      loadInvoices();
    }, [loadInvoices]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInvoices();
    setRefreshing(false);
  }, [loadInvoices]);

  const formatCurrency = value => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = status => {
    if (status?.color) {
      return status.color;
    }
  };

  const handleInvoicePress = invoice => {
    Alert.alert(
      'Detalhes da Fatura',
      `ID: ${invoice.id}\nValor: ${formatCurrency(invoice.price)}\nStatus: ${
        invoice.status?.status
      }\nVencimento: ${formatDate(invoice.dueDate)}`,
      [{text: 'OK'}],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StateStore store="invoice" />

      {error && (
        <View
          style={[
            styles.container,
            {justifyContent: 'center', alignItems: 'center', padding: 20},
          ]}>
          <Icon name="error-outline" size={48} color="#F44336" />
          <Text
            style={[
              globalStyles.text,
              {textAlign: 'center', marginTop: 10, color: '#F44336'},
            ]}>
            Erro ao carregar faturas
          </Text>
          <TouchableOpacity
            style={[styles.button, {marginTop: 15, backgroundColor: '#007AFF'}]}
            onPress={loadInvoices}>
            <Text style={[globalStyles.btnText, {color: '#FFFFFF'}]}>
              Tentar novamente
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!isLoading && items && items.length === 0 && !error && (
        <View
          style={[
            styles.container,
            {justifyContent: 'center', alignItems: 'center', padding: 20},
          ]}>
          <Icon name="receipt-long" size={48} color="#757575" />
          <Text
            style={[
              globalStyles.text,
              {textAlign: 'center', marginTop: 10, color: '#757575'},
            ]}>
            Nenhuma fatura encontrada
          </Text>
        </View>
      )}

      {!isLoading && items && items.length > 0 && !error && (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          <View style={{padding: 10}}>
            {items.map(invoice => (
              <TouchableOpacity
                key={invoice.id}
                style={[
                  styles.itemsSection,
                  {
                    marginBottom: 10,
                    padding: 15,
                    borderRadius: 8,
                    backgroundColor: '#FFFFFF',
                    shadowColor: '#000',
                    shadowOffset: {width: 0, height: 2},
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  },
                ]}
                onPress={() => handleInvoicePress(invoice)}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}>
                  <View style={{flex: 1}}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 5,
                      }}>
                      <Text
                        style={[
                          globalStyles.text,
                          {fontWeight: 'bold', fontSize: 16},
                        ]}>
                        Fatura #{invoice.id}
                      </Text>
                      <View
                        style={{
                          marginLeft: 10,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 12,
                          backgroundColor: getStatusColor(invoice.status),
                        }}>
                        <Text
                          style={{
                            color: '#FFFFFF',
                            fontSize: 12,
                            fontWeight: 'bold',
                          }}>
                          {invoice.status?.status?.toUpperCase() || 'N/A'}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={[
                        globalStyles.text,
                        {
                          fontSize: 18,
                          fontWeight: 'bold',
                          color: '#007AFF',
                          marginBottom: 5,
                        },
                      ]}>
                      {formatCurrency(invoice.price)}
                    </Text>

                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 3,
                      }}>
                      <Icon name="category" size={16} color="#757575" />
                      <Text
                        style={[
                          globalStyles.text,
                          {marginLeft: 5, color: '#757575'},
                        ]}>
                        {invoice.category?.name || 'Sem categoria'}
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 3,
                      }}>
                      <Icon name="payment" size={16} color="#757575" />
                      <Text
                        style={[
                          globalStyles.text,
                          {marginLeft: 5, color: '#757575'},
                        ]}>
                        {invoice.paymentType?.paymentType || 'N/A'}
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 3,
                      }}>
                      <Icon name="event" size={16} color="#757575" />
                      <Text
                        style={[
                          globalStyles.text,
                          {marginLeft: 5, color: '#757575'},
                        ]}>
                        Vencimento: {formatDate(invoice.dueDate)}
                      </Text>
                    </View>

                    {invoice.sourceWallet && (
                      <View
                        style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Icon
                          name="account-balance-wallet"
                          size={16}
                          color="#757575"
                        />
                        <Text
                          style={[
                            globalStyles.text,
                            {marginLeft: 5, color: '#757575'},
                          ]}>
                          De: {invoice.sourceWallet.wallet}
                        </Text>
                      </View>
                    )}

                    {invoice.destinationWallet && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginTop: 2,
                        }}>
                        <Icon
                          name="account-balance-wallet"
                          size={16}
                          color="#757575"
                        />
                        <Text
                          style={[
                            globalStyles.text,
                            {marginLeft: 5, color: '#757575'},
                          ]}>
                          Para: {invoice.destinationWallet.wallet}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Icon name="chevron-right" size={24} color="#CCCCCC" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};
export default Invoices;
