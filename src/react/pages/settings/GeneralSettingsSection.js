/*
 * @agents This wrapper keeps the settings section chrome consistent.
 * Individual sections only provide content, labels, and contextual metadata.
 */
import React from 'react';
import {View, Text} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import DefaultTooltip from '@controleonline/ui-default/src/react/components/help/DefaultTooltip';

import {
  useGeneralSettingsPalette,
  useGeneralSettingsStyles,
} from './GeneralSettings.styles';

const GeneralSettingsSection = ({
  children,
  description,
  icon,
  iconBackgroundColor,
  iconColor,
  title,
}) => {
  const localStyles = useGeneralSettingsStyles();
  const themePalette = useGeneralSettingsPalette();

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
                accentColor={themePalette.iconInfo}
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
