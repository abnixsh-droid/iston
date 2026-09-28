import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { BROCHURE_FILENAME, brochureDownloadUrl } from '../lib/brochure';
import { has } from '../lib/format';

// Starts the brochure download directly when one is available;
// otherwise links to the brochure page ("Coming Soon" + request form).
export default function BrochureButton({ className = '', children, icon = true }: { className?: string; children?: ReactNode; icon?: boolean }) {
  const { s } = useSettings();
  const content = (
    <>
      {icon && <Download className="h-4 w-4" />} {children ?? 'Download Brochure'}
    </>
  );
  if (!has(s.brochure_url)) {
    return (
      <Link to="/brochure" className={className}>
        {content}
      </Link>
    );
  }
  return (
    <a href={brochureDownloadUrl(s.brochure_url)} download={BROCHURE_FILENAME} className={className}>
      {content}
    </a>
  );
}
