/**
 * SMART OPD - LOCAL STORAGE PERSISTENCE ADAPTER
 */
window.SmartOPD = window.SmartOPD || {};

SmartOPD.Storage = {
  KEYS: {
    PATIENTS: 'smart_opd_patients',
    COUNTER: 'smart_opd_counter',
    COUNTER_DATE: 'smart_opd_counter_date',
    AUDIT: 'smart_opd_audit',
    SETTINGS: 'smart_opd_settings'
  },

  DEFAULT_SETTINGS: {
    hospitalName: 'MATHURA DAS MATHUR HOSPITAL',
    hospitalSubtitle: 'A JODHPUR DIVISIONAL GENERAL HOSPITAL',
    address: 'MDM Hospital, Sastri Nagar, Jodhpur, Raj-342001',
    email: 'contact@mdmhjodhpur.in',
    website: 'www.mdmhjodhpur.in',
    phone: '',
    logoDataUrl: '',
    logoThemeColors: null
  },

  init() {
    this.listenCrossTabSync();
  },

  /**
   * Load Patients
   */
  getPatients() {
    try {
      const data = localStorage.getItem(this.KEYS.PATIENTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error loading patients from localStorage', e);
      return [];
    }
  },

  /**
   * Save Patients
   */
  savePatients(patients) {
    try {
      localStorage.setItem(this.KEYS.PATIENTS, JSON.stringify(patients));
      this.notifyStateChange('patients');
    } catch (e) {
      console.error('Error saving patients to localStorage', e);
    }
  },

  /**
   * Get Next Token Counter
   */
  getLocalDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  getCounter(date = new Date()) {
    try {
      const val = localStorage.getItem(this.KEYS.COUNTER);
      const counterDate = localStorage.getItem(this.KEYS.COUNTER_DATE);
      const today = this.getLocalDateKey(date);

      if (counterDate === today) {
        return val ? parseInt(val, 10) : 0;
      }

      if (!counterDate && val) {
        const todayPatients = this.getPatients().filter(patient =>
          patient.registeredAt && this.getLocalDateKey(new Date(patient.registeredAt)) === today
        );
        const highestTodaySequence = todayPatients.reduce(
          (highest, patient) => Math.max(highest, Number(patient.sequenceNumber) || 0),
          0
        );
        if (highestTodaySequence > 0) return highestTodaySequence;
      }

      return 0;
    } catch (e) {
      return 0;
    }
  },

  /**
   * Increment and save token counter
   */
  incrementCounter(date = new Date()) {
    const next = this.getCounter(date) + 1;
    localStorage.setItem(this.KEYS.COUNTER, String(next));
    localStorage.setItem(this.KEYS.COUNTER_DATE, this.getLocalDateKey(date));
    return next;
  },

  /**
   * Set Token Counter
   */
  setCounter(val, date = new Date()) {
    localStorage.setItem(this.KEYS.COUNTER, String(val));
    localStorage.setItem(this.KEYS.COUNTER_DATE, this.getLocalDateKey(date));
  },

  getSettings() {
    try {
      const data = localStorage.getItem(this.KEYS.SETTINGS);
      const settings = data ? JSON.parse(data) : {};
      return { ...this.DEFAULT_SETTINGS, ...settings };
    } catch (e) {
      console.error('Error loading settings from localStorage', e);
      return { ...this.DEFAULT_SETTINGS };
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
      this.notifyStateChange('settings');
    } catch (e) {
      console.error('Error saving settings to localStorage', e);
      throw e;
    }
  },

  /**
   * Load Audit Logs
   */
  getAuditLogs() {
    try {
      const data = localStorage.getItem(this.KEYS.AUDIT);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  /**
   * Save Audit Logs
   */
  saveAuditLogs(logs) {
    try {
      localStorage.setItem(this.KEYS.AUDIT, JSON.stringify(logs));
      this.notifyStateChange('audit');
    } catch (e) {
      console.error('Error saving audit logs', e);
    }
  },

  /**
   * Clear All Storage
   */
  clearAll() {
    localStorage.removeItem(this.KEYS.PATIENTS);
    localStorage.removeItem(this.KEYS.COUNTER);
    localStorage.removeItem(this.KEYS.COUNTER_DATE);
    localStorage.removeItem(this.KEYS.AUDIT);
    this.notifyStateChange('all');
  },

  /**
   * Trigger cross-tab / local event
   */
  notifyStateChange(type) {
    window.dispatchEvent(new CustomEvent('opdStateChanged', { detail: { type } }));
  },

  /**
   * Listen to browser storage events across tabs
   */
  listenCrossTabSync() {
    window.addEventListener('storage', (e) => {
      if (Object.values(this.KEYS).includes(e.key)) {
        window.dispatchEvent(new CustomEvent('opdStateChanged', { detail: { type: 'cross-tab', key: e.key } }));
      }
    });
  }
};
