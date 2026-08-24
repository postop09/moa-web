import { PRIVACY_POLICY } from '../config/privacyPolicy';
import { LegalDocument } from './LegalDocument';

export const PrivacyPage = () => {
  return <LegalDocument content={PRIVACY_POLICY} />;
};
