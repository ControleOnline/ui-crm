import React from 'react';
import {View, Text} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import localStyles from './GeneralSettings.styles';

const GeneralSettingsSection = ({
  children,
  description,
  icon,
  iconBackgroundColor,
  iconColor,
  title,
}) => {
  return (
    <View style={localStyles.sectionCard}>
      <View style={localStyles.sectionHeader}>
        <View
          style={[
            localStyles.sectionIconWrap,
            {backgroundColor: iconBackgroundColor},
          ]}>
          <Icon name={icon} size={20} color={iconColor} />
        </View>
        <View style={localStyles.sectionHeaderCopy}>
          <Text style={localStyles.sectionTitle}>{title}</Text>
          <Text style={localStyles.sectionDescription}>{description}</Text>
        </View>
      </View>

      {children}
    </View>
  );
};

export default GeneralSettingsSection;
