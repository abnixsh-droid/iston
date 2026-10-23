import { useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Loader2,
  Trash2,
  ArrowRight,
  Eye,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { api, useApi, uploadFile, type Row } from '../lib/api';
import { useSettings } from '../contexts/SettingsContext';
import { useSeo } from '../lib/seo';

export default function HeroSectionAdmin() {
  useSeo('Hero Section Editor — Admin', 'Edit homepage hero banner text, background image, and call-to-actions.');

  const { s, reload } = useSettings();
  const projects = useApi<Row[]>('/api/content?type=projects');

  const [eyebrow, setEyebrow] = useState('');
  const [title1, setTitle1] = useState('');
  const [title2, setTitle2] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [ctaLink, setCtaLink] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [projectSlug, setProjectSlug] = useState('umroli');

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize values from settings
  useEffect(() => {
    setEyebrow(s.hero_eyebrow || 'Current Project · Umroli');
    setTitle1(s.hero_title_1 || 'Building Better Spaces.');
    setTitle2(s.hero_title_2 || 'Creating Better Futures.');
    setSubtitle(s.hero_subtitle || 'Iston Builder Group — builder & developer. Discover Umroli, our current project, along with flats and residential plots.');
    setCtaText(s.hero_cta_text || 'Explore Umroli');
    setCtaLink(s.hero_cta_link || '/projects/umroli');
    setImageUrl(s.hero_image_url || '/images/umroli-hero.jpg');
    setProjectSlug(s.hero_project_slug || 'umroli');
  }, [s]);

  // Handle uploading and replacing the old image
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Upload to Hostinger disk (and auto-delete old image if present)
      const uploadedUrl = await uploadFile(file, 'hero', imageUrl || undefined);

      // Replace old image with the new image
      setImageUrl(uploadedUrl);
      setSuccessMsg('New image selected & uploaded to Hostinger storage! Click "Save & Publish Changes" to make it live across all devices.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error uploading image.');
    } finally {
      setUploading(false);
    }
  };

  // Reset image back to default
  const handleResetImage = () => {
    setImageUrl('/images/umroli-hero.jpg');
    setSuccessMsg('Reset to default Umroli hero image. Save to apply.');
  };

  // Save changes to settings API so it updates cross-device
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload: Record<string, string> = {
        hero_eyebrow: eyebrow.trim(),
        hero_title_1: title1.trim(),
        hero_title_2: title2.trim(),
        hero_subtitle: subtitle.trim(),
        hero_cta_text: ctaText.trim(),
        hero_cta_link: ctaLink.trim(),
        hero_image_url: imageUrl.trim(),
        hero_project_slug: projectSlug.trim(),
      };

      await api('/api/settings', {
        method: 'PUT',
        auth: true,
        body: { settings: payload },
      });

      // Reload global settings context
      reload();
      setSuccessMsg('Hero section updated successfully! All changes are now live across all devices.');
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save hero section.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl pb-24 font-sans select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brass" /> Homepage Visuals &amp; Branding
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-navy font-bold mt-1">
            Hero Section Editor
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted">
            Modify the homepage hero image and banner text. Changes replace existing assets and reflect on all devices instantly.
          </p>
        </div>

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline btn-sm self-start sm:self-auto inline-flex items-center gap-1.5"
        >
          <ExternalLink className="w-3.5 h-3.5" /> View Live Homepage
        </a>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <span>{errorMsg}</span>
        </div>
      )}

      {/* LIVE INTERACTIVE HERO PREVIEW */}
      <section className="mb-8 rounded-3xl overflow-hidden border border-line shadow-2xl relative bg-navy-deep text-white min-h-[380px] sm:min-h-[440px] flex flex-col justify-end p-6 sm:p-10">
        <img
          key={imageUrl}
          src={imageUrl || '/images/umroli-hero.jpg'}
          alt="Hero Banner Preview"
          className="absolute inset-0 h-full w-full object-cover transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/65 to-navy-deep/25 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-deep/70 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] font-bold uppercase tracking-wider text-brass-light">
            {eyebrow || 'Current Project · Umroli'}
          </span>
          <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight">
            <span className="block text-white">{title1 || 'Building Better Spaces.'}</span>
            <span className="block text-brass-light italic">{title2 || 'Creating Better Futures.'}</span>
          </h2>
          <p className="text-xs sm:text-sm text-white/80 line-clamp-3 leading-relaxed">
            {subtitle || 'Iston Builder Group — builder & developer. Discover our premier residential towers, luxury flats, and NA plots.'}
          </p>
          <div className="pt-2 flex flex-wrap gap-2.5">
            <span className="px-4 py-2 rounded-xl bg-white text-navy font-bold text-xs uppercase tracking-wider shadow-sm flex items-center gap-1.5">
              {ctaText || 'Explore Umroli'} <ArrowRight className="w-3.5 h-3.5" />
            </span>
            <span className="px-4 py-2 rounded-xl bg-white/15 backdrop-blur-md text-white font-semibold text-xs border border-white/20">
              Enquire Now
            </span>
          </div>
        </div>

        <div className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white/90 text-[10px] font-bold uppercase tracking-widest border border-white/20 flex items-center gap-1.5">
          <Eye className="w-3 h-3 text-emerald-400" /> Live Visual Preview
        </div>
      </section>

      {/* EDITING FORMS */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* 1. Hero Image Replacement Card */}
        <div className="rounded-2xl border border-line bg-white p-5 md:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
            <div>
              <h3 className="font-bold text-navy text-base flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-brass" /> Homepage Hero Background Image
              </h3>
              <p className="text-xs text-muted mt-0.5">
                Upload a new image to completely replace the previous background image across all devices.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="btn btn-primary btn-sm flex items-center gap-1.5"
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {uploading ? 'Processing...' : 'Upload & Replace Image'}
              </button>
              <button
                type="button"
                onClick={handleResetImage}
                title="Reset to default image"
                className="btn btn-outline btn-sm text-xs"
              >
                Reset Default
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageFileChange}
          />

          <div className="grid sm:grid-cols-[1fr_2fr] gap-4 items-center">
            <div className="relative h-28 rounded-xl overflow-hidden border border-line shadow-xs">
              <img
                src={imageUrl || '/images/umroli-hero.jpg'}
                alt="Active Hero"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-bold">
                Active
              </span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy mb-1">Image Source URL or Path</label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="/images/umroli-hero.jpg"
                className="input font-mono text-xs"
              />
              <p className="text-[11px] text-muted mt-1">
                You can upload directly using the button above or paste any hosted image URL.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Hero Text & Headlines */}
        <div className="rounded-2xl border border-line bg-white p-5 md:p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-navy text-base pb-3 border-b border-line flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brass" /> Hero Headline &amp; Descriptions
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-navy mb-1">Eyebrow / Small Project Tag</label>
              <input
                type="text"
                value={eyebrow}
                onChange={(e) => setEyebrow(e.target.value)}
                placeholder="Current Project · Umroli"
                className="input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy mb-1">Linked Feature Project</label>
              <select
                value={projectSlug}
                onChange={(e) => setProjectSlug(e.target.value)}
                className="input text-sm"
              >
                <option value="umroli">Umroli Luxury Residential (umroli)</option>
                {(projects.data || [])
                  .filter((p) => p.slug !== 'umroli')
                  .map((p) => (
                    <option key={p.id} value={p.slug}>
                      {p.name} ({p.slug})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy mb-1">Main Heading (Line 1)</label>
              <input
                type="text"
                value={title1}
                onChange={(e) => setTitle1(e.target.value)}
                placeholder="Building Better Spaces."
                className="input text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy mb-1">Main Heading (Line 2 - Italic Accent)</label>
              <input
                type="text"
                value={title2}
                onChange={(e) => setTitle2(e.target.value)}
                placeholder="Creating Better Futures."
                className="input text-sm font-semibold text-brass"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-navy mb-1">Hero Subtitle &amp; Description</label>
              <textarea
                rows={3}
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Brief brand description shown beneath the headlines..."
                className="input text-sm"
              />
            </div>
          </div>
        </div>

        {/* 3. Primary Button CTA */}
        <div className="rounded-2xl border border-line bg-white p-5 md:p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-navy text-base pb-3 border-b border-line flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-brass" /> Primary Call-to-Action (CTA) Button
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-navy mb-1">Button Text</label>
              <input
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="e.g. Explore Umroli"
                className="input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy mb-1">Destination URL / Link</label>
              <input
                type="text"
                value={ctaLink}
                onChange={(e) => setCtaLink(e.target.value)}
                placeholder="e.g. /projects/umroli"
                className="input text-sm font-mono"
              />
            </div>
          </div>
        </div>

        {/* Fixed Save Bar */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 px-4 py-3 backdrop-blur lg:left-64 shadow-lg">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <span className="text-xs text-muted font-medium">
              {successMsg || errorMsg || 'Click save to publish updates to all devices.'}
            </span>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary btn-sm flex items-center gap-2 px-6 py-2.5 font-bold shadow-md"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {saving ? 'Publishing Changes...' : 'Save & Publish Hero Section'}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
