import axios from 'axios';
window.axios = axios;

window.axios.defaults.withCredentials = true;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

/**
 * Laravel's CSRF protection works through the XSRF-TOKEN cookie. Axios
 * automatically sends it as the X-XSRF-TOKEN header on same-origin
 * requests, so the cookie only needs to be readable by JavaScript.
 */
let token: HTMLMetaElement | null = document.head.querySelector(
    'meta[name="csrf-token"]',
);

if (token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
}
