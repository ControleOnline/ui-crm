/*
 * @agents Requests screen (/ai) of the customer companies' teams (app-community#1592–#1595, #1597):
 * left, the user's requests with a status filter (default "open"); "Novo" asks Suporte or Comercial and
 * the first message opens the request (born without a responsible person). Right, the WhatsApp-like
 * conversation with text, attachments and voice notes. No direct AI chat here; information is read-only.
 */
import React, {useCallback, useState} from 'react';
import {ActivityIndicator, Modal, Pressable, ScrollView, Text, TouchableOpacity, useWindowDimensions, View} from 'react-native';
import useToastMessage from '../../hooks/useToastMessage';
import ConversationView from '../../components/conversation/ConversationView';
import OptionPicker from '../../components/conversation/OptionPicker';
import useChatPalette from '../../components/conversation/useChatPalette';
import {personName, REQUEST_TYPES, typeLabel} from '../../components/conversation/requestApi';
import useRequests from './useRequests';

const {idOf} = require('./mcpChatUtils');

const dateLabel = value => (value ? new Date(value).toLocaleDateString('pt-BR') : '');

export default function McpPage() {
  const palette = useChatPalette();
  const {showError} = useToastMessage();
  const onError = useCallback(message => showError(message), [showError]);
  const r = useRequests({onError});
  const {width} = useWindowDimensions();
  const narrow = width < 760;
  const [chooser, setChooser] = useState(false);

  const showChat = Boolean(r.activeId || r.draftType);
  const describe = useCallback(
    item => {
      if (item?.visibility === 'private' && idOf(item?.registeredBy) !== Number(r.meId)) return {kind: 'hidden'};
      const mine = idOf(item?.registeredBy) === Number(r.meId);
      return {side: mine ? 'right' : 'left', kind: 'msg', author: mine ? 'Você' : personName(item?.registeredBy) || 'Atendimento'};
    },
    [r.meId],
  );

  const statusOptions = [{value: '', label: 'Todos'}, ...r.statuses.map(s => ({value: s.status, label: s.status}))];

  const list = (
    <View style={{width: narrow ? '100%' : 320, borderRightWidth: narrow ? 0 : 1, borderRightColor: palette.border, backgroundColor: palette.panel, flex: narrow ? 1 : undefined}}>
      <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12}}>
        <Text style={{color: palette.text, fontWeight: '700', fontSize: 17}}>Solicitações</Text>
        <TouchableOpacity onPress={() => setChooser(true)} style={{backgroundColor: palette.chipActive, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7}}>
          <Text style={{color: palette.chipActiveText, fontWeight: '700'}}>Novo</Text>
        </TouchableOpacity>
      </View>
      <View style={{paddingHorizontal: 12}}>
        <OptionPicker label="Status" value={r.statusFilter} options={statusOptions} onChange={value => r.setStatusFilter(value)} />
      </View>
      {r.loadingList ? (
        <ActivityIndicator style={{marginTop: 16}} color={palette.primary} />
      ) : (
        <ScrollView>
          {!r.requests.length ? <Text style={{color: palette.muted, padding: 16}}>Nenhuma solicitação com este status.</Text> : null}
          {r.requests.map(item => {
            const id = idOf(item);
            const active = id === Number(r.activeId);
            return (
              <TouchableOpacity
                key={String(id)}
                onPress={() => r.open(id)}
                style={{paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: palette.border, backgroundColor: active ? palette.chip : 'transparent'}}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                  <Text style={{color: palette.text, fontWeight: '600', flex: 1}} numberOfLines={1}>
                    {item.name || `Solicitação #${id}`}
                  </Text>
                  <Text style={{color: palette.muted, fontSize: 11, marginLeft: 6}}>{dateLabel(item.alterDate)}</Text>
                </View>
                <Text style={{color: palette.muted, fontSize: 12, marginTop: 2}} numberOfLines={1}>
                  {[typeLabel(item.type), item.taskStatus?.status, personName(item.taskFor)].filter(Boolean).join(' · ')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );

  const task = r.task;
  const header = (
    <View style={{borderBottomWidth: 1, borderBottomColor: palette.border, backgroundColor: palette.panel, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4}}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6}}>
        {narrow ? (
          <TouchableOpacity onPress={() => r.open(null)}>
            <Text style={{color: palette.primary, fontSize: 18}}>‹</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={{color: palette.text, fontWeight: '700', fontSize: 16, flex: 1}} numberOfLines={1}>
          {r.draftType ? `Nova solicitação · ${typeLabel(r.draftType)}` : task?.name || 'Solicitação'}
        </Text>
      </View>
      {task ? (
        <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
          <OptionPicker label="Contexto" value={task.type} options={REQUEST_TYPES} />
          <OptionPicker label="Status" value={task.taskStatus?.status} options={[{value: task.taskStatus?.status, label: task.taskStatus?.status}]} />
          <OptionPicker label="Responsável" value="r" options={[{value: 'r', label: personName(task.taskFor) || 'Aguardando atendimento'}]} />
          {task.category ? <OptionPicker label="Categoria" value="c" options={[{value: 'c', label: task.category?.name || ''}]} /> : null}
          {task.dueDate ? <OptionPicker label="Previsão" value="d" options={[{value: 'd', label: dateLabel(task.dueDate)}]} /> : null}
        </View>
      ) : null}
    </View>
  );

  const chat = showChat ? (
    <ConversationView
      header={header}
      messages={r.messages}
      loading={r.loadingChat}
      describe={describe}
      onSend={r.send}
      uploadCompanyId={r.companyId}
      placeholder={r.draftType ? 'Descreva o que você precisa…' : 'Mensagem'}
      emptyText={r.draftType ? 'Escreva sua mensagem, anexe arquivos ou grave um áudio. Nossa equipe responde por aqui.' : 'Nenhuma mensagem ainda.'}
      onError={onError}
    />
  ) : (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background, padding: 24}}>
      <Text style={{color: palette.muted, textAlign: 'center'}}>Selecione uma solicitação ou toque em Novo.</Text>
    </View>
  );

  return (
    <View style={{flex: 1, flexDirection: 'row', minHeight: 0, backgroundColor: palette.background}}>
      {!narrow || !showChat ? list : null}
      {!narrow || showChat ? <View style={{flex: 1, minWidth: 0}}>{chat}</View> : null}
      <Modal visible={chooser} transparent animationType="fade" onRequestClose={() => setChooser(false)}>
        <Pressable style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24}} onPress={() => setChooser(false)}>
          <Pressable style={{backgroundColor: palette.panel, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: palette.border, maxWidth: 420, width: '100%', alignSelf: 'center'}}>
            <Text style={{color: palette.text, fontWeight: '700', fontSize: 17, marginBottom: 12}}>Nova solicitação</Text>
            {REQUEST_TYPES.map(t => (
              <TouchableOpacity
                key={t.value}
                onPress={() => {
                  setChooser(false);
                  r.startNew(t.value);
                }}
                style={{borderWidth: 1, borderColor: palette.border, borderRadius: 10, padding: 14, marginBottom: 10, backgroundColor: palette.chip}}>
                <Text style={{color: palette.text, fontWeight: '700', fontSize: 15}}>{t.label}</Text>
                <Text style={{color: palette.muted, marginTop: 2}}>{t.hint}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setChooser(false)} style={{alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 4}}>
              <Text style={{color: palette.muted}}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
