const getInitialAuthState = () => {
  try {
    const token = localStorage.getItem("access_token");
    const userRaw = localStorage.getItem("user");
    const user = userRaw ? JSON.parse(userRaw) : null;

    return {
      token: token || null,
      user,
      isAuthenticated: Boolean(token),
    };
  } catch (_error) {
    return {
      token: null,
      user: null,
      isAuthenticated: false,
    };
  }
};

export const initialStore = () => ({
  message: null,
  auth: getInitialAuthState(),
});

export default function storeReducer(store, action = {}) {
  switch (action.type) {
    case "set_hello":
      return {
        ...store,
        message: action.payload,
      };

    case "set_auth":
      return {
        ...store,
        auth: {
          token: action.payload?.token || null,
          user: action.payload?.user || null,
          isAuthenticated: Boolean(action.payload?.token),
        },
      };

    case "clear_auth":
      return {
        ...store,
        auth: {
          token: null,
          user: null,
          isAuthenticated: false,
        },
      };

    default:
      return store;
  }
}
