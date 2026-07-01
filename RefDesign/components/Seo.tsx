import { Helmet } from "react-helmet-async";
import {
  OG_DESCRIPTION,
  OG_IMAGE,
  SEO_DESCRIPTION,
  SEO_KEYWORDS,
  SEO_TITLE,
  SITE_NAME,
  SITE_URL,
  STRUCTURED_DATA,
  TWITTER_DESCRIPTION,
} from "@/lib/seo";

export default function Seo() {
  return (
    <Helmet prioritizeSeoTags>
      <html lang="en" />
      <title>{SEO_TITLE}</title>
      <meta name="description" content={SEO_DESCRIPTION} />
      <meta name="keywords" content={SEO_KEYWORDS} />
      <meta name="author" content="Roboticela" />
      <meta name="creator" content="Roboticela" />
      <meta name="publisher" content="Roboticela" />
      <meta name="copyright" content="Roboticela" />
      <meta
        name="robots"
        content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
      />
      <meta name="googlebot" content="index, follow" />
      <meta name="application-name" content={SITE_NAME} />
      <meta name="rating" content="general" />
      <meta name="referrer" content="strict-origin-when-cross-origin" />
      <link rel="canonical" href={`${SITE_URL}/`} />
      <link rel="alternate" hrefLang="en" href={`${SITE_URL}/`} />
      <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/`} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={SEO_TITLE} />
      <meta property="og:description" content={OG_DESCRIPTION} />
      <meta property="og:url" content={`${SITE_URL}/`} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:image" content={OG_IMAGE} />
      <meta property="og:image:alt" content={`${SITE_NAME} app icon`} />
      <meta property="og:image:width" content="128" />
      <meta property="og:image:height" content="128" />

      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={SEO_TITLE} />
      <meta name="twitter:description" content={TWITTER_DESCRIPTION} />
      <meta name="twitter:image" content={OG_IMAGE} />
      <meta name="twitter:image:alt" content={`${SITE_NAME} app icon`} />

      <meta name="theme-color" content="#000000" />
      <meta name="color-scheme" content="dark light" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content={SITE_NAME} />
      <meta
        name="apple-mobile-web-app-status-bar-style"
        content="black-translucent"
      />
      <meta name="format-detection" content="telephone=no" />

      <script type="application/ld+json">
        {JSON.stringify(STRUCTURED_DATA)}
      </script>
    </Helmet>
  );
}
