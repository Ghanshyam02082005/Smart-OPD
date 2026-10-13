/**
 * SMART OPD - AUDIT TRAIL LOGGING & INTERFACE MODULE
 */
window.SmartOPD = window.SmartOPD || {};

SmartOPD.AuditTrail = {
  /**
   * Log an audit event
   * @param {Object} eventData - { tokenNumber, eventType, previousValue, newValue, reason, actor }
   */
  logEvent(eventData) {
    const logs = SmartOPD.Storage.getAuditLogs();

    const newLog = {
      id: 'aud_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      tokenNumber: eventData.tokenNumber || 'SYSTEM',
      eventType: eventData.eventType || 'GENERAL_ACTION',
      previousValue: eventData.previousValue || '-',
      newValue: eventData.newValue || '-',
      reason: eventData.reason || '',
      actor: eventData.actor || 'Nurse / Staff'
    };

    logs.unshift(newLog); // newest first
    SmartOPD.Storage.saveAuditLogs(logs);
  },

  getFilteredLogs(filterToken = '', filterEvent = '', dateFrom = '', dateTo = '') {
    const logs = SmartOPD.Storage.getAuditLogs();

    return logs.filter(log => {
      const tokenNumber = String(log.tokenNumber || '');
      const eventType = String(log.eventType || '');
      const matchToken = !filterToken || tokenNumber.toLowerCase().includes(filterToken.toLowerCase());
      const matchEvent = !filterEvent || eventType === filterEvent;
      const logDate = new Date(log.timestamp);
      const localDate = Number.isNaN(logDate.getTime())
        ? ''
        : SmartOPD.Storage.getLocalDateKey(logDate);
      const matchDateFrom = !dateFrom || (localDate && localDate >= dateFrom);
      const matchDateTo = !dateTo || (localDate && localDate <= dateTo);
      return matchToken && matchEvent && matchDateFrom && matchDateTo;
    });
  },

  /**
   * Render the filtered audit log table into the provided container.
   */
  renderTable(containerEl, filterToken = '', filterEvent = '', dateFrom = '', dateTo = '') {
    if (!containerEl) return;

    const filtered = this.getFilteredLogs(filterToken, filterEvent, dateFrom, dateTo);
    const t = SmartOPD.Language.t.bind(SmartOPD.Language);

    const rows = filtered.map(log => `
        <tr>
          <td class="audit-time-cell">${SmartOPD.Utils.escapeHTML(SmartOPD.Utils.formatDateTime(log.timestamp))}</td>
          <td><span class="token-badge">${SmartOPD.Utils.escapeHTML(log.tokenNumber)}</span></td>
          <td><span class="audit-event-badge">${SmartOPD.Utils.escapeHTML(log.eventType)}</span></td>
          <td class="audit-muted-cell">${SmartOPD.Utils.escapeHTML(log.previousValue)}</td>
          <td class="audit-value-cell">${SmartOPD.Utils.escapeHTML(log.newValue)}</td>
          <td>${SmartOPD.Utils.escapeHTML(log.reason || '—')}</td>
          <td><span class="audit-actor">${SmartOPD.Utils.escapeHTML(log.actor)}</span></td>
        </tr>
      `).join('');

    containerEl.innerHTML = `
      <div class="audit-table-scroll">
        <table class="audit-table">
          <thead>
            <tr>
              <th>${t('audit.colTime')}</th>
              <th>${t('audit.colToken')}</th>
              <th>${t('audit.colEvent')}</th>
              <th>${t('audit.colPrev')}</th>
              <th>${t('audit.colNew')}</th>
              <th>${t('audit.colReason')}</th>
              <th>${t('audit.colActor')}</th>
            </tr>
          </thead>
          <tbody>${rows || `<tr><td class="audit-no-results" colspan="7">${t('audit.noResults')}</td></tr>`}</tbody>
        </table>
      </div>
    `;
  }
};
