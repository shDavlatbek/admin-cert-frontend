<template>
  <div class="applications-container">
    <div class="stats-cards">
      <div class="stat-card total">
        <div class="stat-icon">
          <i class="pi pi-list"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">{{ $t('total_applications') }}</div>
          <div class="stat-value">{{ stats.total || 0 }}</div>
        </div>
      </div>
      <div class="stat-card new">
        <div class="stat-icon">
          <i class="pi pi-inbox"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">{{ $t('new_applications') }}</div>
          <div class="stat-value">{{ stats.new || 0 }}</div>
        </div>
      </div>
      <div class="stat-card accepted">
        <div class="stat-icon">
          <i class="pi pi-check-circle"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">{{ $t('accepted_applications') }}</div>
          <div class="stat-value">{{ stats.accepted || 0 }}</div>
        </div>
      </div>
      <div class="stat-card finished">
        <div class="stat-icon">
          <i class="pi pi-check-square"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">{{ $t('finished_applications') }}</div>
          <div class="stat-value">{{ stats.finished || 0 }}</div>
        </div>
      </div>
      <div class="stat-card cancelled">
        <div class="stat-icon">
          <i class="pi pi-times-circle"></i>
        </div>
        <div class="stat-content">
          <div class="stat-label">{{ $t('cancelled_applications') }}</div>
          <div class="stat-value">{{ stats.cancelled || 0 }}</div>
        </div>
      </div>
    </div>

    <Card>
      <template #title>
        <div class="card-title">
          <span>{{ $t('applications') }}</span>
        </div>
      </template>
      <template #content>
        <!-- Filters Section -->
        <div class="filters-section">
          <div class="filter-container">
            <span class="p-input-icon-left search-input">
              
              <InputText v-model="filters.searchWord" 
                         :placeholder="$t('search')" 
                         @input="applyFiltersDebounced"
                         class="p-inputtext-sm"/>
            </span>
          </div>
          
          <div class="filter-container">
            <Dropdown v-model="filters.status" 
                      :options="statusOptions" 
                      :placeholder="$t('status')"
                      optionLabel="label" 
                      optionValue="value"
                      @change="applyFilters"
                      class="p-inputtext-sm filter-dropdown" />
          </div>
          
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
        <DataTable v-else :value="applications" 
                  :lazy="true"
                  :paginator="true" 
                  :rows="rowsPerPage"
                  :totalRecords="totalRecords"
                  :rowsPerPageOptions="[5, 10, 20, 50]"
                  v-model:first="first"
                  v-model:rows="rowsPerPage"
                  @page="onPage($event)"
                  :loading="loading"
                  responsiveLayout="scroll" 
                  stripedRows 
                  class="applications-table"
                  :rowHover="true" 
                  currentPageReportTemplate="{first}-{last} / {totalRecords}"
                  paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                  @row-click="onRowClick" 
                  selectionMode="single">
          <Column field="application_number" :header="$t('application_number')" sortable></Column>
          <Column field="first_name" :header="$t('first_name')" sortable></Column>
          <Column field="sur_name" :header="$t('surname')" sortable></Column>
          <Column field="organization.name_uz" :header="$t('organization_name')">
            <template #body="slotProps">
              {{ slotProps.data && slotProps.data.organization && slotProps.data.organization.name_uz || '-' }}
            </template>
          </Column>
          <Column field="status" :header="$t('status')" sortable>
            <template #body="slotProps">
              <span class="status-badge" :class="slotProps.data.status">
                {{ $t(slotProps.data.status) }}
              </span>
            </template>
          </Column>
          <Column field="createdAt" :header="$t('created')" sortable>
            <template #body="slotProps">
              {{ formatDate(slotProps.data.createdAt) }}
            </template>
          </Column>
          <Column :header="$t('actions')">
            <template #body="slotProps">
              <div class="actions-container">
                <Button v-if="slotProps.data.status == 'new'" icon="pi pi-check" class="p-button-success p-button-sm"
                       @click="acceptApplication(slotProps.data)" :label="$t('accept')">
                </Button>
                <Button v-if="slotProps.data.status == 'new'" icon="pi pi-times" class="p-button-danger p-button-sm"
                       @click="cancelApplication(slotProps.data)" :label="$t('reject')">
                </Button>
                <Button v-if="slotProps.data.status == 'accepted'" icon="pi pi-id-card" class="p-button-info p-button-sm"
                       @click="createCertificate(slotProps.data)" :label="$t('certify')">
                </Button>
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <Dialog v-model:visible="showCertDialog" :header="$t('certificate_created')" :style="{width: '500px'}" :modal="true" :closable="false">
      <div class="certificate-details">
        <h3>{{ $t('certificate_created_success') }}</h3>
        <div class="certificate-field">
          <span class="label">{{ $t('name') }}:</span>
          <span class="value">{{ certDetails.first_name }} {{ certDetails.sur_name }}</span>
        </div>
        <div class="certificate-field">
          <span class="label">{{ $t('pin') }}:</span>
          <span class="value">{{ certDetails.pin }}</span>
        </div>
        <div class="certificate-field">
          <span class="label">{{ $t('issue_date') }}:</span>
          <span class="value">{{ formatDate(certDetails.given_date) }}</span>
        </div>
        <div class="certificate-field">
          <span class="label">{{ $t('expiry_date') }}:</span>
          <span class="value">{{ formatDate(certDetails.expr_date) }}</span>
        </div>
        <div class="certificate-field">
          <span class="label">{{ $t('category') }}:</span>
          <span class="value">{{ $t(certDetails.category) }}</span>
        </div>
      </div>
      <template #footer>
        <Button :label="$t('close')" icon="pi pi-times" @click="showCertDialog = false" class="p-button-text" />
        <Button :label="$t('download_certificate')" icon="pi pi-download" autofocus class="p-button-success" 
               @click="downloadCertificate" :loading="downloadLoading" :disabled="downloadLoading" />
      </template>
    </Dialog>

    <!-- New Application Detail Dialog -->
    <Dialog v-model:visible="showDetailDialog" :header="$t('application_details')" :style="{width: '650px'}" :modal="true" class="application-detail-dialog">
      <div v-if="selectedApplication" class="application-detail-container">
        <div class="application-header">
          <div class="application-badge">
            <img v-if="selectedApplication.badge_img" :src="getImageUrl(selectedApplication.badge_img)" alt="Badge" class="badge-image" />
            <i v-else class="pi pi-user" style="font-size: 3rem"></i>
          </div>
          <div class="application-header-info">
            <h2>{{ selectedApplication.first_name }} {{ selectedApplication.sur_name }}</h2>
            <div class="application-id">#{{ selectedApplication.application_number }}</div>
            <span class="status-badge" :class="selectedApplication.status">
              {{ $t(selectedApplication.status) }}
            </span>
          </div>
        </div>
        
        <div class="application-body">
          <div class="detail-section">
            <h3>{{ $t('personal_information') }}</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">{{ $t('first_name') }}</span>
                <span class="detail-value">{{ selectedApplication.first_name }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ $t('surname') }}</span>
                <span class="detail-value">{{ selectedApplication.sur_name }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ $t('middle_name') }}</span>
                <span class="detail-value">{{ selectedApplication.middle_name || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ $t('tin') }}</span>
                <span class="detail-value">{{ selectedApplication.tin || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ $t('phone') }}</span>
                <span class="detail-value">{{ selectedApplication && selectedApplication.phone_number || '-' }}</span>
              </div>
            </div>
          </div>
          
          <div class="detail-section">
            <h3>{{ $t('organization_information') }}</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">{{ $t('organization_name') }}</span>
                <span class="detail-value">{{ selectedApplication && selectedApplication.organization && selectedApplication.organization.name_uz || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ $t('region') }}</span>
                <span class="detail-value">{{ selectedApplication && selectedApplication.organization && selectedApplication.organization.region && selectedApplication.organization.region.name_uz || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ $t('inn') }}</span>
                <span class="detail-value">{{ selectedApplication && selectedApplication.organization && selectedApplication.organization.inn || '-' }}</span>
              </div>
            </div>
          </div>
          
          <div class="detail-section">
            <h3>{{ $t('application_information') }}</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">{{ $t('application_number') }}</span>
                <span class="detail-value">#{{ selectedApplication.application_number }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ $t('application_type') }}</span>
                <span class="detail-value">{{ $t(selectedApplication.application_type) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ $t('status') }}</span>
                <span class="detail-value status-text" :class="selectedApplication.status">{{ $t(selectedApplication.status) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ $t('created') }}</span>
                <span class="detail-value">{{ formatDate(selectedApplication.createdAt) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ $t('updated') }}</span>
                <span class="detail-value">{{ formatDate(selectedApplication.updatedAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <Button :label="$t('close')" icon="pi pi-times" @click="showDetailDialog = false" class="p-button-text" />
        <div v-if="selectedApplication && selectedApplication.status === 'new'" class="footer-actions">
          <Button :label="$t('accept')" icon="pi pi-check" @click="acceptApplication(selectedApplication); showDetailDialog = false" class="p-button-success" />
          <Button :label="$t('reject')" icon="pi pi-times" @click="cancelApplication(selectedApplication); showDetailDialog = false" class="p-button-danger" />
        </div>
        <Button v-if="selectedApplication && selectedApplication.status === 'accepted'" :label="$t('certify')" icon="pi pi-id-card" 
               @click="createCertificate(selectedApplication); showDetailDialog = false" class="p-button-info" />
      </template>
    </Dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, inject } from 'vue'
import { useStore } from 'vuex'
import { useToast } from 'primevue/usetoast'

export default {
  name: 'Applications',
  setup() {
    const store = useStore()
    const toast = useToast()
    const i18n = inject('i18n')
    
    const loading = ref(true)
    const regionsLoading = ref(true)
    const applications = ref([])
    const stats = computed(() => store.getters.getApplicationStats)
    const regions = computed(() => store.state.regions)
    
    // Pagination
    const first = ref(0)
    const rowsPerPage = ref(10)
    const totalRecords = ref(0)
    
    const showCertDialog = ref(false)
    const certDetails = ref({})
    const downloadLoading = ref(false)
    
    // New refs for application details dialog
    const showDetailDialog = ref(false)
    const selectedApplication = ref(null)
    
    // Filter state
    const filters = ref({
      searchWord: '',
      status: null,
      region_id: null
    })
    
    // Status options for dropdown
    const statusOptions = [
      { label: i18n.t('all_statuses'), value: null },
      { label: i18n.t('new'), value: 'new' },
      { label: i18n.t('accepted'), value: 'accepted' },
      { label: i18n.t('done'), value: 'done' },
      { label: i18n.t('cancelled'), value: 'cancelled' }
    ]
    
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
    
    // Debounce function for search input
    let debounceTimer
    const applyFiltersDebounced = () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        applyFilters()
      }, 300)
    }
    
    // Apply filters and fetch data
    const applyFilters = async () => {
      loading.value = true
      
      const offset = first.value
      
      const result = await store.dispatch('fetchApplications', { 
        searchWord: filters.value.searchWord,
        status: filters.value.status,
        region_id: filters.value.region_id,
        offset: offset,
        limit: rowsPerPage.value
      })
      
      applications.value = result.data
      totalRecords.value = result.totalRecords
      
      loading.value = false
    }
    
    // Handle pagination
    const onPage = (event) => {
      first.value = event.first
      rowsPerPage.value = event.rows
      applyFilters()
    }
    
    // Clear all filters
    const clearFilters = () => {
      filters.value = {
        searchWord: '',
        status: null,
        region_id: null
      }
      first.value = 0
      applyFilters()
    }
    
    onMounted(async () => {
      loading.value = true
      regionsLoading.value = true
      
      // Fetch regions
      await store.dispatch('fetchRegions')
      regionsLoading.value = false
      
      // Fetch applications with pagination
      const result = await store.dispatch('fetchApplications', {
        offset: 0,
        limit: rowsPerPage.value
      })
      
      applications.value = result.data
      totalRecords.value = result.totalRecords
      
      loading.value = false
    })
    
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleDateString()
    }
    
    const getImageUrl = (imagePath) => {
      if (!imagePath) return '';
      return `${store.state.baseUrl}/api/cdn/${imagePath}`;
    }
    
    const onRowClick = (event) => {
      selectedApplication.value = event.data;
      showDetailDialog.value = true;
    }
    
    const acceptApplication = async (application) => {
      loading.value = true
      try {
        const success = await store.dispatch('changeApplicationStatus', {
          applicationId: application.application_id,
          status: 'accepted'
        })
        
        if (success) {
          // Immediately update the local application status
          const appIndex = applications.value.findIndex(app => app.application_id === application.application_id)
          if (appIndex !== -1) {
            applications.value[appIndex].status = 'accepted'
            applications.value[appIndex].updatedAt = new Date().toISOString()
          }
          
          toast.add({
            severity: 'success',
            summary: i18n.t('success'),
            detail: i18n.t('application_accepted') + ` #${application.application_number}`,
            life: 3000
          })
        }
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: i18n.t('error'),
          detail: i18n.t('status_update_failed'),
          life: 3000
        })
      } finally {
        loading.value = false
      }
    }
    
    const cancelApplication = async (application) => {
      loading.value = true
      try {
        const success = await store.dispatch('changeApplicationStatus', {
          applicationId: application.application_id,
          status: 'cancelled'
        })
        
        if (success) {
          // Immediately update the local application status
          const appIndex = applications.value.findIndex(app => app.application_id === application.application_id)
          if (appIndex !== -1) {
            applications.value[appIndex].status = 'cancelled'
            applications.value[appIndex].updatedAt = new Date().toISOString()
          }
          
          toast.add({
            severity: 'info',
            summary: i18n.t('success'),
            detail: i18n.t('application_cancelled') + ` #${application.application_number}`,
            life: 3000
          })
        }
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: i18n.t('error'),
          detail: i18n.t('status_update_failed'),
          life: 3000
        })
      } finally {
        loading.value = false
      }
    }
    
    const createCertificate = async (application) => {
      loading.value = true
      try {
        const certificateData = await store.dispatch('createCertificate', application.application_id)
        
        if (certificateData) {
          // Immediately update the local application status
          const appIndex = applications.value.findIndex(app => app.application_id === application.application_id)
          if (appIndex !== -1) {
            applications.value[appIndex].status = 'done'
            applications.value[appIndex].updatedAt = new Date().toISOString()
          }
          
          certDetails.value = certificateData
          showCertDialog.value = true
          
          toast.add({
            severity: 'success',
            summary: i18n.t('success'),
            detail: i18n.t('certificate_created_success'),
            life: 3000
          })
        }
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: i18n.t('error'),
          detail: i18n.t('status_update_failed'),
          life: 3000
        })
      } finally {
        loading.value = false
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
          
          // Close the dialog after successful download
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
    
    return {
      loading,
      regionsLoading,
      applications,
      stats,
      // Pagination
      first,
      rowsPerPage,
      totalRecords,
      onPage,
      showCertDialog,
      certDetails,
      formatDate,
      acceptApplication,
      cancelApplication,
      createCertificate,
      downloadCertificate,
      downloadLoading,
      showDetailDialog,
      selectedApplication,
      onRowClick,
      getImageUrl,
      // Filter-related
      filters,
      statusOptions,
      regionOptions,
      applyFilters,
      applyFiltersDebounced,
      clearFilters
    }
  }
}
</script>

<style scoped>
.applications-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.stat-card {
  display: flex;
  align-items: center;
  background-color: #fff;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.stat-icon {
  font-size: 1.75rem;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  margin-right: 1rem;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
}

.stat-card.total .stat-icon {
  background-color: #e2e8f0;
  color: #475569;
}

.stat-card.new .stat-icon {
  background-color: #e0f2fe;
  color: #0284c7;
}

.stat-card.accepted .stat-icon {
  background-color: #dcfce7;
  color: #16a34a;
}

.stat-card.finished .stat-icon {
  background-color: #f3e8ff;
  color: #9333ea;
}

.stat-card.cancelled .stat-icon {
  background-color: #fee2e2;
  color: #dc2626;
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

.status-badge {
  padding: 0.35rem 0.75rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.status-badge.new {
  background-color: #e0f2fe;
  color: #0284c7;
}

.status-badge.accepted {
  background-color: #dcfce7;
  color: #16a34a;
}

.status-badge.done {
  background-color: #f3e8ff;
  color: #9333ea;
}

.status-badge.cancelled {
  background-color: #fee2e2;
  color: #dc2626;
}

.actions-container {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

:deep(.p-button-sm) {
  font-size: 0.75rem;
  padding: 0.35rem 0.75rem;
}

.certificate-details {
  padding: 1rem 0;
}

.certificate-details h3 {
  margin-bottom: 1.5rem;
  color: #1e293b;
  text-align: center;
  font-size: 1.25rem;
}

.certificate-field {
  display: flex;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: #f8fafc;
  border-radius: 6px;
}

.certificate-field .label {
  flex: 0 0 120px;
  font-weight: 600;
  color: #334155;
}

.certificate-field .value {
  flex: 1;
  color: #1e293b;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

@media (max-width: 767.98px) {
  .stats-cards {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }
  
  .actions-container {
    flex-direction: column;
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
  
  .certificate-field {
    flex-direction: column;
  }
  
  .certificate-field .label {
    margin-bottom: 0.25rem;
  }
}

/* Application Detail Dialog Styles */
.application-detail-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.application-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.application-badge {
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

.application-header-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.application-header-info h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #1e293b;
}

.application-id {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.application-body {
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

.status-text {
  text-transform: capitalize;
}

.status-text.new {
  color: #0284c7;
}

.status-text.accepted {
  color: #16a34a;
}

.status-text.done {
  color: #9333ea;
}

.status-text.cancelled {
  color: #dc2626;
}

.footer-actions {
  display: flex;
  gap: 0.5rem;
}

:deep(.application-detail-dialog .p-dialog-content) {
  padding: 0;
  overflow: hidden;
}

@media (max-width: 767.98px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .application-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
}

/* Filter styles */
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

.search-input {
  width: 100%;
}

.search-input :deep(input) {
  width: 100%;
}

.filter-dropdown {
  width: 100%;
}

@media (max-width: 767.98px) {
  .filters-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-container {
    width: 100%;
  }
}
</style> 