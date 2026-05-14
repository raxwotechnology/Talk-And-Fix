import { create } from 'zustand';

const useAdminStore = create((set) => ({
  selectedStoreId: localStorage.getItem('admin_selected_store') || 'all',
  setSelectedStoreId: (id) => {
    localStorage.setItem('admin_selected_store', id);
    set({ selectedStoreId: id });
  },
}));

export default useAdminStore;
