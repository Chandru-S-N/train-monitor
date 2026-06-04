import { create } from 'zustand'

export const useDataStore = create((set, get) => ({
  // Live sensor readings (latest per train)
  liveData: {},           // { trainId: sensorData }
  allLiveReadings: [],    // last N readings for the rolling table
  alerts: [],
  alertStats: { total: 0, unresolved: 0, critical: 0, high: 0, medium: 0, low: 0 },
  isConnected: false,

  updateLiveData: (sensorData) => set(state => {
    const updated = { ...state.liveData, [sensorData.train_id]: sensorData }
    const readings = [sensorData, ...state.allLiveReadings].slice(0, 50)
    return { liveData: updated, allLiveReadings: readings }
  }),

  addAlert: (alert) => set(state => ({
    alerts: [alert, ...state.alerts].slice(0, 100),
    alertStats: {
      ...state.alertStats,
      total: state.alertStats.total + 1,
      unresolved: state.alertStats.unresolved + 1,
      [alert.severity]: (state.alertStats[alert.severity] || 0) + 1,
    }
  })),

  setAlerts: (alerts) => set({ alerts }),
  setAlertStats: (alertStats) => set({ alertStats }),
  setConnected: (isConnected) => set({ isConnected }),
}))
