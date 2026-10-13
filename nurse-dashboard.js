/**
 * SMART OPD - NURSE DASHBOARD & QUEUE CONTROL
 */
window.SmartOPD = window.SmartOPD || {};

SmartOPD.NurseDashboard = {
  render(container) {
    if (!container) return;

    const patients = SmartOPD.State.getPatients();
    const t = SmartOPD.Language.t.bind(SmartOPD.Language);

    const waitingPatients = patients
      .filter(patient => patient.status === 'waiting')
      .sort((a, b) => (a.queuePosition || Number.MAX_SAFE_INTEGER) - (b.queuePosition || Number.MAX_SAFE_INTEGER));
    const immediateList = waitingPatients.filter(patient => patient.effectivePriority === 'IMMEDIATE');
    const soonList = waitingPatients.filter(patient => patient.effectivePriority === 'SOON');
    const routineList = waitingPatients.filter(patient => patient.effectivePriority === 'ROUTINE');
    const calledList = patients.filter(p => p.status === 'called');
    const inConsultationList = patients.filter(p => p.status === 'in_consultation');
    const completedList = patients.filter(p => p.status === 'completed');
    const waitingCount = waitingPatients.length;

    let html = `
      <section class="nurse-dashboard nurse-dashboard-v2">
        <header class="nurse-dashboard-heading">
          <div class="nurse-heading-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div class="nurse-heading-copy">
            <p class="nurse-eyebrow">${t('nurse.eyebrow')}</p>
            <h1>${t('nurse.title')}</h1>
            <p>${t('nurse.subtitle')}</p>
          </div>
          <span class="nurse-live-indicator"><span></span>${t('nurse.live')}</span>
          <a class="btn btn-primary nurse-register-action" href="#/registration">
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            ${t('dash.quickReg')}
          </a>
        </header>

        <section class="nurse-overview-stats" aria-label="${t('nurse.title')}">
          <div class="nurse-overview-stat nurse-stat-waiting">
            <span class="nurse-stat-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span>
            <span><strong>${waitingCount}</strong><small>${t('nurse.statWaiting')}</small></span>
          </div>
          <div class="nurse-overview-stat nurse-stat-called">
            <span class="nurse-stat-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.14 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72l.4 2.8a2 2 0 0 1-.57 1.7L7.2 9.96a16 16 0 0 0 6.84 6.84l1.74-1.74a2 2 0 0 1 1.7-.57l2.8.4a2 2 0 0 1 1.72 2.03z"/></svg></span>
            <span><strong>${calledList.length}</strong><small>${t('nurse.statCalled')}</small></span>
          </div>
          <div class="nurse-overview-stat nurse-stat-consulting">
            <span class="nurse-stat-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
            <span><strong>${inConsultationList.length}</strong><small>${t('nurse.statConsulting')}</small></span>
          </div>
          <div class="nurse-overview-stat nurse-stat-completed">
            <span class="nurse-stat-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 4 4L19 6"/></svg></span>
            <span><strong>${completedList.length}</strong><small>${t('nurse.statCompleted')}</small></span>
          </div>
        </section>

      <div class="safety-banner">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span>${t('safety.disclaimer')}</span>
      </div>

      <!-- Called / Ready Queue Notice -->
      ${calledList.length > 0 ? `
        <div class="nurse-called-section">
          <h4 style="color: var(--status-called-text); font-weight: 800; display: flex; align-items: center; gap: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            CALLED PATIENTS WAITING TO ENTER DOCTOR ROOM (${calledList.length})
          </h4>
          <div class="queue-card-list nurse-patient-list">
            ${calledList.map(p => this.renderPatientCard(p, t)).join('')}
          </div>
        </div>
      ` : ''}

      <section class="nurse-dashboard-group">
        <div class="nurse-group-heading">
          <div><h2>${t('nurse.priorityHeading')}</h2><p>${t('nurse.prioritySubtitle')}</p></div>
        </div>
        <div class="nurse-dashboard-sections nurse-priority-grid">
        <!-- IMMEDIATE QUEUE SECTION -->
        <div class="card nurse-queue-section nurse-priority-immediate">
          <div class="card-header">
            <h3 class="card-title text-danger">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              ${t('nurse.secImmediate')}
            </h3>
            <span class="nurse-queue-count">${immediateList.length}</span>
          </div>
          <div class="queue-card-list nurse-patient-list">
            ${immediateList.length === 0 ? `<p class="text-muted nurse-empty-state">No immediate priority patients waiting.</p>` : immediateList.map(p => this.renderPatientCard(p, t)).join('')}
          </div>
        </div>

        <!-- SOON QUEUE SECTION -->
        <div class="card nurse-queue-section nurse-priority-soon">
          <div class="card-header">
            <h3 class="card-title text-warning">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${t('nurse.secSoon')}
            </h3>
            <span class="nurse-queue-count">${soonList.length}</span>
          </div>
          <div class="queue-card-list nurse-patient-list">
            ${soonList.length === 0 ? `<p class="text-muted nurse-empty-state">No soon priority patients waiting.</p>` : soonList.map(p => this.renderPatientCard(p, t)).join('')}
          </div>
        </div>

        <!-- ROUTINE QUEUE SECTION -->
        <div class="card nurse-queue-section nurse-priority-routine">
          <div class="card-header">
            <h3 class="card-title text-success">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>
              ${t('nurse.secRoutine')}
            </h3>
            <span class="nurse-queue-count">${routineList.length}</span>
          </div>
          <div class="queue-card-list nurse-patient-list">
            ${routineList.length === 0 ? `<p class="text-muted nurse-empty-state">No routine priority patients waiting.</p>` : routineList.map(p => this.renderPatientCard(p, t)).join('')}
          </div>
        </div>

        </div>
      </section>

      <section class="nurse-dashboard-group nurse-workflow-group">
        <div class="nurse-group-heading">
          <div><h2>${t('nurse.workflowHeading')}</h2><p>${t('nurse.workflowSubtitle')}</p></div>
        </div>
        <div class="nurse-dashboard-sections nurse-workflow-grid">
        <!-- IN CONSULTATION SECTION -->
        <div class="card nurse-queue-section nurse-workflow-section">
          <div class="card-header">
            <h3 class="card-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              ${t('nurse.secConsultation')}
            </h3>
            <span class="nurse-queue-count">${inConsultationList.length}</span>
          </div>
          <div class="queue-card-list nurse-patient-list">
            ${inConsultationList.length === 0 ? `<p class="text-muted nurse-empty-state">No patient currently in consultation room.</p>` : inConsultationList.map(p => this.renderPatientCard(p, t)).join('')}
          </div>
        </div>

        <div class="card nurse-queue-section nurse-workflow-section nurse-completed-section">
          <div class="card-header">
            <h3 class="card-title">${t('nurse.secCompleted')}</h3>
            <span class="nurse-queue-count">${completedList.length}</span>
          </div>
          <div class="queue-card-list nurse-patient-list">
            ${completedList.length === 0 ? `<p class="text-muted nurse-empty-state">No completed consultations.</p>` : completedList.map(p => this.renderPatientCard(p, t)).join('')}
          </div>
        </div>
      </div>
      </section>
      </section>
    `;

    container.innerHTML = html;
  },

  renderPatientCard(patient, t) {
    const effBadgeClass = SmartOPD.Utils.getPriorityClass(patient.effectivePriority);
    const recBadgeClass = SmartOPD.Utils.getPriorityClass(patient.recommendedPriority);
    const statusClass = SmartOPD.Utils.getStatusClass(patient.status);

    const effPriorityText = t(`priority.${patient.effectivePriority}`);
    const recPriorityText = t(`priority.${patient.recommendedPriority}`);
    const statusText = t(`status.${patient.status}`);
    const reasonText = t(patient.triageReasonKey);

    const isOverridden = patient.effectivePriority !== patient.recommendedPriority;

    const v = patient.vitals || {};
    const bpStr = (v.bpSystolic && v.bpDiastolic) ? `${v.bpSystolic}/${v.bpDiastolic}` : 'Unavail';
    const pulseStr = v.pulse ? `${v.pulse} bpm` : 'Unavail';
    const spo2Str = v.spo2 ? `${v.spo2}%` : 'Unavail';
    const tempStr = v.temp ? `${v.temp}°F` : 'Unavail';

    let vitalsWarningHtml = '';
    if (patient.hasMissingVitals) {
      vitalsWarningHtml = `
        <span style="font-size: 11px; color: #b45309; background: #fffbeeb0; padding: 2px 6px; border-radius: 4px; font-weight: 600;">
          ⚠️ Missing Vitals
        </span>
      `;
    }

    let positionHtml = '';
    if (patient.queuePosition) {
      positionHtml = `<span class="queue-position-pill">Position #${patient.queuePosition}</span>`;
    }

    const deskScreeningHtml = patient.deskScreening?.status === 'pending_review'
      ? `<div class="desk-screening-nurse-alert"><strong>Immediate desk questions need nurse review.</strong></div>`
      : '';

    return `
      <div class="patient-card priority-${patient.effectivePriority.toLowerCase()}">
        <div class="patient-card-header">
          <div class="patient-identity">
            <span class="token-badge">${patient.tokenNumber}</span>
            <div>
              <div class="patient-name-age">${SmartOPD.Utils.escapeHTML(patient.fullName)} (${patient.age} y/o, ${SmartOPD.Utils.escapeHTML(patient.gender)})</div>
              <div class="patient-meta-text">Reg: ${SmartOPD.Utils.formatTime(patient.registeredAt)} | ${t('reg.department')}: <strong>${SmartOPD.Utils.escapeHTML(SmartOPD.Departments.label(patient.department, t) || t('department.general_medicine'))}</strong> | Complaint: <strong>${SmartOPD.Utils.escapeHTML(patient.chiefComplaint)}</strong></div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            ${positionHtml}
            <span class="badge-status ${statusClass}">${statusText}</span>
            <span class="badge-priority ${effBadgeClass}">${effPriorityText}</span>
          </div>
        </div>

        <div class="patient-vitals-row">
          <span class="vital-tag">BP: <strong>${bpStr}</strong></span>
          <span class="vital-tag">Pulse: <strong>${pulseStr}</strong></span>
          <span class="vital-tag ${v.spo2 && v.spo2 < 92 ? 'abnormal' : ''}">SpO₂: <strong>${spo2Str}</strong></span>
          <span class="vital-tag">Temp: <strong>${tempStr}</strong></span>
          ${vitalsWarningHtml}
        </div>

        ${isOverridden ? `
          <div style="font-size: 11.5px; color: #b45309; background: #fff7ed; padding: 6px 10px; border-radius: 6px;">
            <strong>Nurse Override Active:</strong> System suggested <em>${recPriorityText}</em>, changed to <em>${effPriorityText}</em>.
          </div>
        ` : ''}
        ${deskScreeningHtml}

        <p style="font-size: 12px; color: var(--text-muted); margin: 0;">
          <strong>Triage Note:</strong> ${SmartOPD.Utils.escapeHTML(reasonText)}
        </p>
        ${patient.aiTriagePriority ? `
          <p style="font-size: 12px; color: var(--text-muted); margin: 0;">
            <strong>AI complaint priority (${t(`priority.${patient.aiTriagePriority}`)}):</strong> ${SmartOPD.Utils.escapeHTML(patient.aiTriageReason || '')}
          </p>
        ` : ''}

        <div class="patient-card-actions">
          ${patient.status === 'waiting' ? `
            <button class="btn btn-warning btn-sm" onclick="SmartOPD.NurseDashboard.callPatient('${patient.id}')">${t('nurse.btnCall')}</button>
          ` : ''}

          ${patient.status === 'called' ? `
            <button class="btn btn-primary btn-sm" onclick="SmartOPD.NurseDashboard.startConsultation('${patient.id}')">${t('nurse.btnStart')}</button>
          ` : ''}

          ${patient.status === 'in_consultation' ? `
            <button class="btn btn-success btn-sm" onclick="SmartOPD.NurseDashboard.completeVisit('${patient.id}')">${t('nurse.btnComplete')}</button>
          ` : ''}

          ${patient.status !== 'completed' ? `
            <button class="btn btn-secondary btn-sm" onclick="SmartOPD.NurseDashboard.showOverrideModal('${patient.id}')">${t('nurse.btnOverride')}</button>
            <button class="btn btn-secondary btn-sm" onclick="SmartOPD.NurseDashboard.showVitalsModal('${patient.id}')">${t('nurse.btnUpdateVitals')}</button>
          ` : ''}
          <button class="btn btn-outline btn-sm" onclick="SmartOPD.NurseDashboard.showPatientDetails('${patient.id}')">${t('nurse.btnDetails')}</button>
          <button class="btn btn-danger btn-sm" onclick="SmartOPD.NurseDashboard.deletePatient('${patient.id}')">${t('nurse.btnDelete')}</button>
        </div>
      </div>
    `;
  },

  callPatient(patientId) {
    const p = SmartOPD.State.getPatientById(patientId);
    if (!p) return;

    p.status = 'called';
    p.updatedAt = new Date().toISOString();
    SmartOPD.State.updatePatient(p);

    SmartOPD.AuditTrail.logEvent({
      tokenNumber: p.tokenNumber,
      eventType: 'PATIENT_CALLED',
      previousValue: 'waiting',
      newValue: 'called',
      reason: 'Nurse called patient token',
      actor: 'Nurse'
    });

    SmartOPD.Notifications.warning(`Token ${p.tokenNumber} Called to Doctor Desk!`);
    window.dispatchEvent(new CustomEvent('opdStateChanged'));
  },

  startConsultation(patientId) {
    const p = SmartOPD.State.getPatientById(patientId);
    if (!p) return;

    p.status = 'in_consultation';
    p.updatedAt = new Date().toISOString();
    SmartOPD.State.updatePatient(p);

    SmartOPD.AuditTrail.logEvent({
      tokenNumber: p.tokenNumber,
      eventType: 'CONSULTATION_STARTED',
      previousValue: 'called',
      newValue: 'in_consultation',
      reason: 'Patient entered doctor room',
      actor: 'Nurse / Doctor'
    });

    SmartOPD.Notifications.info(`Consultation started for Token ${p.tokenNumber}`);
    window.dispatchEvent(new CustomEvent('opdStateChanged'));
  },

  completeVisit(patientId) {
    const p = SmartOPD.State.getPatientById(patientId);
    if (!p) return;

    p.status = 'completed';
    p.updatedAt = new Date().toISOString();
    SmartOPD.State.updatePatient(p);

    SmartOPD.AuditTrail.logEvent({
      tokenNumber: p.tokenNumber,
      eventType: 'VISIT_COMPLETED',
      previousValue: 'in_consultation',
      newValue: 'completed',
      reason: 'OPD visit completed',
      actor: 'Doctor'
    });

    SmartOPD.Notifications.success(`Visit Completed for Token ${p.tokenNumber}`);
    window.dispatchEvent(new CustomEvent('opdStateChanged'));
  },

  deletePatient(patientId) {
    const patient = SmartOPD.State.getPatientById(patientId);
    if (!patient || !window.confirm(SmartOPD.Language.t('nurse.confirmDelete'))) return;

    const deletedPatient = SmartOPD.State.deletePatient(patientId);
    if (!deletedPatient) return;

    SmartOPD.AuditTrail.logEvent({
      tokenNumber: deletedPatient.tokenNumber,
      eventType: 'PATIENT_DELETED',
      previousValue: deletedPatient.status,
      newValue: 'deleted',
      reason: 'Patient record deleted by nurse',
      actor: 'Nurse'
    });
    SmartOPD.Notifications.warning(`Patient ${deletedPatient.tokenNumber} deleted.`);
  },

  showOverrideModal(patientId) {
    const p = SmartOPD.State.getPatientById(patientId);
    if (!p) return;

    const t = SmartOPD.Language.t.bind(SmartOPD.Language);

    const modalHtml = `
      <div class="modal-backdrop active" id="override-modal">
        <div class="modal-box">
          <div class="modal-header">
            <h3 class="modal-title">${t('override.title')}</h3>
            <span class="modal-close" onclick="document.getElementById('override-modal').remove()">&times;</span>
          </div>
          <div class="modal-body">
            <p style="margin-bottom: 16px; font-size: 13px;">
              Overriding priority for <strong>${p.tokenNumber} - ${SmartOPD.Utils.escapeHTML(p.fullName)}</strong>.<br>
              <span class="text-muted">Original token number stays the same. Queue position will automatically adjust.</span>
            </p>

            <div class="form-group">
              <label class="form-label">${t('override.selectPriority')}</label>
              <select id="override-priority-select" class="form-control">
                <option value="IMMEDIATE" ${p.effectivePriority === 'IMMEDIATE' ? 'selected' : ''}>${t('priority.IMMEDIATE')}</option>
                <option value="SOON" ${p.effectivePriority === 'SOON' ? 'selected' : ''}>${t('priority.SOON')}</option>
                <option value="ROUTINE" ${p.effectivePriority === 'ROUTINE' ? 'selected' : ''}>${t('priority.ROUTINE')}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">${t('override.reasonLabel')}</label>
              <select id="override-reason-select" class="form-control">
                <option value="Clinical assessment by nurse">${t('override.reasonAssessment')}</option>
                <option value="New vital signs recorded">${t('override.reasonNewVitals')}</option>
                <option value="Symptoms worsened while waiting">${t('override.reasonWorsened')}</option>
                <option value="Nurse clinical judgement">${t('override.reasonJudgement')}</option>
                <option value="Other clinical reason">${t('override.reasonOther')}</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('override-modal').remove()">Cancel</button>
            <button class="btn btn-primary btn-sm" onclick="SmartOPD.NurseDashboard.applyOverride('${p.id}')">${t('override.saveBtn')}</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  applyOverride(patientId) {
    const p = SmartOPD.State.getPatientById(patientId);
    if (!p) return;

    const newPriority = document.getElementById('override-priority-select').value;
    const reason = document.getElementById('override-reason-select').value;

    const prevPriority = p.effectivePriority;
    p.effectivePriority = newPriority;
    p.updatedAt = new Date().toISOString();

    SmartOPD.State.updatePatient(p);

    SmartOPD.AuditTrail.logEvent({
      tokenNumber: p.tokenNumber,
      eventType: 'PRIORITY_OVERRIDDEN',
      previousValue: prevPriority,
      newValue: newPriority,
      reason: reason,
      actor: 'Nurse'
    });

    SmartOPD.Notifications.success(`Priority for Token ${p.tokenNumber} updated to ${newPriority}. Smart queue reordered!`);
    document.getElementById('override-modal').remove();
    window.dispatchEvent(new CustomEvent('opdStateChanged'));
  },

  showVitalsModal(patientId) {
    const p = SmartOPD.State.getPatientById(patientId);
    if (!p) return;

    const v = p.vitals || {};

    const modalHtml = `
      <div class="modal-backdrop active" id="vitals-modal">
        <div class="modal-box">
          <div class="modal-header">
            <h3 class="modal-title">Update Vitals - ${p.tokenNumber}</h3>
            <span class="modal-close" onclick="document.getElementById('vitals-modal').remove()">&times;</span>
          </div>
          <div class="modal-body flex-col gap-4">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Systolic BP</label>
                <input type="number" id="mod-vital-sys" class="form-control" value="${v.bpSystolic || ''}">
              </div>
              <div class="form-group">
                <label class="form-label">Diastolic BP</label>
                <input type="number" id="mod-vital-dia" class="form-control" value="${v.bpDiastolic || ''}">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Pulse (BPM)</label>
                <input type="number" id="mod-vital-pulse" class="form-control" value="${v.pulse || ''}">
              </div>
              <div class="form-group">
                <label class="form-label">SpO₂ (%)</label>
                <input type="number" id="mod-vital-spo2" class="form-control" value="${v.spo2 || ''}">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('vitals-modal').remove()">Cancel</button>
            <button class="btn btn-primary btn-sm" onclick="SmartOPD.NurseDashboard.saveVitals('${p.id}')">Save Vitals</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  saveVitals(patientId) {
    const p = SmartOPD.State.getPatientById(patientId);
    if (!p) return;

    p.vitals = {
      bpSystolic: parseFloat(document.getElementById('mod-vital-sys').value) || null,
      bpDiastolic: parseFloat(document.getElementById('mod-vital-dia').value) || null,
      pulse: parseFloat(document.getElementById('mod-vital-pulse').value) || null,
      spo2: parseFloat(document.getElementById('mod-vital-spo2').value) || null
    };

    // Re-assess triage recommendation based on new vitals
    const triage = SmartOPD.TriageEngine.assess(p);
    p.hasMissingVitals = triage.hasMissingVitals;
    p.updatedAt = new Date().toISOString();

    SmartOPD.State.updatePatient(p);

    SmartOPD.AuditTrail.logEvent({
      tokenNumber: p.tokenNumber,
      eventType: 'VITALS_UPDATED',
      previousValue: 'Previous Vitals',
      newValue: `SpO2: ${p.vitals.spo2}%, BP: ${p.vitals.bpSystolic}/${p.vitals.bpDiastolic}`,
      reason: 'Vitals updated by nurse',
      actor: 'Nurse'
    });

    SmartOPD.Notifications.success(`Vitals updated for ${p.tokenNumber}`);
    document.getElementById('vitals-modal').remove();
    window.dispatchEvent(new CustomEvent('opdStateChanged'));
  },

  showPatientDetails(patientId) {
    const p = SmartOPD.State.getPatientById(patientId);
    if (!p) return;
    const screeningAnswerLabel = answer => ({
      yes: 'Yes',
      no: 'No',
      unsure: 'Not sure',
      '': 'Not asked'
    })[answer] || 'Not asked';
    const screeningAnswers = p.deskScreening
      ? [
        ['Breathing difficulty', p.deskScreening.breathing],
        ['Chest pain/pressure', p.deskScreening.chestPain],
        ['Fainting/confusion/seizure', p.deskScreening.faintingConfusion],
        ['Heavy bleeding/severe allergy', p.deskScreening.bleedingAllergy]
      ].map(([label, answer]) => `<li>${label}: <strong>${screeningAnswerLabel(answer)}</strong></li>`).join('')
      : '';

    const modalHtml = `
      <div class="modal-backdrop active" id="details-modal">
        <div class="modal-box" style="max-width: 600px;">
          <div class="modal-header">
            <h3 class="modal-title">Patient Details - ${p.tokenNumber}</h3>
            <span class="modal-close" onclick="document.getElementById('details-modal').remove()">&times;</span>
          </div>
          <div class="modal-body flex-col gap-4">
            <div>
              <strong style="font-size: 16px;">${SmartOPD.Utils.escapeHTML(p.fullName)}</strong>
              <div class="text-muted">${p.age} y/o ${SmartOPD.Utils.escapeHTML(p.gender)} | Phone: ${SmartOPD.Utils.escapeHTML(p.phone || 'N/A')}</div>
            </div>
            <div style="background-color: var(--bg-muted); padding: 12px; border-radius: var(--radius-md);">
              <strong>Chief Complaint:</strong> ${SmartOPD.Utils.escapeHTML(p.chiefComplaint)}<br>
              <strong>Presenting Symptoms:</strong> ${(p.symptoms || []).join(', ') || 'None selected'}<br>
              <strong>Medical History:</strong> ${SmartOPD.Utils.escapeHTML(p.existingConditions || 'None reported')}
            </div>
            ${p.deskScreening ? `
              <div class="desk-screening-nurse-alert">
                <strong>Registration desk questions — nurse review ${p.deskScreening.status === 'pending_review' ? 'pending' : 'completed'}</strong>
                <ul>${screeningAnswers}</ul>
                ${p.deskScreening.status === 'pending_review'
                  ? `<button class="btn btn-secondary btn-sm" onclick="SmartOPD.NurseDashboard.acknowledgeDeskScreening('${p.id}')">Mark questions reviewed</button>`
                  : ''}
              </div>
            ` : ''}
            <div>
              <strong>Effective Priority:</strong> <span class="badge-priority ${SmartOPD.Utils.getPriorityClass(p.effectivePriority)}">${p.effectivePriority}</span><br>
              <strong>System Recommendation:</strong> ${p.recommendedPriority} (Rule: ${p.triageRuleId})
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('details-modal').remove()">Close</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  acknowledgeDeskScreening(patientId) {
    const patient = SmartOPD.State.getPatientById(patientId);
    if (!patient?.deskScreening || patient.deskScreening.status !== 'pending_review') return;

    patient.deskScreening.status = 'reviewed';
    patient.deskScreening.reviewedAt = new Date().toISOString();
    SmartOPD.State.updatePatient(patient);
    SmartOPD.AuditTrail.logEvent({
      tokenNumber: patient.tokenNumber,
      eventType: 'DESK_SCREENING_REVIEWED',
      previousValue: 'pending_review',
      newValue: 'reviewed',
      reason: 'Registration desk screening reviewed by nurse',
      actor: 'Nurse'
    });
    document.getElementById('details-modal')?.remove();
    window.dispatchEvent(new CustomEvent('opdStateChanged'));
  }
};
