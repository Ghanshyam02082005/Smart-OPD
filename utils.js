/**
 * SMART OPD - UTILITY FUNCTIONS
 */
window.SmartOPD = window.SmartOPD || {};

SmartOPD.Utils = {
  /**
   * Format date to localized string
   */
  formatDateTime(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  },

  /**
   * Format time only
   */
  formatTime(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  },

  /**
   * Generate next token string like OPD-018
   */
  formatTokenNumber(counter) {
    const numStr = String(counter).padStart(3, '0');
    return `OPD-${numStr}`;
  },

  /**
   * Generate Parchi reference number like REF-2026-0018
   */
  formatParchiRef(counter) {
    const numStr = String(counter).padStart(4, '0');
    const year = new Date().getFullYear();
    return `REF-${year}-${numStr}`;
  },

  /**
   * Generate random ID
   */
  generateId() {
    return 'pat_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  },

  /**
   * Escape HTML strings to prevent XSS
   */
  escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * Get CSS class for priority
   */
  getPriorityClass(priority) {
    switch ((priority || '').toUpperCase()) {
      case 'IMMEDIATE':
        return 'badge-immediate';
      case 'SOON':
        return 'badge-soon';
      case 'ROUTINE':
      default:
        return 'badge-routine';
    }
  },

  /**
   * Get CSS class for patient workflow status
   */
  getStatusClass(status) {
    switch ((status || '').toLowerCase()) {
      case 'waiting':
        return 'status-waiting';
      case 'called':
        return 'status-called';
      case 'in_consultation':
        return 'status-in_consultation';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-waiting';
    }
  }
};
