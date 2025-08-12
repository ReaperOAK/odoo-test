import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { listingsAPI, hostAPI } from '../lib/api';

// Action types
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_LISTINGS: 'SET_LISTINGS',
  SET_HOST_LISTINGS: 'SET_HOST_LISTINGS',
  SET_HOST_DASHBOARD: 'SET_HOST_DASHBOARD',
  ADD_LISTING: 'ADD_LISTING',
  UPDATE_LISTING: 'UPDATE_LISTING',
  DELETE_LISTING: 'DELETE_LISTING',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Initial state
const initialState = {
  listings: [],
  hostListings: [],
  dashboardData: null,
  loading: {
    listings: false,
    hostListings: false,
    dashboard: false,
    create: false,
  },
  error: null,
  lastUpdated: null,
};

// Reducer
const listingsReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value,
        },
      };

    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: {
          ...state.loading,
          [action.payload.key]: false,
        },
      };

    case ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case ACTIONS.SET_LISTINGS:
      return {
        ...state,
        listings: action.payload,
        loading: {
          ...state.loading,
          listings: false,
        },
        lastUpdated: new Date().toISOString(),
      };

    case ACTIONS.SET_HOST_LISTINGS:
      return {
        ...state,
        hostListings: action.payload,
        loading: {
          ...state.loading,
          hostListings: false,
        },
        lastUpdated: new Date().toISOString(),
      };

    case ACTIONS.SET_HOST_DASHBOARD:
      return {
        ...state,
        dashboardData: action.payload,
        loading: {
          ...state.loading,
          dashboard: false,
        },
        lastUpdated: new Date().toISOString(),
      };

    case ACTIONS.ADD_LISTING:
      return {
        ...state,
        listings: [action.payload, ...state.listings],
        hostListings: [action.payload, ...state.hostListings],
        dashboardData: state.dashboardData ? {
          ...state.dashboardData,
          stats: {
            ...state.dashboardData.stats,
            totalListings: (state.dashboardData.stats?.totalListings || 0) + 1,
          },
        } : null,
        loading: {
          ...state.loading,
          create: false,
        },
        lastUpdated: new Date().toISOString(),
      };

    case ACTIONS.UPDATE_LISTING:
      return {
        ...state,
        listings: state.listings.map(listing => 
          listing._id === action.payload._id ? { ...listing, ...action.payload } : listing
        ),
        hostListings: state.hostListings.map(listing => 
          listing._id === action.payload._id ? { ...listing, ...action.payload } : listing
        ),
        lastUpdated: new Date().toISOString(),
      };

    case ACTIONS.DELETE_LISTING:
      return {
        ...state,
        listings: state.listings.filter(listing => listing._id !== action.payload),
        hostListings: state.hostListings.filter(listing => listing._id !== action.payload),
        dashboardData: state.dashboardData ? {
          ...state.dashboardData,
          stats: {
            ...state.dashboardData.stats,
            totalListings: Math.max((state.dashboardData.stats?.totalListings || 1) - 1, 0),
          },
        } : null,
        lastUpdated: new Date().toISOString(),
      };

    default:
      return state;
  }
};

// Context
const ListingsStateContext = createContext();

export const useListingsState = () => {
  const context = useContext(ListingsStateContext);
  if (!context) {
    throw new Error('useListingsState must be used within a ListingsStateProvider');
  }
  return context;
};

// Provider component
export const ListingsStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(listingsReducer, initialState);
  const { user } = useAuth();

  // Helper function to handle API errors
  const handleError = useCallback((error, key) => {
    console.error(`Error in ${key}:`, error);
    const errorMessage = error.response?.data?.message || error.message || `Failed to ${key}`;
    dispatch({
      type: ACTIONS.SET_ERROR,
      payload: { message: errorMessage, key },
    });
  }, []);

  // Fetch all listings
  const fetchListings = useCallback(async (filters = {}) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'listings', value: true } });
    dispatch({ type: ACTIONS.CLEAR_ERROR });

    try {
      const response = await listingsAPI.getAll(filters);
      dispatch({
        type: ACTIONS.SET_LISTINGS,
        payload: response.data.listings,
      });
      console.log('Fetched listings:', response.data.listings.length);
    } catch (error) {
      handleError(error, 'listings');
    }
  }, [handleError]);

  // Fetch host listings
  const fetchHostListings = useCallback(async () => {
    if (!user?.isHost) return;
    
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'hostListings', value: true } });
    dispatch({ type: ACTIONS.CLEAR_ERROR });

    try {
      const response = await hostAPI.getListings();
      dispatch({
        type: ACTIONS.SET_HOST_LISTINGS,
        payload: response.data.listings,
      });
      console.log('Fetched host listings:', response.data.listings.length);
    } catch (error) {
      handleError(error, 'hostListings');
    }
  }, [user?.isHost, handleError]);

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    if (!user?.isHost) return;
    
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'dashboard', value: true } });
    dispatch({ type: ACTIONS.CLEAR_ERROR });

    try {
      const response = await hostAPI.getDashboard();
      dispatch({
        type: ACTIONS.SET_HOST_DASHBOARD,
        payload: response.data,
      });
      console.log('Fetched dashboard data:', response.data);
    } catch (error) {
      handleError(error, 'dashboard');
    }
  }, [user?.isHost, handleError]);

  // Create listing
  const createListing = useCallback(async (listingData) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: { key: 'create', value: true } });
    dispatch({ type: ACTIONS.CLEAR_ERROR });

    try {
      const response = await listingsAPI.create(listingData);
      dispatch({
        type: ACTIONS.ADD_LISTING,
        payload: response.data.listing,
      });
      console.log('Created listing:', response.data.listing);
      return response.data.listing;
    } catch (error) {
      handleError(error, 'create');
      throw error;
    }
  }, [handleError]);

  // Update listing
  const updateListing = useCallback(async (listingId, updateData) => {
    try {
      const response = await listingsAPI.update(listingId, updateData);
      dispatch({
        type: ACTIONS.UPDATE_LISTING,
        payload: response.data.listing,
      });
      console.log('Updated listing:', response.data.listing);
      return response.data.listing;
    } catch (error) {
      handleError(error, 'update');
      throw error;
    }
  }, [handleError]);

  // Delete listing
  const deleteListing = useCallback(async (listingId) => {
    try {
      await listingsAPI.delete(listingId);
      dispatch({
        type: ACTIONS.DELETE_LISTING,
        payload: listingId,
      });
      console.log('Deleted listing:', listingId);
    } catch (error) {
      handleError(error, 'delete');
      throw error;
    }
  }, [handleError]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    console.log('Refreshing all listings data...');
    const promises = [fetchListings()];
    
    if (user?.isHost) {
      promises.push(fetchHostListings(), fetchDashboard());
    }
    
    await Promise.all(promises);
    console.log('All data refreshed successfully');
  }, [fetchListings, fetchHostListings, fetchDashboard, user?.isHost]);

  // Auto-fetch data when user changes
  useEffect(() => {
    if (user) {
      fetchListings();
      if (user.isHost) {
        fetchHostListings();
        fetchDashboard();
      }
    }
  }, [user?.isHost, fetchListings, fetchHostListings, fetchDashboard]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_ERROR });
  }, []);

  const value = {
    // State
    ...state,
    
    // Actions
    fetchListings,
    fetchHostListings,
    fetchDashboard,
    createListing,
    updateListing,
    deleteListing,
    refreshAll,
    clearError,
  };

  return (
    <ListingsStateContext.Provider value={value}>
      {children}
    </ListingsStateContext.Provider>
  );
};
