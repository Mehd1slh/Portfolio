/*
 * switcher.js — dark/light theme + English/French language switch.
 * Plain JavaScript, no dependencies. Loaded after main.js and translations.js.
 *
 * Theme    : <html data-theme="dark|light">, saved in localStorage ("portfolio-theme").
 *            The initial value is applied by the inline <script> in <head>.
 * Language : elements tagged data-i18n="key" are swapped between their original
 *            English innerHTML (cached at load) and window.PORTFOLIO_I18N.fr[key].
 *            Saved in localStorage ("portfolio-lang"). First visit: browser language.
 */
(function () {
  "use strict";

  var root = document.documentElement;
  var I18N = window.PORTFOLIO_I18N || { fr: {}, ui: { en: {}, fr: {} } };
  var STORE = { theme: "portfolio-theme", lang: "portfolio-lang" };
  var LANGS = ["en", "fr"];

  function load(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }
  function save(key, val) {
    try {
      window.localStorage.setItem(key, val);
    } catch (e) {
      /* private mode: ignore */
    }
  }

  var controls = document.getElementById("site-controls");
  var themeBtn = document.getElementById("theme-toggle");
  var langGroup = controls ? controls.querySelector(".ctl-lang") : null;
  var langBtns = controls ? [].slice.call(controls.querySelectorAll("[data-set-lang]")) : [];
  var metaTheme = document.querySelector('meta[name="theme-color"]');

  var theme = root.getAttribute("data-theme") === "light" ? "light" : "dark";
  var lang = "en";

  /* ---------------------------------------------------------------- */
  /* Cache the English originals once                                  */
  /* ---------------------------------------------------------------- */
  var textNodes = [].slice.call(document.querySelectorAll("[data-i18n]"));
  var valueNodes = [].slice.call(document.querySelectorAll("[data-i18n-value]"));
  textNodes.forEach(function (el) {
    el.__en = el.innerHTML;
  });
  valueNodes.forEach(function (el) {
    el.__en = el.getAttribute("value");
  });

  function ui(key) {
    var table = (I18N.ui && I18N.ui[lang]) || {};
    return table[key] || ((I18N.ui && I18N.ui.en) || {})[key] || "";
  }

  /* ---------------------------------------------------------------- */
  /* Controls: labels / pressed state                                  */
  /* ---------------------------------------------------------------- */
  function refreshControls() {
    if (controls) controls.setAttribute("aria-label", ui("settings"));
    if (langGroup) langGroup.setAttribute("aria-label", ui("language"));
    langBtns.forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-set-lang") === lang ? "true" : "false");
    });
    if (themeBtn) {
      var label = theme === "dark" ? ui("toLight") : ui("toDark");
      themeBtn.setAttribute("aria-label", label);
      themeBtn.setAttribute("title", label);
    }
  }

  /* ---------------------------------------------------------------- */
  /* Theme                                                             */
  /* ---------------------------------------------------------------- */
  function applyTheme(next, animate) {
    theme = next === "light" ? "light" : "dark";
    if (animate) {
      root.classList.add("theme-anim");
      window.setTimeout(function () {
        root.classList.remove("theme-anim");
      }, 450);
    }
    root.setAttribute("data-theme", theme);
    if (metaTheme) metaTheme.setAttribute("content", theme === "light" ? "#eef1f5" : "#1b1f22");
    refreshControls();
  }

  /* ---------------------------------------------------------------- */
  /* Language                                                          */
  /* ---------------------------------------------------------------- */
  var warned = {};

  function applyLang(next) {
    lang = LANGS.indexOf(next) > -1 ? next : "en";
    var fr = I18N.fr || {};

    textNodes.forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (lang === "fr" && fr[key] != null) {
        el.innerHTML = fr[key];
      } else {
        if (lang === "fr" && !warned[key]) {
          warned[key] = true;
          if (window.console) console.warn("[i18n] missing French text for key:", key);
        }
        el.innerHTML = el.__en;
      }
    });

    valueNodes.forEach(function (el) {
      var key = el.getAttribute("data-i18n-value");
      el.setAttribute("value", lang === "fr" && fr[key] != null ? fr[key] : el.__en);
    });

    root.setAttribute("lang", lang);
    refreshControls();
  }

  function initialLang() {
    var saved = load(STORE.lang);
    if (LANGS.indexOf(saved) > -1) return saved;
    var nav = (navigator.languages && navigator.languages[0]) || navigator.language || "en";
    return String(nav).toLowerCase().indexOf("fr") === 0 ? "fr" : "en";
  }

  /* ---------------------------------------------------------------- */
  /* Events                                                            */
  /* ---------------------------------------------------------------- */
  if (controls) {
    controls.addEventListener("click", function (event) {
      // main.js closes the open article on ANY click that reaches <body>.
      event.stopPropagation();

      var langBtn = event.target.closest ? event.target.closest("[data-set-lang]") : null;
      if (langBtn) {
        var next = langBtn.getAttribute("data-set-lang");
        if (next !== lang) {
          applyLang(next);
          save(STORE.lang, next);
        }
        return;
      }
      if (event.target.closest && event.target.closest("#theme-toggle")) {
        var nextTheme = theme === "dark" ? "light" : "dark";
        applyTheme(nextTheme, true);
        save(STORE.theme, nextTheme);
      }
    });
  }

  /* ---------------------------------------------------------------- */
  /* Init                                                              */
  /* ---------------------------------------------------------------- */
  applyTheme(theme, false);
  var start = initialLang();
  if (start !== "en") applyLang(start);
  else refreshControls();
})();
