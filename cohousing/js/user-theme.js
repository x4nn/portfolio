// Derives the full page theme (background, text, borders, shadow, accent button color) from a
// single per-user "color" field stored in the database, instead of hand-picked per-role CSS.
// The swatch/tint colors (legend dots, calendar day highlights, checklist item backgrounds) use
// that same "color" value directly via CSS color-mix(), so they always match the theme automatically.

const THEME_WHITE_MIX_FRACTION_PAGE_BACKGROUND = 0.9;
const THEME_WHITE_MIX_FRACTION_SURFACE_STRONG = 0.85;
const THEME_WHITE_MIX_FRACTION_LINE = 0.8;
const THEME_BLACK_MIX_FRACTION_ACCENT = 0.35;
const THEME_BLACK_MIX_FRACTION_TEXT = 0.85;
const THEME_BLACK_MIX_FRACTION_TEXT_SOFT = 0.55;
const THEME_ACCENT_SOFT_ALPHA = 0.16;
const THEME_SHADOW_ALPHA = 0.16;

function hexColorToRgbChannels(hexColor) {
    const normalizedHex = String(hexColor || "").replace("#", "");
    const fullHex = normalizedHex.length === 3
        ? normalizedHex.split("").map((channel) => channel + channel).join("")
        : normalizedHex;

    return {
        redChannel: parseInt(fullHex.substring(0, 2), 16),
        greenChannel: parseInt(fullHex.substring(2, 4), 16),
        blueChannel: parseInt(fullHex.substring(4, 6), 16)
    };
}

function mixChannelToward(channelValue, targetChannelValue, mixFraction) {
    return Math.round(channelValue + (targetChannelValue - channelValue) * mixFraction);
}

function mixColorToward(hexColor, targetChannelValue, mixFraction) {
    const { redChannel, greenChannel, blueChannel } = hexColorToRgbChannels(hexColor);
    return {
        redChannel: mixChannelToward(redChannel, targetChannelValue, mixFraction),
        greenChannel: mixChannelToward(greenChannel, targetChannelValue, mixFraction),
        blueChannel: mixChannelToward(blueChannel, targetChannelValue, mixFraction)
    };
}

function rgbChannelsToRgbString({ redChannel, greenChannel, blueChannel }) {
    return `rgb(${redChannel}, ${greenChannel}, ${blueChannel})`;
}

function rgbChannelsToRgbaString({ redChannel, greenChannel, blueChannel }, alpha) {
    return `rgba(${redChannel}, ${greenChannel}, ${blueChannel}, ${alpha})`;
}

function buildRoleThemeFromColor(baseColor) {
    const accentChannels = mixColorToward(baseColor, 0, THEME_BLACK_MIX_FRACTION_ACCENT);

    return {
        pageBg: rgbChannelsToRgbString(mixColorToward(baseColor, 255, THEME_WHITE_MIX_FRACTION_PAGE_BACKGROUND)),
        surfaceStrong: rgbChannelsToRgbString(mixColorToward(baseColor, 255, THEME_WHITE_MIX_FRACTION_SURFACE_STRONG)),
        line: rgbChannelsToRgbString(mixColorToward(baseColor, 255, THEME_WHITE_MIX_FRACTION_LINE)),
        text: rgbChannelsToRgbString(mixColorToward(baseColor, 0, THEME_BLACK_MIX_FRACTION_TEXT)),
        textSoft: rgbChannelsToRgbString(mixColorToward(baseColor, 0, THEME_BLACK_MIX_FRACTION_TEXT_SOFT)),
        accent: rgbChannelsToRgbString(accentChannels),
        accentSoft: rgbChannelsToRgbaString(accentChannels, THEME_ACCENT_SOFT_ALPHA),
        shadow: `0 20px 45px ${rgbChannelsToRgbaString(accentChannels, THEME_SHADOW_ALPHA)}`
    };
}

function applyUserColorTheme(users, activeRoleKey) {
    const rootStyle = document.documentElement.style;

    (users || []).forEach((user) => {
        if (user?.color) {
            rootStyle.setProperty(`--${getRoleKeyFromUser(user)}-color`, user.color);
        }
    });

    const activeUser = (users || []).find((user) => getRoleKeyFromUser(user) === activeRoleKey);
    if (!activeUser?.color) {
        return;
    }

    const roleTheme = buildRoleThemeFromColor(activeUser.color);

    rootStyle.setProperty("--page-bg", roleTheme.pageBg);
    rootStyle.setProperty("--surface-strong", roleTheme.surfaceStrong);
    rootStyle.setProperty("--text", roleTheme.text);
    rootStyle.setProperty("--text-soft", roleTheme.textSoft);
    rootStyle.setProperty("--line", roleTheme.line);
    rootStyle.setProperty("--shadow", roleTheme.shadow);
    rootStyle.setProperty("--accent", roleTheme.accent);
    rootStyle.setProperty("--accent-soft", roleTheme.accentSoft);
}
