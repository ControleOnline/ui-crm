import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';

import css from '@controleonline/ui-orders/src/react/css/orders';
import {
  MENU_CATALOG_MODEL_CONFIG_KEY,
  normalizeModelReference,
} from '@controleonline/ui-common/src/react/utils/menuCatalogConfig';
import {useStore} from '@store';

import localStyles from '../GeneralSettings.styles';
import GeneralSettingsSection from '../GeneralSettingsSection';
import {
  GENERAL_SETTINGS_PICKER_MODE,
  getMenuGroupOptionLabel,
  MENU_CATALOG_HIDDEN_CATEGORY_IDS_CONFIG_KEY,
  MENU_CATALOG_HIDDEN_GROUP_IDS_CONFIG_KEY,
  normalizeEntityId,
  normalizeIdList,
  useGeneralSettingsConfig,
} from '../GeneralSettings.shared';

const MenuCatalogSection = () => {
  const {styles, globalStyles} = css();
  const {
    currentCompany,
    effectiveCompanyConfigs,
    isSaving,
    saveConfigs,
  } = useGeneralSettingsConfig();

  const categoriesStore = useStore('categories');
  const {
    items: menuCategories = [],
    isLoading: isLoadingMenuCategories,
  } = categoriesStore.getters;
  const categoryActions = categoriesStore.actions;

  const productGroupStore = useStore('product_group');
  const {
    items: menuGroups = [],
    isLoading: isLoadingMenuGroups,
  } = productGroupStore.getters;
  const productGroupActions = productGroupStore.actions;

  const modelsStore = useStore('models');
  const modelActions = modelsStore.actions;

  const [menuCatalogModel, setMenuCatalogModel] = useState('');
  const [menuModels, setMenuModels] = useState([]);
  const [isLoadingMenuModels, setIsLoadingMenuModels] = useState(false);
  const [menuHiddenCategoryIds, setMenuHiddenCategoryIds] = useState([]);
  const [menuHiddenGroupIds, setMenuHiddenGroupIds] = useState([]);

  useEffect(() => {
    setMenuCatalogModel(
      normalizeModelReference(
        effectiveCompanyConfigs[MENU_CATALOG_MODEL_CONFIG_KEY],
      ),
    );
    setMenuHiddenCategoryIds(
      normalizeIdList(
        effectiveCompanyConfigs[MENU_CATALOG_HIDDEN_CATEGORY_IDS_CONFIG_KEY],
      ),
    );
    setMenuHiddenGroupIds(
      normalizeIdList(
        effectiveCompanyConfigs[MENU_CATALOG_HIDDEN_GROUP_IDS_CONFIG_KEY],
      ),
    );
  }, [effectiveCompanyConfigs]);

  useEffect(() => {
    if (!currentCompany?.id) {
      setMenuModels([]);
      setMenuCatalogModel('');
      setIsLoadingMenuModels(false);
      return;
    }

    categoryActions
      .getItems({
        context: 'products',
        company: currentCompany.id,
        itemsPerPage: 200,
        'order[name]': 'ASC',
      })
      .catch(() => {});
    productGroupActions
      .getItems({
        'parentProduct.company': '/people/' + currentCompany.id,
        itemsPerPage: 400,
        'order[groupOrder]': 'ASC',
        'order[productGroup]': 'ASC',
      })
      .catch(() => {});

    setIsLoadingMenuModels(true);
    modelActions
      .getItems({
        context: 'menu',
        people: currentCompany.id,
        itemsPerPage: 100,
      })
      .then(response => {
        const currentCompanyId = normalizeEntityId(currentCompany.id);
        const availableModels = (Array.isArray(response) ? response : [])
          .filter(model => {
            const modelCompanyId = normalizeEntityId(
              model?.people || model?.company,
            );
            return !modelCompanyId || modelCompanyId === currentCompanyId;
          })
          .sort((first, second) =>
            String(first?.model || '').localeCompare(
              String(second?.model || ''),
              'pt-BR',
              {sensitivity: 'base'},
            ),
          );

        setMenuModels(availableModels);
        modelActions.setError?.(null);
      })
      .catch(() => {
        setMenuModels([]);
        modelActions.setError?.(null);
      })
      .finally(() => {
        setIsLoadingMenuModels(false);
      });
  }, [categoryActions, currentCompany?.id, modelActions, productGroupActions]);

  const normalizedMenuCategories = useMemo(
    () => (Array.isArray(menuCategories) ? menuCategories : []),
    [menuCategories],
  );
  const normalizedMenuGroups = useMemo(
    () => (Array.isArray(menuGroups) ? menuGroups : []),
    [menuGroups],
  );
  const normalizedMenuModels = useMemo(
    () => (Array.isArray(menuModels) ? menuModels : []),
    [menuModels],
  );

  const toggleMenuHiddenCategory = useCallback(categoryId => {
    const normalizedId = String(categoryId || '').replace(/\D+/g, '').trim();
    if (!normalizedId) {
      return;
    }

    setMenuHiddenCategoryIds(current =>
      current.includes(normalizedId)
        ? current.filter(item => item !== normalizedId)
        : [...current, normalizedId],
    );
  }, []);

  const toggleMenuHiddenGroup = useCallback(groupId => {
    const normalizedId = String(groupId || '').replace(/\D+/g, '').trim();
    if (!normalizedId) {
      return;
    }

    setMenuHiddenGroupIds(current =>
      current.includes(normalizedId)
        ? current.filter(item => item !== normalizedId)
        : [...current, normalizedId],
    );
  }, []);

  const saveMenuCatalogConfigs = useCallback(async () => {
    await saveConfigs({
      [MENU_CATALOG_MODEL_CONFIG_KEY]: normalizeModelReference(menuCatalogModel),
      [MENU_CATALOG_HIDDEN_CATEGORY_IDS_CONFIG_KEY]: menuHiddenCategoryIds,
      [MENU_CATALOG_HIDDEN_GROUP_IDS_CONFIG_KEY]: menuHiddenGroupIds,
    });
  }, [menuCatalogModel, menuHiddenCategoryIds, menuHiddenGroupIds, saveConfigs]);

  return (
    <GeneralSettingsSection
      description="Define o modelo HTML/Twig usado no PDF e quais categorias e grupos de customizacao ficam ocultos no arquivo baixado no manager e na rota publica `/download` do shop."
      icon="restaurant-menu"
      iconBackgroundColor="#FEF3C7"
      iconColor="#B45309"
      title="Cardapio em PDF">
      <View style={localStyles.fieldBlock}>
        <Text style={localStyles.fieldLabel}>Modelo do cardapio</Text>
        <Text style={localStyles.helperText}>
          Selecione o modelo com contexto `menu` que sera usado para gerar o
          PDF dessa empresa.
        </Text>

        {isLoadingMenuModels ? (
          <ActivityIndicator size="small" style={localStyles.sectionLoader} />
        ) : normalizedMenuModels.length === 0 ? (
          <View style={localStyles.emptyBox}>
            <Text style={localStyles.emptyTitle}>
              Nenhum modelo de cardapio encontrado
            </Text>
            <Text style={localStyles.emptyText}>
              Cadastre um modelo com contexto `menu` em Modelos HTML/Twig para
              habilitar o download do cardapio.
            </Text>
          </View>
        ) : (
          <Picker
            selectedValue={menuCatalogModel}
            mode={GENERAL_SETTINGS_PICKER_MODE}
            onValueChange={value =>
              setMenuCatalogModel(normalizeModelReference(value))
            }
            style={styles.Settings.picker}>
            <Picker.Item
              label="Selecione o modelo do cardapio"
              value=""
            />
            {normalizedMenuModels.map(modelOption => (
              <Picker.Item
                key={`menu-model-${modelOption?.id || modelOption?.['@id']}`}
                label={String(
                  modelOption?.model || `Modelo #${modelOption?.id || ''}`,
                )}
                value={normalizeModelReference(
                  modelOption?.['@id'] || modelOption?.id,
                )}
              />
            ))}
          </Picker>
        )}
      </View>

      <Text style={localStyles.helperText}>
        {menuCatalogModel
          ? 'Modelo configurado para a empresa.'
          : 'Nenhum modelo configurado ainda. Sem esse modelo, a rota publica de download retorna erro.'}
      </Text>

      <Text style={localStyles.helperText}>
        {menuHiddenCategoryIds.length > 0 || menuHiddenGroupIds.length > 0
          ? `${menuHiddenCategoryIds.length} categoria(s) e ${menuHiddenGroupIds.length} grupo(s) oculto(s) no PDF.`
          : 'Nenhum filtro aplicado. O PDF usa todas as categorias e grupos visiveis da empresa.'}
      </Text>

      <View style={localStyles.fieldBlock}>
        <Text style={localStyles.fieldLabel}>Categorias ocultas</Text>
        <Text style={localStyles.helperText}>
          Toque nas categorias que nao devem aparecer no cardapio gerado.
        </Text>

        {isLoadingMenuCategories ? (
          <ActivityIndicator size="small" style={localStyles.sectionLoader} />
        ) : normalizedMenuCategories.length === 0 ? (
          <View style={localStyles.emptyBox}>
            <Text style={localStyles.emptyTitle}>
              Nenhuma categoria encontrada
            </Text>
            <Text style={localStyles.emptyText}>
              Cadastre categorias de produtos para controlar a visibilidade
              delas no PDF do cardapio.
            </Text>
          </View>
        ) : (
          <View style={localStyles.printerList}>
            {normalizedMenuCategories.map(categoryOption => {
              const categoryId = String(categoryOption?.id || '').trim();
              const hidden = menuHiddenCategoryIds.includes(categoryId);

              return (
                <TouchableOpacity
                  key={`menu-category-${categoryId}`}
                  style={[
                    localStyles.printerItem,
                    hidden && localStyles.printerItemActive,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => toggleMenuHiddenCategory(categoryId)}>
                  <Icon
                    name={hidden ? 'visibility-off' : 'category'}
                    size={20}
                    color={hidden ? '#B45309' : '#94A3B8'}
                  />
                  <View style={localStyles.printerCopy}>
                    <Text style={localStyles.printerName}>
                      {categoryOption?.name || `Categoria #${categoryId}`}
                    </Text>
                    <Text style={localStyles.printerDevice}>
                      {hidden ? 'Oculta no PDF' : 'Visivel no PDF'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      <View style={localStyles.fieldBlock}>
        <Text style={localStyles.fieldLabel}>Grupos ocultos</Text>
        <Text style={localStyles.helperText}>
          Esses grupos deixam de aparecer dentro dos produtos customizaveis no
          cardapio em PDF.
        </Text>

        {isLoadingMenuGroups ? (
          <ActivityIndicator size="small" style={localStyles.sectionLoader} />
        ) : normalizedMenuGroups.length === 0 ? (
          <View style={localStyles.emptyBox}>
            <Text style={localStyles.emptyTitle}>
              Nenhum grupo de customizacao encontrado
            </Text>
            <Text style={localStyles.emptyText}>
              Os grupos sao lidos dos produtos customizaveis da empresa.
            </Text>
          </View>
        ) : (
          <View style={localStyles.printerList}>
            {normalizedMenuGroups.map(groupOption => {
              const groupId = String(groupOption?.id || '').trim();
              const hidden = menuHiddenGroupIds.includes(groupId);

              return (
                <TouchableOpacity
                  key={`menu-group-${groupId}`}
                  style={[
                    localStyles.printerItem,
                    hidden && localStyles.printerItemActive,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => toggleMenuHiddenGroup(groupId)}>
                  <Icon
                    name={hidden ? 'visibility-off' : 'tune'}
                    size={20}
                    color={hidden ? '#B45309' : '#94A3B8'}
                  />
                  <View style={localStyles.printerCopy}>
                    <Text style={localStyles.printerName}>
                      {getMenuGroupOptionLabel(groupOption)}
                    </Text>
                    <Text style={localStyles.printerDevice}>
                      {hidden ? 'Oculto no PDF' : 'Visivel no PDF'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[
          globalStyles.button,
          localStyles.primaryButton,
          (!currentCompany?.id || isSaving) && localStyles.primaryButtonDisabled,
        ]}
        disabled={!currentCompany?.id || isSaving}
        onPress={saveMenuCatalogConfigs}>
        <Text style={localStyles.primaryButtonText}>
          Salvar configuracoes do cardapio
        </Text>
      </TouchableOpacity>
    </GeneralSettingsSection>
  );
};

export default MenuCatalogSection;
