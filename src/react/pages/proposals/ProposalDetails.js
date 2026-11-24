import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Text, useWindowDimensions, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useStores } from '@store';
import RenderHTML from 'react-native-render-html';
import { colors } from '@controleonline/../../src/styles/colors';
import { useMessage } from '@controleonline/ui-common/src/react/components/MessageService';
import LinkedOrderProductsTab from '@controleonline/ui-common/src/react/components/LinkedOrderProductsTab';
import DocumentDetailsShell from '@controleonline/ui-common/src/react/components/documentDetails/DocumentDetailsShell';
import DocumentSheet from '@controleonline/ui-common/src/react/components/documentDetails/DocumentSheet';
import useLinkedOrderSummary from '@controleonline/ui-common/src/react/hooks/useLinkedOrderSummary';
import { resolveDocumentFileContent } from '@controleonline/ui-common/src/react/utils/documentFileContent';
import { getPeopleDisplayName } from '@controleonline/ui-common/src/react/utils/peopleDisplay';
import { getProposalInitialTabIndex } from './proposalNavigation';
const { formatDocumentPeriod, formatDocumentStatusLabel } = require('../../utils/documentHeader');

const documentTheme = {
  primary: colors.primary,
};

// Readable width of the document inside the "paper" (see DocumentDetailsShell).
const resolveDocumentWidth = width => (width >= 768 ? Math.min(width - 48, 920) - 80 : width - 32);

const ProposalDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { contractId, initialTab } = route.params;
  const { width } = useWindowDimensions();
  const { showSuccess, showError } = useMessage();

  const contractStore = useStores(s => s.contract);
  const { item: contract, isLoading } = contractStore.getters;
  const contractActions = contractStore.actions;

  const [fileDocument, setFileDocument] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [productsOpen, setProductsOpen] = useState(getProposalInitialTabIndex(initialTab) === 1);

  const contractRef = contract?.['@id'];
  const orderSummary = useLinkedOrderSummary(contractRef);
  const canEdit = contract?.status?.realStatus === 'open';

  useLayoutEffect(() => {
    // The fixed document header replaces the navigation header.
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const loadDocument = useCallback(async (regenerate = false) => {
    setFileLoading(true);
    try {
      if (regenerate) {
        await contractActions.generate({ id: contractId });
      }
      let data = await contractActions.get(contractId);
      if (!data?.contractFile) {
        await contractActions.generate({ id: contractId });
        data = await contractActions.get(contractId);
      }
      if (data?.contractFile) {
        const res = await contractActions.getFileContent(data.contractFile['@id']);
        setFileDocument(resolveDocumentFileContent(res?.content));
        setFileError(null);
      }
    } catch {
      setFileError('Não foi possível carregar a proposta.');
    } finally {
      setFileLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('ProposalsIndex');
  };

  const handleSendProposal = async () => {
    showSuccess('Proposta enviada com sucesso');
  };

  // The proposal is rendered from the order products; regenerate it after they change.
  const handleProductsChanged = async () => {
    await Promise.all([orderSummary.reload(), loadDocument(true)]);
  };

  const statusColor = contract?.status?.color || '#64748b';

  return (
    <>
      <DocumentDetailsShell
        theme={documentTheme}
        title={contract?.contractModel?.model || 'Proposta'}
        clientName={getPeopleDisplayName(contract?.client)}
        meta={
          contract
            ? [`#${contract.id}`, formatDocumentPeriod(contract.startDate, contract.endDate)]
                .filter(Boolean)
                .join('  ·  ')
            : ''
        }
        totalLabel={orderSummary.totalLabel}
        statusLabel={contract ? formatDocumentStatusLabel(contract.status) : null}
        statusColor={statusColor}
        onBack={handleBack}
        loading={isLoading || !contract || (fileLoading && !fileDocument)}
        secondaryActions={[
          {
            key: 'products',
            icon: 'inventory-2',
            label: 'Produtos',
            count: orderSummary.count,
            onPress: () => setProductsOpen(true),
          },
        ]}
        primaryAction={
          canEdit
            ? { label: 'Enviar proposta', icon: 'send', onPress: handleSendProposal }
            : null
        }>
        {fileError ? (
          <Text style={{ color: '#b91c1c' }}>{fileError}</Text>
        ) : fileDocument?.kind === 'text' ? (
          <Text selectable style={{ color: '#1e293b', fontSize: 15, lineHeight: 24 }}>
            {fileDocument.content}
          </Text>
        ) : fileDocument?.content ? (
          <View>
            {fileLoading ? (
              <ActivityIndicator style={{ position: 'absolute', right: 0, top: 0 }} color={colors.primary} />
            ) : null}
            <RenderHTML
              contentWidth={resolveDocumentWidth(width)}
              source={{ html: fileDocument.content }}
              ignoredDomTags={['meta', 'title']}
              baseStyle={{ color: '#1e293b', fontSize: 15, lineHeight: 24 }}
            />
          </View>
        ) : (
          <Text style={{ color: '#64748b' }}>Gerando proposta...</Text>
        )}
      </DocumentDetailsShell>

      <DocumentSheet
        visible={productsOpen}
        onClose={() => setProductsOpen(false)}
        theme={documentTheme}
        title="Produtos da proposta"
        subtitle={
          orderSummary.count
            ? `${orderSummary.count} ${orderSummary.count === 1 ? 'item' : 'itens'} · ${orderSummary.totalLabel}`
            : 'Nenhum produto ainda'
        }>
        {contract ? (
          <LinkedOrderProductsTab
            contract={contract}
            canEdit={canEdit}
            emptyTitle="Nenhum produto vinculado a esta proposta."
            emptySubtitle="Adicione os produtos negociados; a proposta é atualizada automaticamente."
            searchPlaceholder="Buscar produto para adicionar..."
            onProductsChanged={handleProductsChanged}
            embedded
          />
        ) : null}
      </DocumentSheet>
    </>
  );
};

export default ProposalDetails;
