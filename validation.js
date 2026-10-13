/**
 * SMART OPD - FORM VALIDATION UTILITIES
 */
window.SmartOPD = window.SmartOPD || {};

SmartOPD.Validation = {
  validatePatientForm(formData) {
    const errors = {};

    if (!formData.fullName || formData.fullName.trim().length < 2) {
      errors.fullName = "Please enter patient's full name (at least 2 characters).";
    }

    if (!formData.age || isNaN(formData.age) || formData.age < 0 || formData.age > 125) {
      errors.age = "Please enter a valid age between 0 and 125.";
    }

    if (!formData.gender) {
      errors.gender = "Please select gender.";
    }

    if (!formData.chiefComplaint || formData.chiefComplaint.trim().length < 3) {
      errors.chiefComplaint = "Please specify chief complaint.";
    }

    // Vitals range checking (if measured)
    if (formData.vitals) {
      const v = formData.vitals;
      
      if (v.bpSystolic && (v.bpSystolic < 40 || v.bpSystolic > 260)) {
        errors.bpSystolic = "Systolic BP must be between 40 and 260 mmHg.";
      }

      if (v.bpDiastolic && (v.bpDiastolic < 30 || v.bpDiastolic > 160)) {
        errors.bpDiastolic = "Diastolic BP must be between 30 and 160 mmHg.";
      }

      if (v.pulse && (v.pulse < 30 || v.pulse > 230)) {
        errors.pulse = "Pulse rate must be between 30 and 230 BPM.";
      }

      if (v.spo2 && (v.spo2 < 50 || v.spo2 > 100)) {
        errors.spo2 = "SpO₂ must be between 50% and 100%.";
      }

      if (v.temp && (v.temp < 85 || v.temp > 110)) {
        errors.temp = "Temperature must be between 85°F and 110°F.";
      }

      if (v.respRate && (v.respRate < 5 || v.respRate > 60)) {
        errors.respRate = "Respiratory rate must be between 5 and 60 /min.";
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors: errors
    };
  }
};
