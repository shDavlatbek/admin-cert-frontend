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
        <div v-if="loading" class="loading-container">
          <ProgressSpinner />
        </div>
        <DataTable v-else :value="applications" :paginator="true" :rows="10" 
                  responsiveLayout="scroll" stripedRows class="applications-table"
                  :rowHover="true" currentPageReportTemplate="{first} - {last} / {totalRecords}"
                  paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown">
          <Column field="application_number" :header="$t('application_number')" sortable></Column>
          <Column field="first_name" :header="$t('first_name')" sortable></Column>
          <Column field="sur_name" :header="$t('surname')" sortable></Column>
          <Column field="phone_number" :header="$t('phone')" sortable></Column>
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
        <Button :label="$t('download_certificate')" icon="pi pi-download" autofocus class="p-button-success" @click="downloadCertificate" />
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
    const applications = computed(() => store.state.applications)
    const stats = computed(() => store.getters.getApplicationStats)
    
    const showCertDialog = ref(false)
    const certDetails = ref({})
    
    onMounted(async () => {
      loading.value = true
      await store.dispatch('fetchApplications')
      loading.value = false
    })
    
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleDateString()
    }
    
    const acceptApplication = async (application) => {
      loading.value = true
      try {
        const success = await store.dispatch('changeApplicationStatus', {
          applicationId: application.application_id,
          status: 'accepted'
        })
        
        if (success) {
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
    
    const downloadCertificate = () => {
      toast.add({
        severity: 'info',
        summary: i18n.t('success'),
        detail: i18n.t('certificate_download_started'),
        life: 3000
      })
      
      // Close the dialog
      showCertDialog.value = false
    }
    
    return {
      loading,
      applications,
      stats,
      showCertDialog,
      certDetails,
      formatDate,
      acceptApplication,
      cancelApplication,
      createCertificate,
      downloadCertificate
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
</style> 