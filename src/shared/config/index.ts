export {
  APPLE_SPLASH_SPECS,
  getAppleSplashStartupImages,
  getAppleSplashUrl,
} from './appleSplash';
export type { AppleSplashSpec } from './appleSplash';
export { isNavItemActive, navItems, writeHref } from './navItems';
export type { NavItem, NavItemId } from './navItems';
export {
  AUTH_GATE_COOKIE_NAME,
  AUTH_GATE_COOKIE_OPTIONS,
  getAuthGateReadyUserId,
  toAuthGateReadyValue,
} from './authGateCookie';
export {
  QUERY_PERSIST_BUSTER,
  QUERY_PERSIST_KEY,
  QUERY_PERSIST_MAX_AGE_MS,
} from './queryPersist';
export {
  contactEmail,
  defaultTitle,
  description,
  getArticleJsonLd,
  getBaseOpenGraph,
  getBreadcrumbJsonLd,
  getSiteUrl,
  getWebApplicationJsonLd,
  getWebSiteJsonLd,
  keywords,
  logoImage,
  ogImage,
  operatorName,
  siteName,
  titleTemplate,
} from './site';
export type { ArticleJsonLdInput, BreadcrumbJsonLdItem } from './site';
