<template>
  <div class="certified-users-container">
    <Card>
      <template #title>
        <div class="card-title">
          <span>{{ $t('certified_users') }}</span>
          <div class="actions-container">
            <Button icon="pi pi-download" 
                   :label="$t('download_all')" 
                   class="p-button-sm p-button-outlined download-all-btn"
                   @click="downloadAllCertificates"
                   :loading="downloadingAll"
                   :disabled="downloadingAll || !certifiedUsers.length" />
            <div class="search-container">
              <span class="p-input-icon-left">
                <InputText v-model="search" :placeholder="$t('search')" @input="applyFiltersDebounced" />
              </span>
            </div>
          </div>
        </div>
      </template>
      <template #content>
        <!-- Filters Section -->
        <div class="filters-section">
          <div class="filter-container">
            <Dropdown v-model="filters.region_id" 
                      :options="regionOptions" 
                      :placeholder="$t('region')"
                      optionLabel="label" 
                      optionValue="value"
                      @change="applyFilters"
                      :loading="regionsLoading"
                      class="p-inputtext-sm filter-dropdown" />
          </div>
          
          <div class="filter-container">
            <Button icon="pi pi-filter-slash" 
                   :label="$t('clear_filters')" 
                   class="p-button-outlined p-button-sm"
                   @click="clearFilters" />
          </div>
        </div>
        
        <div v-if="loading" class="loading-container">
          <ProgressSpinner />
        </div>
        <DataTable v-else :value="certifiedUsers" :lazy="true" :paginator="true" :rows="rowsPerPage"
                  :totalRecords="totalRecords"
                  :rowsPerPageOptions="[10, 20, 50, 100]"
                  v-model:first="first"
                  v-model:rows="rowsPerPage"
                  @page="onPage($event)"
                  :loading="loading"
                  responsiveLayout="scroll" stripedRows class="users-table"
                  :rowHover="true" currentPageReportTemplate="{first}-{last} / {totalRecords}"
                  paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                  @row-click="onRowClick" selectionMode="single">
          <Column field="first_name" :header="$t('first_name')" sortable></Column>
          <Column field="sur_name" :header="$t('surname')" sortable></Column>
          <Column field="mid_name" :header="$t('middle_name')" sortable></Column>
          <Column field="phone_number" :header="$t('phone')" sortable></Column>
          <Column field="email" :header="$t('email')" sortable></Column>
          <Column field="certificates" :header="$t('certificates')">
            <template #body="slotProps">
              <div v-if="slotProps.data && slotProps.data.certificates && slotProps.data.certificates.length > 0">
                <div v-if="expandedUsers[slotProps.data.user_id]">
                  <div v-for="(cert, index) in slotProps.data.certificates" :key="index" class="certificate-item">
                    <Button icon="pi pi-info-circle" class="p-button-text p-button-sm"
                           @click="viewCertificateDetails(cert)"
                           :label="$t(cert.category) + ' - ' + formatDate(cert.given_date)">
                    </Button>
                  </div>
                  <div class="certificate-collapse" v-if="slotProps.data.certificates.length > 2">
                    <Button icon="pi pi-minus" class="p-button-text p-button-sm p-button-secondary"
                           @click="toggleExpand(slotProps.data.user_id)"
                           :label="$t('collapse')">
                    </Button>
                  </div>
                </div>
                <div v-else>
                  <div v-for="(cert, index) in slotProps.data.certificates.slice(0, 2)" :key="index" class="certificate-item">
                    <Button icon="pi pi-info-circle" class="p-button-text p-button-sm"
                           @click="viewCertificateDetails(cert)"
                           :label="$t(cert.category) + ' - ' + formatDate(cert.given_date)">
                    </Button>
                  </div>
                  <div class="certificate-expand" v-if="slotProps.data.certificates.length > 2">
                    <Button icon="pi pi-plus" class="p-button-text p-button-sm p-button-secondary"
                           @click="toggleExpand(slotProps.data.user_id)"
                           :label="slotProps.data.certificates.length - 2 + ' ' + $t('more')">
                    </Button>
                  </div>
                </div>
              </div>
              <div v-else class="no-certificates">
                {{ $t('no_certificates') }}
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <Dialog v-model:visible="showCertDialog" :header="$t('certificate_details')" :style="{width: '500px'}" :modal="true" class="certificate-dialog">
      <div v-if="certDetails" class="certificate-modal">
        <div class="certificate-header">
          <div class="certificate-number-badge" v-if="certDetails.certificate_id">
            #{{ certDetails.certificate_id }}
          </div>
        </div>
        
        <div class="certificate-body">
          <div class="certificate-row">
            <div class="certificate-field">
              <span class="label">{{ $t('name') }}:</span>
              <span class="value">{{ certDetails.first_name }} {{ certDetails.sur_name }}</span>
            </div>
          </div>
          
          <div class="certificate-columns">
            <div class="certificate-field">
              <span class="label">{{ $t('middle_name') }}:</span>
              <span class="value">{{ certDetails.middle_name || '-' }}</span>
            </div>
            <div class="certificate-field">
              <span class="label">{{ $t('pin') }}:</span>
              <span class="value">{{ certDetails.pin }}</span>
            </div>
          </div>
          
          <div class="certificate-columns">
            <div class="certificate-field">
              <span class="label">{{ $t('issue_date') }}:</span>
              <span class="value">{{ formatDate(certDetails.given_date) }}</span>
            </div>
            <div class="certificate-field">
              <span class="label">{{ $t('expiry_date') }}:</span>
              <span class="value" :class="{'expired': isExpired(certDetails.expr_date)}">
                {{ formatDate(certDetails.expr_date) }}
                <Badge v-if="isExpired(certDetails.expr_date)" 
                      :value="$t('certificate_expired')" severity="danger" size="small" />
              </span>
            </div>
          </div>
          
          <div class="certificate-columns">
            <div class="certificate-field">
              <span class="label">{{ $t('category') }}:</span>
              <span class="value">{{ $t(certDetails.category) }}</span>
            </div>
            <div class="certificate-field">
              <span class="label">{{ $t('status') }}:</span>
              <span class="value certificate-status">{{ $t('certificate_' + certDetails.status) }}</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <Button :label="$t('close')" icon="pi pi-times" @click="showCertDialog = false" class="p-button-text" />
        <Button :label="$t('download_certificate')" icon="pi pi-download" class="p-button-success" 
               @click="downloadCertificate" :loading="downloadLoading" :disabled="downloadLoading" />
      </template>
    </Dialog>

    <!-- New User Detail Dialog -->
    <Dialog v-model:visible="showUserDialog" :header="$t('user_details')" :style="{width: '650px'}" :modal="true" class="user-detail-dialog">
      <div v-if="selectedUser" class="user-detail-container">
        <div class="user-header">
          <div class="user-badge">
            <img v-if="selectedUser.certificates && selectedUser.certificates.length > 0" :src="getImageUrl(selectedUser.certificates[0].badge_img)" alt="Badge" class="badge-image" />
            <i v-else class="pi pi-user" style="font-size: 3rem"></i>
          </div>
          <div class="user-header-info">
            <h2>{{ selectedUser.first_name }} {{ selectedUser.sur_name }}</h2>
            <div class="user-id">#{{ selectedUser.user_id }}</div>
          </div>
        </div>
        
        <div class="user-body">
          <div class="detail-section">
            <h3>{{ $t('personal_information') }}</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">{{ $t('first_name') }}</span>
                <span class="detail-value">{{ selectedUser.first_name }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ $t('surname') }}</span>
                <span class="detail-value">{{ selectedUser.sur_name }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ $t('middle_name') }}</span>
                <span class="detail-value">{{ selectedUser.middle_name || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ $t('phone') }}</span>
                <span class="detail-value">{{ selectedUser.phone_number }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ $t('email') }}</span>
                <span class="detail-value">{{ selectedUser.email || '-' }}</span>
              </div>
            </div>
          </div>
          
          <div class="detail-section" v-if="selectedUser.certificates && selectedUser.certificates.length > 0">
            <h3>{{ $t('certificates') }}</h3>
            <div class="certificates-list">
              <div v-for="(cert, index) in selectedUser.certificates" :key="index" class="certificate-item-detailed">
                <div class="certificate-card" @click="viewCertificateDetails(cert)">
                  <div class="certificate-card-header">
                    <span class="certificate-number">#{{ cert.certificate_id }}</span>
                    <Badge v-if="isExpired(cert.expr_date)" :value="$t('certificate_expired')" severity="danger" size="small" />
                    <Badge v-else :value="$t('certificate_active')" severity="success" size="small" />
                  </div>
                  <div class="certificate-card-body">
                    <div class="certificate-type">{{ $t(cert.category) }}</div>
                    <div class="certificate-dates">
                      <div class="certificate-date">
                        <span class="date-label">{{ $t('issue_date') }}:</span>
                        <span class="date-value">{{ formatDate(cert.given_date) }}</span>
                      </div>
                      <div class="certificate-date">
                        <span class="date-label">{{ $t('expiry_date') }}:</span>
                        <span class="date-value" :class="{'expired': isExpired(cert.expr_date)}">
                          {{ formatDate(cert.expr_date) }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="certificate-card-footer">
                    <Button icon="pi pi-info-circle" class="p-button-text p-button-sm" :label="$t('view_certificate')" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <Button :label="$t('close')" icon="pi pi-times" @click="showUserDialog = false" class="p-button-text" />
      </template>
    </Dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, inject } from 'vue'
import { useStore } from 'vuex'
import { useToast } from 'primevue/usetoast'

export default {
  name: 'CertifiedUsers',
  setup() {
    const store = useStore()
    const toast = useToast()
    const i18n = inject('i18n')
    
    const loading = ref(true)
    const regionsLoading = ref(true)
    const certifiedUsers = ref([])
    const regions = computed(() => store.state.regions)
    
    const first = ref(0)
    const rowsPerPage = ref(10)
    const totalRecords = ref(0)
    const search = ref('')
    
    const showCertDialog = ref(false)
    const certDetails = ref({})
    const downloadLoading = ref(false)
    const downloadingAll = ref(false)
    
    const showUserDialog = ref(false)
    const selectedUser = ref(null)
    
    const expandedUsers = ref({})

    // Filter state
    const filters = ref({
      region_id: null
    })
    
    // Region options for dropdown, built from fetched regions
    const regionOptions = computed(() => {
      const options = [{ label: i18n.t('all_regions'), value: null }]
      if (regions.value && regions.value.length) {
        regions.value.forEach(region => {
          options.push({
            label: region.name_uz, // Using Uzbek name by default
            value: region.region_id
          })
        })
      }
      return options
    })

    let debounceTimer
    const applyFiltersDebounced = () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        first.value = 0
        fetchUsers()
      }, 300)
    }

    const applyFilters = () => {
      first.value = 0
      fetchUsers()
    }
    
    const clearFilters = () => {
      search.value = ''
      filters.value.region_id = null
      first.value = 0
      fetchUsers()
    }
    
    const onPage = (event) => {
      first.value = event.first
      rowsPerPage.value = event.rows
      fetchUsers()
    }
    
    const fetchUsers = async () => {
      loading.value = true
      try {
        const result = await store.dispatch('fetchCertifiedUsers', {
          offset: first.value,
          limit: rowsPerPage.value,
          searchWord: search.value,
          region_id: filters.value.region_id
        })
        
        if (result && typeof result === 'object') {
          certifiedUsers.value = result.data || []
          totalRecords.value = result.totalRecords || 0
        } else {
          certifiedUsers.value = []
          totalRecords.value = 0
        }
      } catch (error) {
        console.error('Error fetching users:', error)
        toast.add({
          severity: 'error',
          summary: i18n.t('error'),
          detail: i18n.t('fetch_users_failed'),
          life: 3000
        })
        certifiedUsers.value = []
        totalRecords.value = 0
      } finally {
        loading.value = false
      }
    }
    
    onMounted(async () => {
      loading.value = true
      regionsLoading.value = true
      
      // Fetch regions
      await store.dispatch('fetchRegions')
      regionsLoading.value = false
      
      await fetchUsers()
    })
    
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleDateString()
    }
    
    const isExpired = (dateString) => {
      if (!dateString) return false
      const expiryDate = new Date(dateString)
      const today = new Date()
      return today > expiryDate
    }
    
    const getImageUrl = (imagePath) => {
      if (!imagePath) return '';
      return `${store.state.baseUrl}/api/cdn/${imagePath}`;
    }
    
    const onRowClick = (event) => {
      selectedUser.value = event.data;
      showUserDialog.value = true;
    }
    
    const viewCertificateDetails = (certificate) => {
      certDetails.value = certificate
      showCertDialog.value = true
      if (showUserDialog.value) {
        showUserDialog.value = false
      }
    }
    
    const downloadCertificate = async () => {
      if (!certDetails.value.certificate_id) {
        toast.add({
          severity: 'error',
          summary: i18n.t('error'),
          detail: i18n.t('certificate_not_found'),
          life: 3000
        })
        return
      }
      
      downloadLoading.value = true
      
      try {
        const success = await store.dispatch('downloadCertificate', {
          certificateId: certDetails.value.certificate_id,
          firstName: certDetails.value.first_name,
          lastName: certDetails.value.sur_name
        })
        
        if (success) {
          toast.add({
            severity: 'success',
            summary: i18n.t('success'),
            detail: i18n.t('certificate_download_started'),
            life: 3000
          })
          
          showCertDialog.value = false
        } else {
          toast.add({
            severity: 'error',
            summary: i18n.t('error'),
            detail: i18n.t('download_failed'),
            life: 3000
          })
        }
      } catch (error) {
        console.error('Download error:', error)
        toast.add({
          severity: 'error',
          summary: i18n.t('error'),
          detail: i18n.t('download_failed'),
          life: 3000
        })
      } finally {
        downloadLoading.value = false
      }
    }
    
    const downloadAllCertificates = async () => {
      if (!certifiedUsers.value.length) {
        toast.add({
          severity: 'info',
          summary: i18n.t('info'),
          detail: i18n.t('no_certificates_to_download'),
          life: 3000
        })
        return
      }
      
      downloadingAll.value = true
      
      try {
        // Extract all certificate IDs from current users
        const certificatesToDownload = []
        certifiedUsers.value.forEach(user => {
          if (user.certificates && user.certificates.length) {
            user.certificates.forEach(cert => {
              certificatesToDownload.push({
                certificateId: cert.certificate_id,
                firstName: cert.first_name || user.first_name,
                lastName: cert.sur_name || user.sur_name
              })
            })
          }
        })
        
        if (certificatesToDownload.length === 0) {
          toast.add({
            severity: 'info',
            summary: i18n.t('info'),
            detail: i18n.t('no_certificates_to_download'),
            life: 3000
          })
          downloadingAll.value = false
          return
        }
        
        // Call downloadCertificate for each certificate
        let successCount = 0
        let errorCount = 0
        
        for (const certData of certificatesToDownload) {
          try {
            const success = await store.dispatch('downloadCertificate', certData)
            if (success) {
              successCount++
            } else {
              errorCount++
            }
            // Add a small delay between downloads to prevent browser issues
            await new Promise(resolve => setTimeout(resolve, 300))
          } catch (error) {
            console.error(`Error downloading certificate ${certData.certificateId}:`, error)
            errorCount++
          }
        }
        
        if (successCount > 0) {
          toast.add({
            severity: 'success',
            summary: i18n.t('success'),
            detail: i18n.t('certificates_download_started') + 
                   (errorCount > 0 ? ` (${successCount}/${certificatesToDownload.length} ${i18n.t('successful')})` : ''),
            life: 3000
          })
        } else {
          toast.add({
            severity: 'error',
            summary: i18n.t('error'),
            detail: i18n.t('download_failed'),
            life: 3000
          })
        }
      } catch (error) {
        console.error('Download all error:', error)
        toast.add({
          severity: 'error',
          summary: i18n.t('error'),
          detail: i18n.t('download_failed'),
          life: 3000
        })
      } finally {
        downloadingAll.value = false
      }
    }
    
    const toggleExpand = (userId) => {
      expandedUsers.value[userId] = !expandedUsers.value[userId]
    }
    
    return {
      loading,
      regionsLoading,
      certifiedUsers,
      regions,
      filters,
      regionOptions,
      applyFilters,
      clearFilters,
      showCertDialog,
      certDetails,
      formatDate,
      isExpired,
      viewCertificateDetails,
      downloadCertificate,
      downloadAllCertificates,
      expandedUsers,
      toggleExpand,
      downloadLoading,
      downloadingAll,
      showUserDialog,
      selectedUser,
      onRowClick,
      getImageUrl,
      first,
      rowsPerPage,
      totalRecords,
      onPage,
      search,
      applyFiltersDebounced
    }
  }
}
</script>

<style scoped>
.certified-users-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.actions-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.download-all-btn {
  white-space: nowrap;
}

.certificate-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.25rem;
}

.no-certificates {
  color: #64748b;
  font-style: italic;
  font-size: 0.875rem;
}

.certificate-expand,
.certificate-collapse {
  margin-top: 0.5rem;
  display: flex;
  justify-content: center;
}

.certificate-expand .p-button-sm,
.certificate-collapse .p-button-sm {
  background-color: #f8fafc;
  color: #64748b;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px dashed #e2e8f0;
}

.certificate-expand .p-button-sm:hover,
.certificate-collapse .p-button-sm:hover {
  background-color: #f1f5f9;
  color: #334155;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

/* Filters Section */
.filters-section {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: center;
}

.filter-container {
  flex: 1;
  min-width: 200px;
}

.filter-dropdown {
  width: 100%;
}

.certificate-modal {
  background-color: #fff;
  border-radius: 10px;
  overflow: hidden;
}

.certificate-header {
  background: linear-gradient(135deg, #0891b2 0%, #0284c7 100%);
  color: white;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.certificate-logo {
  width: 60px;
  height: 60px;
  object-fit: contain;
  margin-bottom: 0.5rem;
  border-radius: 50%;
  background-color: white;
  padding: 0.5rem;
}

.certificate-header h2 {
  margin: 0;
  font-size: 1.25rem;
  text-align: center;
}

.certificate-number-badge {
  background-color: rgba(255,255,255,0.2);
  padding: 0.35rem 0.75rem;
  border-radius: 50px;
  font-size: 0.875rem;
  margin-top: 0.75rem;
  font-weight: 500;
}

.certificate-body {
  padding: 1.5rem;
}

.certificate-row {
  margin-bottom: 1.25rem;
}

.certificate-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.certificate-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.certificate-field .label {
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.certificate-field .value {
  font-size: 1rem;
  color: #0f172a;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.certificate-field .value.expired {
  color: #ef4444;
}

.certificate-status {
  text-transform: capitalize;
}

:deep(.p-button-text.p-button-sm) {
  padding: 0.35rem 0.75rem;
}

:deep(.certificate-dialog .p-dialog-content) {
  padding: 0;
  overflow: hidden;
}

@media (max-width: 767.98px) {
  .certificate-columns {
    grid-template-columns: 1fr;
  }
}

/* User Detail Dialog Styles */
.user-detail-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.user-badge {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-color: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.badge-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-header-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.user-header-info h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #1e293b;
}

.user-id {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.user-body {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-section h3 {
  margin: 0;
  font-size: 1.125rem;
  color: #1e293b;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
}

.detail-value {
  font-size: 1rem;
  color: #1e293b;
  font-weight: 500;
}

.certificates-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.certificate-item-detailed {
  border-radius: 8px;
  overflow: hidden;
}

.certificate-card {
  background-color: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  transition: all 0.2s ease;
  cursor: pointer;
}

.certificate-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e1;
}

.certificate-card-header {
  background: linear-gradient(135deg, #0891b2 0%, #0284c7 100%);
  color: white;
  padding: 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.certificate-number {
  font-weight: 600;
  font-size: 0.875rem;
}

.certificate-card-body {
  padding: 0.75rem;
}

.certificate-type {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.certificate-dates {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.certificate-date {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.date-label {
  color: #64748b;
}

.date-value {
  color: #1e293b;
  font-weight: 500;
}

.date-value.expired {
  color: #ef4444;
}

.certificate-card-footer {
  padding: 0.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: center;
}

:deep(.user-detail-dialog .p-dialog-content) {
  padding: 0;
  overflow: hidden;
}

@media (max-width: 767.98px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .certificates-list {
    grid-template-columns: 1fr;
  }
  
  .user-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
}

.search-container {
  flex: 1;
  max-width: 300px;
}

@media (max-width: 767.98px) {
  .card-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .actions-container {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    gap: 0.5rem;
  }
  
  .search-container {
    width: 100%;
    max-width: 100%;
  }
  
  .download-all-btn {
    width: 100%;
  }
}
</style> 