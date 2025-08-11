import React from 'react';
import {StyleSheet, TouchableOpacity, View, ScrollView} from 'react-native';
import {Text} from 'react-native-animatable';
import Icon from 'react-native-vector-icons/FontAwesome';

export default function HomePage({navigation}) {
  const handleTo = to => {
    navigation.navigate(to);
  };

  const menuItems = [
    {
      id: '1',
      title: 'Clientes',
      subtitle: 'Gerencie seus clientes',
      icon: 'users',
      iconColor: '#3498db',
      backgroundColor: '#f8f9fa',
      borderColor: '#3498db',
      onPress: () => handleTo('ClientsIndex'),
    },
    {
      id: '2',
      title: 'Oportunidades',
      subtitle: 'Acompanhe suas vendas',
      icon: 'line-chart',
      iconColor: '#e74c3c',
      backgroundColor: '#f8f9fa',
      borderColor: '#e74c3c',
      onPress: () => handleTo('CrmIndex'),
    },
    {
      id: '3',
      title: 'Propostas',
      subtitle: 'Crie e gerencie propostas',
      icon: 'file-text',
      iconColor: '#f39c12',
      backgroundColor: '#f8f9fa',
      borderColor: '#f39c12',
      onPress: () => handleTo('ProposalsIndex'),
    },
    {
      id: '4',
      title: 'Contratos',
      subtitle: 'Controle de contratos',
      icon: 'file-o',
      iconColor: '#9b59b6',
      backgroundColor: '#f8f9fa',
      borderColor: '#9b59b6',
      onPress: () => handleTo('ContractsIndex'),
    },
    {
      id: '5',
      title: 'Comissões',
      subtitle: 'Controle de comissões',
      icon: 'money',
      iconColor: '#27ae60',
      backgroundColor: '#f8f9fa',
      borderColor: '#27ae60',
      onPress: () => handleTo('ComissionsPage'),
    },
  ];
  const renderMenuItem = (item, index) => (
    <View key={item.id} style={styles.cardWrapper}>
      <TouchableOpacity
        style={[styles.card, {borderLeftColor: item.borderColor}]}
        onPress={item.onPress}
        activeOpacity={0.7}>
        <View style={styles.cardContent}>
          <View
            style={[
              styles.iconContainer,
              {backgroundColor: item.iconColor + '15'},
            ]}>
            <Icon name={item.icon} size={24} color={item.iconColor} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
          </View>
          <View style={styles.arrowContainer}>
            <Icon name="chevron-right" size={16} color="#bdc3c7" />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <Text animation="fadeInDown" style={styles.welcomeText}>
          Bem-vindo ao CRM
        </Text>

        <Text animation="fadeInDown" delay={200} style={styles.subtitleText}>
          Escolha uma opção para começar
        </Text>

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => renderMenuItem(item, index))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 30,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '400',
  },
  menuContainer: {
    width: '100%',
    gap: 16,
  },
  cardWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  animationWrapper: {
    width: '100%',
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '400',
  },
  arrowContainer: {
    marginLeft: 12,
  },
});
