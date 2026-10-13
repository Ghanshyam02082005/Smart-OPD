/**
 * SMART OPD - CENTRAL STATE MANAGEMENT
 */
window.SmartOPD = window.SmartOPD || {};

SmartOPD.State = {
  patients: [],
  auditLogs: [],

  init() {
    this.reloadFromStorage();

    // Listen to storage changes
    window.addEventListener('opdStateChanged', () => {
      this.reloadFromStorage();
    });
  },

  reloadFromStorage() {
    this.patients = SmartOPD.Storage.getPatients();
    this.auditLogs = SmartOPD.Storage.getAuditLogs();
    this.recalculateQueuePositions();
  },

  /**
   * Recalculate positions for all waiting patients
   */
  recalculateQueuePositions() {
    if (SmartOPD.QueueEngine) {
      this.patients = SmartOPD.QueueEngine.processQueue(this.patients);
    }
  },

  getPatients() {
    return this.patients;
  },

  getPatientById(id) {
    return this.patients.find(p => p.id === id);
  },

  getPatientByToken(tokenNumber) {
    return this.patients
      .filter(patient => patient.tokenNumber === tokenNumber)
      .sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt))[0];
  },

  /**
   * Save updated patient record
   */
  updatePatient(updatedPatient) {
    const idx = this.patients.findIndex(p => p.id === updatedPatient.id);
    if (idx !== -1) {
      this.patients[idx] = updatedPatient;
      this.recalculateQueuePositions();
      SmartOPD.Storage.savePatients(this.patients);
    }
  },

  /**
   * Add new patient
   */
  addPatient(patientData) {
    this.patients.push(patientData);
    this.recalculateQueuePositions();
    SmartOPD.Storage.savePatients(this.patients);
  },

  deletePatient(patientId) {
    const index = this.patients.findIndex(patient => patient.id === patientId);
    if (index === -1) return null;

    const [deletedPatient] = this.patients.splice(index, 1);
    this.recalculateQueuePositions();
    SmartOPD.Storage.savePatients(this.patients);
    return deletedPatient;
  },

  /**
   * Get Dashboard Statistics
   */
  getStats() {
    const waitingPatients = this.patients.filter(p => p.status === 'waiting' || p.status === 'called');

    return {
      totalRegistered: this.patients.length,
      immediateWaiting: waitingPatients.filter(p => p.effectivePriority === 'IMMEDIATE').length,
      soonWaiting: waitingPatients.filter(p => p.effectivePriority === 'SOON').length,
      routineWaiting: waitingPatients.filter(p => p.effectivePriority === 'ROUTINE').length,
      inConsultation: this.patients.filter(p => p.status === 'in_consultation').length,
      completed: this.patients.filter(p => p.status === 'completed').length
    };
  }
};
