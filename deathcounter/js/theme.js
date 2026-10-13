// Light/dark theme. Colors live in deathcounter.css (:root and :root[data-theme="light"]);
// this file only decides which theme is active and remembers the choice.
// Loaded in <head> so the theme is set before the page paints (no flash).
(function () {
    'use strict';

    var THEME_STORAGE_KEY = 'deathcounter-theme';
    var THEME_LIGHT = 'light';
    var THEME_DARK = 'dark';
    var LIGHT_SCHEME_MEDIA_QUERY = '(prefers-color-scheme: light)';

    function readSavedTheme() {
        try {
            var savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
            return savedTheme === THEME_LIGHT || savedTheme === THEME_DARK ? savedTheme : null;
        } catch (storageError) {
            return null; // Storage blocked (e.g. private mode): fall back to the system preference.
        }
    }

    function saveTheme(theme) {
        try {
            window.localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch (storageError) {
            // Not saving is fine; the theme still applies for this visit.
        }
    }

    function detectSystemTheme() {
        var prefersLight = window.matchMedia && window.matchMedia(LIGHT_SCHEME_MEDIA_QUERY).matches;
        return prefersLight ? THEME_LIGHT : THEME_DARK;
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }

    function updateToggleButton(toggleButton, theme) {
        toggleButton.setAttribute('aria-checked', theme === THEME_DARK ? 'true' : 'false');
    }

    applyTheme(readSavedTheme() || detectSystemTheme());

    document.addEventListener('DOMContentLoaded', function () {
        var toggleButton = document.querySelector('[data-theme-toggle]');
        if (!toggleButton) {
            return; // Pages without a toggle (spelers.html) still follow the saved theme.
        }

        updateToggleButton(toggleButton, document.documentElement.getAttribute('data-theme'));

        toggleButton.addEventListener('click', function () {
            var currentTheme = document.documentElement.getAttribute('data-theme');
            var nextTheme = currentTheme === THEME_DARK ? THEME_LIGHT : THEME_DARK;
            applyTheme(nextTheme);
            saveTheme(nextTheme);
            updateToggleButton(toggleButton, nextTheme);
        });
    });
})();
