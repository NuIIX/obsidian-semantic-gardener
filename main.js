/* Semantic Gardener Plugin - (c) 2026 NuIIX - MIT License */
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key2 of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key2) && key2 !== except)
        __defProp(to, key2, { get: () => from[key2], enumerable: !(desc = __getOwnPropDesc(from, key2)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => SemanticGardenerPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian7 = require("obsidian");

// src/types/index.ts
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  geminiApiKey: "",
  geminiModel: "gemini-3.5-flash",
  similarityThreshold: 0.82,
  minChunkLength: 40,
  conceptsFolder: "Concepts",
  maxHistoryLength: 20,
  excludedFolders: ".obsidian, .trash, templates, archive"
};

// src/settings.ts
var import_obsidian2 = require("obsidian");
var SemanticGardenerSettingTab = class extends import_obsidian2.PluginSettingTab {
  plugin;
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Semantic Gardener \u2014 \u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438" });
    new import_obsidian2.Setting(containerEl).setName("Google AI Studio API Key (BYOK)").setDesc("\u0412\u0430\u0448 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0439 API-\u043A\u043B\u044E\u0447 Gemini \u0434\u043B\u044F \u0440\u0430\u0431\u043E\u0442\u044B Gatekeeper \u0438 \u043C\u0438\u043A\u0440\u043E\u0445\u0438\u0440\u0443\u0440\u0433\u0438\u0447\u0435\u0441\u043A\u043E\u0433\u043E \u0440\u0435\u0444\u0430\u043A\u0442\u043E\u0440\u0438\u043D\u0433\u0430.").addText((text2) => {
      text2.setPlaceholder("AIzaSy...").setValue(this.plugin.settings.geminiApiKey).onChange(async (value) => {
        this.plugin.settings.geminiApiKey = value.trim();
        this.plugin.geminiClient.setApiKey(value.trim());
        await this.plugin.saveSettings();
      });
      text2.inputEl.type = "password";
    });
    new import_obsidian2.Setting(containerEl).setName("\u041C\u043E\u0434\u0435\u043B\u044C Gemini").setDesc("\u041C\u043E\u0434\u0435\u043B\u044C \u0434\u043B\u044F \u0430\u043D\u0430\u043B\u0438\u0437\u0430 \u043A\u043B\u0430\u0441\u0442\u0435\u0440\u043E\u0432 \u0438 \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0438 \u043C\u0438\u043A\u0440\u043E\u0445\u0438\u0440\u0443\u0440\u0433\u0438\u0447\u0435\u0441\u043A\u0438\u0445 \u0437\u0430\u043C\u0435\u043D.").addDropdown((dropdown) => {
      dropdown.addOption("gemini-3.5-flash", "Gemini 3.5 Flash (\u0420\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0443\u0435\u0442\u0441\u044F)").addOption("gemini-3.5-flash-lite", "Gemini 3.5 Flash-Lite").addOption("gemini-2.5-flash", "Gemini 2.5 Flash").addOption("gemini-1.5-pro", "Gemini 1.5 Pro").setValue(this.plugin.settings.geminiModel).onChange(async (value) => {
        this.plugin.settings.geminiModel = value;
        this.plugin.geminiClient.setModel(value);
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian2.Setting(containerEl).setName("\u041F\u043E\u0440\u043E\u0433 \u0441\u0435\u043C\u0430\u043D\u0442\u0438\u0447\u0435\u0441\u043A\u043E\u0433\u043E \u0441\u0445\u043E\u0434\u0441\u0442\u0432\u0430").setDesc(`\u041C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u043E\u0435 \u043A\u043E\u0441\u0438\u043D\u0443\u0441\u043D\u043E\u0435 \u0441\u0445\u043E\u0434\u0441\u0442\u0432\u043E \u0432\u0435\u043A\u0442\u043E\u0440\u043E\u0432 \u0434\u043B\u044F \u043E\u0431\u044A\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u044F \u0432 \u043A\u043B\u0430\u0441\u0442\u0435\u0440 (\u0422\u0435\u043A\u0443\u0449\u0435\u0435: ${this.plugin.settings.similarityThreshold}). \u0420\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0443\u0435\u0442\u0441\u044F: 0.80 - 0.85.`).addSlider((slider) => {
      slider.setLimits(0.7, 0.95, 0.01).setValue(this.plugin.settings.similarityThreshold).setDynamicTooltip().onChange(async (value) => {
        this.plugin.settings.similarityThreshold = value;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian2.Setting(containerEl).setName("\u041F\u0430\u043F\u043A\u0430 \u0434\u043B\u044F \u0430\u0442\u043E\u043C\u0430\u0440\u043D\u044B\u0445 \u0437\u0430\u043C\u0435\u0442\u043E\u043A").setDesc("\u0414\u0438\u0440\u0435\u043A\u0442\u043E\u0440\u0438\u044F \u0432 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0435, \u0432 \u043A\u043E\u0442\u043E\u0440\u0443\u044E \u0431\u0443\u0434\u0443\u0442 \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0442\u044C\u0441\u044F \u0441\u043E\u0437\u0434\u0430\u0432\u0430\u0435\u043C\u044B\u0435 \u043A\u0430\u043D\u043E\u043D\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0437\u0430\u043C\u0435\u0442\u043A\u0438.").addText((text2) => {
      text2.setPlaceholder("Concepts").setValue(this.plugin.settings.conceptsFolder).onChange(async (value) => {
        this.plugin.settings.conceptsFolder = value.trim() || "Concepts";
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian2.Setting(containerEl).setName("\u041C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u0430\u044F \u0434\u043B\u0438\u043D\u0430 \u0444\u0440\u0430\u0433\u043C\u0435\u043D\u0442\u0430").setDesc("\u041C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u043E\u0435 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432 \u0432 \u0430\u0431\u0437\u0430\u0446\u0435 \u0434\u043B\u044F \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F \u0432 \u0432\u0435\u043A\u0442\u043E\u0440\u043D\u044B\u0439 \u0430\u043D\u0430\u043B\u0438\u0437 (\u0444\u0438\u043B\u044C\u0442\u0440 \u043A\u043E\u0440\u043E\u0442\u043A\u0438\u0445 \u0444\u0440\u0430\u0437).").addText((text2) => {
      text2.setPlaceholder("40").setValue(String(this.plugin.settings.minChunkLength)).onChange(async (value) => {
        const num = parseInt(value, 10);
        if (!isNaN(num) && num > 0) {
          this.plugin.settings.minChunkLength = num;
          await this.plugin.saveSettings();
        }
      });
    });
    new import_obsidian2.Setting(containerEl).setName("\u0418\u0441\u043A\u043B\u044E\u0447\u0435\u043D\u043D\u044B\u0435 \u043F\u0430\u043F\u043A\u0438").setDesc("\u041F\u0430\u043F\u043A\u0438, \u0440\u0430\u0437\u0434\u0435\u043B\u0435\u043D\u043D\u044B\u0435 \u0437\u0430\u043F\u044F\u0442\u044B\u043C\u0438, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u043D\u0435 \u0431\u0443\u0434\u0443\u0442 \u0441\u043A\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u0442\u044C\u0441\u044F \u043D\u0430 \u0434\u0443\u0431\u043B\u0438\u043A\u0430\u0442\u044B.").addTextArea((text2) => {
      text2.setPlaceholder(".obsidian, .trash, templates, archive").setValue(this.plugin.settings.excludedFolders).onChange(async (value) => {
        this.plugin.settings.excludedFolders = value;
        await this.plugin.saveSettings();
      });
      text2.inputEl.rows = 2;
      text2.inputEl.cols = 30;
    });
    new import_obsidian2.Setting(containerEl).setName("\u041B\u0438\u043C\u0438\u0442 \u0438\u0441\u0442\u043E\u0440\u0438\u0438 \u043E\u0442\u043A\u0430\u0442\u0430").setDesc("\u041C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u043E\u0435 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0442\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u0439 \u0432 \u0436\u0443\u0440\u043D\u0430\u043B\u0435 \u043E\u0442\u043A\u0430\u0442\u0430.").addText((text2) => {
      text2.setPlaceholder("20").setValue(String(this.plugin.settings.maxHistoryLength)).onChange(async (value) => {
        const num = parseInt(value, 10);
        if (!isNaN(num) && num > 0) {
          this.plugin.settings.maxHistoryLength = num;
          this.plugin.transactionManager.setMaxHistoryLength(num);
          await this.plugin.saveSettings();
        }
      });
    });
    new import_obsidian2.Setting(containerEl).setName("\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u0432\u0435\u043A\u0442\u043E\u0440\u043D\u044B\u0439 \u043A\u044D\u0448").setDesc("\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043D\u044B\u0435 \u0432\u0435\u043A\u0442\u043E\u0440\u044B \u0438 \u0438\u043D\u0434\u0435\u043A\u0441 \u0438\u0437 IndexedDB \u0434\u043B\u044F \u043F\u043E\u043B\u043D\u043E\u0439 \u043F\u0435\u0440\u0435\u0438\u043D\u0434\u0435\u043A\u0441\u0430\u0446\u0438\u0438.").addButton((button) => {
      button.setButtonText("\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u043A\u044D\u0448").setWarning().onClick(async () => {
        await this.plugin.vectorStorage.clearAll();
        button.setButtonText("\u041A\u044D\u0448 \u043E\u0447\u0438\u0449\u0435\u043D \u2713");
        setTimeout(() => button.setButtonText("\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u043A\u044D\u0448"), 2e3);
      });
    });
  }
};

// src/ui/RefactorView.ts
var import_obsidian3 = require("obsidian");

// node_modules/esm-env/dev-fallback.js
var node_env = globalThis.process?.env?.NODE_ENV;
var dev_fallback_default = node_env && !node_env.toLowerCase().startsWith("prod");

// node_modules/svelte/src/internal/shared/utils.js
var is_array = Array.isArray;
var index_of = Array.prototype.indexOf;
var includes = Array.prototype.includes;
var array_from = Array.from;
var object_keys = Object.keys;
var define_property = Object.defineProperty;
var get_descriptor = Object.getOwnPropertyDescriptor;
var get_descriptors = Object.getOwnPropertyDescriptors;
var object_prototype = Object.prototype;
var array_prototype = Array.prototype;
var get_prototype_of = Object.getPrototypeOf;
var is_extensible = Object.isExtensible;
var noop = () => {
};
function run(fn) {
  return fn();
}
function run_all(arr) {
  for (var i = 0; i < arr.length; i++) {
    arr[i]();
  }
}
function deferred() {
  var resolve;
  var reject;
  var promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// node_modules/svelte/src/internal/client/constants.js
var DERIVED = 1 << 1;
var EFFECT = 1 << 2;
var RENDER_EFFECT = 1 << 3;
var MANAGED_EFFECT = 1 << 24;
var BLOCK_EFFECT = 1 << 4;
var BRANCH_EFFECT = 1 << 5;
var ROOT_EFFECT = 1 << 6;
var BOUNDARY_EFFECT = 1 << 7;
var PAUSED = 1 << 8;
var CONNECTED = 1 << 9;
var CLEAN = 1 << 10;
var DIRTY = 1 << 11;
var MAYBE_DIRTY = 1 << 12;
var INERT = 1 << 13;
var DESTROYED = 1 << 14;
var REACTION_RAN = 1 << 15;
var DESTROYING = 1 << 25;
var EFFECT_TRANSPARENT = 1 << 16;
var EAGER_EFFECT = 1 << 17;
var HEAD_EFFECT = 1 << 18;
var EFFECT_PRESERVED = 1 << 19;
var USER_EFFECT = 1 << 20;
var EFFECT_OFFSCREEN = 1 << 25;
var REACTION_IS_UPDATING = 1 << 21;
var ASYNC = 1 << 22;
var ERROR_VALUE = 1 << 23;
var STATE_SYMBOL = Symbol("$state");
var COMPONENT_SYMBOL = Symbol("component");
var LEGACY_PROPS = Symbol("legacy props");
var LOADING_ATTR_SYMBOL = Symbol("");
var PROXY_PATH_SYMBOL = Symbol("proxy path");
var ATTRIBUTES_CACHE = Symbol("attributes");
var CLASS_CACHE = Symbol("class");
var STYLE_CACHE = Symbol("style");
var TEXT_CACHE = Symbol("text");
var FORM_RESET_HANDLER = Symbol("form reset");
var HMR_ANCHOR = Symbol("hmr anchor");
var STALE_REACTION = new class StaleReactionError extends Error {
  name = "StaleReactionError";
  message = "The reaction that called `getAbortSignal()` was re-run or destroyed";
}();
var IS_XHTML = (
  // We gotta write it like this because after downleveling the pure comment may end up in the wrong location
  !!globalThis.document?.contentType && /* @__PURE__ */ globalThis.document.contentType.includes("xml")
);
var TEXT_NODE = 3;
var COMMENT_NODE = 8;

// node_modules/svelte/src/constants.js
var EACH_ITEM_REACTIVE = 1;
var EACH_INDEX_REACTIVE = 1 << 1;
var EACH_IS_CONTROLLED = 1 << 2;
var EACH_IS_ANIMATED = 1 << 3;
var EACH_ITEM_IMMUTABLE = 1 << 4;
var PROPS_IS_IMMUTABLE = 1;
var PROPS_IS_RUNES = 1 << 1;
var PROPS_IS_UPDATED = 1 << 2;
var PROPS_IS_BINDABLE = 1 << 3;
var PROPS_IS_LAZY_INITIAL = 1 << 4;
var TRANSITION_OUT = 1 << 1;
var TRANSITION_GLOBAL = 1 << 2;
var TEMPLATE_FRAGMENT = 1;
var TEMPLATE_USE_IMPORT_NODE = 1 << 1;
var TEMPLATE_USE_SVG = 1 << 2;
var TEMPLATE_USE_MATHML = 1 << 3;
var HYDRATION_START = "[";
var HYDRATION_START_ELSE = "[!";
var HYDRATION_START_FAILED = "[?";
var HYDRATION_END = "]";
var HYDRATION_ERROR = {};
var ELEMENT_PRESERVE_ATTRIBUTE_CASE = 1 << 1;
var ELEMENT_IS_INPUT = 1 << 2;
var UNINITIALIZED = Symbol("uninitialized");
var FILENAME = Symbol("filename");
var HMR = Symbol("hmr");
var NAMESPACE_HTML = "http://www.w3.org/1999/xhtml";

// node_modules/svelte/src/internal/client/warnings.js
var bold = "font-weight: bold";
var normal = "font-weight: normal";
function await_reactivity_loss(name) {
  if (dev_fallback_default) {
    console.warn(`%c[svelte] await_reactivity_loss
%cDetected reactivity loss when reading \`${name}\`. This happens when state is read in an async function after an earlier \`await\`
https://svelte.dev/e/await_reactivity_loss`, bold, normal);
  } else {
    console.warn(`https://svelte.dev/e/await_reactivity_loss`);
  }
}
function await_waterfall(name, location) {
  if (dev_fallback_default) {
    console.warn(`%c[svelte] await_waterfall
%cAn async derived, \`${name}\` (${location}) was not read immediately after it resolved. This often indicates an unnecessary waterfall, which can slow down your app
https://svelte.dev/e/await_waterfall`, bold, normal);
  } else {
    console.warn(`https://svelte.dev/e/await_waterfall`);
  }
}
function derived_inert() {
  if (dev_fallback_default) {
    console.warn(`%c[svelte] derived_inert
%cReading a derived belonging to a now-destroyed effect may result in stale values
https://svelte.dev/e/derived_inert`, bold, normal);
  } else {
    console.warn(`https://svelte.dev/e/derived_inert`);
  }
}
function hydration_attribute_changed(attribute, html2, value) {
  if (dev_fallback_default) {
    console.warn(`%c[svelte] hydration_attribute_changed
%cThe \`${attribute}\` attribute on \`${html2}\` changed its value between server and client renders. The client value, \`${value}\`, will be ignored in favour of the server value
https://svelte.dev/e/hydration_attribute_changed`, bold, normal);
  } else {
    console.warn(`https://svelte.dev/e/hydration_attribute_changed`);
  }
}
function hydration_mismatch(location) {
  if (dev_fallback_default) {
    console.warn(
      `%c[svelte] hydration_mismatch
%c${location ? `Hydration failed because the initial UI does not match what was rendered on the server. The error occurred near ${location}` : "Hydration failed because the initial UI does not match what was rendered on the server"}
https://svelte.dev/e/hydration_mismatch`,
      bold,
      normal
    );
  } else {
    console.warn(`https://svelte.dev/e/hydration_mismatch`);
  }
}
function lifecycle_double_unmount() {
  if (dev_fallback_default) {
    console.warn(`%c[svelte] lifecycle_double_unmount
%cTried to unmount a component that was not mounted
https://svelte.dev/e/lifecycle_double_unmount`, bold, normal);
  } else {
    console.warn(`https://svelte.dev/e/lifecycle_double_unmount`);
  }
}
function state_proxy_equality_mismatch(operator) {
  if (dev_fallback_default) {
    console.warn(`%c[svelte] state_proxy_equality_mismatch
%cReactive \`$state(...)\` proxies and the values they proxy have different identities. Because of this, comparisons with \`${operator}\` will produce unexpected results
https://svelte.dev/e/state_proxy_equality_mismatch`, bold, normal);
  } else {
    console.warn(`https://svelte.dev/e/state_proxy_equality_mismatch`);
  }
}
function svelte_boundary_reset_noop() {
  if (dev_fallback_default) {
    console.warn(`%c[svelte] svelte_boundary_reset_noop
%cA \`<svelte:boundary>\` \`reset\` function only resets the boundary the first time it is called
https://svelte.dev/e/svelte_boundary_reset_noop`, bold, normal);
  } else {
    console.warn(`https://svelte.dev/e/svelte_boundary_reset_noop`);
  }
}

// node_modules/svelte/src/internal/client/dom/hydration.js
var hydrating = false;
function set_hydrating(value) {
  hydrating = value;
}
var hydrate_node;
function set_hydrate_node(node) {
  if (node === null) {
    hydration_mismatch();
    throw HYDRATION_ERROR;
  }
  return hydrate_node = node;
}
function hydrate_next() {
  return set_hydrate_node(get_next_sibling(hydrate_node));
}
function reset(node) {
  if (!hydrating) return;
  if (get_next_sibling(hydrate_node) !== null) {
    hydration_mismatch();
    throw HYDRATION_ERROR;
  }
  hydrate_node = node;
}
function next(count = 1) {
  if (hydrating) {
    var i = count;
    var node = hydrate_node;
    while (i--) {
      node = /** @type {TemplateNode} */
      get_next_sibling(node);
    }
    hydrate_node = node;
  }
}
function skip_nodes(remove = true) {
  var depth = 0;
  var node = hydrate_node;
  while (true) {
    if (node.nodeType === COMMENT_NODE) {
      var data = (
        /** @type {Comment} */
        node.data
      );
      if (data === HYDRATION_END) {
        if (depth === 0) return node;
        depth -= 1;
      } else if (data === HYDRATION_START || data === HYDRATION_START_ELSE || // "[1", "[2", etc. for if blocks
      data[0] === "[" && !isNaN(Number(data.slice(1)))) {
        depth += 1;
      }
    }
    var next2 = (
      /** @type {TemplateNode} */
      get_next_sibling(node)
    );
    if (remove) node.remove();
    node = next2;
  }
}
function read_hydration_instruction(node) {
  if (!node || node.nodeType !== COMMENT_NODE) {
    hydration_mismatch();
    throw HYDRATION_ERROR;
  }
  return (
    /** @type {Comment} */
    node.data
  );
}

// node_modules/svelte/src/internal/client/reactivity/equality.js
function equals(value) {
  return value === this.v;
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || a !== null && typeof a === "object" || typeof a === "function";
}
function safe_equals(value) {
  return !safe_not_equal(value, this.v);
}

// node_modules/svelte/src/internal/shared/errors.js
function invariant_violation(message) {
  if (dev_fallback_default) {
    const error = new Error(`invariant_violation
An invariant violation occurred, meaning Svelte's internal assumptions were flawed. This is a bug in Svelte, not your app \u2014 please open an issue at https://github.com/sveltejs/svelte, citing the following message: "${message}"
https://svelte.dev/e/invariant_violation`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/invariant_violation`);
  }
}
function lifecycle_outside_component(name) {
  if (dev_fallback_default) {
    const error = new Error(`lifecycle_outside_component
\`${name}(...)\` can only be used during component initialisation
https://svelte.dev/e/lifecycle_outside_component`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/lifecycle_outside_component`);
  }
}

// node_modules/svelte/src/internal/client/errors.js
function async_derived_orphan() {
  if (dev_fallback_default) {
    const error = new Error(`async_derived_orphan
Cannot create a \`$derived(...)\` with an \`await\` expression outside of an effect tree
https://svelte.dev/e/async_derived_orphan`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/async_derived_orphan`);
  }
}
function bind_invalid_checkbox_value() {
  if (dev_fallback_default) {
    const error = new Error(`bind_invalid_checkbox_value
Using \`bind:value\` together with a checkbox input is not allowed. Use \`bind:checked\` instead
https://svelte.dev/e/bind_invalid_checkbox_value`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/bind_invalid_checkbox_value`);
  }
}
function derived_references_self() {
  if (dev_fallback_default) {
    const error = new Error(`derived_references_self
A derived value cannot reference itself recursively
https://svelte.dev/e/derived_references_self`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/derived_references_self`);
  }
}
function each_key_duplicate(a, b, value) {
  if (dev_fallback_default) {
    const error = new Error(`each_key_duplicate
${value ? `Keyed each block has duplicate key \`${value}\` at indexes ${a} and ${b}` : `Keyed each block has duplicate key at indexes ${a} and ${b}`}
https://svelte.dev/e/each_key_duplicate`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/each_key_duplicate`);
  }
}
function each_key_volatile(index2, a, b) {
  if (dev_fallback_default) {
    const error = new Error(`each_key_volatile
Keyed each block has key that is not idempotent \u2014 the key for item at index ${index2} was \`${a}\` but is now \`${b}\`. Keys must be the same each time for a given item
https://svelte.dev/e/each_key_volatile`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/each_key_volatile`);
  }
}
function effect_in_teardown(rune) {
  if (dev_fallback_default) {
    const error = new Error(`effect_in_teardown
\`${rune}\` cannot be used inside an effect cleanup function
https://svelte.dev/e/effect_in_teardown`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/effect_in_teardown`);
  }
}
function effect_in_unowned_derived() {
  if (dev_fallback_default) {
    const error = new Error(`effect_in_unowned_derived
Effect cannot be created inside a \`$derived\` value that was not itself created inside an effect
https://svelte.dev/e/effect_in_unowned_derived`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/effect_in_unowned_derived`);
  }
}
function effect_orphan(rune) {
  if (dev_fallback_default) {
    const error = new Error(`effect_orphan
\`${rune}\` can only be used inside an effect (e.g. during component initialisation)
https://svelte.dev/e/effect_orphan`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/effect_orphan`);
  }
}
function effect_update_depth_exceeded() {
  if (dev_fallback_default) {
    const error = new Error(`effect_update_depth_exceeded
Maximum update depth exceeded. This typically indicates that an effect reads and writes the same piece of state
https://svelte.dev/e/effect_update_depth_exceeded`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/effect_update_depth_exceeded`);
  }
}
function hydration_failed() {
  if (dev_fallback_default) {
    const error = new Error(`hydration_failed
Failed to hydrate the application
https://svelte.dev/e/hydration_failed`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/hydration_failed`);
  }
}
function props_invalid_value(key2) {
  if (dev_fallback_default) {
    const error = new Error(`props_invalid_value
Cannot do \`bind:${key2}={undefined}\` when \`${key2}\` has a fallback value
https://svelte.dev/e/props_invalid_value`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/props_invalid_value`);
  }
}
function rune_outside_svelte(rune) {
  if (dev_fallback_default) {
    const error = new Error(`rune_outside_svelte
The \`${rune}\` rune is only available inside \`.svelte\` and \`.svelte.js/ts\` files
https://svelte.dev/e/rune_outside_svelte`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/rune_outside_svelte`);
  }
}
function state_descriptors_fixed() {
  if (dev_fallback_default) {
    const error = new Error(`state_descriptors_fixed
Property descriptors defined on \`$state\` objects must contain \`value\` and always be \`enumerable\`, \`configurable\` and \`writable\`.
https://svelte.dev/e/state_descriptors_fixed`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/state_descriptors_fixed`);
  }
}
function state_prototype_fixed() {
  if (dev_fallback_default) {
    const error = new Error(`state_prototype_fixed
Cannot set prototype of \`$state\` object
https://svelte.dev/e/state_prototype_fixed`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/state_prototype_fixed`);
  }
}
function state_unsafe_mutation() {
  if (dev_fallback_default) {
    const error = new Error(`state_unsafe_mutation
Updating state inside \`$derived(...)\`, \`$inspect(...)\` or a template expression is forbidden. If the value should not be reactive, declare it without \`$state\`
https://svelte.dev/e/state_unsafe_mutation`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/state_unsafe_mutation`);
  }
}
function svelte_boundary_reset_onerror() {
  if (dev_fallback_default) {
    const error = new Error(`svelte_boundary_reset_onerror
A \`<svelte:boundary>\` \`reset\` function cannot be called while an error is still being handled
https://svelte.dev/e/svelte_boundary_reset_onerror`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/svelte_boundary_reset_onerror`);
  }
}

// node_modules/svelte/src/internal/flags/index.js
var async_mode_flag = false;
var legacy_mode_flag = false;
var tracing_mode_flag = false;
function enable_legacy_mode_flag() {
  legacy_mode_flag = true;
}

// node_modules/svelte/src/internal/client/dev/tracing.js
var tracing_expressions = null;
function tag(source2, label) {
  source2.label = label;
  tag_proxy(source2.v, label);
  return source2;
}
function tag_proxy(value, label) {
  value?.[PROXY_PATH_SYMBOL]?.(label);
  return value;
}

// node_modules/svelte/src/internal/shared/dev.js
function get_error(label) {
  const error = new Error();
  const stack2 = get_stack();
  if (stack2.length === 0) {
    return null;
  }
  stack2.unshift("\n");
  define_property(error, "stack", {
    value: stack2.join("\n")
  });
  define_property(error, "name", {
    value: label
  });
  return (
    /** @type {Error & { stack: string }} */
    error
  );
}
function get_stack() {
  const limit = Error.stackTraceLimit;
  Error.stackTraceLimit = Infinity;
  const stack2 = new Error().stack;
  Error.stackTraceLimit = limit;
  if (!stack2) return [];
  const lines = stack2.split("\n");
  const new_lines = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const posixified = line.replaceAll("\\", "/");
    if (line.trim() === "Error") {
      continue;
    }
    if (line.includes("validate_each_keys")) {
      return [];
    }
    if (posixified.includes("svelte/src/internal") || posixified.includes("node_modules/.vite")) {
      continue;
    }
    new_lines.push(line);
  }
  return new_lines;
}
function invariant(condition, message) {
  if (!dev_fallback_default) {
    throw new Error("invariant(...) was not guarded by if (DEV)");
  }
  if (!condition) invariant_violation(message);
}

// node_modules/svelte/src/internal/client/context.js
var component_context = null;
function set_component_context(context) {
  component_context = context;
}
var dev_stack = null;
function set_dev_stack(stack2) {
  dev_stack = stack2;
}
var dev_current_component_function = null;
function set_dev_current_component_function(fn) {
  dev_current_component_function = fn;
}
function push(props, runes = false, fn) {
  component_context = {
    p: component_context,
    i: false,
    c: null,
    e: null,
    s: props,
    x: null,
    r: (
      /** @type {Effect} */
      active_effect
    ),
    l: legacy_mode_flag && !runes ? { s: null, u: null, $: [] } : null
  };
  if (dev_fallback_default) {
    component_context.function = fn;
    dev_current_component_function = fn;
  }
}
function pop(component2) {
  var context = (
    /** @type {ComponentContext} */
    component_context
  );
  var effects = context.e;
  if (effects !== null) {
    context.e = null;
    for (var fn of effects) {
      create_user_effect(fn);
    }
  }
  if (component2 !== void 0) {
    context.x = component2;
  }
  context.i = true;
  component_context = context.p;
  if (dev_fallback_default) {
    dev_current_component_function = component_context?.function ?? null;
  }
  return mark_as_component(component2);
}
function mark_as_component(component2 = {}) {
  define_property(component2, COMPONENT_SYMBOL, { value: true });
  return component2;
}
function is_runes() {
  return !legacy_mode_flag || component_context !== null && component_context.l === null;
}

// node_modules/svelte/src/internal/client/dom/task.js
var micro_tasks = [];
function run_micro_tasks() {
  var tasks = micro_tasks;
  micro_tasks = [];
  run_all(tasks);
}
function queue_micro_task(fn) {
  if (micro_tasks.length === 0 && !is_flushing_sync) {
    var tasks = micro_tasks;
    queueMicrotask(() => {
      if (tasks === micro_tasks) run_micro_tasks();
    });
  }
  micro_tasks.push(fn);
}
function flush_tasks() {
  while (micro_tasks.length > 0) {
    run_micro_tasks();
  }
}

// node_modules/svelte/src/internal/client/reactivity/status.js
var STATUS_MASK = ~(DIRTY | MAYBE_DIRTY | CLEAN);
function set_signal_status(signal, status) {
  signal.f = signal.f & STATUS_MASK | status;
}
function update_derived_status(derived2) {
  if ((derived2.f & CONNECTED) !== 0 || derived2.deps === null) {
    set_signal_status(derived2, CLEAN);
  } else {
    set_signal_status(derived2, MAYBE_DIRTY);
  }
}

// node_modules/svelte/src/internal/client/reactivity/utils.js
function defer_effect(effect2, dirty_effects, maybe_dirty_effects) {
  if ((effect2.f & DIRTY) !== 0) {
    dirty_effects.add(effect2);
  } else if ((effect2.f & MAYBE_DIRTY) !== 0) {
    maybe_dirty_effects.add(effect2);
  }
  set_signal_status(effect2, CLEAN);
}

// node_modules/svelte/src/internal/client/dom/elements/misc.js
function remove_textarea_child(dom) {
  if (hydrating && get_first_child(dom) !== null) {
    clear_text_content(dom);
  }
}
var listening_to_form_reset = false;
function add_form_reset_listener() {
  if (!listening_to_form_reset) {
    listening_to_form_reset = true;
    document.addEventListener(
      "reset",
      (evt) => {
        Promise.resolve().then(() => {
          if (!evt.defaultPrevented) {
            for (
              const e of
              /**@type {HTMLFormElement} */
              evt.target.elements
            ) {
              e[FORM_RESET_HANDLER]?.();
            }
          }
        });
      },
      // In the capture phase to guarantee we get noticed of it (no possibility of stopPropagation)
      { capture: true }
    );
  }
}

// node_modules/svelte/src/internal/client/dom/elements/bindings/shared.js
function without_reactive_context(fn) {
  var previous_reaction = active_reaction;
  var previous_effect = active_effect;
  set_active_reaction(null);
  set_active_effect(null);
  try {
    return fn();
  } finally {
    set_active_reaction(previous_reaction);
    set_active_effect(previous_effect);
  }
}
function listen_to_event_and_reset_event(element2, event2, handler, on_reset = handler) {
  element2.addEventListener(event2, () => without_reactive_context(handler));
  const prev = (
    /** @type {any} */
    element2[FORM_RESET_HANDLER]
  );
  if (prev) {
    element2[FORM_RESET_HANDLER] = () => {
      prev();
      on_reset(true);
    };
  } else {
    element2[FORM_RESET_HANDLER] = () => on_reset(true);
  }
  add_form_reset_listener();
}

// node_modules/svelte/src/internal/client/reactivity/async.js
function flatten(blockers, sync, async2, fn) {
  const d = is_runes() ? derived : derived_safe_equal;
  var pending2 = blockers.filter((b) => !b.settled);
  var deriveds = sync.map(d);
  if (dev_fallback_default) {
    deriveds.forEach((d2, i) => {
      d2.label = sync[i].toString().replace("() => ", "").replaceAll("$.eager(() => ", "$state.eager(").replace(/\$\.get\((.+?)\)/g, (_, id) => id);
    });
  }
  if (async2.length === 0 && pending2.length === 0) {
    fn(deriveds);
    return;
  }
  var parent = (
    /** @type {Effect} */
    active_effect
  );
  var restore = capture();
  var blocker_promise = pending2.length === 1 ? pending2[0].promise : pending2.length > 1 ? Promise.all(pending2.map((b) => b.promise)) : null;
  function finish(async3) {
    if ((parent.f & DESTROYED) !== 0) {
      return;
    }
    restore();
    try {
      fn([...deriveds, ...async3]);
    } catch (error) {
      invoke_error_boundary(error, parent);
    }
    unset_context();
  }
  var decrement_pending = increment_pending();
  if (async2.length === 0) {
    blocker_promise.then(() => finish([])).finally(decrement_pending);
    return;
  }
  function run3() {
    Promise.all(async2.map((expression) => async_derived(expression))).then(finish).catch((error) => invoke_error_boundary(error, parent)).finally(decrement_pending);
  }
  if (blocker_promise) {
    blocker_promise.then(() => {
      restore();
      run3();
      unset_context();
    });
  } else {
    run3();
  }
}
function capture() {
  var previous_effect = (
    /** @type {Effect} */
    active_effect
  );
  var previous_reaction = active_reaction;
  var previous_component_context = component_context;
  var previous_batch2 = (
    /** @type {Batch} */
    current_batch
  );
  if (dev_fallback_default) {
    var previous_dev_stack = dev_stack;
  }
  return function restore(activate_batch = true) {
    set_active_effect(previous_effect);
    set_active_reaction(previous_reaction);
    set_component_context(previous_component_context);
    if (activate_batch && (previous_effect.f & DESTROYED) === 0) {
      previous_batch2?.activate();
      previous_batch2?.apply();
    }
    if (dev_fallback_default) {
      set_reactivity_loss_tracker(null);
      set_dev_stack(previous_dev_stack);
    }
  };
}
var restored = false;
function unset_context(deactivate_batch = true) {
  restored = false;
  set_active_effect(null);
  set_active_reaction(null);
  set_component_context(null);
  if (deactivate_batch) current_batch?.deactivate();
  if (dev_fallback_default) {
    set_reactivity_loss_tracker(null);
    set_dev_stack(null);
  }
}
function increment_pending() {
  var effect2 = (
    /** @type {Effect} */
    active_effect
  );
  var boundary2 = effect2.b;
  var batch = (
    /** @type {Batch} */
    current_batch
  );
  var blocking = !!boundary2?.is_rendered();
  boundary2?.update_pending_count(1, batch);
  batch.increment(blocking, effect2);
  return () => {
    boundary2?.update_pending_count(-1, batch);
    batch.decrement(blocking, effect2);
  };
}

// node_modules/svelte/src/internal/client/reactivity/deriveds.js
var reactivity_loss_tracker = null;
function set_reactivity_loss_tracker(v) {
  reactivity_loss_tracker = v;
}
var recent_async_deriveds = /* @__PURE__ */ new Set();
// @__NO_SIDE_EFFECTS__
function derived(fn) {
  var flags2 = DERIVED | DIRTY;
  if (active_effect !== null) {
    active_effect.f |= EFFECT_PRESERVED;
  }
  const signal = {
    ctx: component_context,
    deps: null,
    effects: null,
    equals,
    f: flags2,
    fn,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      UNINITIALIZED
    ),
    wv: 0,
    parent: active_effect,
    ac: null
  };
  if (dev_fallback_default && tracing_mode_flag) {
    signal.created = get_error("created at");
  }
  return signal;
}
var OBSOLETE = Symbol("obsolete");
// @__NO_SIDE_EFFECTS__
function async_derived(fn, label, location) {
  let parent = (
    /** @type {Effect | null} */
    active_effect
  );
  if (parent === null) {
    async_derived_orphan();
  }
  var promise = (
    /** @type {Promise<V>} */
    /** @type {unknown} */
    void 0
  );
  var signal = source(
    /** @type {V} */
    UNINITIALIZED
  );
  if (dev_fallback_default) signal.label = label ?? fn.toString();
  var should_suspend = !active_reaction;
  var deferreds = /* @__PURE__ */ new Set();
  async_effect(() => {
    var effect2 = (
      /** @type {Effect} */
      active_effect
    );
    if (dev_fallback_default) {
      reactivity_loss_tracker = { effect: effect2, effect_deps: /* @__PURE__ */ new Set(), warned: false };
    }
    var d = deferred();
    promise = d.promise;
    try {
      Promise.resolve(fn()).then(d.resolve, (e) => {
        if (e !== STALE_REACTION) d.reject(e);
      }).finally(unset_context);
    } catch (error) {
      d.reject(error);
      unset_context();
    }
    if (dev_fallback_default) {
      if (reactivity_loss_tracker) {
        if (effect2.deps !== null) {
          for (let i = 0; i < skipped_deps; i += 1) {
            reactivity_loss_tracker.effect_deps.add(effect2.deps[i]);
          }
        }
        if (new_deps !== null) {
          for (let i = 0; i < new_deps.length; i += 1) {
            reactivity_loss_tracker.effect_deps.add(new_deps[i]);
          }
        }
      }
      reactivity_loss_tracker = null;
    }
    var batch = (
      /** @type {Batch} */
      current_batch
    );
    if (should_suspend) {
      if ((effect2.f & REACTION_RAN) !== 0) {
        var decrement_pending = increment_pending();
      }
      if (
        // boundary can be null if the async derived is inside an $effect.root not connected to the component render tree
        parent.b?.is_rendered()
      ) {
        batch.async_deriveds.get(effect2)?.reject(OBSOLETE);
      } else {
        for (const d2 of deferreds.values()) {
          d2.reject(OBSOLETE);
        }
      }
      deferreds.add(d);
      batch.async_deriveds.set(effect2, d);
    }
    const handler = (value, error = void 0) => {
      if (dev_fallback_default) {
        reactivity_loss_tracker = null;
      }
      decrement_pending?.();
      deferreds.delete(d);
      if (error === OBSOLETE) return;
      batch.activate();
      if (error) {
        signal.f |= ERROR_VALUE;
        internal_set(signal, error);
      } else {
        if ((signal.f & ERROR_VALUE) !== 0) {
          signal.f ^= ERROR_VALUE;
        }
        if (dev_fallback_default && location !== void 0 && !signal.equals(value)) {
          recent_async_deriveds.add(signal);
          setTimeout(() => {
            if (recent_async_deriveds.has(signal) && (effect2.f & DESTROYED) === 0) {
              await_waterfall(
                /** @type {string} */
                signal.label,
                location
              );
              recent_async_deriveds.delete(signal);
            }
          });
        }
        internal_set(signal, value);
      }
      batch.deactivate();
    };
    d.promise.then(handler, (e) => handler(null, e || "unknown"));
  });
  teardown(() => {
    for (const d of deferreds) {
      d.reject(OBSOLETE);
    }
  });
  if (dev_fallback_default) {
    signal.f |= ASYNC;
  }
  return new Promise((fulfil) => {
    function next2(p) {
      function go() {
        if (p === promise) {
          fulfil(signal);
        } else {
          next2(promise);
        }
      }
      p.then(go, go);
    }
    next2(promise);
  });
}
// @__NO_SIDE_EFFECTS__
function derived_safe_equal(fn) {
  const signal = /* @__PURE__ */ derived(fn);
  signal.equals = safe_equals;
  return signal;
}
function destroy_derived_effects(derived2) {
  var effects = derived2.effects;
  if (effects !== null) {
    derived2.effects = null;
    for (var i = 0; i < effects.length; i += 1) {
      destroy_effect(
        /** @type {Effect} */
        effects[i]
      );
    }
  }
}
var stack = [];
function execute_derived(derived2) {
  var value;
  var prev_active_effect = active_effect;
  var parent = derived2.parent;
  if (!is_destroying_effect && parent !== null && derived2.v !== UNINITIALIZED && // if it was never evaluated before, it's guaranteed to fail downstream, so we try to execute instead
  (parent.f & (DESTROYED | INERT)) !== 0) {
    derived_inert();
    return derived2.v;
  }
  set_active_effect(parent);
  if (dev_fallback_default) {
    let prev_eager_effects = eager_effects;
    set_eager_effects(/* @__PURE__ */ new Set());
    try {
      if (includes.call(stack, derived2)) {
        derived_references_self();
      }
      stack.push(derived2);
      destroy_derived_effects(derived2);
      value = update_reaction(derived2);
    } finally {
      set_active_effect(prev_active_effect);
      set_eager_effects(prev_eager_effects);
      stack.pop();
    }
  } else {
    try {
      destroy_derived_effects(derived2);
      value = update_reaction(derived2);
    } finally {
      set_active_effect(prev_active_effect);
    }
  }
  return value;
}
function update_derived(derived2) {
  var value = execute_derived(derived2);
  if (!derived2.equals(value)) {
    derived2.wv = increment_write_version();
    if (!current_batch?.is_fork || derived2.deps === null) {
      if (current_batch !== null) {
        current_batch.capture(derived2, value, true);
        previous_batch?.capture(derived2, value, true);
      } else {
        derived2.v = value;
      }
      if (derived2.deps === null) {
        set_signal_status(derived2, CLEAN);
        return;
      }
    }
  }
  if (is_destroying_effect) {
    return;
  }
  if (batch_values !== null) {
    if (effect_tracking() || current_batch?.is_fork) {
      batch_values.set(derived2, value);
    }
  } else {
    update_derived_status(derived2);
  }
}
function freeze_derived_effects(derived2) {
  if (derived2.effects === null) return;
  for (const e of derived2.effects) {
    if (e.teardown || e.ac) {
      e.teardown?.();
      if (e.ac !== null) {
        without_reactive_context(() => {
          e.ac.abort(STALE_REACTION);
          e.ac = null;
        });
      }
      if (e.fn !== null) e.teardown = noop;
      remove_reactions(e, 0);
      destroy_effect_children(e);
    }
  }
}
function unfreeze_derived_effects(derived2) {
  if (derived2.effects === null) return;
  for (const e of derived2.effects) {
    if (e.teardown && e.fn !== null) {
      update_effect(e);
    }
  }
}

// node_modules/svelte/src/internal/client/reactivity/batch.js
var first_batch = null;
var last_batch = null;
var current_batch = null;
var previous_batch = null;
var batch_values = null;
var last_scheduled_effect = null;
var is_flushing_sync = false;
var is_processing = false;
var collected_effects = null;
var legacy_updates = null;
var flush_count = 0;
var source_stacks = /* @__PURE__ */ new Set();
var uid = 1;
var Batch = class _Batch {
  id = uid++;
  /** True as soon as `#process` was called */
  #started = false;
  linked = true;
  /** @type {Batch | null} */
  #prev = null;
  /** @type {Batch | null} */
  #next = null;
  /** @type {Map<Effect, ReturnType<typeof deferred<any>>>} */
  async_deriveds = /* @__PURE__ */ new Map();
  /**
   * The current values of any signals that are updated in this batch.
   * Tuple format: [value, is_derived] (note: is_derived is false for deriveds, too, if they were overridden via assignment)
   * They keys of this map are identical to `this.#previous`
   * @type {Map<Value, [any, boolean]>}
   */
  current = /* @__PURE__ */ new Map();
  /**
   * The values of any signals (sources and deriveds) that are updated in this batch _before_ those updates took place.
   * They keys of this map are identical to `this.#current`
   * @type {Map<Value, any>}
   */
  previous = /* @__PURE__ */ new Map();
  /**
   * When the batch is committed (and the DOM is updated), we need to remove old branches
   * and append new ones by calling the functions added inside (if/each/key/etc) blocks
   * @type {Set<(batch: Batch) => void>}
   */
  #commit_callbacks = /* @__PURE__ */ new Set();
  /**
   * If a fork is discarded, we need to destroy any effects that are no longer needed
   * @type {Set<(batch: Batch) => void>}
   */
  #discard_callbacks = /* @__PURE__ */ new Set();
  /**
   * The number of async effects that are currently in flight
   */
  #pending = 0;
  /**
   * Async effects that are currently in flight, _not_ inside a pending boundary
   * @type {Map<Effect, number>}
   */
  #blocking_pending = /* @__PURE__ */ new Map();
  /**
   * A deferred that resolves when the batch is committed, used with `settled()`
   * TODO replace with Promise.withResolvers once supported widely enough
   * @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
   */
  #deferred = null;
  /**
   * Effects that were scheduled in this batch but not yet 'resolved' into the
   * root effects that need to be flushed. Resolving — the upwards traversal that
   * marks the path to each effect on the shared effect tree (see #resolve) — is
   * deferred until the batch is processed, so that the markers are created and
   * consumed within a single traversal. Scheduling into other batches (which can
   * happen concurrently, e.g. while a batch is committed) can therefore never
   * observe (and be confused by) this batch's markers.
   * May contain duplicates — deduplication happens during resolving
   * @type {Effect[]}
   */
  #scheduled = [];
  /**
   * Effects created while this batch was active.
   * @type {Effect[]}
   */
  #new_effects = [];
  /**
   * Deferred effects (which run after async work has completed) that are DIRTY
   * @type {Set<Effect>}
   */
  #dirty_effects = /* @__PURE__ */ new Set();
  /**
   * Deferred effects that are MAYBE_DIRTY
   * @type {Set<Effect>}
   */
  #maybe_dirty_effects = /* @__PURE__ */ new Set();
  /**
   * A map of branches that still exist, but will be destroyed when this batch
   * is committed — we skip over these during `process`.
   * The value contains child effects that were dirty/maybe_dirty before being reset,
   * so they can be rescheduled if the branch survives.
   * @type {Map<Effect, { d: Effect[], m: Effect[] }>}
   */
  #skipped_branches = /* @__PURE__ */ new Map();
  /**
   * Inverse of #skipped_branches which we need to tell prior batches to unskip them when committing
   * @type {Set<Effect>}
   */
  #unskipped_branches = /* @__PURE__ */ new Set();
  is_fork = false;
  #decrement_queued = false;
  constructor() {
    if (last_batch === null) {
      first_batch = last_batch = this;
    } else {
      last_batch.#next = this;
      this.#prev = last_batch;
    }
    last_batch = this;
  }
  #is_deferred() {
    if (this.is_fork) return true;
    for (const effect2 of this.#blocking_pending.keys()) {
      var e = effect2;
      var skipped = false;
      while (e.parent !== null) {
        if (this.#skipped_branches.has(e)) {
          skipped = true;
          break;
        }
        e = e.parent;
      }
      if (!skipped) {
        return true;
      }
    }
    return false;
  }
  /**
   * Add an effect to the #skipped_branches map and reset its children
   * @param {Effect} effect
   */
  skip_effect(effect2) {
    if (!this.#skipped_branches.has(effect2)) {
      this.#skipped_branches.set(effect2, { d: [], m: [] });
    }
    this.#unskipped_branches.delete(effect2);
  }
  /**
   * Remove an effect from the #skipped_branches map and reschedule
   * any tracked dirty/maybe_dirty child effects
   * @param {Effect} effect
   * @param {(e: Effect) => void} callback
   */
  unskip_effect(effect2, callback = (e) => this.schedule(e)) {
    var tracked = this.#skipped_branches.get(effect2);
    if (tracked) {
      this.#skipped_branches.delete(effect2);
      for (var e of tracked.d) {
        set_signal_status(e, DIRTY);
        callback(e);
      }
      for (e of tracked.m) {
        set_signal_status(e, MAYBE_DIRTY);
        callback(e);
      }
    }
    this.#unskipped_branches.add(effect2);
  }
  /**
   * Convert the effects that were scheduled in this batch into the root effects
   * that need to be traversed, marking the path to each effect (by clearing the
   * `CLEAN` flag on ancestor branches) so that the traversal can find them.
   * This happens right before traversal rather than at scheduling time, so that
   * the markers left on the (shared) effect tree are created and consumed within
   * a single traversal — scheduling into other batches can never observe them
   * @returns {Effect[]}
   */
  #resolve() {
    var roots = [];
    for (const effect2 of this.#scheduled) {
      if ((effect2.f & DESTROYED) !== 0 || (effect2.f & (DIRTY | MAYBE_DIRTY)) === 0) continue;
      var e = effect2;
      var covered = false;
      while (e.parent !== null) {
        e = e.parent;
        var flags2 = e.f;
        if ((flags2 & (ROOT_EFFECT | BRANCH_EFFECT)) !== 0) {
          if ((flags2 & CLEAN) === 0) {
            covered = true;
            break;
          }
          e.f ^= CLEAN;
        }
      }
      if (!covered) {
        roots.push(e);
      }
    }
    this.#scheduled = [];
    return roots;
  }
  #process() {
    this.#started = true;
    if (dev_fallback_default) {
      for (const value of this.current.keys()) {
        source_stacks.add(value);
      }
    }
    for (const e of this.#dirty_effects) {
      this.#maybe_dirty_effects.delete(e);
      set_signal_status(e, DIRTY);
      this.schedule(e);
    }
    for (const e of this.#maybe_dirty_effects) {
      set_signal_status(e, MAYBE_DIRTY);
      this.schedule(e);
    }
    this.apply();
    var effects = collected_effects = [];
    var render_effects = [];
    var updates = legacy_updates = [];
    while (this.#scheduled.length > 0) {
      if (flush_count++ > 1e3) {
        this.#unlink();
        infinite_loop_guard();
      }
      for (const root5 of this.#resolve()) {
        try {
          this.#traverse(root5, effects, render_effects);
        } catch (e) {
          reset_all(root5);
          if (!this.#is_deferred()) this.discard();
          throw e;
        }
      }
    }
    current_batch = null;
    if (updates.length > 0) {
      var batch = _Batch.ensure();
      for (const e of updates) {
        batch.schedule(e);
      }
    }
    collected_effects = null;
    legacy_updates = null;
    if (this.#is_deferred()) {
      this.#defer_effects(render_effects);
      this.#defer_effects(effects);
      for (const [e, t] of this.#skipped_branches) {
        reset_branch(e, t);
      }
      if (updates.length > 0) {
        /** @type {unknown} */
        current_batch.#process();
      }
      return;
    }
    const earlier_batch = this.#find_earlier_batch();
    if (earlier_batch) {
      this.#defer_effects(render_effects);
      this.#defer_effects(effects);
      earlier_batch.#merge(this);
      return;
    }
    this.#dirty_effects.clear();
    this.#maybe_dirty_effects.clear();
    for (const fn of this.#commit_callbacks) fn(this);
    this.#commit_callbacks.clear();
    previous_batch = this;
    flush_queued_effects(render_effects);
    flush_queued_effects(effects);
    previous_batch = null;
    this.#deferred?.resolve();
    var next_batch = (
      /** @type {Batch | null} */
      /** @type {unknown} */
      current_batch
    );
    if (this.#pending === 0 && (this.#scheduled.length === 0 || next_batch !== null)) {
      this.#unlink();
      if (async_mode_flag) {
        this.#commit();
        current_batch = next_batch;
      }
    }
    if (this.#scheduled.length > 0) {
      if (next_batch !== null) {
        for (const e of this.#scheduled) {
          next_batch.#scheduled.push(e);
        }
        this.#scheduled = [];
      } else {
        next_batch = this;
      }
    }
    if (next_batch !== null) {
      old_values.clear();
      next_batch.#process();
    }
  }
  /**
   * Traverse the effect tree, executing effects or stashing
   * them for later execution as appropriate
   * @param {Effect} root
   * @param {Effect[]} effects
   * @param {Effect[]} render_effects
   */
  #traverse(root5, effects, render_effects) {
    root5.f ^= CLEAN;
    var effect2 = root5.first;
    while (effect2 !== null) {
      var flags2 = effect2.f;
      var is_branch = (flags2 & (BRANCH_EFFECT | ROOT_EFFECT)) !== 0;
      var is_skippable_branch = is_branch && (flags2 & CLEAN) !== 0;
      var skip = is_skippable_branch || (flags2 & INERT) !== 0 || this.#skipped_branches.has(effect2);
      if (!skip && effect2.fn !== null) {
        if (is_branch) {
          effect2.f ^= CLEAN;
        } else if ((flags2 & EFFECT) !== 0) {
          effects.push(effect2);
        } else if (async_mode_flag && (flags2 & (RENDER_EFFECT | MANAGED_EFFECT)) !== 0) {
          render_effects.push(effect2);
        } else if (is_dirty(effect2)) {
          if ((flags2 & BLOCK_EFFECT) !== 0) this.#maybe_dirty_effects.add(effect2);
          update_effect(effect2);
        }
        var child2 = effect2.first;
        if (child2 !== null) {
          effect2 = child2;
          continue;
        }
      }
      while (effect2 !== null) {
        var next2 = effect2.next;
        if (next2 !== null) {
          effect2 = next2;
          break;
        }
        effect2 = effect2.parent;
      }
    }
  }
  #find_earlier_batch() {
    var batch = this.#prev;
    while (batch !== null) {
      if (!batch.is_fork) {
        for (const [value, [, is_derived]] of this.current) {
          if (batch.current.has(value) && !is_derived) {
            return batch;
          }
        }
      }
      batch = batch.#prev;
    }
    return null;
  }
  /**
   * @param {Batch} batch
   */
  #merge(batch) {
    for (const [source2, value] of batch.current) {
      if (!this.previous.has(source2) && batch.previous.has(source2)) {
        this.previous.set(source2, batch.previous.get(source2));
      }
      this.current.set(source2, value);
    }
    for (const [effect2, deferred2] of batch.async_deriveds) {
      const d = this.async_deriveds.get(effect2);
      if (d) deferred2.promise.then(d.resolve).catch(d.reject);
    }
    batch.async_deriveds.clear();
    this.transfer_effects(batch.#dirty_effects, batch.#maybe_dirty_effects);
    const mark = (value) => {
      var reactions = value.reactions;
      if (reactions === null) return;
      if ((value.f & DERIVED) !== 0 && (value.f & (DIRTY | MAYBE_DIRTY)) === 0) {
        return;
      }
      for (const reaction of reactions) {
        var flags2 = reaction.f;
        if ((flags2 & DERIVED) !== 0) {
          mark(
            /** @type {Derived} */
            reaction
          );
        } else {
          var effect2 = (
            /** @type {Effect} */
            reaction
          );
          if (flags2 & (ASYNC | BLOCK_EFFECT) && !this.async_deriveds.has(effect2)) {
            this.#maybe_dirty_effects.delete(effect2);
            set_signal_status(effect2, DIRTY);
            this.schedule(effect2);
          }
        }
      }
    };
    for (const source2 of this.current.keys()) {
      mark(source2);
    }
    this.oncommit(() => batch.discard());
    batch.#unlink();
    current_batch = this;
    this.#process();
  }
  /**
   * @param {Effect[]} effects
   */
  #defer_effects(effects) {
    for (var i = 0; i < effects.length; i += 1) {
      defer_effect(effects[i], this.#dirty_effects, this.#maybe_dirty_effects);
    }
  }
  /**
   * Associate a change to a given source with the current
   * batch, noting its previous and current values
   * @param {Value} source
   * @param {any} value
   * @param {boolean} [is_derived]
   */
  capture(source2, value, is_derived = false) {
    if (source2.v !== UNINITIALIZED && !this.previous.has(source2)) {
      this.previous.set(source2, source2.v);
    }
    if ((source2.f & ERROR_VALUE) === 0) {
      this.current.set(source2, [value, is_derived]);
      batch_values?.set(source2, value);
    }
    if (!this.is_fork) {
      source2.v = value;
    }
  }
  activate() {
    current_batch = this;
  }
  deactivate() {
    current_batch = null;
    batch_values = null;
  }
  flush() {
    try {
      if (dev_fallback_default) {
        source_stacks.clear();
      }
      is_processing = true;
      current_batch = this;
      this.#process();
    } finally {
      flush_count = 0;
      last_scheduled_effect = null;
      collected_effects = null;
      legacy_updates = null;
      is_processing = false;
      current_batch = null;
      batch_values = null;
      old_values.clear();
      if (dev_fallback_default) {
        for (const source2 of source_stacks) {
          source2.updated = null;
        }
      }
    }
  }
  discard() {
    for (const fn of this.#discard_callbacks) fn(this);
    this.#discard_callbacks.clear();
    for (const deferred2 of this.async_deriveds.values()) {
      deferred2.reject(OBSOLETE);
    }
    this.#unlink();
    this.#deferred?.resolve();
  }
  /**
   * @param {Effect} effect
   */
  register_created_effect(effect2) {
    this.#new_effects.push(effect2);
  }
  #commit() {
    for (let batch = first_batch; batch !== null; batch = batch.#next) {
      var is_earlier = batch.id < this.id;
      var sources = [];
      for (const [source3, [value, is_derived]] of this.current) {
        if (batch.current.has(source3)) {
          var batch_value = (
            /** @type {[any, boolean]} */
            batch.current.get(source3)[0]
          );
          if (is_earlier && value !== batch_value) {
            batch.current.set(source3, [value, is_derived]);
          } else {
            continue;
          }
        }
        sources.push(source3);
      }
      if (is_earlier) {
        for (const [effect2, deferred2] of this.async_deriveds) {
          const d = batch.async_deriveds.get(effect2);
          if (d) deferred2.promise.then(d.resolve).catch(d.reject);
        }
      }
      var current = [...batch.current.keys()].filter(
        (source3) => !/** @type {[any, boolean]} */
        batch.current.get(source3)[1]
      );
      if (!batch.#started || current.length === 0) continue;
      var others = current.filter((source3) => !this.current.has(source3));
      if (others.length === 0) {
        if (is_earlier) {
          batch.discard();
        }
      } else if (sources.length > 0) {
        if (dev_fallback_default && !batch.#decrement_queued) {
          invariant(batch.#scheduled.length === 0, "Batch has scheduled effects");
        }
        if (is_earlier) {
          for (const unskipped of this.#unskipped_branches) {
            batch.unskip_effect(unskipped, (e) => {
              if ((e.f & (BLOCK_EFFECT | ASYNC)) !== 0) {
                batch.schedule(e);
              } else {
                batch.#defer_effects([e]);
              }
            });
          }
        }
        batch.activate();
        var marked = /* @__PURE__ */ new Set();
        var checked = /* @__PURE__ */ new Map();
        for (var source2 of sources) {
          mark_effects(source2, others, marked, checked);
        }
        checked = /* @__PURE__ */ new Map();
        var current_unequal = [...batch.current].filter(([c, v1]) => {
          const v2 = this.current.get(c);
          if (!v2) return true;
          return v2[0] !== v1[0] || v2[1] !== v1[1];
        }).map(([c]) => c);
        if (current_unequal.length > 0) {
          for (const effect2 of this.#new_effects) {
            if ((effect2.f & (DESTROYED | INERT | EAGER_EFFECT)) === 0 && depends_on(effect2, current_unequal, checked)) {
              if ((effect2.f & (ASYNC | BLOCK_EFFECT)) !== 0) {
                set_signal_status(effect2, DIRTY);
                batch.schedule(effect2);
              } else {
                batch.#dirty_effects.add(effect2);
              }
            }
          }
        }
        if (batch.#scheduled.length > 0 && !batch.#decrement_queued) {
          batch.apply();
          for (var root5 of batch.#resolve()) {
            batch.#traverse(root5, [], []);
          }
        }
        batch.deactivate();
      }
    }
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   */
  increment(blocking, effect2) {
    this.#pending += 1;
    if (blocking) {
      let blocking_pending_count = this.#blocking_pending.get(effect2) ?? 0;
      this.#blocking_pending.set(effect2, blocking_pending_count + 1);
    }
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   */
  decrement(blocking, effect2) {
    this.#pending -= 1;
    if (blocking) {
      let blocking_pending_count = this.#blocking_pending.get(effect2) ?? 0;
      if (blocking_pending_count === 1) {
        this.#blocking_pending.delete(effect2);
      } else {
        this.#blocking_pending.set(effect2, blocking_pending_count - 1);
      }
    }
    if (this.#decrement_queued) return;
    this.#decrement_queued = true;
    queue_micro_task(() => {
      this.#decrement_queued = false;
      if (this.linked) {
        this.flush();
      }
    });
  }
  /**
   * @param {Set<Effect>} dirty_effects
   * @param {Set<Effect>} maybe_dirty_effects
   */
  transfer_effects(dirty_effects, maybe_dirty_effects) {
    for (const e of dirty_effects) {
      this.#dirty_effects.add(e);
    }
    for (const e of maybe_dirty_effects) {
      this.#maybe_dirty_effects.add(e);
    }
    dirty_effects.clear();
    maybe_dirty_effects.clear();
  }
  /** @param {(batch: Batch) => void} fn */
  oncommit(fn) {
    this.#commit_callbacks.add(fn);
  }
  /** @param {(batch: Batch) => void} fn */
  ondiscard(fn) {
    this.#discard_callbacks.add(fn);
  }
  settled() {
    return (this.#deferred ??= deferred()).promise;
  }
  static ensure() {
    if (current_batch === null) {
      const batch = current_batch = new _Batch();
      if (!is_processing && !is_flushing_sync) {
        queue_micro_task(() => {
          if (!batch.#started) {
            batch.flush();
          }
        });
      }
    }
    return current_batch;
  }
  apply() {
    if (!async_mode_flag || !this.is_fork && this.#prev === null && this.#next === null) {
      batch_values = null;
      return;
    }
    batch_values = /* @__PURE__ */ new Map();
    for (const [source2, [value]] of this.current) {
      batch_values.set(source2, value);
    }
    for (let batch = first_batch; batch !== null; batch = batch.#next) {
      if (batch === this || batch.is_fork) continue;
      var intersects = false;
      if (batch.id < this.id) {
        for (const [source2, [, is_derived]] of batch.current) {
          if (is_derived) continue;
          if (this.current.has(source2)) {
            intersects = true;
            break;
          }
        }
      }
      if (!intersects) {
        for (const [source2, previous] of batch.previous) {
          if (!batch_values.has(source2)) {
            batch_values.set(source2, previous);
          }
        }
      }
    }
  }
  /**
   *
   * @param {Effect} effect
   */
  schedule(effect2) {
    last_scheduled_effect = effect2;
    if (effect2.b?.is_pending && (effect2.f & (EFFECT | RENDER_EFFECT | MANAGED_EFFECT)) !== 0 && (effect2.f & REACTION_RAN) === 0) {
      effect2.b.defer_effect(effect2);
      return;
    }
    this.#scheduled.push(effect2);
  }
  #unlink() {
    if (!this.linked) return;
    var prev = this.#prev;
    var next2 = this.#next;
    if (prev === null) {
      first_batch = next2;
    } else {
      prev.#next = next2;
    }
    if (next2 === null) {
      last_batch = prev;
    } else {
      next2.#prev = prev;
    }
    this.linked = false;
  }
};
function flushSync(fn) {
  var was_flushing_sync = is_flushing_sync;
  is_flushing_sync = true;
  try {
    var result;
    if (fn) {
      if (current_batch !== null && !current_batch.is_fork) {
        current_batch.flush();
      }
      result = fn();
    }
    while (true) {
      flush_tasks();
      if (current_batch === null) {
        return (
          /** @type {T} */
          result
        );
      }
      current_batch.flush();
    }
  } finally {
    is_flushing_sync = was_flushing_sync;
  }
}
function infinite_loop_guard() {
  if (dev_fallback_default) {
    var updates = /* @__PURE__ */ new Map();
    for (
      const source2 of
      /** @type {Batch} */
      current_batch.current.keys()
    ) {
      for (const [stack2, update2] of source2.updated ?? []) {
        var entry = updates.get(stack2);
        if (!entry) {
          entry = { error: update2.error, count: 0 };
          updates.set(stack2, entry);
        }
        entry.count += update2.count;
      }
    }
    for (const update2 of updates.values()) {
      if (update2.error) {
        console.error(update2.error);
      }
    }
  }
  try {
    effect_update_depth_exceeded();
  } catch (error) {
    if (dev_fallback_default) {
      define_property(error, "stack", { value: "" });
    }
    invoke_error_boundary(error, last_scheduled_effect);
  }
}
var eager_block_effects = null;
function flush_queued_effects(effects) {
  var length = effects.length;
  if (length === 0) return;
  var i = 0;
  while (i < length) {
    var effect2 = effects[i++];
    if ((effect2.f & (DESTROYED | INERT)) === 0 && is_dirty(effect2)) {
      eager_block_effects = /* @__PURE__ */ new Set();
      update_effect(effect2);
      if (effect2.deps === null && effect2.first === null && effect2.nodes === null && effect2.teardown === null && effect2.ac === null) {
        unlink_effect(effect2);
      }
      if (eager_block_effects?.size > 0) {
        old_values.clear();
        for (const e of eager_block_effects) {
          if ((e.f & (DESTROYED | INERT)) !== 0) continue;
          const ordered_effects = [e];
          let ancestor = e.parent;
          while (ancestor !== null) {
            if (eager_block_effects.has(ancestor)) {
              eager_block_effects.delete(ancestor);
              ordered_effects.push(ancestor);
            }
            ancestor = ancestor.parent;
          }
          for (let j = ordered_effects.length - 1; j >= 0; j--) {
            const e2 = ordered_effects[j];
            if ((e2.f & (DESTROYED | INERT)) !== 0) continue;
            update_effect(e2);
          }
        }
        eager_block_effects.clear();
      }
    }
  }
  eager_block_effects = null;
}
function mark_effects(value, sources, marked, checked) {
  if (marked.has(value)) return;
  marked.add(value);
  if (value.reactions !== null) {
    for (const reaction of value.reactions) {
      const flags2 = reaction.f;
      if ((flags2 & DERIVED) !== 0) {
        mark_effects(
          /** @type {Derived} */
          reaction,
          sources,
          marked,
          checked
        );
      } else if ((flags2 & (ASYNC | BLOCK_EFFECT)) !== 0 && (flags2 & DIRTY) === 0 && depends_on(reaction, sources, checked)) {
        set_signal_status(reaction, DIRTY);
        schedule_effect(
          /** @type {Effect} */
          reaction
        );
      }
    }
  }
}
function depends_on(reaction, sources, checked) {
  const depends = checked.get(reaction);
  if (depends !== void 0) return depends;
  if (reaction.deps !== null) {
    for (const dep of reaction.deps) {
      if (includes.call(sources, dep)) {
        return true;
      }
      if ((dep.f & DERIVED) !== 0 && depends_on(
        /** @type {Derived} */
        dep,
        sources,
        checked
      )) {
        checked.set(
          /** @type {Derived} */
          dep,
          true
        );
        return true;
      }
    }
  }
  checked.set(reaction, false);
  return false;
}
function schedule_effect(effect2) {
  current_batch.schedule(effect2);
}
function reset_branch(effect2, tracked) {
  if ((effect2.f & BRANCH_EFFECT) !== 0 && (effect2.f & CLEAN) !== 0) {
    return;
  }
  if ((effect2.f & DIRTY) !== 0) {
    tracked.d.push(effect2);
  } else if ((effect2.f & MAYBE_DIRTY) !== 0) {
    tracked.m.push(effect2);
  }
  set_signal_status(effect2, CLEAN);
  var e = effect2.first;
  while (e !== null) {
    reset_branch(e, tracked);
    e = e.next;
  }
}
function reset_all(effect2) {
  set_signal_status(effect2, CLEAN);
  var e = effect2.first;
  while (e !== null) {
    reset_all(e);
    e = e.next;
  }
}

// node_modules/svelte/src/internal/client/reactivity/sources.js
var eager_effects = /* @__PURE__ */ new Set();
var old_values = /* @__PURE__ */ new Map();
function set_eager_effects(v) {
  eager_effects = v;
}
var eager_effects_deferred = false;
function set_eager_effects_deferred() {
  eager_effects_deferred = true;
}
function source(v, stack2) {
  var signal = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v,
    reactions: null,
    equals,
    rv: 0,
    wv: 0
  };
  if (dev_fallback_default && tracing_mode_flag) {
    signal.created = stack2 ?? get_error("created at");
    signal.updated = null;
    signal.set_during_effect = false;
    signal.trace = null;
  }
  return signal;
}
// @__NO_SIDE_EFFECTS__
function state(v, stack2) {
  const s = source(v, stack2);
  push_reaction_value(s);
  return s;
}
// @__NO_SIDE_EFFECTS__
function mutable_source(initial_value, immutable = false, trackable = true) {
  const s = source(initial_value);
  if (!immutable) {
    s.equals = safe_equals;
  }
  if (legacy_mode_flag && trackable && component_context !== null && component_context.l !== null) {
    (component_context.l.s ??= []).push(s);
  }
  return s;
}
function mutate(source2, value) {
  set(
    source2,
    untrack(() => get(source2))
  );
  return value;
}
function set(source2, value, should_proxy = false) {
  if (active_reaction !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
  // to ensure we error if state is set inside an inspect effect
  (!untracking || (active_reaction.f & EAGER_EFFECT) !== 0) && is_runes() && (active_reaction.f & (DERIVED | BLOCK_EFFECT | ASYNC | EAGER_EFFECT)) !== 0 && (current_sources === null || !current_sources.has(source2))) {
    state_unsafe_mutation();
  }
  let new_value = should_proxy ? proxy(value) : value;
  if (dev_fallback_default) {
    tag_proxy(
      new_value,
      /** @type {string} */
      source2.label
    );
  }
  return internal_set(source2, new_value, legacy_updates);
}
var seen = null;
var count_deps = 0;
function internal_set(source2, value, updated_during_traversal = null) {
  if (!source2.equals(value)) {
    if (is_destroying_effect) {
      old_values.set(source2, value);
    } else if (!old_values.has(source2)) {
      old_values.set(source2, source2.v);
    }
    var batch = Batch.ensure();
    batch.capture(source2, value);
    if (dev_fallback_default) {
      if (tracing_mode_flag || active_effect !== null) {
        source2.updated ??= /* @__PURE__ */ new Map();
        const count = (source2.updated.get("")?.count ?? 0) + 1;
        source2.updated.set("", { error: (
          /** @type {any} */
          null
        ), count });
        if (tracing_mode_flag || count > 5) {
          const error = get_error("updated at");
          if (error !== null) {
            let entry = source2.updated.get(error.stack);
            if (!entry) {
              entry = { error, count: 0 };
              source2.updated.set(error.stack, entry);
            }
            entry.count++;
          }
        }
      }
      if (active_effect !== null) {
        source2.set_during_effect = true;
      }
    }
    if ((source2.f & DERIVED) !== 0) {
      const derived2 = (
        /** @type {Derived} */
        source2
      );
      if ((source2.f & DIRTY) !== 0) {
        execute_derived(derived2);
      }
      if (batch_values === null) {
        update_derived_status(derived2);
      }
    }
    source2.wv = increment_write_version();
    seen = null;
    count_deps = 0;
    mark_reactions(source2, DIRTY, updated_during_traversal);
    seen = null;
    if (is_runes() && active_effect !== null && (active_effect.f & CLEAN) !== 0 && (active_effect.f & (BRANCH_EFFECT | ROOT_EFFECT)) === 0) {
      if (untracked_writes === null) {
        set_untracked_writes([source2]);
      } else {
        untracked_writes.push(source2);
      }
    }
    if (!batch.is_fork && eager_effects.size > 0 && !eager_effects_deferred) {
      flush_eager_effects();
    }
  }
  return value;
}
function flush_eager_effects() {
  eager_effects_deferred = false;
  for (const effect2 of eager_effects) {
    if ((effect2.f & CLEAN) !== 0) {
      set_signal_status(effect2, MAYBE_DIRTY);
    }
    let dirty;
    try {
      dirty = is_dirty(effect2);
    } catch {
      dirty = true;
    }
    if (dirty) {
      update_effect(effect2);
    }
  }
  eager_effects.clear();
}
function increment(source2) {
  set(source2, source2.v + 1);
}
function mark_reactions(signal, status, updated_during_traversal) {
  var reactions = signal.reactions;
  if (reactions === null) return;
  var runes = is_runes();
  var length = reactions.length;
  count_deps += length;
  if (count_deps > 1e5 && seen === null) seen = /* @__PURE__ */ new Set();
  if (seen !== null) {
    if (seen.has(signal)) return;
    seen.add(signal);
  }
  for (var i = 0; i < length; i++) {
    var reaction = reactions[i];
    var flags2 = reaction.f;
    if (!runes && reaction === active_effect) continue;
    var not_dirty = (flags2 & DIRTY) === 0;
    if (not_dirty) {
      set_signal_status(reaction, status);
    }
    if ((flags2 & EAGER_EFFECT) !== 0) {
      eager_effects.add(
        /** @type {Effect} */
        reaction
      );
    } else if ((flags2 & DERIVED) !== 0) {
      var derived2 = (
        /** @type {Derived} */
        reaction
      );
      batch_values?.delete(derived2);
      mark_reactions(derived2, MAYBE_DIRTY, updated_during_traversal);
    } else if (not_dirty) {
      var effect2 = (
        /** @type {Effect} */
        reaction
      );
      if ((flags2 & BLOCK_EFFECT) !== 0 && eager_block_effects !== null) {
        eager_block_effects.add(effect2);
      }
      if (updated_during_traversal !== null) {
        updated_during_traversal.push(effect2);
      } else {
        schedule_effect(effect2);
      }
    }
  }
}

// node_modules/svelte/src/internal/client/proxy.js
var regex_is_valid_identifier = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/;
function proxy(value) {
  if (typeof value !== "object" || value === null || STATE_SYMBOL in value || COMPONENT_SYMBOL in value) {
    return value;
  }
  const prototype = get_prototype_of(value);
  if (prototype !== object_prototype && prototype !== array_prototype) {
    return value;
  }
  var sources = /* @__PURE__ */ new Map();
  var is_proxied_array = is_array(value);
  var version = state(0);
  var stack2 = dev_fallback_default && tracing_mode_flag ? get_error("created at") : null;
  var parent_version = update_version;
  var with_parent = (fn) => {
    if (update_version === parent_version) {
      return fn();
    }
    var reaction = active_reaction;
    var version2 = update_version;
    set_active_reaction(null);
    set_update_version(parent_version);
    var result = fn();
    set_active_reaction(reaction);
    set_update_version(version2);
    return result;
  };
  if (is_proxied_array) {
    sources.set("length", state(
      /** @type {any[]} */
      value.length,
      stack2
    ));
    if (dev_fallback_default) {
      value = /** @type {any} */
      inspectable_array(
        /** @type {any[]} */
        value
      );
    }
  }
  var path = "";
  let updating = false;
  function update_path(new_path) {
    if (updating) return;
    updating = true;
    path = new_path;
    tag(version, `${path} version`);
    for (const [prop2, source2] of sources) {
      tag(source2, get_label(path, prop2));
    }
    updating = false;
  }
  return new Proxy(
    /** @type {any} */
    value,
    {
      defineProperty(_, prop2, descriptor) {
        if (!("value" in descriptor) || descriptor.configurable === false || descriptor.enumerable === false || descriptor.writable === false) {
          state_descriptors_fixed();
        }
        var s = sources.get(prop2);
        if (s === void 0) {
          with_parent(() => {
            var s2 = state(descriptor.value, stack2);
            sources.set(prop2, s2);
            if (dev_fallback_default && typeof prop2 === "string") {
              tag(s2, get_label(path, prop2));
            }
            return s2;
          });
        } else {
          set(s, descriptor.value, true);
        }
        return true;
      },
      deleteProperty(target, prop2) {
        var s = sources.get(prop2);
        if (s === void 0) {
          if (prop2 in target) {
            const s2 = with_parent(() => state(UNINITIALIZED, stack2));
            sources.set(prop2, s2);
            increment(version);
            if (dev_fallback_default) {
              tag(s2, get_label(path, prop2));
            }
          }
        } else {
          set(s, UNINITIALIZED);
          increment(version);
        }
        return true;
      },
      get(target, prop2, receiver) {
        if (prop2 === STATE_SYMBOL) {
          return value;
        }
        if (dev_fallback_default && prop2 === PROXY_PATH_SYMBOL) {
          return update_path;
        }
        var s = sources.get(prop2);
        var exists = prop2 in target;
        if (s === void 0 && (!exists || get_descriptor(target, prop2)?.writable)) {
          s = with_parent(() => {
            var p = proxy(exists ? target[prop2] : UNINITIALIZED);
            var s2 = state(p, stack2);
            if (dev_fallback_default) {
              tag(s2, get_label(path, prop2));
            }
            return s2;
          });
          sources.set(prop2, s);
        }
        if (s !== void 0) {
          var v = get(s);
          return v === UNINITIALIZED ? void 0 : v;
        }
        return Reflect.get(target, prop2, receiver);
      },
      getOwnPropertyDescriptor(target, prop2) {
        this.has?.(target, prop2);
        var descriptor = Reflect.getOwnPropertyDescriptor(target, prop2);
        var s = sources.get(prop2);
        if (s !== void 0) {
          var value2 = get(s);
          if (value2 === UNINITIALIZED) {
            return void 0;
          }
          if (descriptor && "value" in descriptor) {
            descriptor.value = value2;
          } else {
            return {
              enumerable: true,
              configurable: true,
              value: value2,
              writable: true
            };
          }
        }
        return descriptor;
      },
      has(target, prop2) {
        if (prop2 === STATE_SYMBOL) {
          return true;
        }
        var s = sources.get(prop2);
        var has = s !== void 0 && s.v !== UNINITIALIZED || Reflect.has(target, prop2);
        if (s !== void 0 || active_effect !== null && (!has || get_descriptor(target, prop2)?.writable)) {
          if (s === void 0) {
            s = with_parent(() => {
              var p = has ? proxy(target[prop2]) : UNINITIALIZED;
              var s2 = state(p, stack2);
              if (dev_fallback_default) {
                tag(s2, get_label(path, prop2));
              }
              return s2;
            });
            sources.set(prop2, s);
          }
          var value2 = get(s);
          if (value2 === UNINITIALIZED) {
            return false;
          }
        }
        return has;
      },
      set(target, prop2, value2, receiver) {
        var s = sources.get(prop2);
        var has = prop2 in target;
        if (is_proxied_array && prop2 === "length") {
          for (var i = value2; i < /** @type {Source<number>} */
          s.v; i += 1) {
            var other_s = sources.get(i + "");
            if (other_s !== void 0) {
              set(other_s, UNINITIALIZED);
            } else if (i in target) {
              other_s = with_parent(() => state(UNINITIALIZED, stack2));
              sources.set(i + "", other_s);
              if (dev_fallback_default) {
                tag(other_s, get_label(path, i));
              }
            }
          }
        }
        if (s === void 0) {
          if (!has || get_descriptor(target, prop2)?.writable) {
            s = with_parent(() => state(void 0, stack2));
            if (dev_fallback_default) {
              tag(s, get_label(path, prop2));
            }
            set(s, proxy(value2));
            sources.set(prop2, s);
          }
        } else {
          has = s.v !== UNINITIALIZED;
          var p = with_parent(() => proxy(value2));
          set(s, p);
        }
        var descriptor = Reflect.getOwnPropertyDescriptor(target, prop2);
        if (descriptor?.set) {
          descriptor.set.call(receiver, value2);
        }
        if (!has) {
          if (is_proxied_array && typeof prop2 === "string") {
            var ls = (
              /** @type {Source<number>} */
              sources.get("length")
            );
            var n = Number(prop2);
            if (Number.isInteger(n) && n >= ls.v) {
              set(ls, n + 1);
            }
          }
          increment(version);
        }
        return true;
      },
      ownKeys(target) {
        get(version);
        var own_keys = Reflect.ownKeys(target).filter((key3) => {
          var source3 = sources.get(key3);
          return source3 === void 0 || source3.v !== UNINITIALIZED;
        });
        for (var [key2, source2] of sources) {
          if (source2.v !== UNINITIALIZED && !(key2 in target)) {
            own_keys.push(key2);
          }
        }
        return own_keys;
      },
      setPrototypeOf() {
        state_prototype_fixed();
      }
    }
  );
}
function get_label(path, prop2) {
  if (typeof prop2 === "symbol") return `${path}[Symbol(${prop2.description ?? ""})]`;
  if (regex_is_valid_identifier.test(prop2)) return `${path}.${prop2}`;
  return /^\d+$/.test(prop2) ? `${path}[${prop2}]` : `${path}['${prop2}']`;
}
function get_proxied_value(value) {
  try {
    if (value !== null && typeof value === "object" && STATE_SYMBOL in value) {
      return value[STATE_SYMBOL];
    }
  } catch {
  }
  return value;
}
var ARRAY_MUTATING_METHODS = /* @__PURE__ */ new Set([
  "copyWithin",
  "fill",
  "pop",
  "push",
  "reverse",
  "shift",
  "sort",
  "splice",
  "unshift"
]);
function inspectable_array(array) {
  return new Proxy(array, {
    get(target, prop2, receiver) {
      var value = Reflect.get(target, prop2, receiver);
      if (!ARRAY_MUTATING_METHODS.has(
        /** @type {string} */
        prop2
      )) {
        return value;
      }
      return function(...args) {
        set_eager_effects_deferred();
        var result = value.apply(this, args);
        flush_eager_effects();
        return result;
      };
    }
  });
}

// node_modules/svelte/src/internal/client/dev/equality.js
function init_array_prototype_warnings() {
  const array_prototype2 = Array.prototype;
  const cleanup = Array.__svelte_cleanup;
  if (cleanup) {
    cleanup();
  }
  const { indexOf, lastIndexOf, includes: includes2 } = array_prototype2;
  array_prototype2.indexOf = function(item, from_index) {
    const index2 = indexOf.call(this, item, from_index);
    if (index2 === -1) {
      for (let i = from_index ?? 0; i < this.length; i += 1) {
        if (get_proxied_value(this[i]) === item) {
          state_proxy_equality_mismatch("array.indexOf(...)");
          break;
        }
      }
    }
    return index2;
  };
  array_prototype2.lastIndexOf = function(item, from_index) {
    const index2 = lastIndexOf.call(this, item, from_index ?? this.length - 1);
    if (index2 === -1) {
      for (let i = 0; i <= (from_index ?? this.length - 1); i += 1) {
        if (get_proxied_value(this[i]) === item) {
          state_proxy_equality_mismatch("array.lastIndexOf(...)");
          break;
        }
      }
    }
    return index2;
  };
  array_prototype2.includes = function(item, from_index) {
    const has = includes2.call(this, item, from_index);
    if (!has) {
      for (let i = 0; i < this.length; i += 1) {
        if (get_proxied_value(this[i]) === item) {
          state_proxy_equality_mismatch("array.includes(...)");
          break;
        }
      }
    }
    return has;
  };
  Array.__svelte_cleanup = () => {
    array_prototype2.indexOf = indexOf;
    array_prototype2.lastIndexOf = lastIndexOf;
    array_prototype2.includes = includes2;
  };
}

// node_modules/svelte/src/internal/client/dom/operations.js
var $window;
var $document;
var is_firefox;
var first_child_getter;
var next_sibling_getter;
function init_operations() {
  if ($window !== void 0) {
    return;
  }
  $window = window;
  $document = document;
  is_firefox = /Firefox/.test(navigator.userAgent);
  var element_prototype = Element.prototype;
  var node_prototype = Node.prototype;
  var text_prototype = Text.prototype;
  first_child_getter = get_descriptor(node_prototype, "firstChild").get;
  next_sibling_getter = get_descriptor(node_prototype, "nextSibling").get;
  if (is_extensible(element_prototype)) {
    element_prototype[CLASS_CACHE] = void 0;
    element_prototype[ATTRIBUTES_CACHE] = null;
    element_prototype[STYLE_CACHE] = void 0;
    element_prototype.__e = void 0;
  }
  if (is_extensible(text_prototype)) {
    text_prototype[TEXT_CACHE] = void 0;
  }
  if (dev_fallback_default) {
    element_prototype.__svelte_meta = null;
    init_array_prototype_warnings();
  }
}
function create_text(value = "") {
  return document.createTextNode(value);
}
// @__NO_SIDE_EFFECTS__
function get_first_child(node) {
  return (
    /** @type {TemplateNode | null} */
    first_child_getter.call(node)
  );
}
// @__NO_SIDE_EFFECTS__
function get_next_sibling(node) {
  return (
    /** @type {TemplateNode | null} */
    next_sibling_getter.call(node)
  );
}
function child(node, is_text) {
  if (!hydrating) {
    return /* @__PURE__ */ get_first_child(node);
  }
  var child2 = /* @__PURE__ */ get_first_child(hydrate_node);
  if (child2 === null) {
    child2 = hydrate_node.appendChild(create_text());
  } else if (is_text && child2.nodeType !== TEXT_NODE) {
    var text2 = create_text();
    child2?.before(text2);
    set_hydrate_node(text2);
    return text2;
  }
  if (is_text) {
    merge_text_nodes(
      /** @type {Text} */
      child2
    );
  }
  set_hydrate_node(child2);
  return child2;
}
function first_child(node, is_text = false) {
  if (!hydrating) {
    var first = /* @__PURE__ */ get_first_child(node);
    if (first instanceof Comment && first.data === "") return /* @__PURE__ */ get_next_sibling(first);
    return first;
  }
  if (is_text) {
    if (hydrate_node?.nodeType !== TEXT_NODE) {
      var text2 = create_text();
      hydrate_node?.before(text2);
      set_hydrate_node(text2);
      return text2;
    }
    merge_text_nodes(
      /** @type {Text} */
      hydrate_node
    );
  }
  return hydrate_node;
}
function only_child(node, is_text = false) {
  if (!hydrating) {
    return /* @__PURE__ */ get_first_child(node);
  }
  var first = child(node, is_text);
  reset(node);
  return first;
}
function sibling(node, count = 1, is_text = false) {
  let next_sibling = hydrating ? hydrate_node : node;
  var last_sibling;
  while (count--) {
    last_sibling = next_sibling;
    next_sibling = /** @type {TemplateNode} */
    /* @__PURE__ */ get_next_sibling(next_sibling);
  }
  if (!hydrating) {
    return next_sibling;
  }
  if (is_text) {
    if (next_sibling?.nodeType !== TEXT_NODE) {
      var text2 = create_text();
      if (next_sibling === null) {
        last_sibling?.after(text2);
      } else {
        next_sibling.before(text2);
      }
      set_hydrate_node(text2);
      return text2;
    }
    merge_text_nodes(
      /** @type {Text} */
      next_sibling
    );
  }
  set_hydrate_node(next_sibling);
  return next_sibling;
}
function clear_text_content(node) {
  node.textContent = "";
}
function should_defer_append() {
  if (!async_mode_flag) return false;
  if (eager_block_effects !== null) return false;
  var flags2 = (
    /** @type {Effect} */
    active_effect.f
  );
  return (flags2 & REACTION_RAN) !== 0;
}
function create_element(tag2, namespace, is2) {
  if (namespace == null || namespace === NAMESPACE_HTML) {
    return (
      /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
      is2 ? document.createElement(tag2, { is: is2 }) : document.createElement(tag2)
    );
  }
  return (
    /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
    is2 ? document.createElementNS(namespace, tag2, { is: is2 }) : document.createElementNS(namespace, tag2)
  );
}
function merge_text_nodes(text2) {
  if (
    /** @type {string} */
    text2.nodeValue.length < 65536
  ) {
    return;
  }
  let next2 = text2.nextSibling;
  while (next2 !== null && next2.nodeType === TEXT_NODE) {
    next2.remove();
    text2.nodeValue += /** @type {string} */
    next2.nodeValue;
    next2 = text2.nextSibling;
  }
}

// node_modules/svelte/src/internal/client/error-handling.js
var adjustments = /* @__PURE__ */ new WeakMap();
function handle_error(error) {
  var effect2 = active_effect;
  if (effect2 === null) {
    active_reaction.f |= ERROR_VALUE;
    return error;
  }
  if (dev_fallback_default && error instanceof Error && !adjustments.has(error)) {
    adjustments.set(error, get_adjustments(error, effect2));
  }
  if ((effect2.f & REACTION_RAN) === 0 && (effect2.f & EFFECT) === 0) {
    if (dev_fallback_default && !effect2.parent && error instanceof Error) {
      apply_adjustments(error);
    }
    throw error;
  }
  invoke_error_boundary(error, effect2);
}
function invoke_error_boundary(error, effect2) {
  if (effect2 !== null && (effect2.f & DESTROYED) !== 0) {
    return;
  }
  while (effect2 !== null) {
    if ((effect2.f & BOUNDARY_EFFECT) !== 0 && (effect2.f & (DESTROYED | DESTROYING)) === 0) {
      if ((effect2.f & REACTION_RAN) === 0) {
        throw error;
      }
      try {
        effect2.b.error(error);
        return;
      } catch (e) {
        error = e;
      }
    }
    effect2 = effect2.parent;
  }
  if (dev_fallback_default && error instanceof Error) {
    apply_adjustments(error);
  }
  throw error;
}
function get_adjustments(error, effect2) {
  const message_descriptor = get_descriptor(error, "message");
  if (message_descriptor && !message_descriptor.configurable) return;
  var indent = is_firefox ? "  " : "	";
  var component_stack = `
${indent}in ${effect2.fn?.name || "<unknown>"}`;
  var context = effect2.ctx;
  while (context !== null) {
    component_stack += `
${indent}in ${context.function?.[FILENAME].split("/").pop()}`;
    context = context.p;
  }
  return {
    message: error.message + `
${component_stack}
`,
    stack: error.stack?.split("\n").filter((line) => !line.includes("svelte/src/internal")).join("\n")
  };
}
function apply_adjustments(error) {
  const adjusted = adjustments.get(error);
  if (adjusted) {
    define_property(error, "message", {
      value: adjusted.message
    });
    define_property(error, "stack", {
      value: adjusted.stack
    });
  }
}

// node_modules/svelte/src/internal/client/reactivity/effects.js
function validate_effect(rune) {
  if (active_effect === null) {
    if (active_reaction === null) {
      effect_orphan(rune);
    }
    effect_in_unowned_derived();
  }
  if (is_destroying_effect) {
    effect_in_teardown(rune);
  }
}
function push_effect(effect2, parent_effect) {
  var parent_last = parent_effect.last;
  if (parent_last === null) {
    parent_effect.last = parent_effect.first = effect2;
  } else {
    parent_last.next = effect2;
    effect2.prev = parent_last;
    parent_effect.last = effect2;
  }
}
function create_effect(type, fn) {
  var parent = active_effect;
  if (dev_fallback_default) {
    while (parent !== null && (parent.f & EAGER_EFFECT) !== 0) {
      parent = parent.parent;
    }
  }
  if (parent !== null && (parent.f & INERT) !== 0) {
    type |= INERT;
  }
  var effect2 = {
    ctx: component_context,
    deps: null,
    nodes: null,
    f: type | DIRTY | CONNECTED,
    first: null,
    fn,
    last: null,
    next: null,
    parent,
    b: parent && parent.b,
    prev: null,
    teardown: null,
    wv: 0,
    ac: null
  };
  if (dev_fallback_default) {
    effect2.component_function = dev_current_component_function;
  }
  current_batch?.register_created_effect(effect2);
  var e = effect2;
  if ((type & EFFECT) !== 0) {
    if (collected_effects !== null) {
      collected_effects.push(effect2);
    } else {
      Batch.ensure().schedule(effect2);
    }
  } else if (fn !== null) {
    try {
      update_effect(effect2);
    } catch (e2) {
      destroy_effect(effect2);
      throw e2;
    }
    if (e.deps === null && e.teardown === null && e.nodes === null && e.first === e.last && // either `null`, or a singular child
    (e.f & EFFECT_PRESERVED) === 0) {
      e = e.first;
      if ((type & BLOCK_EFFECT) !== 0 && (type & EFFECT_TRANSPARENT) !== 0 && e !== null) {
        e.f |= EFFECT_TRANSPARENT;
      }
    }
  }
  if (e !== null) {
    e.parent = parent;
    if (parent !== null) {
      push_effect(e, parent);
    }
    if (active_reaction !== null && (active_reaction.f & DERIVED) !== 0 && (type & ROOT_EFFECT) === 0) {
      var derived2 = (
        /** @type {Derived} */
        active_reaction
      );
      (derived2.effects ??= []).push(e);
    }
  }
  return effect2;
}
function effect_tracking() {
  return active_reaction !== null && !untracking;
}
function teardown(fn) {
  const effect2 = create_effect(RENDER_EFFECT, null);
  set_signal_status(effect2, CLEAN);
  effect2.teardown = fn;
  return effect2;
}
function user_effect(fn) {
  validate_effect("$effect");
  if (dev_fallback_default) {
    define_property(fn, "name", {
      value: "$effect"
    });
  }
  var flags2 = (
    /** @type {Effect} */
    active_effect.f
  );
  var defer = !active_reaction && (flags2 & BRANCH_EFFECT) !== 0 && component_context !== null && !component_context.i;
  if (defer) {
    var context = (
      /** @type {ComponentContext} */
      component_context
    );
    (context.e ??= []).push(fn);
  } else {
    return create_user_effect(fn);
  }
}
function create_user_effect(fn) {
  return create_effect(EFFECT | USER_EFFECT, fn);
}
function user_pre_effect(fn) {
  validate_effect("$effect.pre");
  if (dev_fallback_default) {
    define_property(fn, "name", {
      value: "$effect.pre"
    });
  }
  return create_effect(RENDER_EFFECT | USER_EFFECT, fn);
}
function effect_root(fn) {
  Batch.ensure();
  const effect2 = create_effect(ROOT_EFFECT | EFFECT_PRESERVED, fn);
  return () => {
    destroy_effect(effect2);
  };
}
function component_root(fn) {
  Batch.ensure();
  const effect2 = create_effect(ROOT_EFFECT | EFFECT_PRESERVED, fn);
  return (options = {}) => {
    return new Promise((fulfil) => {
      if (options.outro) {
        pause_effect(effect2, () => {
          destroy_effect(effect2);
          fulfil(void 0);
        });
      } else {
        destroy_effect(effect2);
        fulfil(void 0);
      }
    });
  };
}
function effect(fn) {
  return create_effect(EFFECT, fn);
}
function legacy_pre_effect(deps, fn) {
  var context = (
    /** @type {ComponentContextLegacy} */
    component_context
  );
  var token = { effect: null, ran: false, deps };
  context.l.$.push(token);
  token.effect = render_effect(() => {
    deps();
    if (token.ran) return;
    token.ran = true;
    var effect2 = (
      /** @type {Effect} */
      active_effect
    );
    try {
      set_active_effect(effect2.parent);
      untrack(fn);
    } finally {
      set_active_effect(effect2);
    }
  });
}
function legacy_pre_effect_reset() {
  var context = (
    /** @type {ComponentContextLegacy} */
    component_context
  );
  render_effect(() => {
    for (var token of context.l.$) {
      token.deps();
      var effect2 = token.effect;
      if ((effect2.f & CLEAN) !== 0 && effect2.deps !== null) {
        set_signal_status(effect2, MAYBE_DIRTY);
      }
      if (is_dirty(effect2)) {
        update_effect(effect2);
      }
      token.ran = false;
    }
  });
}
function async_effect(fn) {
  return create_effect(ASYNC | EFFECT_PRESERVED, fn);
}
function render_effect(fn, flags2 = 0) {
  return create_effect(RENDER_EFFECT | flags2, fn);
}
function template_effect(fn, sync = [], async2 = [], blockers = []) {
  flatten(blockers, sync, async2, (values) => {
    create_effect(RENDER_EFFECT, () => {
      fn(...values.map(get));
    });
  });
}
function block(fn, flags2 = 0) {
  var effect2 = create_effect(BLOCK_EFFECT | flags2, fn);
  if (dev_fallback_default) {
    effect2.dev_stack = dev_stack;
  }
  return effect2;
}
function branch(fn) {
  return create_effect(BRANCH_EFFECT | EFFECT_PRESERVED, fn);
}
function execute_effect_teardown(effect2) {
  var teardown2 = effect2.teardown;
  if (teardown2 !== null) {
    const previously_destroying_effect = is_destroying_effect;
    const previous_reaction = active_reaction;
    set_is_destroying_effect(true);
    set_active_reaction(null);
    try {
      teardown2.call(null);
    } catch (error) {
      invoke_error_boundary(error, effect2.parent);
    } finally {
      set_is_destroying_effect(previously_destroying_effect);
      set_active_reaction(previous_reaction);
    }
  }
}
function destroy_effect_children(signal, remove_dom = false) {
  var effect2 = signal.first;
  signal.first = signal.last = null;
  while (effect2 !== null) {
    const controller = effect2.ac;
    if (controller !== null) {
      without_reactive_context(() => {
        controller.abort(STALE_REACTION);
      });
    }
    var next2 = effect2.next;
    if ((effect2.f & ROOT_EFFECT) !== 0) {
      effect2.parent = null;
    } else {
      destroy_effect(effect2, remove_dom);
    }
    effect2 = next2;
  }
}
function destroy_block_effect_children(signal) {
  var effect2 = signal.first;
  while (effect2 !== null) {
    var next2 = effect2.next;
    if ((effect2.f & BRANCH_EFFECT) === 0) {
      destroy_effect(effect2);
    }
    effect2 = next2;
  }
}
function destroy_effect(effect2, remove_dom = true) {
  var removed = false;
  if ((remove_dom || (effect2.f & HEAD_EFFECT) !== 0) && effect2.nodes !== null && effect2.nodes.end !== null) {
    remove_effect_dom(
      effect2.nodes.start,
      /** @type {TemplateNode} */
      effect2.nodes.end
    );
    removed = true;
  }
  effect2.f |= DESTROYING;
  destroy_effect_children(effect2, remove_dom && !removed);
  remove_reactions(effect2, 0);
  var transitions = effect2.nodes && effect2.nodes.t;
  if (transitions !== null) {
    for (const transition2 of transitions) {
      transition2.stop();
    }
  }
  execute_effect_teardown(effect2);
  effect2.f ^= DESTROYING;
  effect2.f |= DESTROYED;
  var parent = effect2.parent;
  if (parent !== null && parent.first !== null) {
    unlink_effect(effect2);
  }
  if (dev_fallback_default) {
    effect2.component_function = null;
  }
  effect2.next = effect2.prev = effect2.teardown = effect2.ctx = effect2.deps = effect2.fn = effect2.nodes = effect2.ac = effect2.b = null;
}
function remove_effect_dom(node, end) {
  while (node !== null) {
    var next2 = node === end ? null : get_next_sibling(node);
    node.remove();
    node = next2;
  }
}
function unlink_effect(effect2) {
  var parent = effect2.parent;
  var prev = effect2.prev;
  var next2 = effect2.next;
  if (prev !== null) prev.next = next2;
  if (next2 !== null) next2.prev = prev;
  if (parent !== null) {
    if (parent.first === effect2) parent.first = next2;
    if (parent.last === effect2) parent.last = prev;
  }
}
function pause_effect(effect2, callback, destroy = true) {
  var transitions = [];
  effect2.f |= PAUSED;
  pause_children(effect2, transitions, true);
  var fn = () => {
    if (destroy) destroy_effect(effect2);
    if (callback) callback();
  };
  var remaining = transitions.length;
  if (remaining > 0) {
    var check = () => --remaining || fn();
    for (var transition2 of transitions) {
      transition2.out(check);
    }
  } else {
    fn();
  }
}
function pause_children(effect2, transitions, local) {
  if ((effect2.f & INERT) !== 0) return;
  effect2.f ^= INERT;
  var t = effect2.nodes && effect2.nodes.t;
  if (t !== null) {
    for (const transition2 of t) {
      if (transition2.is_global || local) {
        transitions.push(transition2);
      }
    }
  }
  var child2 = effect2.first;
  while (child2 !== null) {
    var sibling2 = child2.next;
    if ((child2.f & ROOT_EFFECT) === 0) {
      var transparent = (child2.f & EFFECT_TRANSPARENT) !== 0 || // If this is a branch effect without a block effect parent,
      // it means the parent block effect was pruned. In that case,
      // transparency information was transferred to the branch effect.
      (child2.f & BRANCH_EFFECT) !== 0 && (effect2.f & BLOCK_EFFECT) !== 0;
      pause_children(child2, transitions, transparent ? local : false);
    }
    child2 = sibling2;
  }
}
function resume_effect(effect2) {
  effect2.f &= ~PAUSED;
  resume_children(effect2, true);
}
function resume_children(effect2, local) {
  if ((effect2.f & PAUSED) !== 0) return;
  if ((effect2.f & INERT) === 0) return;
  effect2.f ^= INERT;
  if ((effect2.f & CLEAN) === 0) {
    set_signal_status(effect2, DIRTY);
    Batch.ensure().schedule(effect2);
  }
  var child2 = effect2.first;
  while (child2 !== null) {
    var sibling2 = child2.next;
    var transparent = (child2.f & EFFECT_TRANSPARENT) !== 0 || (child2.f & BRANCH_EFFECT) !== 0;
    resume_children(child2, transparent ? local : false);
    child2 = sibling2;
  }
  var t = effect2.nodes && effect2.nodes.t;
  if (t !== null) {
    for (const transition2 of t) {
      if (transition2.is_global || local) {
        transition2.in();
      }
    }
  }
}
function move_effect(effect2, fragment) {
  if (!effect2.nodes) return;
  var node = effect2.nodes.start;
  var end = effect2.nodes.end;
  while (node !== null) {
    var next2 = node === end ? null : get_next_sibling(node);
    fragment.append(node);
    node = next2;
  }
}

// node_modules/svelte/src/internal/client/legacy.js
var captured_signals = null;

// node_modules/svelte/src/internal/client/runtime.js
var is_updating_effect = false;
var is_destroying_effect = false;
function set_is_destroying_effect(value) {
  is_destroying_effect = value;
}
var active_reaction = null;
var untracking = false;
function set_active_reaction(reaction) {
  active_reaction = reaction;
}
var active_effect = null;
function set_active_effect(effect2) {
  active_effect = effect2;
}
var current_sources = null;
function push_reaction_value(value) {
  if (active_reaction !== null && (!async_mode_flag && (active_reaction.f & REACTION_IS_UPDATING) !== 0 || (active_reaction.f & DERIVED) !== 0)) {
    (current_sources ??= /* @__PURE__ */ new Set()).add(value);
  }
}
var new_deps = null;
var skipped_deps = 0;
var untracked_writes = null;
function set_untracked_writes(value) {
  untracked_writes = value;
}
var write_version = 1;
var read_version = 0;
var update_version = read_version;
function set_update_version(value) {
  update_version = value;
}
function increment_write_version() {
  return ++write_version;
}
function is_dirty(reaction) {
  var flags2 = reaction.f;
  if ((flags2 & DIRTY) !== 0) {
    return true;
  }
  if ((flags2 & MAYBE_DIRTY) !== 0) {
    var dependencies = (
      /** @type {Value[]} */
      reaction.deps
    );
    var length = dependencies.length;
    for (var i = 0; i < length; i++) {
      var dependency = dependencies[i];
      if (is_dirty(
        /** @type {Derived} */
        dependency
      )) {
        update_derived(
          /** @type {Derived} */
          dependency
        );
      }
      if (dependency.wv > reaction.wv) {
        return true;
      }
    }
    if ((flags2 & CONNECTED) !== 0 && // During time traveling we don't want to reset the status so that
    // traversal of the graph in the other batches still happens
    batch_values === null) {
      set_signal_status(reaction, CLEAN);
    }
  }
  return false;
}
function schedule_possible_effect_self_invalidation(signal, effect2, root5 = true) {
  var reactions = signal.reactions;
  if (reactions === null) return;
  if (!async_mode_flag && current_sources !== null && current_sources.has(signal)) {
    return;
  }
  for (var i = 0; i < reactions.length; i++) {
    var reaction = reactions[i];
    if ((reaction.f & DERIVED) !== 0) {
      schedule_possible_effect_self_invalidation(
        /** @type {Derived} */
        reaction,
        effect2,
        false
      );
    } else if (effect2 === reaction) {
      if (root5) {
        set_signal_status(reaction, DIRTY);
      } else if ((reaction.f & CLEAN) !== 0) {
        set_signal_status(reaction, MAYBE_DIRTY);
      }
      schedule_effect(
        /** @type {Effect} */
        reaction
      );
    }
  }
}
function update_reaction(reaction) {
  var previous_deps = new_deps;
  var previous_skipped_deps = skipped_deps;
  var previous_untracked_writes = untracked_writes;
  var previous_reaction = active_reaction;
  var previous_sources = current_sources;
  var previous_component_context = component_context;
  var previous_untracking = untracking;
  var previous_update_version = update_version;
  var flags2 = reaction.f;
  new_deps = /** @type {null | Value[]} */
  null;
  skipped_deps = 0;
  untracked_writes = null;
  active_reaction = (flags2 & (BRANCH_EFFECT | ROOT_EFFECT)) === 0 ? reaction : null;
  current_sources = null;
  set_component_context(reaction.ctx);
  untracking = false;
  update_version = ++read_version;
  if (reaction.ac !== null) {
    without_reactive_context(() => {
      reaction.ac.abort(STALE_REACTION);
    });
    reaction.ac = null;
  }
  try {
    reaction.f |= REACTION_IS_UPDATING;
    var fn = (
      /** @type {Function} */
      reaction.fn
    );
    var result = fn();
    reaction.f |= REACTION_RAN;
    var deps = update_dependencies(reaction);
    if (is_runes() && untracked_writes !== null && !untracking && deps !== null && (reaction.f & (DERIVED | MAYBE_DIRTY | DIRTY)) === 0) {
      for (var i = 0; i < /** @type {Source[]} */
      untracked_writes.length; i++) {
        schedule_possible_effect_self_invalidation(
          untracked_writes[i],
          /** @type {Effect} */
          reaction
        );
      }
    }
    if (previous_reaction !== null && previous_reaction !== reaction) {
      read_version++;
      if (previous_reaction.deps !== null) {
        for (let i2 = 0; i2 < previous_skipped_deps; i2 += 1) {
          previous_reaction.deps[i2].rv = read_version;
        }
      }
      if (previous_deps !== null) {
        for (const dep of previous_deps) {
          dep.rv = read_version;
        }
      }
      if (untracked_writes !== null) {
        if (previous_untracked_writes === null) {
          previous_untracked_writes = untracked_writes;
        } else {
          previous_untracked_writes.push(.../** @type {Source[]} */
          untracked_writes);
        }
      }
    }
    if ((reaction.f & ERROR_VALUE) !== 0) {
      reaction.f ^= ERROR_VALUE;
    }
    return result;
  } catch (error) {
    update_dependencies(reaction);
    return handle_error(error);
  } finally {
    reaction.f ^= REACTION_IS_UPDATING;
    new_deps = previous_deps;
    skipped_deps = previous_skipped_deps;
    untracked_writes = previous_untracked_writes;
    active_reaction = previous_reaction;
    current_sources = previous_sources;
    set_component_context(previous_component_context);
    untracking = previous_untracking;
    update_version = previous_update_version;
  }
}
function update_dependencies(reaction) {
  var deps = reaction.deps;
  var is_fork = current_batch?.is_fork;
  if (new_deps !== null) {
    var i;
    if (!is_fork) {
      remove_reactions(reaction, skipped_deps);
    }
    if (deps !== null && skipped_deps > 0) {
      deps.length = skipped_deps + new_deps.length;
      for (i = 0; i < new_deps.length; i++) {
        deps[skipped_deps + i] = new_deps[i];
      }
    } else {
      reaction.deps = deps = new_deps;
    }
    if (effect_tracking() && (reaction.f & CONNECTED) !== 0) {
      for (i = skipped_deps; i < deps.length; i++) {
        (deps[i].reactions ??= []).push(reaction);
      }
    }
  } else if (!is_fork && deps !== null && skipped_deps < deps.length) {
    remove_reactions(reaction, skipped_deps);
    deps.length = skipped_deps;
  }
  return deps;
}
function remove_reaction(signal, dependency) {
  let reactions = dependency.reactions;
  if (reactions !== null) {
    var index2 = index_of.call(reactions, signal);
    if (index2 !== -1) {
      var new_length = reactions.length - 1;
      if (new_length === 0) {
        reactions = dependency.reactions = null;
      } else {
        reactions[index2] = reactions[new_length];
        reactions.pop();
      }
    }
  }
  if (reactions === null && (dependency.f & DERIVED) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (new_deps === null || !includes.call(new_deps, dependency))) {
    var derived2 = (
      /** @type {Derived} */
      dependency
    );
    if ((derived2.f & CONNECTED) !== 0) {
      derived2.f ^= CONNECTED;
    }
    if (derived2.v !== UNINITIALIZED) {
      update_derived_status(derived2);
    }
    if (derived2.ac !== null) {
      without_reactive_context(() => {
        derived2.ac.abort(STALE_REACTION);
        derived2.ac = null;
        set_signal_status(derived2, DIRTY);
      });
    }
    freeze_derived_effects(derived2);
    remove_reactions(derived2, 0);
  }
}
function remove_reactions(signal, start_index) {
  var dependencies = signal.deps;
  if (dependencies === null) return;
  for (var i = start_index; i < dependencies.length; i++) {
    remove_reaction(signal, dependencies[i]);
  }
}
function update_effect(effect2) {
  var flags2 = effect2.f;
  if ((flags2 & DESTROYED) !== 0) {
    return;
  }
  set_signal_status(effect2, CLEAN);
  var previous_effect = active_effect;
  var was_updating_effect = is_updating_effect;
  active_effect = effect2;
  is_updating_effect = (flags2 & (BRANCH_EFFECT | ROOT_EFFECT)) === 0;
  if (dev_fallback_default) {
    var previous_component_fn = dev_current_component_function;
    set_dev_current_component_function(effect2.component_function);
    var previous_stack = (
      /** @type {any} */
      dev_stack
    );
    set_dev_stack(effect2.dev_stack ?? dev_stack);
  }
  try {
    if ((flags2 & (BLOCK_EFFECT | MANAGED_EFFECT)) !== 0) {
      destroy_block_effect_children(effect2);
    } else {
      destroy_effect_children(effect2);
    }
    execute_effect_teardown(effect2);
    var teardown2 = update_reaction(effect2);
    effect2.teardown = typeof teardown2 === "function" ? teardown2 : null;
    effect2.wv = write_version;
    if (dev_fallback_default && tracing_mode_flag && (effect2.f & DIRTY) !== 0 && effect2.deps !== null) {
      for (var dep of effect2.deps) {
        if (dep.set_during_effect) {
          dep.wv = increment_write_version();
          dep.set_during_effect = false;
        }
      }
    }
  } finally {
    is_updating_effect = was_updating_effect;
    active_effect = previous_effect;
    if (dev_fallback_default) {
      set_dev_current_component_function(previous_component_fn);
      set_dev_stack(previous_stack);
    }
  }
}
async function tick() {
  if (async_mode_flag) {
    return new Promise((f) => {
      requestAnimationFrame(() => f());
      setTimeout(() => f());
    });
  }
  await Promise.resolve();
  flushSync();
}
function get(signal) {
  var flags2 = signal.f;
  var is_derived = (flags2 & DERIVED) !== 0;
  captured_signals?.add(signal);
  if (active_reaction !== null && !untracking) {
    var destroyed = active_effect !== null && (active_effect.f & DESTROYED) !== 0;
    if (!destroyed && (current_sources === null || !current_sources.has(signal))) {
      var deps = active_reaction.deps;
      if ((active_reaction.f & REACTION_IS_UPDATING) !== 0) {
        if (signal.rv < read_version) {
          signal.rv = read_version;
          if (new_deps === null && deps !== null && deps[skipped_deps] === signal) {
            skipped_deps++;
          } else if (new_deps === null) {
            new_deps = [signal];
          } else {
            new_deps.push(signal);
          }
        }
      } else {
        active_reaction.deps ??= [];
        if (!includes.call(active_reaction.deps, signal)) {
          active_reaction.deps.push(signal);
        }
        var reactions = signal.reactions;
        if (reactions === null) {
          signal.reactions = [active_reaction];
        } else if (!includes.call(reactions, active_reaction)) {
          reactions.push(active_reaction);
        }
      }
    }
  }
  if (dev_fallback_default) {
    if (!untracking && reactivity_loss_tracker && // By checking that current/previous batch are null we filter out false positives.
    // reactivity_loss_tracker is only reset after a microtask, so if a flush happens
    // before that, we get warnings for things we shouldn't warn on.
    current_batch === null && previous_batch === null && !reactivity_loss_tracker.warned && (reactivity_loss_tracker.effect.f & REACTION_IS_UPDATING) === 0 && !reactivity_loss_tracker.effect_deps.has(signal)) {
      reactivity_loss_tracker.warned = true;
      await_reactivity_loss(
        /** @type {string} */
        signal.label
      );
      var trace2 = get_error("traced at");
      if (trace2) console.warn(trace2);
    }
    recent_async_deriveds.delete(signal);
    if (tracing_mode_flag && !untracking && tracing_expressions !== null && active_reaction !== null && tracing_expressions.reaction === active_reaction) {
      if (signal.trace) {
        signal.trace();
      } else {
        trace2 = get_error("traced at");
        if (trace2) {
          var entry = tracing_expressions.entries.get(signal);
          if (entry === void 0) {
            entry = { traces: [] };
            tracing_expressions.entries.set(signal, entry);
          }
          var last = entry.traces[entry.traces.length - 1];
          if (trace2.stack !== last?.stack) {
            entry.traces.push(trace2);
          }
        }
      }
    }
  }
  if (is_destroying_effect && old_values.has(signal)) {
    return old_values.get(signal);
  }
  if (is_derived) {
    var derived2 = (
      /** @type {Derived} */
      signal
    );
    if (is_destroying_effect) {
      var value = derived2.v;
      if ((derived2.f & CLEAN) === 0 && derived2.reactions !== null || depends_on_old_values(derived2)) {
        value = execute_derived(derived2);
      }
      old_values.set(derived2, value);
      return value;
    }
    var should_connect = (derived2.f & CONNECTED) === 0 && !untracking && active_reaction !== null && (is_updating_effect || (active_reaction.f & CONNECTED) !== 0);
    var is_new = (derived2.f & REACTION_RAN) === 0;
    if (is_dirty(derived2)) {
      if (should_connect) {
        derived2.f |= CONNECTED;
      }
      update_derived(derived2);
    }
    if (should_connect && !is_new) {
      unfreeze_derived_effects(derived2);
      reconnect(derived2);
    }
  }
  if (batch_values?.has(signal)) {
    return batch_values.get(signal);
  }
  if ((signal.f & ERROR_VALUE) !== 0) {
    throw signal.v;
  }
  return signal.v;
}
function reconnect(derived2) {
  derived2.f |= CONNECTED;
  if (derived2.deps === null) return;
  for (const dep of derived2.deps) {
    (dep.reactions ??= []).push(derived2);
    if ((dep.f & DERIVED) !== 0 && (dep.f & CONNECTED) === 0) {
      unfreeze_derived_effects(
        /** @type {Derived} */
        dep
      );
      reconnect(
        /** @type {Derived} */
        dep
      );
    }
  }
}
function depends_on_old_values(derived2) {
  if (derived2.v === UNINITIALIZED) return true;
  if (derived2.deps === null) return false;
  for (const dep of derived2.deps) {
    if (old_values.has(dep)) {
      return true;
    }
    if ((dep.f & DERIVED) !== 0 && depends_on_old_values(
      /** @type {Derived} */
      dep
    )) {
      return true;
    }
  }
  return false;
}
function untrack(fn) {
  var previous_untracking = untracking;
  try {
    untracking = true;
    return fn();
  } finally {
    untracking = previous_untracking;
  }
}
function deep_read_state(value) {
  if (typeof value !== "object" || !value || value instanceof EventTarget) {
    return;
  }
  if (STATE_SYMBOL in value) {
    deep_read(value);
  } else if (!Array.isArray(value)) {
    for (let key2 in value) {
      const prop2 = value[key2];
      if (typeof prop2 === "object" && prop2 && STATE_SYMBOL in prop2) {
        deep_read(prop2);
      }
    }
  }
}
function deep_read(value, visited = /* @__PURE__ */ new Set()) {
  if (typeof value === "object" && value !== null && // We don't want to traverse DOM elements
  !(value instanceof EventTarget) && !visited.has(value)) {
    visited.add(value);
    if (value instanceof Date) {
      value.getTime();
    }
    for (let key2 in value) {
      try {
        deep_read(value[key2], visited);
      } catch (e) {
      }
    }
    const proto = get_prototype_of(value);
    if (proto !== Object.prototype && proto !== Array.prototype && proto !== Map.prototype && proto !== Set.prototype && proto !== Date.prototype) {
      const descriptors = get_descriptors(proto);
      for (let key2 in descriptors) {
        const get3 = descriptors[key2].get;
        if (get3) {
          try {
            get3.call(value);
          } catch (e) {
          }
        }
      }
    }
  }
}

// node_modules/svelte/src/utils.js
var DOM_BOOLEAN_ATTRIBUTES = [
  "allowfullscreen",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "disabled",
  "formnovalidate",
  "indeterminate",
  "inert",
  "ismap",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "seamless",
  "selected",
  "webkitdirectory",
  "defer",
  "disablepictureinpicture",
  "disableremoteplayback"
];
var DOM_PROPERTIES = [
  ...DOM_BOOLEAN_ATTRIBUTES,
  "formNoValidate",
  "isMap",
  "noModule",
  "playsInline",
  "readOnly",
  "value",
  "volume",
  "defaultValue",
  "defaultChecked",
  "srcObject",
  "noValidate",
  "allowFullscreen",
  "disablePictureInPicture",
  "disableRemotePlayback"
];
var PASSIVE_EVENTS = ["touchstart", "touchmove"];
function is_passive_event(name) {
  return PASSIVE_EVENTS.includes(name);
}
var STATE_CREATION_RUNES = (
  /** @type {const} */
  [
    "$state",
    "$state.raw",
    "$derived",
    "$derived.by"
  ]
);
var RUNES = (
  /** @type {const} */
  [
    ...STATE_CREATION_RUNES,
    "$state.eager",
    "$state.snapshot",
    "$props",
    "$props.id",
    "$bindable",
    "$effect",
    "$effect.pre",
    "$effect.tracking",
    "$effect.root",
    "$effect.pending",
    "$inspect",
    "$inspect().with",
    "$inspect.trace",
    "$host"
  ]
);

// node_modules/svelte/src/internal/client/dev/css.js
var all_styles = /* @__PURE__ */ new Map();
function register_style(hash2, style) {
  var styles = all_styles.get(hash2);
  if (!styles) {
    styles = /* @__PURE__ */ new Set();
    all_styles.set(hash2, styles);
  }
  styles.add(style);
}

// node_modules/svelte/src/internal/client/dom/elements/events.js
var event_symbol = Symbol("events");
var all_registered_events = /* @__PURE__ */ new Set();
var root_event_handles = /* @__PURE__ */ new Set();
function create_event(event_name, dom, handler, options = {}) {
  function target_handler(event2) {
    if (!options.capture) {
      handle_event_propagation.call(dom, event2);
    }
    if (!event2.cancelBubble) {
      return without_reactive_context(() => {
        return handler?.call(this, event2);
      });
    }
  }
  if (event_name.startsWith("pointer") || event_name.startsWith("touch") || event_name === "wheel") {
    target_handler.__removed = false;
    queue_micro_task(() => {
      if (!target_handler.__removed) {
        dom.addEventListener(event_name, target_handler, options);
      }
    });
  } else {
    dom.addEventListener(event_name, target_handler, options);
  }
  return target_handler;
}
function event(event_name, dom, handler, capture2, passive2) {
  var options = { capture: capture2, passive: passive2 };
  var target_handler = create_event(event_name, dom, handler, options);
  if (dom === document.body || // @ts-ignore
  dom === window || // @ts-ignore
  dom === document || // Firefox has quirky behavior, it can happen that we still get "canplay" events when the element is already removed
  dom instanceof HTMLMediaElement) {
    teardown(() => {
      target_handler.__removed = true;
      dom.removeEventListener(event_name, target_handler, options);
    });
  }
}
var last_propagated_event = null;
var last_propagated_event_clear_scheduled = false;
function handle_event_propagation(event2) {
  var handler_element = this;
  var owner_document = (
    /** @type {Node} */
    handler_element.ownerDocument
  );
  var event_name = event2.type;
  var path = event2.composedPath?.() || [];
  var current_target = (
    /** @type {null | Element} */
    path[0] || event2.target
  );
  last_propagated_event = event2;
  if (!last_propagated_event_clear_scheduled) {
    last_propagated_event_clear_scheduled = true;
    setTimeout(() => {
      last_propagated_event_clear_scheduled = false;
      last_propagated_event = null;
    });
  }
  var path_idx = 0;
  var handled_at = last_propagated_event === event2 && event2[event_symbol];
  if (handled_at) {
    var at_idx = path.indexOf(handled_at);
    if (at_idx !== -1 && (handler_element === document || handler_element === /** @type {any} */
    window)) {
      event2[event_symbol] = handler_element;
      return;
    }
    var handler_idx = path.indexOf(handler_element);
    if (handler_idx === -1) {
      return;
    }
    if (at_idx <= handler_idx) {
      path_idx = at_idx;
    }
  }
  current_target = /** @type {Element} */
  path[path_idx] || event2.target;
  if (current_target === handler_element) return;
  define_property(event2, "currentTarget", {
    configurable: true,
    get() {
      return current_target || owner_document;
    }
  });
  var previous_reaction = active_reaction;
  var previous_effect = active_effect;
  set_active_reaction(null);
  set_active_effect(null);
  try {
    var throw_error;
    var other_errors = [];
    while (current_target !== null) {
      if (current_target === handler_element) break;
      try {
        var delegated2 = current_target[event_symbol]?.[event_name];
        if (delegated2 != null && (!/** @type {any} */
        current_target.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
        // -> the target could not have been disabled because it emits the event in the first place
        event2.target === current_target)) {
          delegated2.call(current_target, event2);
        }
      } catch (error) {
        if (throw_error) {
          other_errors.push(error);
        } else {
          throw_error = error;
        }
      }
      if (event2.cancelBubble) break;
      path_idx++;
      current_target = path_idx < path.length ? (
        /** @type {Element} */
        path[path_idx]
      ) : null;
    }
    if (throw_error) {
      for (let error of other_errors) {
        queueMicrotask(() => {
          throw error;
        });
      }
      throw throw_error;
    }
  } finally {
    event2[event_symbol] = handler_element;
    delete event2.currentTarget;
    set_active_reaction(previous_reaction);
    set_active_effect(previous_effect);
  }
}

// node_modules/svelte/src/internal/client/dom/reconciler.js
var policy = (
  // We gotta write it like this because after downleveling the pure comment may end up in the wrong location
  globalThis?.window?.trustedTypes && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", {
    /** @param {string} html */
    createHTML: (html2) => {
      return html2;
    }
  })
);
function create_trusted_html(html2) {
  return (
    /** @type {string} */
    policy?.createHTML(html2) ?? html2
  );
}
function create_fragment_from_html(html2) {
  var elem = create_element("template");
  elem.innerHTML = create_trusted_html(html2.replaceAll("<!>", "<!---->"));
  return elem.content;
}

// node_modules/svelte/src/internal/client/dom/template.js
function assign_nodes(start, end) {
  var effect2 = (
    /** @type {Effect} */
    active_effect
  );
  if (effect2.nodes === null) {
    effect2.nodes = { start, end, a: null, t: null };
  }
}
// @__NO_SIDE_EFFECTS__
function from_html(content, flags2) {
  var is_fragment = (flags2 & TEMPLATE_FRAGMENT) !== 0;
  var use_import_node = (flags2 & TEMPLATE_USE_IMPORT_NODE) !== 0;
  var node;
  var has_start = !content.startsWith("<!>");
  return () => {
    if (hydrating) {
      assign_nodes(hydrate_node, null);
      return hydrate_node;
    }
    if (node === void 0) {
      node = create_fragment_from_html(has_start ? content : "<!>" + content);
      if (!is_fragment) node = /** @type {TemplateNode} */
      get_first_child(node);
    }
    var clone = (
      /** @type {TemplateNode} */
      use_import_node || is_firefox ? document.importNode(node, true) : node.cloneNode(true)
    );
    if (is_fragment) {
      var start = (
        /** @type {TemplateNode} */
        get_first_child(clone)
      );
      var end = (
        /** @type {TemplateNode} */
        clone.lastChild
      );
      assign_nodes(start, end);
    } else {
      assign_nodes(clone, clone);
    }
    return clone;
  };
}
function comment() {
  if (hydrating) {
    assign_nodes(hydrate_node, null);
    return hydrate_node;
  }
  var frag = document.createDocumentFragment();
  var start = document.createComment("");
  var anchor = create_text();
  frag.append(start, anchor);
  assign_nodes(start, anchor);
  return frag;
}
function append(anchor, dom) {
  if (hydrating) {
    var effect2 = (
      /** @type {Effect & { nodes: EffectNodes }} */
      active_effect
    );
    if ((effect2.f & REACTION_RAN) === 0 || effect2.nodes.end === null) {
      effect2.nodes.end = hydrate_node;
    }
    hydrate_next();
    return;
  }
  if (anchor === null) {
    return;
  }
  anchor.before(
    /** @type {Node} */
    dom
  );
}

// node_modules/svelte/src/reactivity/create-subscriber.js
function createSubscriber(start) {
  let subscribers = 0;
  let version = source(0);
  let stop;
  if (dev_fallback_default) {
    tag(version, "createSubscriber version");
  }
  return () => {
    if (effect_tracking()) {
      get(version);
      render_effect(() => {
        if (subscribers === 0) {
          stop = untrack(() => start(() => increment(version)));
        }
        subscribers += 1;
        return () => {
          queue_micro_task(() => {
            subscribers -= 1;
            if (subscribers === 0) {
              stop?.();
              stop = void 0;
              increment(version);
            }
          });
        };
      });
    }
  };
}

// node_modules/svelte/src/internal/client/dom/blocks/boundary.js
var flags = EFFECT_TRANSPARENT | EFFECT_PRESERVED;
function boundary(node, props, children, transform_error) {
  new Boundary(node, props, children, transform_error);
}
var Boundary = class {
  /** @type {Boundary | null} */
  parent;
  is_pending = false;
  /**
   * API-level transformError transform function. Transforms errors before they reach the `failed` snippet.
   * Inherited from parent boundary, or defaults to identity.
   * @type {(error: unknown) => unknown}
   */
  transform_error;
  /** @type {TemplateNode} */
  #anchor;
  /** @type {TemplateNode | null} */
  #hydrate_open = hydrating ? hydrate_node : null;
  /** @type {BoundaryProps} */
  #props;
  /** @type {((anchor: Node) => void)} */
  #children;
  /** @type {Effect} */
  #effect;
  /** @type {Effect | null} */
  #main_effect = null;
  /** @type {Effect | null} */
  #pending_effect = null;
  /** @type {Effect | null} */
  #failed_effect = null;
  /** @type {DocumentFragment | null} */
  #offscreen_fragment = null;
  #local_pending_count = 0;
  #pending_count = 0;
  #pending_count_update_queued = false;
  /** @type {Set<Effect>} */
  #dirty_effects = /* @__PURE__ */ new Set();
  /** @type {Set<Effect>} */
  #maybe_dirty_effects = /* @__PURE__ */ new Set();
  /**
   * A source containing the number of pending async deriveds/expressions.
   * Only created if `$effect.pending()` is used inside the boundary,
   * otherwise updating the source results in needless `Batch.ensure()`
   * calls followed by no-op flushes
   * @type {Source<number> | null}
   */
  #effect_pending = null;
  #effect_pending_subscriber = createSubscriber(() => {
    this.#effect_pending = source(this.#local_pending_count);
    if (dev_fallback_default) {
      tag(this.#effect_pending, "$effect.pending()");
    }
    return () => {
      this.#effect_pending = null;
    };
  });
  /**
   * @param {TemplateNode} node
   * @param {BoundaryProps} props
   * @param {((anchor: Node) => void)} children
   * @param {((error: unknown) => unknown) | undefined} [transform_error]
   */
  constructor(node, props, children, transform_error) {
    this.#anchor = node;
    this.#props = props;
    this.#children = (anchor) => {
      var effect2 = (
        /** @type {Effect} */
        active_effect
      );
      effect2.b = this;
      effect2.f |= BOUNDARY_EFFECT;
      children(anchor);
    };
    this.parent = /** @type {Effect} */
    active_effect.b;
    this.transform_error = transform_error ?? this.parent?.transform_error ?? ((e) => e);
    this.#effect = block(() => {
      if (hydrating) {
        const comment2 = (
          /** @type {Comment} */
          this.#hydrate_open
        );
        hydrate_next();
        const server_rendered_pending = comment2.data === HYDRATION_START_ELSE;
        const server_rendered_failed = comment2.data.startsWith(HYDRATION_START_FAILED);
        if (server_rendered_failed) {
          const serialized_error = JSON.parse(comment2.data.slice(HYDRATION_START_FAILED.length));
          this.#hydrate_failed_content(serialized_error);
        } else if (server_rendered_pending) {
          this.#hydrate_pending_content();
        } else {
          this.#hydrate_resolved_content();
        }
      } else {
        this.#render();
      }
    }, flags);
    if (hydrating) {
      this.#anchor = hydrate_node;
    }
  }
  #hydrate_resolved_content() {
    try {
      this.#main_effect = branch(() => this.#children(this.#anchor));
    } catch (error) {
      this.error(error);
    }
  }
  /**
   * @param {unknown} error The deserialized error from the server's hydration comment
   */
  #hydrate_failed_content(error) {
    const failed = this.#props.failed;
    const { reset: reset2, invoke_onerror } = this.#create_reset(error);
    queue_micro_task(invoke_onerror);
    if (!failed) return;
    this.#failed_effect = branch(() => {
      failed(
        this.#anchor,
        () => error,
        () => reset2
      );
    });
  }
  /**
   * Creates the `reset` function for a failed boundary, along with a function
   * that invokes `onerror` with it (if provided)
   * @param {unknown} error
   * @returns {{ reset: () => void, invoke_onerror: () => void }}
   */
  #create_reset(error) {
    var did_reset = false;
    var calling_on_error = false;
    const reset2 = () => {
      if (did_reset) {
        svelte_boundary_reset_noop();
        return;
      }
      did_reset = true;
      if (calling_on_error) {
        svelte_boundary_reset_onerror();
      }
      if (this.#failed_effect !== null) {
        pause_effect(this.#failed_effect, () => {
          this.#failed_effect = null;
        });
      }
      this.#run(() => {
        this.#render();
      });
    };
    const invoke_onerror = () => {
      try {
        calling_on_error = true;
        this.#props.onerror?.(error, reset2);
        calling_on_error = false;
      } catch (err) {
        invoke_error_boundary(err, this.#effect && this.#effect.parent);
      }
    };
    return { reset: reset2, invoke_onerror };
  }
  #hydrate_pending_content() {
    const pending2 = this.#props.pending;
    if (!pending2) return;
    this.is_pending = true;
    this.#pending_effect = branch(() => pending2(this.#anchor));
    queue_micro_task(() => {
      var fragment = this.#offscreen_fragment = document.createDocumentFragment();
      var anchor = create_text();
      var handled = false;
      fragment.append(anchor);
      this.#main_effect = this.#run(() => {
        try {
          return branch(() => this.#children(anchor));
        } catch (error) {
          try {
            this.error(error);
            handled = true;
          } catch (error2) {
            invoke_error_boundary(error2, this.#effect.parent);
          }
          return null;
        }
      });
      if (this.#main_effect === null) {
        this.#offscreen_fragment = null;
        if (handled) this.#resolve(
          /** @type {Batch} */
          current_batch
        );
        return;
      }
      if (this.#pending_count === 0) {
        this.#anchor.before(fragment);
        this.#offscreen_fragment = null;
        pause_effect(
          /** @type {Effect} */
          this.#pending_effect,
          () => {
            this.#pending_effect = null;
          }
        );
        this.#resolve(
          /** @type {Batch} */
          current_batch
        );
      }
    });
  }
  #render() {
    try {
      this.is_pending = this.has_pending_snippet();
      this.#pending_count = 0;
      this.#local_pending_count = 0;
      this.#main_effect = branch(() => {
        this.#children(this.#anchor);
      });
      if (this.#pending_count > 0) {
        var fragment = this.#offscreen_fragment = document.createDocumentFragment();
        move_effect(this.#main_effect, fragment);
        const pending2 = (
          /** @type {(anchor: Node) => void} */
          this.#props.pending
        );
        this.#pending_effect = branch(() => pending2(this.#anchor));
      } else {
        this.#resolve(
          /** @type {Batch} */
          current_batch
        );
      }
    } catch (error) {
      this.error(error);
    }
  }
  /**
   * @param {Batch} batch
   */
  #resolve(batch) {
    this.is_pending = false;
    batch.transfer_effects(this.#dirty_effects, this.#maybe_dirty_effects);
  }
  /**
   * Defer an effect inside a pending boundary until the boundary resolves
   * @param {Effect} effect
   */
  defer_effect(effect2) {
    defer_effect(effect2, this.#dirty_effects, this.#maybe_dirty_effects);
  }
  /**
   * Returns `false` if the effect exists inside a boundary whose pending snippet is shown
   * @returns {boolean}
   */
  is_rendered() {
    return !this.is_pending && (!this.parent || this.parent.is_rendered());
  }
  has_pending_snippet() {
    return !!this.#props.pending;
  }
  /**
   * @template T
   * @param {() => T} fn
   */
  #run(fn) {
    var previous_effect = active_effect;
    var previous_reaction = active_reaction;
    var previous_ctx = component_context;
    set_active_effect(this.#effect);
    set_active_reaction(this.#effect);
    set_component_context(this.#effect.ctx);
    try {
      Batch.ensure();
      return fn();
    } finally {
      set_active_effect(previous_effect);
      set_active_reaction(previous_reaction);
      set_component_context(previous_ctx);
    }
  }
  /**
   * Updates the pending count associated with the currently visible pending snippet,
   * if any, such that we can replace the snippet with content once work is done
   * @param {1 | -1} d
   * @param {Batch} batch
   */
  #update_pending_count(d, batch) {
    if (!this.has_pending_snippet()) {
      if (this.parent) {
        this.parent.#update_pending_count(d, batch);
      }
      return;
    }
    this.#pending_count += d;
    if (this.#pending_count === 0) {
      this.#resolve(batch);
      if (this.#pending_effect) {
        pause_effect(this.#pending_effect, () => {
          this.#pending_effect = null;
        });
      }
      if (this.#offscreen_fragment) {
        this.#anchor.before(this.#offscreen_fragment);
        this.#offscreen_fragment = null;
      }
    }
  }
  /**
   * Update the source that powers `$effect.pending()` inside this boundary,
   * and controls when the current `pending` snippet (if any) is removed.
   * Do not call from inside the class
   * @param {1 | -1} d
   * @param {Batch} batch
   */
  update_pending_count(d, batch) {
    this.#update_pending_count(d, batch);
    this.#local_pending_count += d;
    if (!this.#effect_pending || this.#pending_count_update_queued) return;
    this.#pending_count_update_queued = true;
    queue_micro_task(() => {
      this.#pending_count_update_queued = false;
      if (this.#effect_pending) {
        internal_set(this.#effect_pending, this.#local_pending_count);
      }
    });
  }
  get_effect_pending() {
    this.#effect_pending_subscriber();
    return get(
      /** @type {Source<number>} */
      this.#effect_pending
    );
  }
  /** @param {unknown} error */
  error(error) {
    if (!this.#props.onerror && !this.#props.failed) {
      throw error;
    }
    if (current_batch?.is_fork) {
      if (this.#main_effect) current_batch.skip_effect(this.#main_effect);
      if (this.#pending_effect) current_batch.skip_effect(this.#pending_effect);
      if (this.#failed_effect) current_batch.skip_effect(this.#failed_effect);
      current_batch.oncommit(() => {
        this.#handle_error(error);
      });
    } else {
      this.#handle_error(error);
    }
  }
  /**
   * @param {unknown} error
   */
  #handle_error(error) {
    if (this.#main_effect) {
      destroy_effect(this.#main_effect);
      this.#main_effect = null;
    }
    if (this.#pending_effect) {
      destroy_effect(this.#pending_effect);
      this.#pending_effect = null;
    }
    if (this.#failed_effect) {
      destroy_effect(this.#failed_effect);
      this.#failed_effect = null;
    }
    if (hydrating) {
      set_hydrate_node(
        /** @type {TemplateNode} */
        this.#hydrate_open
      );
      next();
      set_hydrate_node(skip_nodes());
    }
    let failed = this.#props.failed;
    const handle_error_result = (transformed_error) => {
      const { reset: reset2, invoke_onerror } = this.#create_reset(transformed_error);
      invoke_onerror();
      if (failed) {
        this.#failed_effect = this.#run(() => {
          try {
            return branch(() => {
              var effect2 = (
                /** @type {Effect} */
                active_effect
              );
              effect2.b = this;
              effect2.f |= BOUNDARY_EFFECT;
              failed(
                this.#anchor,
                () => transformed_error,
                () => reset2
              );
            });
          } catch (error2) {
            invoke_error_boundary(
              error2,
              /** @type {Effect} */
              this.#effect.parent
            );
            return null;
          }
        });
      }
    };
    queue_micro_task(() => {
      var result;
      try {
        result = this.transform_error(error);
      } catch (e) {
        invoke_error_boundary(e, this.#effect && this.#effect.parent);
        return;
      }
      if (result !== null && typeof result === "object" && typeof /** @type {any} */
      result.then === "function") {
        result.then(
          handle_error_result,
          /** @param {unknown} e */
          (e) => invoke_error_boundary(e, this.#effect && this.#effect.parent)
        );
      } else {
        handle_error_result(result);
      }
    });
  }
};

// node_modules/svelte/src/internal/client/render.js
var should_intro = true;
function set_text(text2, value) {
  var str = value == null ? "" : typeof value === "object" ? `${value}` : value;
  if (str !== /** @type {any} */
  (text2[TEXT_CACHE] ??= text2.nodeValue)) {
    text2[TEXT_CACHE] = str;
    text2.nodeValue = `${str}`;
  }
}
function mount(component2, options) {
  return _mount(component2, options);
}
function hydrate(component2, options) {
  init_operations();
  options.intro = options.intro ?? false;
  const target = options.target;
  const was_hydrating = hydrating;
  const previous_hydrate_node = hydrate_node;
  try {
    var anchor = get_first_child(target);
    while (anchor && (anchor.nodeType !== COMMENT_NODE || /** @type {Comment} */
    anchor.data !== HYDRATION_START)) {
      anchor = get_next_sibling(anchor);
    }
    if (!anchor) {
      throw HYDRATION_ERROR;
    }
    set_hydrating(true);
    set_hydrate_node(
      /** @type {Comment} */
      anchor
    );
    const instance = _mount(component2, { ...options, anchor });
    set_hydrating(false);
    return (
      /**  @type {Exports} */
      instance
    );
  } catch (error) {
    if (error instanceof Error && error.message.split("\n").some((line) => line.startsWith("https://svelte.dev/e/"))) {
      throw error;
    }
    if (error !== HYDRATION_ERROR) {
      console.warn("Failed to hydrate: ", error);
    }
    if (options.recover === false) {
      hydration_failed();
    }
    init_operations();
    clear_text_content(target);
    set_hydrating(false);
    return mount(component2, options);
  } finally {
    set_hydrating(was_hydrating);
    set_hydrate_node(previous_hydrate_node);
  }
}
var listeners = /* @__PURE__ */ new Map();
function _mount(Component, { target, anchor, props = {}, events, context, intro = true, transformError }) {
  init_operations();
  var component2 = void 0;
  var unmount2 = component_root(() => {
    var anchor_node = anchor ?? target.appendChild(create_text());
    boundary(
      /** @type {TemplateNode} */
      anchor_node,
      {
        pending: () => {
        }
      },
      (anchor_node2) => {
        push({});
        var ctx = (
          /** @type {ComponentContext} */
          component_context
        );
        if (context) ctx.c = context;
        if (events) {
          props.$$events = events;
        }
        if (hydrating) {
          assign_nodes(
            /** @type {TemplateNode} */
            anchor_node2,
            null
          );
        }
        should_intro = intro;
        component2 = Component(anchor_node2, props) || mark_as_component();
        should_intro = true;
        if (hydrating) {
          active_effect.nodes.end = hydrate_node;
          if (hydrate_node === null || hydrate_node.nodeType !== COMMENT_NODE || /** @type {Comment} */
          hydrate_node.data !== HYDRATION_END) {
            hydration_mismatch();
            throw HYDRATION_ERROR;
          }
        }
        pop();
      },
      transformError
    );
    var registered_events = /* @__PURE__ */ new Set();
    var event_handle = (events2) => {
      for (var i = 0; i < events2.length; i++) {
        var event_name = events2[i];
        if (registered_events.has(event_name)) continue;
        registered_events.add(event_name);
        var passive2 = is_passive_event(event_name);
        for (const node of [target, document]) {
          var counts = listeners.get(node);
          if (counts === void 0) {
            counts = /* @__PURE__ */ new Map();
            listeners.set(node, counts);
          }
          var count = counts.get(event_name);
          if (count === void 0) {
            node.addEventListener(event_name, handle_event_propagation, { passive: passive2 });
            counts.set(event_name, 1);
          } else {
            counts.set(event_name, count + 1);
          }
        }
      }
    };
    event_handle(array_from(all_registered_events));
    root_event_handles.add(event_handle);
    return () => {
      for (var event_name of registered_events) {
        for (const node of [target, document]) {
          var counts = (
            /** @type {Map<string, number>} */
            listeners.get(node)
          );
          var count = (
            /** @type {number} */
            counts.get(event_name)
          );
          if (--count == 0) {
            node.removeEventListener(event_name, handle_event_propagation);
            counts.delete(event_name);
            if (counts.size === 0) {
              listeners.delete(node);
            }
          } else {
            counts.set(event_name, count);
          }
        }
      }
      root_event_handles.delete(event_handle);
      if (anchor_node !== anchor) {
        anchor_node.parentNode?.removeChild(anchor_node);
      }
    };
  });
  mounted_components.set(component2, unmount2);
  return component2;
}
var mounted_components = /* @__PURE__ */ new WeakMap();
function unmount(component2, options) {
  const fn = mounted_components.get(component2);
  if (fn) {
    mounted_components.delete(component2);
    return fn(options);
  }
  if (dev_fallback_default) {
    lifecycle_double_unmount();
  }
  return Promise.resolve();
}

// node_modules/svelte/src/internal/client/dom/blocks/branches.js
var BranchManager = class {
  /** @type {TemplateNode} */
  anchor;
  /** @type {Map<Batch, Key>} */
  #batches = /* @__PURE__ */ new Map();
  /**
   * Map of keys to effects that are currently rendered in the DOM.
   * These effects are visible and actively part of the document tree.
   * Example:
   * ```
   * {#if condition}
   * 	foo
   * {:else}
   * 	bar
   * {/if}
   * ```
   * Can result in the entries `true->Effect` and `false->Effect`
   * @type {Map<Key, Effect>}
   */
  #onscreen = /* @__PURE__ */ new Map();
  /**
   * Similar to #onscreen with respect to the keys, but contains branches that are not yet
   * in the DOM, because their insertion is deferred.
   * @type {Map<Key, Branch>}
   */
  #offscreen = /* @__PURE__ */ new Map();
  /**
   * Keys of effects that are currently outroing
   * @type {Set<Key>}
   */
  #outroing = /* @__PURE__ */ new Set();
  /**
   * Whether to pause (i.e. outro) on change, or destroy immediately.
   * This is necessary for `<svelte:element>`
   */
  #transition = true;
  /**
   * @param {TemplateNode} anchor
   * @param {boolean} transition
   */
  constructor(anchor, transition2 = true) {
    this.anchor = anchor;
    this.#transition = transition2;
  }
  /**
   * @param {Batch} batch
   */
  #commit = (batch) => {
    if (!this.#batches.has(batch)) return;
    var key2 = (
      /** @type {Key} */
      this.#batches.get(batch)
    );
    var onscreen = this.#onscreen.get(key2);
    if (onscreen) {
      resume_effect(onscreen);
      this.#outroing.delete(key2);
    } else {
      var offscreen = this.#offscreen.get(key2);
      if (offscreen) {
        resume_effect(offscreen.effect);
        this.#onscreen.set(key2, offscreen.effect);
        this.#offscreen.delete(key2);
        if (dev_fallback_default) {
          offscreen.fragment.lastChild[HMR_ANCHOR] = this.anchor;
        }
        offscreen.fragment.lastChild.remove();
        this.anchor.before(offscreen.fragment);
        onscreen = offscreen.effect;
      }
    }
    for (const [b, k] of this.#batches) {
      this.#batches.delete(b);
      if (b === batch) {
        break;
      }
      const offscreen2 = this.#offscreen.get(k);
      if (offscreen2) {
        destroy_effect(offscreen2.effect);
        this.#offscreen.delete(k);
      }
    }
    for (const [k, effect2] of this.#onscreen) {
      if (k === key2 || this.#outroing.has(k)) continue;
      const on_destroy = () => {
        const keys = Array.from(this.#batches.values());
        if (keys.includes(k)) {
          var fragment = document.createDocumentFragment();
          move_effect(effect2, fragment);
          fragment.append(create_text());
          this.#offscreen.set(k, { effect: effect2, fragment });
        } else {
          destroy_effect(effect2);
        }
        this.#outroing.delete(k);
        this.#onscreen.delete(k);
      };
      if (this.#transition || !onscreen) {
        this.#outroing.add(k);
        pause_effect(effect2, on_destroy, false);
      } else {
        on_destroy();
      }
    }
  };
  /**
   * @param {Batch} batch
   */
  #discard = (batch) => {
    this.#batches.delete(batch);
    const keys = Array.from(this.#batches.values());
    for (const [k, branch2] of this.#offscreen) {
      if (!keys.includes(k)) {
        destroy_effect(branch2.effect);
        this.#offscreen.delete(k);
      }
    }
  };
  /**
   *
   * @param {any} key
   * @param {null | ((target: TemplateNode) => void)} fn
   */
  ensure(key2, fn) {
    var batch = (
      /** @type {Batch} */
      current_batch
    );
    var defer = should_defer_append();
    if (fn && !this.#onscreen.has(key2) && !this.#offscreen.has(key2)) {
      if (defer) {
        var fragment = document.createDocumentFragment();
        var target = create_text();
        fragment.append(target);
        this.#offscreen.set(key2, {
          effect: branch(() => fn(target)),
          fragment
        });
      } else {
        this.#onscreen.set(
          key2,
          branch(() => fn(this.anchor))
        );
      }
    }
    this.#batches.set(batch, key2);
    if (defer) {
      for (const [k, effect2] of this.#onscreen) {
        if (k === key2) {
          batch.unskip_effect(effect2);
        } else {
          batch.skip_effect(effect2);
        }
      }
      for (const [k, branch2] of this.#offscreen) {
        if (k === key2) {
          batch.unskip_effect(branch2.effect);
        } else {
          batch.skip_effect(branch2.effect);
        }
      }
      batch.oncommit(this.#commit);
      batch.ondiscard(this.#discard);
    } else {
      if (hydrating) {
        this.anchor = hydrate_node;
      }
      this.#commit(batch);
    }
  }
};

// node_modules/svelte/src/internal/client/dom/blocks/if.js
function if_block(node, fn, elseif = false) {
  var marker;
  if (hydrating) {
    marker = hydrate_node;
    hydrate_next();
  }
  var branches = new BranchManager(node);
  var flags2 = elseif ? EFFECT_TRANSPARENT : 0;
  function update_branch(key2, fn2) {
    if (hydrating) {
      var data = read_hydration_instruction(
        /** @type {TemplateNode} */
        marker
      );
      if (key2 !== parseInt(data.substring(1))) {
        var anchor = skip_nodes();
        set_hydrate_node(anchor);
        branches.anchor = anchor;
        set_hydrating(false);
        branches.ensure(key2, fn2);
        set_hydrating(true);
        return;
      }
    }
    branches.ensure(key2, fn2);
  }
  block(() => {
    var has_branch = false;
    fn((fn2, key2 = 0) => {
      has_branch = true;
      update_branch(key2, fn2);
    });
    if (!has_branch) {
      update_branch(-1, null);
    }
  }, flags2);
}

// node_modules/svelte/src/internal/client/dom/blocks/key.js
var NAN = Symbol("NaN");

// node_modules/svelte/src/internal/client/dom/blocks/each.js
function index(_, i) {
  return i;
}
function pause_effects(state2, to_destroy, controlled_anchor) {
  var transitions = [];
  var length = to_destroy.length;
  var group;
  var remaining = to_destroy.length;
  for (var i = 0; i < length; i++) {
    let effect2 = to_destroy[i];
    pause_effect(
      effect2,
      () => {
        if (group) {
          group.pending.delete(effect2);
          group.done.add(effect2);
          if (group.pending.size === 0) {
            var groups = (
              /** @type {Set<EachOutroGroup>} */
              state2.outrogroups
            );
            destroy_effects(state2, array_from(group.done));
            groups.delete(group);
            if (groups.size === 0) {
              state2.outrogroups = null;
            }
          }
        } else {
          remaining -= 1;
        }
      },
      false
    );
  }
  if (remaining === 0) {
    var fast_path = transitions.length === 0 && controlled_anchor !== null && state2.pending.size === 0;
    if (fast_path) {
      var anchor = (
        /** @type {Element} */
        controlled_anchor
      );
      var parent_node = (
        /** @type {Element} */
        anchor.parentNode
      );
      clear_text_content(parent_node);
      parent_node.append(anchor);
      state2.items.clear();
    }
    destroy_effects(state2, to_destroy, !fast_path);
  } else {
    group = {
      pending: new Set(to_destroy),
      done: /* @__PURE__ */ new Set()
    };
    (state2.outrogroups ??= /* @__PURE__ */ new Set()).add(group);
  }
}
function destroy_effects(state2, to_destroy, remove_dom = true) {
  var preserved_effects;
  if (state2.pending.size > 0) {
    preserved_effects = /* @__PURE__ */ new Set();
    for (const keys of state2.pending.values()) {
      for (const key2 of keys) {
        preserved_effects.add(
          /** @type {EachItem} */
          state2.items.get(key2).e
        );
      }
    }
  }
  for (var i = 0; i < to_destroy.length; i++) {
    var e = to_destroy[i];
    if (preserved_effects?.has(e)) {
      e.f |= EFFECT_OFFSCREEN;
      const fragment = document.createDocumentFragment();
      move_effect(e, fragment);
    } else {
      destroy_effect(to_destroy[i], remove_dom);
    }
  }
}
var offscreen_anchor;
function each(node, flags2, get_collection, get_key, render_fn, fallback_fn = null) {
  var anchor = node;
  var items = /* @__PURE__ */ new Map();
  var is_controlled = (flags2 & EACH_IS_CONTROLLED) !== 0;
  if (is_controlled) {
    var parent_node = (
      /** @type {Element} */
      node
    );
    anchor = hydrating ? set_hydrate_node(get_first_child(parent_node)) : parent_node.appendChild(create_text());
  }
  if (hydrating) {
    hydrate_next();
  }
  var fallback2 = null;
  var each_array = derived_safe_equal(() => {
    var collection = get_collection();
    return (
      /** @type {V[]} */
      is_array(collection) ? collection : collection == null ? [] : array_from(collection)
    );
  });
  if (dev_fallback_default) {
    tag(each_array, "{#each ...}");
  }
  var array;
  var pending2 = /* @__PURE__ */ new Map();
  var first_run = true;
  function commit(batch) {
    if ((state2.effect.f & DESTROYED) !== 0) {
      return;
    }
    state2.pending.delete(batch);
    state2.fallback = fallback2;
    reconcile(state2, array, anchor, flags2, get_key);
    if (fallback2 !== null) {
      if (array.length === 0) {
        if ((fallback2.f & EFFECT_OFFSCREEN) === 0) {
          resume_effect(fallback2);
        } else {
          fallback2.f ^= EFFECT_OFFSCREEN;
          move(fallback2, null, anchor);
        }
      } else {
        pause_effect(fallback2, () => {
          fallback2 = null;
        });
      }
    }
  }
  function discard(batch) {
    state2.pending.delete(batch);
  }
  var effect2 = block(() => {
    array = /** @type {V[]} */
    get(each_array);
    var length = array.length;
    let mismatch = false;
    if (hydrating) {
      var is_else = read_hydration_instruction(anchor) === HYDRATION_START_ELSE;
      if (is_else !== (length === 0)) {
        anchor = skip_nodes();
        set_hydrate_node(anchor);
        set_hydrating(false);
        mismatch = true;
      }
    }
    var keys = /* @__PURE__ */ new Set();
    var batch = (
      /** @type {Batch} */
      current_batch
    );
    var defer = should_defer_append();
    for (var index2 = 0; index2 < length; index2 += 1) {
      if (hydrating && hydrate_node.nodeType === COMMENT_NODE && /** @type {Comment} */
      hydrate_node.data === HYDRATION_END) {
        anchor = /** @type {Comment} */
        hydrate_node;
        mismatch = true;
        set_hydrating(false);
      }
      var value = array[index2];
      var key2 = get_key(value, index2);
      if (dev_fallback_default) {
        var key_again = get_key(value, index2);
        if (key2 !== key_again) {
          each_key_volatile(String(index2), String(key2), String(key_again));
        }
      }
      var item = first_run ? null : items.get(key2);
      if (item) {
        if (item.v) internal_set(item.v, value);
        if (item.i) internal_set(item.i, index2);
        if (defer) {
          batch.unskip_effect(item.e);
        }
      } else {
        item = create_item(
          items,
          first_run ? anchor : offscreen_anchor ??= create_text(),
          value,
          key2,
          index2,
          render_fn,
          flags2,
          get_collection
        );
        if (!first_run) {
          item.e.f |= EFFECT_OFFSCREEN;
        }
        items.set(key2, item);
      }
      keys.add(key2);
    }
    if (length === 0 && fallback_fn && !fallback2) {
      if (first_run) {
        fallback2 = branch(() => fallback_fn(anchor));
      } else {
        fallback2 = branch(() => fallback_fn(offscreen_anchor ??= create_text()));
        fallback2.f |= EFFECT_OFFSCREEN;
      }
    }
    if (length > keys.size) {
      if (dev_fallback_default) {
        validate_each_keys(array, get_key);
      } else {
        each_key_duplicate("", "", "");
      }
    }
    if (hydrating && length > 0) {
      set_hydrate_node(skip_nodes());
    }
    if (!first_run) {
      pending2.set(batch, keys);
      if (defer) {
        for (const [key3, item2] of items) {
          if (!keys.has(key3)) {
            batch.skip_effect(item2.e);
          }
        }
        batch.oncommit(commit);
        batch.ondiscard(discard);
      } else {
        commit(batch);
      }
    }
    if (mismatch) {
      set_hydrating(true);
    }
    get(each_array);
  });
  var state2 = { effect: effect2, flags: flags2, items, pending: pending2, outrogroups: null, fallback: fallback2 };
  first_run = false;
  if (hydrating) {
    anchor = hydrate_node;
  }
}
function skip_to_branch(effect2) {
  while (effect2 !== null && (effect2.f & BRANCH_EFFECT) === 0) {
    effect2 = effect2.next;
  }
  return effect2;
}
function reconcile(state2, array, anchor, flags2, get_key) {
  var is_animated = (flags2 & EACH_IS_ANIMATED) !== 0;
  var length = array.length;
  var items = state2.items;
  var current = skip_to_branch(state2.effect.first);
  var seen2;
  var prev = null;
  var to_animate;
  var matched = [];
  var stashed = [];
  var value;
  var key2;
  var effect2;
  var i;
  if (is_animated) {
    for (i = 0; i < length; i += 1) {
      value = array[i];
      key2 = get_key(value, i);
      effect2 = /** @type {EachItem} */
      items.get(key2).e;
      if ((effect2.f & EFFECT_OFFSCREEN) === 0) {
        effect2.nodes?.a?.measure();
        (to_animate ??= /* @__PURE__ */ new Set()).add(effect2);
      }
    }
  }
  for (i = 0; i < length; i += 1) {
    value = array[i];
    key2 = get_key(value, i);
    effect2 = /** @type {EachItem} */
    items.get(key2).e;
    if (state2.outrogroups !== null) {
      for (const group of state2.outrogroups) {
        group.pending.delete(effect2);
        group.done.delete(effect2);
      }
    }
    if ((effect2.f & INERT) !== 0) {
      resume_effect(effect2);
      if (is_animated) {
        effect2.nodes?.a?.unfix();
        (to_animate ??= /* @__PURE__ */ new Set()).delete(effect2);
      }
    }
    if ((effect2.f & EFFECT_OFFSCREEN) !== 0) {
      effect2.f ^= EFFECT_OFFSCREEN;
      if (effect2 === current) {
        move(effect2, null, anchor);
      } else {
        var next2 = prev ? prev.next : current;
        if (effect2 === state2.effect.last) {
          state2.effect.last = effect2.prev;
        }
        if (effect2.prev) effect2.prev.next = effect2.next;
        if (effect2.next) effect2.next.prev = effect2.prev;
        link(state2, prev, effect2);
        link(state2, effect2, next2);
        move(effect2, next2, anchor);
        prev = effect2;
        matched = [];
        stashed = [];
        current = skip_to_branch(prev.next);
        continue;
      }
    }
    if (effect2 !== current) {
      if (seen2 !== void 0 && seen2.has(effect2)) {
        if (matched.length < stashed.length) {
          var start = stashed[0];
          var j;
          prev = start.prev;
          var a = matched[0];
          var b = matched[matched.length - 1];
          for (j = 0; j < matched.length; j += 1) {
            move(matched[j], start, anchor);
          }
          for (j = 0; j < stashed.length; j += 1) {
            seen2.delete(stashed[j]);
          }
          link(state2, a.prev, b.next);
          link(state2, prev, a);
          link(state2, b, start);
          current = start;
          prev = b;
          i -= 1;
          matched = [];
          stashed = [];
        } else {
          seen2.delete(effect2);
          move(effect2, current, anchor);
          link(state2, effect2.prev, effect2.next);
          link(state2, effect2, prev === null ? state2.effect.first : prev.next);
          link(state2, prev, effect2);
          prev = effect2;
        }
        continue;
      }
      matched = [];
      stashed = [];
      while (current !== null && current !== effect2) {
        (seen2 ??= /* @__PURE__ */ new Set()).add(current);
        stashed.push(current);
        current = skip_to_branch(current.next);
      }
      if (current === null) {
        continue;
      }
    }
    if ((effect2.f & EFFECT_OFFSCREEN) === 0) {
      matched.push(effect2);
    }
    prev = effect2;
    current = skip_to_branch(effect2.next);
  }
  if (state2.outrogroups !== null) {
    for (const group of state2.outrogroups) {
      if (group.pending.size === 0) {
        destroy_effects(state2, array_from(group.done));
        state2.outrogroups?.delete(group);
      }
    }
    if (state2.outrogroups.size === 0) {
      state2.outrogroups = null;
    }
  }
  if (current !== null || seen2 !== void 0) {
    var to_destroy = [];
    if (seen2 !== void 0) {
      for (effect2 of seen2) {
        if ((effect2.f & INERT) === 0) {
          to_destroy.push(effect2);
        }
      }
    }
    while (current !== null) {
      if ((current.f & INERT) === 0 && current !== state2.fallback) {
        to_destroy.push(current);
      }
      current = skip_to_branch(current.next);
    }
    var destroy_length = to_destroy.length;
    if (destroy_length > 0) {
      var controlled_anchor = (flags2 & EACH_IS_CONTROLLED) !== 0 && length === 0 ? anchor : null;
      if (is_animated) {
        for (i = 0; i < destroy_length; i += 1) {
          to_destroy[i].nodes?.a?.measure();
        }
        for (i = 0; i < destroy_length; i += 1) {
          to_destroy[i].nodes?.a?.fix();
        }
      }
      pause_effects(state2, to_destroy, controlled_anchor);
    }
  }
  if (is_animated) {
    queue_micro_task(() => {
      if (to_animate === void 0) return;
      for (effect2 of to_animate) {
        effect2.nodes?.a?.apply();
      }
    });
  }
}
function create_item(items, anchor, value, key2, index2, render_fn, flags2, get_collection) {
  var v = (flags2 & EACH_ITEM_REACTIVE) !== 0 ? (flags2 & EACH_ITEM_IMMUTABLE) === 0 ? mutable_source(value, false, false) : source(value) : null;
  var i = (flags2 & EACH_INDEX_REACTIVE) !== 0 ? source(index2) : null;
  if (dev_fallback_default && v) {
    v.trace = () => {
      get_collection()[i?.v ?? index2];
    };
  }
  return {
    v,
    i,
    e: branch(() => {
      render_fn(anchor, v ?? value, i ?? index2, get_collection);
      return () => {
        items.delete(key2);
      };
    })
  };
}
function move(effect2, next2, anchor) {
  if (!effect2.nodes) return;
  var node = effect2.nodes.start;
  var end = effect2.nodes.end;
  var dest = next2 && (next2.f & EFFECT_OFFSCREEN) === 0 ? (
    /** @type {EffectNodes} */
    next2.nodes.start
  ) : anchor;
  while (node !== null) {
    var next_node = (
      /** @type {TemplateNode} */
      get_next_sibling(node)
    );
    dest.before(node);
    if (node === end) {
      return;
    }
    node = next_node;
  }
}
function link(state2, prev, next2) {
  if (prev === null) {
    state2.effect.first = next2;
  } else {
    prev.next = next2;
  }
  if (next2 === null) {
    state2.effect.last = prev;
  } else {
    next2.prev = prev;
  }
}
function validate_each_keys(array, key_fn) {
  const keys = /* @__PURE__ */ new Map();
  const length = array.length;
  for (let i = 0; i < length; i++) {
    const key2 = key_fn(array[i], i);
    if (keys.has(key2)) {
      const a = String(keys.get(key2));
      const b = String(i);
      let k = String(key2);
      if (k.startsWith("[object ")) k = null;
      each_key_duplicate(a, b, k);
    }
    keys.set(key2, i);
  }
}

// node_modules/svelte/src/internal/client/dom/css.js
function append_styles(anchor, css) {
  effect(() => {
    anchor = active_effect?.parent?.nodes?.start ?? anchor;
    var root5 = anchor.getRootNode();
    var target = (
      /** @type {ShadowRoot} */
      root5.host ? (
        /** @type {ShadowRoot} */
        root5
      ) : (
        /** @type {Document} */
        root5.head ?? /** @type {Document} */
        root5.ownerDocument.head
      )
    );
    if (!target.querySelector("#" + css.hash)) {
      const style = create_element("style");
      style.id = css.hash;
      style.textContent = css.code;
      target.appendChild(style);
      if (dev_fallback_default) {
        register_style(css.hash, style);
      }
    }
  });
}

// node_modules/svelte/src/internal/shared/attributes.js
var whitespace = [..." 	\n\r\f\xA0\v\uFEFF"];
function to_class(value, hash2, directives) {
  var classname = value == null ? "" : "" + value;
  if (hash2) {
    classname = classname ? classname + " " + hash2 : hash2;
  }
  if (directives) {
    for (var key2 of Object.keys(directives)) {
      if (directives[key2]) {
        classname = classname ? classname + " " + key2 : key2;
      } else if (classname.length) {
        var len = key2.length;
        var a = 0;
        while ((a = classname.indexOf(key2, a)) >= 0) {
          var b = a + len;
          if ((a === 0 || whitespace.includes(classname[a - 1])) && (b === classname.length || whitespace.includes(classname[b]))) {
            classname = (a === 0 ? "" : classname.substring(0, a)) + classname.substring(b + 1);
          } else {
            a = b;
          }
        }
      }
    }
  }
  return classname === "" ? null : classname;
}

// node_modules/svelte/src/internal/client/dom/elements/class.js
function set_class(dom, is_html, value, hash2, prev_classes, next_classes) {
  var prev = (
    /** @type {any} */
    dom[CLASS_CACHE]
  );
  if (hydrating || prev !== value || prev === void 0) {
    var next_class_name = to_class(value, hash2, next_classes);
    if (!hydrating || next_class_name !== dom.getAttribute("class")) {
      if (next_class_name == null) {
        dom.removeAttribute("class");
      } else if (is_html) {
        dom.className = next_class_name;
      } else {
        dom.setAttribute("class", next_class_name);
      }
    }
    dom[CLASS_CACHE] = value;
  } else if (next_classes && prev_classes !== next_classes) {
    for (var key2 in next_classes) {
      var is_present = !!next_classes[key2];
      if (prev_classes == null || is_present !== !!prev_classes[key2]) {
        dom.classList.toggle(key2, is_present);
      }
    }
  }
  return next_classes;
}

// node_modules/svelte/src/internal/client/dom/elements/attributes.js
var CLASS = Symbol("class");
var STYLE = Symbol("style");
var IS_CUSTOM_ELEMENT = Symbol("is custom element");
var IS_HTML = Symbol("is html");
var LINK_TAG = IS_XHTML ? "link" : "LINK";
function remove_input_defaults(input) {
  if (!hydrating) return;
  var already_removed = false;
  var remove_defaults = () => {
    if (already_removed) return;
    already_removed = true;
    if (input.hasAttribute("value")) {
      var value = input.value;
      set_attribute2(input, "value", null);
      input.value = value;
    }
    if (input.hasAttribute("checked")) {
      var checked = input.checked;
      set_attribute2(input, "checked", null);
      input.checked = checked;
    }
  };
  input[FORM_RESET_HANDLER] = remove_defaults;
  queue_micro_task(remove_defaults);
  add_form_reset_listener();
}
function set_attribute2(element2, attribute, value, skip_warning) {
  var attributes = get_attributes(element2);
  if (hydrating) {
    attributes[attribute] = element2.getAttribute(attribute);
    if (attribute === "src" || attribute === "srcset" || attribute === "href" && element2.nodeName === LINK_TAG) {
      if (!skip_warning) {
        check_src_in_dev_hydration(element2, attribute, value ?? "");
      }
      return;
    }
  }
  if (attributes[attribute] === (attributes[attribute] = value)) return;
  if (attribute === "loading") {
    element2[LOADING_ATTR_SYMBOL] = value;
  }
  if (value == null) {
    element2.removeAttribute(attribute);
  } else if (typeof value !== "string" && get_setters(element2).has(attribute)) {
    element2[attribute] = value;
  } else {
    element2.setAttribute(attribute, value);
  }
}
function get_attributes(element2) {
  return (
    /** @type {Record<string | symbol, unknown>} **/
    /** @type {any} */
    element2[ATTRIBUTES_CACHE] ??= {
      [IS_CUSTOM_ELEMENT]: element2.nodeName.includes("-"),
      [IS_HTML]: element2.namespaceURI === NAMESPACE_HTML
    }
  );
}
var setters_cache = /* @__PURE__ */ new Map();
function get_setters(element2) {
  var cache_key = element2.getAttribute("is") || element2.nodeName;
  var setters = setters_cache.get(cache_key);
  if (setters) return setters;
  setters_cache.set(cache_key, setters = /* @__PURE__ */ new Set());
  var descriptors;
  var proto = element2;
  var element_proto = Element.prototype;
  while (element_proto !== proto) {
    descriptors = get_descriptors(proto);
    for (var key2 in descriptors) {
      if (descriptors[key2].set && // better safe than sorry, we don't want spread attributes to mess with HTML content
      key2 !== "innerHTML" && key2 !== "textContent" && key2 !== "innerText") {
        setters.add(key2);
      }
    }
    proto = get_prototype_of(proto);
  }
  return setters;
}
function check_src_in_dev_hydration(element2, attribute, value) {
  if (!dev_fallback_default) return;
  if (attribute === "srcset" && srcset_url_equal(element2, value)) return;
  if (src_url_equal(element2.getAttribute(attribute) ?? "", value)) return;
  hydration_attribute_changed(
    attribute,
    element2.outerHTML.replace(element2.innerHTML, element2.innerHTML && "..."),
    String(value)
  );
}
function src_url_equal(element_src, url) {
  if (element_src === url) return true;
  return new URL(element_src, document.baseURI).href === new URL(url, document.baseURI).href;
}
function split_srcset(srcset) {
  return srcset.split(",").map((src) => src.trim().split(" ").filter(Boolean));
}
function srcset_url_equal(element2, srcset) {
  var element_urls = split_srcset(element2.srcset);
  var urls = split_srcset(srcset);
  return urls.length === element_urls.length && urls.every(
    ([url, width], i) => width === element_urls[i][1] && // We need to test both ways because Vite will create an a full URL with
    // `new URL(asset, import.meta.url).href` for the client when `base: './'`, and the
    // relative URLs inside srcset are not automatically resolved to absolute URLs by
    // browsers (in contrast to img.src). This means both SSR and DOM code could
    // contain relative or absolute URLs.
    (src_url_equal(element_urls[i][0], url) || src_url_equal(url, element_urls[i][0]))
  );
}

// node_modules/svelte/src/internal/client/dom/elements/bindings/input.js
function bind_value(input, get3, set2 = get3) {
  var batches = /* @__PURE__ */ new WeakSet();
  listen_to_event_and_reset_event(input, "input", async (is_reset) => {
    if (dev_fallback_default && input.type === "checkbox") {
      bind_invalid_checkbox_value();
    }
    var value = is_reset ? input.defaultValue : input.value;
    value = is_numberlike_input(input) ? to_number(value) : value;
    set2(value);
    if (current_batch !== null) {
      batches.add(current_batch);
    }
    await tick();
    if (value !== (value = get3())) {
      var start = input.selectionStart;
      var end = input.selectionEnd;
      var length = input.value.length;
      input.value = value ?? "";
      if (end !== null) {
        var new_length = input.value.length;
        if (start === end && end === length && new_length > length) {
          input.selectionStart = new_length;
          input.selectionEnd = new_length;
        } else {
          input.selectionStart = start;
          input.selectionEnd = Math.min(end, new_length);
        }
      }
    }
  });
  if (
    // If we are hydrating and the value has since changed,
    // then use the updated value from the input instead.
    hydrating && input.defaultValue !== input.value || // If defaultValue is set, then value == defaultValue
    // TODO Svelte 6: remove input.value check and set to empty string?
    untrack(get3) == null && input.value
  ) {
    set2(is_numberlike_input(input) ? to_number(input.value) : input.value);
    if (current_batch !== null) {
      batches.add(current_batch);
    }
  }
  render_effect(() => {
    if (dev_fallback_default && input.type === "checkbox") {
      bind_invalid_checkbox_value();
    }
    var value = get3();
    if (input === document.activeElement) {
      var batch = (
        /** @type {Batch} */
        async_mode_flag ? previous_batch : current_batch
      );
      if (batches.has(batch)) {
        return;
      }
    }
    if (is_numberlike_input(input) && value === to_number(input.value)) {
      return;
    }
    if (input.type === "date" && !value && !input.value) {
      return;
    }
    if (value !== input.value) {
      input.value = value ?? "";
    }
  });
}
function is_numberlike_input(input) {
  var type = input.type;
  return type === "number" || type === "range";
}
function to_number(value) {
  return value === "" ? null : +value;
}

// node_modules/svelte/src/internal/client/dom/legacy/lifecycle.js
function init(immutable = false) {
  const context = (
    /** @type {ComponentContextLegacy} */
    component_context
  );
  const callbacks = context.l.u;
  if (!callbacks) return;
  let props = () => deep_read_state(context.s);
  if (immutable) {
    let version = 0;
    let prev = (
      /** @type {Record<string, any>} */
      {}
    );
    const d = derived(() => {
      let changed = false;
      const props2 = context.s;
      for (const key2 in props2) {
        if (props2[key2] !== prev[key2]) {
          prev[key2] = props2[key2];
          changed = true;
        }
      }
      if (changed) version++;
      return version;
    });
    props = () => get(d);
  }
  if (callbacks.b.length) {
    user_pre_effect(() => {
      observe_all(context, props);
      run_all(callbacks.b);
    });
  }
  user_effect(() => {
    const fns = untrack(() => callbacks.m.map(run));
    return () => {
      for (const fn of fns) {
        if (typeof fn === "function") {
          fn();
        }
      }
    };
  });
  if (callbacks.a.length) {
    user_effect(() => {
      observe_all(context, props);
      run_all(callbacks.a);
    });
  }
}
function observe_all(context, props) {
  if (context.l.s) {
    for (const signal of context.l.s) get(signal);
  }
  props();
}

// node_modules/svelte/src/internal/client/reactivity/store.js
var is_store_binding = false;
var IS_UNMOUNTED = Symbol("unmounted");
function capture_store_binding(fn) {
  var previous_is_store_binding = is_store_binding;
  try {
    is_store_binding = false;
    return [fn(), is_store_binding];
  } finally {
    is_store_binding = previous_is_store_binding;
  }
}

// node_modules/svelte/src/internal/client/reactivity/props.js
function prop(props, key2, flags2, fallback2) {
  var runes = !legacy_mode_flag || (flags2 & PROPS_IS_RUNES) !== 0;
  var bindable = (flags2 & PROPS_IS_BINDABLE) !== 0;
  var lazy = (flags2 & PROPS_IS_LAZY_INITIAL) !== 0;
  var fallback_value = (
    /** @type {V} */
    fallback2
  );
  var fallback_dirty = true;
  var fallback_signal = (
    /** @type {Derived<V> | undefined} */
    void 0
  );
  var get_fallback = () => {
    if (lazy && runes) {
      fallback_signal ??= derived(
        /** @type {() => V} */
        fallback2
      );
      return get(fallback_signal);
    }
    if (fallback_dirty) {
      fallback_dirty = false;
      fallback_value = lazy ? untrack(
        /** @type {() => V} */
        fallback2
      ) : (
        /** @type {V} */
        fallback2
      );
    }
    return fallback_value;
  };
  let setter;
  if (bindable) {
    var is_entry_props = STATE_SYMBOL in props || LEGACY_PROPS in props;
    setter = get_descriptor(props, key2)?.set ?? (is_entry_props && key2 in props ? (v) => props[key2] = v : void 0);
  }
  var initial_value;
  var is_store_sub = false;
  if (bindable) {
    [initial_value, is_store_sub] = capture_store_binding(() => (
      /** @type {V} */
      props[key2]
    ));
  } else {
    initial_value = /** @type {V} */
    props[key2];
  }
  if (initial_value === void 0 && fallback2 !== void 0) {
    initial_value = get_fallback();
    if (setter) {
      if (runes) props_invalid_value(key2);
      setter(initial_value);
    }
  }
  var getter;
  if (runes) {
    getter = () => {
      var value = (
        /** @type {V} */
        props[key2]
      );
      if (value === void 0) return get_fallback();
      fallback_dirty = true;
      return value;
    };
  } else {
    getter = () => {
      var value = (
        /** @type {V} */
        props[key2]
      );
      if (value !== void 0) {
        fallback_value = /** @type {V} */
        void 0;
      }
      return value === void 0 ? fallback_value : value;
    };
  }
  if (runes && (flags2 & PROPS_IS_UPDATED) === 0) {
    return getter;
  }
  if (setter) {
    var legacy_parent = props.$$legacy;
    return (
      /** @type {() => V} */
      function(value, mutation) {
        if (arguments.length > 0) {
          if (!runes || !mutation || legacy_parent || is_store_sub) {
            setter(mutation ? getter() : value);
          }
          return value;
        }
        return getter();
      }
    );
  }
  var overridden = false;
  var d = ((flags2 & PROPS_IS_IMMUTABLE) !== 0 ? derived : derived_safe_equal)(() => {
    overridden = false;
    return getter();
  });
  if (dev_fallback_default) {
    d.label = key2;
  }
  if (bindable) get(d);
  var parent_effect = (
    /** @type {Effect} */
    active_effect
  );
  return (
    /** @type {() => V} */
    function(value, mutation) {
      if (arguments.length > 0) {
        const new_value = mutation ? get(d) : runes && bindable ? proxy(value) : value;
        set(d, new_value);
        overridden = true;
        if (fallback_value !== void 0) {
          fallback_value = new_value;
        }
        return value;
      }
      if (is_destroying_effect && overridden || (parent_effect.f & DESTROYED) !== 0) {
        return d.v;
      }
      return get(d);
    }
  );
}

// node_modules/svelte/src/legacy/legacy-client.js
function createClassComponent(options) {
  return new Svelte4Component(options);
}
var Svelte4Component = class {
  /** @type {any} */
  #events;
  /** @type {Record<string, any>} */
  #instance;
  /**
   * @param {ComponentConstructorOptions & {
   *  component: any;
   * }} options
   */
  constructor(options) {
    var sources = /* @__PURE__ */ new Map();
    var add_source = (key2, value) => {
      var s = mutable_source(value, false, false);
      sources.set(key2, s);
      return s;
    };
    const props = new Proxy(
      { ...options.props || {}, $$events: {} },
      {
        get(target, prop2) {
          return get(sources.get(prop2) ?? add_source(prop2, Reflect.get(target, prop2)));
        },
        has(target, prop2) {
          if (prop2 === LEGACY_PROPS) return true;
          get(sources.get(prop2) ?? add_source(prop2, Reflect.get(target, prop2)));
          return Reflect.has(target, prop2);
        },
        set(target, prop2, value) {
          set(sources.get(prop2) ?? add_source(prop2, value), value);
          return Reflect.set(target, prop2, value);
        }
      }
    );
    this.#instance = (options.hydrate ? hydrate : mount)(options.component, {
      target: options.target,
      anchor: options.anchor,
      props,
      context: options.context,
      intro: options.intro ?? false,
      recover: options.recover,
      transformError: options.transformError
    });
    if (!async_mode_flag && (!options?.props?.$$host || options.sync === false)) {
      flushSync();
    }
    this.#events = props.$$events;
    for (const key2 of Object.keys(this.#instance)) {
      if (key2 === "$set" || key2 === "$destroy" || key2 === "$on") continue;
      define_property(this, key2, {
        get() {
          return this.#instance[key2];
        },
        /** @param {any} value */
        set(value) {
          this.#instance[key2] = value;
        },
        enumerable: true
      });
    }
    this.#instance.$set = /** @param {Record<string, any>} next */
    (next2) => {
      Object.assign(props, next2);
    };
    this.#instance.$destroy = () => {
      unmount(this.#instance);
    };
  }
  /** @param {Record<string, any>} props */
  $set(props) {
    this.#instance.$set(props);
  }
  /**
   * @param {string} event
   * @param {(...args: any[]) => any} callback
   * @returns {any}
   */
  $on(event2, callback) {
    this.#events[event2] = this.#events[event2] || [];
    const cb = (...args) => callback.call(this, ...args);
    this.#events[event2].push(cb);
    return () => {
      this.#events[event2] = this.#events[event2].filter(
        /** @param {any} fn */
        (fn) => fn !== cb
      );
    };
  }
  $destroy() {
    this.#instance.$destroy();
  }
};

// node_modules/svelte/src/internal/client/dom/elements/custom-element.js
var SvelteElement;
if (typeof HTMLElement === "function") {
  SvelteElement = class extends HTMLElement {
    /** The Svelte component constructor */
    $$ctor;
    /** Slots */
    $$s;
    /** @type {any} The Svelte component instance */
    $$c;
    /** Whether or not the custom element is connected */
    $$cn = false;
    /** @type {Record<string, any>} Component props data */
    $$d = {};
    /** `true` if currently in the process of reflecting component props back to attributes */
    $$r = false;
    /** @type {Record<string, CustomElementPropDefinition>} Props definition (name, reflected, type etc) */
    $$p_d = {};
    /** @type {Record<string, EventListenerOrEventListenerObject[]>} Event listeners */
    $$l = {};
    /** @type {Map<EventListenerOrEventListenerObject, Function>} Event listener unsubscribe functions */
    $$l_u = /* @__PURE__ */ new Map();
    /** @type {any} The managed render effect for reflecting attributes */
    $$me;
    /** @type {ShadowRoot | null} The ShadowRoot of the custom element */
    $$shadowRoot = null;
    /**
     * @param {*} $$componentCtor
     * @param {*} $$slots
     * @param {ShadowRootInit | undefined} shadow_root_init
     */
    constructor($$componentCtor, $$slots, shadow_root_init) {
      super();
      this.$$ctor = $$componentCtor;
      this.$$s = $$slots;
      if (shadow_root_init) {
        this.$$shadowRoot = this.attachShadow(shadow_root_init);
      }
    }
    /**
     * @param {string} type
     * @param {EventListenerOrEventListenerObject} listener
     * @param {boolean | AddEventListenerOptions} [options]
     */
    addEventListener(type, listener, options) {
      this.$$l[type] = this.$$l[type] || [];
      this.$$l[type].push(listener);
      if (this.$$c) {
        const unsub = this.$$c.$on(type, listener);
        this.$$l_u.set(listener, unsub);
      }
      super.addEventListener(type, listener, options);
    }
    /**
     * @param {string} type
     * @param {EventListenerOrEventListenerObject} listener
     * @param {boolean | AddEventListenerOptions} [options]
     */
    removeEventListener(type, listener, options) {
      super.removeEventListener(type, listener, options);
      if (this.$$c) {
        const unsub = this.$$l_u.get(listener);
        if (unsub) {
          unsub();
          this.$$l_u.delete(listener);
        }
      }
    }
    async connectedCallback() {
      this.$$cn = true;
      if (!this.$$c) {
        let create_slot = function(name) {
          return (anchor) => {
            const slot2 = create_element("slot");
            if (name !== "default") slot2.name = name;
            append(anchor, slot2);
          };
        };
        await Promise.resolve();
        if (!this.$$cn || this.$$c) {
          return;
        }
        const $$slots = {};
        const existing_slots = get_custom_elements_slots(this);
        for (const name of this.$$s) {
          if (name in existing_slots) {
            if (name === "default" && !this.$$d.children) {
              this.$$d.children = create_slot(name);
              $$slots.default = true;
            } else {
              $$slots[name] = create_slot(name);
            }
          }
        }
        for (const attribute of this.attributes) {
          const name = this.$$g_p(attribute.name);
          if (!(name in this.$$d)) {
            this.$$d[name] = get_custom_element_value(name, attribute.value, this.$$p_d, "toProp");
          }
        }
        for (const key2 in this.$$p_d) {
          if (!(key2 in this.$$d) && this[key2] !== void 0) {
            this.$$d[key2] = this[key2];
            delete this[key2];
          }
        }
        this.$$c = createClassComponent({
          component: this.$$ctor,
          target: this.$$shadowRoot || this,
          props: {
            ...this.$$d,
            $$slots,
            $$host: this
          }
        });
        this.$$me = effect_root(() => {
          render_effect(() => {
            this.$$r = true;
            for (const key2 of object_keys(this.$$c)) {
              if (!this.$$p_d[key2]?.reflect) continue;
              this.$$d[key2] = this.$$c[key2];
              const attribute_value = get_custom_element_value(
                key2,
                this.$$d[key2],
                this.$$p_d,
                "toAttribute"
              );
              if (attribute_value == null) {
                this.removeAttribute(this.$$p_d[key2].attribute || key2);
              } else {
                this.setAttribute(this.$$p_d[key2].attribute || key2, attribute_value);
              }
            }
            this.$$r = false;
          });
        });
        for (const type in this.$$l) {
          for (const listener of this.$$l[type]) {
            const unsub = this.$$c.$on(type, listener);
            this.$$l_u.set(listener, unsub);
          }
        }
        this.$$l = {};
      }
    }
    // We don't need this when working within Svelte code, but for compatibility of people using this outside of Svelte
    // and setting attributes through setAttribute etc, this is helpful
    /**
     * @param {string} attr
     * @param {string} _oldValue
     * @param {string} newValue
     */
    attributeChangedCallback(attr2, _oldValue, newValue) {
      if (this.$$r) return;
      attr2 = this.$$g_p(attr2);
      this.$$d[attr2] = get_custom_element_value(attr2, newValue, this.$$p_d, "toProp");
      this.$$c?.$set({ [attr2]: this.$$d[attr2] });
    }
    disconnectedCallback() {
      this.$$cn = false;
      Promise.resolve().then(() => {
        if (!this.$$cn && this.$$c) {
          this.$$c.$destroy();
          this.$$me();
          this.$$c = void 0;
        }
      });
    }
    /**
     * @param {string} attribute_name
     */
    $$g_p(attribute_name) {
      return object_keys(this.$$p_d).find(
        (key2) => this.$$p_d[key2].attribute === attribute_name || !this.$$p_d[key2].attribute && key2.toLowerCase() === attribute_name
      ) || attribute_name;
    }
  };
}
function get_custom_element_value(prop2, value, props_definition, transform) {
  const type = props_definition[prop2]?.type;
  value = type === "Boolean" && typeof value !== "boolean" ? value != null : value;
  if (!transform || !props_definition[prop2]) {
    return value;
  } else if (transform === "toAttribute") {
    switch (type) {
      case "Object":
      case "Array":
        return value == null ? null : JSON.stringify(value);
      case "Boolean":
        return value ? "" : null;
      case "Number":
        return value == null ? null : value;
      default:
        return value;
    }
  } else {
    switch (type) {
      case "Object":
      case "Array":
        return value && JSON.parse(value);
      case "Boolean":
        return value;
      // conversion already handled above
      case "Number":
        return value != null ? +value : value;
      default:
        return value;
    }
  }
}
function get_custom_elements_slots(element2) {
  const result = {};
  element2.childNodes.forEach((node) => {
    result[
      /** @type {Element} node */
      node.slot || "default"
    ] = true;
  });
  return result;
}

// node_modules/svelte/src/index-client.js
if (dev_fallback_default) {
  let throw_rune_error = function(rune) {
    if (!(rune in globalThis)) {
      let value;
      Object.defineProperty(globalThis, rune, {
        configurable: true,
        // eslint-disable-next-line getter-return
        get: () => {
          if (value !== void 0) {
            return value;
          }
          rune_outside_svelte(rune);
        },
        set: (v) => {
          value = v;
        }
      });
    }
  };
  throw_rune_error("$state");
  throw_rune_error("$effect");
  throw_rune_error("$derived");
  throw_rune_error("$inspect");
  throw_rune_error("$props");
  throw_rune_error("$bindable");
}
function onMount(fn) {
  if (component_context === null) {
    lifecycle_outside_component("onMount");
  }
  if (legacy_mode_flag && component_context.l !== null) {
    init_update_callbacks(component_context).m.push(fn);
  } else {
    user_effect(() => {
      const cleanup = untrack(fn);
      if (typeof cleanup === "function") return (
        /** @type {() => void} */
        cleanup
      );
    });
  }
}
function init_update_callbacks(context) {
  var l = (
    /** @type {ComponentContextLegacy} */
    context.l
  );
  return l.u ??= { a: [], b: [], m: [] };
}

// node_modules/svelte/src/version.js
var PUBLIC_VERSION = "5";

// node_modules/svelte/src/internal/disclose-version.js
if (typeof window !== "undefined") {
  ((window.__svelte ??= {}).v ??= /* @__PURE__ */ new Set()).add(PUBLIC_VERSION);
}

// node_modules/svelte/src/internal/flags/legacy.js
enable_legacy_mode_flag();

// src/ui/components/ClusterCard.svelte
var root = from_html(`<span class="status-badge approved svelte-78rmdr" title="Gatekeeper \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u043B \u0441\u043C\u044B\u0441\u043B\u043E\u0432\u043E\u0435 \u0434\u0443\u0431\u043B\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435">\u2713 AI \u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u043E</span>`);
var root_1 = from_html(`<span class="status-badge rejected svelte-78rmdr">\u2715 \u041E\u0442\u043A\u043B\u043E\u043D\u0435\u043D\u043E AI</span>`);
var root_2 = from_html(`<span class="status-badge pending svelte-78rmdr">\u23F3 \u041D\u0435 \u043F\u0440\u043E\u0432\u0435\u0440\u0435\u043D</span>`);
var root_3 = from_html(`<span class="file-tag svelte-78rmdr"> </span>`);
var root_4 = from_html(`<span class="file-tag more svelte-78rmdr"> </span>`);
var root_5 = from_html(`<div><div class="cluster-card-top svelte-78rmdr"><div class="title-container"><span class="cluster-title svelte-78rmdr"> </span></div> <span class="similarity-badge svelte-78rmdr" title="\u041A\u043E\u0441\u0438\u043D\u0443\u0441\u043D\u043E\u0435 \u0441\u0445\u043E\u0434\u0441\u0442\u0432\u043E \u0432\u0435\u043A\u0442\u043E\u0440\u043E\u0432"> </span></div> <div class="cluster-meta svelte-78rmdr"><span class="files-badge svelte-78rmdr"> </span> <!></div> <div class="cluster-files-list svelte-78rmdr"><!> <!></div></div>`);
var $$css = {
  hash: "svelte-78rmdr",
  code: ".cluster-card.svelte-78rmdr {padding:12px;border-radius:6px;background-color:var(--background-secondary);border:1px solid var(--background-modifier-border);margin-bottom:8px;cursor:pointer;transition:all 0.15s ease;}.cluster-card.svelte-78rmdr:hover {background-color:var(--background-modifier-hover);border-color:var(--interactive-accent);}.cluster-card.selected.svelte-78rmdr {background-color:var(--background-primary-alt);border-color:var(--interactive-accent);box-shadow:0 0 0 1px var(--interactive-accent);}.cluster-card.is-rejected.svelte-78rmdr {opacity:0.6;border-left:3px solid var(--text-error, #f85149);}.cluster-card-top.svelte-78rmdr {display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:6px;}.cluster-title.svelte-78rmdr {font-weight:600;font-size:0.95em;color:var(--text-normal);line-height:1.3;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}.similarity-badge.svelte-78rmdr {font-size:0.78em;font-weight:700;padding:2px 6px;border-radius:12px;background-color:rgba(46, 160, 67, 0.15);color:var(--text-success, #3fb950);white-space:nowrap;}.cluster-meta.svelte-78rmdr {display:flex;align-items:center;gap:6px;font-size:0.75em;margin-bottom:8px;flex-wrap:wrap;}.files-badge.svelte-78rmdr {color:var(--text-muted);}.status-badge.svelte-78rmdr {padding:1px 6px;border-radius:4px;font-weight:500;}.status-badge.approved.svelte-78rmdr {background-color:rgba(46, 160, 67, 0.18);color:var(--text-success, #3fb950);}.status-badge.rejected.svelte-78rmdr {background-color:rgba(248, 81, 73, 0.18);color:var(--text-error, #f85149);}.status-badge.pending.svelte-78rmdr {background-color:var(--background-modifier-border);color:var(--text-muted);}.cluster-files-list.svelte-78rmdr {display:flex;flex-wrap:wrap;gap:4px;}.file-tag.svelte-78rmdr {font-size:0.72em;color:var(--text-muted);background-color:var(--background-primary);padding:1px 6px;border-radius:3px;border:1px solid var(--background-modifier-border);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}.file-tag.more.svelte-78rmdr {color:var(--text-faint);}"
};
function ClusterCard($$anchor, $$props) {
  push($$props, false);
  append_styles($$anchor, $$css);
  const similarityPercent = mutable_source();
  const fileNames = mutable_source();
  const displayTitle = mutable_source();
  let cluster = prop($$props, "cluster", 8);
  let plan = prop($$props, "plan", 8, void 0);
  let isSelected = prop($$props, "isSelected", 8, false);
  let onSelect = prop($$props, "onSelect", 8);
  legacy_pre_effect(() => deep_read_state(cluster()), () => {
    set(similarityPercent, Math.round(cluster().similarity * 100));
  });
  legacy_pre_effect(() => deep_read_state(cluster()), () => {
    set(fileNames, Array.from(new Set(cluster().chunks.map((c) => c.filePath.split("/").pop() || c.filePath))));
  });
  legacy_pre_effect(() => (deep_read_state(plan()), deep_read_state(cluster())), () => {
    set(displayTitle, plan()?.conceptTitle || (cluster().chunks[0]?.breadcrumbs ? cluster().chunks[0].breadcrumbs.replace(/[[\]]/g, "") : `\u041A\u043B\u0430\u0441\u0442\u0435\u0440 #${cluster().id.slice(0, 8)}`));
  });
  legacy_pre_effect_reset();
  init();
  var div = root_5();
  var div_1 = child(div);
  var div_2 = child(div_1);
  var span = child(div_2);
  var text2 = only_child(span, true);
  reset(div_2);
  var span_1 = sibling(div_2, 2);
  var text_1 = only_child(span_1);
  reset(div_1);
  var div_3 = sibling(div_1, 2);
  var span_2 = child(div_3);
  var text_2 = only_child(span_2);
  var node = sibling(span_2, 2);
  {
    var consequent_1 = ($$anchor2) => {
      var fragment = comment();
      var node_1 = first_child(fragment);
      {
        var consequent = ($$anchor3) => {
          var span_3 = root();
          append($$anchor3, span_3);
        };
        var alternate = ($$anchor3) => {
          var span_4 = root_1();
          template_effect(() => set_attribute2(span_4, "title", (deep_read_state(plan()), untrack(() => plan().rejectionReason || "\u041D\u0435 \u0434\u0443\u0431\u043B\u0438\u043A\u0430\u0442"))));
          append($$anchor3, span_4);
        };
        if_block(node_1, ($$render) => {
          if (deep_read_state(plan()), untrack(() => plan().isDuplicate)) $$render(consequent);
          else $$render(alternate, -1);
        });
      }
      append($$anchor2, fragment);
    };
    var alternate_1 = ($$anchor2) => {
      var span_5 = root_2();
      append($$anchor2, span_5);
    };
    if_block(node, ($$render) => {
      if (plan()) $$render(consequent_1);
      else $$render(alternate_1, -1);
    });
  }
  reset(div_3);
  var div_4 = sibling(div_3, 2);
  var node_2 = child(div_4);
  each(
    node_2,
    1,
    () => (get(fileNames), untrack(() => get(fileNames).slice(0, 3))),
    index,
    ($$anchor2, fn) => {
      var span_6 = root_3();
      var text_3 = only_child(span_6, true);
      template_effect(() => set_text(text_3, get(fn)));
      append($$anchor2, span_6);
    }
  );
  var node_3 = sibling(node_2, 2);
  {
    var consequent_2 = ($$anchor2) => {
      var span_7 = root_4();
      var text_4 = only_child(span_7);
      template_effect(() => set_text(text_4, `+${(get(fileNames), untrack(() => get(fileNames).length - 3)) ?? ""}`));
      append($$anchor2, span_7);
    };
    if_block(node_3, ($$render) => {
      if (get(fileNames), untrack(() => get(fileNames).length > 3)) $$render(consequent_2);
    });
  }
  reset(div_4);
  reset(div);
  template_effect(() => {
    set_class(
      div,
      1,
      `cluster-card ${isSelected() ? "selected" : ""} ${(deep_read_state(plan()), untrack(() => plan() && !plan().isDuplicate ? "is-rejected" : "")) ?? ""}`,
      "svelte-78rmdr"
    );
    set_text(text2, get(displayTitle));
    set_text(text_1, `${get(similarityPercent) ?? ""}%`);
    set_text(text_2, `\u{1F4C1} ${(get(fileNames), untrack(() => get(fileNames).length)) ?? ""} ${(get(fileNames), untrack(() => get(fileNames).length === 1 ? "\u0444\u0430\u0439\u043B" : get(fileNames).length < 5 ? "\u0444\u0430\u0439\u043B\u0430" : "\u0444\u0430\u0439\u043B\u043E\u0432")) ?? ""}`);
  });
  event("click", div, function(...$$args) {
    onSelect()?.apply(this, $$args);
  });
  append($$anchor, div);
  pop();
}

// node_modules/diff/lib/index.mjs
function Diff() {
}
Diff.prototype = {
  diff: function diff(oldString, newString) {
    var _options$timeout;
    var options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    var callback = options.callback;
    if (typeof options === "function") {
      callback = options;
      options = {};
    }
    var self2 = this;
    function done(value) {
      value = self2.postProcess(value, options);
      if (callback) {
        setTimeout(function() {
          callback(value);
        }, 0);
        return true;
      } else {
        return value;
      }
    }
    oldString = this.castInput(oldString, options);
    newString = this.castInput(newString, options);
    oldString = this.removeEmpty(this.tokenize(oldString, options));
    newString = this.removeEmpty(this.tokenize(newString, options));
    var newLen = newString.length, oldLen = oldString.length;
    var editLength = 1;
    var maxEditLength = newLen + oldLen;
    if (options.maxEditLength != null) {
      maxEditLength = Math.min(maxEditLength, options.maxEditLength);
    }
    var maxExecutionTime = (_options$timeout = options.timeout) !== null && _options$timeout !== void 0 ? _options$timeout : Infinity;
    var abortAfterTimestamp = Date.now() + maxExecutionTime;
    var bestPath = [{
      oldPos: -1,
      lastComponent: void 0
    }];
    var newPos = this.extractCommon(bestPath[0], newString, oldString, 0, options);
    if (bestPath[0].oldPos + 1 >= oldLen && newPos + 1 >= newLen) {
      return done(buildValues(self2, bestPath[0].lastComponent, newString, oldString, self2.useLongestToken));
    }
    var minDiagonalToConsider = -Infinity, maxDiagonalToConsider = Infinity;
    function execEditLength() {
      for (var diagonalPath = Math.max(minDiagonalToConsider, -editLength); diagonalPath <= Math.min(maxDiagonalToConsider, editLength); diagonalPath += 2) {
        var basePath = void 0;
        var removePath = bestPath[diagonalPath - 1], addPath = bestPath[diagonalPath + 1];
        if (removePath) {
          bestPath[diagonalPath - 1] = void 0;
        }
        var canAdd = false;
        if (addPath) {
          var addPathNewPos = addPath.oldPos - diagonalPath;
          canAdd = addPath && 0 <= addPathNewPos && addPathNewPos < newLen;
        }
        var canRemove = removePath && removePath.oldPos + 1 < oldLen;
        if (!canAdd && !canRemove) {
          bestPath[diagonalPath] = void 0;
          continue;
        }
        if (!canRemove || canAdd && removePath.oldPos < addPath.oldPos) {
          basePath = self2.addToPath(addPath, true, false, 0, options);
        } else {
          basePath = self2.addToPath(removePath, false, true, 1, options);
        }
        newPos = self2.extractCommon(basePath, newString, oldString, diagonalPath, options);
        if (basePath.oldPos + 1 >= oldLen && newPos + 1 >= newLen) {
          return done(buildValues(self2, basePath.lastComponent, newString, oldString, self2.useLongestToken));
        } else {
          bestPath[diagonalPath] = basePath;
          if (basePath.oldPos + 1 >= oldLen) {
            maxDiagonalToConsider = Math.min(maxDiagonalToConsider, diagonalPath - 1);
          }
          if (newPos + 1 >= newLen) {
            minDiagonalToConsider = Math.max(minDiagonalToConsider, diagonalPath + 1);
          }
        }
      }
      editLength++;
    }
    if (callback) {
      (function exec() {
        setTimeout(function() {
          if (editLength > maxEditLength || Date.now() > abortAfterTimestamp) {
            return callback();
          }
          if (!execEditLength()) {
            exec();
          }
        }, 0);
      })();
    } else {
      while (editLength <= maxEditLength && Date.now() <= abortAfterTimestamp) {
        var ret = execEditLength();
        if (ret) {
          return ret;
        }
      }
    }
  },
  addToPath: function addToPath(path, added, removed, oldPosInc, options) {
    var last = path.lastComponent;
    if (last && !options.oneChangePerToken && last.added === added && last.removed === removed) {
      return {
        oldPos: path.oldPos + oldPosInc,
        lastComponent: {
          count: last.count + 1,
          added,
          removed,
          previousComponent: last.previousComponent
        }
      };
    } else {
      return {
        oldPos: path.oldPos + oldPosInc,
        lastComponent: {
          count: 1,
          added,
          removed,
          previousComponent: last
        }
      };
    }
  },
  extractCommon: function extractCommon(basePath, newString, oldString, diagonalPath, options) {
    var newLen = newString.length, oldLen = oldString.length, oldPos = basePath.oldPos, newPos = oldPos - diagonalPath, commonCount = 0;
    while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(oldString[oldPos + 1], newString[newPos + 1], options)) {
      newPos++;
      oldPos++;
      commonCount++;
      if (options.oneChangePerToken) {
        basePath.lastComponent = {
          count: 1,
          previousComponent: basePath.lastComponent,
          added: false,
          removed: false
        };
      }
    }
    if (commonCount && !options.oneChangePerToken) {
      basePath.lastComponent = {
        count: commonCount,
        previousComponent: basePath.lastComponent,
        added: false,
        removed: false
      };
    }
    basePath.oldPos = oldPos;
    return newPos;
  },
  equals: function equals3(left, right, options) {
    if (options.comparator) {
      return options.comparator(left, right);
    } else {
      return left === right || options.ignoreCase && left.toLowerCase() === right.toLowerCase();
    }
  },
  removeEmpty: function removeEmpty(array) {
    var ret = [];
    for (var i = 0; i < array.length; i++) {
      if (array[i]) {
        ret.push(array[i]);
      }
    }
    return ret;
  },
  castInput: function castInput(value) {
    return value;
  },
  tokenize: function tokenize(value) {
    return Array.from(value);
  },
  join: function join(chars) {
    return chars.join("");
  },
  postProcess: function postProcess(changeObjects) {
    return changeObjects;
  }
};
function buildValues(diff2, lastComponent, newString, oldString, useLongestToken) {
  var components = [];
  var nextComponent;
  while (lastComponent) {
    components.push(lastComponent);
    nextComponent = lastComponent.previousComponent;
    delete lastComponent.previousComponent;
    lastComponent = nextComponent;
  }
  components.reverse();
  var componentPos = 0, componentLen = components.length, newPos = 0, oldPos = 0;
  for (; componentPos < componentLen; componentPos++) {
    var component2 = components[componentPos];
    if (!component2.removed) {
      if (!component2.added && useLongestToken) {
        var value = newString.slice(newPos, newPos + component2.count);
        value = value.map(function(value2, i) {
          var oldValue = oldString[oldPos + i];
          return oldValue.length > value2.length ? oldValue : value2;
        });
        component2.value = diff2.join(value);
      } else {
        component2.value = diff2.join(newString.slice(newPos, newPos + component2.count));
      }
      newPos += component2.count;
      if (!component2.added) {
        oldPos += component2.count;
      }
    } else {
      component2.value = diff2.join(oldString.slice(oldPos, oldPos + component2.count));
      oldPos += component2.count;
    }
  }
  return components;
}
var characterDiff = new Diff();
function longestCommonPrefix(str1, str2) {
  var i;
  for (i = 0; i < str1.length && i < str2.length; i++) {
    if (str1[i] != str2[i]) {
      return str1.slice(0, i);
    }
  }
  return str1.slice(0, i);
}
function longestCommonSuffix(str1, str2) {
  var i;
  if (!str1 || !str2 || str1[str1.length - 1] != str2[str2.length - 1]) {
    return "";
  }
  for (i = 0; i < str1.length && i < str2.length; i++) {
    if (str1[str1.length - (i + 1)] != str2[str2.length - (i + 1)]) {
      return str1.slice(-i);
    }
  }
  return str1.slice(-i);
}
function replacePrefix(string, oldPrefix, newPrefix) {
  if (string.slice(0, oldPrefix.length) != oldPrefix) {
    throw Error("string ".concat(JSON.stringify(string), " doesn't start with prefix ").concat(JSON.stringify(oldPrefix), "; this is a bug"));
  }
  return newPrefix + string.slice(oldPrefix.length);
}
function replaceSuffix(string, oldSuffix, newSuffix) {
  if (!oldSuffix) {
    return string + newSuffix;
  }
  if (string.slice(-oldSuffix.length) != oldSuffix) {
    throw Error("string ".concat(JSON.stringify(string), " doesn't end with suffix ").concat(JSON.stringify(oldSuffix), "; this is a bug"));
  }
  return string.slice(0, -oldSuffix.length) + newSuffix;
}
function removePrefix(string, oldPrefix) {
  return replacePrefix(string, oldPrefix, "");
}
function removeSuffix(string, oldSuffix) {
  return replaceSuffix(string, oldSuffix, "");
}
function maximumOverlap(string1, string2) {
  return string2.slice(0, overlapCount(string1, string2));
}
function overlapCount(a, b) {
  var startA = 0;
  if (a.length > b.length) {
    startA = a.length - b.length;
  }
  var endB = b.length;
  if (a.length < b.length) {
    endB = a.length;
  }
  var map = Array(endB);
  var k = 0;
  map[0] = 0;
  for (var j = 1; j < endB; j++) {
    if (b[j] == b[k]) {
      map[j] = map[k];
    } else {
      map[j] = k;
    }
    while (k > 0 && b[j] != b[k]) {
      k = map[k];
    }
    if (b[j] == b[k]) {
      k++;
    }
  }
  k = 0;
  for (var i = startA; i < a.length; i++) {
    while (k > 0 && a[i] != b[k]) {
      k = map[k];
    }
    if (a[i] == b[k]) {
      k++;
    }
  }
  return k;
}
var extendedWordChars = "a-zA-Z0-9_\\u{C0}-\\u{FF}\\u{D8}-\\u{F6}\\u{F8}-\\u{2C6}\\u{2C8}-\\u{2D7}\\u{2DE}-\\u{2FF}\\u{1E00}-\\u{1EFF}";
var tokenizeIncludingWhitespace = new RegExp("[".concat(extendedWordChars, "]+|\\s+|[^").concat(extendedWordChars, "]"), "ug");
var wordDiff = new Diff();
wordDiff.equals = function(left, right, options) {
  if (options.ignoreCase) {
    left = left.toLowerCase();
    right = right.toLowerCase();
  }
  return left.trim() === right.trim();
};
wordDiff.tokenize = function(value) {
  var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  var parts;
  if (options.intlSegmenter) {
    if (options.intlSegmenter.resolvedOptions().granularity != "word") {
      throw new Error('The segmenter passed must have a granularity of "word"');
    }
    parts = Array.from(options.intlSegmenter.segment(value), function(segment) {
      return segment.segment;
    });
  } else {
    parts = value.match(tokenizeIncludingWhitespace) || [];
  }
  var tokens = [];
  var prevPart = null;
  parts.forEach(function(part) {
    if (/\s/.test(part)) {
      if (prevPart == null) {
        tokens.push(part);
      } else {
        tokens.push(tokens.pop() + part);
      }
    } else if (/\s/.test(prevPart)) {
      if (tokens[tokens.length - 1] == prevPart) {
        tokens.push(tokens.pop() + part);
      } else {
        tokens.push(prevPart + part);
      }
    } else {
      tokens.push(part);
    }
    prevPart = part;
  });
  return tokens;
};
wordDiff.join = function(tokens) {
  return tokens.map(function(token, i) {
    if (i == 0) {
      return token;
    } else {
      return token.replace(/^\s+/, "");
    }
  }).join("");
};
wordDiff.postProcess = function(changes, options) {
  if (!changes || options.oneChangePerToken) {
    return changes;
  }
  var lastKeep = null;
  var insertion = null;
  var deletion = null;
  changes.forEach(function(change) {
    if (change.added) {
      insertion = change;
    } else if (change.removed) {
      deletion = change;
    } else {
      if (insertion || deletion) {
        dedupeWhitespaceInChangeObjects(lastKeep, deletion, insertion, change);
      }
      lastKeep = change;
      insertion = null;
      deletion = null;
    }
  });
  if (insertion || deletion) {
    dedupeWhitespaceInChangeObjects(lastKeep, deletion, insertion, null);
  }
  return changes;
};
function dedupeWhitespaceInChangeObjects(startKeep, deletion, insertion, endKeep) {
  if (deletion && insertion) {
    var oldWsPrefix = deletion.value.match(/^\s*/)[0];
    var oldWsSuffix = deletion.value.match(/\s*$/)[0];
    var newWsPrefix = insertion.value.match(/^\s*/)[0];
    var newWsSuffix = insertion.value.match(/\s*$/)[0];
    if (startKeep) {
      var commonWsPrefix = longestCommonPrefix(oldWsPrefix, newWsPrefix);
      startKeep.value = replaceSuffix(startKeep.value, newWsPrefix, commonWsPrefix);
      deletion.value = removePrefix(deletion.value, commonWsPrefix);
      insertion.value = removePrefix(insertion.value, commonWsPrefix);
    }
    if (endKeep) {
      var commonWsSuffix = longestCommonSuffix(oldWsSuffix, newWsSuffix);
      endKeep.value = replacePrefix(endKeep.value, newWsSuffix, commonWsSuffix);
      deletion.value = removeSuffix(deletion.value, commonWsSuffix);
      insertion.value = removeSuffix(insertion.value, commonWsSuffix);
    }
  } else if (insertion) {
    if (startKeep) {
      insertion.value = insertion.value.replace(/^\s*/, "");
    }
    if (endKeep) {
      endKeep.value = endKeep.value.replace(/^\s*/, "");
    }
  } else if (startKeep && endKeep) {
    var newWsFull = endKeep.value.match(/^\s*/)[0], delWsStart = deletion.value.match(/^\s*/)[0], delWsEnd = deletion.value.match(/\s*$/)[0];
    var newWsStart = longestCommonPrefix(newWsFull, delWsStart);
    deletion.value = removePrefix(deletion.value, newWsStart);
    var newWsEnd = longestCommonSuffix(removePrefix(newWsFull, newWsStart), delWsEnd);
    deletion.value = removeSuffix(deletion.value, newWsEnd);
    endKeep.value = replacePrefix(endKeep.value, newWsFull, newWsEnd);
    startKeep.value = replaceSuffix(startKeep.value, newWsFull, newWsFull.slice(0, newWsFull.length - newWsEnd.length));
  } else if (endKeep) {
    var endKeepWsPrefix = endKeep.value.match(/^\s*/)[0];
    var deletionWsSuffix = deletion.value.match(/\s*$/)[0];
    var overlap = maximumOverlap(deletionWsSuffix, endKeepWsPrefix);
    deletion.value = removeSuffix(deletion.value, overlap);
  } else if (startKeep) {
    var startKeepWsSuffix = startKeep.value.match(/\s*$/)[0];
    var deletionWsPrefix = deletion.value.match(/^\s*/)[0];
    var _overlap = maximumOverlap(startKeepWsSuffix, deletionWsPrefix);
    deletion.value = removePrefix(deletion.value, _overlap);
  }
}
var wordWithSpaceDiff = new Diff();
wordWithSpaceDiff.tokenize = function(value) {
  var regex = new RegExp("(\\r?\\n)|[".concat(extendedWordChars, "]+|[^\\S\\n\\r]+|[^").concat(extendedWordChars, "]"), "ug");
  return value.match(regex) || [];
};
var lineDiff = new Diff();
lineDiff.tokenize = function(value, options) {
  if (options.stripTrailingCr) {
    value = value.replace(/\r\n/g, "\n");
  }
  var retLines = [], linesAndNewlines = value.split(/(\n|\r\n)/);
  if (!linesAndNewlines[linesAndNewlines.length - 1]) {
    linesAndNewlines.pop();
  }
  for (var i = 0; i < linesAndNewlines.length; i++) {
    var line = linesAndNewlines[i];
    if (i % 2 && !options.newlineIsToken) {
      retLines[retLines.length - 1] += line;
    } else {
      retLines.push(line);
    }
  }
  return retLines;
};
lineDiff.equals = function(left, right, options) {
  if (options.ignoreWhitespace) {
    if (!options.newlineIsToken || !left.includes("\n")) {
      left = left.trim();
    }
    if (!options.newlineIsToken || !right.includes("\n")) {
      right = right.trim();
    }
  } else if (options.ignoreNewlineAtEof && !options.newlineIsToken) {
    if (left.endsWith("\n")) {
      left = left.slice(0, -1);
    }
    if (right.endsWith("\n")) {
      right = right.slice(0, -1);
    }
  }
  return Diff.prototype.equals.call(this, left, right, options);
};
var sentenceDiff = new Diff();
sentenceDiff.tokenize = function(value) {
  return value.split(/(\S.+?[.!?])(?=\s+|$)/);
};
var cssDiff = new Diff();
cssDiff.tokenize = function(value) {
  return value.split(/([{}:;,]|\s+)/);
};
function _typeof(o) {
  "@babel/helpers - typeof";
  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof(o);
}
var jsonDiff = new Diff();
jsonDiff.useLongestToken = true;
jsonDiff.tokenize = lineDiff.tokenize;
jsonDiff.castInput = function(value, options) {
  var undefinedReplacement = options.undefinedReplacement, _options$stringifyRep = options.stringifyReplacer, stringifyReplacer = _options$stringifyRep === void 0 ? function(k, v) {
    return typeof v === "undefined" ? undefinedReplacement : v;
  } : _options$stringifyRep;
  return typeof value === "string" ? value : JSON.stringify(canonicalize(value, null, null, stringifyReplacer), stringifyReplacer, "  ");
};
jsonDiff.equals = function(left, right, options) {
  return Diff.prototype.equals.call(jsonDiff, left.replace(/,([\r\n])/g, "$1"), right.replace(/,([\r\n])/g, "$1"), options);
};
function canonicalize(obj, stack2, replacementStack, replacer, key2) {
  stack2 = stack2 || [];
  replacementStack = replacementStack || [];
  if (replacer) {
    obj = replacer(key2, obj);
  }
  var i;
  for (i = 0; i < stack2.length; i += 1) {
    if (stack2[i] === obj) {
      return replacementStack[i];
    }
  }
  var canonicalizedObj;
  if ("[object Array]" === Object.prototype.toString.call(obj)) {
    stack2.push(obj);
    canonicalizedObj = new Array(obj.length);
    replacementStack.push(canonicalizedObj);
    for (i = 0; i < obj.length; i += 1) {
      canonicalizedObj[i] = canonicalize(obj[i], stack2, replacementStack, replacer, key2);
    }
    stack2.pop();
    replacementStack.pop();
    return canonicalizedObj;
  }
  if (obj && obj.toJSON) {
    obj = obj.toJSON();
  }
  if (_typeof(obj) === "object" && obj !== null) {
    stack2.push(obj);
    canonicalizedObj = {};
    replacementStack.push(canonicalizedObj);
    var sortedKeys = [], _key;
    for (_key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, _key)) {
        sortedKeys.push(_key);
      }
    }
    sortedKeys.sort();
    for (i = 0; i < sortedKeys.length; i += 1) {
      _key = sortedKeys[i];
      canonicalizedObj[_key] = canonicalize(obj[_key], stack2, replacementStack, replacer, _key);
    }
    stack2.pop();
    replacementStack.pop();
  } else {
    canonicalizedObj = obj;
  }
  return canonicalizedObj;
}
var arrayDiff = new Diff();
arrayDiff.tokenize = function(value) {
  return value.slice();
};
arrayDiff.join = arrayDiff.removeEmpty = function(value) {
  return value;
};

// src/utils/diff-helper.ts
var UnicodeWordDiff = class extends Diff {
  tokenize(value) {
    return value.split(/([^\S\r\n]+|[^\p{L}\p{N}_]+)/u).filter(Boolean);
  }
};
var unicodeWordDiffInstance = new UnicodeWordDiff();
function diffWordsUnicode(oldStr, newStr) {
  return unicodeWordDiffInstance.diff(oldStr || "", newStr || "");
}

// src/ui/components/SpanDiffViewer.svelte
var root2 = from_html(`<span class="diff-added svelte-13dybmm" title="\u0414\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u043D\u044B\u0439 \u0442\u0435\u043A\u0441\u0442"> </span>`);
var root_12 = from_html(`<span class="diff-removed svelte-13dybmm" title="\u0423\u0434\u0430\u043B\u044F\u0435\u043C\u044B\u0439 \u0442\u0435\u043A\u0441\u0442"> </span>`);
var root_22 = from_html(`<span class="diff-unchanged svelte-13dybmm"> </span>`);
var root_32 = from_html(`<div class="span-diff-container svelte-13dybmm"><div class="diff-block svelte-13dybmm"></div></div>`);
var $$css2 = {
  hash: "svelte-13dybmm",
  code: ".span-diff-container.svelte-13dybmm {font-family:var(--font-text);font-size:0.9em;line-height:1.6;padding:10px 14px;background-color:var(--background-primary-alt);border-radius:6px;border:1px solid var(--background-modifier-border);overflow-x:auto;}.diff-block.svelte-13dybmm {white-space:pre-wrap;word-break:break-word;}.diff-added.svelte-13dybmm {background-color:rgba(46, 160, 67, 0.22);color:var(--text-success, #3fb950);text-decoration:none;border-radius:3px;padding:1px 3px;border-bottom:2px solid rgba(46, 160, 67, 0.6);}.diff-removed.svelte-13dybmm {background-color:rgba(248, 81, 73, 0.22);color:var(--text-error, #f85149);text-decoration:line-through;border-radius:3px;padding:1px 3px;opacity:0.85;}.diff-unchanged.svelte-13dybmm {color:var(--text-normal);}"
};
function SpanDiffViewer($$anchor, $$props) {
  push($$props, false);
  append_styles($$anchor, $$css2);
  let originalText = prop($$props, "originalText", 8, "");
  let newText = prop($$props, "newText", 8, "");
  let diffParts = mutable_source([]);
  legacy_pre_effect(
    () => (deep_read_state(originalText()), deep_read_state(newText()), diffWordsUnicode),
    () => {
      if (!originalText() && !newText()) {
        set(diffParts, []);
      } else if (originalText() === newText()) {
        set(diffParts, [{ value: originalText(), added: false, removed: false }]);
      } else {
        set(diffParts, diffWordsUnicode(originalText() || "", newText() || ""));
      }
    }
  );
  legacy_pre_effect_reset();
  init();
  var div = root_32();
  var div_1 = child(div);
  each(div_1, 5, () => get(diffParts), index, ($$anchor2, part) => {
    var fragment = comment();
    var node = first_child(fragment);
    {
      var consequent = ($$anchor3) => {
        var span = root2();
        var text2 = only_child(span, true);
        template_effect(() => set_text(text2, (get(part), untrack(() => get(part).value))));
        append($$anchor3, span);
      };
      var consequent_1 = ($$anchor3) => {
        var span_1 = root_12();
        var text_1 = only_child(span_1, true);
        template_effect(() => set_text(text_1, (get(part), untrack(() => get(part).value))));
        append($$anchor3, span_1);
      };
      var alternate = ($$anchor3) => {
        var span_2 = root_22();
        var text_2 = only_child(span_2, true);
        template_effect(() => set_text(text_2, (get(part), untrack(() => get(part).value))));
        append($$anchor3, span_2);
      };
      if_block(node, ($$render) => {
        if (get(part), untrack(() => get(part).added)) $$render(consequent);
        else if (get(part), untrack(() => get(part).removed)) $$render(consequent_1, 1);
        else $$render(alternate, -1);
      });
    }
    append($$anchor2, fragment);
  });
  reset(div_1);
  reset(div);
  append($$anchor, div);
  pop();
}

// src/ui/components/DiffCard.svelte
var root3 = from_html(`<span class="file-breadcrumbs svelte-1fwpjra"> </span>`);
var root_13 = from_html(`<div class="skip-notice svelte-1fwpjra"><span>\u0424\u0430\u0439\u043B \u043D\u0435 \u0431\u0443\u0434\u0435\u0442 \u0438\u0437\u043C\u0435\u043D\u0435\u043D. \u0418\u0441\u0445\u043E\u0434\u043D\u044B\u0439 \u0444\u0440\u0430\u0433\u043C\u0435\u043D\u0442 \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0435\u0442\u0441\u044F:</span> <div class="original-preview svelte-1fwpjra"> </div></div>`);
var root_23 = from_html(`<div class="diff-section"><!></div>`);
var root_33 = from_html(`<div><div class="diff-card-header svelte-1fwpjra"><div class="file-info svelte-1fwpjra"><span class="file-icon svelte-1fwpjra">\u{1F4C4}</span> <span class="file-path svelte-1fwpjra"> </span> <!></div> <div class="mode-toggles svelte-1fwpjra"><button type="button" title="\u0412\u0441\u0442\u0440\u043E\u0438\u0442\u044C \u0438\u043D\u043B\u0430\u0439\u043D-\u0441\u0441\u044B\u043B\u043A\u0443 \u0441 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435\u043C \u0430\u0432\u0442\u043E\u0440\u0441\u043A\u043E\u0433\u043E \u0441\u0442\u0438\u043B\u044F">\u{1F517} \u0418\u043D\u043B\u0430\u0439\u043D [[\u0421\u0441\u044B\u043B\u043A\u0430]]</button> <button type="button" title="\u0417\u0430\u043C\u0435\u043D\u0438\u0442\u044C \u043D\u0430 \u0442\u0440\u0430\u043D\u0441\u043A\u043B\u044E\u0437\u0438\u044E ![[\u041A\u043E\u043D\u0446\u0435\u043F\u0442]]">\u{1F4D1} ![[\u0422\u0440\u0430\u043D\u0441\u043A\u043B\u044E\u0437\u0438\u044F]]</button> <button type="button" title="\u041D\u0435 \u0438\u0437\u043C\u0435\u043D\u044F\u0442\u044C \u044D\u0442\u043E\u0442 \u0444\u0430\u0439\u043B">\u23ED \u041F\u0440\u043E\u043F\u0443\u0441\u0442\u0438\u0442\u044C</button></div></div> <div class="diff-card-body svelte-1fwpjra"><!></div></div>`);
var $$css3 = {
  hash: "svelte-1fwpjra",
  code: ".diff-card.svelte-1fwpjra {border:1px solid var(--background-modifier-border);border-radius:8px;background-color:var(--background-secondary);margin-bottom:14px;box-shadow:0 1px 3px rgba(0, 0, 0, 0.08);transition:border-color 0.2s ease, opacity 0.2s ease;}.diff-card.is-skipped.svelte-1fwpjra {opacity:0.65;border-style:dashed;}.diff-card-header.svelte-1fwpjra {display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-bottom:1px solid var(--background-modifier-border);background-color:var(--background-secondary-alt);border-top-left-radius:8px;border-top-right-radius:8px;flex-wrap:wrap;gap:8px;}.file-info.svelte-1fwpjra {display:flex;align-items:center;gap:8px;font-size:0.9em;}.file-icon.svelte-1fwpjra {font-size:1.1em;}.file-path.svelte-1fwpjra {font-weight:600;color:var(--text-normal);}.file-breadcrumbs.svelte-1fwpjra {font-size:0.8em;color:var(--text-muted);font-family:var(--font-monospace);}.mode-toggles.svelte-1fwpjra {display:flex;gap:4px;background-color:var(--background-primary);padding:3px;border-radius:6px;border:1px solid var(--background-modifier-border);}.mode-btn.svelte-1fwpjra {border:none;background:transparent;color:var(--text-muted);font-size:0.78em;padding:4px 9px;border-radius:4px;cursor:pointer;transition:all 0.15s ease;}.mode-btn.svelte-1fwpjra:hover {color:var(--text-normal);background-color:var(--background-modifier-hover);}.mode-btn.active.svelte-1fwpjra {background-color:var(--interactive-accent);color:var(--text-on-accent);font-weight:600;}.mode-btn.skip-active.svelte-1fwpjra {background-color:var(--background-modifier-box-shadow, #555);color:var(--text-normal);}.diff-card-body.svelte-1fwpjra {padding:12px 14px;}.skip-notice.svelte-1fwpjra {font-size:0.85em;color:var(--text-muted);padding:8px;}.original-preview.svelte-1fwpjra {margin-top:6px;font-style:italic;color:var(--text-normal);padding:6px 10px;background-color:var(--background-primary);border-radius:4px;}"
};
function DiffCard($$anchor, $$props) {
  push($$props, false);
  append_styles($$anchor, $$css3);
  const currentReplacement = mutable_source();
  let modification = prop($$props, "modification", 12);
  let breadcrumbs = prop($$props, "breadcrumbs", 8, "");
  function setMode(mode) {
    modification(modification().selectedMode = mode, true);
  }
  legacy_pre_effect(() => deep_read_state(modification()), () => {
    set(currentReplacement, modification().selectedMode === "inline" ? modification().suggestedInlineSpan : modification().selectedMode === "transclusion" ? modification().transclusionSpan : modification().originalSpan);
  });
  legacy_pre_effect_reset();
  init();
  var div = root_33();
  var div_1 = child(div);
  var div_2 = child(div_1);
  var span = sibling(child(div_2), 2);
  var text2 = only_child(span, true);
  var node = sibling(span, 2);
  {
    var consequent = ($$anchor2) => {
      var span_1 = root3();
      var text_1 = only_child(span_1, true);
      template_effect(() => set_text(text_1, breadcrumbs()));
      append($$anchor2, span_1);
    };
    if_block(node, ($$render) => {
      if (breadcrumbs()) $$render(consequent);
    });
  }
  reset(div_2);
  var div_3 = sibling(div_2, 2);
  var button = child(div_3);
  var button_1 = sibling(button, 2);
  var button_2 = sibling(button_1, 2);
  reset(div_3);
  reset(div_1);
  var div_4 = sibling(div_1, 2);
  var node_1 = child(div_4);
  {
    var consequent_1 = ($$anchor2) => {
      var div_5 = root_13();
      var div_6 = sibling(child(div_5), 2);
      var text_2 = only_child(div_6, true);
      reset(div_5);
      template_effect(() => set_text(text_2, (deep_read_state(modification()), untrack(() => modification().originalSpan))));
      append($$anchor2, div_5);
    };
    var alternate = ($$anchor2) => {
      var div_7 = root_23();
      var node_2 = child(div_7);
      SpanDiffViewer(node_2, {
        get originalText() {
          return deep_read_state(modification()), untrack(() => modification().originalSpan);
        },
        get newText() {
          return get(currentReplacement);
        }
      });
      reset(div_7);
      append($$anchor2, div_7);
    };
    if_block(node_1, ($$render) => {
      if (deep_read_state(modification()), untrack(() => modification().selectedMode === "skip")) $$render(consequent_1);
      else $$render(alternate, -1);
    });
  }
  reset(div_4);
  reset(div);
  template_effect(() => {
    set_class(
      div,
      1,
      `diff-card ${(deep_read_state(modification()), untrack(() => modification().selectedMode === "skip" ? "is-skipped" : "")) ?? ""}`,
      "svelte-1fwpjra"
    );
    set_text(text2, (deep_read_state(modification()), untrack(() => modification().filePath)));
    set_class(
      button,
      1,
      `mode-btn ${(deep_read_state(modification()), untrack(() => modification().selectedMode === "inline" ? "active" : "")) ?? ""}`,
      "svelte-1fwpjra"
    );
    set_class(
      button_1,
      1,
      `mode-btn ${(deep_read_state(modification()), untrack(() => modification().selectedMode === "transclusion" ? "active" : "")) ?? ""}`,
      "svelte-1fwpjra"
    );
    set_class(
      button_2,
      1,
      `mode-btn ${(deep_read_state(modification()), untrack(() => modification().selectedMode === "skip" ? "active skip-active" : "")) ?? ""}`,
      "svelte-1fwpjra"
    );
  });
  event("click", button, () => setMode("inline"));
  event("click", button_1, () => setMode("transclusion"));
  event("click", button_2, () => setMode("skip"));
  append($$anchor, div);
  pop();
}

// src/ui/components/ReviewModal.svelte
var root4 = from_html(`<span class="scanning-indicator svelte-71f0fw"><span class="spinner svelte-71f0fw"></span> </span>`);
var root_14 = from_html(`<button class="sg-btn svelte-71f0fw" title="\u041F\u043E\u0438\u0441\u043A \u0434\u0443\u0431\u043B\u0438\u043A\u0430\u0442\u043E\u0432 \u0434\u043B\u044F \u0442\u0435\u043A\u0443\u0449\u0435\u0439 \u043E\u0442\u043A\u0440\u044B\u0442\u043E\u0439 \u0437\u0430\u043C\u0435\u0442\u043A\u0438">\u{1F4C4} \u0410\u043A\u0442\u0438\u0432\u043D\u0430\u044F \u0437\u0430\u043C\u0435\u0442\u043A\u0430</button> <button class="sg-btn sg-btn-primary svelte-71f0fw" title="\u041F\u043E\u043B\u043D\u043E\u0435 \u0441\u0435\u043C\u0430\u043D\u0442\u0438\u0447\u0435\u0441\u043A\u043E\u0435 \u0441\u043A\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0430">\u{1F50D} \u0421\u043A\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u0442\u044C Vault</button>`, 1);
var root_24 = from_html(`<p>\u0412\u044B\u043F\u043E\u043B\u043D\u044F\u0435\u0442\u0441\u044F \u0441\u043A\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0430...</p>`);
var root_34 = from_html(`<p>\u0414\u0443\u0431\u043B\u0438\u043A\u0430\u0442\u043E\u0432 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E \u0438\u043B\u0438 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0435 \u0435\u0449\u0435 \u043D\u0435 \u043F\u0440\u043E\u0441\u043A\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u043E.</p> <button class="sg-btn sg-btn-sm svelte-71f0fw">\u0417\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C \u0441\u043A\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435</button>`, 1);
var root_42 = from_html(`<div class="empty-clusters svelte-71f0fw"><!></div>`);
var root_52 = from_html(`<div class="empty-selection svelte-71f0fw"><div class="empty-icon svelte-71f0fw">\u{1F33F}</div> <h3>\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043A\u043E\u043D\u0446\u0435\u043F\u0442 \u0434\u043B\u044F \u0440\u0435\u0432\u0438\u0437\u0438\u0438</h3> <p>\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0443 \u0438\u0437 \u0441\u043F\u0438\u0441\u043A\u0430 \u0441\u043B\u0435\u0432\u0430, \u0447\u0442\u043E\u0431\u044B \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442,
            \u043F\u043E\u0441\u043B\u043E\u0432\u043D\u044B\u0439 diff \u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0438\u0442\u044C \u043C\u0438\u043A\u0440\u043E\u0445\u0438\u0440\u0443\u0440\u0433\u0438\u0447\u0435\u0441\u043A\u0443\u044E \u0437\u0430\u043C\u0435\u043D\u0443.</p></div>`);
var root_6 = from_html(`<div class="gatekeeper-banner approved svelte-71f0fw"><span class="banner-icon svelte-71f0fw">\u2713</span> <div><strong>LLM Gatekeeper:</strong> \u0421\u043C\u044B\u0441\u043B\u043E\u0432\u043E\u0435 \u0434\u0443\u0431\u043B\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u043E.
                    \u0421\u0444\u043E\u0440\u043C\u0438\u0440\u043E\u0432\u0430\u043D \u043F\u043B\u0430\u043D \u0430\u0442\u043E\u043C\u0430\u0440\u043D\u043E\u0439 \u0437\u0430\u043C\u0435\u0442\u043A\u0438 \u0438 \u043C\u0438\u043A\u0440\u043E\u0445\u0438\u0440\u0443\u0440\u0433\u0438\u0447\u0435\u0441\u043A\u0438\u0445 \u043F\u0440\u0430\u0432\u043E\u043A.</div></div>`);
var root_7 = from_html(`<div class="gatekeeper-banner rejected svelte-71f0fw"><span class="banner-icon svelte-71f0fw">\u2715</span> <div><strong>LLM Gatekeeper \u043E\u0442\u043A\u043B\u043E\u043D\u0438\u043B \u043E\u0431\u044A\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u0435:</strong> </div></div>`);
var root_8 = from_html(`<div class="gatekeeper-banner pending svelte-71f0fw"><span class="banner-icon svelte-71f0fw">\u23F3</span> <div><strong>\u0410\u043D\u0430\u043B\u0438\u0437 \u0432 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u0435:</strong> \u041E\u0442\u043F\u0440\u0430\u0432\u043A\u0430 \u043A\u0430\u043D\u0434\u0438\u0434\u0430\u0442\u043E\u0432 \u0432 Gemini
                  3.5 Flash...</div></div>`);
var root_9 = from_html(`<div class="no-mods svelte-71f0fw"><p>\u0414\u043B\u044F \u0434\u0430\u043D\u043D\u043E\u0433\u043E \u043A\u043B\u0430\u0441\u0442\u0435\u0440\u0430 \u043D\u0435\u0442 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u043D\u044B\u0445 \u043F\u0440\u0430\u0432\u043E\u043A (\u0438\u043B\u0438 \u043A\u043B\u0430\u0441\u0442\u0435\u0440
                      \u0431\u044B\u043B \u043E\u0442\u043A\u043B\u043E\u043D\u0435\u043D Gatekeeper).</p></div>`);
var root_10 = from_html(`<div class="modifications-list svelte-71f0fw"><!></div>`);
var root_11 = from_html(`<div class="note-preview-pane svelte-71f0fw"><label for="atomic-note-textarea" class="concept-label svelte-71f0fw">\u0421\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0435 \u043D\u043E\u0432\u043E\u0439 \u0430\u0442\u043E\u043C\u0430\u0440\u043D\u043E\u0439 \u0437\u0430\u043C\u0435\u0442\u043A\u0438 (Markdown):</label> <textarea id="atomic-note-textarea" class="atomic-note-editor svelte-71f0fw" rows="12" placeholder="# \u041E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0438\u0435

\u0422\u0435\u043A\u0441\u0442 \u043D\u043E\u0432\u043E\u0439 \u0430\u0442\u043E\u043C\u0430\u0440\u043D\u043E\u0439 \u0437\u0430\u043C\u0435\u0442\u043A\u0438..."></textarea></div>`);
var root_122 = from_html(`<div class="concept-workspace svelte-71f0fw"><div class="concept-header-box svelte-71f0fw"><!> <div class="concept-title-row svelte-71f0fw"><label for="concept-title-input" class="concept-label svelte-71f0fw">\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043A\u0430\u043D\u043E\u043D\u0438\u0447\u0435\u0441\u043A\u043E\u0439 \u0437\u0430\u043C\u0435\u0442\u043A\u0438:</label> <input id="concept-title-input" type="text" class="concept-title-input svelte-71f0fw" placeholder="\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: \u0417\u0430\u043A\u043E\u043D \u041B\u0438\u0442\u0442\u043B\u0430"/></div> <div class="tab-bar svelte-71f0fw"><button> </button> <button>\u{1F4DD} \u0422\u0435\u043A\u0441\u0442 \u043D\u043E\u0432\u043E\u0439 \u0437\u0430\u043C\u0435\u0442\u043A\u0438</button></div></div> <div class="tab-content svelte-71f0fw"><!></div> <div class="concept-footer-actions svelte-71f0fw"><button class="sg-btn sg-btn-danger svelte-71f0fw" title="\u0418\u0441\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u043A\u043E\u043D\u0446\u0435\u043F\u0442 \u0438\u0437 \u043E\u0447\u0435\u0440\u0435\u0434\u0438">\u041E\u0442\u043A\u043B\u043E\u043D\u0438\u0442\u044C \u043A\u043E\u043D\u0446\u0435\u043F\u0442</button> <div class="spacer svelte-71f0fw"></div> <button class="sg-btn sg-btn-primary sg-btn-large svelte-71f0fw" title="\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0437\u0430\u043C\u0435\u0442\u043A\u0443 \u0438 \u043F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0435 \u0437\u0430\u043C\u0435\u043D\u044B \u0432 \u0444\u0430\u0439\u043B\u0430\u0445 \u0441 \u0437\u0430\u043F\u0438\u0441\u044C\u044E \u0432 \u0436\u0443\u0440\u043D\u0430\u043B \u0438\u0441\u0442\u043E\u0440\u0438\u0438">\u{1F680} \u041F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C \u0440\u0435\u0444\u0430\u043A\u0442\u043E\u0440\u0438\u043D\u0433</button></div></div>`);
var root_132 = from_html(`<div class="semantic-gardener-root svelte-71f0fw"><header class="sg-header svelte-71f0fw"><div class="sg-header-left svelte-71f0fw"><span class="sg-logo svelte-71f0fw">\u{1F331}</span> <h2 class="sg-title svelte-71f0fw">Semantic Gardener</h2> <span class="sg-badge svelte-71f0fw"> </span></div> <div class="sg-header-actions svelte-71f0fw"><!> <button class="sg-btn sg-btn-undo svelte-71f0fw" title="\u041E\u0442\u043A\u0430\u0442\u0438\u0442\u044C \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u0440\u0435\u0444\u0430\u043A\u0442\u043E\u0440\u0438\u043D\u0433 \u0432 1 \u043A\u043B\u0438\u043A"> </button></div></header> <div class="sg-body svelte-71f0fw"><aside class="sg-sidebar svelte-71f0fw"><div class="sidebar-header svelte-71f0fw"><span>\u041E\u0447\u0435\u0440\u0435\u0434\u044C \u043A\u043E\u043D\u0446\u0435\u043F\u0442\u043E\u0432</span> <span class="count-pill svelte-71f0fw"> </span></div> <div class="cluster-list svelte-71f0fw"><!></div></aside> <main class="sg-main-content svelte-71f0fw"><!></main></div></div>`);
var $$css4 = {
  hash: "svelte-71f0fw",
  code: ".semantic-gardener-root.svelte-71f0fw {display:flex;flex-direction:column;height:100%;width:100%;background-color:var(--background-primary);color:var(--text-normal);font-family:var(--font-text);overflow:hidden;}.sg-header.svelte-71f0fw {display:flex;justify-content:space-between;align-items:center;padding:12px 18px;border-bottom:1px solid var(--background-modifier-border);background-color:var(--background-secondary-alt);flex-shrink:0;}.sg-header-left.svelte-71f0fw {display:flex;align-items:center;gap:10px;}.sg-logo.svelte-71f0fw {font-size:1.5em;}.sg-title.svelte-71f0fw {margin:0;font-size:1.25em;font-weight:700;}.sg-badge.svelte-71f0fw {font-size:0.78em;padding:2px 8px;border-radius:12px;background-color:var(--background-modifier-border);color:var(--text-muted);}.sg-header-actions.svelte-71f0fw {display:flex;align-items:center;gap:8px;}.sg-btn.svelte-71f0fw {padding:6px 12px;border-radius:6px;border:1px solid var(--background-modifier-border);background-color:var(--background-primary);color:var(--text-normal);cursor:pointer;font-size:0.85em;font-weight:500;transition:all 0.15s ease;}.sg-btn.svelte-71f0fw:hover:not(:disabled) {background-color:var(--background-modifier-hover);border-color:var(--interactive-accent);}.sg-btn.svelte-71f0fw:disabled {opacity:0.45;cursor:not-allowed;}.sg-btn-primary.svelte-71f0fw {background-color:var(--interactive-accent);color:var(--text-on-accent);border-color:var(--interactive-accent);}.sg-btn-primary.svelte-71f0fw:hover:not(:disabled) {background-color:var(--interactive-accent-hover);}.sg-btn-danger.svelte-71f0fw {color:var(--text-error, #f85149);border-color:rgba(248, 81, 73, 0.4);}.sg-btn-danger.svelte-71f0fw:hover {background-color:rgba(248, 81, 73, 0.15);}.sg-btn-undo.svelte-71f0fw {border-color:var(--background-modifier-border);}.sg-btn-large.svelte-71f0fw {padding:8px 18px;font-size:0.95em;font-weight:600;}.sg-btn-sm.svelte-71f0fw {padding:4px 8px;font-size:0.8em;}.scanning-indicator.svelte-71f0fw {display:flex;align-items:center;gap:8px;font-size:0.85em;color:var(--text-accent);}.spinner.svelte-71f0fw {width:14px;height:14px;border:2px solid var(--interactive-accent);border-top-color:transparent;border-radius:50%;\n    animation: svelte-71f0fw-spin 0.8s linear infinite;}\n\n  @keyframes svelte-71f0fw-spin {\n    to {\n      transform: rotate(360deg);\n    }\n  }.sg-body.svelte-71f0fw {display:flex;flex:1;overflow:hidden;}\n\n  /* Left Sidebar */.sg-sidebar.svelte-71f0fw {width:320px;border-right:1px solid var(--background-modifier-border);display:flex;flex-direction:column;background-color:var(--background-secondary);flex-shrink:0;}.sidebar-header.svelte-71f0fw {display:flex;justify-content:space-between;align-items:center;padding:10px 14px;font-size:0.85em;font-weight:600;color:var(--text-muted);border-bottom:1px solid var(--background-modifier-border);}.count-pill.svelte-71f0fw {padding:1px 6px;border-radius:10px;background-color:var(--background-modifier-border);font-size:0.85em;}.cluster-list.svelte-71f0fw {flex:1;overflow-y:auto;padding:10px;}.empty-clusters.svelte-71f0fw {text-align:center;padding:30px 16px;color:var(--text-muted);font-size:0.88em;}\n\n  /* Main Workspace */.sg-main-content.svelte-71f0fw {flex:1;display:flex;flex-direction:column;overflow-y:auto;background-color:var(--background-primary);}.empty-selection.svelte-71f0fw {display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text-muted);text-align:center;padding:40px;}.empty-icon.svelte-71f0fw {font-size:3em;margin-bottom:12px;}.concept-workspace.svelte-71f0fw {display:flex;flex-direction:column;height:100%;padding:18px 24px;gap:16px;overflow-y:auto;}.concept-header-box.svelte-71f0fw {display:flex;flex-direction:column;gap:12px;}.gatekeeper-banner.svelte-71f0fw {display:flex;align-items:flex-start;gap:10px;padding:10px 14px;border-radius:6px;font-size:0.88em;}.gatekeeper-banner.approved.svelte-71f0fw {background-color:rgba(46, 160, 67, 0.15);border:1px solid rgba(46, 160, 67, 0.4);color:var(--text-success, #3fb950);}.gatekeeper-banner.rejected.svelte-71f0fw {background-color:rgba(248, 81, 73, 0.15);border:1px solid rgba(248, 81, 73, 0.4);color:var(--text-error, #f85149);}.gatekeeper-banner.pending.svelte-71f0fw {background-color:var(--background-modifier-border);color:var(--text-muted);}.banner-icon.svelte-71f0fw {font-size:1.2em;font-weight:700;}.concept-title-row.svelte-71f0fw {display:flex;flex-direction:column;gap:6px;}.concept-label.svelte-71f0fw {font-size:0.85em;font-weight:600;color:var(--text-muted);}.concept-title-input.svelte-71f0fw {width:100%;font-size:1.1em;font-weight:600;padding:8px 12px;border-radius:6px;border:1px solid var(--background-modifier-border);background-color:var(--background-secondary);color:var(--text-normal);}.concept-title-input.svelte-71f0fw:focus {border-color:var(--interactive-accent);outline:none;}.tab-bar.svelte-71f0fw {display:flex;gap:8px;border-bottom:1px solid var(--background-modifier-border);padding-bottom:6px;}.tab-btn.svelte-71f0fw {background:transparent;border:none;color:var(--text-muted);font-size:0.88em;padding:6px 12px;border-radius:4px;cursor:pointer;}.tab-btn.svelte-71f0fw:hover {color:var(--text-normal);}.tab-btn.active.svelte-71f0fw {color:var(--interactive-accent);font-weight:600;border-bottom:2px solid var(--interactive-accent);border-radius:0;}.tab-content.svelte-71f0fw {flex:1;}.modifications-list.svelte-71f0fw {display:flex;flex-direction:column;}.no-mods.svelte-71f0fw {padding:20px;color:var(--text-muted);font-style:italic;}.note-preview-pane.svelte-71f0fw {display:flex;flex-direction:column;gap:8px;}.atomic-note-editor.svelte-71f0fw {width:100%;font-family:var(--font-monospace);font-size:0.9em;line-height:1.5;padding:12px;border-radius:6px;border:1px solid var(--background-modifier-border);background-color:var(--background-secondary);color:var(--text-normal);resize:vertical;}.concept-footer-actions.svelte-71f0fw {display:flex;align-items:center;padding-top:14px;border-top:1px solid var(--background-modifier-border);margin-top:auto;}.spacer.svelte-71f0fw {flex:1;}"
};
function ReviewModal($$anchor, $$props) {
  push($$props, false);
  append_styles($$anchor, $$css4);
  const selectedCluster = mutable_source();
  const selectedPlan = mutable_source();
  let plugin = prop($$props, "plugin", 8);
  let clusters = prop($$props, "clusters", 24, () => []);
  let plans = prop($$props, "plans", 24, () => ({}));
  let isScanning = prop($$props, "isScanning", 8, false);
  let scanProgress = prop($$props, "scanProgress", 8, "");
  let onScanVault = prop($$props, "onScanVault", 8);
  let onScanActiveNote = prop($$props, "onScanActiveNote", 8);
  let onApplyPlan = prop($$props, "onApplyPlan", 8);
  let onRejectCluster = prop($$props, "onRejectCluster", 8);
  let onUndoLast = prop($$props, "onUndoLast", 8);
  let selectedClusterId = mutable_source(null);
  let activeTab = mutable_source("modifications");
  let historyCount = mutable_source(0);
  function updateHistoryCount() {
    if (plugin()?.transactionManager) {
      set(historyCount, plugin().transactionManager.getHistory().length);
    }
  }
  onMount(() => {
    updateHistoryCount();
  });
  async function handleApply() {
    if (!get(selectedCluster) || !get(selectedPlan)) return;
    await onApplyPlan()(get(selectedCluster), get(selectedPlan));
    updateHistoryCount();
  }
  async function handleUndo() {
    await onUndoLast()();
    updateHistoryCount();
  }
  legacy_pre_effect(() => (get(selectedClusterId), deep_read_state(clusters())), () => {
    if (!get(selectedClusterId) && clusters().length > 0) {
      set(selectedClusterId, clusters()[0].id);
    }
  });
  legacy_pre_effect(() => (deep_read_state(clusters()), get(selectedClusterId)), () => {
    set(selectedCluster, clusters().find((c) => c.id === get(selectedClusterId)) || (clusters().length > 0 ? clusters()[0] : null));
  });
  legacy_pre_effect(() => (get(selectedCluster), deep_read_state(plans())), () => {
    set(selectedPlan, get(selectedCluster) ? plans()[get(selectedCluster).id] : null);
  });
  legacy_pre_effect_reset();
  init();
  var div = root_132();
  var header = child(div);
  var div_1 = child(header);
  var span = sibling(child(div_1), 4);
  var text2 = only_child(span);
  reset(div_1);
  var div_2 = sibling(div_1, 2);
  var node = child(div_2);
  {
    var consequent = ($$anchor2) => {
      var span_1 = root4();
      var text_1 = sibling(child(span_1));
      reset(span_1);
      template_effect(() => set_text(text_1, ` ${(scanProgress() || "\u0412\u0435\u043A\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F \u0438 \u0430\u043D\u0430\u043B\u0438\u0437...") ?? ""}`));
      append($$anchor2, span_1);
    };
    var alternate = ($$anchor2) => {
      var fragment = root_14();
      var button = first_child(fragment);
      var button_1 = sibling(button, 2);
      event("click", button, function(...$$args) {
        onScanActiveNote()?.apply(this, $$args);
      });
      event("click", button_1, function(...$$args) {
        onScanVault()?.apply(this, $$args);
      });
      append($$anchor2, fragment);
    };
    if_block(node, ($$render) => {
      if (isScanning()) $$render(consequent);
      else $$render(alternate, -1);
    });
  }
  var button_2 = sibling(node, 2);
  var text_2 = only_child(button_2);
  reset(div_2);
  reset(header);
  var div_3 = sibling(header, 2);
  var aside = child(div_3);
  var div_4 = child(aside);
  var span_2 = sibling(child(div_4), 2);
  var text_3 = only_child(span_2, true);
  reset(div_4);
  var div_5 = sibling(div_4, 2);
  var node_1 = child(div_5);
  {
    var consequent_2 = ($$anchor2) => {
      var div_6 = root_42();
      var node_2 = child(div_6);
      {
        var consequent_1 = ($$anchor3) => {
          var p = root_24();
          append($$anchor3, p);
        };
        var alternate_1 = ($$anchor3) => {
          var fragment_1 = root_34();
          var button_3 = sibling(first_child(fragment_1), 2);
          event("click", button_3, function(...$$args) {
            onScanVault()?.apply(this, $$args);
          });
          append($$anchor3, fragment_1);
        };
        if_block(node_2, ($$render) => {
          if (isScanning()) $$render(consequent_1);
          else $$render(alternate_1, -1);
        });
      }
      reset(div_6);
      append($$anchor2, div_6);
    };
    var alternate_2 = ($$anchor2) => {
      var fragment_2 = comment();
      var node_3 = first_child(fragment_2);
      each(node_3, 1, clusters, (cluster) => cluster.id, ($$anchor3, cluster) => {
        {
          let $0 = derived_safe_equal(() => (get(selectedCluster), get(cluster), untrack(() => get(selectedCluster)?.id === get(cluster).id)));
          ClusterCard($$anchor3, {
            get cluster() {
              return get(cluster);
            },
            get plan() {
              return deep_read_state(plans()), get(cluster), untrack(() => plans()[get(cluster).id]);
            },
            get isSelected() {
              return get($0);
            },
            onSelect: () => {
              set(selectedClusterId, get(cluster).id);
            }
          });
        }
      });
      append($$anchor2, fragment_2);
    };
    if_block(node_1, ($$render) => {
      if (deep_read_state(clusters()), untrack(() => clusters().length === 0)) $$render(consequent_2);
      else $$render(alternate_2, -1);
    });
  }
  reset(div_5);
  reset(aside);
  var main = sibling(aside, 2);
  var node_4 = child(main);
  {
    var consequent_3 = ($$anchor2) => {
      var div_7 = root_52();
      append($$anchor2, div_7);
    };
    var alternate_7 = ($$anchor2) => {
      var div_8 = root_122();
      var div_9 = child(div_8);
      var node_5 = child(div_9);
      {
        var consequent_5 = ($$anchor3) => {
          var fragment_4 = comment();
          var node_6 = first_child(fragment_4);
          {
            var consequent_4 = ($$anchor4) => {
              var div_10 = root_6();
              append($$anchor4, div_10);
            };
            var alternate_3 = ($$anchor4) => {
              var div_11 = root_7();
              var div_12 = sibling(child(div_11), 2);
              var text_4 = sibling(child(div_12));
              reset(div_12);
              reset(div_11);
              template_effect(() => set_text(text_4, ` ${(get(selectedPlan), untrack(() => get(selectedPlan).rejectionReason || "\u0420\u0430\u0437\u043D\u044B\u0435 \u043F\u0440\u0435\u0434\u043C\u0435\u0442\u043D\u044B\u0435 \u043E\u0431\u043B\u0430\u0441\u0442\u0438 \u0438\u043B\u0438 \u043C\u0435\u0442\u0430\u0444\u043E\u0440\u044B.")) ?? ""}`));
              append($$anchor4, div_11);
            };
            if_block(node_6, ($$render) => {
              if (get(selectedPlan), untrack(() => get(selectedPlan).isDuplicate)) $$render(consequent_4);
              else $$render(alternate_3, -1);
            });
          }
          append($$anchor3, fragment_4);
        };
        var alternate_4 = ($$anchor3) => {
          var div_13 = root_8();
          append($$anchor3, div_13);
        };
        if_block(node_5, ($$render) => {
          if (get(selectedPlan)) $$render(consequent_5);
          else $$render(alternate_4, -1);
        });
      }
      var div_14 = sibling(node_5, 2);
      var input = sibling(child(div_14), 2);
      remove_input_defaults(input);
      reset(div_14);
      var div_15 = sibling(div_14, 2);
      var button_4 = child(div_15);
      var text_5 = only_child(button_4);
      var button_5 = sibling(button_4, 2);
      reset(div_15);
      reset(div_9);
      var div_16 = sibling(div_9, 2);
      var node_7 = child(div_16);
      {
        var consequent_7 = ($$anchor3) => {
          var div_17 = root_10();
          var node_8 = child(div_17);
          {
            var consequent_6 = ($$anchor4) => {
              var fragment_5 = comment();
              var node_9 = first_child(fragment_5);
              each(
                node_9,
                1,
                () => (get(selectedPlan), untrack(() => get(selectedPlan).modifications)),
                index,
                ($$anchor5, modification) => {
                  {
                    let $0 = derived_safe_equal(() => (get(selectedCluster), get(modification), untrack(() => get(selectedCluster).chunks.find((c) => c.filePath === get(modification).filePath)?.breadcrumbs || "")));
                    DiffCard($$anchor5, {
                      get modification() {
                        return get(modification);
                      },
                      get breadcrumbs() {
                        return get($0);
                      }
                    });
                  }
                }
              );
              append($$anchor4, fragment_5);
            };
            var alternate_5 = ($$anchor4) => {
              var div_18 = root_9();
              append($$anchor4, div_18);
            };
            if_block(node_8, ($$render) => {
              if (get(selectedPlan), untrack(() => get(selectedPlan)?.modifications && get(selectedPlan).modifications.length > 0)) $$render(consequent_6);
              else $$render(alternate_5, -1);
            });
          }
          reset(div_17);
          append($$anchor3, div_17);
        };
        var alternate_6 = ($$anchor3) => {
          var div_19 = root_11();
          var textarea = sibling(child(div_19), 2);
          remove_textarea_child(textarea);
          reset(div_19);
          bind_value(textarea, () => get(selectedPlan).canonicalNoteMarkdown, ($$value) => mutate(selectedPlan, get(selectedPlan).canonicalNoteMarkdown = $$value));
          append($$anchor3, div_19);
        };
        if_block(node_7, ($$render) => {
          if (get(activeTab) === "modifications") $$render(consequent_7);
          else $$render(alternate_6, -1);
        });
      }
      reset(div_16);
      var div_20 = sibling(div_16, 2);
      var button_6 = child(div_20);
      var button_7 = sibling(button_6, 4);
      reset(div_20);
      reset(div_8);
      template_effect(() => {
        set_class(button_4, 1, `tab-btn ${get(activeTab) === "modifications" ? "active" : ""}`, "svelte-71f0fw");
        set_text(text_5, `\u270F\uFE0F \u0417\u0430\u043C\u0435\u043D\u044B \u0432 \u0444\u0430\u0439\u043B\u0430\u0445 (${(get(selectedPlan), untrack(() => get(selectedPlan)?.modifications?.length || 0)) ?? ""})`);
        set_class(button_5, 1, `tab-btn ${get(activeTab) === "notePreview" ? "active" : ""}`, "svelte-71f0fw");
        button_7.disabled = (get(selectedPlan), untrack(() => !get(selectedPlan) || !get(selectedPlan).isDuplicate));
      });
      bind_value(input, () => get(selectedPlan).conceptTitle, ($$value) => mutate(selectedPlan, get(selectedPlan).conceptTitle = $$value));
      event("click", button_4, () => set(activeTab, "modifications"));
      event("click", button_5, () => set(activeTab, "notePreview"));
      event("click", button_6, () => onRejectCluster()(get(selectedCluster).id));
      event("click", button_7, handleApply);
      append($$anchor2, div_8);
    };
    if_block(node_4, ($$render) => {
      if (!get(selectedCluster)) $$render(consequent_3);
      else $$render(alternate_7, -1);
    });
  }
  reset(main);
  reset(div_3);
  reset(div);
  template_effect(() => {
    set_text(text2, `${(deep_read_state(clusters()), untrack(() => clusters().length)) ?? ""}
        ${(deep_read_state(clusters()), untrack(() => clusters().length === 1 ? "\u043A\u0430\u043D\u0434\u0438\u0434\u0430\u0442" : "\u043A\u0430\u043D\u0434\u0438\u0434\u0430\u0442\u043E\u0432")) ?? ""}`);
    button_2.disabled = get(historyCount) === 0;
    set_text(text_2, `\u21A9 \u041E\u0442\u043A\u0430\u0442 (${get(historyCount) ?? ""})`);
    set_text(text_3, (deep_read_state(clusters()), untrack(() => clusters().length)));
  });
  event("click", button_2, handleUndo);
  append($$anchor, div);
  pop();
}

// src/ui/RefactorView.ts
var VIEW_TYPE_REFACTOR = "semantic-gardener-review";
var RefactorView = class extends import_obsidian3.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
  }
  component = null;
  getViewType() {
    return VIEW_TYPE_REFACTOR;
  }
  getDisplayText() {
    return "Semantic Gardener";
  }
  getIcon() {
    return "sprout";
  }
  async onOpen() {
    const container = this.contentEl;
    container.empty();
    const props = {
      plugin: this.plugin,
      clusters: this.plugin.candidateClusters,
      plans: this.plugin.refactorPlans,
      isScanning: this.plugin.isScanning,
      scanProgress: this.plugin.scanProgress,
      onScanVault: async () => {
        await this.plugin.scanVault();
        this.updateProps();
      },
      onScanActiveNote: async () => {
        await this.plugin.scanActiveNote();
        this.updateProps();
      },
      onApplyPlan: async (cluster, plan) => {
        await this.plugin.applyRefactorPlan(cluster, plan);
        this.updateProps();
      },
      onRejectCluster: (clusterId) => {
        this.plugin.rejectCluster(clusterId);
        this.updateProps();
      },
      onUndoLast: async () => {
        await this.plugin.transactionManager.undoLast();
        this.updateProps();
      }
    };
    if (typeof mount === "function") {
      this.component = mount(ReviewModal, {
        target: container,
        props
      });
    } else {
      this.component = new ReviewModal({
        target: container,
        props
      });
    }
  }
  updateProps() {
    if (!this.component) return;
    const newProps = {
      clusters: [...this.plugin.candidateClusters],
      plans: { ...this.plugin.refactorPlans },
      isScanning: this.plugin.isScanning,
      scanProgress: this.plugin.scanProgress
    };
    if (typeof this.component.$set === "function") {
      this.component.$set(newProps);
    } else {
      Object.assign(this.component, newProps);
    }
  }
  async onClose() {
    if (this.component) {
      if (typeof unmount === "function") {
        unmount(this.component);
      } else if (typeof this.component.$destroy === "function") {
        this.component.$destroy();
      }
      this.component = null;
    }
  }
};

// node_modules/idb/build/index.js
var instanceOfAny = (object, constructors) => constructors.some((c) => object instanceof c);
var idbProxyableTypes;
var cursorAdvanceMethods;
function getIdbProxyableTypes() {
  return idbProxyableTypes || (idbProxyableTypes = [
    IDBDatabase,
    IDBObjectStore,
    IDBIndex,
    IDBCursor,
    IDBTransaction
  ]);
}
function getCursorAdvanceMethods() {
  return cursorAdvanceMethods || (cursorAdvanceMethods = [
    IDBCursor.prototype.advance,
    IDBCursor.prototype.continue,
    IDBCursor.prototype.continuePrimaryKey
  ]);
}
var transactionDoneMap = /* @__PURE__ */ new WeakMap();
var transformCache = /* @__PURE__ */ new WeakMap();
var reverseTransformCache = /* @__PURE__ */ new WeakMap();
function promisifyRequest(request) {
  const promise = new Promise((resolve, reject) => {
    const unlisten = () => {
      request.removeEventListener("success", success);
      request.removeEventListener("error", error);
    };
    const success = () => {
      resolve(wrap(request.result));
      unlisten();
    };
    const error = () => {
      reject(request.error);
      unlisten();
    };
    request.addEventListener("success", success);
    request.addEventListener("error", error);
  });
  reverseTransformCache.set(promise, request);
  return promise;
}
function cacheDonePromiseForTransaction(tx) {
  if (transactionDoneMap.has(tx))
    return;
  const done = new Promise((resolve, reject) => {
    const unlisten = () => {
      tx.removeEventListener("complete", complete);
      tx.removeEventListener("error", error);
      tx.removeEventListener("abort", error);
    };
    const complete = () => {
      resolve();
      unlisten();
    };
    const error = () => {
      reject(tx.error || new DOMException("AbortError", "AbortError"));
      unlisten();
    };
    tx.addEventListener("complete", complete);
    tx.addEventListener("error", error);
    tx.addEventListener("abort", error);
  });
  transactionDoneMap.set(tx, done);
}
var idbProxyTraps = {
  get(target, prop2, receiver) {
    if (target instanceof IDBTransaction) {
      if (prop2 === "done")
        return transactionDoneMap.get(target);
      if (prop2 === "store") {
        return receiver.objectStoreNames[1] ? void 0 : receiver.objectStore(receiver.objectStoreNames[0]);
      }
    }
    return wrap(target[prop2]);
  },
  set(target, prop2, value) {
    target[prop2] = value;
    return true;
  },
  has(target, prop2) {
    if (target instanceof IDBTransaction && (prop2 === "done" || prop2 === "store")) {
      return true;
    }
    return prop2 in target;
  }
};
function replaceTraps(callback) {
  idbProxyTraps = callback(idbProxyTraps);
}
function wrapFunction(func) {
  if (getCursorAdvanceMethods().includes(func)) {
    return function(...args) {
      func.apply(unwrap(this), args);
      return wrap(this.request);
    };
  }
  return function(...args) {
    return wrap(func.apply(unwrap(this), args));
  };
}
function transformCachableValue(value) {
  if (typeof value === "function")
    return wrapFunction(value);
  if (value instanceof IDBTransaction)
    cacheDonePromiseForTransaction(value);
  if (instanceOfAny(value, getIdbProxyableTypes()))
    return new Proxy(value, idbProxyTraps);
  return value;
}
function wrap(value) {
  if (value instanceof IDBRequest)
    return promisifyRequest(value);
  if (transformCache.has(value))
    return transformCache.get(value);
  const newValue = transformCachableValue(value);
  if (newValue !== value) {
    transformCache.set(value, newValue);
    reverseTransformCache.set(newValue, value);
  }
  return newValue;
}
var unwrap = (value) => reverseTransformCache.get(value);
function openDB(name, version, { blocked, upgrade, blocking, terminated } = {}) {
  const request = indexedDB.open(name, version);
  const openPromise = wrap(request);
  if (upgrade) {
    request.addEventListener("upgradeneeded", (event2) => {
      upgrade(wrap(request.result), event2.oldVersion, event2.newVersion, wrap(request.transaction), event2);
    });
  }
  if (blocked) {
    request.addEventListener("blocked", (event2) => blocked(
      // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
      event2.oldVersion,
      event2.newVersion,
      event2
    ));
  }
  openPromise.then((db) => {
    if (terminated)
      db.addEventListener("close", () => terminated());
    if (blocking) {
      db.addEventListener("versionchange", (event2) => blocking(event2.oldVersion, event2.newVersion, event2));
    }
  }).catch(() => {
  });
  return openPromise;
}
var readMethods = ["get", "getKey", "getAll", "getAllKeys", "count"];
var writeMethods = ["put", "add", "delete", "clear"];
var cachedMethods = /* @__PURE__ */ new Map();
function getMethod(target, prop2) {
  if (!(target instanceof IDBDatabase && !(prop2 in target) && typeof prop2 === "string")) {
    return;
  }
  if (cachedMethods.get(prop2))
    return cachedMethods.get(prop2);
  const targetFuncName = prop2.replace(/FromIndex$/, "");
  const useIndex = prop2 !== targetFuncName;
  const isWrite = writeMethods.includes(targetFuncName);
  if (
    // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
    !(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) || !(isWrite || readMethods.includes(targetFuncName))
  ) {
    return;
  }
  const method = async function(storeName, ...args) {
    const tx = this.transaction(storeName, isWrite ? "readwrite" : "readonly");
    let target2 = tx.store;
    if (useIndex)
      target2 = target2.index(args.shift());
    return (await Promise.all([
      target2[targetFuncName](...args),
      isWrite && tx.done
    ]))[0];
  };
  cachedMethods.set(prop2, method);
  return method;
}
replaceTraps((oldTraps) => ({
  ...oldTraps,
  get: (target, prop2, receiver) => getMethod(target, prop2) || oldTraps.get(target, prop2, receiver),
  has: (target, prop2) => !!getMethod(target, prop2) || oldTraps.has(target, prop2)
}));
var advanceMethodProps = ["continue", "continuePrimaryKey", "advance"];
var methodMap = {};
var advanceResults = /* @__PURE__ */ new WeakMap();
var ittrProxiedCursorToOriginalProxy = /* @__PURE__ */ new WeakMap();
var cursorIteratorTraps = {
  get(target, prop2) {
    if (!advanceMethodProps.includes(prop2))
      return target[prop2];
    let cachedFunc = methodMap[prop2];
    if (!cachedFunc) {
      cachedFunc = methodMap[prop2] = function(...args) {
        advanceResults.set(this, ittrProxiedCursorToOriginalProxy.get(this)[prop2](...args));
      };
    }
    return cachedFunc;
  }
};
async function* iterate(...args) {
  let cursor = this;
  if (!(cursor instanceof IDBCursor)) {
    cursor = await cursor.openCursor(...args);
  }
  if (!cursor)
    return;
  cursor = cursor;
  const proxiedCursor = new Proxy(cursor, cursorIteratorTraps);
  ittrProxiedCursorToOriginalProxy.set(proxiedCursor, cursor);
  reverseTransformCache.set(proxiedCursor, unwrap(cursor));
  while (cursor) {
    yield proxiedCursor;
    cursor = await (advanceResults.get(proxiedCursor) || cursor.continue());
    advanceResults.delete(proxiedCursor);
  }
}
function isIteratorProp(target, prop2) {
  return prop2 === Symbol.asyncIterator && instanceOfAny(target, [IDBIndex, IDBObjectStore, IDBCursor]) || prop2 === "iterate" && instanceOfAny(target, [IDBIndex, IDBObjectStore]);
}
replaceTraps((oldTraps) => ({
  ...oldTraps,
  get(target, prop2, receiver) {
    if (isIteratorProp(target, prop2))
      return iterate;
    return oldTraps.get(target, prop2, receiver);
  },
  has(target, prop2) {
    return isIteratorProp(target, prop2) || oldTraps.has(target, prop2);
  }
}));

// src/storage/indexed-db.ts
var DB_NAME = "semantic-gardener-db";
var DB_VERSION = 1;
var VectorStorage = class {
  dbPromise = null;
  async getDB() {
    if (!this.dbPromise) {
      this.dbPromise = openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains("chunks")) {
            const chunkStore = db.createObjectStore("chunks", { keyPath: "id" });
            chunkStore.createIndex("filePath", "filePath", { unique: false });
          }
          if (!db.objectStoreNames.contains("fileIndex")) {
            db.createObjectStore("fileIndex", { keyPath: "filePath" });
          }
        }
      });
    }
    return this.dbPromise;
  }
  async getChunk(id) {
    const db = await this.getDB();
    const record = await db.get("chunks", id);
    if (!record) return void 0;
    if (record.embedding && !(record.embedding instanceof Float32Array)) {
      record.embedding = new Float32Array(record.embedding);
    }
    return record;
  }
  async getChunks(ids) {
    const db = await this.getDB();
    const tx = db.transaction("chunks", "readonly");
    const store = tx.objectStore("chunks");
    const chunks = [];
    for (const id of ids) {
      const record = await store.get(id);
      if (record) {
        if (record.embedding && !(record.embedding instanceof Float32Array)) {
          record.embedding = new Float32Array(record.embedding);
        }
        chunks.push(record);
      }
    }
    await tx.done;
    return chunks;
  }
  async saveChunk(chunk) {
    const db = await this.getDB();
    const toStore = {
      ...chunk,
      lastUpdated: Date.now()
    };
    await db.put("chunks", toStore);
  }
  async saveChunks(chunks) {
    const db = await this.getDB();
    const tx = db.transaction("chunks", "readwrite");
    const store = tx.objectStore("chunks");
    const now = Date.now();
    for (const chunk of chunks) {
      const toStore = {
        ...chunk,
        lastUpdated: now
      };
      await store.put(toStore);
    }
    await tx.done;
  }
  async getAllChunksWithEmbeddings() {
    const db = await this.getDB();
    const all = await db.getAll("chunks");
    return all.filter((c) => c.embedding).map((c) => {
      if (!(c.embedding instanceof Float32Array)) {
        c.embedding = new Float32Array(c.embedding);
      }
      return c;
    });
  }
  async getFileChunks(filePath) {
    const db = await this.getDB();
    const index2 = db.transaction("chunks").store.index("filePath");
    const records = await index2.getAll(filePath);
    return records.map((c) => {
      if (c.embedding && !(c.embedding instanceof Float32Array)) {
        c.embedding = new Float32Array(c.embedding);
      }
      return c;
    });
  }
  async getFileIndex(filePath) {
    const db = await this.getDB();
    return await db.get("fileIndex", filePath);
  }
  async setFileIndex(filePath, chunkHashes, mtime) {
    const db = await this.getDB();
    const record = {
      filePath,
      chunkHashes,
      mtime,
      lastIndexed: Date.now()
    };
    await db.put("fileIndex", record);
  }
  async deleteFile(filePath) {
    const db = await this.getDB();
    const fileRecord = await this.getFileIndex(filePath);
    if (fileRecord && fileRecord.chunkHashes.length > 0) {
      const tx = db.transaction(["chunks", "fileIndex"], "readwrite");
      const chunkStore = tx.objectStore("chunks");
      for (const hash2 of fileRecord.chunkHashes) {
        await chunkStore.delete(hash2);
      }
      await tx.objectStore("fileIndex").delete(filePath);
      await tx.done;
    } else {
      await db.delete("fileIndex", filePath);
    }
  }
  async clearAll() {
    const db = await this.getDB();
    const tx = db.transaction(["chunks", "fileIndex"], "readwrite");
    await tx.objectStore("chunks").clear();
    await tx.objectStore("fileIndex").clear();
    await tx.done;
  }
  async close() {
    if (this.dbPromise) {
      const db = await this.dbPromise;
      db.close();
      this.dbPromise = null;
    }
  }
};

// src/storage/transaction-manager.ts
var import_obsidian4 = require("obsidian");
var TransactionManager = class {
  history = [];
  historyFilePath;
  app;
  pluginId;
  maxHistoryLength;
  constructor(app, pluginId = "obsidian-semantic-gardener", maxHistoryLength = 20) {
    this.app = app;
    this.pluginId = pluginId;
    this.maxHistoryLength = maxHistoryLength;
    this.historyFilePath = (0, import_obsidian4.normalizePath)(`.obsidian/plugins/${this.pluginId}/history.json`);
  }
  setMaxHistoryLength(max) {
    this.maxHistoryLength = max;
    this.trimHistory();
  }
  getHistory() {
    return [...this.history];
  }
  async init() {
    await this.loadHistory();
  }
  trimHistory() {
    if (this.history.length > this.maxHistoryLength) {
      this.history = this.history.slice(this.history.length - this.maxHistoryLength);
    }
  }
  async loadHistory() {
    try {
      const exists = await this.app.vault.adapter.exists(this.historyFilePath);
      if (exists) {
        const raw = await this.app.vault.adapter.read(this.historyFilePath);
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.history = parsed;
          this.trimHistory();
        }
      }
    } catch (e) {
      console.warn("Semantic Gardener: Failed to load history.json", e);
      this.history = [];
    }
  }
  async saveHistory() {
    try {
      const dir = (0, import_obsidian4.normalizePath)(`.obsidian/plugins/${this.pluginId}`);
      const dirExists = await this.app.vault.adapter.exists(dir);
      if (!dirExists) {
        await this.app.vault.adapter.mkdir(dir);
      }
      await this.app.vault.adapter.write(this.historyFilePath, JSON.stringify(this.history, null, 2));
    } catch (e) {
      console.error("Semantic Gardener: Failed to save history.json", e);
    }
  }
  async applyRefactor(conceptTitle, newNotePath, newNoteContent, mutations) {
    const activeMutations = mutations.filter((m) => m.mode !== "skip");
    const backups = [];
    for (const m of activeMutations) {
      if (!m.file) {
        const msg = `File not found for mutation in ${conceptTitle}`;
        new import_obsidian4.Notice(msg);
        return { success: false, error: msg };
      }
      const currentContent = await this.app.vault.read(m.file);
      if (!currentContent.includes(m.originalSpan)) {
        const msg = `\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438: \u0422\u0435\u043A\u0441\u0442 \u0432 \u0444\u0430\u0439\u043B\u0435 "${m.file.basename}" \u0431\u044B\u043B \u0438\u0437\u043C\u0435\u043D\u0435\u043D. \u041E\u043F\u0435\u0440\u0430\u0446\u0438\u044F \u043E\u0442\u043C\u0435\u043D\u0435\u043D\u0430.`;
        new import_obsidian4.Notice(msg);
        return { success: false, error: msg };
      }
      backups.push({
        path: m.file.path,
        content: currentContent
      });
    }
    const normalizedPath = (0, import_obsidian4.normalizePath)(newNotePath);
    const lastSlash = normalizedPath.lastIndexOf("/");
    if (lastSlash !== -1) {
      const parentFolder = normalizedPath.substring(0, lastSlash);
      const folderExists = await this.app.vault.adapter.exists(parentFolder);
      if (!folderExists) {
        await this.app.vault.createFolder(parentFolder);
      }
    }
    const existingFile = this.app.vault.getAbstractFileByPath(normalizedPath);
    if (existingFile) {
      const msg = `\u041E\u0448\u0438\u0431\u043A\u0430: \u0417\u0430\u043C\u0435\u0442\u043A\u0430 "${normalizedPath}" \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442. \u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0434\u0440\u0443\u0433\u043E\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435.`;
      new import_obsidian4.Notice(msg);
      return { success: false, error: msg };
    }
    try {
      await this.app.vault.create(normalizedPath, newNoteContent);
    } catch (err) {
      const msg = `\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u0437\u0430\u043C\u0435\u0442\u043A\u0443 "${normalizedPath}": ${err.message}`;
      new import_obsidian4.Notice(msg);
      return { success: false, error: msg };
    }
    for (const m of activeMutations) {
      try {
        await this.app.vault.process(m.file, (data) => {
          return data.replace(m.originalSpan, m.newSpan);
        });
      } catch (err) {
        const msg = `\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0438 \u0444\u0430\u0439\u043B\u0430 "${m.file.path}": ${err.message}`;
        new import_obsidian4.Notice(msg);
      }
    }
    const transaction = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      timestamp: Date.now(),
      conceptTitle,
      createdPath: normalizedPath,
      createdContent: newNoteContent,
      backups
    };
    this.history.push(transaction);
    this.trimHistory();
    await this.saveHistory();
    new import_obsidian4.Notice(`\u0420\u0435\u0444\u0430\u043A\u0442\u043E\u0440\u0438\u043D\u0433 "${conceptTitle}" \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043F\u0440\u0438\u043C\u0435\u043D\u0435\u043D!`);
    return { success: true, transaction };
  }
  async undoLast() {
    const lastTx = this.history.pop();
    if (!lastTx) {
      new import_obsidian4.Notice("\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0445 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439 \u0434\u043B\u044F \u043E\u0442\u043A\u0430\u0442\u0430.");
      return false;
    }
    let restoredCount = 0;
    for (const backup of lastTx.backups) {
      const file = this.app.vault.getAbstractFileByPath(backup.path);
      if (file instanceof import_obsidian4.TFile) {
        try {
          await this.app.vault.modify(file, backup.content);
          restoredCount++;
        } catch (e) {
          console.error(`Failed to restore file ${backup.path}`, e);
        }
      }
    }
    const createdFile = this.app.vault.getAbstractFileByPath(lastTx.createdPath);
    if (createdFile instanceof import_obsidian4.TFile) {
      try {
        await this.app.vault.trash(createdFile, false);
      } catch (e) {
        console.error(`Failed to trash file ${lastTx.createdPath}`, e);
      }
    }
    await this.saveHistory();
    new import_obsidian4.Notice(`\u041E\u0442\u043A\u0430\u0442 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D: \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E ${restoredCount} \u0444\u0430\u0439\u043B\u043E\u0432, \u0437\u0430\u043C\u0435\u0442\u043A\u0430 "${lastTx.conceptTitle}" \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0430 \u0432 \u043A\u043E\u0440\u0437\u0438\u043D\u0443.`);
    return true;
  }
};

// src/types/llm-schema.ts
var refactorEngineSchema = {
  type: "OBJECT",
  properties: {
    isDuplicate: {
      type: "BOOLEAN",
      description: "True only if the excerpts describe the exact same entity/concept in compatible domains. False if homonyms or cross-domain metaphors."
    },
    rejectionReason: {
      type: "STRING",
      description: "Brief explanation if isDuplicate is false (e.g., 'Different domains: CPU hardware bottleneck vs business workflow bottleneck')"
    },
    conceptTitle: {
      type: "STRING",
      description: 'Concise, canonical title for the new atomic note (no forbidden characters like : / \\ * ? " < > |)'
    },
    canonicalNoteMarkdown: {
      type: "STRING",
      description: "Comprehensive atomic note body in Markdown: definition, core mechanisms, formulas, and context."
    },
    modifications: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          filePath: {
            type: "STRING",
            description: "The path of the source file being modified"
          },
          originalSpan: {
            type: "STRING",
            description: "Exact substring from the original file to be replaced"
          },
          suggestedInlineSpan: {
            type: "STRING",
            description: "Micro-surgical replacement that strictly preserves the author's tone, punctuation, and voice, embedding [[conceptTitle]] or [[conceptTitle|alias]]"
          },
          transclusionSpan: {
            type: "STRING",
            description: "Transclusion replacement format ![[conceptTitle]]"
          }
        },
        required: ["filePath", "originalSpan", "suggestedInlineSpan", "transclusionSpan"]
      }
    }
  },
  required: ["isDuplicate"]
};

// src/ai/gemini-client.ts
var SYSTEM_INSTRUCTION = `\u0422\u044B \u2014 \u0441\u0442\u0440\u043E\u0433\u0438\u0439 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u043E\u0439 \u0431\u0430\u0437\u044B \u0437\u043D\u0430\u043D\u0438\u0439 Zettelkasten. \u0422\u0432\u043E\u044F \u0446\u0435\u043B\u044C \u2014 \u043A\u043E\u043D\u0441\u043E\u043B\u0438\u0434\u0430\u0446\u0438\u044F \u0434\u0443\u0431\u043B\u0438\u0440\u0443\u044E\u0449\u0438\u0445\u0441\u044F \u043A\u043E\u043D\u0446\u0435\u043F\u0446\u0438\u0439.

\u041A\u0420\u0418\u0422\u0415\u0420\u0418\u0419 \u0414\u0415\u0414\u0423\u041F\u041B\u0418\u041A\u0410\u0426\u0418\u0418 (Gatekeeper Mode):
\u041E\u0431\u044A\u0435\u0434\u0438\u043D\u044F\u0439 \u0422\u041E\u041B\u042C\u041A\u041E \u043A\u043E\u043D\u0446\u0435\u043F\u0446\u0438\u0438 \u0441 \u043E\u0434\u0438\u043D\u0430\u043A\u043E\u0432\u044B\u043C \u0444\u0438\u0437\u0438\u0447\u0435\u0441\u043A\u0438\u043C \u0438\u043B\u0438 \u0430\u0431\u0441\u0442\u0440\u0430\u043A\u0442\u043D\u044B\u043C \u0441\u043C\u044B\u0441\u043B\u043E\u043C.
- \u0417\u0410\u041F\u0420\u0415\u0429\u0415\u041D\u041E \u043E\u0431\u044A\u0435\u0434\u0438\u043D\u044F\u0442\u044C \u043E\u043C\u043E\u043D\u0438\u043C\u044B \u0438 \u043C\u0435\u0436\u0434\u043E\u043C\u0435\u043D\u043D\u044B\u0435 \u043C\u0435\u0442\u0430\u0444\u043E\u0440\u044B (\u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440, "\u0431\u0443\u0442\u044B\u043B\u043E\u0447\u043D\u043E\u0435 \u0433\u043E\u0440\u043B\u044B\u0448\u043A\u043E" \u0432 \u0430\u0440\u0445\u0438\u0442\u0435\u043A\u0442\u0443\u0440\u0435 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0440\u043E\u0432 \u0438 "\u0431\u0443\u0442\u044B\u043B\u043E\u0447\u043D\u043E\u0435 \u0433\u043E\u0440\u043B\u044B\u0448\u043A\u043E" \u0432 \u0431\u0438\u0437\u043D\u0435\u0441-\u043F\u0440\u043E\u0446\u0435\u0441\u0441\u0430\u0445 \u0441\u043A\u043B\u0430\u0434\u0430 \u2014 \u044D\u0442\u043E \u0420\u0410\u0417\u041D\u042B\u0415 \u0441\u0443\u0449\u043D\u043E\u0441\u0442\u0438 \u0438\u0437 \u0440\u0430\u0437\u043D\u044B\u0445 \u0434\u043E\u043C\u0435\u043D\u043E\u0432).
- \u041E\u0431\u0440\u0430\u0449\u0430\u0439 \u043F\u0440\u0438\u0441\u0442\u0430\u043B\u044C\u043D\u043E\u0435 \u0432\u043D\u0438\u043C\u0430\u043D\u0438\u0435 \u043D\u0430 Breadcrumbs [\u041F\u0443\u0442\u044C > \u0417\u0430\u0433\u043E\u043B\u043E\u0432\u043E\u043A > ...], \u0432 \u043A\u043E\u0442\u043E\u0440\u044B\u0445 \u043D\u0430\u0445\u043E\u0434\u044F\u0442\u0441\u044F \u0444\u0440\u0430\u0433\u043C\u0435\u043D\u0442\u044B.
- \u0415\u0441\u043B\u0438 \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442\u044B \u0444\u0440\u0430\u0433\u043C\u0435\u043D\u0442\u043E\u0432 \u043F\u0440\u0438\u043D\u0430\u0434\u043B\u0435\u0436\u0430\u0442 \u043D\u0435\u0441\u043E\u0432\u043C\u0435\u0441\u0442\u0438\u043C\u044B\u043C \u043E\u0431\u043B\u0430\u0441\u0442\u044F\u043C \u0437\u043D\u0430\u043D\u0438\u0439 \u0438\u043B\u0438 \u044D\u0442\u043E \u0441\u043E\u0432\u043F\u0430\u0434\u0435\u043D\u0438\u0435 \u043B\u0438\u0448\u044C \u043F\u043E \u0441\u043B\u043E\u0432\u0443, \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u0438 "isDuplicate": false \u0438 \u0443\u043A\u0430\u0436\u0438 \u043F\u043E\u043D\u044F\u0442\u043D\u0443\u044E "rejectionReason".

\u041F\u0420\u0410\u0412\u0418\u041B\u041E \u041C\u0418\u041A\u0420\u041E\u0425\u0418\u0420\u0423\u0420\u0413\u0418\u0418 \u0421\u0422\u0418\u041B\u042F (Surgical Span Replacer Mode):
- \u0415\u0441\u043B\u0438 isDuplicate: true:
  1. \u0421\u0444\u043E\u0440\u043C\u0443\u043B\u0438\u0440\u0443\u0439 \u0435\u043C\u043A\u043E\u0435 "conceptTitle" \u0434\u043B\u044F \u043D\u043E\u0432\u043E\u0439 \u0430\u0442\u043E\u043C\u0430\u0440\u043D\u043E\u0439 \u0437\u0430\u043C\u0435\u0442\u043A\u0438 (\u0431\u0435\u0437 \u043D\u0435\u0434\u043E\u043F\u0443\u0441\u0442\u0438\u043C\u044B\u0445 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432: / \\ * ? : " < > |).
  2. \u041D\u0430\u043F\u0438\u0448\u0438 "canonicalNoteMarkdown": \u043A\u0430\u0447\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0435, \u0441\u0430\u043C\u043E\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E\u0435 \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u043A\u043E\u043D\u0446\u0435\u043F\u0446\u0438\u0438, \u043A\u043B\u044E\u0447\u0435\u0432\u044B\u0435 \u0442\u0435\u0437\u0438\u0441\u044B \u0438\u043B\u0438 \u0444\u043E\u0440\u043C\u0443\u043B\u044B \u0432 Markdown.
  3. \u0414\u043B\u044F \u041A\u0410\u0416\u0414\u041E\u0413\u041E \u0444\u0440\u0430\u0433\u043C\u0435\u043D\u0442\u0430 \u043D\u0430\u0439\u0434\u0438 \u041C\u0418\u041D\u0418\u041C\u0410\u041B\u042C\u041D\u042B\u0419 \u0442\u043E\u0447\u043D\u044B\u0439 \u0441\u0435\u0433\u043C\u0435\u043D\u0442 \u0442\u0435\u043A\u0441\u0442\u0430 ("originalSpan"), \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u043D\u0435\u043F\u043E\u0441\u0440\u0435\u0434\u0441\u0442\u0432\u0435\u043D\u043D\u043E \u0432\u044B\u0440\u0430\u0436\u0430\u0435\u0442 \u0434\u0443\u0431\u043B\u0438\u0440\u0443\u0435\u043C\u043E\u0435 \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0438\u0435.
     \u0412\u041D\u0418\u041C\u0410\u041D\u0418\u0415: "originalSpan" \u0414\u041E\u041B\u0416\u0415\u041D \u0421\u0422\u0420\u041E\u0413\u041E, \u0421\u0418\u041C\u0412\u041E\u041B \u0412 \u0421\u0418\u041C\u0412\u041E\u041B, \u043F\u0440\u0438\u0441\u0443\u0442\u0441\u0442\u0432\u043E\u0432\u0430\u0442\u044C \u0432 \u0438\u0441\u0445\u043E\u0434\u043D\u043E\u043C \u0442\u0435\u043A\u0441\u0442\u0435 \u0444\u0440\u0430\u0433\u043C\u0435\u043D\u0442\u0430!
  4. \u0421\u043E\u0441\u0442\u0430\u0432\u044C "suggestedInlineSpan": \u043C\u0438\u043A\u0440\u043E\u0445\u0438\u0440\u0443\u0440\u0433\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u0437\u0430\u043C\u0435\u043D\u0430 \u043E\u0440\u0438\u0433\u0438\u043D\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u0441\u0435\u0433\u043C\u0435\u043D\u0442\u0430. \u0417\u0410\u041F\u0420\u0415\u0429\u0415\u041D\u041E \u043F\u0435\u0440\u0435\u043F\u0438\u0441\u044B\u0432\u0430\u0442\u044C \u0432\u0435\u0441\u044C \u0430\u0431\u0437\u0430\u0446! \u0421\u043E\u0445\u0440\u0430\u043D\u044F\u0439 \u0430\u0432\u0442\u043E\u0440\u0441\u043A\u0438\u0439 \u0441\u0438\u043D\u0442\u0430\u043A\u0441\u0438\u0441, \u043F\u0443\u043D\u043A\u0442\u0443\u0430\u0446\u0438\u044E, \u0441\u043B\u0435\u043D\u0433 \u0438 \u0433\u0440\u0430\u043C\u043C\u0430\u0442\u0438\u043A\u0443, \u0432\u0441\u0442\u0440\u0430\u0438\u0432\u0430\u044F [[conceptTitle]] \u0438\u043B\u0438 [[conceptTitle|\u0430\u043B\u0438\u0430\u0441]].
  5. \u0421\u043E\u0441\u0442\u0430\u0432\u044C "transclusionSpan": \u0430\u043B\u044C\u0442\u0435\u0440\u043D\u0430\u0442\u0438\u0432\u043D\u044B\u0439 \u0432\u0430\u0440\u0438\u0430\u043D\u0442 \u0437\u0430\u043C\u0435\u043D\u044B \u043D\u0430 \u0442\u0440\u0430\u043D\u0441\u043A\u043B\u044E\u0437\u0438\u044E \u0432\u0438\u0434\u0430 ![[conceptTitle]].`;
var GeminiClient = class {
  apiKey;
  model;
  constructor(apiKey, model = "gemini-3.5-flash-lite") {
    this.apiKey = apiKey;
    this.model = model;
  }
  setApiKey(key2) {
    this.apiKey = key2;
  }
  setModel(model) {
    this.model = model;
  }
  /**
   * Evaluates a candidate cluster through Gemini's Gatekeeper and Micro-Surgical pipeline.
   */
  async validateAndRefactorCluster(cluster) {
    if (!this.apiKey || this.apiKey.trim().length === 0) {
      throw new Error("API \u043A\u043B\u044E\u0447 Gemini \u043D\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D. \u0423\u043A\u0430\u0436\u0438\u0442\u0435 \u0432\u0430\u0448 Google AI Studio API-\u043A\u043B\u044E\u0447 \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445 \u043F\u043B\u0430\u0433\u0438\u043D\u0430.");
    }
    const clusterPromptPayload = cluster.chunks.map((chunk, idx) => {
      return `--- \u0424\u0420\u0410\u0413\u041C\u0415\u041D\u0422 #${idx + 1} ---
\u041A\u043E\u043D\u0442\u0435\u043A\u0441\u0442: ${chunk.breadcrumbs}
\u0424\u0430\u0439\u043B: ${chunk.filePath}
\u0422\u0435\u043A\u0441\u0442 \u0444\u0440\u0430\u0433\u043C\u0435\u043D\u0442\u0430:
${chunk.text}
`;
    }).join("\n\n");
    const promptText = `\u041F\u0440\u043E\u0430\u043D\u0430\u043B\u0438\u0437\u0438\u0440\u0443\u0439 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0435 ${cluster.chunks.length} \u0444\u0440\u0430\u0433\u043C\u0435\u043D\u0442\u0430(\u043E\u0432) \u0437\u0430\u043C\u0435\u0442\u043E\u043A, \u043D\u0430\u0439\u0434\u0435\u043D\u043D\u044B\u0445 \u043F\u043E \u0432\u044B\u0441\u043E\u043A\u043E\u043C\u0443 \u0441\u0445\u043E\u0434\u0441\u0442\u0432\u0443 \u0432\u0435\u043A\u0442\u043E\u0440\u0430 (\u0441\u0445\u043E\u0434\u0441\u0442\u0432\u043E: ${(cluster.similarity * 100).toFixed(1)}%):

${clusterPromptPayload}`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey.trim()}`;
    const requestBody = {
      system_instruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }]
      },
      contents: [
        {
          role: "user",
          parts: [{ text: promptText }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: refactorEngineSchema,
        temperature: 0.2
      }
    };
    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });
    } catch (netErr) {
      throw new Error(`\u0421\u0435\u0442\u0435\u0432\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0437\u0430\u043F\u0440\u043E\u0441\u0435 \u043A Gemini API: ${netErr.message}`);
    }
    if (!response.ok) {
      const errorText = await response.text();
      let parsedError = errorText;
      try {
        const errJson = JSON.parse(errorText);
        parsedError = errJson.error?.message || errorText;
      } catch {
      }
      throw new Error(`\u041E\u0448\u0438\u0431\u043A\u0430 Gemini API (${response.status}): ${parsedError}`);
    }
    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error("\u041F\u0443\u0441\u0442\u043E\u0439 \u043E\u0442\u0432\u0435\u0442 \u043E\u0442 Gemini API.");
    }
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      throw new Error(`\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0440\u0430\u0441\u043F\u0430\u0440\u0441\u0438\u0442\u044C JSON \u043E\u0442 \u043C\u043E\u0434\u0435\u043B\u0438: ${e.message}. \u0418\u0441\u0445\u043E\u0434\u043D\u044B\u0439 \u043E\u0442\u0432\u0435\u0442: ${rawText}`);
    }
    const modifications = [];
    if (parsed.isDuplicate && parsed.modifications && Array.isArray(parsed.modifications)) {
      for (const mod of parsed.modifications) {
        const chunk = cluster.chunks.find((c) => c.filePath === mod.filePath);
        let validOriginalSpan = mod.originalSpan;
        if (chunk && !chunk.text.includes(validOriginalSpan)) {
          const trimmed = validOriginalSpan.trim();
          if (chunk.text.includes(trimmed)) {
            validOriginalSpan = trimmed;
          }
        }
        modifications.push({
          filePath: mod.filePath,
          originalSpan: validOriginalSpan,
          suggestedInlineSpan: mod.suggestedInlineSpan,
          transclusionSpan: mod.transclusionSpan,
          selectedMode: "inline"
        });
      }
    }
    return {
      id: `plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      clusterId: cluster.id,
      isDuplicate: parsed.isDuplicate,
      rejectionReason: parsed.rejectionReason,
      conceptTitle: parsed.conceptTitle?.replace(/[:/\\*?"<>|]/g, "").trim(),
      canonicalNoteMarkdown: parsed.canonicalNoteMarkdown,
      modifications
    };
  }
};

// src/ai/worker-client.ts
var import_obsidian5 = require("obsidian");
var WorkerClient = class {
  worker = null;
  pendingRequests = /* @__PURE__ */ new Map();
  isReady = false;
  readyPromise = null;
  readyResolve = null;
  app;
  pluginId;
  constructor(app, pluginId = "obsidian-semantic-gardener") {
    this.app = app;
    this.pluginId = pluginId;
  }
  async init() {
    if (this.readyPromise) return this.readyPromise;
    this.readyPromise = new Promise((resolve, reject) => {
      this.readyResolve = resolve;
      try {
        this.spawnWorker();
      } catch (err) {
        reject(err);
      }
    });
    return this.readyPromise;
  }
  async spawnWorker() {
    try {
      const workerFilePath = `.obsidian/plugins/${this.pluginId}/worker.js`;
      let workerUrl;
      if (await this.app.vault.adapter.exists(workerFilePath)) {
        const workerCode = await this.app.vault.adapter.read(workerFilePath);
        const blob = new Blob([workerCode], { type: "application/javascript" });
        workerUrl = URL.createObjectURL(blob);
      } else {
        workerUrl = "worker.js";
      }
      this.worker = new Worker(workerUrl);
      this.worker.onmessage = (event2) => {
        this.handleWorkerMessage(event2.data);
      };
      this.worker.onerror = (err) => {
        console.error("Semantic Gardener: Web Worker error:", err);
        new import_obsidian5.Notice("Semantic Gardener: \u041E\u0448\u0438\u0431\u043A\u0430 Web Worker \u0432\u0435\u043A\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u0438.");
      };
      const initMsg = { type: "INIT" };
      this.worker.postMessage(initMsg);
    } catch (err) {
      console.error("Semantic Gardener: Failed to spawn Web Worker:", err);
      new import_obsidian5.Notice(`Semantic Gardener: \u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C \u0444\u043E\u043D\u043E\u0432\u044B\u0439 Web Worker: ${err.message}`);
      throw err;
    }
  }
  handleWorkerMessage(msg) {
    if (msg.type === "READY") {
      this.isReady = true;
      if (this.readyResolve) {
        this.readyResolve();
        this.readyResolve = null;
      }
      return;
    }
    if (msg.type === "EMBED_COMPLETE") {
      const pending2 = this.pendingRequests.get(msg.id);
      if (pending2) {
        this.pendingRequests.delete(msg.id);
        const map = /* @__PURE__ */ new Map();
        for (const res of msg.results) {
          map.set(res.id, res.embedding);
        }
        pending2.resolve(map);
      }
      return;
    }
    if (msg.type === "ERROR") {
      if (msg.id) {
        const pending2 = this.pendingRequests.get(msg.id);
        if (pending2) {
          this.pendingRequests.delete(msg.id);
          pending2.reject(new Error(msg.error));
        }
      } else {
        console.error("Semantic Gardener Worker general error:", msg.error);
      }
    }
  }
  /**
   * Generates embeddings in batches to keep UI responsive and report progress.
   */
  async embedBatch(items, batchSize = 8, onProgress) {
    await this.init();
    const overallResults = /* @__PURE__ */ new Map();
    const total = items.length;
    let completed = 0;
    for (let i = 0; i < items.length; i += batchSize) {
      const slice = items.slice(i, i + batchSize);
      const reqId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const batchMap = await new Promise((resolve, reject) => {
        this.pendingRequests.set(reqId, { resolve, reject });
        const msg = {
          type: "EMBED_BATCH",
          id: reqId,
          items: slice
        };
        this.worker.postMessage(msg);
      });
      for (const [id, emb] of batchMap.entries()) {
        overallResults.set(id, emb);
      }
      completed += slice.length;
      if (onProgress) {
        onProgress(Math.min(completed, total), total);
      }
    }
    return overallResults;
  }
  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isReady = false;
      this.readyPromise = null;
    }
  }
};

// src/core/parser.ts
function parseMarkdown(filePath, content) {
  const lines = content.split(/\r?\n/);
  const nodes = [];
  let inFrontmatter = false;
  let inCodeBlock = false;
  let codeFenceChar = "";
  let inHtmlComment = false;
  let currentBlockType = null;
  let currentBlockLines = [];
  let currentStartLine = 1;
  let currentLevel = void 0;
  function flushCurrentBlock(endLine) {
    if (!currentBlockType || currentBlockLines.length === 0) {
      currentBlockType = null;
      currentBlockLines = [];
      return;
    }
    const rawText = currentBlockLines.join("\n").trim();
    if (rawText.length > 0) {
      nodes.push({
        type: currentBlockType,
        level: currentLevel,
        text: rawText,
        startLine: currentStartLine,
        endLine: Math.max(currentStartLine, endLine)
      });
    }
    currentBlockType = null;
    currentBlockLines = [];
    currentLevel = void 0;
  }
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];
    const trimmed = line.trim();
    if (i === 0 && (trimmed === "---" || trimmed === "+++")) {
      inFrontmatter = true;
      continue;
    }
    if (inFrontmatter) {
      if (trimmed === "---" || trimmed === "+++") {
        inFrontmatter = false;
      }
      continue;
    }
    if (!inCodeBlock && trimmed.startsWith("<!--")) {
      inHtmlComment = true;
    }
    if (inHtmlComment) {
      if (trimmed.includes("-->")) {
        inHtmlComment = false;
      }
      continue;
    }
    const codeFenceMatch = trimmed.match(/^(`{3,}|~{3,})/);
    if (codeFenceMatch) {
      const fence = codeFenceMatch[1];
      if (!inCodeBlock) {
        flushCurrentBlock(lineNum - 1);
        inCodeBlock = true;
        codeFenceChar = fence[0];
        continue;
      } else if (fence.startsWith(codeFenceChar)) {
        inCodeBlock = false;
        codeFenceChar = "";
        continue;
      }
    }
    if (inCodeBlock) {
      continue;
    }
    if (trimmed.length === 0) {
      flushCurrentBlock(lineNum - 1);
      continue;
    }
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushCurrentBlock(lineNum - 1);
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();
      nodes.push({
        type: "heading",
        level,
        text: headingText,
        startLine: lineNum,
        endLine: lineNum
      });
      continue;
    }
    if (trimmed.startsWith(">")) {
      if (currentBlockType !== "blockquote") {
        flushCurrentBlock(lineNum - 1);
        currentBlockType = "blockquote";
        currentStartLine = lineNum;
      }
      currentBlockLines.push(line.replace(/^>\s?/, ""));
      continue;
    }
    const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
    if (listMatch) {
      if (currentBlockType !== "list_item" && currentBlockType !== "paragraph") {
        flushCurrentBlock(lineNum - 1);
        currentBlockType = "list_item";
        currentStartLine = lineNum;
      } else if (currentBlockType === null) {
        currentBlockType = "list_item";
        currentStartLine = lineNum;
      }
      currentBlockLines.push(line);
      continue;
    }
    if (currentBlockType === null) {
      currentBlockType = "paragraph";
      currentStartLine = lineNum;
    }
    currentBlockLines.push(line);
  }
  flushCurrentBlock(lines.length);
  return {
    filePath,
    nodes
  };
}

// src/core/hasher.ts
async function sha256(text2) {
  const enc = new TextEncoder();
  const data = enc.encode(text2);
  if (typeof crypto !== "undefined" && crypto.subtle && typeof crypto.subtle.digest === "function") {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  try {
    const nodeCrypto = await import("crypto");
    return nodeCrypto.createHash("sha256").update(text2).digest("hex");
  } catch {
    let h1 = 2166136261;
    let h2 = 16777619;
    for (let i = 0; i < text2.length; i++) {
      const ch = text2.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 16777619);
      h2 = Math.imul(h2 ^ ch >> 8, 16777619);
    }
    return (h1 >>> 0).toString(16).padStart(8, "0") + (h2 >>> 0).toString(16).padStart(8, "0");
  }
}

// src/core/chunker.ts
async function chunkMarkdown(filePath, content, options = {}) {
  const minLength = options.minChunkLength ?? 40;
  const parsed = parseMarkdown(filePath, content);
  const chunks = [];
  const headingStack = [];
  for (const node of parsed.nodes) {
    if (node.type === "heading") {
      const level = node.level || 1;
      while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) {
        headingStack.pop();
      }
      headingStack.push({ level, text: node.text });
      continue;
    }
    const cleanText = node.text.trim();
    if (cleanText.length < minLength) {
      continue;
    }
    const strippedLinks = cleanText.replace(/\[\[[^\]]+\]\]/g, "").replace(/https?:\/\/\S+/g, "").trim();
    if (strippedLinks.length < 15) {
      continue;
    }
    const breadcrumbSegments = [filePath, ...headingStack.map((h) => h.text)];
    const breadcrumbs = `[${breadcrumbSegments.join(" > ")}]`;
    const fullContext = `${breadcrumbs}
${cleanText}`;
    const hash2 = await sha256(cleanText);
    chunks.push({
      id: hash2,
      filePath,
      text: cleanText,
      breadcrumbs,
      fullContext,
      startLine: node.startLine,
      endLine: node.endLine
    });
  }
  return chunks;
}

// src/ai/vector-search.ts
function cosineSimilarity(a, b) {
  if (a.length !== b.length || a.length === 0) {
    return 0;
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const valA = a[i];
    const valB = b[i];
    dot += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }
  if (normA === 0 || normB === 0) {
    return 0;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
function findCandidateClusters(chunks, threshold = 0.82) {
  const validChunks = chunks.filter((c) => c.embedding && c.embedding.length > 0);
  if (validChunks.length < 2) {
    return [];
  }
  const adj = /* @__PURE__ */ new Map();
  for (let i = 0; i < validChunks.length; i++) {
    adj.set(i, /* @__PURE__ */ new Set());
  }
  const pairScores = /* @__PURE__ */ new Map();
  for (let i = 0; i < validChunks.length; i++) {
    const chunkA = validChunks[i];
    const embA = chunkA.embedding;
    for (let j = i + 1; j < validChunks.length; j++) {
      const chunkB = validChunks[j];
      if (chunkA.filePath === chunkB.filePath) {
        continue;
      }
      const sim = cosineSimilarity(embA, chunkB.embedding);
      if (sim >= threshold) {
        adj.get(i).add(j);
        adj.get(j).add(i);
        const pairKey = i < j ? `${i}_${j}` : `${j}_${i}`;
        pairScores.set(pairKey, sim);
      }
    }
  }
  const visited = /* @__PURE__ */ new Set();
  const rawClusters = [];
  for (let i = 0; i < validChunks.length; i++) {
    if (visited.has(i) || adj.get(i).size === 0) {
      continue;
    }
    const component2 = [];
    const queue = [i];
    visited.add(i);
    while (queue.length > 0) {
      const curr = queue.shift();
      component2.push(curr);
      for (const neighbor of adj.get(curr)) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    if (component2.length >= 2) {
      rawClusters.push(component2);
    }
  }
  const candidateClusters = rawClusters.map((indices, idx) => {
    const clusterChunks = indices.map((i) => validChunks[i]);
    let maxSim = 0;
    let sumSim = 0;
    let pairCount = 0;
    for (let a = 0; a < indices.length; a++) {
      for (let b = a + 1; b < indices.length; b++) {
        const i = indices[a];
        const j = indices[b];
        const pairKey = i < j ? `${i}_${j}` : `${j}_${i}`;
        const sim = pairScores.get(pairKey);
        if (sim !== void 0) {
          maxSim = Math.max(maxSim, sim);
          sumSim += sim;
          pairCount++;
        }
      }
    }
    const avgSim = pairCount > 0 ? sumSim / pairCount : maxSim;
    return {
      id: `cluster-${idx + 1}-${Date.now()}`,
      similarity: Number(avgSim.toFixed(4)),
      chunks: clusterChunks
    };
  });
  candidateClusters.sort((a, b) => b.similarity - a.similarity);
  return candidateClusters;
}
function findClustersForNote(notePath, chunks, threshold = 0.82) {
  const allClusters = findCandidateClusters(chunks, threshold);
  return allClusters.filter(
    (cluster) => cluster.chunks.some((chunk) => chunk.filePath === notePath)
  );
}

// src/utils/vault-mutator.ts
var import_obsidian6 = require("obsidian");
async function ensureFolderExists(app, folderPath) {
  const normalized = (0, import_obsidian6.normalizePath)(folderPath).trim();
  if (!normalized || normalized === "/" || normalized === ".") {
    return;
  }
  const parts = normalized.split("/").filter((p) => p.length > 0);
  let currentPath = "";
  for (const part of parts) {
    currentPath = currentPath ? `${currentPath}/${part}` : part;
    const exists = await app.vault.adapter.exists(currentPath);
    if (!exists) {
      try {
        await app.vault.createFolder(currentPath);
      } catch (err) {
        if (!err.message?.includes("already exists")) {
          throw err;
        }
      }
    }
  }
}
function getMarkdownFiles(app, excludedFolders = []) {
  const normalizedExcludes = excludedFolders.map((f) => (0, import_obsidian6.normalizePath)(f.trim())).filter((f) => f.length > 0);
  return app.vault.getMarkdownFiles().filter((file) => {
    const filePath = (0, import_obsidian6.normalizePath)(file.path);
    for (const excluded of normalizedExcludes) {
      if (filePath.startsWith(excluded)) {
        return false;
      }
    }
    return true;
  });
}
function sanitizeNoteTitle(title) {
  return title.replace(/[:/\\*?"<>|#^\[\]]/g, "").trim();
}

// src/main.ts
var SemanticGardenerPlugin = class extends import_obsidian7.Plugin {
  settings = DEFAULT_SETTINGS;
  vectorStorage;
  transactionManager;
  geminiClient;
  workerClient;
  candidateClusters = [];
  refactorPlans = {};
  isScanning = false;
  scanProgress = "";
  async onload() {
    await this.loadSettings();
    this.vectorStorage = new VectorStorage();
    this.transactionManager = new TransactionManager(this.app, this.manifest.id, this.settings.maxHistoryLength);
    await this.transactionManager.init();
    this.geminiClient = new GeminiClient(this.settings.geminiApiKey, this.settings.geminiModel);
    this.workerClient = new WorkerClient(this.app, this.manifest.id);
    this.registerView(
      VIEW_TYPE_REFACTOR,
      (leaf) => new RefactorView(leaf, this)
    );
    this.addRibbonIcon("sprout", "Semantic Gardener", () => {
      this.activateView();
    });
    this.addCommand({
      id: "scan-vault",
      name: "Scan vault for semantic duplicates",
      callback: () => this.scanVault()
    });
    this.addCommand({
      id: "scan-active-note",
      name: "Find duplicates for active note",
      callback: () => this.scanActiveNote()
    });
    this.addCommand({
      id: "open-review",
      name: "Open review view",
      callback: () => this.activateView()
    });
    this.addCommand({
      id: "undo-last",
      name: "Undo last refactor",
      callback: () => this.transactionManager.undoLast()
    });
    this.addSettingTab(new SemanticGardenerSettingTab(this.app, this));
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        if (file instanceof import_obsidian7.TFile) {
          this.vectorStorage.deleteFile(file.path);
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        if (file instanceof import_obsidian7.TFile) {
          this.vectorStorage.deleteFile(oldPath);
        }
      })
    );
  }
  onunload() {
    this.workerClient.terminate();
    this.vectorStorage.close();
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_REFACTOR)[0];
    if (!leaf) {
      const rightLeaf = workspace.getRightLeaf(false);
      if (rightLeaf) {
        leaf = rightLeaf;
        await leaf.setViewState({ type: VIEW_TYPE_REFACTOR, active: true });
      }
    }
    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }
  notifyViews() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_REFACTOR);
    for (const leaf of leaves) {
      if (leaf.view instanceof RefactorView) {
        leaf.view.updateProps();
      }
    }
  }
  /**
   * Scans all markdown notes in the vault, computes missing embeddings,
   * clusters duplicates, and runs Gatekeeper validation.
   */
  async scanVault() {
    if (this.isScanning) {
      new import_obsidian7.Notice("\u0421\u043A\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0443\u0436\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u044F\u0435\u0442\u0441\u044F...");
      return;
    }
    this.isScanning = true;
    this.scanProgress = "\u041F\u043E\u0438\u0441\u043A \u0437\u0430\u043C\u0435\u0442\u043E\u043A \u0432 vault...";
    this.notifyViews();
    await this.activateView();
    try {
      const excluded = this.settings.excludedFolders.split(",").map((s) => s.trim());
      const files = getMarkdownFiles(this.app, excluded);
      if (files.length === 0) {
        new import_obsidian7.Notice("\u0412 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E \u0437\u0430\u043C\u0435\u0442\u043E\u043A \u0434\u043B\u044F \u0430\u043D\u0430\u043B\u0438\u0437\u0430.");
        this.isScanning = false;
        this.notifyViews();
        return;
      }
      new import_obsidian7.Notice(`Semantic Gardener: \u041D\u0430\u0447\u0430\u043B\u043E \u0441\u043A\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F ${files.length} \u0437\u0430\u043C\u0435\u0442\u043E\u043A...`);
      const allChunks = [];
      const chunksNeedingEmbedding = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        this.scanProgress = `\u041D\u0430\u0440\u0435\u0437\u043A\u0430 AST (${i + 1}/${files.length}): ${file.basename}`;
        this.notifyViews();
        const content = await this.app.vault.read(file);
        const fileChunks = await chunkMarkdown(file.path, content, {
          minChunkLength: this.settings.minChunkLength
        });
        for (const chunk of fileChunks) {
          const cached = await this.vectorStorage.getChunk(chunk.id);
          if (cached && cached.embedding) {
            chunk.embedding = cached.embedding;
          } else {
            chunksNeedingEmbedding.push({ id: chunk.id, text: chunk.fullContext });
          }
          allChunks.push(chunk);
        }
      }
      if (chunksNeedingEmbedding.length > 0) {
        this.scanProgress = `\u0412\u0435\u043A\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F ${chunksNeedingEmbedding.length} \u0444\u0440\u0430\u0433\u043C\u0435\u043D\u0442\u043E\u0432...`;
        this.notifyViews();
        const embeddingMap = await this.workerClient.embedBatch(
          chunksNeedingEmbedding,
          8,
          (done, total) => {
            this.scanProgress = `\u0412\u0435\u043A\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F: ${done}/${total} \u0431\u043B\u043E\u043A\u043E\u0432 (${Math.round(done / total * 100)}%)`;
            this.notifyViews();
          }
        );
        const toSave = [];
        for (const chunk of allChunks) {
          if (!chunk.embedding && embeddingMap.has(chunk.id)) {
            chunk.embedding = embeddingMap.get(chunk.id);
            toSave.push(chunk);
          }
        }
        if (toSave.length > 0) {
          await this.vectorStorage.saveChunks(toSave);
        }
      }
      this.scanProgress = "\u041F\u043E\u0438\u0441\u043A \u0441\u0435\u043C\u0430\u043D\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0445 \u0434\u0443\u0431\u043B\u0438\u043A\u0430\u0442\u043E\u0432 \u0438 \u043A\u043B\u0430\u0441\u0442\u0435\u0440\u0438\u0437\u0430\u0446\u0438\u044F...";
      this.notifyViews();
      this.candidateClusters = findCandidateClusters(allChunks, this.settings.similarityThreshold);
      if (this.candidateClusters.length === 0) {
        new import_obsidian7.Notice("\u0421\u0435\u043C\u0430\u043D\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0445 \u0434\u0443\u0431\u043B\u0438\u043A\u0430\u0442\u043E\u0432 \u0441 \u0437\u0430\u0434\u0430\u043D\u043D\u044B\u043C \u043F\u043E\u0440\u043E\u0433\u043E\u043C \u0441\u0445\u043E\u0434\u0441\u0442\u0432\u0430 \u043D\u0435 \u043E\u0431\u043D\u0430\u0440\u0443\u0436\u0435\u043D\u043E.");
        this.isScanning = false;
        this.scanProgress = "";
        this.notifyViews();
        return;
      }
      new import_obsidian7.Notice(`\u041D\u0430\u0439\u0434\u0435\u043D\u043E ${this.candidateClusters.length} \u043A\u0430\u043D\u0434\u0438\u0434\u0430\u0442\u043E\u0432 \u043D\u0430 \u0440\u0435\u0444\u0430\u043A\u0442\u043E\u0440\u0438\u043D\u0433. \u0417\u0430\u043F\u0443\u0441\u043A LLM Gatekeeper...`);
      if (this.settings.geminiApiKey) {
        for (let i = 0; i < this.candidateClusters.length; i++) {
          const cluster = this.candidateClusters[i];
          this.scanProgress = `LLM Gatekeeper (${i + 1}/${this.candidateClusters.length}): \u0410\u043D\u0430\u043B\u0438\u0437 \u043A\u043B\u0430\u0441\u0442\u0435\u0440\u0430...`;
          this.notifyViews();
          try {
            const plan = await this.geminiClient.validateAndRefactorCluster(cluster);
            this.refactorPlans[cluster.id] = plan;
          } catch (aiErr) {
            console.error(`AI Analysis error for cluster ${cluster.id}:`, aiErr);
          }
        }
      } else {
        new import_obsidian7.Notice("\u0423\u043A\u0430\u0436\u0438\u0442\u0435 Gemini API-\u043A\u043B\u044E\u0447 \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445 \u0434\u043B\u044F \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u043E\u0439 \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0438 \u043C\u0438\u043A\u0440\u043E\u0445\u0438\u0440\u0443\u0440\u0433\u0438\u0447\u0435\u0441\u043A\u0438\u0445 \u0437\u0430\u043C\u0435\u043D.");
      }
      this.scanProgress = "";
      new import_obsidian7.Notice(`\u0421\u043A\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u043E! \u0414\u043E\u0441\u0442\u0443\u043F\u043D\u043E ${this.candidateClusters.length} \u043A\u043E\u043D\u0446\u0435\u043F\u0442\u043E\u0432 \u0434\u043B\u044F \u0440\u0435\u0432\u0438\u0437\u0438\u0438.`);
    } catch (err) {
      console.error("Semantic Gardener scan error:", err);
      new import_obsidian7.Notice(`\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043A\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0438: ${err.message}`);
    } finally {
      this.isScanning = false;
      this.notifyViews();
    }
  }
  /**
   * Scans specifically for duplicates of the currently opened active note.
   */
  async scanActiveNote() {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
      new import_obsidian7.Notice("\u041D\u0435\u0442 \u043E\u0442\u043A\u0440\u044B\u0442\u043E\u0439 \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0439 \u0437\u0430\u043C\u0435\u0442\u043A\u0438.");
      return;
    }
    this.isScanning = true;
    this.scanProgress = `\u0410\u043D\u0430\u043B\u0438\u0437 \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0439 \u0437\u0430\u043C\u0435\u0442\u043A\u0438: ${activeFile.basename}...`;
    this.notifyViews();
    await this.activateView();
    try {
      const activeContent = await this.app.vault.read(activeFile);
      const activeChunks = await chunkMarkdown(activeFile.path, activeContent, {
        minChunkLength: this.settings.minChunkLength
      });
      if (activeChunks.length === 0) {
        new import_obsidian7.Notice("\u0412 \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0439 \u0437\u0430\u043C\u0435\u0442\u043A\u0435 \u043D\u0435\u0442 \u043F\u043E\u0434\u0445\u043E\u0434\u044F\u0449\u0438\u0445 \u0442\u0435\u043A\u0441\u0442\u043E\u0432\u044B\u0445 \u0444\u0440\u0430\u0433\u043C\u0435\u043D\u0442\u043E\u0432.");
        this.isScanning = false;
        this.notifyViews();
        return;
      }
      const needingEmbedding = [];
      for (const chunk of activeChunks) {
        const cached = await this.vectorStorage.getChunk(chunk.id);
        if (cached && cached.embedding) {
          chunk.embedding = cached.embedding;
        } else {
          needingEmbedding.push({ id: chunk.id, text: chunk.fullContext });
        }
      }
      if (needingEmbedding.length > 0) {
        const map = await this.workerClient.embedBatch(needingEmbedding);
        const toSave = [];
        for (const chunk of activeChunks) {
          if (!chunk.embedding && map.has(chunk.id)) {
            chunk.embedding = map.get(chunk.id);
            toSave.push(chunk);
          }
        }
        await this.vectorStorage.saveChunks(toSave);
      }
      const allIndexed = await this.vectorStorage.getAllChunksWithEmbeddings();
      const combined = [...allIndexed];
      for (const ac of activeChunks) {
        if (!combined.some((c) => c.id === ac.id)) {
          combined.push(ac);
        }
      }
      this.candidateClusters = findClustersForNote(activeFile.path, combined, this.settings.similarityThreshold);
      if (this.candidateClusters.length === 0) {
        new import_obsidian7.Notice(`\u0414\u0443\u0431\u043B\u0438\u043A\u0430\u0442\u043E\u0432 \u0434\u043B\u044F \u0437\u0430\u043C\u0435\u0442\u043A\u0438 "${activeFile.basename}" \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E.`);
      } else {
        new import_obsidian7.Notice(`\u041D\u0430\u0439\u0434\u0435\u043D\u043E ${this.candidateClusters.length} \u0441\u043E\u0432\u043F\u0430\u0434\u0435\u043D\u0438\u0439 \u0434\u043B\u044F "${activeFile.basename}".`);
        if (this.settings.geminiApiKey) {
          for (const cluster of this.candidateClusters) {
            try {
              const plan = await this.geminiClient.validateAndRefactorCluster(cluster);
              this.refactorPlans[cluster.id] = plan;
            } catch (aiErr) {
              console.error("Active note AI error:", aiErr);
            }
          }
        }
      }
    } catch (err) {
      console.error("Active note scan error:", err);
      new import_obsidian7.Notice(`\u041E\u0448\u0438\u0431\u043A\u0430: ${err.message}`);
    } finally {
      this.isScanning = false;
      this.scanProgress = "";
      this.notifyViews();
    }
  }
  /**
   * Applies the approved refactor plan atomically with transaction snapshot.
   */
  async applyRefactorPlan(cluster, plan) {
    if (!plan.conceptTitle || plan.conceptTitle.trim().length === 0) {
      new import_obsidian7.Notice("\u0423\u043A\u0430\u0436\u0438\u0442\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043A\u0430\u043D\u043E\u043D\u0438\u0447\u0435\u0441\u043A\u043E\u0439 \u0437\u0430\u043C\u0435\u0442\u043A\u0438.");
      return;
    }
    const safeTitle = sanitizeNoteTitle(plan.conceptTitle);
    const targetFolder = (0, import_obsidian7.normalizePath)(this.settings.conceptsFolder || "Concepts");
    await ensureFolderExists(this.app, targetFolder);
    const newNotePath = `${targetFolder}/${safeTitle}.md`;
    const noteContent = plan.canonicalNoteMarkdown || `# ${safeTitle}

\u041E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u043A\u043E\u043D\u0446\u0435\u043F\u0446\u0438\u0438...`;
    const mutations = [];
    for (const mod of plan.modifications) {
      const file = this.app.vault.getAbstractFileByPath(mod.filePath);
      if (file instanceof import_obsidian7.TFile) {
        const newSpan = mod.selectedMode === "inline" ? mod.suggestedInlineSpan : mod.selectedMode === "transclusion" ? mod.transclusionSpan : mod.originalSpan;
        mutations.push({
          file,
          originalSpan: mod.originalSpan,
          newSpan,
          mode: mod.selectedMode
        });
      }
    }
    const res = await this.transactionManager.applyRefactor(
      safeTitle,
      newNotePath,
      noteContent,
      mutations
    );
    if (res.success) {
      this.candidateClusters = this.candidateClusters.filter((c) => c.id !== cluster.id);
      delete this.refactorPlans[cluster.id];
      this.notifyViews();
    }
  }
  rejectCluster(clusterId) {
    this.candidateClusters = this.candidateClusters.filter((c) => c.id !== clusterId);
    delete this.refactorPlans[clusterId];
    this.notifyViews();
    new import_obsidian7.Notice("\u041A\u043E\u043D\u0446\u0435\u043F\u0442 \u043E\u0442\u043A\u043B\u043E\u043D\u0435\u043D \u0438 \u0443\u0434\u0430\u043B\u0435\u043D \u0438\u0437 \u043E\u0447\u0435\u0440\u0435\u0434\u0438.");
  }
};
