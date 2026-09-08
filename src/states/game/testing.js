export const isTestingMode = import.meta.env.VITE_TESTING === 't' || localStorage.getItem('testModifiers') === '1';
