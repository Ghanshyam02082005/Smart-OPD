/**
 * SMART OPD - DOCTOR DASHBOARD & CONSULTATION CONTROL
 */
window.SmartOPD = window.SmartOPD || {};

SmartOPD.DoctorDashboard = {
  render(container) {
    if (!container) return;

    const patients = SmartOPD.State.getPatients();
    const t = SmartOPD.Language.t.bind(SmartOPD.Language);
    const activePatient = patients.find(patient => patient.status === 'in_consultation');
    const waitingQueue = patients
      .filter(patient => patient.status === 'waiting' || patient.status === 'called')
      .sort((a, b) => (a.queuePosition || Number.MAX_SAFE_INTEGER) - (b.queuePosition || Number.MAX_SAFE_INTEGER));
    const nextPatient = waitingQueue[0] || null;
    const completedCount = patients.filter(patient => patient.status === 'completed').length;

    const renderVitals = patient => {
      const vitals = patient.vitals || {};
      const bloodPressure = vitals.bpSystolic && vitals.bpDiastolic
        ? `${vitals.bpSystolic}/${vitals.bpDiastolic}`
        : '—';

      return `
        <div class="doctor-vitals">
          <span><small>${t('doctor.bloodPressure')}</small><strong>${bloodPressure}</strong></span>
          <span><small>${t('doctor.pulse')}</small><strong>${vitals.pulse ? `${vitals.pulse} bpm` : '—'}</strong></span>
          <span class="${vitals.spo2 && vitals.spo2 < 92 ? 'is-abnormal' : ''}"><small>${t('doctor.oxygenSaturation')}</small><strong>${vitals.spo2 ? `${vitals.spo2}%` : '—'}</strong></span>
        </div>
      `;
    };

    const renderPatient = (patient, type) => `
      <div class="doctor-patient-summary">
        <div class="doctor-patient-topline">
          <span class="token-badge">${SmartOPD.Utils.escapeHTML(patient.tokenNumber)}</span>
          <span class="badge-priority ${SmartOPD.Utils.getPriorityClass(patient.effectivePriority)}">${t(`priority.${patient.effectivePriority}`)}</span>
        </div>
        <div class="doctor-patient-name">${SmartOPD.Utils.escapeHTML(patient.fullName)}</div>
        <p class="doctor-patient-demographics">${patient.age} years · ${SmartOPD.Utils.escapeHTML(patient.gender)}${patient.phone ? ` · ${SmartOPD.Utils.escapeHTML(patient.phone)}` : ''}</p>
        <p class="doctor-patient-demographics"><strong>${t('reg.department')}:</strong> ${SmartOPD.Utils.escapeHTML(SmartOPD.Departments.label(patient.department, t) || t('department.general_medicine'))}</p>
        <div class="doctor-complaint">
          <span>${t(type === 'active' ? 'doctor.chiefComplaint' : 'doctor.reasonVisit')}</span>
          <strong>${SmartOPD.Utils.escapeHTML(patient.chiefComplaint)}</strong>
        </div>
        ${patient.aiSummary ? `
          <div class="doctor-ai-summary">
            <strong>${t('doctor.aiSummary')}</strong>
            <p>${SmartOPD.Utils.escapeHTML(patient.aiSummary)}</p>
            ${patient.aiTriagePriority ? `<p><strong>${t('doctor.aiPriority')}:</strong> ${t(`priority.${patient.aiTriagePriority}`)}. ${SmartOPD.Utils.escapeHTML(patient.aiTriageReason || '')}</p>` : ''}
          </div>
        ` : ''}
        ${renderVitals(patient)}
      </div>
    `;

    container.innerHTML = `
      <section class="doctor-dashboard">
        <header class="doctor-dashboard-hero">
          <div class="doctor-hero-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4.8 2.3A.3.3 0 0 0 4.5 2h-1a.3.3 0 0 0-.3.3V5h1.6V2.3z"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div class="doctor-hero-copy">
            <p class="doctor-eyebrow">${t('nav.doctor')}</p>
            <h1>${t('doctor.title')}</h1>
            <p>${t('doctor.subtitle')}</p>
          </div>
          <span class="doctor-live-indicator"><span></span>${t('doctor.live')}</span>
        </header>

        <div class="doctor-overview-stats" aria-label="${t('doctor.title')}">
          <div class="doctor-stat doctor-stat-queue">
            <span class="doctor-stat-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span>
            <span><strong>${waitingQueue.length}</strong><small>${t('nurse.statWaiting')}</small></span>
          </div>
          <div class="doctor-stat doctor-stat-active">
            <span class="doctor-stat-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
            <span>            <strong>${patients.filter(patient => patient.status === 'in_consultation').length}</strong><small>${t('nurse.statConsulting')}</small></span>
          </div>
          <div class="doctor-stat doctor-stat-done">
            <span class="doctor-stat-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 4 4L19 6"/></svg></span>
            <span><strong>${completedCount}</strong><small>${t('nurse.statCompleted')}</small></span>
          </div>
        </div>

        <div class="safety-banner">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span>${t('safety.disclaimer')}</span>
        </div>

        <div class="doctor-patient-grid">
          <article class="card doctor-focus-card doctor-current-card">
            <div class="doctor-section-heading">
              <div>
                <span class="doctor-section-kicker">${t('nurse.statConsulting')}</span>
                <h2>${t('doctor.attending')}</h2>
              </div>
              ${activePatient ? `<span class="badge-status status-in_consultation">${t('status.in_consultation')}</span>` : ''}
            </div>
            ${activePatient ? `
              ${renderPatient(activePatient, 'active')}
              <button class="btn btn-success btn-lg doctor-action" onclick="SmartOPD.NurseDashboard.completeVisit('${activePatient.id}')">
                <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                ${t('nurse.btnComplete')}
              </button>
            ` : `
              <div class="doctor-empty-state">
                <span class="doctor-empty-icon"><svg xmlns="http://www.w3.org/2000/svg" width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
                <strong>${t('doctor.noAttending')}</strong>
                <span>${t('doctor.emptyQueue')}</span>
              </div>
            `}
          </article>

          <article class="card doctor-focus-card doctor-next-card">
            <div class="doctor-section-heading">
              <div>
                <span class="doctor-section-kicker">${t('nurse.statWaiting')}</span>
                <h2>${t('doctor.nextUp')}</h2>
              </div>
              ${nextPatient ? `<span class="queue-position-pill">#${nextPatient.queuePosition || 1}</span>` : ''}
            </div>
            ${nextPatient ? `
              ${renderPatient(nextPatient, 'next')}
              <button class="btn ${nextPatient.status === 'waiting' ? 'btn-warning' : 'btn-primary'} btn-lg doctor-action" onclick="SmartOPD.DoctorDashboard.callPatient('${nextPatient.id}')">
                <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.14 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72l.4 2.8a2 2 0 0 1-.57 1.7L7.2 9.96a16 16 0 0 0 6.84 6.84l1.74-1.74a2 2 0 0 1 1.7-.57l2.8.4a2 2 0 0 1 1.72 2.03z"/></svg>
                ${nextPatient.status === 'waiting' ? t('nurse.btnCall') : t('nurse.btnStart')}
              </button>
            ` : `
              <div class="doctor-empty-state">
                <span class="doctor-empty-icon"><svg xmlns="http://www.w3.org/2000/svg" width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M8 6h13M8 12h13M8 18h13"/><path d="m3 6 1 1 2-2m-3 7 1 1 2-2m-3 7 1 1 2-2"/></svg></span>
                <strong>${t('doctor.emptyQueue')}</strong>
                <span>${t('doctor.noWaiting')}</span>
              </div>
            `}
          </article>
        </div>
      </section>
    `;
  },

  callPatient(patientId) {
    const patient = SmartOPD.State.getPatientById(patientId);
    if (!patient || (patient.status !== 'waiting' && patient.status !== 'called')) return;

    const activePatients = SmartOPD.State.getPatients().filter(
      currentPatient => currentPatient.status === 'in_consultation' && currentPatient.id !== patientId
    );
    activePatients.forEach(currentPatient => {
      SmartOPD.NurseDashboard.completeVisit(currentPatient.id);
    });

    const currentPatient = SmartOPD.State.getPatientById(patientId);
    if (currentPatient.status === 'waiting') {
      SmartOPD.NurseDashboard.callPatient(patientId);
    }
    SmartOPD.NurseDashboard.startConsultation(patientId);
  }
};
