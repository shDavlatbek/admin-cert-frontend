<template>
  <div class="certified-users-container">
    <Card>
      <template #title>
        <div class="card-title">
          <span>{{ $t('certified_users') }}</span>
        </div>
      </template>
      <template #content>
        <div v-if="loading" class="loading-container">
          <ProgressSpinner />
        </div>
        <DataTable v-else :value="certifiedUsers" :paginator="true" :rows="10"
                  responsiveLayout="scroll" stripedRows class="users-table"
                  :rowHover="true" currentPageReportTemplate="{first} - {last} / {totalRecords}"
                  paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown">
          <Column field="first_name" :header="$t('first_name')" sortable></Column>
          <Column field="sur_name" :header="$t('surname')" sortable></Column>
          <Column field="mid_name" :header="$t('middle_name')" sortable></Column>
          <Column field="phone_number" :header="$t('phone')" sortable></Column>
          <Column field="email" :header="$t('email')" sortable></Column>
          <Column field="certificates" :header="$t('certificates')">
            <template #body="slotProps">
              <div v-if="slotProps.data.certificates && slotProps.data.certificates.length > 0">
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
        <Button :label="$t('download_certificate')" icon="pi pi-download" class="p-button-success" @click="downloadCertificate" />
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
    const certifiedUsers = computed(() => store.state.certifiedUsers)
    
    const showCertDialog = ref(false)
    const certDetails = ref({})
    
    const expandedUsers = ref({})
    
    onMounted(async () => {
      loading.value = true
      await store.dispatch('fetchCertifiedUsers')
      loading.value = false
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
    
    const viewCertificateDetails = (certificate) => {
      certDetails.value = certificate
      showCertDialog.value = true
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
    
    const toggleExpand = (userId) => {
      expandedUsers.value[userId] = !expandedUsers.value[userId]
    }
    
    return {
      loading,
      certifiedUsers,
      showCertDialog,
      certDetails,
      formatDate,
      isExpired,
      viewCertificateDetails,
      downloadCertificate,
      expandedUsers,
      toggleExpand
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
</style> 