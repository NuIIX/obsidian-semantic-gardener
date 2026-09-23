// Browser empty shim for Node-only modules
// Uses Proxy to keep Object.keys(shim).length === 0 (so @xenova/transformers detects browser mode)
const target = {};

const emptyProxy: any = new Proxy(target, {
  get(_t, prop) {
    if (prop === 'promises') return emptyProxy;
    if (prop === 'default') return emptyProxy;
    if (prop === '__esModule') return true;
    return () => {};
  },
  ownKeys() {
    return [];
  },
  getOwnPropertyDescriptor() {
    return undefined;
  }
});

export default emptyProxy;
export const promises = emptyProxy;
