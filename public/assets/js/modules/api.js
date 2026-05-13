/**
 * API module — fetch wrapper for all backend communication.
 * Provides consistent error handling and JSON parsing.
 */
const API = (() => {
    function getBase() {
        return (typeof window !== 'undefined' && typeof window.BASE_PATH === 'string')
            ? window.BASE_PATH
            : '';
    }

    /**
     * Send a request to the API.
     * @param {string} endpoint - e.g. '/api/diagrams'
     * @param {object} options - fetch options
     * @returns {Promise<object>} parsed JSON response
     */
    async function request(endpoint, options = {}) {
        const url = getBase() + endpoint;

        const defaults = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        };

        const config = { ...defaults, ...options };
        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        const response = await fetch(url, config);
        const data = await response.json().catch(() => ({
            success: false,
            message: 'Invalid server response',
        }));

        if (!response.ok) {
            throw new ApiError(data.message || `HTTP ${response.status}`, response.status, data);
        }

        return data;
    }

    /** GET request */
    async function get(endpoint) {
        return request(endpoint, { method: 'GET' });
    }

    /** POST request */
    async function post(endpoint, body = {}) {
        return request(endpoint, { method: 'POST', body });
    }

    /** PUT request */
    async function put(endpoint, body = {}) {
        return request(endpoint, { method: 'PUT', body });
    }

    /** DELETE request */
    async function del(endpoint) {
        return request(endpoint, { method: 'DELETE' });
    }

    class ApiError extends Error {
        constructor(message, status, data) {
            super(message);
            this.name = 'ApiError';
            this.status = status;
            this.data = data;
        }
    }

    return { get, post, put, del, ApiError };
})();
