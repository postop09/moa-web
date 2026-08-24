import { TERMS_OF_SERVICE } from '../config/termsOfService';
import { LegalDocument } from './LegalDocument';

export const TermsPage = () => {
  return <LegalDocument content={TERMS_OF_SERVICE} />;
};
