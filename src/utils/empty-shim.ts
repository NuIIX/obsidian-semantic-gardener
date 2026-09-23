// Browser empty shim for Node-only modules
export default {};
export const promises = {};
export const readFileSync = () => {};
export const existsSync = () => false;
