/**
 * SMART OPD - LIVE PUBLIC TOKEN DISPLAY (TV ROOM VIEW)
 * Displays Token Numbers Only for Patient Privacy.
 */
window.SmartOPD = window.SmartOPD || {};

SmartOPD.TokenDisplay = {
  lastAnnouncementKey: null,
  announcementSequence: 0,
  audioContext: null,
  audioUnlockBound: false,
  audioUnlockHandler: null,
  pendingAnnouncement: null,
  announcementInProgress: false,

  render(container) {
    if (!container) return;

    const patients = SmartOPD.State.getPatients();
    const t = SmartOPD.Language.t.bind(SmartOPD.Language);
    const hospital = SmartOPD.Storage.getSettings();
    const hospitalLogo = /^data:image\/(?:png|jpeg|webp);base64,/.test(hospital.logoDataUrl)
      ? hospital.logoDataUrl
      : 'assets/images/smart-opd-logo.svg';
    this.bindAudioUnlock();

    // Current serving token (either currently in consultation or called)
    const servingPatient = patients.find(p => p.status === 'in_consultation') || patients.find(p => p.status === 'called');

    // Next tokens in waiting queue (up to 4)
    const waitingTokens = patients.filter(p => p.status === 'waiting').slice(0, 4);

    // Recently called/completed tokens
    const recentlyCalled = patients.filter(p => p.status === 'called' || p.status === 'in_consultation' || p.status === 'completed')
                                   .slice(0, 5);
    const nowServingTokenStr = servingPatient ? servingPatient.tokenNumber : t('tv.noServing');

    let html = `
      <button class="tv-fullscreen-button" type="button" aria-label="Toggle fullscreen display" title="Toggle fullscreen display" onclick="SmartOPD.TokenDisplay.toggleFullscreen()">
          <svg class="tv-expand-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
          <svg class="tv-collapse-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
        </button>
        <div class="tv-header">
          <div class="tv-title">
            <img class="hospital-brand-logo tv-brand-logo" src="${hospitalLogo}" alt="${SmartOPD.Utils.escapeHTML(hospital.hospitalName)}">
            ${t('tv.title')}
          </div>

          <div style="display: flex; align-items: center; gap: 20px;">
            <div id="tv-clock" style="font-family: monospace; font-size: 20px; font-weight: 700; color: var(--primary-200);">
              ${new Date().toLocaleTimeString()}
            </div>

            <!-- Language Switcher Pill for TV -->
            <div class="language-selector-wrapper tv-language-selector">
              <select class="lang-select tv-language-select" onchange="SmartOPD.Language.setLanguage(this.value)">
                <option value="en" ${SmartOPD.Language.getLanguage() === 'en' ? 'selected' : ''}>English</option>
                <option value="hi" ${SmartOPD.Language.getLanguage() === 'hi' ? 'selected' : ''}>हिन्दी</option>
                <option value="gu" ${SmartOPD.Language.getLanguage() === 'gu' ? 'selected' : ''}>ગુજરાતી</option>
              </select>
            </div>
          </div>
        </div>

        <div class="tv-main-grid">
          <!-- NOW SERVING HERO -->
          <div class="now-serving-hero">
            <div class="now-serving-label">${t('tv.nowServing')}</div>
            <div class="now-serving-token">${nowServingTokenStr}</div>
            ${servingPatient ? `
              <div class="tv-serving-instruction">
                ${servingPatient.status === 'in_consultation' ? 'Proceed to Consultation Room 1' : 'Please Report to OPD Desk'}
              </div>
            ` : ''}
          </div>

          <!-- NEXT IN LINE LIST -->
          <div class="next-tokens-box">
            <h3 class="tv-next-heading">
              ${t('tv.nextWaiting')}
            </h3>

            ${waitingTokens.length === 0 ? `
              <div class="tv-empty-notice">No waiting tokens in line.</div>
            ` : waitingTokens.map(p => `
              <div class="next-token-row priority-${p.effectivePriority.toLowerCase()}">
                <div class="next-token-number">${p.tokenNumber}</div>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span class="tv-line-position">Line Pos #${p.queuePosition}</span>
                  <span class="badge-priority ${SmartOPD.Utils.getPriorityClass(p.effectivePriority)}">${t(`priority.${p.effectivePriority}`)}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="tv-footer-notice">
          <strong>${t('tv.privacyNotice')}</strong> &mdash; ${t('tv.notice')}
        </div>
    `;

    const currentDisplay = container.querySelector('.tv-display-container');
    if (currentDisplay && document.fullscreenElement === currentDisplay) {
      currentDisplay.innerHTML = html;
    } else {
      container.innerHTML = `<div class="tv-display-container">${html}</div>`;
    }

    this.updateVoiceAnnouncement(servingPatient, waitingTokens[0] || null);

    // Start live timer clock for TV screen
    if (!this.clockInterval) {
      this.clockInterval = setInterval(() => {
        const clk = document.getElementById('tv-clock');
        if (clk) clk.textContent = new Date().toLocaleTimeString();
      }, 1000);
    }
  },

  updateVoiceAnnouncement(servingPatient, nextPatient) {
    const language = SmartOPD.Language.getLanguage();
    const key = `${language}:${servingPatient ? servingPatient.id : ''}:${nextPatient ? nextPatient.id : ''}`;
    if (key === this.lastAnnouncementKey) return;

    this.lastAnnouncementKey = key;
    if (servingPatient || nextPatient) {
      this.announceTokens(servingPatient, nextPatient, language);
    }
  },

  announceTokens(servingPatient, nextPatient, language) {
    const messages = [];

    if (servingPatient) {
      messages.push({
        key: 'tv.voiceNowServing',
        token: this.getSpokenTokenNumber(servingPatient.tokenNumber)
      });
    }
    if (nextPatient) {
      messages.push({
        key: 'tv.voiceNextToken',
        token: this.getSpokenTokenNumber(nextPatient.tokenNumber)
      });
    }
    if (!messages.length) return;

    const sequence = ++this.announcementSequence;
    this.pendingAnnouncement = { messages, language };
    window.speechSynthesis.cancel();
    this.speakAnnouncementSequence(messages, language, sequence);
  },

  async speakAnnouncementSequence(messages, language, sequence) {
    this.announcementInProgress = true;
    const voices = await this.getAvailableVoices();

    for (const message of messages) {
      if (sequence !== this.announcementSequence) return;
      await this.playTokenChime();
      if (sequence !== this.announcementSequence) return;

      const voiceLanguage = { en: 'en-IN', hi: 'hi-IN', gu: 'gu-IN' }[language];
      const voice = this.getFemaleVoice(language, voiceLanguage, voices);
      const hasNativeVoice = voice && voice.lang.toLowerCase().startsWith(language);
      const text = this.getAnnouncementText(message, language, hasNativeVoice);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = hasNativeVoice
        ? voiceLanguage
        : (voice ? voice.lang : (language === 'en' ? voiceLanguage : 'en-IN'));
      utterance.rate = 0.92;
      if (voice) utterance.voice = voice;

      let spoken = await this.speakUtterance(utterance);
      if (!spoken && language !== 'en' && !hasNativeVoice) {
        const fallbackUtterance = new SpeechSynthesisUtterance(
          this.getAnnouncementText(message, language, false)
        );
        fallbackUtterance.lang = voice ? voice.lang : 'en-IN';
        fallbackUtterance.rate = 0.92;
        if (voice) fallbackUtterance.voice = voice;
        spoken = await this.speakUtterance(fallbackUtterance);
      }

      if (!spoken) {
        if (sequence === this.announcementSequence) this.announcementInProgress = false;
        return;
      }
    }

    if (sequence === this.announcementSequence) {
      this.pendingAnnouncement = null;
      this.announcementInProgress = false;
      this.removeAudioUnlockListeners();
    }
  },

  speakUtterance(utterance) {
    return new Promise(resolve => {
      let settled = false;
      const finish = spoken => {
        if (settled) return;
        settled = true;
        resolve(spoken);
      };
      utterance.onerror = event => {
        console.error('Token voice announcement failed', event.error);
        finish(false);
      };
      utterance.onend = () => finish(true);
      try {
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('Unable to start token voice announcement', error);
        finish(false);
      }
    });
  },

  getAvailableVoices() {
    const synthesis = window.speechSynthesis;
    const currentVoices = synthesis.getVoices();
    if (currentVoices.length) return Promise.resolve(currentVoices);

    return new Promise(resolve => {
      let timeout;
      const finish = () => {
        clearTimeout(timeout);
        synthesis.removeEventListener('voiceschanged', onVoicesChanged);
        resolve(synthesis.getVoices());
      };
      const onVoicesChanged = () => finish();

      timeout = setTimeout(finish, 2000);
      synthesis.addEventListener('voiceschanged', onVoicesChanged);
    });
  },

  getFemaleVoice(language, voiceLanguage, voices) {
    const femaleName = /female|woman|zira|samantha|susan|karen|hazel|sara|sarah|heera|swara|veena|kalpana|lekha|meera|aditi|priya|janki/i;
    const languageVoices = voices.filter(voice => voice.lang.toLowerCase().startsWith(language));
    const femaleVoices = voices.filter(voice => femaleName.test(voice.name));

    return languageVoices.find(voice =>
      voice.lang.toLowerCase() === voiceLanguage.toLowerCase() && femaleName.test(voice.name)
    ) || languageVoices.find(voice => femaleName.test(voice.name))
      || femaleVoices.find(voice => voice.lang.toLowerCase().startsWith(language))
      || femaleVoices.find(voice => voice.lang.toLowerCase().endsWith('-in'))
      || femaleVoices[0]
      || voices.find(voice => voice.lang.toLowerCase() === voiceLanguage.toLowerCase())
      || languageVoices[0]
      || null;
  },

  getAnnouncementText(message, language, nativeVoiceAvailable) {
    if (language !== 'en' && !nativeVoiceAvailable) {
      const token = this.getLocalizedNumberWord(message.token, language, true);
      const phrases = {
        hi: {
          'tv.voiceNowServing': `Token number ${token}.`,
          'tv.voiceNextToken': `Agla token number ${token} hai.`
        },
        gu: {
          'tv.voiceNowServing': `Token number ${token}.`,
          'tv.voiceNextToken': `Aagal no token number ${token} chhe.`
        }
      };
      return phrases[language][message.key];
    }

    const token = language === 'en'
      ? message.token
      : this.getLocalizedNumberWord(message.token, language, false);
    return SmartOPD.Language.t(message.key, { token });
  },

  getLocalizedNumberWord(number, language, transliterate = false) {
    const numberWords = {
      hi: [
        'शून्य', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ',
        'दस', 'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस',
        'बीस', 'इक्कीस', 'बाईस', 'तेईस', 'चौबीस', 'पच्चीस', 'छब्बीस', 'सत्ताईस', 'अट्ठाईस', 'उनतीस',
        'तीस', 'इकतीस', 'बत्तीस', 'तैंतीस', 'चौंतीस', 'पैंतीस', 'छत्तीस', 'सैंतीस', 'अड़तीस', 'उनतालीस',
        'चालीस', 'इकतालीस', 'बयालीस', 'तैंतालीस', 'चवालीस', 'पैंतालीस', 'छियालीस', 'सैंतालीस', 'अड़तालीस', 'उनचास',
        'पचास', 'इक्यावन', 'बावन', 'तिरपन', 'चौवन', 'पचपन', 'छप्पन', 'सत्तावन', 'अट्ठावन', 'उनसठ',
        'साठ', 'इकसठ', 'बासठ', 'तिरसठ', 'चौंसठ', 'पैंसठ', 'छियासठ', 'सड़सठ', 'अड़सठ', 'उनहत्तर',
        'सत्तर', 'इकहत्तर', 'बहत्तर', 'तिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छिहत्तर', 'सतहत्तर', 'अठहत्तर', 'उन्नासी',
        'अस्सी', 'इक्यासी', 'बयासी', 'तिरासी', 'चौरासी', 'पचासी', 'छियासी', 'सतासी', 'अट्ठासी', 'नवासी',
        'नब्बे', 'इक्यानवे', 'बानवे', 'तिरानवे', 'चौरानवे', 'पंचानवे', 'छियानवे', 'सत्तानवे', 'अट्ठानवे', 'निन्यानवे'
      ],
      gu: [
        'શૂન્ય', 'એક', 'બે', 'ત્રણ', 'ચાર', 'પાંચ', 'છ', 'સાત', 'આઠ', 'નવ',
        'દસ', 'અગિયાર', 'બાર', 'તેર', 'ચૌદ', 'પંદર', 'સોળ', 'સત્તર', 'અઢાર', 'ઓગણીસ', 'વીસ',
        'એકવીસ', 'બાવીસ', 'ત્રેવીસ', 'ચોવીસ', 'પચ્ચીસ', 'છવ્વીસ', 'સત્તાવીસ', 'અઠ્ઠાવીસ', 'ઓગણત્રીસ',
        'ત્રીસ', 'એકત્રીસ', 'બત્રીસ', 'તેત્રીસ', 'ચોત્રીસ', 'પાંત્રીસ', 'છત્રીસ', 'સાડત્રીસ', 'અડત્રીસ', 'ઓગણચાલીસ',
        'ચાલીસ', 'એકતાલીસ', 'બેતાલીસ', 'ત્રેતાલીસ', 'ચુમ્માલીસ', 'પિસ્તાલીસ', 'છેતાલીસ', 'સુડતાલીસ', 'અડતાલીસ', 'ઓગણપચાસ',
        'પચાસ', 'એકાવન', 'બાવન', 'ત્રેપન', 'ચોપન', 'પંચાવન', 'છપ્પન', 'સત્તાવન', 'અઠ્ઠાવન', 'ઓગણસાઠ',
        'સાઠ', 'એકસઠ', 'બાસઠ', 'ત્રેસઠ', 'ચોસઠ', 'પાંસઠ', 'છાસઠ', 'સડસઠ', 'અડસઠ', 'ઓગણોતેર',
        'સિત્તેર', 'એકોતેર', 'બહોતેર', 'તોતેર', 'ચુમોતેર', 'પંચોતેર', 'છોતેર', 'સિત્યોતેર', 'ઈઠ્યોતેર', 'ઓગણાએંસી',
        'એંસી', 'એક્યાસી', 'બ્યાસી', 'ત્ર્યાસી', 'ચોર્યાસી', 'પંચ્યાસી', 'છ્યાસી', 'સિત્યાસી', 'ઈઠ્યાસી', 'નેવ્યાસી',
        'નેવું', 'એકાણું', 'બાણું', 'ત્રાણું', 'ચોરાણું', 'પંચાણું', 'છન્નું', 'સત્તાણું', 'અઠ્ઠાણું', 'નવ્વાણું'
      ]
    };
    const transliteratedNumberWords = {
      hi: [
        'shunya', 'ek', 'do', 'teen', 'chaar', 'paanch', 'chhah', 'saat', 'aath', 'nau',
        'das', 'gyaarah', 'baarah', 'terah', 'chaudah', 'pandrah', 'solah', 'satrah', 'atharah', 'unnees',
        'bees', 'ikkees', 'baees', 'teis', 'chaubees', 'pachchees', 'chhabbees', 'sattaees', 'atthaees', 'untees',
        'tees', 'iktees', 'battees', 'taintees', 'chauntees', 'paintees', 'chhattees', 'saintees', 'adtees', 'untaalees',
        'chaalees', 'iktaalees', 'bayaalees', 'taintaalees', 'chavaalees', 'paintaalees', 'chiyaalees', 'saintaalees', 'adtaalees', 'unchaas',
        'pachaas', 'ikyaavan', 'baavan', 'tirpan', 'chauvan', 'pachpan', 'chhappan', 'sattaavan', 'atthaavan', 'unsath',
        'saath', 'iksath', 'baasath', 'tirsath', 'chaunsath', 'painsath', 'chhiyaasath', 'sadsath', 'adsath', 'unhattar',
        'sattar', 'ikhattar', 'bahattar', 'tihattar', 'chauhattar', 'pachhattar', 'chhihattar', 'satahattar', 'athahattar', 'unnaasi',
        'assi', 'ikyaasi', 'bayaasi', 'tiraasi', 'chauraasi', 'pachaasi', 'chhiyaasi', 'sataasi', 'atthaasi', 'navaasi',
        'nabbe', 'ikyaanave', 'baanave', 'tiraanave', 'chauraanave', 'panchaanave', 'chhiyaanave', 'sattaanave', 'atthaanave', 'ninyaanave'
      ],
      gu: [
        'shunya', 'ek', 'be', 'tran', 'chaar', 'paanch', 'chha', 'saat', 'aath', 'nav',
        'das', 'agyaar', 'baar', 'ter', 'chaud', 'pandhar', 'sol', 'sattar', 'adhaaras', 'oganees', 'vees',
        'ekvis', 'bavis', 'trevis', 'chovis', 'pachchis', 'chhavvis', 'sattavis', 'aththavis', 'ogantris',
        'tris', 'ekatris', 'batris', 'tetris', 'chotris', 'pantris', 'chhatris', 'saadetris', 'adtris', 'oganchalis',
        'chalis', 'ektaalis', 'betaalis', 'tretalis', 'chummalis', 'pistaalis', 'chetalis', 'sudtalis', 'adtalis', 'oganpachas',
        'pachas', 'ekavan', 'bavan', 'trepan', 'chopan', 'panchavan', 'chhappan', 'sattavan', 'aththavan', 'ogansath',
        'saath', 'eksath', 'basath', 'tresath', 'chosath', 'pansath', 'chhasath', 'sadsath', 'adsath', 'oganoter',
        'sitter', 'ekoter', 'bahoter', 'toter', 'chumoter', 'panchoter', 'chhoter', 'sityoter', 'ithyoter', 'oganaensi',
        'ensi', 'ekyasi', 'byasi', 'tryasi', 'choryasi', 'panchyasi', 'chhyasi', 'sityasi', 'ithyasi', 'nevyasi',
        'nevun', 'ekanu', 'banu', 'tranu', 'choranu', 'panchanu', 'chhannu', 'sattanu', 'aththanu', 'navvanu'
      ]
    };
    const numericValue = Number(number);
    const words = transliterate ? transliteratedNumberWords[language] : numberWords[language];

    if (Number.isSafeInteger(numericValue) && numericValue >= 0 && words[numericValue]) {
      return words[numericValue];
    }
    if (language === 'hi' && Number.isSafeInteger(numericValue) && numericValue >= 100 && numericValue < 1000000) {
      let remaining = numericValue;
      const parts = [];
      const units = [
        { value: 100000, word: transliterate ? 'lakh' : 'लाख' },
        { value: 1000, word: transliterate ? 'hazaar' : 'हज़ार' },
        { value: 100, word: transliterate ? 'sau' : 'सौ' }
      ];
      units.forEach(unit => {
        const count = Math.floor(remaining / unit.value);
        if (count > 0) {
          parts.push(this.getLocalizedNumberWord(count, language, transliterate), unit.word);
          remaining %= unit.value;
        }
      });
      if (remaining > 0) {
        parts.push(this.getLocalizedNumberWord(remaining, language, transliterate));
      }
      return parts.join(' ');
    }
    if (Number.isSafeInteger(numericValue) && numericValue >= 0) {
      const digits = words;
      return String(numericValue).split('').map(digit => digits[Number(digit)]).join(' ');
    }
    return number;
  },

  bindAudioUnlock() {
    if (this.audioUnlockBound) return;
    this.audioUnlockBound = true;

    const unlock = () => {
      this.audioContext = this.audioContext || this.createAudioContext();
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(error => {
          console.warn('Token chime audio could not be enabled.', error);
        });
      }
      if (this.pendingAnnouncement) {
        const { messages, language } = this.pendingAnnouncement;
        const sequence = ++this.announcementSequence;
        window.speechSynthesis.cancel();
        this.speakAnnouncementSequence(messages, language, sequence);
      }
    };

    this.audioUnlockHandler = unlock;
    document.addEventListener('pointerdown', unlock, true);
    document.addEventListener('keydown', unlock, true);
  },

  removeAudioUnlockListeners() {
    if (!this.audioUnlockHandler) return;
    document.removeEventListener('pointerdown', this.audioUnlockHandler, true);
    document.removeEventListener('keydown', this.audioUnlockHandler, true);
    this.audioUnlockHandler = null;
    this.audioUnlockBound = false;
  },

  createAudioContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    return AudioContext ? new AudioContext() : null;
  },

  async playTokenChime() {
    if (!window.AudioContext && !window.webkitAudioContext) {
      console.warn('Token chime is unavailable because Web Audio is not supported.');
      return;
    }

    this.audioContext = this.audioContext || this.createAudioContext();
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(error => {
        console.warn('Token chime could not start; the browser may require an interaction.', error);
      });
      return false;
    }

    const startTime = this.audioContext.currentTime;
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((frequency, index) => {
      const noteStart = startTime + index * 0.65;

      [frequency, frequency * 2].forEach((partial, partialIndex) => {
        const oscillator = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const noteDuration = 1.1;

        oscillator.type = 'sine';
        oscillator.frequency.value = partial;
        gain.gain.setValueAtTime(0.0001, noteStart);
        gain.gain.exponentialRampToValueAtTime(partialIndex === 0 ? 0.36 : 0.072, noteStart + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + noteDuration);
        oscillator.connect(gain);
        gain.connect(this.audioContext.destination);
        oscillator.start(noteStart);
        oscillator.stop(noteStart + noteDuration);
      });
    });

    await new Promise(resolve => setTimeout(resolve, 2500));
    return true;
  },

  getSpokenTokenNumber(tokenNumber) {
    const token = String(tokenNumber || '').trim();
    const numberMatch = token.match(/(\d+)\s*$/);
    if (!numberMatch) return token;

    const number = Number(numberMatch[1]);
    return Number.isSafeInteger(number) ? String(number) : numberMatch[1];
  },

  async toggleFullscreen() {
    const container = document.querySelector('.tv-display-container');
    if (!container) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        if (!container.requestFullscreen) {
          throw new Error('Fullscreen is not supported in this browser.');
        }
        await container.requestFullscreen();
      }
    } catch (error) {
      console.error('Unable to toggle fullscreen token display', error);
      SmartOPD.Notifications.danger('Unable to toggle fullscreen display.');
    }
  }
};
