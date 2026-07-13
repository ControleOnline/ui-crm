import React from 'react';
import {View, Text} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import DefaultTooltip from '@controleonline/ui-default/src/react/components/help/DefaultTooltip';
import {colors as defaultThemeColors} from '@controleonline/../../src/styles/colors';

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
          <View style={localStyles.sectionTitleRow}>
            <Text style={localStyles.sectionTitle}>{title}</Text>
            {description ? (
              <DefaultTooltip
                accentColor={defaultThemeColors.info}
                message={description}
                style={localStyles.sectionTitleHelp}
                title={title}
              />
            ) : null}
          </View>
        </View>
      </View>

      {children}
    </View>
  );
};

export default GeneralSettingsSection;
