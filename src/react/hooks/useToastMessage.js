import {useCallback} from 'react';
import {useMessage} from '@controleonline/ui-common/src/react/components/MessageService';

export default function useToastMessage() {
  const messageApi = useMessage() || {};

  const showToast = useCallback(
    (message, options = {}) => {
      if (typeof messageApi.showToast === 'function') {
        messageApi.showToast(message, {position: 'top', offsetTop: 86, ...options});
        return;
      }

      if (typeof messageApi.showError === 'function') {
        messageApi.showError(message);
        return;
      }

      if (typeof messageApi.showSuccess === 'function') {
        messageApi.showSuccess(message);
        return;
      }

      console.log(message);
    },
    [messageApi],
  );

  const showSuccess = useCallback(
    (message, options = {}) => {
      if (typeof messageApi.showSuccess === 'function') {
        messageApi.showSuccess(message, options);
        return;
      }

      showToast(message, options);
    },
    [messageApi, showToast],
  );

  const showError = useCallback(
    (message, options = {}) => {
      if (typeof messageApi.showError === 'function') {
        messageApi.showError(message, options);
        return;
      }

      showToast(message, options);
    },
    [messageApi, showToast],
  );

  return {
    showSuccess,
    showError,
    showInfo: showToast,
    showDialog: messageApi.showDialog,
  };
}
