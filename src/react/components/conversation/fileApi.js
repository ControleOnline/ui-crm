/*
 * @agents Attachments of the conversation: upload through /files/upload (owner = company) and
 * authenticated download (files are private: an <img> cannot send the API token, so web reads a blob).
 */
import {Platform} from 'react-native';
import {env as APP_ENV} from '@env';
import {api} from '@controleonline/ui-common/src/api';
import {selectFile, uploadFileToApi} from '@controleonline/ui-default/src/react/components/upload/fileUpload';

export {selectFile};

export const fileIdOf = value => {
  if (!value && value !== 0) return null;
  if (typeof value === 'number') return value;
  const raw = typeof value === 'string' ? value : value?.['@id'] || value?.id;
  const match = String(raw || '').match(/(\d+)$/);
  return match ? Number(match[1]) : null;
};

export const uploadAttachment = async (file, companyId) => {
  const result = await uploadFileToApi({file, context: 'tasks', peopleId: companyId});
  const id = fileIdOf(result?.['@id'] || result?.id || result?.file);
  if (!id) throw new Error('Falha no upload do arquivo.');
  return id;
};

const session = () => {
  try {
    return JSON.parse(localStorage.getItem('session') || '{}');
  } catch (e) {
    return {};
  }
};

export const authHeaders = () => ({
  'API-TOKEN': session()?.api_key || session()?.token || '',
  'App-Domain': APP_ENV?.DOMAIN || (typeof location !== 'undefined' ? location.host : ''),
});

export const downloadUrl = id => `${String(APP_ENV?.API_ENTRYPOINT || '').replace(/\/$/, '')}/files/${id}/download`;

const metaCache = new Map();

/** {fileName, fileType, extension} — cached; null when the user cannot read it. */
export const fetchFileMeta = async id => {
  if (!id) return null;
  if (!metaCache.has(id)) {
    metaCache.set(id, api.fetch(`/files/${id}`).catch(() => null));
  }
  return metaCache.get(id);
};

const blobCache = new Map();

/** Web: object URL of the file (cached per id). Native: {uri, headers} source. */
export const fileSource = async id => {
  if (Platform.OS !== 'web') return {uri: downloadUrl(id), headers: authHeaders()};
  if (!blobCache.has(id)) {
    blobCache.set(
      id,
      fetch(downloadUrl(id), {headers: authHeaders()})
        .then(res => (res.ok ? res.blob() : Promise.reject(new Error(`HTTP ${res.status}`))))
        .then(blob => ({uri: URL.createObjectURL(blob), type: blob.type}))
        .catch(error => {
          blobCache.delete(id);
          throw error;
        }),
    );
  }
  return blobCache.get(id);
};

export const kindOf = (meta, mime = '') => {
  const type = String(meta?.fileType || mime.split('/')[0] || '').toLowerCase();
  if (type === 'image') return 'image';
  if (type === 'audio' || /\.(webm|m4a|mp3|ogg|wav|aac)$/i.test(meta?.fileName || '')) return 'audio';
  return 'file';
};
