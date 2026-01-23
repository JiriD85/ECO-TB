/**
 * ECO Diagnostics Utils JS - FINALE VERSION
 *
 * ThingsBoard JavaScript Module (Version 3.9+)
 * Pfad: Resources → JavaScript library → Module → "ECO Diagnostics Utils JS.js"
 *
 * Vollständige Library mit allen Funktionen inklusive HTML & CSS Templates:
 * - Progress Display (getProgressHtml, getProgressColor)
 * - Address Search (initAddressSearch, getAddressSearchTemplate)
 * - Add Project Dialog (initProjectDialog, openAddProjectDialog, getProjectDialogHtml, getProjectDialogCss)
 */

// ============================================================================
// PROGRESS DISPLAY FUNCTIONS
// ============================================================================

/**
 * Gibt Farbe und Label für Progress Status zurück
 *
 * @param {string} progress - Progress Status
 * @returns {Object} { color, bgColor, label }
 */
export function getProgressColor(progress) {
  let color, bgColor, label;

  switch (progress) {
    case "in preparation":
      color = "#F2994A"; // orange
      bgColor = "rgba(242, 153, 74, 0.12)";
      label = "In Preparation";
      break;

    case "planned":
      color = "#F2994A"; // orange
      bgColor = "rgba(242, 153, 74, 0.12)";
      label = "Planned";
      break;

    case "active":
      color = "#27AE60"; // green
      bgColor = "rgba(39, 174, 96, 0.12)";
      label = "Active";
      break;

    case "finished":
      color = "#2F80ED"; // blue
      bgColor = "rgba(47, 128, 237, 0.12)";
      label = "Finished";
      break;

    case "aborted":
      color = "#EB5757"; // red
      bgColor = "rgba(235, 87, 87, 0.12)";
      label = "Aborted";
      break;

    default:
      color = "#828282"; // gray
      bgColor = "rgba(130, 130, 130, 0.12)";
      label = "N/A";
      break;
  }

  return { color, bgColor, label };
}

/**
 * Gibt HTML Badge für Progress Status zurück
 *
 * @param {string} progress - Progress Status
 * @returns {string} HTML String
 */
export function getProgressHtml(progress) {
  const { color, bgColor, label } = getProgressColor(progress);
  return (
    '<div ' +
    'style="display:inline-block;padding:4px 8px;border-radius:8px;' +
    'line-height:20px;font-size:14px;font-weight:500;' +
    'letter-spacing:0.25px;color:' + color + ';' +
    'background-color:' + bgColor + ';">' +
    label +
    '</div>'
  );
}

// ============================================================================
// MEASUREMENT/INSTALLATION TYPE STYLING
// ============================================================================

/**
 * Gibt Icon, Farben und Label fuer Measurement Type zurueck
 *
 * @param {string} measurementType - Measurement Type
 * @returns {Object} { icon, color, bgColor, label }
 */
export function getMeasurementTypeStyle(measurementType) {
  let icon, color, bgColor, label;

  switch (measurementType) {
    case "ultrasonic":
      icon = "sensors";
      color = "#2F80ED";
      bgColor = "rgba(47, 128, 237, 0.12)";
      label = "Ultrasonic";
      break;
    case "import":
      icon = "upload_file";
      color = "#9B51E0";
      bgColor = "rgba(155, 81, 224, 0.12)";
      label = "Import";
      break;
    case "interpolation":
      icon = "auto_graph";
      color = "#27AE60";
      bgColor = "rgba(39, 174, 96, 0.12)";
      label = "Interpolation";
      break;
    case "lorawan":
      icon = "cell_tower";
      color = "#F2994A";
      bgColor = "rgba(242, 153, 74, 0.12)";
      label = "LoRaWAN";
      break;
    default:
      icon = "help_outline";
      color = "#828282";
      bgColor = "rgba(130, 130, 130, 0.12)";
      label = "Unknown";
      break;
  }

  return { icon, color, bgColor, label };
}

/**
 * Gibt HTML Badge für Measurement Type zurück
 *
 * @param {string} measurementType - Measurement Type
 * @returns {string} HTML String
 */
export function getMeasurementTypeHtml(measurementType) {
  const { icon, color, bgColor, label } = getMeasurementTypeStyle(measurementType);
  return (
    '<div style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border-radius:8px;' +
    'line-height:20px;font-size:14px;font-weight:500;letter-spacing:0.25px;' +
    'color:' + color + ';background-color:' + bgColor + ';">' +
    '<span class="material-icons" style="font-size:16px;">' + icon + '</span>' +
    '<span>' + label + '</span>' +
    '</div>'
  );
}

/**
 * Gibt Icon, Farben und Label fuer Installation Type zurueck
 *
 * @param {string} installationType - Installation Type
 * @returns {Object} { icon, color, bgColor, label }
 */
export function getInstallationTypeStyle(installationType) {
  let icon, color, bgColor, label;

  switch (installationType) {
    case "cooling":
      icon = "ac_unit";
      color = "#2F80ED";
      bgColor = "rgba(47, 128, 237, 0.12)";
      label = "Cooling";
      break;
    case "heating":
      icon = "local_fire_department";
      color = "#EB5757";
      bgColor = "rgba(235, 87, 87, 0.12)";
      label = "Heating";
      break;
    default:
      icon = "thermostat";
      color = "#828282";
      bgColor = "rgba(130, 130, 130, 0.12)";
      label = "Unknown";
      break;
  }

  return { icon, color, bgColor, label };
}

// ============================================================================
// DEVICE STATUS/TIMESTAMP STYLING
// ============================================================================

/**
 * Gibt Icon, Farben und Label fuer Device-Status zurueck
 *
 * @param {boolean} hasDevice - Device assigned
 * @param {string} deviceName - Device name
 * @returns {Object} { icon, color, bgColor, label }
 */
export function getDeviceStatusStyle(hasDevice, deviceName) {
  let icon, color, bgColor, label;

  if (hasDevice) {
    icon = "check_circle";
    color = "#27AE60";
    bgColor = "rgba(39, 174, 96, 0.12)";
    label = deviceName || "Assigned";
  } else {
    icon = "error_outline";
    color = "#EB5757";
    bgColor = "rgba(235, 87, 87, 0.12)";
    label = "No Device";
  }

  return { icon, color, bgColor, label };
}

/**
 * Gibt Icon, Farben und Label fuer Timestamp-Anzeige zurueck
 *
 * @param {number|string} timestampMs - Unix timestamp in ms
 * @param {string} type - "start" oder "end"
 * @returns {Object|null} { icon, color, bgColor, label, formattedTime } oder null
 */
export function getTimestampStyle(timestampMs, type) {
  if (timestampMs === null || timestampMs === undefined) {
    return null;
  }

  const date = new Date(Number(timestampMs));
  const pad = (n) => n.toString().padStart(2, "0");
  const formattedTime =
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    " " +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":" +
    pad(date.getSeconds());

  let icon, color, bgColor, label;

  if (type === "start") {
    icon = "play_circle";
    color = "#27AE60";
    bgColor = "rgba(39, 174, 96, 0.12)";
    label = "Start";
  } else {
    icon = "stop_circle";
    color = "#2F80ED";
    bgColor = "rgba(47, 128, 237, 0.12)";
    label = "End";
  }

  return { icon, color, bgColor, label, formattedTime };
}

// ============================================================================
// ADDRESS SEARCH FUNCTIONS
// ============================================================================

/**
 * Initialisiert die Adresssuche für ein Angular FormGroup
 *
 * VERWENDUNG:
 *   const addressSearch = utils.initAddressSearch(vm.formGroup, vm);
 *   vm.searchAddress = addressSearch.searchAddress;
 *   vm.onAddressSelected = addressSearch.onAddressSelected;
 *   vm.displayAddressOption = addressSearch.displayAddressOption;
 *
 * ERFORDERLICHE FORMGROUP FELDER:
 *   - address (required)
 *   - postalCode (optional)
 *   - city (optional)
 *   - latitude (optional)
 *   - longitude (optional)
 *
 * @param {Object} formGroup - Angular FormGroup
 * @param {Object} vm - ViewModel Instanz
 * @param {Function} onResultsCallback - Optional: Callback für Suchergebnisse
 * @returns {Object} API mit searchAddress, onAddressSelected, displayAddressOption
 */
export function initAddressSearch(formGroup, vm, onResultsCallback) {

  // Initialize state
  vm.addressOptions = vm.addressOptions || [];
  vm._lastSelectedAddressLabel = null;

  let addrTimer = null;
  let lastQuery = '';

  /**
   * Zeigt Adress-Option im Autocomplete an
   */
  function displayAddressOption(opt) {
    if (!opt) return '';
    return (typeof opt === 'string') ? opt : (opt.label || '');
  }

  /**
   * Manuelle Suche (Button-Click)
   */
  function searchAddress() {
    const addressField = formGroup.get('address');
    if (!addressField) {
      console.error('[Address Search] Address field not found in form group');
      return;
    }

    const qRaw = addressField.value || '';
    const q = (typeof qRaw === 'string') ? qRaw.trim() : displayAddressOption(qRaw).trim();

    if (q.length < 5) {
      vm.addressOptions = [];
      return;
    }

    searchAddressViaPhoton(q);
  }

  /**
   * Handler für ausgewählte Adresse
   */
  function onAddressSelected(opt) {
    if (!opt) return;

    vm._lastSelectedAddressLabel = opt.label;

    // Prepare patch data
    const patchData = {
      address: opt.label
    };

    // Add coordinates if fields exist
    if (formGroup.get('latitude')) {
      patchData.latitude = opt.lat;
    }
    if (formGroup.get('longitude')) {
      patchData.longitude = opt.lon;
    }

    // Only set postalCode and city if currently empty
    const currentPostalCode = formGroup.get('postalCode') ?
      (formGroup.get('postalCode').value || '').trim() : '';
    const currentCity = formGroup.get('city') ?
      (formGroup.get('city').value || '').trim() : '';

    if (!currentPostalCode && opt.postcode && formGroup.get('postalCode')) {
      patchData.postalCode = opt.postcode;
    }
    if (!currentCity && opt.city && formGroup.get('city')) {
      patchData.city = opt.city;
    }

    formGroup.patchValue(patchData);

    // Mark fields as dirty
    formGroup.get('address').markAsDirty();
    if (formGroup.get('latitude')) formGroup.get('latitude').markAsDirty();
    if (formGroup.get('longitude')) formGroup.get('longitude').markAsDirty();

    if (!currentPostalCode && opt.postcode && formGroup.get('postalCode')) {
      formGroup.get('postalCode').markAsDirty();
    }
    if (!currentCity && opt.city && formGroup.get('city')) {
      formGroup.get('city').markAsDirty();
    }

    // Clear results to close dropdown
    vm.addressOptions = [];
  }

  /**
   * Sucht via Photon API
   */
  function searchAddressViaPhoton(query) {
    // Get postalCode and city from form (if available)
    const postalCode = formGroup.get('postalCode') ?
      (formGroup.get('postalCode').value || '').trim() : '';
    const city = formGroup.get('city') ?
      (formGroup.get('city').value || '').trim() : '';

    // Build refined query
    let refinedQuery = query;
    if (postalCode) {
      refinedQuery += ' ' + postalCode;
    }
    if (city) {
      refinedQuery += ' ' + city;
    }

    const url = 'https://photon.komoot.io/api?q=' +
                encodeURIComponent(refinedQuery) +
                '&limit=5';

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(data => {
        const features = (data && data.features) ? data.features : [];

        vm.addressOptions = features.map(f => {
          const p = f.properties || {};
          const coords = (f.geometry && f.geometry.coordinates) ? f.geometry.coordinates : [null, null];
          const lon = coords[0];
          const lat = coords[1];

          // Build address components
          const street = p.street || p.name || '';
          const house = p.housenumber ? (' ' + p.housenumber) : '';
          const place = (street + house).trim() || (p.label || p.name || '').trim();

          const cc = (p.countrycode || '').toUpperCase();
          const postcode = p.postcode || '';
          const cityFromResult = p.city || p.town || p.village || p.state || '';

          // Format: "Address, CC-PLZ City"
          let tail = '';
          if (cc || postcode || cityFromResult) {
            tail = (cc ? cc : '');
            if (cc && postcode) tail += '-' + postcode;
            else if (!cc && postcode) tail += postcode;
            if ((cc || postcode) && cityFromResult) tail += ' ' + cityFromResult;
            else if (!cc && !postcode && cityFromResult) tail += cityFromResult;
          }

          const label = tail ? (place + ', ' + tail) : place;

          return {
            label: label,
            lat: (typeof lat === 'number') ? lat : parseFloat(lat),
            lon: (typeof lon === 'number') ? lon : parseFloat(lon),
            postcode: postcode,
            city: cityFromResult,
            raw: f
          };
        });

        // Call optional callback
        if (onResultsCallback && typeof onResultsCallback === 'function') {
          onResultsCallback(vm.addressOptions);
        }
      })
      .catch(err => {
        console.error('[Address Search] Failed:', err);
        vm.addressOptions = [];
      });
  }

  /**
   * Setup auto-search on typing (debounced)
   */
  function setupAutoSearch() {
    const addressField = formGroup.get('address');
    if (!addressField || !addressField.valueChanges) {
      console.warn('[Address Search] Address field does not support valueChanges');
      return;
    }

    addressField.valueChanges.subscribe(val => {
      // Don't search if user just selected an option
      if (typeof val === 'string' && vm._lastSelectedAddressLabel && val === vm._lastSelectedAddressLabel) {
        return;
      }

      const s = (typeof val === 'string') ? val.trim() : (displayAddressOption(val) || '').trim();

      // Reset results for short strings
      if (s.length < 5) {
        vm.addressOptions = [];
        lastQuery = s;
        if (addrTimer) {
          clearTimeout(addrTimer);
          addrTimer = null;
        }
        return;
      }

      // Simple distinctUntilChanged
      if (s === lastQuery) {
        return;
      }
      lastQuery = s;

      // Debounce 350ms
      if (addrTimer) {
        clearTimeout(addrTimer);
      }
      addrTimer = setTimeout(() => {
        searchAddressViaPhoton(s);
      }, 350);
    });
  }

  // Setup auto-search
  setupAutoSearch();

  // Return public API
  return {
    searchAddress: searchAddress,
    onAddressSelected: onAddressSelected,
    displayAddressOption: displayAddressOption,
    searchAddressViaPhoton: searchAddressViaPhoton
  };
}

/**
 * Generiert HTML Template für Adresssuche
 *
 * @param {Object} options - Konfiguration
 * @param {string} options.formGroupName - Name der FormGroup (default: "formGroup")
 * @param {boolean} options.showPostalCodeCity - Zeige Postal Code/City (default: true)
 * @param {boolean} options.showCoordinates - Zeige Lat/Lon (default: true)
 * @param {boolean} options.coordinatesSideBySide - Koordinaten nebeneinander (default: true)
 * @returns {string} HTML Template
 */
export function getAddressSearchTemplate(options) {
  const opts = options || {};
  const formGroupName = opts.formGroupName || 'formGroup';
  const showPostalCodeCity = opts.showPostalCodeCity !== false;
  const showCoordinates = opts.showCoordinates !== false;
  const coordinatesSideBySide = opts.coordinatesSideBySide !== false;

  let template = '<mat-form-field appearance="fill" class="flex-1">\n' +
    '  <mat-label>{{ \'custom.add-project-dialog.address\' | translate }}</mat-label>\n' +
    '  <input matInput formControlName="address" [matAutocomplete]="addrAuto" autocomplete="off">\n' +
    '  <button mat-icon-button matSuffix type="button" (click)="searchAddress()"\n' +
    '          [disabled]="(' + formGroupName + '.get(\'address\').value || \'\').length < 5">\n' +
    '    <mat-icon class="material-icons">search</mat-icon>\n' +
    '  </button>\n' +
    '  <mat-autocomplete #addrAuto="matAutocomplete"\n' +
    '                    [displayWith]="displayAddressOption"\n' +
    '                    (optionSelected)="onAddressSelected($event.option.value)">\n' +
    '    <mat-option *ngFor="let opt of addressOptions" [value]="opt">\n' +
    '      {{ opt.label }}\n' +
    '    </mat-option>\n' +
    '  </mat-autocomplete>\n' +
    '  <mat-hint *ngIf="(' + formGroupName + '.get(\'address\').value || \'\').length < 5">\n' +
    '    {{ \'custom.add-project-dialog.address-hint\' | translate }}\n' +
    '  </mat-hint>\n' +
    '</mat-form-field>\n';

  if (showPostalCodeCity) {
    template += '\n<div style="display: flex; gap: 8px;">\n' +
      '  <mat-form-field appearance="fill" style="flex: 1;">\n' +
      '      <mat-label>{{ \'custom.add-project-dialog.postal-code\' | translate }}</mat-label>\n' +
      '      <input matInput formControlName="postalCode">\n' +
      '  </mat-form-field>\n' +
      '  <mat-form-field appearance="fill" style="flex: 2;">\n' +
      '      <mat-label>{{ \'custom.add-project-dialog.city\' | translate }}</mat-label>\n' +
      '      <input matInput formControlName="city">\n' +
      '  </mat-form-field>\n' +
      '</div>\n';
  }

  if (showCoordinates) {
    if (coordinatesSideBySide) {
      template += '\n<div style="display: flex; gap: 8px;">\n' +
        '  <mat-form-field appearance="fill" style="flex: 1;">\n' +
        '      <mat-label>{{ \'custom.add-project-dialog.latitude\' | translate }}</mat-label>\n' +
        '      <input matInput formControlName="latitude">\n' +
        '  </mat-form-field>\n' +
        '  <mat-form-field appearance="fill" style="flex: 1;">\n' +
        '      <mat-label>{{ \'custom.add-project-dialog.longitude\' | translate }}</mat-label>\n' +
        '      <input matInput formControlName="longitude">\n' +
        '  </mat-form-field>\n' +
        '</div>\n';
    } else {
      template += '\n<mat-form-field appearance="fill" class="flex-1">\n' +
        '    <mat-label>{{ \'custom.add-project-dialog.latitude\' | translate }}</mat-label>\n' +
        '    <input matInput formControlName="latitude">\n' +
        '</mat-form-field>\n' +
        '<mat-form-field appearance="fill" class="flex-1">\n' +
        '    <mat-label>{{ \'custom.add-project-dialog.longitude\' | translate }}</mat-label>\n' +
        '    <input matInput formControlName="longitude">\n' +
        '</mat-form-field>\n';
    }
  }

  return template;
}

// ============================================================================
// PROJECT DIALOG HTML & CSS TEMPLATES
// ============================================================================

/**
 * Gibt das HTML Template für den Add Project Dialog zurück
 *
 * VERWENDUNG in Custom Action:
 *   "customHtml": htmlTemplate (Variable wird automatisch gesetzt)
 *   oder
 *   const html = utils.getProjectDialogHtml();
 *
 * @returns {string} HTML Template String
 */
export function getProjectDialogHtml() {
  return '<form #addEntityForm="ngForm" [formGroup]="addProjectFormGroup"\n' +
    '      (ngSubmit)="save()" class="add-entity-form max-w-3xl mx-auto" style="width: 600px; max-width: 90vw;">\n' +
    '  <mat-toolbar class="flex items-center bg-primary text-white px-4" color="primary">\n' +
    '    <h2 class="text-lg font-semibold">{{ \'custom.add-project-dialog.title\' | translate }}</h2>\n' +
    '    <span class="flex-1"></span>\n' +
    '    <button mat-icon-button (click)="cancel()" type="button">\n' +
    '      <mat-icon class="material-icons">close</mat-icon>\n' +
    '    </button>\n' +
    '  </mat-toolbar>\n' +
    '  <mat-progress-bar color="warn" mode="indeterminate" *ngIf="isLoading$ | async">\n' +
    '  </mat-progress-bar>\n' +
    '  <div style="height: 4px;" *ngIf="!(isLoading$ | async)"></div>\n' +
    '  <div mat-dialog-content class="flex flex-col p-4 space-y-4">\n' +
    '    <div class="flex flex-col gap-0 sm:gap-2">\n' +
    '        <mat-form-field *ngIf="isTenantAdmin" appearance="fill" class="flex-1">\n' +
    '          <mat-label>{{ \'custom.add-project-dialog.customer\' | translate }}</mat-label>\n' +
    '        \n' +
    '          <mat-select\n' +
    '              formControlName="customer"\n' +
    '              (selectionChange)="onCustomerChange()"\n' +
    '              required>\n' +
    '        \n' +
    '            <mat-option *ngFor="let c of customers" [value]="c">\n' +
    '              {{ c.name }}\n' +
    '            </mat-option>\n' +
    '        \n' +
    '          </mat-select>\n' +
    '        \n' +
    '          <mat-error *ngIf="addProjectFormGroup.get(\'customer\')?.hasError(\'required\')">\n' +
    '            {{ \'custom.add-project-dialog.customer-required\' | translate }}\n' +
    '          </mat-error>\n' +
    '        </mat-form-field>\n' +
    '        <mat-form-field appearance="fill" class="flex-1">\n' +
    '            <mat-label>{{ \'custom.add-project-dialog.project-id\' | translate }}</mat-label>\n' +
    '            <input matInput formControlName="name" required readonly>\n' +
    '            <mat-error *ngIf="addProjectFormGroup.get(\'name\').hasError(\'required\')">\n' +
    '              {{ \'custom.add-project-dialog.project-id-required\' | translate }}\n' +
    '            </mat-error>\n' +
    '        </mat-form-field>\n' +
    '        <mat-form-field appearance="fill" class="flex-1">\n' +
    '            <mat-label>{{ \'custom.add-project-dialog.label\' | translate }}</mat-label>\n' +
    '            <input matInput formControlName="entityLabel">\n' +
    '        </mat-form-field>\n' +
    '<mat-form-field appearance="fill" class="flex-1">\n' +
    '  <mat-label>{{ \'custom.add-project-dialog.address\' | translate }}</mat-label>\n' +
    '\n' +
    '  <input matInput\n' +
    '         formControlName="address"\n' +
    '         [matAutocomplete]="addrAuto"\n' +
    '         autocomplete="off">\n' +
    '\n' +
    '  <!-- Lupe im Feld -->\n' +
    '  <button mat-icon-button\n' +
    '          matSuffix\n' +
    '          type="button"\n' +
    '          (click)="searchAddress()"\n' +
    '          [disabled]="(addProjectFormGroup.get(\'address\').value || \'\').length < 5">\n' +
    '    <mat-icon class="material-icons">search</mat-icon>\n' +
    '  </button>\n' +
    '\n' +
    '  <!-- Dropdown mit Ergebnissen -->\n' +
    '  <mat-autocomplete #addrAuto="matAutocomplete"\n' +
    '                    [displayWith]="displayAddressOption"\n' +
    '                    (optionSelected)="onAddressSelected($event.option.value)">\n' +
    '    <mat-option *ngFor="let opt of addressOptions" [value]="opt">\n' +
    '      {{ opt.label }}\n' +
    '    </mat-option>\n' +
    '  </mat-autocomplete>\n' +
    '\n' +
    '  <mat-hint *ngIf="(addProjectFormGroup.get(\'address\').value || \'\').length < 5">\n' +
    '    {{ \'custom.add-project-dialog.address-hint\' | translate }}\n' +
    '  </mat-hint>\n' +
    '</mat-form-field>\n' +
    '\n' +
    '        <div style="display: flex; gap: 8px;">\n' +
    '          <mat-form-field appearance="fill" style="flex: 1;">\n' +
    '              <mat-label>{{ \'custom.add-project-dialog.postal-code\' | translate }}</mat-label>\n' +
    '              <input matInput formControlName="postalCode">\n' +
    '          </mat-form-field>\n' +
    '          <mat-form-field appearance="fill" style="flex: 2;">\n' +
    '              <mat-label>{{ \'custom.add-project-dialog.city\' | translate }}</mat-label>\n' +
    '              <input matInput formControlName="city">\n' +
    '          </mat-form-field>\n' +
    '        </div>\n' +
    '\n' +
    '        <div style="display: flex; gap: 8px;">\n' +
    '          <mat-form-field appearance="fill" style="flex: 1;">\n' +
    '              <mat-label>{{ \'custom.add-project-dialog.latitude\' | translate }}</mat-label>\n' +
    '              <input matInput formControlName="latitude">\n' +
    '          </mat-form-field>\n' +
    '          <mat-form-field appearance="fill" style="flex: 1;">\n' +
    '              <mat-label>{{ \'custom.add-project-dialog.longitude\' | translate }}</mat-label>\n' +
    '              <input matInput formControlName="longitude">\n' +
    '          </mat-form-field>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '  <div mat-dialog-actions class="flex justify-end gap-2">\n' +
    '    <button mat-button color="primary"\n' +
    '            type="button"\n' +
    '            [disabled]="(isLoading$ | async)"\n' +
    '            (click)="cancel()" cdkFocusInitial>\n' +
    '      {{ \'custom.add-project-dialog.cancel\' | translate }}\n' +
    '    </button>\n' +
    '    <button mat-button mat-raised-button color="primary"\n' +
    '            type="submit"\n' +
    '            [disabled]="(isLoading$ | async) || addProjectFormGroup.invalid || !addProjectFormGroup.dirty">\n' +
    '      {{ \'custom.add-project-dialog.add-project\' | translate }}\n' +
    '    </button>\n' +
    '  </div>\n' +
    '</form>';
}

/**
 * Gibt das CSS für den Add Project Dialog zurück
 *
 * VERWENDUNG in Custom Action:
 *   "customCss": cssTemplate (Variable wird automatisch gesetzt)
 *   oder
 *   const css = utils.getProjectDialogCss();
 *
 * @returns {string} CSS String
 */
export function getProjectDialogCss() {
  return '/* apply a half-opaque blue to disabled filled text-fields */\n' +
    '.add-entity-form .mdc-text-field--filled.mdc-text-field--disabled {\n' +
    '  background-color: rgba(244, 249, 254, 0.5) !important;\n' +
    '}\n' +
    '\n' +
    '/* make sure the disabled focus-overlay is tinted the same */\n' +
    '.add-entity-form .mat-mdc-form-field-disabled .mat-mdc-form-field-focus-overlay {\n' +
    '  background-color: rgba(244, 249, 254, 0.5) !important;\n' +
    '}\n' +
    '\n' +
    '.add-entity-form\n' +
    '  .mdc-text-field--filled:not(.mdc-text-field--disabled) {\n' +
    '  background-color: #F4F9FE !important;\n' +
    '}\n' +
    '\n' +
    '.add-entity-form\n' +
    '  .mat-mdc-form-field-focus-overlay {\n' +
    '  background-color: #F4F9FE !important;\n' +
    '}\n' +
    '\n' +
    '\n' +
    'mat-icon {\n' +
    '    vertical-align: middle; /* or baseline, top, bottom */\n' +
    '    margin-right: 4px; /* space between icon and text */\n' +
    '}\n' +
    '\n' +
    '.fieldset {\n' +
    '    border: 1px solid #e2e8f0;\n' +
    '    background: #ffffff;\n' +
    '    color: #334155;\n' +
    '    border-radius: 6px;\n' +
    '    padding-bottom: 1px;\n' +
    '    padding-top: 1px;\n' +
    '    padding-left: 10px;\n' +
    '    padding-right: 10px;\n' +
    '}\n' +
    '.fieldset-legend {\n' +
    '    margin-bottom: 0.375rem;\n' +
    '    color: #334155;\n' +
    '    background: #ffffff;\n' +
    '    font-weight: 300;\n' +
    '    border-radius: 6px;\n' +
    '    padding: 2px;\n' +
    '}\n' +
    '.fieldset-container{\n' +
    '    padding-bottom: 10px;\n' +
    '}\n' +
    '\n' +
    '.disabled-checkbox {\n' +
    '  pointer-events: none;\n' +
    '  opacity: 0.5; /* To make it visually look disabled */\n' +
    '}\n' +
    '\n' +
    '.disabled-fields {\n' +
    '  pointer-events: none;   /* Prevents interaction */\n' +
    '  opacity: 0.5;           /* Makes it look disabled */\n' +
    '}\n' +
    '\n' +
    '/*.mat-form-field input[disabled] {\n' +
    '  background-color: #f5f5f5;\n' +
    '  cursor: not-allowed; \n' +
    '  color: #9e9e9e;\n' +
    '  \n' +
    '}*/';
}

// ============================================================================
// ADD PROJECT DIALOG FUNCTIONS
// ============================================================================

/**
 * Initialisiert den Add Project Dialog Controller
 *
 * WICHTIG: Diese Funktion setzt automatisch die globalen Variablen:
 * - htmlTemplate = utils.getProjectDialogHtml()
 * - cssTemplate = utils.getProjectDialogCss()
 *
 * VERWENDUNG (mit Kontrolle):
 *   const config = utils.initProjectDialog(widgetContext);
 *   config.services.customerService.getUserCustomers(config.pageLink).subscribe(pageData => {
 *     config.customers = (pageData && pageData.data) ? pageData.data : [];
 *     if (!config.isTenantAdmin && config.customers.length === 1) {
 *       const c = config.customers[0];
 *       config.customerId = { id: c.id.id, entityType: 'CUSTOMER' };
 *       config.customerName = c.name;
 *     }
 *     config.openDialog();
 *   });
 *
 * @param {Object} widgetContext - ThingsBoard Widget Context
 * @returns {Object} Configuration object mit openDialog() Methode
 */
export function initProjectDialog(widgetContext) {

  // Set global templates (needed for customDialog)
  if (typeof htmlTemplate === 'undefined') {
    globalThis.htmlTemplate = getProjectDialogHtml();
  }
  if (typeof cssTemplate === 'undefined') {
    globalThis.cssTemplate = getProjectDialogCss();
  }

  const $injector = widgetContext.$scope.$injector;
  const customDialog = $injector.get(widgetContext.servicesMap.get('customDialog'));
  const assetService = $injector.get(widgetContext.servicesMap.get('assetService'));
  const entityGroupService = $injector.get(widgetContext.servicesMap.get('entityGroupService'));
  const attributeService = $injector.get(widgetContext.servicesMap.get('attributeService'));
  const entityRelationService = $injector.get(widgetContext.servicesMap.get('entityRelationService'));
  const customerService = $injector.get(widgetContext.servicesMap.get('customerService'));

  const ctx = widgetContext;
  const isTenantAdmin = ctx.currentUser.authority === 'TENANT_ADMIN';
  const pageLink = ctx.pageLink(1000, 0, null, null, null);

  // Config object - wird als Referenz zurückgegeben und später befüllt
  const config = {
    isTenantAdmin: isTenantAdmin,
    pageLink: pageLink,
    customers: [],
    customerId: null,
    customerName: null,
    openDialog: null,
    getLastProjectId: getLastProjectId,
    services: {
      customerService: customerService,
      assetService: assetService,
      attributeService: attributeService,
      entityRelationService: entityRelationService,
      entityGroupService: entityGroupService
    }
  };

  /**
   * Berechnet die nächste Project ID aus bestehenden Projekten
   */
  function getLastProjectId(projects) {
    let maxNumber = 0;
    projects.forEach(item => {
      const name = item.name;
      const parts = name.split('_');
      if (parts.length === 2) {
        const number = parseInt(parts[1], 10);
        if (number > maxNumber) {
          maxNumber = number;
        }
      }
    });
    return maxNumber + 1;
  }

  /**
   * Öffnet den Add Project Dialog
   */
  function openDialog() {
    customDialog.customDialog(globalThis.htmlTemplate, AddProjectDialogController).subscribe();
  }

  /**
   * Dialog Controller
   */
  function AddProjectDialogController(instance) {
    let vm = instance;

    vm.isTenantAdmin = config.isTenantAdmin;
    vm.customers = config.customers;

    // FormGroup erstellen
    vm.addProjectFormGroup = vm.fb.group({
      customer: [{ value: null, disabled: !config.isTenantAdmin }, vm.validators.required],
      name: [{ value: '', disabled: true }, vm.validators.required],
      entityLabel: [''],
      address: [''],
      postalCode: [''],
      city: [''],
      latitude: [''],
      longitude: ['']
    });

    // Address Search initialisieren (verwendet initAddressSearch aus dieser Library)
    const addressSearch = initAddressSearch(vm.addProjectFormGroup, vm);
    vm.searchAddress = addressSearch.searchAddress;
    vm.onAddressSelected = addressSearch.onAddressSelected;
    vm.displayAddressOption = addressSearch.displayAddressOption;

    // Customer vorausfüllen (Non-Tenant-Admin)
    if (!config.isTenantAdmin && config.customerId) {
      vm.addProjectFormGroup.patchValue({
        customer: config.customers[0]
      });
      vm.addProjectFormGroup.get('customer').markAsDirty();
      loadCustomerData(config.customerId);
    }

    // Customer Change Handler
    vm.onCustomerChange = function () {
      const c = vm.addProjectFormGroup.value.customer;
      if (!c) return;

      config.customerId = {
        id: c.id.id,
        entityType: 'CUSTOMER'
      };
      config.customerName = c.name;

      loadCustomerData(config.customerId);
    };

    // Cancel Handler
    vm.cancel = function () {
      vm.dialogRef.close(null);
    };

    // Save Handler
    vm.save = function () {
      vm.addProjectFormGroup.markAsPristine();
      saveProjectObservable(config.customerId).subscribe(
        function (Project) {
          widgetContext.rxjs.forkJoin([
            saveCustomerToProjectRelation(config.customerId, Project.id),
            saveAttributes(Project.id)
          ]).subscribe(
            function () {
              const params = widgetContext.stateController.getStateParams();
              params['selectedProject'] = {
                entityId: Project.id,
                entityName: Project.name,
                entityLabel: ''
              };
              widgetContext.updateAliases();
              vm.dialogRef.close(null);
            }
          );
        }
      );
    };

    /**
     * Lädt Customer-Daten und berechnet nächste Project ID
     */
    function loadCustomerData(customerId) {
      const assetSearchQuery = {
        parameters: {
          rootId: customerId.id,
          rootType: 'CUSTOMER',
          direction: 'FROM',
          relationTypeGroup: 'COMMON',
          maxLevel: 10,
          fetchLastLevelOnly: false
        },
        relationType: 'Owns',
        assetTypes: ['Project']
      };

      assetService.findByQuery(assetSearchQuery).subscribe(projects => {
        const nextProjectId = getLastProjectId(projects);

        attributeService
          .getEntityAttributes(customerId, 'SERVER_SCOPE', ['shortName'])
          .subscribe(attributes => {
            const shortNameAttr = attributes.find(a => a.key === 'shortName');
            const customerShortName = shortNameAttr ? shortNameAttr.value : config.customerName;

            vm.addProjectFormGroup.patchValue({
              name: customerShortName + '_' + nextProjectId
            });

            vm.addProjectFormGroup.get('name').markAsDirty();
          });
      });
    }

    /**
     * Speichert das Project
     */
    function saveProjectObservable(customerId) {
      return getProjectsGroup(customerId).pipe(
        widgetContext.rxjs.switchMap((ProjectsGroup) => {
          const formValues = vm.addProjectFormGroup.getRawValue();
          const Project = {
            name: formValues.name,
            type: 'Project',
            label: formValues.entityLabel,
            customerId: customerId
          };
          return assetService.saveAsset(Project, ProjectsGroup.id.id);
        })
      );
    }

    /**
     * Holt oder erstellt Projects Group
     */
    function getProjectsGroup(customerId) {
      return entityGroupService.getEntityGroupsByOwnerId(customerId.entityType, customerId.id, 'ASSET').pipe(
        widgetContext.rxjs.switchMap((entityGroups) => {
          let ProjectsGroup = entityGroups.find(group => group.name === 'Projects');
          if (ProjectsGroup) {
            return widgetContext.rxjs.of(ProjectsGroup);
          } else {
            ProjectsGroup = {
              type: 'ASSET',
              name: 'Projects',
              ownerId: customerId
            };
            return entityGroupService.saveEntityGroup(ProjectsGroup);
          }
        })
      );
    }

    /**
     * Speichert Customer-Project Relation
     */
    function saveCustomerToProjectRelation(customerId, ProjectId) {
      const relation = {
        from: customerId,
        to: ProjectId,
        typeGroup: 'COMMON',
        type: 'Owns'
      };
      return entityRelationService.saveRelation(relation);
    }

    /**
     * Speichert Project Attribute (inkl. postalCode und city)
     */
    function saveAttributes(entityId) {
      const formValues = vm.addProjectFormGroup.value;
      const attributesArray = [
        {
          key: 'latitude',
          value: formValues.latitude || 48.1406022
        },
        {
          key: 'longitude',
          value: formValues.longitude || 16.2932688
        },
        {
          key: 'address',
          value: formValues.address || ''
        },
        {
          key: 'postalCode',
          value: formValues.postalCode || ''
        },
        {
          key: 'city',
          value: formValues.city || ''
        },
        {
          key: 'progress',
          value: 'in preparation'
        },
        {
          key: 'units',
          value: 'metric'
        }
      ];
      return attributeService.saveEntityAttributes(entityId, "SERVER_SCOPE", attributesArray);
    }
  }

  // Setze openDialog Funktion im config Objekt
  config.openDialog = openDialog;

  // Return Configuration Object (Referenz, wird von openAddProjectDialog befüllt)
  return config;
}

/**
 * Vereinfachte Funktion: Öffnet Add Project Dialog direkt
 *
 * VERWENDUNG in Custom Action (einfachste Variante):
 *   utils.openAddProjectDialog(widgetContext);
 *
 * Diese Funktion ist KOMPLETT STANDALONE - kein HTML/CSS in der Custom Action nötig!
 *
 * @param {Object} widgetContext - ThingsBoard Widget Context
 */
export function openAddProjectDialog(widgetContext) {
  const config = initProjectDialog(widgetContext);

  config.services.customerService.getUserCustomers(config.pageLink).subscribe(pageData => {
    config.customers = (pageData && pageData.data) ? pageData.data : [];

    // Non-Tenant-Admin → genau ein Customer
    if (!config.isTenantAdmin && config.customers.length === 1) {
      const c = config.customers[0];
      config.customerId = {
        id: c.id.id,
        entityType: 'CUSTOMER'
      };
      config.customerName = c.name;
    }

    config.openDialog();
  });
}
