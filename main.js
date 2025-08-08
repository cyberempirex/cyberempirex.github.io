/**
 * CyberEmpireX - Main JavaScript File
 * Version: 2.1.0
 * Description: Core functionality and interactive elements
 */

// Configuration Constants
const CONFIG = {
  animationThreshold: 0.2,
  scrollOffset: 80,
  counterSpeed: 200,
  formResetDelay: 5000,
  observerRootMargin: '0px 0px -100px 0px'
};

// DOM Ready Handler
document.addEventListener('DOMContentLoaded', function() {
  initApplication();
});

/**
 * Main Application Initializer
 */
function initApplication() {
  setupMobileNavigation();
  setupSmoothScrolling();
  setupBackToTop();
  setupCounters();
  setupSkillBars();
  setupNewsletterForm();
  setupIntersectionObserver();
  setupTooltips();
  setupThemeSwitcher();
  setupSecurityConsole();
  setupTerminalEffects();
  setupPasswordGenerator();
  setupCopyButtons();
  setupSessionTimeout();
}

/**
 * Mobile Navigation Setup
 */
function setupMobileNavigation() {
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  
  if (!mobileMenuBtn || !navLinks) return;

  mobileMenuBtn.addEventListener('click', function() {
    const isActive = navLinks.classList.toggle('active');
    this.innerHTML = isActive ? 
      '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    document.body.style.overflow = isActive ? 'hidden' : '';
  });

  // Close when clicking outside
  document.addEventListener('click', function(e) {
    if (!navLinks.contains(e.target) && 
        !mobileMenuBtn.contains(e.target) &&
        navLinks.classList.contains('active')) {
      navLinks.classList.remove('active');
      mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
      document.body.style.overflow = '';
    }
  });
}

/**
 * Smooth Scrolling Setup
 */
function setupSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const target = document.querySelector(targetId);
      
      if (target) {
        window.scrollTo({
          top: target.offsetTop - CONFIG.scrollOffset,
          behavior: 'smooth'
        });
        
        // Update URL without page jump
        history.pushState(null, null, targetId);
      }
    });
  });
}

/**
 * Back to Top Button Setup
 */
function setupBackToTop() {
  const backToTop = document.querySelector('.back-to-top');
  if (!backToTop) return;

  window.addEventListener('scroll', throttle(function() {
    backToTop.classList.toggle('active', window.scrollY > 300);
  }, 100));

  backToTop.addEventListener('click', function(e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/**
 * Animated Counters Setup
 */
function setupCounters() {
  const counters = document.querySelectorAll('.stat-number');
  if (!counters.length) return;

  const animateCounters = () => {
    counters.forEach(counter => {
      const target = +counter.getAttribute('data-count');
      const count = +counter.textContent.replace(/,/g, '');
      const increment = target / CONFIG.counterSpeed;
      
      if (count < target) {
        counter.textContent = Math.ceil(count + increment).toLocaleString();
        requestAnimationFrame(animateCounters);
      } else {
        counter.textContent = target.toLocaleString();
      }
    });
  };

  // Will be triggered by IntersectionObserver
  window.countersAnimation = animateCounters;
}

/**
 * Skill Bars Animation Setup
 */
function setupSkillBars() {
  const skillBars = document.querySelectorAll('.skill-progress-bar');
  if (!skillBars.length) return;

  skillBars.forEach(bar => {
    const percent = bar.parentElement.querySelector('.skill-percent').textContent;
    bar.setAttribute('data-width', percent);
    bar.style.width = '0';
  });

  // Will be triggered by IntersectionObserver
  window.animateSkillBars = function() {
    document.querySelectorAll('.skill-progress-bar').forEach(bar => {
      const width = bar.getAttribute('data-width');
      bar.style.width = width;
    });
  };
}

/**
 * Newsletter Form Setup
 */
function setupNewsletterForm() {
  const newsletterForm = document.querySelector('.newsletter-form');
  if (!newsletterForm) return;

  newsletterForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const emailInput = this.querySelector('input[type="email"]');
    const email = emailInput.value.trim();

    if (!validateEmail(email)) {
      showFormError(this, 'Please enter a valid email address');
      return;
    }

    showFormSuccess(this);
    setTimeout(() => resetForm(this), CONFIG.formResetDelay);
  });
}

/**
 * Form Validation Helper
 */
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Show Form Success State
 */
function showFormSuccess(form) {
  form.innerHTML = `
    <div class="form-success">
      <i class="fas fa-check-circle"></i>
      <p>Thank you for subscribing! Check your email for confirmation.</p>
    </div>
  `;
}

/**
 * Show Form Error State
 */
function showFormError(form, message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'form-error';
  errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i><p>${message}</p>`;
  form.parentNode.insertBefore(errorDiv, form.nextSibling);
  
  setTimeout(() => {
    errorDiv.classList.add('fade-out');
    setTimeout(() => errorDiv.remove(), 300);
  }, 3000);
}

/**
 * Reset Form to Initial State
 */
function resetForm(form) {
  form.innerHTML = `
    <input type="email" class="newsletter-input" placeholder="Your professional email" required>
    <button type="submit" class="newsletter-btn">Subscribe</button>
  `;
}

/**
 * Intersection Observer Setup
 */
function setupIntersectionObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Section-specific animations
        if (entry.target.classList.contains('stats')) {
          if (typeof window.countersAnimation === 'function') {
            window.countersAnimation();
          }
          if (typeof window.animateSkillBars === 'function') {
            window.animateSkillBars();
          }
        }

        // Generic animation triggers
        entry.target.querySelectorAll('[class*="animate-"]').forEach(el => {
          const animationClass = Array.from(el.classList).find(c => c.startsWith('animate-'));
          if (animationClass) {
            el.classList.add('animated', animationClass.replace('animate-', ''));
          }
        });
      }
    });
  }, {
    threshold: CONFIG.animationThreshold,
    rootMargin: CONFIG.observerRootMargin
  });

  // Observe all sections
  document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
  });
}

/**
 * Tooltips Setup
 */
function setupTooltips() {
  const tooltipElements = document.querySelectorAll('[data-tooltip]');
  if (!tooltipElements.length) return;

  // Create tooltip container
  const tooltip = document.createElement('div');
  tooltip.className = 'custom-tooltip';
  document.body.appendChild(tooltip);

  tooltipElements.forEach(el => {
    el.addEventListener('mouseenter', function(e) {
      const text = this.getAttribute('data-tooltip');
      const position = this.getAttribute('data-tooltip-pos') || 'top';
      
      tooltip.textContent = text;
      tooltip.className = `custom-tooltip show ${position}`;
      
      const rect = this.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      
      let left, top;
      
      switch(position) {
        case 'top':
          left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
          top = rect.top - tooltipRect.height - 10;
          break;
        case 'bottom':
          left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
          top = rect.bottom + 10;
          break;
        case 'left':
          left = rect.left - tooltipRect.width - 10;
          top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
          break;
        case 'right':
          left = rect.right + 10;
          top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
          break;
      }
      
      tooltip.style.left = `${Math.max(10, left)}px`;
      tooltip.style.top = `${Math.max(10, top)}px`;
    });

    el.addEventListener('mouseleave', function() {
      tooltip.className = 'custom-tooltip';
    });
  });
}

/**
 * Theme Switcher Setup
 */
function setupThemeSwitcher() {
  const themeSwitcher = document.querySelector('#theme-switcher');
  if (!themeSwitcher) return;

  const currentTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);

  themeSwitcher.addEventListener('click', function() {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    this.innerHTML = newTheme === 'dark' ? 
      '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
  });

  // Set initial icon
  themeSwitcher.innerHTML = currentTheme === 'dark' ? 
    '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
}

/**
 * Security Console Effect
 */
function setupSecurityConsole() {
  const consoleElement = document.querySelector('.security-console');
  if (!consoleElement) return;

  const messages = [
    "Initializing security protocols...",
    "Scanning network interfaces...",
    "Firewall: ACTIVE",
    "Intrusion detection: ENABLED",
    "All systems operational",
    "Welcome to CyberEmpireX"
  ];

  let index = 0;
  consoleElement.textContent = "> ";

  const typeWriter = () => {
    if (index < messages.length) {
      const message = messages[index];
      let charIndex = 0;
      
      const typing = setInterval(() => {
        if (charIndex < message.length) {
          consoleElement.textContent += message.charAt(charIndex);
          charIndex++;
          consoleElement.scrollTop = consoleElement.scrollHeight;
        } else {
          clearInterval(typing);
          setTimeout(() => {
            consoleElement.textContent += "\n> ";
            index++;
            typeWriter();
          }, 1000);
        }
      }, 50);
    } else {
      // Loop the animation
      index = 0;
      setTimeout(() => {
        consoleElement.textContent = "> ";
        typeWriter();
      }, 3000);
    }
  };

  typeWriter();
}

/**
 * Terminal Typing Effect
 */
function setupTerminalEffects() {
  const terminals = document.querySelectorAll('.terminal');
  if (!terminals.length) return;

  terminals.forEach(terminal => {
    const text = terminal.getAttribute('data-text') || '';
    terminal.textContent = '';
    let charIndex = 0;
    
    const typing = setInterval(() => {
      if (charIndex < text.length) {
        terminal.textContent += text.charAt(charIndex);
        charIndex++;
      } else {
        clearInterval(typing);
        // Add blinking cursor
        terminal.innerHTML += '<span class="cursor">|</span>';
      }
    }, 50);
  });
}

/**
 * Password Generator Setup
 */
function setupPasswordGenerator() {
  const generator = document.querySelector('.password-generator');
  if (!generator) return;

  const output = generator.querySelector('.password-output');
  const lengthSlider = generator.querySelector('.length-slider');
  const lengthValue = generator.querySelector('.length-value');
  const generateBtn = generator.querySelector('.generate-btn');
  const copyBtn = generator.querySelector('.copy-btn');

  // Update length display
  lengthSlider.addEventListener('input', function() {
    lengthValue.textContent = this.value;
  });

  // Generate password
  generateBtn.addEventListener('click', function() {
    const length = lengthSlider.value;
    const includeUpper = generator.querySelector('#include-upper').checked;
    const includeLower = generator.querySelector('#include-lower').checked;
    const includeNumbers = generator.querySelector('#include-numbers').checked;
    const includeSymbols = generator.querySelector('#include-symbols').checked;
    
    output.value = generatePassword(length, includeUpper, includeLower, includeNumbers, includeSymbols);
  });

  // Copy to clipboard
  copyBtn.addEventListener('click', function() {
    if (!output.value) return;
    
    output.select();
    document.execCommand('copy');
    
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
    
    setTimeout(() => {
      copyBtn.innerHTML = originalText;
    }, 2000);
  });
}

/**
 * Generate Random Password
 */
function generatePassword(length, upper, lower, numbers, symbols) {
  const charset = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
  };

  let selectedChars = '';
  if (upper) selectedChars += charset.upper;
  if (lower) selectedChars += charset.lower;
  if (numbers) selectedChars += charset.numbers;
  if (symbols) selectedChars += charset.symbols;

  if (!selectedChars) return '';

  let password = '';
  for (let i = 0; i < length; i++) {
    password += selectedChars.charAt(Math.floor(Math.random() * selectedChars.length));
  }

  return password;
}

/**
 * Copy Buttons Setup
 */
function setupCopyButtons() {
  document.querySelectorAll('[data-copy]').forEach(button => {
    button.addEventListener('click', function() {
      const target = document.querySelector(this.getAttribute('data-copy'));
      if (!target) return;
      
      const textToCopy = target.textContent || target.value;
      navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = this.innerHTML;
        this.innerHTML = '<i class="fas fa-check"></i> Copied!';
        
        setTimeout(() => {
          this.innerHTML = originalText;
        }, 2000);
      });
    });
  });
}

/**
 * Session Timeout Warning
 */
function setupSessionTimeout() {
  let timeout;
  const warningTime = 10 * 60 * 1000; // 10 minutes
  const logoutTime = 15 * 60 * 1000; // 15 minutes

  function startTimer() {
    timeout = setTimeout(showTimeoutWarning, warningTime);
    document.addEventListener('mousemove', resetTimer);
    document.addEventListener('keypress', resetTimer);
  }

  function resetTimer() {
    clearTimeout(timeout);
    startTimer();
  }

  function showTimeoutWarning() {
    const warning = document.createElement('div');
    warning.className = 'session-warning';
    warning.innerHTML = `
      <div class="warning-content">
        <h3>Session About to Expire</h3>
        <p>You will be logged out in 5 minutes due to inactivity.</p>
        <button class="btn btn-primary" id="extend-session">Continue Session</button>
      </div>
    `;
    
    document.body.appendChild(warning);
    
    document.getElementById('extend-session').addEventListener('click', function() {
      warning.remove();
      resetTimer();
    });

    // Final logout timer
    setTimeout(() => {
      warning.querySelector('.warning-content').innerHTML = `
        <h3>Session Expired</h3>
        <p>You have been logged out due to inactivity.</p>
        <a href="/login" class="btn btn-primary">Login Again</a>
      `;
    }, logoutTime - warningTime);
  }

  startTimer();
}

/**
 * Throttle Function for Performance
 */
function throttle(func, limit) {
  let lastFunc;
  let lastRan;
  return function() {
    const context = this;
    const args = arguments;
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function() {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}
