import { StyleSheet } from 'react-native';

import cardStyles from './styles/card.styles';
import layoutStyles from './styles/layout.styles';
import modalStyles from './styles/modal.styles';

const styles = StyleSheet.create({
  ...layoutStyles,
  ...cardStyles,
  ...modalStyles,
});

export default styles;
