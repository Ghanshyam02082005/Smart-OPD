/**
 * SMART OPD - PATIENT REGISTRATION CONTROLLER
 */
window.SmartOPD = window.SmartOPD || {};

SmartOPD.Registration = {
  initForm(formContainer) {
    if (!formContainer) return;

    this.bindEvents(formContainer);
    this.updateLiveTriagePreview(formContainer);
  },

  recognition: null,
  dictationTimer: null,

  getHigherPriority(rulePriority, aiPriority) {
    const rank = { IMMEDIATE: 0, SOON: 1, ROUTINE: 2 };
    const hasPriority = priority => Object.prototype.hasOwnProperty.call(rank, priority);
    if (!hasPriority(rulePriority)) return hasPriority(aiPriority) ? aiPriority : 'ROUTINE';
    if (!hasPriority(aiPriority)) return rulePriority;
    return rank[aiPriority] < rank[rulePriority] ? aiPriority : rulePriority;
  },

  bindEvents(container) {
    const micButton = container.querySelector('#reg-complaint-mic');
    if (micButton) {
      micButton.addEventListener('click', () => this.toggleComplaintDictation(container));
    }

    const summarizeButton = container.querySelector('#ai-summarize-complaint');
    if (summarizeButton) {
      summarizeButton.addEventListener('click', () => this.summarizeComplaint(container));
    }

    const complaintInput = container.querySelector('#reg-complaint');
    if (complaintInput) {
      complaintInput.addEventListener('input', () => {
        this.clearDeskScreeningReview(container);
        const departmentSelect = container.querySelector('#reg-department');
        const departmentStatus = container.querySelector('#reg-department-status');
        if (departmentSelect) {
          const suggestedDepartment = SmartOPD.Departments.suggestFromComplaint(complaintInput.value);
          departmentSelect.dataset.manualChoice = 'false';
          departmentSelect.dataset.aiDepartment = '';
          departmentSelect.value = suggestedDepartment;
          if (departmentStatus) {
            departmentStatus.textContent = suggestedDepartment
              ? `${SmartOPD.Language.t('reg.departmentAuto')}: ${SmartOPD.Departments.label(suggestedDepartment, key => SmartOPD.Language.t(key))}`
              : SmartOPD.Language.t('reg.departmentHelp');
          }
        }
        const summaryBox = container.querySelector('#ai-intake-summary');
        if (summaryBox && summaryBox.dataset.sourceComplaint !== complaintInput.value.trim()) {
          this.clearAiSummary(container);
        }
      });
    }
    const departmentSelect = container.querySelector('#reg-department');
    if (departmentSelect) {
      departmentSelect.addEventListener('change', () => {
        departmentSelect.dataset.manualChoice = 'true';
        const departmentStatus = container.querySelector('#reg-department-status');
        if (departmentStatus) departmentStatus.textContent = SmartOPD.Language.t('reg.departmentManual');
      });
    }

    // Symptom chips toggles
    container.querySelectorAll('.symptom-chip input[type="checkbox"]').forEach(chk => {
      chk.addEventListener('change', (e) => {
        this.clearDeskScreeningReview(container);
        const chip = e.target.closest('.symptom-chip');
        if (e.target.checked) chip.classList.add('selected');
        else chip.classList.remove('selected');
        this.updateLiveTriagePreview(container);
      });
    });

    // Inputs change listener for live triage preview
    container.querySelectorAll('input, select, textarea').forEach(input => {
      input.addEventListener('input', () => {
        this.updateLiveTriagePreview(container);
      });
      input.addEventListener('change', () => {
        this.updateLiveTriagePreview(container);
      });
    });
    container.querySelectorAll('.desk-screening-answer').forEach(input => {
      input.addEventListener('change', () => {
        this.clearDeskScreeningReview(container);
        this.updateDeskScreeningAlert(container);
      });
    });
    const screeningReviewButton = container.querySelector('#desk-screening-ai-review');
    if (screeningReviewButton) {
      screeningReviewButton.addEventListener('click', () => this.reviewDeskScreening(container));
    }

    // Form submit listener
    const form = container.querySelector('#patient-registration-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitRegistration(container);
      });
    }
  },

  toggleComplaintDictation(container) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const button = container.querySelector('#reg-complaint-mic');
    const status = container.querySelector('#reg-complaint-mic-status');
    const label = container.querySelector('#reg-complaint-mic-label');

    if (!SpeechRecognition) {
      status.textContent = SmartOPD.Language.t('reg.micUnsupported');
      return;
    }

    if (this.recognition) {
      this.recognition.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    const language = SmartOPD.Language.getLanguage();
    recognition.lang = { en: 'en-IN', hi: 'hi-IN', gu: 'gu-IN' }[language] || 'en-IN';
    recognition.continuous = true;
    recognition.interimResults = true;
    this.recognition = recognition;
    button.setAttribute('aria-pressed', 'true');
    label.textContent = SmartOPD.Language.t('reg.micStop');
    status.textContent = SmartOPD.Language.t('reg.micListening');

    recognition.onresult = event => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let index = 0; index < event.results.length; index += 1) {
        const transcript = event.results[index][0].transcript;
        if (event.results[index].isFinal) finalTranscript += `${transcript} `;
        else interimTranscript += transcript;
      }
      recognition.finalTranscript = finalTranscript.trim();
      status.textContent = interimTranscript
        ? `${SmartOPD.Language.t('reg.micListening')} ${interimTranscript}`
        : SmartOPD.Language.t('reg.micListening');
      clearTimeout(this.dictationTimer);
      this.dictationTimer = setTimeout(() => {
        if (this.recognition === recognition) recognition.stop();
      }, 1400);
    };

    recognition.onerror = event => {
      const errorKey = event.error === 'not-allowed' || event.error === 'service-not-allowed'
        ? 'reg.micPermissionDenied'
        : event.error === 'no-speech'
          ? 'reg.micNoSpeech'
          : 'reg.micError';
      status.textContent = SmartOPD.Language.t(errorKey);
    };

    recognition.onend = () => {
      clearTimeout(this.dictationTimer);
      this.dictationTimer = null;
      const transcript = recognition.finalTranscript || '';
      if (transcript) {
        const complaintInput = container.querySelector('#reg-complaint');
        const existingText = complaintInput.value.trim();
        complaintInput.value = [existingText, transcript].filter(Boolean).join(' ');
        complaintInput.dispatchEvent(new Event('input', { bubbles: true }));
        status.textContent = SmartOPD.Language.t('reg.micDone');
      }
      if (this.recognition === recognition) this.recognition = null;
      button.setAttribute('aria-pressed', 'false');
      label.textContent = SmartOPD.Language.t('reg.micStart');
    };

    try {
      recognition.start();
    } catch (error) {
      this.recognition = null;
      button.setAttribute('aria-pressed', 'false');
      label.textContent = SmartOPD.Language.t('reg.micStart');
      status.textContent = SmartOPD.Language.t('reg.micError');
      console.error('Could not start complaint dictation:', error.message);
    }
  },

  async summarizeComplaint(container) {
    const complaintInput = container.querySelector('#reg-complaint');
    const button = container.querySelector('#ai-summarize-complaint');
    const status = container.querySelector('#ai-summary-status');
    const complaint = complaintInput?.value.trim() || '';

    if (complaint.length < 3) {
      status.textContent = 'Enter a chief complaint of at least 3 characters first.';
      complaintInput?.focus();
      return;
    }

    button.disabled = true;
    status.textContent = 'Creating a summary with Gemini…';
    this.clearAiSummary(container, false);

    try {
      const response = await fetch('/api/intake/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chiefComplaint: complaint })
      });
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(response.status === 405
          ? 'The running server is outdated. Stop it with Ctrl+C, then restart it from the project folder using npm start.'
          : `The server returned an unexpected response (HTTP ${response.status}). Restart it and try again.`);
      }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gemini could not create a summary.');

      const summaryBox = container.querySelector('#ai-intake-summary');
      const reviewPanel = container.querySelector('#ai-summary-review');
      if (complaintInput.value.trim() !== complaint) {
        status.textContent = 'The complaint changed while the summary was being created. Please summarize it again.';
        return;
      }
      if (!['IMMEDIATE', 'SOON', 'ROUTINE'].includes(result.triagePriority) ||
        typeof result.triageReason !== 'string' || !result.triageReason.trim() ||
        !SmartOPD.Departments.ids.includes(result.department)) {
        throw new Error('Gemini did not return a valid triage priority. Please try again.');
      }
      summaryBox.value = result.summary;
      summaryBox.dataset.sourceComplaint = complaint;
      summaryBox.dataset.triagePriority = result.triagePriority;
      summaryBox.dataset.triageReason = result.triageReason;
      summaryBox.dataset.department = result.department;
      reviewPanel.hidden = false;
      const departmentSelect = container.querySelector('#reg-department');
      const departmentStatus = container.querySelector('#reg-department-status');
      if (departmentSelect && departmentSelect.dataset.manualChoice !== 'true') {
        departmentSelect.value = result.department;
        departmentSelect.dataset.aiDepartment = result.department;
        if (departmentStatus) {
          departmentStatus.textContent = `${SmartOPD.Language.t('reg.departmentGemini')}: ${SmartOPD.Departments.label(result.department, key => SmartOPD.Language.t(key))}`;
        }
      }
      this.updateLiveTriagePreview(container);
      const priorityText = SmartOPD.Language.t(`priority.${result.triagePriority}`);
      container.querySelector('#ai-triage-result').textContent =
        `AI priority: ${priorityText}. ${result.triageReason}`;
      const uncertaintyText = result.uncertainties.length
        ? ` Details not provided: ${result.uncertainties.join('; ')}.`
        : '';
      status.textContent = `Summary ready. Review it before registering.${uncertaintyText}`;
    } catch (error) {
      status.textContent = error.message;
      SmartOPD.Notifications.danger(error.message);
    } finally {
      button.disabled = false;
      this.updateDeskScreeningAlert(container);
    }
  },

  clearAiSummary(container, clearStatus = true) {
    const summaryBox = container.querySelector('#ai-intake-summary');
    const reviewPanel = container.querySelector('#ai-summary-review');
    const reviewCheck = container.querySelector('#ai-summary-reviewed');
    if (summaryBox) {
      summaryBox.value = '';
      delete summaryBox.dataset.sourceComplaint;
      delete summaryBox.dataset.triagePriority;
      delete summaryBox.dataset.triageReason;
      delete summaryBox.dataset.department;
    }
    if (reviewCheck) reviewCheck.checked = false;
    if (reviewPanel) reviewPanel.hidden = true;
    if (clearStatus) {
      const status = container.querySelector('#ai-summary-status');
      if (status) status.textContent = '';
      const triageStatus = container.querySelector('#ai-triage-result');
      if (triageStatus) triageStatus.textContent = '';
    }
    this.updateLiveTriagePreview(container);
  },

  /**
   * Extract form data object
   */
  getFormData(container) {
    const symptoms = [];
    container.querySelectorAll('.symptom-chip input[type="checkbox"]:checked').forEach(chk => {
      symptoms.push(chk.value);
    });

    const getVital = (fieldId, toggleId) => {
      const toggle = container.querySelector('#' + toggleId);
      if (toggle && toggle.checked) return null; // Not measured
      const val = container.querySelector('#' + fieldId)?.value;
      return val !== undefined && val !== '' ? parseFloat(val) : null;
    };

    return {
      fullName: container.querySelector('#reg-fullname')?.value || '',
      age: parseInt(container.querySelector('#reg-age')?.value, 10) || '',
      gender: container.querySelector('#reg-gender')?.value || '',
      phone: container.querySelector('#reg-phone')?.value || '',
      chiefComplaint: container.querySelector('#reg-complaint')?.value || '',
      department: container.querySelector('#reg-department')?.value || '',
      symptoms: symptoms,
      duration: container.querySelector('#reg-duration')?.value || '1_day',
      severity: parseInt(container.querySelector('#reg-severity')?.value || 5, 10),
      existingConditions: container.querySelector('#reg-conditions')?.value || '',
      currentMedications: container.querySelector('#reg-medications')?.value || '',
      vitals: {
        bpSystolic: getVital('vital-bp-sys', 'vital-bp-unavail'),
        bpDiastolic: getVital('vital-bp-dia', 'vital-bp-unavail'),
        pulse: getVital('vital-pulse', 'vital-pulse-unavail'),
        spo2: getVital('vital-spo2', 'vital-spo2-unavail'),
        temp: getVital('vital-temp', 'vital-temp-unavail'),
        respRate: getVital('vital-resp', 'vital-resp-unavail')
      },
      deskScreening: {
        breathing: container.querySelector('#desk-screening-breathing')?.value || '',
        chestPain: container.querySelector('#desk-screening-chestPain')?.value || '',
        faintingConfusion: container.querySelector('#desk-screening-faintingConfusion')?.value || '',
        bleedingAllergy: container.querySelector('#desk-screening-bleedingAllergy')?.value || ''
      }
    };
  },

  updateDeskScreeningAlert(container) {
    const alert = container.querySelector('#desk-screening-alert');
    const reviewButton = container.querySelector('#desk-screening-ai-review');
    if (!alert || !reviewButton) return;
    const answers = Array.from(container.querySelectorAll('.desk-screening-answer'), input => input.value);
    const allAnswered = answers.length === 4 && answers.every(Boolean);
    const allYes = allAnswered && answers.every(answer => answer === 'yes');
    alert.hidden = !answers.some(answer => answer === 'yes' || answer === 'unsure');
    alert.textContent = allYes
      ? SmartOPD.Language.t('reg.deskScreeningAllYesAlert')
      : SmartOPD.Language.t('reg.deskScreeningAlert');
    reviewButton.disabled = !allAnswered;
  },

  clearDeskScreeningReview(container) {
    delete container.dataset.deskScreeningAiReview;
    const result = container.querySelector('#desk-screening-ai-result');
    const status = container.querySelector('#desk-screening-ai-status');
    if (result) {
      result.textContent = '';
      result.hidden = true;
    }
    if (status) status.textContent = '';
  },

  async reviewDeskScreening(container) {
    const complaintInput = container.querySelector('#reg-complaint');
    const button = container.querySelector('#desk-screening-ai-review');
    const status = container.querySelector('#desk-screening-ai-status');
    const resultBox = container.querySelector('#desk-screening-ai-result');
    const formData = this.getFormData(container);
    const answers = formData.deskScreening;
    const answerValues = Object.values(answers);
    const complaint = formData.chiefComplaint.trim();
    if (complaint.length < 3 || answerValues.some(answer => !['yes', 'no', 'unsure'].includes(answer))) {
      status.textContent = SmartOPD.Language.t('reg.deskScreeningAiNeedAnswers');
      return;
    }

    button.disabled = true;
    status.textContent = SmartOPD.Language.t('reg.deskScreeningAiLoading');
    this.clearDeskScreeningReview(container);
    button.disabled = true;
    try {
      const response = await fetch('/api/intake/screening-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chiefComplaint: complaint,
          symptoms: formData.symptoms,
          answers
        })
      });
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(response.status === 405
          ? 'The running server is outdated. Stop it with Ctrl+C, then restart it from the project folder using npm start.'
          : `The server returned an unexpected response (HTTP ${response.status}). Restart it and try again.`);
      }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gemini could not review the screening answers.');
      const currentData = this.getFormData(container);
      if (complaintInput.value.trim() !== complaint ||
        JSON.stringify(currentData.deskScreening) !== JSON.stringify(answers)) {
        status.textContent = SmartOPD.Language.t('reg.deskScreeningAiChanged');
        return;
      }
      if (!['needs_clarification', 'no_clear_contradiction', 'insufficient_information'].includes(result.assessment) ||
        typeof result.note !== 'string' || typeof result.clarificationQuestion !== 'string') {
        throw new Error('Gemini returned an invalid screening review. Please ask the nurse to review the answers.');
      }
      const allYes = answerValues.every(answer => answer === 'yes');
      const assessmentText = SmartOPD.Language.t(`reg.deskScreeningAssessment.${result.assessment}`);
      resultBox.textContent = [
        `${assessmentText}: ${result.note}`,
        result.clarificationQuestion ? `${SmartOPD.Language.t('reg.deskScreeningAiQuestion')} ${result.clarificationQuestion}` : '',
        allYes ? SmartOPD.Language.t('reg.deskScreeningAiAllYesReminder') : '',
        SmartOPD.Language.t('reg.deskScreeningAiNoPriorityChange')
      ].filter(Boolean).join(' ');
      resultBox.hidden = false;
      container.dataset.deskScreeningAiReview = JSON.stringify({
        ...result,
        sourceComplaint: complaint,
        sourceAnswers: answers,
        sourceSymptoms: formData.symptoms
      });
      status.textContent = SmartOPD.Language.t('reg.deskScreeningAiReady');
    } catch (error) {
      status.textContent = error.message;
      SmartOPD.Notifications.danger(error.message);
    } finally {
      button.disabled = false;
    }
  },

  /**
   * Update live preview of triage recommendation as user fills form
   */
  updateLiveTriagePreview(container) {
    const previewBox = container.querySelector('#triage-live-preview');
    if (!previewBox) return;

    const formData = this.getFormData(container);
    const triageResult = SmartOPD.TriageEngine.assess(formData);
    const t = SmartOPD.Language.t.bind(SmartOPD.Language);
    const summaryBox = container.querySelector('#ai-intake-summary');
    const aiPriority = summaryBox?.dataset.sourceComplaint === formData.chiefComplaint.trim()
      ? summaryBox.dataset.triagePriority
      : '';
    const recommendedPriority = this.getHigherPriority(triageResult.recommendedPriority, aiPriority);
    const screeningPanel = container.querySelector('#desk-screening-panel');
    if (screeningPanel) screeningPanel.hidden = recommendedPriority !== 'IMMEDIATE';
    this.updateDeskScreeningAlert(container);

    const badgeClass = SmartOPD.Utils.getPriorityClass(recommendedPriority);
    const priorityText = t(`priority.${recommendedPriority}`);
    const reasonText = t(triageResult.reasonKey);

    let redFlagHtml = '';
    if (triageResult.redFlags.length > 0) {
      redFlagHtml = `
        <div class="red-flag-alert" style="margin-top: 12px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <div>
            <strong>URGENT CLINICAL WARNING:</strong>
            <ul style="margin-top: 4px; padding-left: 18px; font-size: 12px;">
              ${triageResult.redFlags.map(rf => `<li>${SmartOPD.Utils.escapeHTML(rf)}</li>`).join('')}
            </ul>
          </div>
        </div>
      `;
    }

    let missingHtml = '';
    if (triageResult.hasMissingVitals) {
      missingHtml = `
        <div class="missing-vitals-warning">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>${t('reg.missingVitalsNotice')} (${triageResult.missingVitals.join(', ')})</span>
        </div>
      `;
    }

    previewBox.innerHTML = `
      <div class="triage-preview-header">
        <span style="font-weight: 700; color: var(--text-main);">${t('reg.livePreview')}</span>
        <span class="badge-priority ${badgeClass}">${priorityText}</span>
      </div>
      ${aiPriority ? `<p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">${t('reg.aiPriorityLabel')}: ${t(`priority.${aiPriority}`)}. ${SmartOPD.Utils.escapeHTML(summaryBox.dataset.triageReason)}</p>` : ''}
      <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">${SmartOPD.Utils.escapeHTML(reasonText)}</p>
      ${redFlagHtml}
      ${missingHtml}
    `;
  },

  /**
   * Submit registration, create patient, update queue, log audit
   */
  submitRegistration(container) {
    const formData = this.getFormData(container);
    const validation = SmartOPD.Validation.validatePatientForm(formData);

    if (!validation.isValid) {
      const firstErr = Object.values(validation.errors)[0];
      SmartOPD.Notifications.danger(firstErr);
      return;
    }

    const summaryBox = container.querySelector('#ai-intake-summary');
    const aiSummary = summaryBox?.value.trim() || '';
    const complaint = formData.chiefComplaint.trim();
    if (aiSummary && (summaryBox.dataset.sourceComplaint !== complaint ||
      !container.querySelector('#ai-summary-reviewed')?.checked)) {
      SmartOPD.Notifications.danger('Review the AI summary and confirm it, or clear it before registering.');
      return;
    }

    // Run clinical triage assessment
    const triage = SmartOPD.TriageEngine.assess(formData);
    const aiTriageValid = summaryBox?.dataset.sourceComplaint === complaint &&
      ['IMMEDIATE', 'SOON', 'ROUTINE'].includes(summaryBox.dataset.triagePriority);
    const aiTriagePriority = aiTriageValid ? summaryBox.dataset.triagePriority : null;
    const aiTriageReason = aiTriageValid ? summaryBox.dataset.triageReason : '';
    const recommendedPriority = this.getHigherPriority(triage.recommendedPriority, aiTriagePriority);
    let deskScreeningAiReview = null;
    try {
      const savedReview = JSON.parse(container.dataset.deskScreeningAiReview || 'null');
      if (savedReview &&
        savedReview.sourceComplaint === complaint &&
        JSON.stringify(savedReview.sourceAnswers) === JSON.stringify(formData.deskScreening) &&
        JSON.stringify(savedReview.sourceSymptoms) === JSON.stringify(formData.symptoms)) {
        deskScreeningAiReview = {
          assessment: savedReview.assessment,
          note: savedReview.note,
          clarificationQuestion: savedReview.clarificationQuestion
        };
      }
    } catch (error) {
      console.error('Could not read the current desk screening review:', error.message);
    }

    const nowIso = new Date().toISOString();
    const counter = SmartOPD.Storage.incrementCounter(new Date(nowIso));
    const tokenNumber = SmartOPD.Utils.formatTokenNumber(counter);

    const patient = {
      id: SmartOPD.Utils.generateId(),
      tokenNumber: tokenNumber,
      parchiRef: SmartOPD.Utils.formatParchiRef(counter),
      sequenceNumber: counter,
      fullName: formData.fullName.trim(),
      age: formData.age,
      gender: formData.gender,
      phone: formData.phone.trim(),
      chiefComplaint: formData.chiefComplaint.trim(),
      aiSummary: aiSummary || '',
      aiSummaryCreatedAt: aiSummary ? new Date().toISOString() : null,
      aiSummaryReviewed: Boolean(aiSummary),
      symptoms: formData.symptoms,
      duration: formData.duration,
      severity: formData.severity,
      existingConditions: formData.existingConditions,
      currentMedications: formData.currentMedications,
      vitals: formData.vitals,
      deskScreening: recommendedPriority === 'IMMEDIATE'
        ? {
          ...formData.deskScreening,
          aiReview: deskScreeningAiReview,
          status: 'pending_review',
          recordedAt: nowIso
        }
        : null,
      aiTriagePriority: aiTriagePriority,
      aiTriageReason: aiTriageReason,
      department: formData.department || 'general_medicine',
      departmentSource: container.querySelector('#reg-department')?.dataset.manualChoice === 'true'
        ? 'manual'
        : summaryBox?.dataset.department === formData.department
          ? 'gemini'
          : 'automatic',
      ruleBasedPriority: triage.recommendedPriority,
      recommendedPriority: recommendedPriority,
      effectivePriority: recommendedPriority, // initially matches combined recommendation
      triageReasonKey: triage.reasonKey,
      triageRuleId: triage.ruleId,
      redFlags: triage.redFlags,
      hasMissingVitals: triage.hasMissingVitals,
      status: 'waiting', // waiting, called, in_consultation, completed, cancelled
      registeredAt: nowIso,
      updatedAt: nowIso,
      queuePosition: null // calculated by state engine
    };

    // Add patient to state (triggers queue position calculation & saving)
    SmartOPD.State.addPatient(patient);

    // Retrieve recalculated position
    const savedPatient = SmartOPD.State.getPatientById(patient.id);

    // Log Audit Event
    SmartOPD.AuditTrail.logEvent({
      tokenNumber: patient.tokenNumber,
      eventType: 'PATIENT_REGISTERED',
      previousValue: '-',
      newValue: `Priority: ${patient.effectivePriority}`,
      reason: aiTriagePriority
        ? `AI complaint triage: ${aiTriagePriority}; rule-based triage: ${triage.recommendedPriority} (${triage.ruleId})`
        : `Rule-based triage: ${triage.ruleId}`,
      actor: 'Registration Desk'
    });

    SmartOPD.Notifications.success(`Patient Registered Successfully! Assigned Token: ${patient.tokenNumber}`);

    // Show Registration Confirmation Modal
    this.showSuccessModal(savedPatient);
  },

  showSuccessModal(patient) {
    const t = SmartOPD.Language.t.bind(SmartOPD.Language);
    const priorityText = t(`priority.${patient.effectivePriority}`);
    const badgeClass = SmartOPD.Utils.getPriorityClass(patient.effectivePriority);
    const parchiRefStr = patient.parchiRef || SmartOPD.Utils.formatParchiRef(patient.sequenceNumber || 1);

    const modalHtml = `
      <div class="modal-backdrop active" id="registration-success-modal">
        <div class="modal-box text-center" style="max-width: 480px;">
          <div class="modal-header">
            <h3 class="modal-title">Patient Registered</h3>
            <span class="modal-close" onclick="document.getElementById('registration-success-modal').remove()">&times;</span>
          </div>
          <div class="modal-body flex-col items-center gap-4">
            <div style="width: 64px; height: 64px; border-radius: 50%; background-color: var(--priority-routine-bg); color: var(--priority-routine); display: flex; align-items: center; justify-content: center; margin: 0 auto;">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            
            <div>
              <span style="font-size: 13px; color: var(--text-muted); display: block;">ORIGINAL REGISTRATION TOKEN</span>
              <span style="font-family: monospace; font-size: 42px; font-weight: 900; color: var(--primary-700);">${patient.tokenNumber}</span>
              <span style="font-size: 12px; color: var(--text-muted); display: block; margin-top: 2px;">Parchi Ref: <strong>${parchiRefStr}</strong></span>
            </div>

            <div style="background-color: var(--bg-muted); padding: 14px; border-radius: var(--radius-md); width: 100%;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-weight: 600;">Current Queue Position:</span>
                <span class="queue-position-pill">Position #${patient.queuePosition}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 600;">Assessed Priority:</span>
                <span class="badge-priority ${badgeClass}">${priorityText}</span>
              </div>
            </div>

            <p style="font-size: 11.5px; color: var(--text-muted); font-style: italic;">
              "Your registration token remains unchanged. Queue position may change according to clinical priority."
            </p>
          </div>
          <div class="modal-footer justify-between" style="gap: 8px; flex-wrap: wrap;">
            <button class="btn btn-warning btn-sm" onclick="document.getElementById('registration-success-modal').remove(); SmartOPD.App.printParchi('${patient.id}')">${t('reg.printPatientToken')}</button>
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('registration-success-modal').remove(); window.location.hash = '#/dashboard';">Dashboard</button>
            <button class="btn btn-primary btn-sm" onclick="document.getElementById('registration-success-modal').remove(); window.location.hash = '#/patient-token?patientId=${encodeURIComponent(patient.id)}';">View Token</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }
};
