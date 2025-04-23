import { createStore } from 'vuex'
import axios from 'axios'

// Create axios instance with interceptors
const setupAxiosInterceptors = (store) => {
  axios.interceptors.response.use(
    response => response,
    error => {
      // Check for unauthorized errors (401, 403)
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.log('Unauthorized request detected, logging out...')
        store.commit('clearToken')
      }
      return Promise.reject(error)
    }
  )
}

const store = createStore({
  state: {
    // baseUrl: 'http://localhost:5000', // Point to the local mock server
    baseUrl: 'https://study.madaniyhayot.uz', // Replace with your actual API base URL
    token: localStorage.getItem('admin_token') || '',
    user: null,
    certifiedUsers: [],
    applications: [],
    applicationStats: {
      total: 0,
      new: 0,
      finished: 0,
      accepted: 0,
      cancelled: 0,
      count: 0 // Total count for pagination
    },
    regions: []
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
      state.applicationStats = {
        ...state.applicationStats,
        ...stats
      }
    },
    setRegions(state, regions) {
      state.regions = regions
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
    async fetchCertifiedUsers({ commit, getters }, options = {}) {
      try {
        const { searchWord, region_id, offset = 0, limit = 10 } = options
        
        // Build query params
        const params = {}
        if (searchWord) params.searchWord = searchWord
        if (region_id) params.region_id = region_id
        
        // Add pagination params
        params.offset = offset
        params.limit = limit
        
        const response = await axios.get(`${this.state.baseUrl}/api/site/volunteers`, {
          headers: {
            Authorization: getters.getToken
          },
          params
        })
        
        if (response.data.success) {
          commit('setCertifiedUsers', response.data.result.users)
          
          return {
            data: response.data.result.users || [],
            totalRecords: response.data.result.count || 0
          }
        }
        return { data: [], totalRecords: 0 }
      } catch (error) {
        console.error('Error fetching certified users:', error)
        return { data: [], totalRecords: 0 }
      }
    },
    
    // Fetch regions
    async fetchRegions({ commit, getters }) {
      try {
        const response = await axios.get(`${this.state.baseUrl}/api/site/regions`, {
          headers: {
            Authorization: getters.getToken
          }
        })
        if (response && response.data && response.data.result) {
          commit('setRegions', response.data.result)
        } else if (response && response.data) {
          commit('setRegions', response.data)
        }
      } catch (error) {
        console.error('Error fetching regions:', error)
      }
    },
    
    // Fetch applications with filters
    async fetchApplications({ commit, getters }, options = {}) {
      try {
        const { searchWord, status, region_id, offset = 0, limit = 10 } = options
        
        // Build query params
        const params = { token: getters.getToken }
        if (searchWord) params.searchWord = searchWord
        if (status) params.status = status
        if (region_id) params.region_id = region_id
        
        // Add pagination params
        params.offset = offset
        params.limit = limit
        
        const response = await axios.get(`${this.state.baseUrl}/api/admin/applications`, { params })
        
        if (response && response.data && response.data.success) {
          commit('setApplications', response.data.result.rows)
          commit('setApplicationStats', {
            total: response.data.result.totalNumberApplications,
            new: response.data.result.newApplications,
            finished: response.data.result.finishedApplications,
            accepted: response.data.result.acceptedApplications,
            cancelled: response.data.result.cancelledApplications,
            count: response.data.result.count // Total count for pagination
          })
        }
        
        return response && response.data && response.data.result ? {
          data: response.data.result.rows,
          totalRecords: response.data.result.count
        } : { data: [], totalRecords: 0 }
      } catch (error) {
        console.error('Error fetching applications:', error)
        return { data: [], totalRecords: 0 }
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
    },
    
    // Download certificate
    async downloadCertificate({ getters }, { certificateId, firstName, lastName }) {
      try {
        // Get certificate ID from object if passed as single object
        const id = certificateId && certificateId.certificate_id ? certificateId.certificate_id : certificateId;
        
        // Set responseType to blob to handle file download
        const response = await axios.get(
          `${this.state.baseUrl}/api/site/download/${id}`,
          {
            responseType: 'blob',
            headers: {
              Authorization: getters.getToken
            }
          }
        )
        
        // Create a URL for the blob
        const blob = new Blob([response.data])
        const url = window.URL.createObjectURL(blob)
        
        // Create a temporary link and trigger download
        const link = document.createElement('a')
        link.href = url
        
        // Use first name and last name if provided
        let filename = 'certificate.pdf'
        
        if (firstName && lastName) {
          filename = `${firstName} ${lastName}.pdf`
        } else {
          // Try to get filename from content-disposition header as fallback
          const contentDisposition = response.headers['content-disposition']
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/)
            if (filenameMatch && filenameMatch.length === 2) {
              filename = filenameMatch[1]
            }
          }
        }
        
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        link.remove()
        
        return true
      } catch (error) {
        console.error('Error downloading certificate:', error)
        return false
      }
    },
    
    // Fetch organizations with filters
    async fetchOrganizations({ getters }, options = {}) {
      try {
        const { searchWord, region_id, offset = 0, limit = 10 } = options
        
        // Build query params
        const params = { token: getters.getToken }
        if (searchWord) params.searchWord = searchWord
        if (region_id) params.region_id = region_id
        
        // Add pagination params
        params.offset = offset
        params.limit = limit
        
        const response = await axios.get(`${this.state.baseUrl}/api/admin/organizations`, { 
          params,
          headers: {
            Authorization: getters.getToken
          }
        })
        
        if (response && response.data && response.data.success) {
          // Return the organizations data and total count
          return {
            data: response.data.result.organizations || [],
            totalRecords: response.data.result.count || 0
          }
        }
        
        return { data: [], totalRecords: 0 }
      } catch (error) {
        console.error('Error fetching organizations:', error)
        return { data: [], totalRecords: 0 }
      }
    },
    
    // Add new organization
    async addOrganization({ getters }, organizationData) {
      try {
        const response = await axios.post(
          `${this.state.baseUrl}/api/admin/organizations/add`,
          organizationData,
          {
            headers: {
              Authorization: getters.getToken
            }
          }
        )
        
        if (response && response.data && response.data.success) {
          return {
            success: true,
            data: response.data.result
          }
        }
        
        return {
          success: false,
          error: response.data.error || 'Unknown error'
        }
      } catch (error) {
        console.error('Error adding organization:', error)
        return {
          success: false,
          error: (error.response && error.response.data && error.response.data.error) || error.message || 'Unknown error'
        }
      }
    },
    
    // Edit organization
    async editOrganization({ getters }, { id, organizationData }) {
      try {
        const response = await axios.put(
          `${this.state.baseUrl}/api/admin/organizations/edit/${id}`,
          organizationData,
          {
            headers: {
              Authorization: getters.getToken
            }
          }
        )
        
        if (response && response.data && response.data.success) {
          return {
            success: true,
            data: response.data.result
          }
        }
        
        return {
          success: false,
          error: response.data.error || 'Unknown error'
        }
      } catch (error) {
        console.error('Error editing organization:', error)
        return {
          success: false,
          error: (error.response && error.response.data && error.response.data.error) || error.message || 'Unknown error'
        }
      }
    },
    
    // Delete organization
    async deleteOrganization({ getters }, id) {
      try {
        const response = await axios.delete(
          `${this.state.baseUrl}/api/admin/organizations/${id}`,
          {
            headers: {
              Authorization: getters.getToken
            }
          }
        )
        
        if (response && response.data) {
          return {
            success: response.data.success
          }
        }
        
        return {
          success: false
        }
      } catch (error) {
        console.error('Error deleting organization:', error)
        return {
          success: false,
          error: (error.response && error.response.data && error.response.data.error) || error.message || 'Unknown error'
        }
      }
    }
  }
})

// Setup axios interceptors with access to the store
setupAxiosInterceptors(store)

export default store 
