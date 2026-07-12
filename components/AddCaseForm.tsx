'use client';

import { useEffect, useRef, useState } from 'react';
import {
  DIAGNOSES,
  PROCEDURES,
  AIRWAY_TYPES,
  AIRWAY_DIFFICULTIES,
  BLADE_TYPES,
  ARTERIAL_SITES,
  CENTRAL_SITES,
  LINE_SIDES,
  SERVICE_TYPES,
  ROLES,
  ASA_CLASSES,
  AGE_UNITS,
  AGE_CATEGORIES,
  LOCATIONS_DEFAULT,
  PHYSIOLOGIES,
  PREVIOUS_CARDIAC_SURGERY,
  ANESTHESIA_TYPES,
  REGIONAL_BLOCK_TYPES,
  SEPARATION_DIFFICULTIES,
  VASOACTIVE_MEDS,
  DESTINATIONS,
  EXTUBATION_STATUSES,
  ECMO_STATUSES,
  ECMO_TIMINGS,
  COMPLICATION_FLAGS,
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
  CheckboxGroup,
  Button,
  Toast,
  Collapsible,
} from '@/components/ui';
import { useToast } from '@/lib/useToast';

const DRAFT_KEY = 'peds_logbook_add_case_draft_v2';

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
    height_cm: null,
    gestational_age_weeks: null,
    asa_class: null,

    cyanotic: null,
    physiology: null,
    previous_cardiac_surgery: null,
    previous_cardiac_surgery_detail: null,

    diagnosis: null,
    associated_lesions: null,

    procedure: null,
    role: 'Assisted',

    anesthesia_type: 'General Anesthesia',
    regional_block_type: null,

    airway_type: null,
    airway_difficulty: null,
    blade_type: null,
    blade_size: null,
    intubation_attempts: null,
    video_laryngoscope_used: false,
    fiberoptic_used: false,

    tee_used: false,
    cerebral_nirs_used: false,
    renal_nirs_used: false,
    eeg_used: false,

    arterial_line: false,
    arterial_site: null,
    arterial_side: null,
    central_line: false,
    central_site: null,
    central_side: null,

    cpb_used: false,
    cpb_duration_min: null,
    cross_clamp_time_min: null,
    dhca_used: false,
    dhca_duration_min: null,
    selective_cerebral_perfusion_used: false,
    selective_cerebral_perfusion_duration_min: null,
    lowest_temperature_c: null,

    vasoactive_meds: [],

    separation_difficulty: null,
    separation_notes: null,

    destination: null,
    extubation_status: null,
    ecmo_status: 'No ECMO',
    ecmo_timing: null,

    complications: null,
    complication_flags: [],

    learning_point: null,
    anesthetic_challenges: null,
    key_learning_points: null,
    would_do_differently: null,
  };
}

interface DraftShape {
  form: CaseInput;
  diagnosisOther: string;
  procedureOther: string;
}

// Typical defaults per pathway - tap once, confirm/adjust age+weight, save.
const TEMPLATES: Record<string, { ageCategory: string; overrides: Partial<CaseInput> }> = {
  Norwood: {
    ageCategory: 'neonate',
    overrides: {
      service_type: 'Cardiac',
      diagnosis: 'HLHS',
      procedure: 'Norwood',
      physiology: 'Single ventricle',
      cyanotic: true,
      anesthesia_type: 'General Anesthesia',
      airway_type: 'ETT',
      airway_difficulty: 'Moderate',
      arterial_line: true,
      arterial_site: 'Femoral',
      central_line: true,
      central_site: 'Internal jugular',
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
      physiology: 'Single ventricle',
      cyanotic: true,
      previous_cardiac_surgery: 'Previous palliation',
      anesthesia_type: 'General Anesthesia',
      airway_type: 'ETT',
      airway_difficulty: 'Easy',
      arterial_line: true,
      arterial_site: 'Radial',
      central_line: true,
      central_site: 'Internal jugular',
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
      physiology: 'Single ventricle',
      cyanotic: true,
      previous_cardiac_surgery: 'Previous palliation',
      anesthesia_type: 'General Anesthesia',
      airway_type: 'ETT',
      airway_difficulty: 'Easy',
      arterial_line: true,
      arterial_site: 'Radial',
      central_line: true,
      central_site: 'Internal jugular',
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
      physiology: 'Biventricular',
      cyanotic: true,
      anesthesia_type: 'General Anesthesia',
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

function SubHeading({ children }: { children: React.ReactNode }) {
  return <p className="field-label pt-1">{children}</p>;
}

export default function AddCaseForm() {
  const [form, setForm] = useState<CaseInput>(emptyCase());
  const [diagnosisOther, setDiagnosisOther] = useState('');
  const [procedureOther, setProcedureOther] = useState('');
  const [previousSurgeryOther, setPreviousSurgeryOther] = useState('');
  const [complicationOther, setComplicationOther] = useState('');
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
        setForm({ ...emptyCase(), ...draft.form });
        setDiagnosisOther(draft.diagnosisOther ?? '');
        setProcedureOther(draft.procedureOther ?? '');
        if (
          draft.form.patient_age_value != null &&
          !matchAgeCategory(draft.form.patient_age_value, draft.form.patient_age_unit)
        ) {
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
      const draft: DraftShape = { form, diagnosisOther, procedureOther };
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
        // Storage full/unavailable - non-fatal, just skip autosave this tick.
      }
    }, 300);
    return () => clearTimeout(t);
  }, [form, diagnosisOther, procedureOther]);

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
      const { id, case_number, created_at, updated_at, ...rest } = last;
      setForm({
        ...rest,
        date: todayISO(),
        complications: null,
        complication_flags: [],
        separation_notes: null,
        learning_point: null,
        anesthetic_challenges: null,
        key_learning_points: null,
        would_do_differently: null,
      });
      setDiagnosisOther(!DIAGNOSES.includes(last.diagnosis as any) ? last.diagnosis ?? '' : '');
      setProcedureOther(!PROCEDURES.includes(last.procedure as any) ? last.procedure ?? '' : '');
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
    setPreviousSurgeryOther('');
    setComplicationOther('');
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
      previous_cardiac_surgery_detail:
        form.previous_cardiac_surgery === 'Other'
          ? previousSurgeryOther || form.previous_cardiac_surgery_detail
          : form.previous_cardiac_surgery_detail,
      complications:
        form.complication_flags.includes('Other') && complicationOther
          ? [form.complications, `Other: ${complicationOther}`].filter(Boolean).join(' — ')
          : form.complications,
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

  const showRegionalBlock = form.anesthesia_type !== 'General Anesthesia';
  const showEcmoTiming = form.ecmo_status !== 'No ECMO';

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
              <Field label="Your role">
                <Select value={form.role} onChange={(v) => set('role', v as CaseInput['role'])} options={ROLES} />
              </Field>
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

          <Field label="Associated lesions (optional)">
            <TextInput
              value={form.associated_lesions}
              onChange={(v) => set('associated_lesions', v)}
              placeholder="e.g. PDA, secundum ASD"
            />
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
                  columns={2}
                />
              </div>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Weight (kg)">
              <NumberInput
                ref={weightRef}
                value={form.weight_kg}
                onChange={(v) => set('weight_kg', v)}
                placeholder="e.g. 16.5"
              />
            </Field>
            <Field label="Height (cm) — optional">
              <NumberInput value={form.height_cm} onChange={(v) => set('height_cm', v)} placeholder="e.g. 100" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Gestational age (wk) — neonates">
              <NumberInput
                value={form.gestational_age_weeks}
                onChange={(v) => set('gestational_age_weeks', v)}
                placeholder="e.g. 38"
              />
            </Field>
            <Field label="ASA status">
              <Select
                value={form.asa_class}
                onChange={(v) => set('asa_class', v as CaseInput['asa_class'])}
                options={ASA_CLASSES}
                placeholder="Select"
              />
            </Field>
          </div>

          <SubHeading>Cardiac physiology</SubHeading>
          <Field label="Cyanotic">
            <SegmentedGroup
              value={form.cyanotic == null ? null : form.cyanotic ? 'Yes' : 'No'}
              onChange={(v) => set('cyanotic', v === 'Yes')}
              options={['Yes', 'No']}
              columns={2}
            />
          </Field>
          <Field label="Physiology">
            <SegmentedGroup
              value={form.physiology}
              onChange={(v) => set('physiology', v as CaseInput['physiology'])}
              options={PHYSIOLOGIES}
              columns={2}
            />
          </Field>
          <Field label="Previous cardiac surgery">
            <SegmentedGroup
              value={form.previous_cardiac_surgery}
              onChange={(v) => set('previous_cardiac_surgery', v as CaseInput['previous_cardiac_surgery'])}
              options={PREVIOUS_CARDIAC_SURGERY}
              columns={2}
            />
            {form.previous_cardiac_surgery === 'Other' && (
              <TextInput
                value={previousSurgeryOther}
                onChange={setPreviousSurgeryOther}
                placeholder="Describe prior surgery"
              />
            )}
          </Field>
        </SectionShell>

        {/* 2. Anesthesia */}
        <SectionShell step={2} title="Anesthesia" defaultOpen={false} formKey={formKey}>
          <Field label="Anesthesia type">
            <SegmentedGroup
              value={form.anesthesia_type}
              onChange={(v) => set('anesthesia_type', v as CaseInput['anesthesia_type'])}
              options={ANESTHESIA_TYPES}
              columns={3}
            />
          </Field>
          {showRegionalBlock && (
            <Field label="Regional block type">
              <Select
                value={form.regional_block_type}
                onChange={(v) => set('regional_block_type', v as CaseInput['regional_block_type'])}
                options={REGIONAL_BLOCK_TYPES}
                placeholder="Select"
              />
            </Field>
          )}

          <SubHeading>Airway</SubHeading>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Airway type">
              <SegmentedGroup
                value={form.airway_type}
                onChange={(v) => set('airway_type', v as CaseInput['airway_type'])}
                options={AIRWAY_TYPES}
              />
            </Field>
            <Field label="Difficulty">
              <SegmentedGroup
                value={form.airway_difficulty}
                onChange={(v) => set('airway_difficulty', v as CaseInput['airway_difficulty'])}
                options={AIRWAY_DIFFICULTIES}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Blade type">
              <Select
                value={form.blade_type}
                onChange={(v) => set('blade_type', v as CaseInput['blade_type'])}
                options={BLADE_TYPES}
                placeholder="Select"
              />
            </Field>
            <Field label="Blade size">
              <TextInput value={form.blade_size} onChange={(v) => set('blade_size', v)} placeholder='e.g. "1"' />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Intubation attempts">
              <NumberInput
                value={form.intubation_attempts}
                onChange={(v) => set('intubation_attempts', v)}
                placeholder="e.g. 1"
              />
            </Field>
            <div className="flex flex-col justify-end gap-2">
              <Toggle
                checked={form.video_laryngoscope_used}
                onChange={(v) => set('video_laryngoscope_used', v)}
                label="Video laryngoscope"
              />
            </div>
          </div>
          <Toggle checked={form.fiberoptic_used} onChange={(v) => set('fiberoptic_used', v)} label="Fiberoptic" />

          <SubHeading>Monitoring</SubHeading>
          <Toggle checked={form.tee_used} onChange={(v) => set('tee_used', v)} label="TEE used" />
          <Toggle
            checked={form.cerebral_nirs_used}
            onChange={(v) => set('cerebral_nirs_used', v)}
            label="Cerebral NIRS"
          />
          <Toggle checked={form.renal_nirs_used} onChange={(v) => set('renal_nirs_used', v)} label="Renal NIRS" />
          <Toggle checked={form.eeg_used} onChange={(v) => set('eeg_used', v)} label="EEG" />

          <SubHeading>Vascular access</SubHeading>
          <Toggle
            checked={form.arterial_line}
            onChange={(v) => {
              set('arterial_line', v);
              if (v) focusSoon(arterialSiteRef);
            }}
            label="Arterial line placed"
          />
          {form.arterial_line && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Site">
                <Select
                  ref={arterialSiteRef}
                  value={form.arterial_site}
                  onChange={(v) => set('arterial_site', v as CaseInput['arterial_site'])}
                  options={ARTERIAL_SITES}
                  placeholder="Select"
                />
              </Field>
              <Field label="Side">
                <SegmentedGroup
                  value={form.arterial_side}
                  onChange={(v) => set('arterial_side', v as CaseInput['arterial_side'])}
                  options={LINE_SIDES}
                  columns={2}
                />
              </Field>
            </div>
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
            <div className="grid grid-cols-2 gap-3">
              <Field label="Site">
                <Select
                  ref={centralSiteRef}
                  value={form.central_site}
                  onChange={(v) => set('central_site', v as CaseInput['central_site'])}
                  options={CENTRAL_SITES}
                  placeholder="Select"
                />
              </Field>
              <Field label="Side">
                <SegmentedGroup
                  value={form.central_side}
                  onChange={(v) => set('central_side', v as CaseInput['central_side'])}
                  options={LINE_SIDES}
                  columns={2}
                />
              </Field>
            </div>
          )}

          <SubHeading>Cardiopulmonary bypass</SubHeading>
          <Toggle checked={form.cpb_used} onChange={(v) => set('cpb_used', v)} label="CPB used" />
          {form.cpb_used && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="CPB duration (min)">
                  <NumberInput
                    value={form.cpb_duration_min}
                    onChange={(v) => set('cpb_duration_min', v)}
                    placeholder="e.g. 120"
                  />
                </Field>
                <Field label="Cross-clamp time (min)">
                  <NumberInput
                    value={form.cross_clamp_time_min}
                    onChange={(v) => set('cross_clamp_time_min', v)}
                    placeholder="e.g. 62"
                  />
                </Field>
              </div>
              <Field label="Lowest temperature (°C)">
                <NumberInput
                  value={form.lowest_temperature_c}
                  onChange={(v) => set('lowest_temperature_c', v)}
                  placeholder="e.g. 28"
                />
              </Field>
              <Toggle checked={form.dhca_used} onChange={(v) => set('dhca_used', v)} label="DHCA used" />
              {form.dhca_used && (
                <Field label="DHCA duration (min)">
                  <NumberInput
                    value={form.dhca_duration_min}
                    onChange={(v) => set('dhca_duration_min', v)}
                    placeholder="e.g. 20"
                  />
                </Field>
              )}
              <Toggle
                checked={form.selective_cerebral_perfusion_used}
                onChange={(v) => set('selective_cerebral_perfusion_used', v)}
                label="Selective cerebral perfusion"
              />
              {form.selective_cerebral_perfusion_used && (
                <Field label="Selective cerebral perfusion duration (min)">
                  <NumberInput
                    value={form.selective_cerebral_perfusion_duration_min}
                    onChange={(v) => set('selective_cerebral_perfusion_duration_min', v)}
                    placeholder="e.g. 15"
                  />
                </Field>
              )}

              <SubHeading>Separation from bypass</SubHeading>
              <Field label="Difficulty">
                <SegmentedGroup
                  value={form.separation_difficulty}
                  onChange={(v) => set('separation_difficulty', v as CaseInput['separation_difficulty'])}
                  options={SEPARATION_DIFFICULTIES}
                />
              </Field>
              <Field label="Notes (optional)">
                <TextInput
                  value={form.separation_notes}
                  onChange={(v) => set('separation_notes', v)}
                  placeholder="e.g. required 2nd bypass run for RV dysfunction"
                />
              </Field>
            </>
          )}

          <SubHeading>Vasoactive medications</SubHeading>
          <CheckboxGroup values={form.vasoactive_meds} onChange={(v) => set('vasoactive_meds', v)} options={VASOACTIVE_MEDS} />
        </SectionShell>

        {/* 3. Outcome */}
        <SectionShell step={3} title="Outcome" defaultOpen={false} formKey={formKey}>
          <SubHeading>Postoperative</SubHeading>
          <Field label="Destination">
            <SegmentedGroup
              value={form.destination}
              onChange={(v) => set('destination', v as CaseInput['destination'])}
              options={DESTINATIONS}
              columns={2}
            />
          </Field>
          <Field label="Extubation">
            <SegmentedGroup
              value={form.extubation_status}
              onChange={(v) => set('extubation_status', v as CaseInput['extubation_status'])}
              options={EXTUBATION_STATUSES}
              columns={2}
            />
          </Field>
          <Field label="ECMO">
            <SegmentedGroup
              value={form.ecmo_status}
              onChange={(v) => set('ecmo_status', v as CaseInput['ecmo_status'])}
              options={ECMO_STATUSES}
            />
          </Field>
          {showEcmoTiming && (
            <Field label="ECMO timing">
              <SegmentedGroup
                value={form.ecmo_timing}
                onChange={(v) => set('ecmo_timing', v as CaseInput['ecmo_timing'])}
                options={ECMO_TIMINGS}
                columns={2}
              />
            </Field>
          )}

          <SubHeading>Complications</SubHeading>
          <CheckboxGroup
            values={form.complication_flags}
            onChange={(v) => set('complication_flags', v)}
            options={COMPLICATION_FLAGS}
          />
          {form.complication_flags.includes('Other') && (
            <TextInput
              value={complicationOther}
              onChange={setComplicationOther}
              placeholder="Describe the complication"
            />
          )}
          <Field label="Additional notes (optional)">
            <TextInput
              value={form.complications}
              onChange={(v) => set('complications', v)}
              placeholder="Any other detail worth capturing"
            />
          </Field>

          <SubHeading>Case reflection</SubHeading>
          <Field label="Anesthetic challenges" hint={`${(form.anesthetic_challenges ?? '').length}/400`}>
            <textarea
              value={form.anesthetic_challenges ?? ''}
              onChange={(e) => set('anesthetic_challenges', e.target.value)}
              maxLength={400}
              rows={2}
              placeholder="What was hardest about this case?"
              className="w-full rounded-xl bg-surface border border-line px-4 py-3.5 text-paper placeholder:text-subtle focus:border-mint focus:ring-1 focus:ring-mint/40 outline-none resize-none transition-colors"
            />
          </Field>
          <Field label="Key learning points" hint={`${(form.key_learning_points ?? '').length}/400`}>
            <textarea
              value={form.key_learning_points ?? ''}
              onChange={(e) => set('key_learning_points', e.target.value)}
              maxLength={400}
              rows={2}
              placeholder="What will you remember from this case?"
              className="w-full rounded-xl bg-surface border border-line px-4 py-3.5 text-paper placeholder:text-subtle focus:border-mint focus:ring-1 focus:ring-mint/40 outline-none resize-none transition-colors"
            />
          </Field>
          <Field label="What would I do differently?" hint={`${(form.would_do_differently ?? '').length}/400`}>
            <textarea
              value={form.would_do_differently ?? ''}
              onChange={(e) => set('would_do_differently', e.target.value)}
              maxLength={400}
              rows={2}
              placeholder="Anything you'd change next time?"
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
