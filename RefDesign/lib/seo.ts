const DEFAULT_SITE_URL = "https://keyboard-simulator.roboticela.com";

export const SITE_URL = (
  import.meta.env.VITE_APP_URL || DEFAULT_SITE_URL
).replace(/\/$/, "");

export const SITE_NAME = "Keyboard Simulator";

export const SEO_TITLE =
  "Keyboard Simulator — Free 3D Virtual Keyboard & Typing Practice";

export const SEO_DESCRIPTION =
  "Free, open-source 3D keyboard simulator with realistic laptop models, live typing sync, themes, and a document editor. Practice typing, explore layouts, and test keyboard interactions online or on desktop.";

export const SEO_KEYWORDS =
  "keyboard simulator, virtual keyboard, 3D keyboard, typing practice, keyboard layouts, QWERTY, keyboard testing, interactive keyboard, typing tool, keyboard practice, laptop keyboard, Dell Latitude, HP EliteBook, Asus UX370UAR, Toshiba Portege, keyboard visualization, typing tutor, accessibility testing, Roboticela";

export const OG_DESCRIPTION =
  "Free, open-source 3D keyboard simulator with realistic laptop models, live typing sync, themes, and a document editor. Practice typing and explore keyboard layouts online.";

export const TWITTER_DESCRIPTION =
  "Free, open-source 3D keyboard simulator with realistic laptop models, live typing sync, themes, and a document editor.";

export const OG_IMAGE = `${SITE_URL}/apple-touch-icon.png`;

export const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      description: SEO_DESCRIPTION,
      inLanguage: "en-US",
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Roboticela",
      url: "https://roboticela.com",
      logo: {
        "@type": "ImageObject",
        url: OG_IMAGE,
      },
      sameAs: [
        "https://github.com/Roboticela",
        "https://github.com/Roboticela/Keyboard-Simulator",
      ],
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#app`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      description:
        "Interactive 3D keyboard simulator for typing practice, layout exploration, demonstrations, and accessibility testing.",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web, Windows, Linux, macOS, Android",
      browserRequirements: "Requires JavaScript. Requires HTML5.",
      softwareVersion: "1.0.0",
      isAccessibleForFree: true,
      image: OG_IMAGE,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      author: {
        "@id": `${SITE_URL}/#organization`,
      },
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
      license: "https://www.gnu.org/licenses/agpl-3.0.html",
      featureList: [
        "3D keyboard visualization",
        "Multiple laptop keyboard models",
        "Live physical keyboard sync",
        "Document editor with typing feedback",
        "Customizable themes",
        "Fullscreen mode",
        "Cross-platform desktop and web support",
      ],
    },
  ],
} as const;
