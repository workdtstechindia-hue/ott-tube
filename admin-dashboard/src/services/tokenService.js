const TOKEN_KEY = "adminToken";
const USER_KEY = "adminUser";

const parseStoredUser = (value) => {
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const tokenService = {
  setToken: (token) => {
    if (!token) return;
    localStorage.setItem(TOKEN_KEY, token);
  },

  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY);
  },

  setUser: (user) => {
    if (!user) return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getUser: () => {
    return parseStoredUser(localStorage.getItem(USER_KEY));
  },

  removeUser: () => {
    localStorage.removeItem(USER_KEY);
  },

  clearAll: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
