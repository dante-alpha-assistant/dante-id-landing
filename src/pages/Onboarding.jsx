import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ProgressBar from '../components/ProgressBar';
import OnboardingStep from '../components/OnboardingStep';

const NEEDS_OPTIONS = [
  'Brand Identity',
  'Landing Page',
  'Business Plan',
  'Legal Docs',
  'Growth Strategy',
];

const STAGES = [
  { value: 'idea', label: 'Idea', desc: 'Just an idea in my head' },
  { value: 'building', label: 'Building', desc: 'Actively developing' },
  { value: 'launched', label: 'Launched', desc: 'Already live' },
];

export default function Onboarding() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [isReturning, setIsReturning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    companyName: '',
    idea: '',
    stage: '',
    needs: [],
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from('projects')
      .select('full_name, company_name')
      .eq('user_id', user.id)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setIsReturning(true);
          setForm(f => ({ ...f, fullName: data[0].full_name || '', companyName: data[0].company_name || '' }));
          setStep(1);
        }
      });
  }, [user]);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const toggleNeed = (need) => {
    setForm((f) => {
      const has = f.needs.includes(need);
      return { ...f, needs: has ? f.needs.filter((n) => n !== need) : [...f.needs, need] };
    });
  };

  const selectAll = (checked) => {
    setForm((f) => ({ ...f, needs: checked ? [...NEEDS_OPTIONS] : [] }));
  };

  const allSelected = NEEDS_OPTIONS.every((n) => form.needs.includes(n));

  const validate = () => {
    if (step === 0 && !form.fullName.trim()) return 'Full name is required';
    if (step === 1 && !form.idea.trim()) return 'Please describe your idea';
    if (step === 2 && !form.stage) return 'Please select a stage';
    if (step === 3 && form.needs.length === 0) return 'Please select at least one need';
    return '';
  };

  const next = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setStep((s) => s + 1);
  };

  const back = () => { setError(''); setStep((s) => s - 1); };

  const submit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setSubmitting(true);
    try {
      const { data: insertData, error: dbError } = await supabase.from('projects').insert({
        user_id: user?.id,
        full_name: form.fullName.trim(),
        company_name: form.companyName.trim() || null,
        idea: form.idea.trim(),
        stage: form.stage,
        needs: form.needs,
      }).select();
      if (dbError) throw dbError;
      if (insertData?.[0]?.id) {
        const { apiPost } = await import('../lib/api.js');
        apiPost('/api/generate', { project_id: insertData[0].id }).catch(() => {});
      }
      window.location.href = insertData?.[0]?.id ? `/dashboard/${insertData[0].id}` : '/dashboard';
    } catch (e) {
      setError(e.message || 'Something went wrong');
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-t-lg rounded-b-none border-b-2 border-md-border bg-md-surface-variant h-14 px-4 text-md-on-background placeholder-md-on-surface-variant/50 focus:outline-none focus:border-md-primary transition-colors font-sans';

  const stepLabels = ['Your Info', 'Your Idea', 'Your Stage', 'Requirements'];
  const displayStep = isReturning ? step : step + 1;
  const displayTotal = isReturning ? 3 : 4;

  return (
    <div className="min-h-screen bg-md-background flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-lg bg-md-surface-container rounded-md-lg p-8 shadow-sm">
        <div className="text-sm text-md-on-surface-variant mb-1">Step {displayStep} of {displayTotal}</div>
        <h2 className="text-xl font-bold text-md-on-background mb-4">{stepLabels[step]}</h2>
        <ProgressBar currentStep={isReturning ? step - 1 : step} totalSteps={displayTotal} />

        {step === 0 && (
          <OnboardingStep title="Your Info" subtitle="Let's get to know you">
            <input
              className={inputClass}
              placeholder="Full name *"
              value={form.fullName}
              onChange={(e) => update('fullName', e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Company name (optional)"
              value={form.companyName}
              onChange={(e) => update('companyName', e.target.value)}
            />
          </OnboardingStep>
        )}

        {step === 1 && (
          <OnboardingStep title="Your Idea" subtitle="Describe what you're building">
            <div className="relative">
              <textarea
                className={`${inputClass} h-36 resize-none rounded-b-none pt-4`}
                placeholder="Describe your idea *"
                maxLength={500}
                value={form.idea}
                onChange={(e) => update('idea', e.target.value)}
              />
              <span className="absolute bottom-3 right-3 text-xs text-md-on-surface-variant">
                {form.idea.length}/500
              </span>
            </div>
          </OnboardingStep>
        )}

        {step === 2 && (
          <OnboardingStep title="Your Stage" subtitle="Where are you in the journey?">
            {STAGES.map((s) => (
              <label
                key={s.value}
                className={`flex items-center gap-3 p-4 rounded-md-sm cursor-pointer transition-all duration-300 ease-md-standard ${
                  form.stage === s.value
                    ? 'bg-md-secondary-container border-2 border-md-primary'
                    : 'bg-md-surface-variant border-2 border-transparent hover:bg-md-secondary-container/50'
                }`}
              >
                <input
                  type="radio"
                  name="stage"
                  value={s.value}
                  checked={form.stage === s.value}
                  onChange={() => update('stage', s.value)}
                  className="accent-[#6750A4] w-4 h-4"
                />
                <div>
                  <div className="text-md-on-background font-medium">{s.label}</div>
                  <div className="text-md-on-surface-variant text-sm">{s.desc}</div>
                </div>
              </label>
            ))}
          </OnboardingStep>
        )}

        {step === 3 && (
          <OnboardingStep title="Your Needs" subtitle="What do you need help with?">
            {NEEDS_OPTIONS.map((need) => (
              <label
                key={need}
                className={`flex items-center gap-3 p-3.5 rounded-md-sm cursor-pointer transition-all duration-300 ease-md-standard ${
                  form.needs.includes(need)
                    ? 'bg-md-secondary-container border-2 border-md-primary'
                    : 'bg-md-surface-variant border-2 border-transparent hover:bg-md-secondary-container/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.needs.includes(need)}
                  onChange={() => toggleNeed(need)}
                  className="accent-[#6750A4] w-4 h-4"
                />
                <span className="text-md-on-background font-medium">{need}</span>
              </label>
            ))}
            <label className="flex items-center gap-3 p-3.5 rounded-md-sm border-2 border-dashed border-md-border bg-md-surface-variant cursor-pointer hover:border-md-primary transition-all duration-300 ease-md-standard">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => selectAll(e.target.checked)}
                className="accent-[#6750A4] w-4 h-4"
              />
              <span className="text-md-on-background font-medium">Select All</span>
            </label>
          </OnboardingStep>
        )}

        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

        <div className="flex justify-between mt-8">
          {step > 0 ? (
            <button
              onClick={back}
              className="rounded-full bg-md-surface-variant text-md-on-surface-variant px-6 py-2.5 font-medium hover:bg-md-secondary-container transition-all duration-300 ease-md-standard"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}
          {step < 3 ? (
            <button
              onClick={next}
              className="rounded-full bg-md-primary text-md-on-primary px-6 py-2.5 font-medium hover:shadow-md active:scale-95 transition-all duration-300 ease-md-standard"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting}
              className="rounded-full bg-md-primary text-md-on-primary px-6 py-2.5 font-medium hover:shadow-md active:scale-95 transition-all duration-300 ease-md-standard disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Project'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
