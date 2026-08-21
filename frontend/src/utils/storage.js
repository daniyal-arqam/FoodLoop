export function getItem(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setItem(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* private mode */
  }
}

export function removeItem(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* private mode */
  }
}
