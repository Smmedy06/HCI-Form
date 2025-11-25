// Kids Application Form - Enhanced with UCD Principles
(function () {
  'use strict';

  // Form state
  const state = {
    currentSection: 1,
    totalSections: 5,
    voiceRecognition: null,
    map: null,
    mapMarker: null,
    userLocation: null,
    mouseEnabled: false, // Mouse interaction disabled by default
    keyboardEnabled: true,
    settingsOpen: false
  };

  // DOM Elements
  const form = document.getElementById('regForm');
  const formContainer = document.getElementById('formContainer');
  const interactionToast = document.getElementById('interactionToast');
  const interactionSettingsToggle = document.getElementById('interactionSettingsToggle');
  const interactionPanel = document.getElementById('interactionPanel');
  const mouseControlCheckbox = document.getElementById('mouseControlCheckbox');
  const keyboardControlCheckbox = document.getElementById('keyboardControlCheckbox');
  const sections = document.querySelectorAll('.form-section');
  const progressFill = document.getElementById('progressFill');
  const progressSteps = document.querySelectorAll('.step');
  const nextButtons = document.querySelectorAll('.btn-next');
  const prevButtons = document.querySelectorAll('.btn-prev');
  const submitBtn = document.getElementById('submitBtn');
  const result = document.getElementById('result');
  const voiceStatus = document.getElementById('voiceStatus');
  const voiceStatusText = document.getElementById('voiceStatusText');
  const reviewSummary = document.getElementById('reviewSummary');
  const getLocationBtn = document.getElementById('getLocationBtn');
  const messageTextarea = document.getElementById('message');
  const messageCount = document.getElementById('message-count');

  const focusableSelector = 'a[href], button, input, select, textarea, [tabindex]';
  let interactionToastTimeout = null;

  // Initialize
  function init() {
    setupInteractionControls();
    setupEventListeners();
    setupValidation();
    setupVoiceRecognition();
    setupKeyboardNavigation();
    setupDateValidation();
    setupCharacterCounter();
    
    // Setup field dependencies FIRST to ensure proper initial state
    setupFieldDependencies();
    
    updateProgress();
    
    // Clear any initial error states
    clearInitialErrors();
    
    // Initial check - section 1 should have next button disabled
    checkSectionValidity(1);
    
    // Show welcome notifications on page load
    showWelcomeNotifications();
    
    // Focus first field on page load
    focusFirstField();
    
    // Setup map after Google Maps API loads (if available)
    if (typeof google !== 'undefined' && google.maps) {
      setupMap();
    } else {
      // Try again after a delay in case script is still loading
      setTimeout(() => {
        if (typeof google !== 'undefined' && google.maps) {
          setupMap();
        } else {
          setupMap(); // Will show error message
        }
      }, 1000);
    }
  }

  // Show welcome notifications on page load
  function showWelcomeNotifications() {
    // Show first notification: Mouse Disabled
    setTimeout(() => {
      showInteractionToast('Mouse Disabled');
    }, 500);
    
    // Show second notification: Use Keyboard with Tab
    setTimeout(() => {
      showInteractionToast('Use Keyboard with Tab');
    }, 3000);
  }

  // Focus first field on page load
  function focusFirstField() {
    setTimeout(() => {
      const firstField = document.getElementById('childName');
      if (firstField && !firstField.disabled) {
        firstField.focus();
      }
    }, 100);
  }

  // Setup Interaction Controls (mouse + keyboard)
  function setupInteractionControls() {
    if (!formContainer) return;

    updateMouseControlState(false);
    updateKeyboardControlState(false);

    if (interactionSettingsToggle && interactionPanel) {
      interactionSettingsToggle.addEventListener('click', (e) => {
        e.preventDefault();
        state.settingsOpen = !state.settingsOpen;
        interactionPanel.classList.toggle('open', state.settingsOpen);
        interactionSettingsToggle.setAttribute('aria-expanded', state.settingsOpen);
        interactionPanel.setAttribute('aria-hidden', (!state.settingsOpen).toString());
      });

      document.addEventListener('click', (e) => {
        if (!state.settingsOpen) return;
        if (!interactionPanel.contains(e.target) && !interactionSettingsToggle.contains(e.target)) {
          state.settingsOpen = false;
          interactionPanel.classList.remove('open');
          interactionSettingsToggle.setAttribute('aria-expanded', 'false');
          interactionPanel.setAttribute('aria-hidden', 'true');
        }
      });
    }

    if (mouseControlCheckbox) {
      mouseControlCheckbox.checked = state.mouseEnabled;
      mouseControlCheckbox.addEventListener('change', (e) => {
        state.mouseEnabled = e.target.checked;
        updateMouseControlState();
      });
    }

    if (keyboardControlCheckbox) {
      keyboardControlCheckbox.checked = state.keyboardEnabled;
      keyboardControlCheckbox.addEventListener('change', (e) => {
        state.keyboardEnabled = e.target.checked;
        updateKeyboardControlState();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (state.keyboardEnabled) return;
      if (formContainer.contains(e.target)) {
        e.preventDefault();
      }
    }, true);
  }

  function updateMouseControlState(shouldNotify = false) {
    if (!formContainer) return;
    if (state.mouseEnabled) {
      formContainer.classList.remove('mouse-disabled');
    } else {
      formContainer.classList.add('mouse-disabled');
    }
    if (mouseControlCheckbox) {
      mouseControlCheckbox.checked = state.mouseEnabled;
    }
    if (shouldNotify) {
      showInteractionToast(state.mouseEnabled ? 'Mouse Enabled' : 'Mouse Disabled');
    }
  }

  function updateKeyboardControlState(shouldNotify = false) {
    if (!formContainer) return;
    if (state.keyboardEnabled) {
      restoreKeyboardFocus();
      formContainer.classList.remove('keyboard-disabled');
    } else {
      disableKeyboardFocus();
      formContainer.classList.add('keyboard-disabled');
    }
    if (keyboardControlCheckbox) {
      keyboardControlCheckbox.checked = state.keyboardEnabled;
    }
    if (shouldNotify) {
      showInteractionToast(state.keyboardEnabled ? 'Keyboard Enabled' : 'Keyboard Disabled');
    }
  }

  function disableKeyboardFocus() {
    if (!formContainer) return;
    const focusableElements = formContainer.querySelectorAll(focusableSelector);
    focusableElements.forEach(el => {
      if (!el.dataset.kbTabindex) {
        const currentIndex = el.getAttribute('tabindex');
        el.dataset.kbTabindex = currentIndex !== null ? currentIndex : 'none';
      }
      el.setAttribute('tabindex', '-1');
    });
    const activeElement = document.activeElement;
    if (activeElement && formContainer.contains(activeElement)) {
      activeElement.blur();
    }
  }

  function restoreKeyboardFocus() {
    if (!formContainer) return;
    const storedElements = formContainer.querySelectorAll('[data-kb-tabindex]');
    storedElements.forEach(el => {
      const originalIndex = el.dataset.kbTabindex;
      if (originalIndex === 'none') {
        el.removeAttribute('tabindex');
      } else {
        el.setAttribute('tabindex', originalIndex);
      }
      delete el.dataset.kbTabindex;
    });
  }

  function showInteractionToast(message) {
    if (!interactionToast) return;
    interactionToast.textContent = message;
    interactionToast.classList.add('show');
    interactionToast.setAttribute('aria-hidden', 'false');
    if (interactionToastTimeout) {
      clearTimeout(interactionToastTimeout);
    }
    interactionToastTimeout = setTimeout(() => {
      interactionToast.classList.remove('show');
      interactionToast.setAttribute('aria-hidden', 'true');
    }, 2500);
  }

  // Clear initial error states
  function clearInitialErrors() {
    // Clear all error messages
    const errorMessages = form.querySelectorAll('.error-message');
    errorMessages.forEach(error => {
      error.textContent = '';
    });
    
    // Remove invalid states from empty fields
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      if (!input.value || input.value.trim().length === 0) {
        input.removeAttribute('aria-invalid');
        // Clear error for country specifically
        if (input.id === 'country') {
          clearError(input);
        }
      }
    });
    
    // Ensure country doesn't show error on initial load
    const country = document.getElementById('country');
    if (country && country.disabled) {
      clearError(country);
      country.removeAttribute('aria-invalid');
    }
  }

  // Setup Event Listeners
  function setupEventListeners() {
    // Navigation buttons
    nextButtons.forEach(btn => {
      btn.addEventListener('click', handleNext);
    });

    prevButtons.forEach(btn => {
      btn.addEventListener('click', handlePrev);
    });

    // Form submission
    form.addEventListener('submit', handleSubmit);

    // Voice input buttons
    document.querySelectorAll('.voice-input-btn').forEach(btn => {
      btn.addEventListener('click', handleVoiceInput);
    });

    // Password toggle button
    const passwordToggle = document.getElementById('passwordToggle');
    const passwordInput = document.getElementById('password');
    
    if (passwordToggle && passwordInput) {
      const passwordWrapper = passwordInput.closest('.password-input-wrapper');
      
      // Ensure button is always clickable and accessible
      passwordToggle.style.pointerEvents = 'auto';
      passwordToggle.style.cursor = 'pointer';
      passwordToggle.setAttribute('tabindex', '0');
      
      // Function to toggle password visibility
      function togglePasswordVisibility(e) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        
        // Temporarily enable password field if disabled (for toggling)
        const wasDisabled = passwordInput.disabled;
        if (wasDisabled) {
          passwordInput.disabled = false;
        }
        
        const isPassword = passwordInput.type === 'password';
        // Toggle password visibility
        passwordInput.type = isPassword ? 'text' : 'password';
        
        // Restore disabled state if it was disabled
        if (wasDisabled) {
          passwordInput.disabled = true;
        }
        
        // Update icon visibility - toggle the display
        const eyeOpen = passwordToggle.querySelector('.eye-open');
        const eyeClosed = passwordToggle.querySelector('.eye-closed');
        
        if (eyeOpen && eyeClosed) {
          if (isPassword) {
            // Currently password, will show text - hide open eye, show closed eye
            eyeOpen.style.setProperty('display', 'none', 'important');
            eyeClosed.style.setProperty('display', 'block', 'important');
            if (passwordWrapper) {
              passwordWrapper.classList.add('show-password');
            }
          } else {
            // Currently text, will show password - show open eye, hide closed eye
            eyeOpen.style.setProperty('display', 'block', 'important');
            eyeClosed.style.setProperty('display', 'none', 'important');
            if (passwordWrapper) {
              passwordWrapper.classList.remove('show-password');
            }
          }
        }
      }
      
      // Click event
      passwordToggle.addEventListener('click', togglePasswordVisibility);
      
      // Keyboard event (Enter and Space)
      passwordToggle.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          togglePasswordVisibility(e);
        }
      });
    }

    // Get location button
    if (getLocationBtn) {
      getLocationBtn.addEventListener('click', handleGetLocation);
    }

    // Real-time validation
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('blur', () => {
        // Only validate and show errors after user has interacted
        if (input.value || input.type === 'date' || input.type === 'radio' || input.type === 'checkbox') {
          validateField(input);
        }
        // Check section validity after field validation
        const section = input.closest('.form-section');
        if (section) {
          const sectionNum = parseInt(section.dataset.section);
          checkSectionValidity(sectionNum);
          checkFieldDependencies();
        }
      });
      
      input.addEventListener('input', () => {
        if (input.type === 'radio' || input.type === 'checkbox') {
          // For radio/checkbox, validate immediately
          if (input.type === 'radio' && input.name === 'gender') {
            validateGender();
          }
          if (input.type === 'checkbox' && input.name === 'interests') {
            validateInterests();
          }
          // Check section validity
          const section = input.closest('.form-section');
          if (section) {
            const sectionNum = parseInt(section.dataset.section);
            checkSectionValidity(sectionNum);
            checkFieldDependencies();
          }
        } else {
          // For text inputs, clear error on input, validate on blur
          clearError(input);
          // Check section validity in real-time
          const section = input.closest('.form-section');
          if (section) {
            const sectionNum = parseInt(section.dataset.section);
            // Only check if field has value
            if (input.value.trim().length > 0) {
              validateField(input);
            }
            checkSectionValidity(sectionNum);
            checkFieldDependencies();
          }
        }
      });
    });

    // Radio and checkbox validation with immediate feedback
    const radios = form.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
      radio.addEventListener('focus', () => {
        // Mark that user has interacted with gender field
        if (radio.name === 'gender') {
          genderInteracted = true;
        }
      });
      
      radio.addEventListener('change', () => {
        if (radio.name === 'gender') {
          genderInteracted = true;
          validateGender(true);
        }
        // Check section validity
        const section = radio.closest('.form-section');
        if (section) {
          const sectionNum = parseInt(section.dataset.section);
          checkSectionValidity(sectionNum);
          checkFieldDependencies();
        }
      });
      
      radio.addEventListener('blur', () => {
        if (radio.name === 'gender') {
          validateGender(true);
          const section = radio.closest('.form-section');
          if (section) {
            const sectionNum = parseInt(section.dataset.section);
            checkSectionValidity(sectionNum);
          }
        }
      });
    });

    const checkboxes = form.querySelectorAll('input[type="checkbox"][name="interests"]');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        validateInterests();
        // Check section validity
        const section = checkbox.closest('.form-section');
        if (section) {
          const sectionNum = parseInt(section.dataset.section);
          checkSectionValidity(sectionNum);
        }
      });
    });
  }

  // Setup Validation
  function setupValidation() {
    // Set max date for DOB (must be at least 3 years old)
    const dobInput = document.getElementById('dob');
    if (dobInput) {
      const today = new Date();
      const maxDate = new Date(today.getFullYear() - 3, today.getMonth(), today.getDate());
      const minDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
      dobInput.max = maxDate.toISOString().split('T')[0];
      dobInput.min = minDate.toISOString().split('T')[0];
    }
  }

  // Setup Date Validation
  function setupDateValidation() {
    const dobInput = document.getElementById('dob');
    if (dobInput) {
      dobInput.addEventListener('change', function() {
        validateField(this);
      });
    }
  }

  // Setup Character Counter
  function setupCharacterCounter() {
    if (messageTextarea && messageCount) {
      messageTextarea.addEventListener('input', function() {
        const count = this.value.length;
        messageCount.textContent = count;
        if (count > 450) {
          messageCount.parentElement.style.color = 'var(--warning)';
        } else {
          messageCount.parentElement.style.color = 'var(--text-muted)';
        }
      });
    }
  }

  // Field Validation
  function validateField(field) {
    // Skip validation if field is disabled
    if (field.disabled) {
      clearError(field);
      return true; // Consider disabled fields as valid (they'll be validated when enabled)
    }
    
    const fieldId = field.id || field.name;
    const errorElement = document.getElementById(`${fieldId}-error`) || 
                        document.getElementById(`${field.name}-error`);
    
    clearError(field);

    // For radio buttons, validate the group, not individual buttons
    if (field.type === 'radio') {
      const group = form.querySelectorAll(`input[name="${field.name}"]`);
      const checked = Array.from(group).some(r => r.checked);
      if (!checked && field.hasAttribute('required')) {
        if (errorElement) {
          errorElement.textContent = 'Please select an option';
        }
        return false;
      }
      return checked;
    }

    // Skip validation for unchecked checkboxes (handled separately)
    if (field.type === 'checkbox' && !field.checked) {
      return true; // Individual checkbox can be unchecked
    }

    // Check if required field is empty
    if (field.hasAttribute('required')) {
      if (field.type === 'text' || field.type === 'email' || field.type === 'tel' || field.type === 'password') {
        if (!field.value || field.value.trim().length === 0) {
          if (errorElement) {
            errorElement.textContent = 'This field is required';
          }
          field.setAttribute('aria-invalid', 'true');
          return false;
        }
      } else if (field.type === 'date' || field.tagName === 'SELECT') {
        if (!field.value || field.value.trim().length === 0) {
          if (errorElement) {
            errorElement.textContent = 'This field is required';
          }
          field.setAttribute('aria-invalid', 'true');
          return false;
        }
      }
    }

    // Custom validation
    let isValid = field.checkValidity();
    let errorMessage = '';

    if (!isValid) {
      if (field.validity.valueMissing) {
        errorMessage = 'This field is required';
      } else if (field.validity.typeMismatch) {
        if (field.type === 'email') {
          errorMessage = 'Please enter a valid email address';
        } else if (field.type === 'tel') {
          errorMessage = 'Please enter a valid phone number';
        }
      } else if (field.validity.tooShort) {
        errorMessage = `Minimum length is ${field.minLength} characters`;
      } else if (field.validity.tooLong) {
        errorMessage = `Maximum length is ${field.maxLength} characters`;
      } else if (field.validity.patternMismatch) {
        if (field.id === 'password') {
          errorMessage = 'Password must contain at least one letter and one number';
        } else if (field.id === 'phone') {
          errorMessage = 'Please enter a valid phone number';
        }
      } else if (field.validity.rangeUnderflow || field.validity.rangeOverflow) {
        errorMessage = 'Date is out of valid range';
      }
    }

    // Special validations
    if (field.id === 'dob' && field.value) {
      const dob = new Date(field.value);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        const actualAge = age - 1;
        if (actualAge < 3 || actualAge > 18) {
          isValid = false;
          errorMessage = 'Child must be between 3 and 18 years old';
        }
      } else if (age < 3 || age > 18) {
        isValid = false;
        errorMessage = 'Child must be between 3 and 18 years old';
      }
    }

    if (errorMessage && errorElement) {
      errorElement.textContent = errorMessage;
      field.setAttribute('aria-invalid', 'true');
    } else if (errorElement) {
      errorElement.textContent = '';
      field.setAttribute('aria-invalid', 'false');
    }

    return isValid;
  }

  // Validate Interests
  function validateInterests() {
    const interests = form.querySelectorAll('input[name="interests"]:checked');
    const errorElement = document.getElementById('interests-error');
    
    if (interests.length === 0) {
      if (errorElement) {
        errorElement.textContent = 'Please select at least one interest';
      }
      return false;
    } else {
      if (errorElement) {
        errorElement.textContent = '';
      }
      return true;
    }
  }

  // Track if user has interacted with gender field
  let genderInteracted = false;

  // Validate Gender
  function validateGender(showError = true) {
    const gender = form.querySelector('input[name="gender"]:checked');
    const errorElement = document.getElementById('gender-error');
    
    if (!gender) {
      if (errorElement && showError && genderInteracted) {
        errorElement.textContent = 'Please select a gender';
      } else if (errorElement && !genderInteracted) {
        errorElement.textContent = '';
      }
      return false;
    } else {
      if (errorElement) {
        errorElement.textContent = '';
      }
      genderInteracted = true; // Mark as interacted once selected
      return true;
    }
  }

  // Clear Error
  function clearError(field) {
    const fieldId = field.id || field.name;
    const errorElement = document.getElementById(`${fieldId}-error`) || 
                        document.getElementById(`${field.name}-error`);
    if (errorElement) {
      errorElement.textContent = '';
    }
    field.setAttribute('aria-invalid', 'false');
  }

  // Check Section Validity
  function checkSectionValidity(sectionNum, updateButton = true) {
    const section = document.getElementById(`section${sectionNum}`);
    if (!section) return false;

    let isValid = true;

    // Special handling for section 1
    if (sectionNum === 1) {
      const childName = document.getElementById('childName');
      const dob = document.getElementById('dob');
      
      // Check if fields have values and are valid
      const nameValid = childName && childName.value.trim().length >= 3 && validateField(childName);
      const dobValid = dob && dob.value && dob.value.trim().length > 0 && validateField(dob);
      const genderValid = validateGender(false); // Don't show error in validation check
      
      isValid = nameValid && dobValid && genderValid;
    }
    // Special handling for section 3
    else if (sectionNum === 3) {
      const interestsValid = validateInterests();
      const country = document.getElementById('country');
      // Only validate country if it's enabled (meaning interests are selected)
      let countryValid = true;
      if (country) {
        if (country.disabled) {
          // Country is disabled, so it's not required yet - clear any errors
          clearError(country);
          country.removeAttribute('aria-invalid');
          countryValid = true;
        } else {
          // Country is enabled, validate it
          countryValid = country.value && country.value.trim().length > 0 && validateField(country);
        }
      }
      isValid = interestsValid && countryValid;
    }
    // Special handling for section 5 (Review)
    else if (sectionNum === 5) {
      // Check if all previous sections are valid
      isValid = true;
      
      // Section 1
      const childName = document.getElementById('childName');
      const dob = document.getElementById('dob');
      const nameValid = childName && childName.value.trim().length >= 3 && validateField(childName);
      const dobValid = dob && dob.value && dob.value.trim().length > 0 && validateField(dob);
      const genderValid = validateGender(false);
      if (!nameValid || !dobValid || !genderValid) isValid = false;
      
      // Section 2
      const parentName = document.getElementById('parentName');
      const email = document.getElementById('email');
      const phone = document.getElementById('phone');
      const password = document.getElementById('password');
      if (!parentName || parentName.value.trim().length < 3 || !validateField(parentName)) isValid = false;
      if (!email || !email.value || !email.checkValidity() || !validateField(email)) isValid = false;
      if (!phone || !phone.value || !phone.checkValidity() || !validateField(phone)) isValid = false;
      if (!password || !password.value || !password.checkValidity() || !validateField(password)) isValid = false;
      
      // Section 3
      if (!validateInterests()) isValid = false;
      const country = document.getElementById('country');
      if (!country || country.disabled || !country.value || !validateField(country)) isValid = false;
      
      // Section 4
      const address = document.getElementById('address');
      if (!address || !address.value || !validateField(address)) isValid = false;
    }
    // For other sections
    else {
      const requiredFields = section.querySelectorAll('[required]');
      requiredFields.forEach(field => {
        if (field.type === 'radio') {
          const group = form.querySelectorAll(`input[name="${field.name}"]`);
          const checked = Array.from(group).some(r => r.checked);
          if (!checked) isValid = false;
        } else if (field.type === 'checkbox') {
          if (field.name === 'interests') {
            if (!validateInterests()) isValid = false;
          } else if (!field.checked) {
            isValid = false;
          }
        } else {
          // Check if field has value and is valid
          if (!field.value || !validateField(field)) {
            isValid = false;
          }
        }
      });
    }

    // Enable/disable next button or submit button
    if (updateButton) {
      if (sectionNum === 5) {
        // For section 5, update submit button
        if (submitBtn) {
          submitBtn.disabled = !isValid;
        }
      } else {
        const nextBtn = section.querySelector('.btn-next');
        if (nextBtn) {
          nextBtn.disabled = !isValid;
        }
      }
    }

    return isValid;
  }

  // Handle Next
  function handleNext(e) {
    e.preventDefault();

    // Mark gender as interacted if trying to proceed
    if (state.currentSection === 1) {
      genderInteracted = true;
    }
    
    if (!checkSectionValidity(state.currentSection)) {
      // Show gender error if not selected
      if (state.currentSection === 1) {
        validateGender(true);
      }
      
      // Focus first invalid field
      const section = document.getElementById(`section${state.currentSection}`);
      let firstInvalid = section.querySelector('[aria-invalid="true"]');
      
      // If no invalid field found, try to find empty required field
      if (!firstInvalid) {
        const requiredFields = section.querySelectorAll('[required]');
        for (const field of requiredFields) {
          if (field.type === 'radio') {
            const group = form.querySelectorAll(`input[name="${field.name}"]`);
            const checked = Array.from(group).some(r => r.checked);
            if (!checked) {
              firstInvalid = group[0];
              break;
            }
          } else if (!field.value || field.value.trim().length === 0) {
            firstInvalid = field;
            break;
          }
        }
      }
      
      if (firstInvalid) {
        firstInvalid.focus();
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (state.currentSection < state.totalSections) {
      state.currentSection++;
      showSection(state.currentSection);
      
      // If moving to review section, populate it
      if (state.currentSection === 5) {
        populateReview();
      }
    }
  }

  // Handle Previous
  function handlePrev(e) {
    e.preventDefault();
    if (state.currentSection > 1) {
      state.currentSection--;
      showSection(state.currentSection);
    }
  }

  // Show Section
  function showSection(sectionNum) {
    sections.forEach((section, index) => {
      if (index + 1 === sectionNum) {
        section.classList.add('active');
        // Enable fields in this section if previous sections are valid
        checkFieldDependencies();
        
        // For section 5, check validity to enable submit button
        if (sectionNum === 5) {
          setTimeout(() => {
            checkSectionValidity(5);
          }, 100);
        }
        
        // Focus first input in section
        setTimeout(() => {
          const firstInput = section.querySelector('input:not([disabled]), select:not([disabled]), textarea:not([disabled])');
          if (firstInput && firstInput.type !== 'hidden') {
            firstInput.focus();
          }
        }, 100);
      } else {
        section.classList.remove('active');
      }
    });

    // Update progress
    updateProgress();
    
    // Check validity of current section
    checkSectionValidity(sectionNum);
  }

  // Update Progress
  function updateProgress() {
    const progress = (state.currentSection / state.totalSections) * 100;
    progressFill.style.width = `${progress}%`;

    progressSteps.forEach((step, index) => {
      if (index + 1 <= state.currentSection) {
        step.classList.add('active');
      } else {
        step.classList.remove('active');
      }
    });
  }

  // Setup Field Dependencies
  function setupFieldDependencies() {
    // Disable all fields in sections 2-5 initially
    disableSectionsAfter(1);
    
    // Ensure section 1 first field is enabled, others disabled
    const childName = document.getElementById('childName');
    const dob = document.getElementById('dob');
    const genderRadios = form.querySelectorAll('input[name="gender"]');
    
    if (childName) {
      childName.disabled = false;
    }
    
    // Force disable DOB and Gender initially
    if (dob) {
      dob.disabled = true;
    }
    
    genderRadios.forEach(radio => {
      radio.disabled = true;
      const option = radio.closest('.radio-option');
      if (option) {
        option.style.opacity = '0.5';
        option.style.pointerEvents = 'none';
        option.style.cursor = 'not-allowed';
      }
    });
    
    // Setup field-level dependencies within sections
    setupSectionFieldDependencies();
    
    // Re-check dependencies when fields change
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('input', checkFieldDependencies);
      input.addEventListener('change', checkFieldDependencies);
    });
  }

  // Setup field-level dependencies within each section - STRICT SEQUENTIAL
  function setupSectionFieldDependencies() {
    // Section 1: Name -> DOB -> Gender (STRICT: each must be filled before next enables)
    const childName = document.getElementById('childName');
    const dob = document.getElementById('dob');
    const genderRadios = form.querySelectorAll('input[name="gender"]');
    
    // Function to update gender radio states
    function updateGenderRadios(enabled) {
      genderRadios.forEach(radio => {
        radio.disabled = !enabled;
        const option = radio.closest('.radio-option');
        if (option) {
          if (enabled) {
            option.style.opacity = '1';
            option.style.pointerEvents = 'auto';
            option.style.cursor = 'pointer';
          } else {
            radio.checked = false;
            option.style.opacity = '0.5';
            option.style.pointerEvents = 'none';
            option.style.cursor = 'not-allowed';
          }
        }
      });
      if (!enabled) {
        validateGender(false);
      }
    }
    
    // Ensure DOB and Gender are disabled initially
    if (dob) {
      dob.disabled = true;
    }
    updateGenderRadios(false);
    
    if (childName && dob) {
      childName.addEventListener('input', () => {
        const nameValid = childName.value.trim().length >= 3 && validateField(childName);
        dob.disabled = !nameValid;
        
        if (!nameValid) {
          // If name becomes invalid, disable gender
          updateGenderRadios(false);
        } else {
          // Name is valid, but don't enable gender yet - wait for DOB
          // Gender will be enabled when DOB is valid
        }
      });
    }
    
    if (dob && genderRadios.length > 0) {
      dob.addEventListener('change', () => {
        const dobValid = dob.value && dob.value.trim().length > 0 && validateField(dob);
        // Enable gender only if DOB is valid
        updateGenderRadios(dobValid);
      });
      
      // Also check on input for real-time validation
      dob.addEventListener('input', () => {
        const dobValid = dob.value && dob.value.trim().length > 0 && validateField(dob);
        updateGenderRadios(dobValid);
      });
    }

    // Section 2: Parent Name -> Email -> Phone -> Password (STRICT SEQUENTIAL)
    const parentName = document.getElementById('parentName');
    const email = document.getElementById('email');
    const phone = document.getElementById('phone');
    const password = document.getElementById('password');
    
    // Function to reset section 2 dependencies
    function resetSection2Dependencies() {
      // Only enable parent name, disable others
      if (email) email.disabled = true;
      if (phone) phone.disabled = true;
      if (password) password.disabled = true;
    }
    
    // Initially disable all except parent name
    resetSection2Dependencies();
    
    if (parentName && email) {
      parentName.addEventListener('input', () => {
        const nameValid = parentName.value.trim().length >= 3 && validateField(parentName);
        email.disabled = !nameValid;
        if (!nameValid) {
          // If name becomes invalid, disable all subsequent fields
          if (phone) phone.disabled = true;
          if (password) password.disabled = true;
        }
      });
    }
    
    if (email && phone) {
      email.addEventListener('input', () => {
        const emailValid = email.value && email.value.trim().length > 0 && email.checkValidity() && validateField(email);
        phone.disabled = !emailValid;
        if (!emailValid && password) {
          password.disabled = true;
        }
      });
    }
    
    if (phone && password) {
      phone.addEventListener('input', () => {
        const phoneValid = phone.value && phone.value.trim().length > 0 && phone.checkValidity() && validateField(phone);
        password.disabled = !phoneValid;
      });
    }
    
    // Re-check dependencies when section 2 becomes active
    const section2 = document.getElementById('section2');
    if (section2) {
      const observer = new MutationObserver(() => {
        if (section2.classList.contains('active')) {
          // Check if parent name is valid, if not, disable all
          if (parentName && !(parentName.value.trim().length >= 3)) {
            resetSection2Dependencies();
          }
        }
      });
      observer.observe(section2, { attributes: true, attributeFilter: ['class'] });
    }

    // Section 3: Interests -> Country (STRICT: country disabled until interest selected)
    const interests = form.querySelectorAll('input[name="interests"]');
    const country = document.getElementById('country');
    const messageTextarea = document.getElementById('message');
    
    // Disable country and message initially
    if (country) {
      country.disabled = true;
      // Clear any initial error state
      clearError(country);
    }
    if (messageTextarea) {
      messageTextarea.disabled = true;
    }
    
    if (interests.length > 0 && country) {
      interests.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
          const hasInterest = Array.from(interests).some(cb => cb.checked);
          country.disabled = !hasInterest;
          if (hasInterest && messageTextarea) {
            messageTextarea.disabled = false;
            // When country is enabled, clear any error state initially
            // Only show error after user interacts with it
            clearError(country);
            country.setAttribute('aria-invalid', 'false');
            // Reset border color to default
            country.style.borderColor = '';
            // Force border to default color using CSS variable
            country.style.setProperty('border-color', 'var(--border)', 'important');
          } else if (!hasInterest) {
            if (messageTextarea) messageTextarea.disabled = true;
            country.value = ''; // Clear country if interests deselected
            clearError(country);
            // Remove error state when disabled
            country.setAttribute('aria-invalid', 'false');
            country.style.borderColor = '';
            country.style.setProperty('border-color', 'var(--border)', 'important');
          }
        });
      });
    }
    
    // Enable message when country is selected
    if (country && messageTextarea) {
      country.addEventListener('change', () => {
        const countryValid = country.value && country.value.trim().length > 0;
        messageTextarea.disabled = !countryValid;
      });
    }

    // Section 4: Address -> Location button (STRICT)
    const address = document.getElementById('address');
    if (address && getLocationBtn) {
      getLocationBtn.disabled = true;
      address.addEventListener('input', () => {
        const addressValid = address.value.trim().length > 0 && validateField(address);
        getLocationBtn.disabled = !addressValid;
      });
    }
  }

  // Disable sections after a given section number
  function disableSectionsAfter(sectionNum) {
    for (let i = sectionNum + 1; i <= state.totalSections; i++) {
      const section = document.getElementById(`section${i}`);
      if (section) {
        const fields = section.querySelectorAll('input, select, textarea');
        const buttons = section.querySelectorAll('button:not(.btn-prev)');
        fields.forEach(field => {
          field.disabled = true;
        });
        buttons.forEach(btn => {
          btn.disabled = true;
        });
      }
    }
  }

  // Check field dependencies and enable/disable accordingly
  function checkFieldDependencies() {
    // Check each section in order
    for (let i = 1; i <= state.totalSections; i++) {
      const section = document.getElementById(`section${i}`);
      if (!section) continue;

      // Section 1 - only enable first field, others controlled by setupSectionFieldDependencies
      if (i === 1) {
        const childName = document.getElementById('childName');
        if (childName) childName.disabled = false;
        // Don't enable other fields - let setupSectionFieldDependencies handle it
        continue;
      }

      // For other sections, check if previous section is valid
      const prevSection = document.getElementById(`section${i - 1}`);
      if (prevSection) {
        const isPrevValid = checkSectionValidity(i - 1, false); // Don't update button state
        
        if (isPrevValid) {
          // Only enable the FIRST field of the section
          // The sequential dependencies will handle the rest
          if (i === 2) {
            // Section 2: Only enable parent name, explicitly disable others unless prerequisites met
            const parentName = document.getElementById('parentName');
            const email = document.getElementById('email');
            const phone = document.getElementById('phone');
            const password = document.getElementById('password');
            if (parentName) parentName.disabled = false;
            // Explicitly check and disable email, phone, password if prerequisites not met
            // This ensures sequential enabling - only enable if previous field is valid
            if (email) {
              const parentNameValid = parentName && parentName.value && parentName.value.trim().length >= 3;
              if (!parentNameValid) {
                email.disabled = true;
              }
            }
            if (phone) {
              const emailValid = email && email.value && email.value.trim().length > 0 && email.checkValidity();
              if (!emailValid) {
                phone.disabled = true;
              }
            }
            if (password) {
              const phoneValid = phone && phone.value && phone.value.trim().length > 0 && phone.checkValidity();
              if (!phoneValid) {
                password.disabled = true;
              }
            }
          } else if (i === 3) {
            // Section 3: Enable interests checkboxes
            const interests = section.querySelectorAll('input[name="interests"]');
            interests.forEach(cb => cb.disabled = false);
          } else if (i === 4) {
            // Section 4: Enable address
            const address = document.getElementById('address');
            if (address) address.disabled = false;
          } else if (i === 5) {
            // Section 5: Review section - all fields should be enabled (they're just display)
            const fields = section.querySelectorAll('input, select, textarea');
            fields.forEach(field => field.disabled = false);
          }
        } else {
          // Disable current section and all after
          disableSectionsAfter(i - 1);
          break;
        }
      }
    }
  }

  // Setup Voice Recognition
  function setupVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      state.voiceRecognition = new SpeechRecognition();
      state.voiceRecognition.continuous = false;
      state.voiceRecognition.interimResults = false;
      state.voiceRecognition.lang = 'en-US';

      state.voiceRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const activeField = document.querySelector('.voice-input-btn.active');
        if (activeField) {
          const fieldId = activeField.dataset.field;
          const field = document.getElementById(fieldId);
          if (field) {
            field.value = transcript;
            validateField(field);
            field.dispatchEvent(new Event('input'));
          }
        }
        hideVoiceStatus();
      };

      state.voiceRecognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        hideVoiceStatus();
        if (event.error === 'no-speech') {
          showVoiceStatus('No speech detected. Please try again.');
        } else {
          showVoiceStatus('Voice recognition error. Please try again.');
        }
        setTimeout(hideVoiceStatus, 3000);
      };

      state.voiceRecognition.onend = () => {
        hideVoiceStatus();
      };
    } else {
      // Hide voice buttons if not supported
      document.querySelectorAll('.voice-input-btn').forEach(btn => {
        btn.style.display = 'none';
      });
    }
  }

  // Handle Voice Input
  function handleVoiceInput(e) {
    if (!state.voiceRecognition) {
      alert('Voice recognition is not supported in your browser.');
      return;
    }

    const btn = e.currentTarget;
    const fieldId = btn.dataset.field;
    const field = document.getElementById(fieldId);

    if (state.voiceRecognition && state.voiceRecognition.state !== 'listening') {
      btn.classList.add('active');
      showVoiceStatus('Listening... Speak now.');
      state.voiceRecognition.start();
    } else {
      state.voiceRecognition.stop();
      btn.classList.remove('active');
      hideVoiceStatus();
    }
  }

  // Show Voice Status
  function showVoiceStatus(text) {
    voiceStatusText.textContent = text;
    voiceStatus.classList.add('show');
    voiceStatus.setAttribute('aria-hidden', 'false');
  }

  // Hide Voice Status
  function hideVoiceStatus() {
    voiceStatus.classList.remove('show');
    voiceStatus.setAttribute('aria-hidden', 'true');
    document.querySelectorAll('.voice-input-btn').forEach(btn => {
      btn.classList.remove('active');
    });
  }

  // Setup Map
  function setupMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    // Check if Google Maps API is loaded
    if (typeof google === 'undefined' || !google.maps) {
      const placeholder = mapElement.querySelector('.map-placeholder');
      if (placeholder) {
        placeholder.innerHTML = `
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <p>Google Maps API key required. Please add your API key to enable map functionality.</p>
          <p style="font-size: 0.8rem; margin-top: 8px;">You can still enter your address manually.</p>
        `;
      }
      if (getLocationBtn) {
        getLocationBtn.disabled = true;
        getLocationBtn.title = 'Google Maps API key required';
      }
      return;
    }

    // Default location (center of world)
    const defaultLocation = { lat: 20, lng: 0 };
    
    try {
      state.map = new google.maps.Map(mapElement, {
        zoom: 2,
        center: defaultLocation,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
      });

      state.mapMarker = new google.maps.Marker({
        map: state.map,
        title: 'Your Location'
      });
    } catch (error) {
      console.error('Error initializing map:', error);
      const placeholder = mapElement.querySelector('.map-placeholder');
      if (placeholder) {
        placeholder.innerHTML = `
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <p>Map could not be loaded. Please check your API key.</p>
        `;
      }
    }
  }

  // Handle Get Location
  function handleGetLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    if (!state.map && (typeof google === 'undefined' || !google.maps)) {
      alert('Google Maps API is not loaded. Please add your API key to enable map functionality.');
      return;
    }

    getLocationBtn.disabled = true;
    getLocationBtn.innerHTML = 'Getting location...';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        state.userLocation = { lat, lng };

        if (state.map) {
          state.map.setCenter({ lat, lng });
          state.map.setZoom(15);
          
          if (state.mapMarker) {
            state.mapMarker.setPosition({ lat, lng });
          } else if (typeof google !== 'undefined' && google.maps) {
            state.mapMarker = new google.maps.Marker({
              map: state.map,
              position: { lat, lng },
              title: 'Your Location'
            });
          }

          // Reverse geocoding to get address
          if (typeof google !== 'undefined' && google.maps && google.maps.Geocoder) {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
              if (status === 'OK' && results[0]) {
                const addressInput = document.getElementById('address');
                if (addressInput) {
                  addressInput.value = results[0].formatted_address;
                  validateField(addressInput);
                }
              }
            });
          }
        }

        getLocationBtn.disabled = false;
        getLocationBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          Location Found
        `;
        getLocationBtn.style.background = 'var(--success)';
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMsg = 'Unable to retrieve your location. ';
        if (error.code === 1) {
          errorMsg += 'Please allow location access and try again.';
        } else if (error.code === 2) {
          errorMsg += 'Location unavailable.';
        } else {
          errorMsg += 'Please enter it manually.';
        }
        alert(errorMsg);
        getLocationBtn.disabled = false;
        getLocationBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          Get My Location
        `;
        getLocationBtn.style.background = '';
      }
    );
  }

  // Setup Keyboard Navigation
  function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // Tab navigation is handled by browser
      // Arrow keys for section navigation
      if (e.altKey) {
        if (e.key === 'ArrowRight' && state.currentSection < state.totalSections) {
          e.preventDefault();
          const nextBtn = document.querySelector(`#section${state.currentSection} .btn-next`);
          if (nextBtn && !nextBtn.disabled) {
            nextBtn.click();
          }
        } else if (e.key === 'ArrowLeft' && state.currentSection > 1) {
          e.preventDefault();
          const prevBtn = document.querySelector(`#section${state.currentSection} .btn-prev`);
          if (prevBtn) {
            prevBtn.click();
          }
        }
      }

      // Enter key to submit if on last section
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && state.currentSection === state.totalSections) {
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn && !submitBtn.disabled && document.activeElement === submitBtn) {
          e.preventDefault();
          form.dispatchEvent(new Event('submit'));
        }
      }
    });
  }

  // Populate Review
  function populateReview() {
    const data = new FormData(form);
    const entries = {};
    
    for (const [key, value] of data.entries()) {
      if (key === 'interests') {
        entries.interests = entries.interests || [];
        entries.interests.push(value);
      } else {
        entries[key] = value;
      }
    }

    reviewSummary.innerHTML = `
      <div class="review-item">
        <div class="review-item-label">Child's Name</div>
        <div class="review-item-value">${entries.childName || 'Not provided'}</div>
      </div>
      <div class="review-item">
        <div class="review-item-label">Date of Birth</div>
        <div class="review-item-value">${entries.dob || 'Not provided'}</div>
      </div>
      <div class="review-item">
        <div class="review-item-label">Gender</div>
        <div class="review-item-value">${entries.gender ? entries.gender.charAt(0).toUpperCase() + entries.gender.slice(1) : 'Not provided'}</div>
      </div>
      <div class="review-item">
        <div class="review-item-label">Parent/Guardian Name</div>
        <div class="review-item-value">${entries.parentName || 'Not provided'}</div>
      </div>
      <div class="review-item">
        <div class="review-item-label">Email</div>
        <div class="review-item-value">${entries.email || 'Not provided'}</div>
      </div>
      <div class="review-item">
        <div class="review-item-label">Phone</div>
        <div class="review-item-value">${entries.phone || 'Not provided'}</div>
      </div>
      <div class="review-item">
        <div class="review-item-label">Interests</div>
        <div class="review-item-value">${entries.interests ? entries.interests.join(', ') : 'Not provided'}</div>
      </div>
      <div class="review-item">
        <div class="review-item-label">Country</div>
        <div class="review-item-value">${entries.country || 'Not provided'}</div>
      </div>
      <div class="review-item">
        <div class="review-item-label">Address</div>
        <div class="review-item-value">${entries.address || 'Not provided'}</div>
      </div>
      ${entries.message ? `
      <div class="review-item">
        <div class="review-item-label">Additional Information</div>
        <div class="review-item-value">${entries.message}</div>
      </div>
      ` : ''}
    `;
  }

  // Handle Submit
  function handleSubmit(e) {
    e.preventDefault();

    // Validate all sections
    let isValid = true;
    for (let i = 1; i <= state.totalSections; i++) {
      if (!checkSectionValidity(i)) {
        isValid = false;
        if (i < state.currentSection) {
          showSection(i);
          break;
        }
      }
    }

    if (!isValid) {
      result.textContent = 'Please fix the errors before submitting.';
      result.style.background = 'var(--error)';
      result.classList.add('show');
      setTimeout(() => {
        result.classList.remove('show');
      }, 5000);
      return;
    }

    // Collect form data
    const data = new FormData(form);
    const entries = {};
    
    for (const [key, value] of data.entries()) {
      if (key === 'interests') {
        entries.interests = entries.interests || [];
        entries.interests.push(value);
      } else {
        entries[key] = value;
      }
    }

    // Show success message
    result.textContent = 'Registration submitted successfully! Thank you for joining Kidedu.';
    result.style.background = 'var(--success)';
    result.classList.add('show');

    // Scroll to result
    result.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Log data (in real app, this would be sent to server)
    console.log('Form Data:', entries);

    // Reset form after delay
    setTimeout(() => {
      form.reset();
      state.currentSection = 1;
      showSection(1);
      result.classList.remove('show');
      state.userLocation = null;
      if (state.mapMarker) {
        state.mapMarker.setMap(null);
        state.mapMarker = null;
      }
    }, 5000);
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
