import { createStore } from 'vuex'
import axios from 'axios'

export default createStore({
  state: {
    // baseUrl: 'http://localhost:5000', // Point to the local mock server
    baseUrl: 'http://study.madaniyhayot.uz', // Replace with your actual API base URL
    token: localStorage.getItem('admin_token') || '',
    user: null,
    certifiedUsers: [],
    applications: [],
    applicationStats: {}
  },
  getters: {
    isAuthenticated: state => !!state.token,
    getToken: state => state.token,
    getApplicationStats: state => state.applicationStats
  },
  mutations: {
    setToken(state, token) {
      state.token = token
      localStorage.setItem('admin_token', token)
    },
    clearToken(state) {
      state.token = ''
      localStorage.removeItem('admin_token')
    },
    setCertifiedUsers(state, users) {
      state.certifiedUsers = users
    },
    setApplications(state, applications) {
      state.applications = applications
    },
    setApplicationStats(state, stats) {
      state.applicationStats = stats
    }
  },
  actions: {
    // Login action
    async login({ commit }, credentials) {
      try {
        const response = await axios.post(`${this.state.baseUrl}/api/admin/login`, credentials)
        if (response.data.success) {
          commit('setToken', response.data.result.token)
          return true
        }
        return false
      } catch (error) {
        console.error('Login error:', error)
        return false
      }
    },
    
    // Logout action
    logout({ commit }) {
      commit('clearToken')
    },
    
    // Fetch certified users
    async fetchCertifiedUsers({ commit, getters }) {
      try {
        const response = await axios.get(`${this.state.baseUrl}/api/site/volunteers`, {
          headers: {
            Authorization: getters.getToken
          }
        })
        if (response.data.success) {
          commit('setCertifiedUsers', response.data.result)
        }
      } catch (error) {
        console.error('Error fetching certified users:', error)
      }
    },
    
    // Fetch applications
    async fetchApplications({ commit, getters }) {
      try {
        const response = await axios.get(`${this.state.baseUrl}/api/admin/applications`, {
          params: { token: getters.getToken }
        })
        if (response.data.success) {
          commit('setApplications', response.data.result.rows)
          commit('setApplicationStats', {
            total: response.data.result.totalNumberApplications,
            new: response.data.result.newApplications,
            finished: response.data.result.finishedApplications,
            accepted: response.data.result.acceptedApplications,
            cancelled: response.data.result.cancelledApplications
          })
        }
      } catch (error) {
        console.error('Error fetching applications:', error)
      }
    },
    
    // Change application status
    async changeApplicationStatus({ dispatch, getters }, { applicationId, status }) {
      try {
        const response = await axios.put(
          `${this.state.baseUrl}/api/admin/applications/${applicationId}`, 
          { status },
          { params: { token: getters.getToken } }
        )
        if (response.data.success) {
          // Refresh the applications list
          dispatch('fetchApplications')
          return true
        }
        return false
      } catch (error) {
        console.error('Error changing application status:', error)
        return false
      }
    },
    
    // Create certificate
    async createCertificate({ dispatch, getters }, applicationId) {
      try {
        const response = await axios.put(
          `${this.state.baseUrl}/api/admin/applications/certificate/${applicationId}`,
          { status: 'done' },
          { params: { token: getters.getToken } }
        )
        if (response.data.success) {
          // Refresh the applications list
          dispatch('fetchApplications')
          return response.data.result
        }
        return null
      } catch (error) {
        console.error('Error creating certificate:', error)
        return null
      }
    }
  }
}) 