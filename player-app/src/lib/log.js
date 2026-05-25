// Tiny prefixed logger. Replace with a remote sink later if needed.
const PREFIX = '[kiosk]';
export const log  = (...a) => console.log(PREFIX, ...a);
export const warn = (...a) => console.warn(PREFIX, ...a);
export const err  = (...a) => console.error(PREFIX, ...a);
