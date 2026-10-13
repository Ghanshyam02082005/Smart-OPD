/**
 * SMART OPD - CLINICAL TRIAGE ENGINE
 * Evaluates symptoms, vitals, and red-flags to calculate recommended priority level.
 */
window.SmartOPD = window.SmartOPD || {};

SmartOPD.TriageEngine = {
  /**
   * Main assessment entry point
   * @param {Object} data - Patient symptom & vital sign data
   * @returns {Object} Triage result with priority, reason, redFlags, missingVitals, ruleId
   */
  assess(data) {
    const symptoms = data.symptoms || [];
    const vitals = data.vitals || {};
    const severity = parseInt(data.severity || 1, 10);
    
    let priority = 'ROUTINE';
    let reasonKey = 'triage.routine_note';
    let ruleId = 'RULE-ROUTINE-DEFAULT';
    const redFlags = [];

    // Check missing vitals
    const missingVitals = [];
    if (vitals.bpSystolic === undefined || vitals.bpSystolic === null || vitals.bpSystolic === '') missingVitals.push('Blood Pressure');
    if (vitals.pulse === undefined || vitals.pulse === null || vitals.pulse === '') missingVitals.push('Pulse Rate');
    if (vitals.spo2 === undefined || vitals.spo2 === null || vitals.spo2 === '') missingVitals.push('SpO₂ Saturation');
    if (vitals.temp === undefined || vitals.temp === null || vitals.temp === '') missingVitals.push('Temperature');

    const hasMissingVitals = missingVitals.length > 0;

    // 1. RED-FLAG CRITICAL SYMPTOMS (Triggers IMMEDIATE priority & Red-flag warning)
    const criticalSymptoms = [
      'chest_pain',
      'breathing_diff',
      'loss_consciousness',
      'stroke_symptoms',
      'bleeding',
      'allergic_reaction'
    ];

    const presentCritical = symptoms.filter(s => criticalSymptoms.includes(s));

    if (presentCritical.length > 0) {
      priority = 'IMMEDIATE';
      ruleId = 'RULE-RED-FLAG-SYMPTOM';
      
      if (symptoms.includes('chest_pain')) {
        reasonKey = 'triage.chest_pain';
        redFlags.push('Chest tightness or chest pain reported');
      } else {
        reasonKey = 'triage.red_flag';
        redFlags.push('Life-threatening critical symptoms reported');
      }

      if (symptoms.includes('breathing_diff')) redFlags.push('Severe breathing difficulty');
      if (symptoms.includes('loss_consciousness')) redFlags.push('Loss of consciousness or fainting');
      if (symptoms.includes('stroke_symptoms')) redFlags.push('Acute stroke-like neurological symptoms');
      if (symptoms.includes('bleeding')) redFlags.push('Active bleeding');
      if (symptoms.includes('allergic_reaction')) redFlags.push('Severe allergic reaction');
    }

    // 2. CRITICAL VITALS ASSESSMENT
    if (vitals.spo2 && parseFloat(vitals.spo2) < 92) {
      priority = 'IMMEDIATE';
      ruleId = 'RULE-VITAL-CRITICAL-SPO2';
      reasonKey = 'triage.red_flag';
      redFlags.push(`Critical SpO₂ Level: ${vitals.spo2}% (Normal > 95%)`);
    }

    if (vitals.bpSystolic && (parseFloat(vitals.bpSystolic) >= 180 || parseFloat(vitals.bpSystolic) <= 85)) {
      priority = 'IMMEDIATE';
      ruleId = 'RULE-VITAL-CRITICAL-BP';
      reasonKey = 'triage.red_flag';
      redFlags.push(`Extreme Blood Pressure (Systolic: ${vitals.bpSystolic} mmHg)`);
    }

    if (vitals.pulse && (parseFloat(vitals.pulse) >= 130 || parseFloat(vitals.pulse) <= 45)) {
      priority = 'IMMEDIATE';
      ruleId = 'RULE-VITAL-CRITICAL-PULSE';
      reasonKey = 'triage.red_flag';
      redFlags.push(`Abnormal Pulse Rate: ${vitals.pulse} BPM`);
    }

    // 3. MODERATE SYMPTOMS (SOON priority) IF NOT ALREADY IMMEDIATE
    if (priority !== 'IMMEDIATE') {
      const moderateSymptoms = ['fever', 'dizziness', 'weakness', 'headache', 'abdominal_pain', 'vomiting'];
      const presentModerate = symptoms.filter(s => moderateSymptoms.includes(s));

      if (presentModerate.length > 0 || severity >= 7) {
        priority = 'SOON';
        ruleId = 'RULE-MODERATE-SYMPTOM';
        reasonKey = 'triage.soon_note';
      }

      if (vitals.temp && parseFloat(vitals.temp) >= 102.5) {
        priority = 'SOON';
        ruleId = 'RULE-VITAL-HIGH-TEMP';
        reasonKey = 'triage.soon_note';
      }
    }

    // Calculate Data Completeness Percentage
    const totalFields = 9; // symptoms, severity, duration + 6 vitals
    let filledFields = 3; // basic symptoms, severity, duration always provided
    if (!hasMissingVitals) filledFields += 6;
    else filledFields += (6 - missingVitals.length);
    const dataCompleteness = Math.round((filledFields / totalFields) * 100);

    return {
      recommendedPriority: priority,
      reasonKey: reasonKey,
      redFlags: redFlags,
      hasMissingVitals: hasMissingVitals,
      missingVitals: missingVitals,
      dataCompleteness: dataCompleteness,
      ruleId: ruleId
    };
  }
};
