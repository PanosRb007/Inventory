import { create } from 'zustand';

const useAppStore = create((set) => ({
  projects: [],
  materials: [],
  purchases: [],
  outflows: [],
  employees: [],
  locations: [],
  vendors: [],
  materialchanges: [],
  remainingQuantities: [],
  user: null,

  setProjects: (projects) => set({ projects }),
  setMaterials: (materials) => set({ materials }),
  setPurchases: (purchases) => set({ purchases: Array.isArray(purchases) ? purchases : [] }),
  setOutflows: (outflows) => set({ outflows }),
  setEmployees: (employees) => set({ employees }),
  setLocations: (locations) => set({ locations }),
  setVendors: (vendors) => set({ vendors }),
  setMaterialchanges: (materialchanges) => set({ materialchanges }),
  setRemainingQuantities: (remainingQuantities) => set({ remainingQuantities }),
  setUser: (user) => set({ user }),
  // Μπορείς να προσθέσεις και άλλες actions εδώ
}));

export default useAppStore;