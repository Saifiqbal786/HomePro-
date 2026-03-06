const API_BASE = window.location.origin + '/api';

module.exports = { API_BASE };

// Also export as global for non-module scripts
if (typeof window !== 'undefined') {
    window.API_CONFIG = { API_BASE };
}
