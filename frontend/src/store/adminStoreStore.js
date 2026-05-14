import { create } from 'zustand';

const useAdminStoreStore = create((set) => ({
  selectedStoreId: localStorage.getItem('adminStoreId') || 'all',
  setSelectedStoreId: (id) => {
    localStorage.setItem('adminStoreId', id);
    set({ selectedStoreId: id });
  }
}));

export default useAdminStoreStore;
