import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
} from "react";
import {
  listingsAPI,
  authAPI,
  ordersAPI,
  paymentsAPI,
  adminAPI,
} from "../lib/api";

// Initial state
const initialState = {
  // Listings
  listings: [],
  listingsLoading: false,
  listingsError: null,

  // Single listing
  currentListing: null,
  currentListingLoading: false,
  currentListingError: null,

  // Orders
  orders: [],
  ordersLoading: false,
  ordersError: null,

  // Admin data
  adminStats: null,
  adminUsers: [],
  adminOrders: [],
  adminRevenue: [],
  adminAnalytics: null,
  adminPayouts: [],
  adminLoading: false,
  adminError: null,

  // Search filters
  filters: {
    search: "",
    category: "",
    priceMin: "",
    priceMax: "",
    startDate: "",
    endDate: "",
  },
};

// Action types
const ActionTypes = {
  // Listings
  SET_LISTINGS_LOADING: "SET_LISTINGS_LOADING",
  SET_LISTINGS_SUCCESS: "SET_LISTINGS_SUCCESS",
  SET_LISTINGS_ERROR: "SET_LISTINGS_ERROR",

  // Single listing
  SET_CURRENT_LISTING_LOADING: "SET_CURRENT_LISTING_LOADING",
  SET_CURRENT_LISTING_SUCCESS: "SET_CURRENT_LISTING_SUCCESS",
  SET_CURRENT_LISTING_ERROR: "SET_CURRENT_LISTING_ERROR",

  // Orders
  SET_ORDERS_LOADING: "SET_ORDERS_LOADING",
  SET_ORDERS_SUCCESS: "SET_ORDERS_SUCCESS",
  SET_ORDERS_ERROR: "SET_ORDERS_ERROR",
  ADD_ORDER: "ADD_ORDER",

  // Admin
  SET_ADMIN_LOADING: "SET_ADMIN_LOADING",
  SET_ADMIN_STATS_SUCCESS: "SET_ADMIN_STATS_SUCCESS",
  SET_ADMIN_USERS_SUCCESS: "SET_ADMIN_USERS_SUCCESS",
  SET_ADMIN_ORDERS_SUCCESS: "SET_ADMIN_ORDERS_SUCCESS",
  SET_ADMIN_REVENUE_SUCCESS: "SET_ADMIN_REVENUE_SUCCESS",
  SET_ADMIN_ANALYTICS_SUCCESS: "SET_ADMIN_ANALYTICS_SUCCESS",
  SET_ADMIN_PAYOUTS_SUCCESS: "SET_ADMIN_PAYOUTS_SUCCESS",
  SET_ADMIN_ERROR: "SET_ADMIN_ERROR",

  // Filters
  SET_FILTERS: "SET_FILTERS",
  CLEAR_FILTERS: "CLEAR_FILTERS",
};

// Reducer
function dataReducer(state, action) {
  switch (action.type) {
    // Listings
    case ActionTypes.SET_LISTINGS_LOADING:
      return { ...state, listingsLoading: action.payload, listingsError: null };
    case ActionTypes.SET_LISTINGS_SUCCESS:
      return {
        ...state,
        listings: action.payload,
        listingsLoading: false,
        listingsError: null,
      };
    case ActionTypes.SET_LISTINGS_ERROR:
      return {
        ...state,
        listingsError: action.payload,
        listingsLoading: false,
      };

    // Single listing
    case ActionTypes.SET_CURRENT_LISTING_LOADING:
      return {
        ...state,
        currentListingLoading: action.payload,
        currentListingError: null,
      };
    case ActionTypes.SET_CURRENT_LISTING_SUCCESS:
      return {
        ...state,
        currentListing: action.payload,
        currentListingLoading: false,
        currentListingError: null,
      };
    case ActionTypes.SET_CURRENT_LISTING_ERROR:
      return {
        ...state,
        currentListingError: action.payload,
        currentListingLoading: false,
      };

    // Orders
    case ActionTypes.SET_ORDERS_LOADING:
      return { ...state, ordersLoading: action.payload, ordersError: null };
    case ActionTypes.SET_ORDERS_SUCCESS:
      return {
        ...state,
        orders: action.payload,
        ordersLoading: false,
        ordersError: null,
      };
    case ActionTypes.SET_ORDERS_ERROR:
      return { ...state, ordersError: action.payload, ordersLoading: false };
    case ActionTypes.ADD_ORDER:
      return { ...state, orders: [...state.orders, action.payload] };

    // Admin
    case ActionTypes.SET_ADMIN_LOADING:
      return { ...state, adminLoading: action.payload, adminError: null };
    case ActionTypes.SET_ADMIN_STATS_SUCCESS:
      return {
        ...state,
        adminStats: action.payload,
        adminLoading: false,
        adminError: null,
      };
    case ActionTypes.SET_ADMIN_USERS_SUCCESS:
      return {
        ...state,
        adminUsers: action.payload,
        adminLoading: false,
        adminError: null,
      };
    case ActionTypes.SET_ADMIN_ORDERS_SUCCESS:
      return {
        ...state,
        adminOrders: action.payload,
        adminLoading: false,
        adminError: null,
      };
    case ActionTypes.SET_ADMIN_REVENUE_SUCCESS:
      return {
        ...state,
        adminRevenue: action.payload,
        adminLoading: false,
        adminError: null,
      };
    case ActionTypes.SET_ADMIN_ANALYTICS_SUCCESS:
      return {
        ...state,
        adminAnalytics: action.payload,
        adminLoading: false,
        adminError: null,
      };
    case ActionTypes.SET_ADMIN_PAYOUTS_SUCCESS:
      return {
        ...state,
        adminPayouts: action.payload,
        adminLoading: false,
        adminError: null,
      };
    case ActionTypes.SET_ADMIN_ERROR:
      return { ...state, adminError: action.payload, adminLoading: false };

    // Filters
    case ActionTypes.SET_FILTERS:
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case ActionTypes.CLEAR_FILTERS:
      return { ...state, filters: initialState.filters };

    default:
      return state;
  }
}

// Create contexts
const DataStateContext = createContext();
const DataDispatchContext = createContext();

// Provider component
export function DataProvider({ children }) {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  // Actions
  const actions = useMemo(
    () => ({
      // Listings actions
      async fetchListings(filters = {}) {
        dispatch({ type: ActionTypes.SET_LISTINGS_LOADING, payload: true });
        try {
          const response = await listingsAPI.getAll(filters);
          const listings = response.data?.data?.listings || [];
          dispatch({
            type: ActionTypes.SET_LISTINGS_SUCCESS,
            payload: listings,
          });
          return listings;
        } catch (error) {
          dispatch({
            type: ActionTypes.SET_LISTINGS_ERROR,
            payload: error.message,
          });
          throw error;
        }
      },

      async fetchListing(id) {
        dispatch({
          type: ActionTypes.SET_CURRENT_LISTING_LOADING,
          payload: true,
        });
        try {
          const response = await listingsAPI.getById(id);
          const listing = response.data?.data || null;
          dispatch({
            type: ActionTypes.SET_CURRENT_LISTING_SUCCESS,
            payload: listing,
          });
          return listing;
        } catch (error) {
          dispatch({
            type: ActionTypes.SET_CURRENT_LISTING_ERROR,
            payload: error.message,
          });
          throw error;
        }
      },

      // Orders actions
      async fetchOrders() {
        dispatch({ type: ActionTypes.SET_ORDERS_LOADING, payload: true });
        try {
          const response = await ordersAPI.getMyOrders();
          const orders = response.data?.data || [];
          dispatch({ type: ActionTypes.SET_ORDERS_SUCCESS, payload: orders });
          return orders;
        } catch (error) {
          dispatch({
            type: ActionTypes.SET_ORDERS_ERROR,
            payload: error.message,
          });
          throw error;
        }
      },

      async createOrder(orderData) {
        try {
          const response = await ordersAPI.create(orderData);
          const newOrder = response.data?.data;
          if (newOrder) {
            dispatch({ type: ActionTypes.ADD_ORDER, payload: newOrder });
          }
          return newOrder;
        } catch (error) {
          throw error;
        }
      },

      // Admin actions
      async fetchAdminStats() {
        dispatch({ type: ActionTypes.SET_ADMIN_LOADING, payload: true });
        try {
          const response = await adminAPI.getDashboard();
          const stats = response.data?.data || null;
          dispatch({
            type: ActionTypes.SET_ADMIN_STATS_SUCCESS,
            payload: stats,
          });
          return stats;
        } catch (error) {
          dispatch({
            type: ActionTypes.SET_ADMIN_ERROR,
            payload: error.message,
          });
          throw error;
        }
      },

      async fetchAdminUsers() {
        dispatch({ type: ActionTypes.SET_ADMIN_LOADING, payload: true });
        try {
          const response = await adminAPI.getUsers();
          const users = response.data?.data || [];
          dispatch({
            type: ActionTypes.SET_ADMIN_USERS_SUCCESS,
            payload: users,
          });
          return users;
        } catch (error) {
          dispatch({
            type: ActionTypes.SET_ADMIN_ERROR,
            payload: error.message,
          });
          throw error;
        }
      },

      async fetchAdminOrders() {
        dispatch({ type: ActionTypes.SET_ADMIN_LOADING, payload: true });
        try {
          const response = await adminAPI.getOrders();
          const orders = response.data?.data || [];
          dispatch({
            type: ActionTypes.SET_ADMIN_ORDERS_SUCCESS,
            payload: orders,
          });
          return orders;
        } catch (error) {
          dispatch({
            type: ActionTypes.SET_ADMIN_ERROR,
            payload: error.message,
          });
          throw error;
        }
      },

      async fetchAdminRevenue() {
        dispatch({ type: ActionTypes.SET_ADMIN_LOADING, payload: true });
        try {
          const response = await adminAPI.getAnalytics();
          const revenue = response.data?.data?.revenueOverTime || [];
          dispatch({
            type: ActionTypes.SET_ADMIN_REVENUE_SUCCESS,
            payload: revenue,
          });
          return revenue;
        } catch (error) {
          dispatch({
            type: ActionTypes.SET_ADMIN_ERROR,
            payload: error.message,
          });
          throw error;
        }
      },

      async fetchAdminAnalytics() {
        dispatch({ type: ActionTypes.SET_ADMIN_LOADING, payload: true });
        try {
          const response = await adminAPI.getAnalytics();
          const analytics = response.data?.data || {};
          dispatch({
            type: ActionTypes.SET_ADMIN_ANALYTICS_SUCCESS,
            payload: analytics,
          });
          return analytics;
        } catch (error) {
          dispatch({
            type: ActionTypes.SET_ADMIN_ERROR,
            payload: error.message,
          });
          throw error;
        }
      },

      async fetchAdminPayouts() {
        dispatch({ type: ActionTypes.SET_ADMIN_LOADING, payload: true });
        try {
          const response = await adminAPI.getPayouts();
          const payouts = response.data?.data || [];
          dispatch({
            type: ActionTypes.SET_ADMIN_PAYOUTS_SUCCESS,
            payload: payouts,
          });
          return payouts;
        } catch (error) {
          dispatch({
            type: ActionTypes.SET_ADMIN_ERROR,
            payload: error.message,
          });
          throw error;
        }
      },

      // Filter actions
      setFilters(newFilters) {
        dispatch({ type: ActionTypes.SET_FILTERS, payload: newFilters });
      },

      clearFilters() {
        dispatch({ type: ActionTypes.CLEAR_FILTERS });
      },
    }),
    []
  );

  return (
    <DataStateContext.Provider value={state}>
      <DataDispatchContext.Provider value={actions}>
        {children}
      </DataDispatchContext.Provider>
    </DataStateContext.Provider>
  );
}

// Custom hooks
export function useDataState() {
  const context = useContext(DataStateContext);
  if (context === undefined) {
    throw new Error("useDataState must be used within a DataProvider");
  }
  return context;
}

export function useDataActions() {
  const context = useContext(DataDispatchContext);
  if (context === undefined) {
    throw new Error("useDataActions must be used within a DataProvider");
  }
  return context;
}

// Combined hook for convenience
export function useData() {
  return {
    state: useDataState(),
    actions: useDataActions(),
  };
}
