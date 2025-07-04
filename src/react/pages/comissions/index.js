import React, {useState, useCallback} from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import {getStore} from '@store';
import StateStore from '@controleonline/ui-layout/src/react/components/StateStore';
import css from '@controleonline/ui-orders/src/react/css/orders';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation, useFocusEffect} from '@react-navigation/native';

const Invoices = ({navigation}) => {
  const {getters, actions: invoicesActions} = getStore('invoice');
  const {items, item, isLoading, error, columns} = getters;
  const {styles, globalStyles} = css();
  const {getters: peopleGetters} = getStore('people');
  const {getters: deviceGetters} = getStore('device');
  const {getters: userGetters, actions: authActions} = getStore('auth');
  const {user} = userGetters;
  const {item: storagedDevice} = deviceGetters;
  const {currentCompany, defaultCompany} = peopleGetters;
  const {getters: deviceConfigGetters} = getStore('device_config');
  const {item: device} = deviceConfigGetters;

  useFocusEffect(
    useCallback(() => {
      if (
        currentCompany &&
        Object.entries(currentCompany).length > 0 &&
        device.configs
      )
        invoicesActions.getItems({
          payer: '/people/' + currentCompany.id,
          receiver: '/people/' + user.id,
          status: [6, 7],
        });
    }, [currentCompany, user]),
  );

  return (
    <SafeAreaView style={styles.container}>
      <StateStore store="invoice" />
      {!isLoading && items && items.length > 0 && !error && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View>
            {items.map(invoice => (
              <TouchableOpacity key={invoice.id} style={[styles.itemsSection]}>
                <Text>{invoice.id}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};
export default Invoices;
