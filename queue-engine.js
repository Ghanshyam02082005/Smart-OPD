/**
 * SMART OPD - AUTOMATIC QUEUE REORDERING ENGINE
 * Core Rule: Original Token Number Stays. Priority & Queue Position Change.
 */
window.SmartOPD = window.SmartOPD || {};

SmartOPD.QueueEngine = {
  /**
   * Priority Weighting Map
   */
  PRIORITY_WEIGHTS: {
    'IMMEDIATE': 1,
    'SOON': 2,
    'ROUTINE': 3
  },

  /**
   * Reorder patient queue according to clinical priority and FIFO
   * @param {Array} patients - Full list of patients
   * @returns {Array} Patients array with updated queuePosition fields
   */
  processQueue(patients) {
    if (!Array.isArray(patients)) return [];

    // Separate patients into waiting/called and non-waiting
    const waitingList = patients.filter(p => p.status === 'waiting' || p.status === 'called');
    const otherList = patients.filter(p => p.status !== 'waiting' && p.status !== 'called');

    // Sort waiting list by priority weight (1=IMMEDIATE, 2=SOON, 3=ROUTINE), then by sequenceNumber/registeredAt (FIFO)
    waitingList.sort((a, b) => {
      const weightA = this.PRIORITY_WEIGHTS[a.effectivePriority] || 99;
      const weightB = this.PRIORITY_WEIGHTS[b.effectivePriority] || 99;

      if (weightA !== weightB) {
        return weightA - weightB; // Lower number = Higher priority
      }

      // FIFO tie-breaker (earlier registration timestamp or smaller sequence number)
      const seqA = a.sequenceNumber || new Date(a.registeredAt).getTime();
      const seqB = b.sequenceNumber || new Date(b.registeredAt).getTime();
      return seqA - seqB;
    });

    // Assign dynamic 1-based queuePosition to waiting patients
    waitingList.forEach((patient, idx) => {
      patient.queuePosition = idx + 1;
    });

    // Clear queuePosition for non-waiting patients
    otherList.forEach(patient => {
      patient.queuePosition = null;
    });

    // Recombine array preserving updated properties
    return [...waitingList, ...otherList];
  },

  /**
   * Get formatted explanation of why patient is at their current position
   */
  getQueueExplanation(patient) {
    if (!patient || !patient.queuePosition) return '';
    const t = SmartOPD.Language.t.bind(SmartOPD.Language);
    const priorityText = t(`priority.${patient.effectivePriority}`);
    
    return `Queue Position #${patient.queuePosition} (${priorityText}). Original Token ${patient.tokenNumber} unchanged.`;
  }
};
