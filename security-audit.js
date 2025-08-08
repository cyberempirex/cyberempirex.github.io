/**
 * CyberEmpireX Security Audit & Monitoring System
 * Version: 3.2.1
 * Description: Real-time security monitoring, threat detection, and analytics
 */

class SecurityAudit {
  constructor() {
    this.config = {
      scanInterval: 30000, // 30 seconds
      maxRequestRate: 5, // Max 5 requests/second
      xssPatterns: [
        /<script\b[^>]*>([\s\S]*?)<\/script>/gi,
        /javascript:[^"']+/gi,
        /on\w+="[^"]+"|on\w+='[^']+'/gi
      ],
      sqlPatterns: [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|ALTER)\b)/gi,
        /(\b(OR|AND)\s+['"\d\w]+\s*=\s*['"\d\w]+)/gi
      ],
      allowedOrigins: [
        'https://cyberempirex.github.io',
        'https://github.com/CyberEmpireX'
      ]
    };
    
    this.state = {
      requests: [],
      threatsDetected: 0,
      lastScan: Date.now(),
      sessionStart: Date.now()
    };
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.startScanner();
    this.checkEnvironment();
    this.monitorDOMChanges();
    this.setupHeartbeat();
    console.log('%c[SecurityAudit] Initialized', 'color: #38b2ac; font-weight: bold;');
  }

  setupEventListeners() {
    // Monitor all outgoing links
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && link.href && !link.href.startsWith(window.location.origin)) {
        this.logEvent('ExternalNavigation', {
          url: link.href,
          text: link.textContent.trim()
        });
      }
    });

    // Form submission monitoring
    document.addEventListener('submit', (e) => {
      const form = e.target;
      const inputs = Array.from(form.elements).filter(el => el.name);
      const data = inputs.reduce((obj, el) => {
        obj[el.name] = el.value;
        return obj;
      }, {});
      
      this.logEvent('FormSubmission', {
        formId: form.id || form.name || 'anonymous',
        action: form.action,
        method: form.method,
        data: this.sanitize(data)
      });
    });

    // AJAX request monitoring
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [resource, config] = args;
      this.logEvent('APICall', {
        endpoint: typeof resource === 'string' ? resource : resource.url,
        method: config?.method || 'GET',
        headers: config?.headers,
        timestamp: Date.now()
      });
      
      try {
        const response = await originalFetch(...args);
        if (!response.ok) {
          this.logThreat('SuspiciousResponse', {
            status: response.status,
            url: response.url
          });
        }
        return response;
      } catch (error) {
        this.logThreat('FetchError', {
          error: error.message,
          stack: error.stack
        });
        throw error;
      }
    };
  }

  startScanner() {
    this.scannerInterval = setInterval(() => {
      this.scanPage();
      this.checkRequestRate();
      this.detectMaliciousPayloads();
    }, this.config.scanInterval);
  }

  scanPage() {
    // Check for tampered elements
    const scripts = Array.from(document.scripts);
    scripts.forEach(script => {
      if (!script.src && script.textContent.length > 0) {
        this.checkForThreats(script.textContent, 'InlineScript');
      }
    });

    // Check iframe sources
    document.querySelectorAll('iframe').forEach(iframe => {
      if (!this.config.allowedOrigins.some(origin => iframe.src.startsWith(origin))) {
        this.logThreat('SuspiciousIframe', {
          src: iframe.src,
          parent: iframe.parentElement?.tagName
        });
      }
    });

    // Check for data URIs
    document.querySelectorAll('[src^="data:"]').forEach(el => {
      this.logEvent('DataURIUsage', {
        tag: el.tagName,
        type: el.src.split(';')[0].replace('data:', '')
      });
    });

    this.state.lastScan = Date.now();
  }

  checkRequestRate() {
    const now = Date.now();
    this.state.requests = this.state.requests.filter(
      req => now - req.timestamp < 1000
    );
    
    if (this.state.requests.length > this.config.maxRequestRate) {
      this.logThreat('RequestFlood', {
        count: this.state.requests.length,
        lastRequest: this.state.requests[this.state.requests.length - 1]
      });
    }
  }

  detectMaliciousPayloads() {
    // Check URL parameters
    const params = new URLSearchParams(window.location.search);
    params.forEach((value, key) => {
      this.checkForThreats(value, `URLParam:${key}`);
    });

    // Check localStorage/sessionStorage
    if (window.localStorage.length > 0) {
      Object.keys(localStorage).forEach(key => {
        this.checkForThreats(localStorage.getItem(key), `LocalStorage:${key}`);
      });
    }

    // Check cookies
    document.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.split('=');
      if (value) this.checkForThreats(value.trim(), `Cookie:${name.trim()}`);
    });
  }

  checkForThreats(content, context) {
    let threatFound = false;
    
    // XSS detection
    this.config.xssPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        this.logThreat('XSSAttempt', {
          pattern: pattern.toString(),
          context,
          snippet: content.substring(0, 100)
        });
        threatFound = true;
      }
    });

    // SQLi detection
    this.config.sqlPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        this.logThreat('SQLiAttempt', {
          pattern: pattern.toString(),
          context,
          snippet: content.substring(0, 100)
        });
        threatFound = true;
      }
    });

    return threatFound;
  }

  monitorDOMChanges() {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            this.logEvent('DOMInsertion', {
              tag: node.tagName,
              parent: mutation.target.tagName,
              content: node.textContent.substring(0, 200)
            });
            
            // Check injected scripts
            if (node.tagName === 'SCRIPT' && node.src) {
              this.logThreat('DynamicScriptLoad', {
                src: node.src,
                integrity: node.integrity || 'none'
              });
            }
          }
        });
      });
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    });
  }

  checkEnvironment() {
    // Check if DevTools is open
    const devtools = /./;
    devtools.toString = function() {
      this.opened = true;
      return '';
    };
    
    console.log('%c', devtools);
    window.addEventListener('devtoolschange', (e) => {
      this.logThreat('DevToolsAccess', {
        timestamp: Date.now(),
        isOpen: e.detail.isOpen
      });
    });

    // Check for browser extensions
    const extensionIds = [
      'nmebbcjdbhgggcgoklncipoddhgokdgg' // Sample extension ID
    ];
    
    extensionIds.forEach(id => {
      const img = new Image();
      img.src = `chrome-extension://${id}/manifest.json`;
      img.onload = () => {
        this.logEvent('ExtensionDetected', { extensionId: id });
      };
      img.onerror = () => {};
    });

    // Check if running in iframe
    if (window.self !== window.top) {
      this.logThreat('FramedPage', {
        parentUrl: document.referrer
      });
    }
  }

  setupHeartbeat() {
    setInterval(() => {
      const sessionDuration = Date.now() - this.state.sessionStart;
      const metrics = {
        threats: this.state.threatsDetected,
        domSize: document.getElementsByTagName('*').length,
        memory: window.performance.memory?.usedJSHeapSize || 0,
        duration: sessionDuration
      };
      
      this.logEvent('Heartbeat', metrics);
      
      // Send to analytics (simulated)
      if (navigator.onLine) {
        this.sendToAnalytics(metrics);
      }
    }, 60000);
  }

  sendToAnalytics(data) {
    const endpoint = 'https://analytics.cyberempirex.io/v1/telemetry';
    const payload = {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      data: this.sanitize(data)
    };
    
    navigator.sendBeacon(endpoint, JSON.stringify(payload));
  }

  logEvent(type, data) {
    const event = {
      type,
      timestamp: Date.now(),
      data: this.sanitize(data)
    };
    
    this.state.requests.push(event);
    console.debug('[SecurityAudit] Event:', event);
  }

  logThreat(type, data) {
    this.state.threatsDetected++;
    const threat = {
      type,
      severity: this.getThreatLevel(type),
      timestamp: Date.now(),
      data: this.sanitize(data),
      stack: new Error().stack
    };
    
    console.warn('[SecurityAudit] Threat detected:', threat);
    this.showWarning(threat);
    
    // Send threat report
    this.sendThreatReport(threat);
  }

  getThreatLevel(type) {
    const levels = {
      'XSSAttempt': 'high',
      'SQLiAttempt': 'critical',
      'RequestFlood': 'medium',
      'FramedPage': 'low',
      'DynamicScriptLoad': 'high',
      'DevToolsAccess': 'medium'
    };
    
    return levels[type] || 'medium';
  }

  showWarning(threat) {
    if (document.getElementById('security-alert')) return;
    
    const alert = document.createElement('div');
    alert.id = 'security-alert';
    alert.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 15px;
      background: #ff6b6b;
      color: white;
      border-radius: 5px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 9999;
      max-width: 400px;
      animation: slideIn 0.3s ease-out;
    `;
    
    alert.innerHTML = `
      <h3 style="margin: 0 0 10px 0;">Security Alert</h3>
      <p style="margin: 0 0 10px 0;">
        ${threat.type} detected (${threat.severity} severity)
      </p>
      <button id="dismiss-alert" style="
        background: white;
        border: none;
        padding: 5px 10px;
        border-radius: 3px;
        cursor: pointer;
      ">Dismiss</button>
    `;
    
    document.body.appendChild(alert);
    
    document.getElementById('dismiss-alert').addEventListener('click', () => {
      alert.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => alert.remove(), 300);
    });
  }

  sendThreatReport(threat) {
    const endpoint = 'https://api.cyberempirex.io/v1/threats';
    const payload = {
      ...threat,
      page: window.location.href,
      referrer: document.referrer,
      cookies: document.cookie.length > 0
    };
    
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Security-Token': 'cyberempirex-audit-system'
      },
      body: JSON.stringify(payload)
    }).catch(error => {
      console.error('[SecurityAudit] Failed to send threat report:', error);
    });
  }

  sanitize(input) {
    if (typeof input !== 'object' || input === null) {
      return input;
    }
    
    const output = Array.isArray(input) ? [] : {};
    for (const key in input) {
      if (typeof input[key] === 'string') {
        output[key] = input[key].replace(/</g, '&lt;').replace(/>/g, '&gt;');
      } else {
        output[key] = this.sanitize(input[key]);
      }
    }
    return output;
  }

  destroy() {
    clearInterval(this.scannerInterval);
    console.log('%c[SecurityAudit] Shutdown', 'color: #ff6b6b; font-weight: bold;');
  }
}

// Initialize with enhanced error handling
try {
  if (window.SecurityAudit) {
    console.warn('[SecurityAudit] Already initialized');
  } else {
    window.SecurityAudit = new SecurityAudit();
    
    // Add cleanup on page unload
    window.addEventListener('beforeunload', () => {
      window.SecurityAudit?.destroy();
    });
  }
} catch (error) {
  console.error('[SecurityAudit] Initialization failed:', error);
}

// DevTools detection (additional method)
(function() {
  const element = new Image();
  Object.defineProperty(element, 'id', {
    get: function() {
      window.dispatchEvent(new CustomEvent('devtoolschange', {
        detail: { isOpen: true }
      }));
    }
  });
  
  console.log('%c', element);
  console.clear();
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SecurityAudit;
      }
