/*
  Supabase Table SQL:

  create table projects (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    full_name text not null,
    company_name text,
    idea text not null,
    stage text not null check (stage in ('idea', 'building', 'launched')),
    needs text[] not null,
    created_at timestamptz default now(),
    status text default 'pending' check (status in ('pending', 'in_progress', 'completed'))
  );
  alter table projects enable row level security;
  create policy "Users can insert own projects" on projects for insert with check (auth.uid() = user_id);
  create policy "Users can view own projects" on projects for select using (auth.uid() = user_id);
*/

import { useState } from 'react';
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    companyName: '',
    idea: '',
    stage: '',
    needs: [],
  });

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
      const { error: dbError } = await supabase.from('projects').insert({
        user_id: user?.id,
        full_name: form.fullName.trim(),
        company_name: form.companyName.trim() || null,
        idea: form.idea.trim(),
        stage: form.stage,
        needs: form.needs,
      });
      if (dbError) throw dbError;
      window.location.href = '/dashboard';
    } catch (e) {
      setError(e.message || 'Something went wrong');
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition';

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-lg border border-[#222] rounded-2xl p-8 bg-[#0f0f0f]">
        <ProgressBar currentStep={step} totalSteps={4} />

        {step === 0 && (
          <OnboardingStep title="Your Info" subtitle="Tell us a bit about yourself">
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
          <OnboardingStep title="Your Idea" subtitle="What are you building?">
            <div className="relative">
              <textarea
                className={`${inputClass} h-36 resize-none`}
                placeholder="Describe your startup idea *"
                maxLength={500}
                value={form.idea}
                onChange={(e) => update('idea', e.target.value)}
              />
              <span className="absolute bottom-3 right-3 text-xs text-gray-500">
                {form.idea.length}/500
              </span>
            </div>
          </OnboardingStep>
        )}

        {step === 2 && (
          <OnboardingStep title="Your Stage" subtitle="Where are you at?">
            {STAGES.map((s) => (
              <label
                key={s.value}
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition ${
                  form.stage === s.value
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-[#333] bg-[#111] hover:border-[#555]'
                }`}
              >
                <input
                  type="radio"
                  name="stage"
                  value={s.value}
                  checked={form.stage === s.value}
                  onChange={() => update('stage', s.value)}
                  className="accent-violet-500"
                />
                <div>
                  <div className="text-white font-medium">{s.label}</div>
                  <div className="text-gray-400 text-sm">{s.desc}</div>
                </div>
              </label>
            ))}
          </OnboardingStep>
        )}

        {step === 3 && (
          <OnboardingStep title="Your Needs" subtitle="What can we help with?">
            {NEEDS_OPTIONS.map((need) => (
              <label
                key={need}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  form.needs.includes(need)
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-[#333] bg-[#111] hover:border-[#555]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.needs.includes(need)}
                  onChange={() => toggleNeed(need)}
                  className="accent-violet-500"
                />
                <span className="text-white">{need}</span>
              </label>
            ))}
            <label className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-[#555] bg-[#111] cursor-pointer hover:border-violet-500 transition">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => selectAll(e.target.checked)}
                className="accent-violet-500"
              />
              <span className="text-violet-400 font-medium">All of the Above</span>
            </label>
          </OnboardingStep>
        )}

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

        <div className="flex justify-between mt-8">
          {step > 0 ? (
            <button
              onClick={back}
              className="px-5 py-2.5 rounded-lg border border-[#333] text-gray-300 hover:bg-[#1a1a1a] transition"
            >
              Back
            </button>
          ) : (
            <div />
          )}
          {step < 3 ? (
            <button
              onClick={next}
              className="px-6 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium transition"
            >
              Next
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting}
              className="px-6 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium transition disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
