import React, { useLayoutEffect } from 'react';
import { View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';

import CrmHeader from './components/CrmHeader';
import OpportunityFormModal from './components/OpportunityFormModal';
import OpportunityList from './components/OpportunityList';
import ProviderSelectModal from './components/ProviderSelectModal';
import SelectModal from './components/SelectModal';
import { CrmTopSkeleton } from './components/OpportunitySkeletons';
import useCrmData from './hooks/useCrmData';
import useOpportunityForms from './hooks/useOpportunityForms';
import useToastMessage from '../../hooks/useToastMessage';
import { getDaysArray, getMonthsArray } from '../../utils/opportunityDate';
import styles from './index.styles';

export default function CrmIndex() {
  const { showSuccess, showError } = useToastMessage();
  const navigation = useNavigation();
  const data = useCrmData({ iconComponent: Icon, navigation, showError });
  const forms = useOpportunityForms({
    buildOpportunityParams: data.buildOpportunityParams,
    currentCompany: data.currentCompany,
    opportunitiesActions: data.opportunitiesActions,
    setCurrentPage: data.setCurrentPage,
    showError,
    showSuccess,
  });

  const headerTitle =
    global.t?.t('people', 'header', 'opportunities') || 'Oportunidades';

  useLayoutEffect(() => {
    navigation.setOptions({ headerTitle });
  }, [headerTitle, navigation]);

  const productCategories = data.categories.filter(
    cat => cat.context === 'relationship',
  );
  const criticalityCategories = data.categories.filter(
    cat => cat.context === 'relationship-criticality',
  );
  const reasonCategories = data.categories.filter(
    cat => cat.context === 'relationship-reason',
  );

  const activeOpportunity = forms.editModalVisible
    ? forms.editingOpportunity
    : forms.newOpportunity;
  const setActiveOpportunity = forms.editModalVisible
    ? forms.setEditingOpportunity
    : forms.setNewOpportunity;

  const setActiveOpportunityField = (field, value) => {
    setActiveOpportunity(prev => ({ ...prev, [field]: value }));
  };

  const selectModalProps = {
    getOptionIdentity: data.getOptionIdentity,
    getStatusFilterLabel: data.getStatusFilterLabel,
    isQuestionLikeIcon: data.isQuestionLikeIcon,
    isValidFontAwesomeIcon: data.isValidFontAwesomeIcon,
  };

  const toggleStatus = opportunity => {
    const newStatus =
      opportunity.taskStatus.realStatus === 'open' ? 'closed' : 'open';
    console.log(
      `Alterando status da oportunidade ${opportunity.id} para: ${newStatus}`,
    );
  };

  return (
    <View style={styles.container}>
      {data.showInitialSkeleton ? (
        <CrmTopSkeleton />
      ) : (
        <CrmHeader
          getStatusFilterKey={data.getStatusFilterKey}
          getStatusFilterLabel={data.getStatusFilterLabel}
          onAddOpportunity={forms.openAddOpportunity}
          searchText={data.searchText}
          selectedStatusFilterKey={data.selectedStatusFilterKey}
          setSearchText={data.setSearchText}
          setSelectedStatusFilterKey={data.setSelectedStatusFilterKey}
          showStatusFilterSkeleton={data.showStatusFilterSkeleton}
          status={data.status}
        />
      )}

      <OpportunityList
        allOpportunities={data.allOpportunities}
        error={data.error}
        getProviderName={data.getProviderName}
        handleEditProvider={data.handleEditProvider}
        handleEditOpportunity={forms.handleEditOpportunity}
        handleOpportunityPress={opportunity =>
          forms.handleOpportunityPress(navigation, opportunity)
        }
        isLoading={data.isLoading}
        isPeopleLoading={data.isPeopleLoading}
        isStatusLoading={data.isStatusLoading}
        knownPeople={data.knownPeople}
        onRefresh={data.onRefresh}
        opportunityEmptyStateMode={data.opportunityEmptyStateMode}
        refreshing={data.refreshing}
        setCurrentPage={data.setCurrentPage}
        showOpportunityCardsSkeleton={data.showOpportunityCardsSkeleton}
        toggleStatus={toggleStatus}
        totalItems={data.totalItems}
        visibleOpportunities={data.visibleOpportunities}
      />

      <OpportunityFormModal
        isEdit
        isQuestionLikeIcon={data.isQuestionLikeIcon}
        isValidFontAwesomeIcon={data.isValidFontAwesomeIcon}
        getProviderName={data.getProviderName}
        getStatusFilterLabel={data.getStatusFilterLabel}
        onAddPhone={forms.addPhoneInput}
        onClose={() => forms.setEditModalVisible(false)}
        onRemovePhone={forms.removePhoneInput}
        onSave={forms.handleSaveEdit}
        onUpdatePhone={forms.updatePhoneInput}
        opportunity={forms.editingOpportunity}
        setCategoryPickerVisible={forms.setCategoryPickerVisible}
        setCriticalityPickerVisible={forms.setCriticalityPickerVisible}
        setDueDateDayPickerVisible={forms.setDueDateDayPickerVisible}
        setDueDateMonthPickerVisible={forms.setDueDateMonthPickerVisible}
        setOpportunity={forms.setEditingOpportunity}
        setProviderPickerVisible={data.setProviderPickerVisible}
        setReasonPickerVisible={forms.setReasonPickerVisible}
        setStatusPickerVisible={forms.setStatusPickerVisible}
        visible={forms.editModalVisible}
      />

      <OpportunityFormModal
        isEdit={false}
        isQuestionLikeIcon={data.isQuestionLikeIcon}
        isValidFontAwesomeIcon={data.isValidFontAwesomeIcon}
        getProviderName={data.getProviderName}
        getStatusFilterLabel={data.getStatusFilterLabel}
        onAddPhone={forms.addPhoneInput}
        onClose={() => forms.setAddModalVisible(false)}
        onRemovePhone={forms.removePhoneInput}
        onSave={forms.handleSaveNewOpportunity}
        onUpdatePhone={forms.updatePhoneInput}
        opportunity={forms.newOpportunity}
        setCategoryPickerVisible={forms.setCategoryPickerVisible}
        setCriticalityPickerVisible={forms.setCriticalityPickerVisible}
        setDueDateDayPickerVisible={forms.setDueDateDayPickerVisible}
        setDueDateMonthPickerVisible={forms.setDueDateMonthPickerVisible}
        setOpportunity={forms.setNewOpportunity}
        setProviderPickerVisible={data.setProviderPickerVisible}
        setReasonPickerVisible={forms.setReasonPickerVisible}
        setStatusPickerVisible={forms.setStatusPickerVisible}
        visible={forms.addModalVisible}
      />

      <SelectModal
        {...selectModalProps}
        title={global.t?.t('people', 'modal', 'selectStatus')}
        items={data.status}
        selectedItem={activeOpportunity?.taskStatus}
        onSelect={item => setActiveOpportunityField('taskStatus', item)}
        visible={forms.statusPickerVisible}
        setVisible={forms.setStatusPickerVisible}
        renderKey="status"
      />
      <SelectModal
        {...selectModalProps}
        title={global.t?.t('people', 'modal', 'selectCategory')}
        items={productCategories}
        selectedItem={activeOpportunity?.category}
        onSelect={item => setActiveOpportunityField('category', item)}
        visible={forms.categoryPickerVisible}
        setVisible={forms.setCategoryPickerVisible}
        renderKey="name"
      />
      <SelectModal
        {...selectModalProps}
        title={global.t?.t('people', 'modal', 'selectCriticality')}
        items={criticalityCategories}
        selectedItem={activeOpportunity?.criticality}
        onSelect={item => setActiveOpportunityField('criticality', item)}
        visible={forms.criticalityPickerVisible}
        setVisible={forms.setCriticalityPickerVisible}
        renderKey="name"
      />
      <SelectModal
        {...selectModalProps}
        title={global.t?.t('people', 'modal', 'selectReason')}
        items={reasonCategories}
        selectedItem={activeOpportunity?.reason}
        onSelect={item => setActiveOpportunityField('reason', item)}
        visible={forms.reasonPickerVisible}
        setVisible={forms.setReasonPickerVisible}
        renderKey="name"
      />
      <SelectModal
        {...selectModalProps}
        title={global.t?.t('people', 'modal', 'selectDay')}
        items={getDaysArray()}
        selectedItem={{ id: activeOpportunity?.dueDateDay }}
        onSelect={item => setActiveOpportunityField('dueDateDay', item.id)}
        visible={forms.dueDateDayPickerVisible}
        setVisible={forms.setDueDateDayPickerVisible}
        renderKey="name"
      />
      <SelectModal
        {...selectModalProps}
        title={global.t?.t('people', 'modal', 'selectMonth')}
        items={getMonthsArray()}
        selectedItem={{ id: activeOpportunity?.dueDateMonth }}
        onSelect={item => setActiveOpportunityField('dueDateMonth', item.id)}
        visible={forms.dueDateMonthPickerVisible}
        setVisible={forms.setDueDateMonthPickerVisible}
        renderKey="name"
      />
      <SelectModal
        {...selectModalProps}
        title={global.t?.t('people', 'modal', 'selectDay')}
        items={getDaysArray()}
        selectedItem={{ id: activeOpportunity?.alterDateDay }}
        onSelect={item => setActiveOpportunityField('alterDateDay', item.id)}
        visible={forms.alterDateDayPickerVisible}
        setVisible={forms.setAlterDateDayPickerVisible}
        renderKey="name"
      />
      <SelectModal
        {...selectModalProps}
        title={global.t?.t('people', 'modal', 'selectMonth')}
        items={getMonthsArray()}
        selectedItem={{ id: activeOpportunity?.alterDateMonth }}
        onSelect={item => setActiveOpportunityField('alterDateMonth', item.id)}
        visible={forms.alterDateMonthPickerVisible}
        setVisible={forms.setAlterDateMonthPickerVisible}
        renderKey="name"
      />

      <ProviderSelectModal
        closeProviderPicker={data.closeProviderPicker}
        editModalVisible={forms.editModalVisible}
        editingOpportunity={forms.editingOpportunity}
        isProviderSearchLoading={data.isProviderSearchLoading}
        newOpportunity={forms.newOpportunity}
        providerOptions={data.providerOptions}
        providerPickerVisible={data.providerPickerVisible}
        providerSearchText={data.providerSearchText}
        setEditingOpportunity={forms.setEditingOpportunity}
        setNewOpportunity={forms.setNewOpportunity}
        setProviderSearchText={data.setProviderSearchText}
      />
    </View>
  );
}
