import { createContext, useContext, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./AuthContext";

const ListingsContext = createContext();

export const useListings = () => {
  const context = useContext(ListingsContext);
  if (!context) {
    throw new Error("useListings must be used within a ListingsProvider");
  }
  return context;
};

export const ListingsProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Invalidate all listings-related queries
  const refreshListings = useCallback(async () => {
    console.log("Refreshing all listings data...");

    // Invalidate all related queries
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["listings"] }),
      queryClient.invalidateQueries({ queryKey: ["hostListings"] }),
      queryClient.invalidateQueries({ queryKey: ["host-dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["host-orders"] }),
    ]);

    // Force refetch of critical data
    if (user?.isHost) {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["hostListings"] }),
        queryClient.refetchQueries({ queryKey: ["host-dashboard"] }),
      ]);
    }

    console.log("Listings data refreshed successfully");
  }, [queryClient, user?.isHost]);

  // Add a new listing to the cache optimistically
  const addListingOptimistic = useCallback(
    (newListing) => {
      console.log("Adding listing optimistically:", newListing);

      // Update hostListings cache
      queryClient.setQueryData(["hostListings"], (oldData) => {
        if (!oldData) return [newListing];
        return [newListing, ...oldData];
      });

      // Update host dashboard stats
      queryClient.setQueryData(["host-dashboard"], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          stats: {
            ...oldData.stats,
            totalListings: (oldData.stats?.totalListings || 0) + 1,
          },
        };
      });
    },
    [queryClient]
  );

  // Update a listing in the cache
  const updateListingInCache = useCallback(
    (listingId, updatedListing) => {
      console.log("Updating listing in cache:", listingId);

      queryClient.setQueryData(["hostListings"], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((listing) =>
          listing._id === listingId
            ? { ...listing, ...updatedListing }
            : listing
        );
      });
    },
    [queryClient]
  );

  // Remove a listing from the cache
  const removeListingFromCache = useCallback(
    (listingId) => {
      console.log("Removing listing from cache:", listingId);

      queryClient.setQueryData(["hostListings"], (oldData) => {
        if (!oldData) return oldData;
        return oldData.filter((listing) => listing._id !== listingId);
      });

      // Update host dashboard stats
      queryClient.setQueryData(["host-dashboard"], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          stats: {
            ...oldData.stats,
            totalListings: Math.max((oldData.stats?.totalListings || 1) - 1, 0),
          },
        };
      });
    },
    [queryClient]
  );

  const value = {
    refreshListings,
    addListingOptimistic,
    updateListingInCache,
    removeListingFromCache,
  };

  return (
    <ListingsContext.Provider value={value}>
      {children}
    </ListingsContext.Provider>
  );
};
