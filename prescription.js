window.SmartOPD = window.SmartOPD || {};

SmartOPD.Prescription = {
  hospitalConfig: {
    name: 'Mathura Das Mathur Hospital',
    subtitle: 'A Jodhpur Divisional General Hospital',
    email: 'contact@mdmhjodhpur.in',
    website: 'www.mdmhjodhpur.in',
    address: 'Mathura Das Mathur Hospital, Near Jodhpur Development Authority, Jodhpur, Rajasthan 342003, India',
    phone: '+91 291 243XXXX, +91 291 243XXXX'
  },

  resolvePatient(patientId) {
    if (patientId) {
      return SmartOPD.State.getPatientById(patientId) || null;
    }
    const patients = SmartOPD.State.getPatients();
    return patients.length ? patients[patients.length - 1] : null;
  },

  render(container, patientId) {
    const patient = this.resolvePatient(patientId);
    if (!container) return;

    if (!patient) {
      container.innerHTML = `
        <div class="card" style="max-width: 560px; margin: 40px auto; text-align: center;">
          <h3 style="margin-bottom: 12px;">No patient found</h3>
          <p style="color: var(--text-muted);">Register a patient first to generate their OPD prescription.</p>
          <a href="#/registration" class="btn btn-primary">Register Patient</a>
        </div>
      `;
      return;
    }

    const patientName = SmartOPD.Utils.escapeHTML(patient.fullName || 'Patient Name');
    const age = patient.age || 'Age';
    const sex = SmartOPD.Utils.escapeHTML(patient.gender || 'Sex');
    const dateValue = patient.registeredAt ? new Date(patient.registeredAt).toLocaleDateString() : new Date().toLocaleDateString();
    const token = patient.tokenNumber || 'OPD-000';
    const ref = patient.parchiRef || SmartOPD.Utils.formatParchiRef(patient.sequenceNumber || 1);
    const hospital = SmartOPD.Storage.getSettings();
    const departmentName = SmartOPD.Departments.label(
      patient.department || 'general_medicine',
      key => SmartOPD.Language.t(key)
    );
    const logo = /^data:image\/(?:png|jpeg|webp);base64,/.test(hospital.logoDataUrl)
      ? hospital.logoDataUrl
      : 'assets/images/smart-opd-logo.svg';
    const hospitalName = SmartOPD.Utils.escapeHTML(hospital.hospitalName || this.hospitalConfig.name).toUpperCase();
    const hospitalSubtitle = SmartOPD.Utils.escapeHTML(hospital.hospitalSubtitle || '').toUpperCase();
    const hospitalEmail = SmartOPD.Utils.escapeHTML(hospital.email || '');
    const hospitalWebsite = SmartOPD.Utils.escapeHTML(hospital.website || '');
    const hospitalAddress = SmartOPD.Utils.escapeHTML(hospital.address || '');
    const hospitalPhone = SmartOPD.Utils.escapeHTML(hospital.phone || '');

    container.innerHTML = `
      <div class="prescription-page">
        <div class="prescription-toolbar">
          <a href="#/dashboard" class="btn btn-outline">Back to Dashboard</a>
          <a href="#/registration" class="btn btn-outline">Back to Registration</a>
        </div>

        <div class="prescription-paper" aria-label="Prescription paper preview">
          <header class="prescription-header">
            <div class="prescription-brand">
              <img class="hospital-brand-logo prescription-hospital-logo" src="${logo}" alt="${hospitalName}">
              <div class="prescription-brand-text">
                <h1>${hospitalName}</h1>
                ${hospitalSubtitle ? `<div class="subtitle">${hospitalSubtitle}</div>` : ''}
              </div>
            </div>
            <div class="prescription-contact">
              ${hospitalEmail ? `<div><strong>e-mail:</strong> ${hospitalEmail}</div>` : ''}
              ${hospitalWebsite ? `<div><strong>Web:</strong> ${hospitalWebsite}</div>` : ''}
            </div>
          </header>

          <div class="prescription-divider"></div>

          <main class="prescription-main">
            <div class="prescription-patient-grid">
              <div class="prescription-field"><span class="prescription-label">Patient Name:</span> <span class="prescription-value">${patientName}</span></div>
              <div class="prescription-field small"><span class="prescription-label">Date:</span> <span class="prescription-value">${dateValue}</span></div>
              <div class="prescription-field"><span class="prescription-label">Age:</span> <span class="prescription-value">${age}</span></div>
              <div class="prescription-field small"><span class="prescription-label">Sex:</span> <span class="prescription-value">${sex}</span></div>
              <div class="prescription-field"><span class="prescription-label">OPD No.:</span> <span class="prescription-value">${token}</span></div>
              <div class="prescription-field"><span class="prescription-label">Parchi Reference No.:</span> <span class="prescription-value">${ref}</span></div>
              <div class="prescription-field"><span class="prescription-label">Department:</span> <span class="prescription-value">${SmartOPD.Utils.escapeHTML(departmentName)}</span></div>
            </div>

            <div class="prescription-blank">
              <div class="prescription-lines" aria-hidden="true"></div>
            </div>

            <div class="prescription-signoff">
              <div class="signature-box">Doctor's Signature</div>
              <div class="signature-box">Doctor's Name / Designation</div>
              <div class="signature-box">Consultation Date</div>
            </div>
          </main>

          <footer class="prescription-footer">
            ${hospitalAddress}<br>
            ${hospitalPhone}
          </footer>
        </div>
      </div>
    `;

  }
};
