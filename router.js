/**
 * SMART OPD - SPA ROUTER & ROUTE HANDLER
 */
window.SmartOPD = window.SmartOPD || {};

SmartOPD.Router = {
  routes: {
    '#/' : 'renderDashboard',
    '#/dashboard' : 'renderDashboard',
    '#/registration' : 'renderRegistration',
    '#/nurse' : 'renderNurse',
    '#/doctor' : 'renderDoctor',
    '#/prescription' : 'renderPrescription',
    '#/token-display' : 'renderTokenDisplay',
    '#/patient-token' : 'renderPatientToken',
    '#/audit' : 'renderAudit',
    '#/settings' : 'renderSettings'
  },

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());
  },

  getCurrentRoute() {
    const hash = window.location.hash || '#/dashboard';
    return hash.split('?')[0]; // strip query string
  },

  getQueryParams() {
    const hash = window.location.hash || '';
    const qIdx = hash.indexOf('?');
    if (qIdx === -1) return {};
    const qStr = hash.substring(qIdx + 1);
    const params = {};
    qStr.split('&').forEach(pair => {
      const [k, v] = pair.split('=');
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
    });
    return params;
  },

  handleRoute() {
    const route = this.getCurrentRoute();
    const handlerName = this.routes[route] || 'renderNotFound';
    document.body.dataset.route = route.replace(/^#\/?/, '') || 'dashboard';
    
    // Update active nav links in sidebar
    document.querySelectorAll('.nav-item').forEach(el => {
      const href = el.getAttribute('href');
      if (href === route) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    document.querySelector('.sidebar')?.classList.remove('mobile-open');
    document.getElementById('drawer-overlay')?.classList.remove('open');
    document.getElementById('mobile-drawer-toggle')?.setAttribute('aria-expanded', 'false');

    // Invoke handler
    if (typeof this[handlerName] === 'function') {
      this[handlerName]();
    } else {
      this.renderNotFound();
    }

    // Scroll to top
    window.scrollTo(0, 0);

    // Apply i18n
    SmartOPD.Language.applyLanguage();
  },

  renderDashboard() {
    const container = document.getElementById('main-content');
    if (!container) return;

    const stats = SmartOPD.State.getStats();
    const patients = SmartOPD.State.getPatients();
    const waitingPatients = patients.filter(p => p.status === 'waiting' || p.status === 'called');

    const t = SmartOPD.Language.t.bind(SmartOPD.Language);

    container.innerHTML = `
      <section class="overview-hero">
        <div class="overview-hero-copy">
          <span class="overview-eyebrow">${new Date().toLocaleDateString(SmartOPD.Language.getLanguage() === 'hi' ? 'hi-IN' : SmartOPD.Language.getLanguage() === 'gu' ? 'gu-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <h1>${t('nav.dashboard')}</h1>
          <p>${t('app.subtitle')}</p>
        </div>
        <div class="overview-hero-actions">
          <a href="#/registration" class="btn btn-primary">${t('dash.quickReg')}</a>
          <a href="#/nurse" class="btn btn-secondary">${t('nav.nurse')}</a>
          <a href="#/doctor" class="btn btn-secondary">${t('nav.doctor')}</a>
          <a href="#/token-display" class="btn btn-outline" target="_blank" rel="noopener">${t('nav.tokenDisplay')}</a>
        </div>
      </section>

      <div class="safety-banner">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span>${t('safety.disclaimer')}</span>
      </div>

      <!-- STATS METRICS GRID -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-label">${t('dash.totalRegistered')}</span>
            <span class="stat-value">${stats.totalRegistered}</span>
          </div>
          <div class="stat-icon-wrapper stat-icon-total">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-label">${t('dash.immediateWaiting')}</span>
            <span class="stat-value" style="color: var(--priority-immediate);">${stats.immediateWaiting}</span>
          </div>
          <div class="stat-icon-wrapper stat-icon-immediate">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-label">${t('dash.soonWaiting')}</span>
            <span class="stat-value" style="color: var(--priority-soon);">${stats.soonWaiting}</span>
          </div>
          <div class="stat-icon-wrapper stat-icon-soon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-label">${t('dash.routineWaiting')}</span>
            <span class="stat-value" style="color: var(--priority-routine);">${stats.routineWaiting}</span>
          </div>
          <div class="stat-icon-wrapper stat-icon-routine">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-label">${t('dash.inConsultation')}</span>
            <span class="stat-value" style="color: var(--status-consultation-text);">${stats.inConsultation}</span>
          </div>
          <div class="stat-icon-wrapper stat-icon-consulting">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-label">${t('dash.completedConsultations')}</span>
            <span class="stat-value" style="color: var(--status-completed-text);">${stats.completed}</span>
          </div>
          <div class="stat-icon-wrapper stat-icon-completed">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
        </div>
      </div>

      <!-- MAIN DASHBOARD GRID -->
      <div class="dashboard-grid">
        <!-- SMART QUEUE PREVIEW TABLE -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              ${t('dash.smartQueuePreview')}
            </h3>
            <a href="#/nurse" class="btn btn-outline btn-sm">Full Nurse Queue &rarr;</a>
          </div>

          ${waitingPatients.length === 0 ? `
            <div class="text-center" style="padding: 30px;">
              <img src="assets/images/empty-queue.svg" alt="Empty Queue" style="max-width: 220px; margin-bottom: 12px;">
            </div>
          ` : `
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead>
                  <tr style="border-bottom: 2px solid var(--border-light); text-align: left; background-color: var(--bg-muted);">
                    <th style="padding: 10px 14px;">Pos #</th>
                    <th style="padding: 10px 14px;">Token #</th>
                    <th style="padding: 10px 14px;">Patient Name</th>
                    <th style="padding: 10px 14px;">Priority</th>
                    <th style="padding: 10px 14px;">Chief Complaint</th>
                    <th style="padding: 10px 14px;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${waitingPatients.map(p => `
                    <tr style="border-bottom: 1px solid var(--border-light);">
                      <td style="padding: 12px 14px;"><span class="queue-position-pill">Pos #${p.queuePosition}</span></td>
                      <td style="padding: 12px 14px;"><span class="token-badge">${p.tokenNumber}</span></td>
                      <td style="padding: 12px 14px; font-weight: 600;">${SmartOPD.Utils.escapeHTML(p.fullName)} (${p.age}y)</td>
                      <td style="padding: 12px 14px;"><span class="badge-priority ${SmartOPD.Utils.getPriorityClass(p.effectivePriority)}">${t(`priority.${p.effectivePriority}`)}</span></td>
                      <td style="padding: 12px 14px;">${SmartOPD.Utils.escapeHTML(p.chiefComplaint)}</td>
                      <td style="padding: 12px 14px;"><span class="badge-status ${SmartOPD.Utils.getStatusClass(p.status)}">${t(`status.${p.status}`)}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

        <!-- RECENT AUDIT ACTIVITY -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
              ${t('dash.recentActivity')}
            </h3>
            <a href="#/audit" class="btn btn-outline btn-sm">All Logs &rarr;</a>
          </div>

          <div id="dash-recent-activity-container"></div>
        </div>
      </div>
    `;

    // Keep the overview feed compact; the audit screen contains the full table.
    const activityContainer = document.getElementById('dash-recent-activity-container');
    if (activityContainer) {
      const recentLogs = SmartOPD.Storage.getAuditLogs().slice(0, 5);
      activityContainer.innerHTML = recentLogs.length
        ? `<div class="overview-activity-feed">${recentLogs.map(log => `
            <article class="overview-activity-item">
              <span class="overview-activity-mark" aria-hidden="true"></span>
              <div class="overview-activity-copy">
                <strong>${SmartOPD.Utils.escapeHTML(String(log.eventType || '').replace(/_/g, ' '))}</strong>
                <span>${SmartOPD.Utils.escapeHTML(log.tokenNumber || 'SYSTEM')} · ${SmartOPD.Utils.escapeHTML(log.actor || '')}</span>
              </div>
              <time>${SmartOPD.Utils.escapeHTML(SmartOPD.Utils.formatDateTime(log.timestamp))}</time>
            </article>
          `).join('')}</div>`
        : `<p class="overview-activity-empty">${t('audit.noResults')}</p>`;
    }
  },

  renderRegistration() {
    const container = document.getElementById('main-content');
    if (!container) return;

    const t = SmartOPD.Language.t.bind(SmartOPD.Language);

    container.innerHTML = `
      <div class="safety-banner">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span>${t('safety.disclaimer')}</span>
      </div>

      <div class="card registration-card">
        <div class="card-header">
          <div class="registration-heading">
            <span class="registration-eyebrow">${t('reg.eyebrow')}</span>
            <h1 class="card-title">${t('reg.title')}</h1>
            <p class="registration-subtitle">${t('reg.subtitle')}</p>
          </div>
          <span class="registration-form-mark" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M8 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M8 12h8M8 16h5"/></svg>
          </span>
        </div>

        <form id="patient-registration-form" class="registration-form">
          <section class="registration-section">
            <div class="registration-section-heading">
              <span class="registration-section-number">01</span>
              <div>
                <h2>${t('reg.personalSection')}</h2>
                <p>${t('reg.personalSectionHint')}</p>
              </div>
            </div>
          
          <div class="form-row registration-person-fields">
            <div class="form-group">
              <label class="form-label" for="reg-fullname">${t('reg.fullName')} *</label>
              <input type="text" id="reg-fullname" class="form-control" required maxlength="120" autocomplete="name" placeholder="e.g. Rahul Sharma">
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-age">${t('reg.age')} *</label>
              <input type="number" id="reg-age" class="form-control" min="0" max="120" required inputmode="numeric" placeholder="e.g. 45">
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-gender">${t('reg.gender')} *</label>
              <select id="reg-gender" class="form-control" required>
                <option value="">-- Select --</option>
                <option value="Male">${t('reg.genderMale')}</option>
                <option value="Female">${t('reg.genderFemale')}</option>
                <option value="Other">${t('reg.genderOther')}</option>
              </select>
            </div>
          </div>
          </section>

          <section class="registration-section registration-complaint-section">
            <div class="registration-section-heading">
              <span class="registration-section-number">02</span>
              <div>
                <h2>${t('reg.complaintSection')}</h2>
                <p>${t('reg.complaintSectionHint')}</p>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-complaint">${t('reg.chiefComplaint')} *</label>
              <div class="complaint-entry-row">
                <input type="text" id="reg-complaint" class="form-control registration-complaint-input" required maxlength="1000" placeholder="Primary reason for visiting doctor today">
                <button type="button" class="btn btn-secondary complaint-mic-button" id="reg-complaint-mic" aria-pressed="false">
                  <span aria-hidden="true">🎙</span>
                  <span id="reg-complaint-mic-label">${t('reg.micStart')}</span>
                </button>
              </div>
              <p id="reg-complaint-mic-status" class="complaint-mic-status" role="status" aria-live="polite">${t('reg.micPrivacy')}</p>
            </div>
            <div class="form-group department-select-group">
              <label class="form-label" for="reg-department">${t('reg.department')}</label>
              <select id="reg-department" class="form-control" required>
                <option value="">${t('reg.departmentPlaceholder')}</option>
                ${SmartOPD.Departments.ids.map(id => `
                  <option value="${id}">${SmartOPD.Departments.label(id, t)}</option>
                `).join('')}
              </select>
              <p id="reg-department-status" class="complaint-mic-status" role="status" aria-live="polite">${t('reg.departmentHelp')}</p>
            </div>
            <div class="ai-intake-panel">
              <p>${t('reg.aiPrivacyNotice')}</p>
              <button type="button" class="btn btn-secondary" id="ai-summarize-complaint">${t('reg.aiSummarizeBtn')}</button>
              <p id="ai-summary-status" class="ai-summary-status" role="status" aria-live="polite"></p>
              <p id="ai-triage-result" class="ai-summary-status" aria-live="polite"></p>
              <div id="ai-summary-review" class="form-group" hidden>
                <label class="form-label" for="ai-intake-summary">${t('reg.aiSummaryLabel')}</label>
                <textarea id="ai-intake-summary" class="form-control" rows="4" maxlength="2000"></textarea>
                <label class="ai-summary-confirm">
                  <input type="checkbox" id="ai-summary-reviewed">
                  <span>${t('reg.aiReviewed')}</span>
                </label>
              </div>
            </div>
          </section>

          <section class="registration-section">
            <div class="registration-section-heading">
              <span class="registration-section-number">03</span>
              <div>
                <h2>${t('reg.visitSection')}</h2>
                <p>${t('reg.visitSectionHint')}</p>
              </div>
            </div>
          <div class="form-row registration-visit-fields">
            <div class="form-group">
              <label class="form-label" for="reg-phone">${t('reg.phone')}</label>
              <input type="tel" id="reg-phone" class="form-control" autocomplete="tel" placeholder="e.g. +91 98765 43210">
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-duration">${t('reg.duration')}</label>
              <select id="reg-duration" class="form-control">
                <option value="1_day">1 day</option>
                <option value="2_3_days">2-3 days</option>
                <option value="1_week">1 week</option>
                <option value="2_weeks">2 weeks</option>
                <option value="1_month">1 month</option>
                <option value="more_than_month">More than a month</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-severity">${t('reg.severity')}</label>
              <input type="range" id="reg-severity" class="form-control" min="1" max="10" value="5" style="padding-top: 10px;">
            </div>
          </div>

          <div class="form-row registration-history-fields">
            <div class="form-group">
              <label class="form-label" for="reg-conditions">${t('reg.existingConditions')}</label>
              <textarea id="reg-conditions" class="form-control" rows="2" placeholder="e.g. Hypertension, Diabetes"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-medications">${t('reg.currentMedications')}</label>
              <textarea id="reg-medications" class="form-control" rows="2" placeholder="e.g. Thyronorm 50mcg, Vitamin D"></textarea>
            </div>
          </div>
          </section>

          <!-- PRESENTING SYMPTOMS CHIPS -->
          <section class="registration-section">
            <div class="registration-section-heading">
              <span class="registration-section-number">04</span>
              <div>
                <h2>${t('reg.symptoms')}</h2>
                <p>${t('reg.symptomsSectionHint')}</p>
              </div>
            </div>
          <div class="symptom-chips-grid registration-symptoms-grid">
            <label class="symptom-chip is-redflag">
              <input type="checkbox" value="chest_pain"> ${t('symptom.chest_pain')}
            </label>
            <label class="symptom-chip is-redflag">
              <input type="checkbox" value="breathing_diff"> ${t('symptom.breathing_diff')}
            </label>
            <label class="symptom-chip is-redflag">
              <input type="checkbox" value="loss_consciousness"> ${t('symptom.loss_consciousness')}
            </label>
            <label class="symptom-chip is-redflag">
              <input type="checkbox" value="stroke_symptoms"> ${t('symptom.stroke_symptoms')}
            </label>
            <label class="symptom-chip is-redflag">
              <input type="checkbox" value="bleeding"> ${t('symptom.bleeding')}
            </label>
            <label class="symptom-chip is-redflag">
              <input type="checkbox" value="allergic_reaction"> ${t('symptom.allergic_reaction')}
            </label>
            <label class="symptom-chip">
              <input type="checkbox" value="fever"> ${t('symptom.fever')}
            </label>
            <label class="symptom-chip">
              <input type="checkbox" value="dizziness"> ${t('symptom.dizziness')}
            </label>
            <label class="symptom-chip">
              <input type="checkbox" value="weakness"> ${t('symptom.weakness')}
            </label>
            <label class="symptom-chip">
              <input type="checkbox" value="headache"> ${t('symptom.headache')}
            </label>
            <label class="symptom-chip">
              <input type="checkbox" value="abdominal_pain"> ${t('symptom.abdominal_pain')}
            </label>
            <label class="symptom-chip">
              <input type="checkbox" value="vomiting"> ${t('symptom.vomiting')}
            </label>
            <label class="symptom-chip">
              <input type="checkbox" value="routine_followup"> ${t('symptom.routine_followup')}
            </label>
          </div>
          </section>

          <!-- VITALS SECTION -->
          <section class="registration-section">
            <div class="registration-section-heading">
              <span class="registration-section-number">05</span>
              <div>
                <h2>${t('reg.vitalsTitle')}</h2>
                <p>${t('reg.vitalsSectionHint')}</p>
              </div>
            </div>
          <div class="vitals-grid registration-vitals-grid">
            <div class="vital-card">
              <div class="vital-header">
                <span class="vital-title">Blood Pressure (mmHg)</span>
                <label class="vital-unavail-toggle">
                  <input type="checkbox" id="vital-bp-unavail" onchange="document.getElementById('vital-bp-sys').disabled = this.checked; document.getElementById('vital-bp-dia').disabled = this.checked;"> ${t('reg.notMeasured')}
                </label>
              </div>
              <div style="display: flex; gap: 8px;">
                <input type="number" id="vital-bp-sys" class="form-control" placeholder="Systolic (120)">
                <input type="number" id="vital-bp-dia" class="form-control" placeholder="Diastolic (80)">
              </div>
            </div>

            <div class="vital-card">
              <div class="vital-header">
                <span class="vital-title">Pulse Rate (BPM)</span>
                <label class="vital-unavail-toggle">
                  <input type="checkbox" id="vital-pulse-unavail" onchange="document.getElementById('vital-pulse').disabled = this.checked;"> ${t('reg.notMeasured')}
                </label>
              </div>
              <input type="number" id="vital-pulse" class="form-control" placeholder="e.g. 72">
            </div>

            <div class="vital-card">
              <div class="vital-header">
                <span class="vital-title">SpO₂ Oxygen (%)</span>
                <label class="vital-unavail-toggle">
                  <input type="checkbox" id="vital-spo2-unavail" onchange="document.getElementById('vital-spo2').disabled = this.checked;"> ${t('reg.notMeasured')}
                </label>
              </div>
              <input type="number" id="vital-spo2" class="form-control" placeholder="e.g. 98">
            </div>

            <div class="vital-card">
              <div class="vital-header">
                <span class="vital-title">Temperature (°F)</span>
                <label class="vital-unavail-toggle">
                  <input type="checkbox" id="vital-temp-unavail" onchange="document.getElementById('vital-temp').disabled = this.checked;"> ${t('reg.notMeasured')}
                </label>
              </div>
              <input type="number" step="0.1" id="vital-temp" class="form-control" placeholder="e.g. 98.6">
            </div>
          </div>
          </section>

          <section class="registration-section desk-screening-panel" id="desk-screening-panel" hidden>
            <div class="registration-section-heading">
              <span class="registration-section-number">!</span>
              <div>
                <h2>${t('reg.deskScreeningTitle')}</h2>
                <p>${t('reg.deskScreeningHint')}</p>
              </div>
            </div>
            <div class="desk-screening-alert" id="desk-screening-alert" role="alert" hidden>
              ${t('reg.deskScreeningAlert')}
            </div>
            <div class="desk-screening-questions">
              ${[
                ['breathing', 'reg.deskQuestionBreathing'],
                ['chestPain', 'reg.deskQuestionChestPain'],
                ['faintingConfusion', 'reg.deskQuestionFainting'],
                ['bleedingAllergy', 'reg.deskQuestionBleeding']
              ].map(([id, labelKey]) => `
                <div class="form-group">
                  <label class="form-label" for="desk-screening-${id}">${t(labelKey)}</label>
                  <select id="desk-screening-${id}" class="form-control desk-screening-answer">
                    <option value="">${t('reg.deskAnswerNotAsked')}</option>
                    <option value="yes">${t('reg.deskAnswerYes')}</option>
                    <option value="no">${t('reg.deskAnswerNo')}</option>
                    <option value="unsure">${t('reg.deskAnswerUnsure')}</option>
                  </select>
                </div>
              `).join('')}
            </div>
            <p class="desk-screening-ai-privacy">${t('reg.deskScreeningAiPrivacy')}</p>
            <button type="button" class="btn btn-secondary btn-sm" id="desk-screening-ai-review" disabled>
              ${t('reg.deskScreeningAiButton')}
            </button>
            <p id="desk-screening-ai-status" class="ai-summary-status" role="status" aria-live="polite"></p>
            <div class="desk-screening-ai-result" id="desk-screening-ai-result" hidden></div>
          </section>

          <!-- LIVE TRIAGE ENGINE RECOMMENDATION PREVIEW CARD -->
          <div class="triage-preview-card" id="triage-live-preview"></div>

          <div class="registration-submit-row">
            <p>${t('reg.submitHint')}</p>
            <button type="submit" class="btn btn-primary btn-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
              ${t('reg.submitBtn')}
            </button>
          </div>
        </form>
      </div>
    `;

    SmartOPD.Registration.initForm(container);
  },

  renderNurse() {
    const container = document.getElementById('main-content');
    if (!container) return;
    SmartOPD.NurseDashboard.render(container);
  },

  renderDoctor() {
    const container = document.getElementById('main-content');
    if (!container) return;
    SmartOPD.DoctorDashboard.render(container);
  },

  renderPrescription() {
    const container = document.getElementById('main-content');
    if (!container) return;
    const params = this.getQueryParams();
    SmartOPD.Prescription.render(container, params.patientId || params.id || null);
  },

  renderTokenDisplay() {
    const container = document.getElementById('main-content');
    if (!container) return;
    SmartOPD.TokenDisplay.render(container);
  },

  renderPatientToken() {
    const container = document.getElementById('main-content');
    if (!container) return;

    const params = this.getQueryParams();
    const tokenStr = params.token || '';
    const patient = params.patientId
      ? SmartOPD.State.getPatientById(params.patientId)
      : (tokenStr ? SmartOPD.State.getPatientByToken(tokenStr) : null);
    const t = SmartOPD.Language.t.bind(SmartOPD.Language);

    container.innerHTML = `
      <div class="card patient-token-card text-center" style="max-width: 500px; margin: 40px auto; padding: 40px 24px;">
        <h2 style="font-size: 22px; margin-bottom: 20px;">${t('patient.tokenTitle')}</h2>

        ${patient ? `
          <div style="background-color: var(--primary-50); border: 2px solid var(--primary-200); border-radius: var(--radius-lg); padding: 30px; margin-bottom: 24px;">
            <div style="font-size: 13px; color: var(--text-muted); text-transform: uppercase;">${t('patient.origToken')}</div>
            <div style="font-family: monospace; font-size: 64px; font-weight: 900; color: var(--primary-700); line-height: 1;">${patient.tokenNumber}</div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 12px; font-size: 15px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-light); padding-bottom: 8px;">
              <span>${t('patient.currPos')}:</span>
              <span class="queue-position-pill" style="font-size: 14px;">${patient.queuePosition ? `Position #${patient.queuePosition}` : 'Not in waiting queue'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-light); padding-bottom: 8px;">
              <span>${t('patient.status')}:</span>
              <span class="badge-status ${SmartOPD.Utils.getStatusClass(patient.status)}">${t(`status.${patient.status}`)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Assessed Priority:</span>
              <span class="badge-priority ${SmartOPD.Utils.getPriorityClass(patient.effectivePriority)}">${t(`priority.${patient.effectivePriority}`)}</span>
            </div>
          </div>

          <p style="font-size: 12px; color: var(--text-muted); font-style: italic; margin-bottom: 24px;">
            "${t('patient.notice')}"
          </p>
        ` : `
          <p class="text-muted" style="margin-bottom: 24px;">Please specify a valid token number or register a patient.</p>
        `}

        <div style="display: flex; justify-content: center; gap: 10px;">
          <a href="#/dashboard" class="btn btn-secondary">${t('patient.returnBtn')}</a>
        </div>
      </div>
    `;
  },

  renderAudit() {
    const container = document.getElementById('main-content');
    if (!container) return;

    const t = SmartOPD.Language.t.bind(SmartOPD.Language);
    const logs = SmartOPD.Storage.getAuditLogs();
    const eventOptions = [...new Set(logs.map(log => String(log.eventType || '')).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
      .map(eventType => `<option value="${SmartOPD.Utils.escapeHTML(eventType)}">${SmartOPD.Utils.escapeHTML(eventType.replace(/_/g, ' '))}</option>`)
      .join('');
    const today = SmartOPD.Storage.getLocalDateKey(new Date());
    const todayCount = logs.filter(log => {
      const timestamp = new Date(log.timestamp);
      return !Number.isNaN(timestamp.getTime()) && SmartOPD.Storage.getLocalDateKey(timestamp) === today;
    }).length;

    container.innerHTML = `
      <section class="audit-dashboard">
        <header class="audit-dashboard-hero">
          <div class="audit-hero-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
          <div class="audit-hero-copy">
            <p class="audit-eyebrow">${t('audit.eyebrow')}</p>
            <h1>${t('audit.title')}</h1>
            <p>${t('audit.disclaimer')}</p>
          </div>
          <div class="audit-hero-actions">
            <button class="btn btn-secondary" type="button" onclick="SmartOPD.Router.printAuditReport('print')">
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              ${t('audit.print')}
            </button>
            <button class="btn btn-primary" type="button" onclick="SmartOPD.Router.printAuditReport('pdf')">
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              ${t('audit.downloadPdf')}
            </button>
          </div>
        </header>

        <section class="audit-summary-grid" aria-label="${t('audit.summary')}">
          <article class="audit-summary-card audit-summary-total">
            <span class="audit-summary-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></span>
            <span><strong>${logs.length}</strong><small>${t('audit.totalEvents')}</small></span>
          </article>
          <article class="audit-summary-card audit-summary-filtered">
            <span class="audit-summary-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg></span>
            <span><strong id="audit-filtered-count">${logs.length}</strong><small>${t('audit.matchingEvents')}</small></span>
          </article>
          <article class="audit-summary-card audit-summary-today">
            <span class="audit-summary-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>
            <span><strong>${todayCount}</strong><small>${t('audit.todayEvents')}</small></span>
          </article>
        </section>

        <section class="audit-panel">
          <div class="audit-panel-heading">
            <div>
              <h2>${t('audit.activityTitle')}</h2>
              <p>${t('audit.activitySubtitle')}</p>
            </div>
            <button class="btn btn-outline btn-sm" type="button" onclick="SmartOPD.Router.resetAuditFilters()">
              ${t('audit.clearFilters')}
            </button>
          </div>

          <div class="audit-filter-grid">
            <label class="audit-filter-field">
              <span>${t('audit.filterToken')}</span>
              <input type="search" id="audit-filter-token" class="form-control" placeholder="${t('audit.filterToken')}..." oninput="SmartOPD.Router.filterAuditLogs()">
            </label>
            <label class="audit-filter-field">
              <span>${t('audit.filterEvent')}</span>
              <select id="audit-filter-event" class="form-control" onchange="SmartOPD.Router.filterAuditLogs()">
                <option value="">${t('audit.allEvents')}</option>
                ${eventOptions}
              </select>
            </label>
            <label class="audit-filter-field">
              <span>${t('audit.dateFrom')}</span>
              <input type="date" id="audit-filter-date-from" class="form-control" onchange="SmartOPD.Router.filterAuditLogs()">
            </label>
            <label class="audit-filter-field">
              <span>${t('audit.dateTo')}</span>
              <input type="date" id="audit-filter-date-to" class="form-control" onchange="SmartOPD.Router.filterAuditLogs()">
            </label>
          </div>

          <p class="audit-print-hint">${t('audit.pdfHint')}</p>
          <div id="audit-table-container"></div>
        </section>
      </section>
    `;

    this.filterAuditLogs();
  },

  filterAuditLogs() {
    const tokenVal = document.getElementById('audit-filter-token')?.value.trim() || '';
    const eventVal = document.getElementById('audit-filter-event')?.value || '';
    const dateFrom = document.getElementById('audit-filter-date-from')?.value || '';
    const dateTo = document.getElementById('audit-filter-date-to')?.value || '';
    const filtered = SmartOPD.AuditTrail.getFilteredLogs(tokenVal, eventVal, dateFrom, dateTo);
    const filteredCount = document.getElementById('audit-filtered-count');
    if (filteredCount) filteredCount.textContent = filtered.length;

    SmartOPD.AuditTrail.renderTable(
      document.getElementById('audit-table-container'),
      tokenVal,
      eventVal,
      dateFrom,
      dateTo
    );
  },

  resetAuditFilters() {
    ['audit-filter-token', 'audit-filter-event', 'audit-filter-date-from', 'audit-filter-date-to']
      .forEach(id => {
        const field = document.getElementById(id);
        if (field) field.value = '';
      });
    this.filterAuditLogs();
  },

  printAuditReport(format = 'print') {
    const printArea = document.getElementById('audit-print-area');
    if (!printArea) {
      SmartOPD.Notifications.danger('Audit report print area is unavailable.');
      return;
    }

    const t = SmartOPD.Language.t.bind(SmartOPD.Language);
    const token = document.getElementById('audit-filter-token')?.value.trim() || '';
    const event = document.getElementById('audit-filter-event')?.value || '';
    const dateFrom = document.getElementById('audit-filter-date-from')?.value || '';
    const dateTo = document.getElementById('audit-filter-date-to')?.value || '';
    const logs = SmartOPD.AuditTrail.getFilteredLogs(token, event, dateFrom, dateTo);
    if (!logs.length) {
      SmartOPD.Notifications.warning(t('audit.nothingToPrint'));
      return;
    }

    const settings = SmartOPD.Storage.getSettings();
    const validLogo = /^data:image\/(?:png|jpeg|webp);base64,/.test(settings.logoDataUrl || '');
    const logo = validLogo ? settings.logoDataUrl : 'assets/images/smart-opd-logo.svg';
    const escape = SmartOPD.Utils.escapeHTML;
    const filterSummary = [
      token ? `${t('audit.colToken')}: ${token}` : '',
      event ? `${t('audit.colEvent')}: ${event.replace(/_/g, ' ')}` : '',
      dateFrom ? `${t('audit.dateFrom')}: ${dateFrom}` : '',
      dateTo ? `${t('audit.dateTo')}: ${dateTo}` : ''
    ].filter(Boolean).join('  |  ');
    const rows = logs.map(log => `
      <tr>
        <td>${escape(SmartOPD.Utils.formatDateTime(log.timestamp))}</td>
        <td>${escape(log.tokenNumber)}</td>
        <td>${escape(String(log.eventType || '').replace(/_/g, ' '))}</td>
        <td>${escape(log.previousValue)}</td>
        <td>${escape(log.newValue)}</td>
        <td>${escape(log.reason || '—')}</td>
        <td>${escape(log.actor)}</td>
      </tr>
    `).join('');
    const hospitalName = escape(settings.hospitalName || 'Hospital');
    const reportTitle = t('audit.title');
    const generatedAt = SmartOPD.Utils.formatDateTime(new Date().toISOString());

    printArea.innerHTML = `
      <article class="audit-print-report">
        <header class="parchi-header audit-print-header">
          <div class="parchi-header-left">
            <img src="${logo}" alt="${hospitalName}" class="parchi-logo">
            <div>
              <h1 class="parchi-hosp-name">${hospitalName}</h1>
              ${settings.hospitalSubtitle ? `<div class="parchi-hosp-sub">${escape(settings.hospitalSubtitle)}</div>` : ''}
            </div>
          </div>
          <div class="parchi-header-right">
            ${settings.email ? `<div><strong>e-mail:</strong> ${escape(settings.email)}</div>` : ''}
            ${settings.phone ? `<div><strong>Phone:</strong> ${escape(settings.phone)}</div>` : ''}
            ${settings.website ? `<div><strong>Web:</strong> ${escape(settings.website)}</div>` : ''}
          </div>
        </header>
        <div class="parchi-divider"></div>
        <div class="parchi-title-bar audit-print-title">${escape(reportTitle)}</div>
        <div class="audit-print-meta">
          <span><strong>${t('audit.reportGenerated')}:</strong> ${escape(generatedAt)}</span>
          <span><strong>${t('audit.matchingEvents')}:</strong> ${logs.length}</span>
          ${filterSummary ? `<span><strong>${t('audit.appliedFilters')}:</strong> ${escape(filterSummary)}</span>` : ''}
        </div>
        <table class="audit-table audit-print-table">
          <thead>
            <tr>
              <th>${t('audit.colTime')}</th><th>${t('audit.colToken')}</th><th>${t('audit.colEvent')}</th>
              <th>${t('audit.colPrev')}</th><th>${t('audit.colNew')}</th><th>${t('audit.colReason')}</th><th>${t('audit.colActor')}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <footer class="audit-print-footer">
          <span>${escape(settings.address || '')}</span>
          <span>${t('audit.confidential')}</span>
        </footer>
      </article>
    `;

    const previousTitle = document.title;
    document.title = `${settings.hospitalName || 'Hospital'} - ${reportTitle}`;
    const cleanup = () => {
      document.body.classList.remove('print-audit-mode');
      printArea.innerHTML = '';
      document.title = previousTitle;
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup, { once: true });
    document.body.classList.add('print-audit-mode');
    if (format === 'pdf') SmartOPD.Notifications.info(t('audit.savePdfHint'));
    window.print();
  },

  renderSettings() {
    const container = document.getElementById('main-content');
    if (!container) return;

    const t = SmartOPD.Language.t.bind(SmartOPD.Language);
    const settings = SmartOPD.Storage.getSettings();
    const logoSrc = /^data:image\/(?:png|jpeg|webp);base64,/.test(settings.logoDataUrl)
      ? settings.logoDataUrl
      : 'assets/images/smart-opd-logo.svg';

    container.innerHTML = `
      <div class="card settings-card" style="max-width: 820px; margin: 0 auto;">
        <div class="card-header">
          <h2 class="card-title">${t('settings.title')}</h2>
        </div>

        <div class="flex-col gap-4">
          <div class="form-group">
            <label class="form-label">${t('settings.langLabel')}</label>
            <select class="form-control" style="max-width: 280px;" onchange="SmartOPD.Language.setLanguage(this.value)">
              <option value="en" ${SmartOPD.Language.getLanguage() === 'en' ? 'selected' : ''}>English</option>
              <option value="hi" ${SmartOPD.Language.getLanguage() === 'hi' ? 'selected' : ''}>हिन्दी</option>
              <option value="gu" ${SmartOPD.Language.getLanguage() === 'gu' ? 'selected' : ''}>ગુજરાતી</option>
            </select>
          </div>

          <hr style="border: none; border-top: 1px solid var(--border-light); margin: 10px 0;">

          <section>
            <h3 style="font-size: 17px; margin-bottom: 6px;">${t('settings.hospitalTitle')}</h3>
            <p class="text-muted" style="font-size: 13px; margin-bottom: 16px;">${t('settings.hospitalDesc')}</p>
            <form onsubmit="SmartOPD.Router.saveHospitalSettings(event)">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="hospital-name">${t('settings.hospitalName')} *</label>
                  <input class="form-control" id="hospital-name" name="hospitalName" type="text" required maxlength="120" value="${SmartOPD.Utils.escapeHTML(settings.hospitalName)}">
                </div>
                <div class="form-group">
                  <label class="form-label" for="hospital-subtitle">${t('settings.hospitalSubtitle')}</label>
                  <input class="form-control" id="hospital-subtitle" name="hospitalSubtitle" type="text" maxlength="160" value="${SmartOPD.Utils.escapeHTML(settings.hospitalSubtitle)}">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="hospital-address">${t('settings.hospitalAddress')}</label>
                <input class="form-control" id="hospital-address" name="address" type="text" maxlength="200" value="${SmartOPD.Utils.escapeHTML(settings.address)}">
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="hospital-email">${t('settings.hospitalEmail')}</label>
                  <input class="form-control" id="hospital-email" name="email" type="email" maxlength="120" value="${SmartOPD.Utils.escapeHTML(settings.email)}">
                </div>
                <div class="form-group">
                  <label class="form-label" for="hospital-phone">${t('settings.hospitalPhone')}</label>
                  <input class="form-control" id="hospital-phone" name="phone" type="tel" maxlength="40" value="${SmartOPD.Utils.escapeHTML(settings.phone)}">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="hospital-website">${t('settings.hospitalWebsite')}</label>
                <input class="form-control" id="hospital-website" name="website" type="text" maxlength="120" value="${SmartOPD.Utils.escapeHTML(settings.website)}">
              </div>
              <div class="form-group">
                <label class="form-label" for="hospital-logo">${t('settings.hospitalLogo')}</label>
                <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
                <img id="hospital-logo-preview" src="${logoSrc}" alt="${SmartOPD.Utils.escapeHTML(settings.hospitalName)}" style="width: 96px; height: 72px; object-fit: contain; border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 6px; background: var(--bg-surface);">
                <div class="flex-col" style="gap: 8px;">
                  <input class="form-control" id="hospital-logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp" aria-describedby="hospital-logo-help">
                  <small class="text-muted" id="hospital-logo-help">${t('settings.hospitalLogoHelp')}</small>
                  ${settings.logoDataUrl ? `<button type="button" class="btn btn-outline btn-sm" onclick="SmartOPD.Router.clearHospitalLogo()">${t('settings.removeHospitalLogo')}</button>` : ''}
                </div>
                </div>
              </div>
              <button type="submit" class="btn btn-primary">${t('settings.saveHospital')}</button>
            </form>
          </section>

          <hr style="border: none; border-top: 1px solid var(--border-light); margin: 10px 0;">

          <div>
            <h4 style="font-size: 16px; font-weight: 700; color: var(--priority-immediate-text); margin-bottom: 6px;">Reset Application State</h4>
            <p class="text-muted" style="font-size: 13px; margin-bottom: 12px;">${t('settings.resetDesc')}</p>
            <button class="btn btn-danger" onclick="SmartOPD.App.resetData()">${t('settings.resetBtn')}</button>
          </div>
        </div>
      </div>
    `;
    const logoInput = document.getElementById('hospital-logo');
    if (logoInput) {
      logoInput.addEventListener('change', event => {
        const file = event.currentTarget.files[0];
        if (!file) return;
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 1024 * 1024) {
          event.currentTarget.value = '';
          SmartOPD.Notifications.danger(t('settings.hospitalLogoInvalid'));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const preview = document.getElementById('hospital-logo-preview');
          if (preview && typeof reader.result === 'string') preview.src = reader.result;
        };
        reader.onerror = () => SmartOPD.Notifications.danger(t('settings.hospitalLogoInvalid'));
        reader.readAsDataURL(file);
      });
    }
  },

  async saveHospitalSettings(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const settings = Object.keys(SmartOPD.Storage.DEFAULT_SETTINGS).reduce((saved, key) => {
      if (key !== 'logoDataUrl') saved[key] = String(formData.get(key) || '').trim();
      return saved;
    }, {});

    try {
      const currentSettings = SmartOPD.Storage.getSettings();
      settings.logoDataUrl = currentSettings.logoDataUrl;
      settings.logoThemeColors = currentSettings.logoThemeColors;
      const logoFile = formData.get('logo');
      if (logoFile instanceof File && logoFile.size > 0) {
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(logoFile.type) || logoFile.size > 1024 * 1024) {
          throw new Error(SmartOPD.Language.t('settings.hospitalLogoInvalid'));
        }
        settings.logoDataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => typeof reader.result === 'string'
            ? resolve(reader.result)
            : reject(new Error('Unable to read hospital logo.'));
          reader.onerror = () => reject(new Error('Unable to read hospital logo.'));
          reader.readAsDataURL(logoFile);
        });
        if (settings.logoDataUrl !== currentSettings.logoDataUrl) {
          settings.logoThemeColors = null;
        }
      }
      SmartOPD.Storage.saveSettings(settings);
      SmartOPD.Notifications.success(SmartOPD.Language.t('settings.hospitalSaved'));
    } catch (error) {
      SmartOPD.Notifications.danger(
        error.message === SmartOPD.Language.t('settings.hospitalLogoInvalid')
          ? error.message
          : SmartOPD.Language.t('settings.hospitalSaveError')
      );
    }
  },

  clearHospitalLogo() {
    const settings = SmartOPD.Storage.getSettings();
    settings.logoDataUrl = '';
    settings.logoThemeColors = null;
    try {
      SmartOPD.Storage.saveSettings(settings);
      SmartOPD.Notifications.success(SmartOPD.Language.t('settings.hospitalLogoRemoved'));
      this.renderSettings();
    } catch (error) {
      SmartOPD.Notifications.danger(SmartOPD.Language.t('settings.hospitalSaveError'));
    }
  },

  renderNotFound() {
    const container = document.getElementById('main-content');
    if (!container) return;

    container.innerHTML = `
      <div class="card text-center" style="max-width: 500px; margin: 40px auto; padding: 40px;">
        <h2 style="font-size: 32px; color: var(--priority-immediate);">404</h2>
        <p class="text-muted" style="margin: 12px 0 24px 0;">The requested navigation page does not exist.</p>
        <a href="#/dashboard" class="btn btn-primary">Return to Overview Dashboard</a>
      </div>
    `;
  }
};
