import React, {useState, useCallback} from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {Text} from 'react-native-animatable';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {getStore} from '@store';
import Icon from 'react-native-vector-icons/FontAwesome';

export default function HomePage({navigation}) {
  const {getters} = getStore('theme');
  const {colors} = getters;
  const handleTo = to => {
    navigation.navigate(to);
  };

  const buttons = [
    {
      id: '1',
      title: 'Clientes',
      icon: 'shopping-cart',
      backgroundColor: colors['primary'],
      onPress: () => handleTo('ClientsIndex'),
    },
    {
      id: '2',
      title: 'Oportunidades',
      icon: 'shopping-cart',
      backgroundColor: '#4682b4',
      onPress: () => handleTo('CrmIndex'),
    },
    {
      id: '3',
      title: 'Comissões',
      icon: 'money',
      backgroundColor: 'green',
      onPress: () => handleTo('Comission'),
    },
  ];

  const renderButton = ({item}) => (
    <TouchableOpacity
      style={[styles.button, {backgroundColor: item.backgroundColor}]}
      onPress={item.onPress}>
      <Icon name={item.icon} size={30} color="#fff" style={styles.icon} />
      <Text style={styles.buttonText}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <>
      <View style={styles.container}>
        <FlatList
          data={buttons}
          renderItem={renderButton}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.content}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 30,
    paddingBottom: 60,
  },
  content: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  button: {
    width: '48%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderRadius: 10,
  },
  icon: {
    marginBottom: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
});
