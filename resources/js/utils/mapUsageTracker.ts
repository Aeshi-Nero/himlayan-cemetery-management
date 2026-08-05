const STORAGE_KEY = 'himlayan_map_usage_count';
const DEFAULT_BASELINE = 0;

export const getMapUsageCount = async (): Promise<number> => {
    try {
        const res = await window.axios.get('/api/stats/map-usage');
        if (res.data?.success && typeof res.data.count === 'number') {
            localStorage.setItem(STORAGE_KEY, String(res.data.count));
            return res.data.count;
        }
    } catch (err) {
        console.warn('Falling back to local storage map usage count:', err);
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_BASELINE;
};

export const incrementMapUsageCount = async (): Promise<number> => {
    try {
        const res = await window.axios.post('/api/stats/map-usage/increment');
        if (res.data?.success && typeof res.data.count === 'number') {
            localStorage.setItem(STORAGE_KEY, String(res.data.count));
            window.dispatchEvent(
                new CustomEvent('himlayan_map_usage_updated', { detail: res.data.count }),
            );
            return res.data.count;
        }
    } catch (err) {
        console.warn('Falling back to local increment for map usage count:', err);
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    const current = saved ? parseInt(saved, 10) : DEFAULT_BASELINE;
    const next = current + 1;
    localStorage.setItem(STORAGE_KEY, String(next));
    window.dispatchEvent(new CustomEvent('himlayan_map_usage_updated', { detail: next }));
    return next;
};
