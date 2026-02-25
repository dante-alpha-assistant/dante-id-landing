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
  { value: 'idea', label: 'IDEA', desc: 'Just an idea in my head' },
  { value: 'building', label: 'BUILDING', desc: 'Actively developing' },
  { value: 'launched', label: 'LAUNCHED', desc: 'Already live' },
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

  // Returning users: skip Step 0 (profile), pre-fill from existing project
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
          setStep(1); // Skip to idea
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
    'w-full bg-[#0a0a0a] border border-[#1f521f] px-4 py-3 text-[#33ff00] placeholder-[#1a6b1a] focus:outline-none focus:border-[#33ff00] transition font-mono caret-[#33ff00]';

  const stepLabels = ['USER_INFO', 'PROJECT_IDEA', 'PROJECT_STAGE', 'REQUIREMENTS'];
  const displayStep = isReturning ? step : step + 1;
  const displayTotal = isReturning ? 3 : 4;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-lg border border-[#1f521f] p-8 bg-[#0f0f0f]">
        <div className="text-xs text-[#1a6b1a] mb-2">┌── STEP {displayStep}/{displayTotal}: {stepLabels[step]} ──┐</div>
        <ProgressBar currentStep={isReturning ? step - 1 : step} totalSteps={displayTotal} />

        {step === 0 && (
          <OnboardingStep title="Your Info" subtitle="Initialize operator profile">
            <input
              className={inputClass}
              placeholder="full_name *"
              value={form.fullName}
              onChange={(e) => update('fullName', e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="company_name (optional)"
              value={form.companyName}
              onChange={(e) => update('companyName', e.target.value)}
            />
          </OnboardingStep>
        )}

        {step === 1 && (
          <OnboardingStep title="Your Idea" subtitle="Describe what you're building">
            <div className="relative">
              <textarea
                className={`${inputClass} h-36 resize-none`}
                placeholder="describe_idea *"
                maxLength={500}
                value={form.idea}
                onChange={(e) => update('idea', e.target.value)}
              />
              <span className="absolute bottom-3 right-3 text-xs text-[#1a6b1a]">
                {form.idea.length}/500
              </span>
            </div>
          </OnboardingStep>
        )}

        {step === 2 && (
          <OnboardingStep title="Your Stage" subtitle="Select current project status">
            {STAGES.map((s) => (
              <label
                key={s.value}
                className={`flex items-center gap-3 p-4 border cursor-pointer transition font-mono ${
                  form.stage === s.value
                    ? 'border-[#33ff00] bg-[#33ff00]/10'
                    : 'border-[#1f521f] bg-[#0a0a0a] hover:border-[#22aa00]'
                }`}
              >
                <input
                  type="radio"
                  name="stage"
                  value={s.value}
                  checked={form.stage === s.value}
                  onChange={() => update('stage', s.value)}
                  className="accent-[#33ff00]"
                />
                <div>
                  <div className="text-[#33ff00] font-medium">[{s.label}]</div>
                  <div className="text-[#1a6b1a] text-sm">{s.desc}</div>
                </div>
              </label>
            ))}
          </OnboardingStep>
        )}

        {step === 3 && (
          <OnboardingStep title="Your Needs" subtitle="Select required modules">
            {NEEDS_OPTIONS.map((need) => (
              <label
                key={need}
                className={`flex items-center gap-3 p-3 border cursor-pointer transition font-mono ${
                  form.needs.includes(need)
                    ? 'border-[#33ff00] bg-[#33ff00]/10'
                    : 'border-[#1f521f] bg-[#0a0a0a] hover:border-[#22aa00]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.needs.includes(need)}
                  onChange={() => toggleNeed(need)}
                  className="accent-[#33ff00]"
                />
                <span className="text-[#33ff00]">{need}</span>
              </label>
            ))}
            <label className="flex items-center gap-3 p-3 border border-dashed border-[#1f521f] bg-[#0a0a0a] cursor-pointer hover:border-[#33ff00] transition font-mono">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => selectAll(e.target.checked)}
                className="accent-[#33ff00]"
              />
              <span className="text-[#33ff00] font-medium">[ SELECT ALL ]</span>
            </label>
          </OnboardingStep>
        )}

        {error && <p className="text-red-400 text-sm mt-4 font-mono">[ERROR] {error}</p>}

        <div className="flex justify-between mt-8">
          {step > 0 ? (
            <button
              onClick={back}
              className="px-5 py-2.5 border border-[#1f521f] text-[#22aa00] hover:bg-[#1a1a1a] transition font-mono"
            >
              [ ← BACK ]
            </button>
          ) : (
            <div />
          )}
          {step < 3 ? (
            <button
              onClick={next}
              className="px-6 py-2.5 border border-[#33ff00] text-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a] font-mono font-medium transition"
            >
              [ NEXT → ]
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting}
              className="px-6 py-2.5 border border-[#33ff00] text-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a] font-mono font-medium transition disabled:opacity-50"
            >
              {submitting ? '[INITIALIZING...]' : '[ INITIALIZE > ]'}
            </button>
          )}
        </div>
        <div className="text-xs text-[#1a6b1a] mt-4">└──────────────────┘</div>
      </div>
    </div>
  );
}
