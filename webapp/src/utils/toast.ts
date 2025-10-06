import toast from 'react-hot-toast';


export const toastUtils = {

  success: (message: string) => {
    toast.success(message);
  },


  error: (message: string) => {
    toast.error(message);
  },


  info: (message: string) => {
    toast(message, {
      icon: 'ℹ️',
    });
  },


  loading: (message: string) => {
    return toast.loading(message);
  },


  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages);
  },

  dismiss: (toastId: string) => {
    toast.dismiss(toastId);
  },

  dismissAll: () => {
    toast.dismiss();
  },
};


export const showSuccess = toastUtils.success;
export const showError = toastUtils.error;
export const showInfo = toastUtils.info;
export const showLoading = toastUtils.loading;
export const showPromise = toastUtils.promise;
export const dismissToast = toastUtils.dismiss;
export const dismissAllToasts = toastUtils.dismissAll;
