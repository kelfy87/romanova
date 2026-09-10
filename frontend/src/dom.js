export const element = (id) => document.getElementById(id);
export const formatNumber = (value) => value.toLocaleString("ru-RU");
let notificationTimeout;

export function notify(message) {
  const toast = element("toast");
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(notificationTimeout);
  notificationTimeout = setTimeout(() => {
    toast.hidden = true;
  }, 2600);
}
