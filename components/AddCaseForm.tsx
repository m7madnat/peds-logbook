'use client';

import { useEffect, useRef, useState } from 'react';
import {
  DIAGNOSES,
  PROCEDURES,
  AIRWAY_TYPES,
  AIRWAY_DIFFICULTIES,
  ARTERIAL_SITES,
  CENTRAL_SITES,
  SERVICE_TYPES,
  ROLES,
  ASA_CLASSES,
  AGE_UNITS,
  AGE_CATEGORIES,
  COMPLICATION_CHIPS,
  LOCATIONS_DEFAULT,
  matchAgeCategory,
} from '@/lib/constants';
import type { AnesthesiaCase, CaseInput } from '@/lib/types';
import {
  Field,
  Select,
  SearchableSelect,
  type SearchableSelectHandle,
  TextInput,
  NumberInput,
  Toggle,
  SegmentedGroup,
  Button,
  Toast,
  Collapsible,
} from '@/components/ui';

import { useToast } from '@/lib/useToast';

const DRAFT_KEY = 'peds_logbook_add_case_draft_v1';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function emptyCase(): CaseInput {
  return {
    date: todayISO(),
    location: LOCATIONS_DEFAULT,
    service_type: 'Cardiac',
    patient_age_value: null,
    patient_age_unit: null,
    weight_kg: null,
    asa_class: null,
    diagnosis: null,
    procedure: null,
    airway_type: null,
    airway_difficulty: null,
    blade_type: null,
    blade_size: null,
    arterial_line: false,
    arterial_site: null,
    central_line: false,
    central_site: null,
    tee_used: false,
    cpb_used: false,
    cross_clamp_time_min: null,
    role: 'Assisted',
    complications: null,
    learning_point: null,
  };
}

interface DraftShape {
  form: CaseInput;
  diagnosisOther: string;
  procedureOther: string;
  complicationChips: string[];
  otherComplicationText: string;
}

// Typical defaults per pathway - tap once, confirm/adjust age+weight, save.
const TEMPLATES: Record<string, { ageCategory: string; overrides: Partial<CaseInput> }> = {
  Norwood: {
    ageCategory: 'neonate',
    overrides: {
      service_type: 'Cardiac',
      diagnosis: 'HLHS',
      procedure: 'Norwood',
      airway_type: 'ETT',
      airway_difficulty: 'Grade 2',
      arterial_line: true,
      arterial_site: 'Femoral',
      central_line: true,
      central_site: 'IJ',
      tee_used: true,
      cpb_used: true,
    },
  },
  Glenn: {
    ageCategory: 'infant',
    overrides: {
      service_type: 'Cardiac',
      diagnosis: 'HLHS',
      procedure: 'Glenn',
      airway_type: 'ETT',
      airway_difficulty: 'Easy',
      arterial_line: true,
      arterial_site: 'Radial',
      central_line: true,
      central_site: 'IJ',
      tee_used: true,
      cpb_used: true,
    },
  },
  Fontan: {
    ageCategory: 'child',
    overrides: {
      service_type: 'Cardiac',
      diagnosis: 'Fontan physiology',
      procedure: 'Fontan',
      airway_type: 'ETT',
      airway_difficulty: 'Easy',
      arterial_line: true,
      arterial_site: 'Radial',
      central_line: true,
      central_site: 'IJ',
      tee_used: true,
      cpb_used: true,
    },
  },
  'TOF repair': {
    ageCategory: 'infant',
    overrides: {
      service_type: 'Cardiac',
      diagnosis: 'TOF',
      procedure: 'TOF repair',
      airway_type: 'ETT',
      airway_difficulty: 'Easy',
      arterial_line: true,
      arterial_site: 'Radial',
      central_line: false,
      tee_used: true,
      cpb_used: true,
    },
  },
};

function SectionShell({
  step,
  title,
  defaultOpen,
  formKey,
  children,
}: {
  step: number;
  title: string;
  defaultOpen: boolean;
  formKey: number;
  children: React.ReactNode;
}) {
  return (
    <Collapsible key={`${title}-${formKey}`} title={title} step={step} defaultOpen={defaultOpen}>
      {children}
    </Collapsible>
  );
}

export default function AddCaseForm() {
  const [form, setForm] = useState<CaseInput>(emptyCase());
  const [diagnosisOther, setDiagnosisOther] = useState('');
  const [procedureOther, setProcedureOther] = useState('');
  const [complicationChips, setComplicationChips] = useState<string[]>([]);
  const [otherComplicationText, setOtherComplicationText] = useState('');
  const [showExactAge, setShowExactAge] = useState(false);
  const [showSessionDefaults, setShowSessionDefaults] = useState(false);
  const [saving, setSaving] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast, show } = useToast();
  const [formKey, setFormKey] = useState(0); // bump to remount + collapse sections after save

  const draftLoaded = useRef(false);
  const diagnosisRef = useRef<SearchableSelectHandle>(null);
  const procedureRef = useRef<SearchableSelectHandle>(null);
  const weightRef = useRef<HTMLInputElement>(null);
  const arterialSiteRef = useRef<HTMLSelectElement>(null);
  const centralSiteRef = useRef<HTMLSelectElement>(null);

  // Load a locally-saved draft once on mount, so a refresh mid-case doesn't
  // lose data. This never touches the backend - purely client-side.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as DraftShape;
        setForm(draft.form);
        setDiagnosisOther(draft.diagnosisOther ?? '');
        setProcedureOther(draft.procedureOther ?? '');
        setComplicationChips(draft.complicationChips ?? []);
        setOtherComplicationText(draft.otherComplicationText ?? '');
        if (draft.form.patient_age_value != null && !matchAgeCategory(draft.form.patient_age_value, draft.form.patient_age_unit)) {
          setShowExactAge(true);
        }
      }
    } catch {
      // Corrupt/unreadable draft - just start fresh.
    } finally {
      draftLoaded.current = true;
    }
  }, []);

  // Auto-save the draft (debounced) any time the form changes.
  useEffect(() => {
    if (!draftLoaded.current) return;
    const t = setTimeout(() => {
      const draft: DraftShape = { form, diagnosisOther, procedureOther, complicationChips, otherComplicationText };
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
        // Storage full/unavailable - non-fatal, just skip autosave this tick.
      }
    }, 300);
    return () => clearTimeout(t);
  }, [form, diagnosisOther, procedureOther, complicationChips, otherComplicationText]);

  function set<K extends keyof CaseInput>(key: K, value: CaseInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function focusSoon(ref: React.RefObject<HTMLElement>) {
    setTimeout(() => ref.current?.focus(), 30);
  }
  function openSoon(ref: React.RefObject<SearchableSelectHandle>) {
    setTimeout(() => ref.current?.open(), 30);
  }

  const activeAgeCategory = matchAgeCategory(form.patient_age_value, form.patient_age_unit);

  function pickAgeCategory(key: string) {
    const cat = AGE_CATEGORIES.find((c) => c.key === key);
    if (!cat) return;
    set('patient_age_value', cat.value);
    set('patient_age_unit', cat.unit);
    setShowExactAge(false);
    focusSoon(weightRef);
  }

  function toggleComplicationChip(chip: string) {
    if (chip === 'None') {
      setComplicationChips([]);
      setOtherComplicationText('');
      set('complications', 'None');
      return;
    }
    if (form.complications === 'None') set('complications', null);
    setComplicationChips((chips) => {
      const next = chips.includes(chip) ? chips.filter((c) => c !== chip) : [...chips, chip];
      const combined = [...next, otherComplicationText].filter(Boolean).join(', ');
      set('complications', combined || null);
      return next;
    });
  }

  function updateOtherComplication(text: string) {
    setOtherComplicationText(text);
    const combined = [...complicationChips, text].filter(Boolean).join(', ');
    set('complications', combined || null);
  }

  function applyTemplate(name: string) {
    const t = TEMPLATES[name];
    if (!t) return;
    const cat = AGE_CATEGORIES.find((c) => c.key === t.ageCategory)!;
    setForm((f) => ({
      ...f,
      ...t.overrides,
      patient_age_value: cat.value,
      patient_age_unit: cat.unit,
    }));
    setDiagnosisOther('');
    setProcedureOther('');
    setShowExactAge(false);
    show(`${name} template applied`);
    focusSoon(weightRef);
  }

  async function duplicateLastCase() {
    setDuplicating(true);
    setError(null);
    try {
      const res = await fetch('/api/cases');
      const data = await res.json();
      const last = (data.cases ?? [])[0] as AnesthesiaCase | undefined;
      if (!last) {
        setError('No previous case to duplicate yet.');
        return;
      }
      setForm({
        date: todayISO(),
        location: last.location,
        service_type: last.service_type,
        patient_age_value: last.patient_age_value,
        patient_age_unit: last.patient_age_unit,
        weight_kg: last.weight_kg,
        asa_class: last.asa_class,
        diagnosis: last.diagnosis,
        procedure: last.procedure,
        airway_type: last.airway_type,
        airway_difficulty: last.airway_difficulty,
        blade_type: last.blade_type,
        blade_size: last.blade_size,
        arterial_line: last.arterial_line,
        arterial_site: last.arterial_site,
        central_line: last.central_line,
        central_site: last.central_site,
        tee_used: last.tee_used,
        cpb_used: last.cpb_used,
        cross_clamp_time_min: last.cross_clamp_time_min,
        role: last.role,
        complications: null,
        learning_point: null,
      });
      setDiagnosisOther(!DIAGNOSES.includes(last.diagnosis as any) ? last.diagnosis ?? '' : '');
      setProcedureOther(!PROCEDURES.includes(last.procedure as any) ? last.procedure ?? '' : '');
      setComplicationChips([]);
      setOtherComplicationText('');
      if (!matchAgeCategory(last.patient_age_value, last.patient_age_unit)) setShowExactAge(true);
      show(`Duplicated case #${last.case_number} — outcome cleared`);
    } catch {
      setError('Could not load the last case. Check your connection and try again.');
    } finally {
      setDuplicating(false);
    }
  }

  function resetForNextCase() {
    setForm(emptyCase());
    setDiagnosisOther('');
    setProcedureOther('');
    setComplicationChips([]);
    setOtherComplicationText('');
    setShowExactAge(false);
    setFormKey((k) => k + 1); // remounts sections back to their default open/closed state
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      // non-fatal
    }
    setTimeout(() => diagnosisRef.current?.focus(), 50);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload: CaseInput = {
      ...form,
      diagnosis: form.diagnosis === 'Other' ? diagnosisOther || 'Other' : form.diagnosis,
      procedure: form.procedure === 'Other' ? procedureOther || 'Other' : form.procedure,
    };

    const res = await fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || 'Something went wrong saving this case.');
      return;
    }

    show('Case saved');
    resetForNextCase();
  }

  return (
    <>
      <Toast message={toast?.message ?? null} tone={toast?.tone} />
      <form id="add-case-form" onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pt-4 pb-32">
        {/* Speed bar */}
        <div className="rounded-xl2 border border-line bg-raised p-4 space-y-3 animate-fade-up">
          <div>
            <p className="field-label mb-2">Quick templates</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(TEMPLATES).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => applyTemplate(name)}
                  className="rounded-xl border border-line2 bg-raised2 px-3 py-3 text-sm font-semibold text-paper hover:border-mint/60 hover:text-mint active:scale-[0.98] transition-all"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="default"
            disabled={duplicating}
            loading={duplicating}
            onClick={duplicateLastCase}
            className="w-full"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="9" width="11" height="11" rx="2" stroke="#E9EEF3" strokeWidth="1.8" />
              <path d="M5 15V6a2 2 0 0 1 2-2h9" stroke="#E9EEF3" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            {duplicating ? 'Loading…' : 'Duplicate last case'}
          </Button>
        </div>

        {/* Session defaults - collapsed strip, rarely needs touching */}
        <div className="rounded-xl border border-line bg-surface/60">
          <button
            type="button"
            onClick={() => setShowSessionDefaults((s) => !s)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm"
          >
            <span className="text-muted">
              <span className="text-paper font-medium">{form.date}</span> · {form.service_type} ·{' '}
              {form.location} · {form.role}
            </span>
            <span className="text-mint text-xs font-semibold shrink-0 ml-2">
              {showSessionDefaults ? 'Done' : 'Edit'}
            </span>
          </button>
          {showSessionDefaults && (
            <div className="px-4 pb-4 space-y-3 border-t border-line pt-3 animate-fade-in">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date">
                  <TextInput type="date" value={form.date} onChange={(v) => set('date', v)} />
                </Field>
                <Field label="Location">
                  <TextInput value={form.location} onChange={(v) => set('location', v)} />
                </Field>
              </div>
              <Field label="Service type">
                <SegmentedGroup
                  value={form.service_type}
                  onChange={(v) => set('service_type', v as CaseInput['service_type'])}
                  options={SERVICE_TYPES}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Your role">
                  <Select value={form.role} onChange={(v) => set('role', v as CaseInput['role'])} options={ROLES} />
                </Field>
                <Field label="ASA class">
                  <Select
                    value={form.asa_class}
                    onChange={(v) => set('asa_class', v as CaseInput['asa_class'])}
                    options={ASA_CLASSES}
                    placeholder="Select"
                  />
                </Field>
              </div>
            </div>
          )}
        </div>

        {/* 1. Core case */}
        <SectionShell step={1} title="Core Case" defaultOpen formKey={formKey}>
          <Field label="Diagnosis">
            <SearchableSelect
              ref={diagnosisRef}
              value={form.diagnosis}
              onChange={(v) => {
                set('diagnosis', v as CaseInput['diagnosis']);
                if (v !== 'Other') openSoon(procedureRef);
              }}
              options={DIAGNOSES}
              placeholder="Search diagnosis…"
            />
            {form.diagnosis === 'Other' && (
              <TextInput value={diagnosisOther} onChange={setDiagnosisOther} placeholder="Describe diagnosis" />
            )}
          </Field>

          <Field label="Procedure">
            <SearchableSelect
              ref={procedureRef}
              value={form.procedure}
              onChange={(v) => set('procedure', v as CaseInput['procedure'])}
              options={PROCEDURES}
              placeholder="Search procedure…"
            />
            {form.procedure === 'Other' && (
              <TextInput value={procedureOther} onChange={setProcedureOther} placeholder="Describe procedure" />
            )}
          </Field>

          <Field label="Age">
            <div className="grid grid-cols-2 gap-2">
              {AGE_CATEGORIES.map((cat) => {
                const active = activeAgeCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => pickAgeCategory(cat.key)}
                    className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                      active ? 'bg-mint text-ink border-mint' : 'bg-surface text-paper border-line hover:border-line2'
                    }`}
                  >
                    <p className="text-sm font-semibold leading-none">{cat.label}</p>
                    <p className={`text-xs mt-1 ${active ? 'text-ink/70' : 'text-subtle'}`}>{cat.hint}</p>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setShowExactAge((s) => !s)}
              className="text-xs text-info font-medium mt-1"
            >
              {showExactAge ? 'Hide exact age' : 'Enter exact age instead'}
            </button>
            {showExactAge && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <NumberInput
                  value={form.patient_age_value}
                  onChange={(v) => set('patient_age_value', v)}
                  placeholder="e.g. 4"
                />
                <SegmentedGroup
                  value={form.patient_age_unit}
                  onChange={(v) => set('patient_age_unit', v as CaseInput['patient_age_unit'])}
                  options={AGE_UNITS}
                />
              </div>
            )}
          </Field>

          <Field label="Weight (kg) — optional">
            <NumberInput
              ref={weightRef}
              value={form.weight_kg}
              onChange={(v) => set('weight_kg', v)}
              placeholder="e.g. 16.5"
            />
          </Field>
        </SectionShell>

        {/* 2. Anesthesia */}
        <SectionShell step={2} title="Anesthesia" defaultOpen={false} formKey={formKey}>
          <Field label="Airway type">
            <SegmentedGroup
              value={form.airway_type}
              onChange={(v) => set('airway_type', v as CaseInput['airway_type'])}
              options={AIRWAY_TYPES}
            />
          </Field>
          <Field label="Airway difficulty">
            <SegmentedGroup
              value={form.airway_difficulty}
              onChange={(v) => set('airway_difficulty', v as CaseInput['airway_difficulty'])}
              options={AIRWAY_DIFFICULTIES}
            />
          </Field>

          <div className="h-px bg-line" />

          <Toggle checked={form.cpb_used} onChange={(v) => set('cpb_used', v)} label="CPB used" />

          <Toggle
            checked={form.arterial_line}
            onChange={(v) => {
              set('arterial_line', v);
              if (v) focusSoon(arterialSiteRef);
            }}
            label="Arterial line placed"
          />
          {form.arterial_line && (
            <Field label="Arterial site (optional)">
              <Select
                ref={arterialSiteRef}
                value={form.arterial_site}
                onChange={(v) => set('arterial_site', v as CaseInput['arterial_site'])}
                options={ARTERIAL_SITES}
                placeholder="Select"
              />
            </Field>
          )}

          <Toggle
            checked={form.central_line}
            onChange={(v) => {
              set('central_line', v);
              if (v) focusSoon(centralSiteRef);
            }}
            label="Central line placed"
          />
          {form.central_line && (
            <Field label="Central site (optional)">
              <Select
                ref={centralSiteRef}
                value={form.central_site}
                onChange={(v) => set('central_site', v as CaseInput['central_site'])}
                options={CENTRAL_SITES}
                placeholder="Select"
              />
            </Field>
          )}

          <Toggle checked={form.tee_used} onChange={(v) => set('tee_used', v)} label="TEE used" />
        </SectionShell>

        {/* 3. Outcome */}
        <SectionShell step={3} title="Outcome" defaultOpen={false} formKey={formKey}>
          <Field label="Complications">
            <div className="flex flex-wrap gap-2">
              {COMPLICATION_CHIPS.map((chip) => {
                const active =
                  chip === 'None' ? form.complications === 'None' : complicationChips.includes(chip);
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => toggleComplicationChip(chip)}
                    className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                      active ? 'bg-mint text-ink border-mint font-medium' : 'bg-surface text-paper border-line hover:border-line2'
                    }`}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>
            {complicationChips.includes('Other') && (
              <TextInput
                value={otherComplicationText}
                onChange={updateOtherComplication}
                placeholder="Describe the complication"
              />
            )}
          </Field>

          <Field label="Learning point" hint={`${(form.learning_point ?? '').length}/200 — optional`}>
            <textarea
              value={form.learning_point ?? ''}
              onChange={(e) => set('learning_point', e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="What will you remember from this case?"
              className="w-full rounded-xl bg-surface border border-line px-4 py-3.5 text-paper placeholder:text-subtle focus:border-mint focus:ring-1 focus:ring-mint/40 outline-none resize-none transition-colors"
            />
          </Field>
        </SectionShell>

        {error && (
          <p className="text-rose text-sm px-1" role="alert">
            {error}
          </p>
        )}
      </form>

      {/* Sticky save bar - always visible regardless of scroll or section state */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 md:left-20 z-30 border-t border-line bg-surface/95 backdrop-blur px-4 py-3">
        <Button
          type="submit"
          form="add-case-form"
          disabled={saving}
          loading={saving}
          size="lg"
          className="w-full shadow-raised mx-auto max-w-2xl block"
        >
          {saving ? 'Saving…' : 'Save Case'}
        </Button>
      </div>
    </>
  );
}
