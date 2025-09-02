import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  sidebarOpen: false,
  mobileMenuOpen: false,
  searchQuery: "",
  filters: {
    category: "",
    level: "",
    priceRange: [0, 1000],
    rating: 0,
  },
  notifications: [],
  loading: {
    global: false,
    courses: false,
    profile: false,
  },
  modal: {
    isOpen: false,
    title: "",
    message: "",
    type: "info", // 'info', 'success', 'error', 'warning'
    onConfirm: null,
    onCancel: null,
  },
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    setMobileMenuOpen: (state, action) => {
      state.mobileMenuOpen = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = {
        category: "",
        level: "",
        priceRange: [0, 1000],
        rating: 0,
      };
    },
    addNotification: (state, action) => {
      const notification = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        ...action.payload,
      };
      state.notifications.unshift(notification);

      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    markNotificationAsRead: (state, action) => {
      const notification = state.notifications.find(
        (n) => n.id === action.payload
      );
      if (notification) {
        notification.read = true;
      }
    },
    setLoading: (state, action) => {
      const { key, value } = action.payload;
      if (key in state.loading) {
        state.loading[key] = value;
      }
    },
    setGlobalLoading: (state, action) => {
      state.loading.global = action.payload;
    },
    showModal: (state, action) => {
      state.modal = {
        isOpen: true,
        title: "",
        message: "",
        type: "info",
        onConfirm: null,
        onCancel: null,
        ...action.payload,
      };
    },
    hideModal: (state) => {
      state.modal.isOpen = false;
    },
    updateModal: (state, action) => {
      state.modal = { ...state.modal, ...action.payload };
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleMobileMenu,
  setMobileMenuOpen,
  setSearchQuery,
  setFilters,
  resetFilters,
  addNotification,
  removeNotification,
  clearNotifications,
  markNotificationAsRead,
  setLoading,
  setGlobalLoading,
  showModal,
  hideModal,
  updateModal,
} = uiSlice.actions;

export const selectUI = (state) => state.ui;
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectMobileMenuOpen = (state) => state.ui.mobileMenuOpen;
export const selectSearchQuery = (state) => state.ui.searchQuery;
export const selectFilters = (state) => state.ui.filters;
export const selectNotifications = (state) => state.ui.notifications;
export const selectUnreadNotifications = (state) =>
  state.ui.notifications.filter((n) => !n.read);
export const selectLoading = (state) => state.ui.loading;
export const selectGlobalLoading = (state) => state.ui.loading.global;
export const selectModal = (state) => state.ui.modal;

export default uiSlice.reducer;
