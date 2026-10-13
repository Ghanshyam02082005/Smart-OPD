/**
 * SMART OPD - MAIN APPLICATION BOOTSTRAP
 */
window.SmartOPD = window.SmartOPD || {};

SmartOPD.App = {
  init() {
    console.log('Initializing Smart OPD Application...');

    SmartOPD.Language.init();
    SmartOPD.Storage.init();
    SmartOPD.State.init();
    this.applyHospitalLogoTheme();
    this.removeLegacyDemoData();
    SmartOPD.Router.init();

    this.bindGlobalEvents();
    this.startClock();
  },

  removeLegacyDemoData() {
    const demoPatientIds = new Set(['pat_demo_018', 'pat_demo_021', 'pat_demo_030']);
    const patients = SmartOPD.Storage.getPatients();
    const retainedPatients = patients.filter(patient => !demoPatientIds.has(patient.id));
    if (retainedPatients.length !== patients.length) {
      SmartOPD.Storage.savePatients(retainedPatients);
    }

    const auditLogs = SmartOPD.Storage.getAuditLogs();
    const retainedAuditLogs = auditLogs.filter(log => !(
      typeof log.reason === 'string' && log.reason.startsWith('Initial Demo Setup')
    ));
    if (retainedAuditLogs.length !== auditLogs.length) {
      SmartOPD.Storage.saveAuditLogs(retainedAuditLogs);
    }
  },

  bindGlobalEvents() {
    const langSelect = document.getElementById('global-lang-select');
    if (langSelect) {
      langSelect.addEventListener('change', (event) => {
        SmartOPD.Language.setLanguage(event.target.value);
      });
    }

    const drawerToggle = document.getElementById('mobile-drawer-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('drawer-overlay');

    if (drawerToggle && sidebar && overlay) {
      drawerToggle.addEventListener('click', () => {
        const isOpen = sidebar.classList.toggle('mobile-open');
        overlay.classList.toggle('open', isOpen);
        drawerToggle.setAttribute('aria-expanded', String(isOpen));
      });

      overlay.addEventListener('click', () => {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('open');
        drawerToggle.setAttribute('aria-expanded', 'false');
      });
    }

    window.addEventListener('opdStateChanged', () => {
      this.applyHospitalLogoTheme();
      SmartOPD.Router.handleRoute();
    });

    window.addEventListener('languageChanged', () => {
      SmartOPD.Router.handleRoute();
    });
  },

  applyHospitalLogoTheme() {
    const settings = SmartOPD.Storage.getSettings();
    const logoDataUrl = settings.logoDataUrl;
    const root = document.documentElement;
    const validLogo = /^data:image\/(?:png|jpeg|webp);base64,/.test(logoDataUrl);
    const logoSrc = validLogo ? logoDataUrl : 'assets/images/smart-opd-logo.svg';
    const favicon = document.getElementById('hospital-favicon');
    if (favicon) {
      favicon.href = validLogo ? logoDataUrl : 'assets/icons/favicon.svg';
      favicon.type = validLogo
        ? (logoDataUrl.match(/^data:(image\/(?:png|jpeg|webp));/) || [])[1] || 'image/png'
        : 'image/svg+xml';
    }
    document.querySelectorAll('.hospital-brand-logo').forEach(logo => {
      logo.src = logoSrc;
      logo.alt = settings.hospitalName || 'Hospital logo';
    });
    const sidebarLogo = document.getElementById('hospital-brand-logo');
    if (sidebarLogo) {
      sidebarLogo.src = logoSrc;
      sidebarLogo.alt = settings.hospitalName || 'Hospital logo';
    }
    const sidebarName = document.getElementById('hospital-brand-name');
    if (sidebarName) {
      sidebarName.textContent = settings.hospitalName || 'Smart OPD';
      sidebarName.title = settings.hospitalName || 'Smart OPD';
    }
    const themeProperties = [
      '--primary-50', '--primary-100', '--primary-200', '--primary-500',
      '--primary-600', '--primary-700', '--primary-900', '--primary-rgb',
      '--sidebar-bg', '--sidebar-hover', '--sidebar-text', '--parchi-primary',
      '--parchi-accent', '--parchi-soft-bg', '--parchi-soft-border',
      '--parchi-strong', '--parchi-rule', '--mdmh-blue', '--mdmh-cyan',
      '--mdmh-cyan-soft', '--mdmh-light', '--mdmh-border', '--mdmh-footer',
      '--tv-bg', '--tv-panel', '--tv-raised', '--tv-border', '--tv-muted'
    ];
    const resetTheme = () => themeProperties.forEach(property => root.style.removeProperty(property));
    const applyTheme = colors => Object.entries(colors).forEach(([property, value]) => {
      if (themeProperties.includes(property)) root.style.setProperty(property, value);
    });
    const saveLogoTheme = colors => {
      try {
        const currentSettings = SmartOPD.Storage.getSettings();
        if (currentSettings.logoDataUrl !== logoDataUrl) return;
        currentSettings.logoThemeColors = colors;
        localStorage.setItem(SmartOPD.Storage.KEYS.SETTINGS, JSON.stringify(currentSettings));
      } catch (error) {
        console.error('Unable to cache hospital logo theme colors.', error);
      }
    };

    this.logoThemeRequest = (this.logoThemeRequest || 0) + 1;
    const requestId = this.logoThemeRequest;

    if (!validLogo) {
      resetTheme();
      root.classList.remove('theme-pending');
      return;
    }
    if (settings.logoThemeColors) applyTheme(settings.logoThemeColors);

    const image = new Image();
    image.onload = () => {
      if (requestId !== this.logoThemeRequest) return;

      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) {
        console.error('Unable to analyze hospital logo colors: canvas is unavailable.');
        return;
      }

      try {
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        const hueBins = Array.from({ length: 36 }, () => ({ weight: 0, hue: 0, saturation: 0 }));
        for (let index = 0; index < pixels.length; index += 4) {
          const alpha = pixels[index + 3] / 255;
          if (alpha < 0.5) continue;

          const red = pixels[index] / 255;
          const green = pixels[index + 1] / 255;
          const blue = pixels[index + 2] / 255;
          const max = Math.max(red, green, blue);
          const min = Math.min(red, green, blue);
          const delta = max - min;
          const lightness = (max + min) / 2;
          const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
          if (saturation < 0.2 || lightness < 0.06 || lightness > 0.98) continue;

          let hue;
          if (max === red) hue = ((green - blue) / delta) % 6;
          else if (max === green) hue = (blue - red) / delta + 2;
          else hue = (red - green) / delta + 4;
          hue = (hue * 60 + 360) % 360;

          const bin = hueBins[Math.floor(hue / 10)];
          const weight = saturation * alpha;
          bin.weight += weight;
          bin.hue += hue * weight;
          bin.saturation += saturation * weight;
        }

        const dominantBin = hueBins.reduce((dominant, bin) => bin.weight > dominant.weight ? bin : dominant);
        if (dominantBin.weight === 0) {
          resetTheme();
          saveLogoTheme(null);
          root.classList.remove('theme-pending');
          return;
        }

        const hue = dominantBin.hue / dominantBin.weight;
        const saturation = Math.min(78, Math.max(48, dominantBin.saturation / dominantBin.weight * 100));
        const color = lightness => `hsl(${hue.toFixed(1)} ${saturation.toFixed(1)}% ${lightness}%)`;
        const rgbCanvas = document.createElement('canvas');
        rgbCanvas.width = 1;
        rgbCanvas.height = 1;
        const rgbContext = rgbCanvas.getContext('2d');
        if (!rgbContext) {
          resetTheme();
          console.error('Unable to create hospital logo theme colors: canvas is unavailable.');
          return;
        }
        rgbContext.fillStyle = color(44);
        rgbContext.fillRect(0, 0, 1, 1);
        const rgb = Array.from(rgbContext.getImageData(0, 0, 1, 1).data).slice(0, 3).join(', ');

        const colors = {
          '--primary-50': color(97),
          '--primary-100': color(92),
          '--primary-200': color(84),
          '--primary-500': color(56),
          '--primary-600': color(44),
          '--primary-700': color(36),
          '--primary-900': color(25),
          '--primary-rgb': rgb,
          '--sidebar-bg': `hsl(${hue.toFixed(1)} 34% 11%)`,
          '--sidebar-hover': `hsl(${hue.toFixed(1)} 32% 18%)`,
          '--sidebar-text': `hsl(${hue.toFixed(1)} 22% 76%)`,
          '--parchi-primary': color(25),
          '--parchi-accent': color(56),
          '--parchi-soft-bg': color(97),
          '--parchi-soft-border': color(84),
          '--parchi-strong': color(36),
          '--parchi-rule': color(56),
          '--mdmh-blue': color(25),
          '--mdmh-cyan': color(56),
          '--mdmh-cyan-soft': color(97),
          '--mdmh-light': color(97),
          '--mdmh-border': color(84),
          '--mdmh-footer': color(92),
          '--tv-bg': `hsl(${hue.toFixed(1)} 34% 7%)`,
          '--tv-panel': `hsl(${hue.toFixed(1)} 34% 11%)`,
          '--tv-raised': `hsl(${hue.toFixed(1)} 32% 18%)`,
          '--tv-border': `hsl(${hue.toFixed(1)} 28% 24%)`,
          '--tv-muted': `hsl(${hue.toFixed(1)} 20% 72%)`
        };
        applyTheme(colors);
        saveLogoTheme(colors);
        root.classList.remove('theme-pending');
      } catch (error) {
        resetTheme();
        root.classList.remove('theme-pending');
        console.error('Unable to analyze hospital logo colors.', error);
      }
    };
    image.onerror = () => {
      if (requestId === this.logoThemeRequest) {
        resetTheme();
        root.classList.remove('theme-pending');
        console.error('Unable to load hospital logo for theme colors.');
      }
    };
    image.src = logoDataUrl;
  },

  startClock() {
    const updateClock = () => {
      const clockEl = document.getElementById('header-live-clock');
      if (clockEl) {
        clockEl.textContent = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      }
    };

    updateClock();
    setInterval(updateClock, 1000);
  },

  printParchi(patientId) {
    const patient = SmartOPD.State.getPatientById(patientId);
    if (!patient) {
      SmartOPD.Notifications.danger('Patient record not found for printing.');
      return;
    }

    const printArea = document.getElementById('opd-parchi-print-area');
    if (!printArea) {
      SmartOPD.Notifications.danger('Print area is unavailable.');
      return;
    }

    const hospital = SmartOPD.Storage.getSettings();
    const departmentName = SmartOPD.Departments.label(
      patient.department || 'general_medicine',
      key => SmartOPD.Language.t(key)
    );
    const hospitalLogo = /^data:image\/(?:png|jpeg|webp);base64,/.test(hospital.logoDataUrl)
      ? hospital.logoDataUrl
      : 'assets/images/smart-opd-logo.svg';
    printArea.innerHTML = `
      <div class="parchi-container">
        <header class="parchi-header">
          <div class="parchi-header-left">
            <img src="${hospitalLogo}" alt="${SmartOPD.Utils.escapeHTML(hospital.hospitalName)}" class="parchi-logo">
            <div>
              <h1 class="parchi-hosp-name">${SmartOPD.Utils.escapeHTML(hospital.hospitalName)}</h1>
              ${hospital.hospitalSubtitle ? `<div class="parchi-hosp-sub">${SmartOPD.Utils.escapeHTML(hospital.hospitalSubtitle)}</div>` : ''}
            </div>
          </div>
          <div class="parchi-header-right">
            ${hospital.email ? `<div><strong>e-mail:</strong> ${SmartOPD.Utils.escapeHTML(hospital.email)}</div>` : ''}
            ${hospital.phone ? `<div><strong>Phone:</strong> ${SmartOPD.Utils.escapeHTML(hospital.phone)}</div>` : ''}
            ${hospital.website ? `<div><strong>Web:</strong> ${SmartOPD.Utils.escapeHTML(hospital.website)}</div>` : ''}
          </div>
        </header>

        <div class="parchi-divider"></div>
        <div class="parchi-title-bar">
          <span>OPD PATIENT TOKEN: ${SmartOPD.Utils.escapeHTML(patient.tokenNumber)}</span>
        </div>
        <div class="parchi-info-grid">
          <div class="parchi-info-item">
            <span class="parchi-info-label">Parchi Ref No</span>
            <strong>${SmartOPD.Utils.escapeHTML(patient.parchiRef || SmartOPD.Utils.formatParchiRef(patient.sequenceNumber || 1))}</strong>
          </div>
          <div class="parchi-info-item">
            <span class="parchi-info-label">OPD Token No</span>
            <strong>${SmartOPD.Utils.escapeHTML(patient.tokenNumber)}</strong>
          </div>
          <div class="parchi-info-item">
            <span class="parchi-info-label">Date &amp; Time</span>
            <strong>${new Date(patient.registeredAt).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
          </div>
          <div class="parchi-info-item">
            <span class="parchi-info-label">Phone</span>
            <strong>${SmartOPD.Utils.escapeHTML(patient.phone || 'N/A')}</strong>
          </div>
          <div class="parchi-info-item">
            <span class="parchi-info-label">Patient Name</span>
            <strong>${SmartOPD.Utils.escapeHTML(patient.fullName)}</strong>
          </div>
          <div class="parchi-info-item">
            <span class="parchi-info-label">Age / Sex</span>
            <strong>${patient.age} Yrs / ${SmartOPD.Utils.escapeHTML(patient.gender)}</strong>
          </div>
          <div class="parchi-info-item">
            <span class="parchi-info-label">Doctor</span>
            <span class="parchi-write-in"></span>
          </div>
          <div class="parchi-info-item">
            <span class="parchi-info-label">Department</span>
            <strong>${SmartOPD.Utils.escapeHTML(departmentName)}</strong>
          </div>
        </div>
        <div class="parchi-rx-mark">Rx</div>
        <footer class="parchi-address">
          <span class="parchi-address-label">Add:</span>
          ${SmartOPD.Utils.escapeHTML(hospital.address)}
        </footer>
      </div>
    `;

    const cleanup = () => {
      document.body.classList.remove('print-parchi-mode');
      printArea.innerHTML = '';
    };
    window.addEventListener('afterprint', cleanup, { once: true });
    document.body.classList.add('print-parchi-mode');
    window.print();
  },

  resetData() {
    if (confirm(SmartOPD.Language.t('settings.confirmReset'))) {
      SmartOPD.Storage.clearAll();
      SmartOPD.State.reloadFromStorage();
      SmartOPD.Notifications.warning('All OPD queue data and history has been cleared.');
      SmartOPD.Router.handleRoute();
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  SmartOPD.App.init();
});
