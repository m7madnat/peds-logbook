'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SERVICE_TYPES,
  AGE_UNITS,
  ASA_CLASSES,
  DIAGNOSES,
  PROCEDURES,
  AIRWAY_TYPES,
  AIRWAY_DIFFICULTIES,
  BLADE_TYPES,
  ARTERIAL_SITES,
  CENTRAL_SITES,
  LINE_SIDES,
  ROLES,
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
} from '@/lib/constants';
import type { AnesthesiaCase, CaseInput } from '@/lib/types';
import {
  Field,
  Select,
  TextInput,
  NumberInput,
  Toggle,
  SegmentedGroup,
  CheckboxGroup,
  Button,
  Card,
  CardHeader,
  CardContent,
  ConfirmDialog,
  Toast,
} from '@/components/ui';
import { useToast } from '@/lib/useToast';

/**
 * Edit-case form. Case creation lives entirely in AddCaseForm.tsx, which is
 * optimized for speed during a live case; this form is for reviewing and
 * correcting a case already logged, so it shows every field up front and
 * redirects back to the list on save rather than resetting in place.
 */
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <p className="text-sm font-semibold tracking-tight">{title}</p>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <p className="field-label pt-1">{children}</p>;
}

export default function CaseForm({ initial, caseId }: { initial: AnesthesiaCase; caseId: string }) {
  const router = useRouter();
  const [form, setForm] = useState<CaseInput>(initial);
  const [diagnosisOther, setDiagnosisOther] = useState(
    !DIAGNOSES.includes(initial.diagnosis as any) ? initial.diagnosis ?? '' : ''
  );
  const [procedureOther, setProcedureOther] = useState(
    !PROCEDURES.includes(initial.procedure as any) ? initial.procedure ?? '' : ''
  );
  const [previousSurgeryOther, setPreviousSurgeryOther] = useState(initial.previous_cardiac_surgery_detail ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast, show } = useToast();

  function set<K extends keyof CaseInput>(key: K, value: CaseInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
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
    };

    const res = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      setSaving(false);
      const body = await res.json().catch(() => ({}));
      setError(body.error || 'Something went wrong saving this case.');
      return;
    }

    show('Case updated');
    router.push('/cases');
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/cases/${caseId}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/cases');
      router.refresh();
    } else {
      setDeleting(false);
      setConfirmOpen(false);
      setError('Could not delete this case. Try again.');
    }
  }

  const showRegionalBlock = form.anesthesia_type !== 'General Anesthesia';
  const showEcmoTiming = form.ecmo_status !== 'No ECMO';

  return (
    <>
      <Toast message={toast?.message ?? null} tone={toast?.tone} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pt-4 pb-8">
        <SectionCard title="Core details">
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

          <Field label="Diagnosis (primary)">
            <Select
              value={form.diagnosis}
              onChange={(v) => set('diagnosis', v as CaseInput['diagnosis'])}
              options={DIAGNOSES}
              placeholder="Select diagnosis"
            />
            {form.diagnosis === 'Other' && (
              <TextInput value={diagnosisOther} onChange={setDiagnosisOther} placeholder="Describe diagnosis" />
            )}
          </Field>
          <Field label="Associated lesions">
            <TextInput
              value={form.associated_lesions}
              onChange={(v) => set('associated_lesions', v)}
              placeholder="e.g. PDA, secundum ASD"
            />
          </Field>

          <Field label="Procedure">
            <Select
              value={form.procedure}
              onChange={(v) => set('procedure', v as CaseInput['procedure'])}
              options={PROCEDURES}
              placeholder="Select procedure"
            />
            {form.procedure === 'Other' && (
              <TextInput value={procedureOther} onChange={setProcedureOther} placeholder="Describe procedure" />
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Age">
              <NumberInput value={form.patient_age_value} onChange={(v) => set('patient_age_value', v)} placeholder="e.g. 4" />
            </Field>
            <Field label="Age unit">
              <SegmentedGroup
                value={form.patient_age_unit}
                onChange={(v) => set('patient_age_unit', v as CaseInput['patient_age_unit'])}
                options={AGE_UNITS}
                columns={2}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Weight (kg)">
              <NumberInput value={form.weight_kg} onChange={(v) => set('weight_kg', v)} placeholder="e.g. 16.5" />
            </Field>
            <Field label="Height (cm)">
              <NumberInput value={form.height_cm} onChange={(v) => set('height_cm', v)} placeholder="e.g. 100" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Gestational age (wk)">
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

          <Field label="Your role">
            <Select value={form.role} onChange={(v) => set('role', v as CaseInput['role'])} options={ROLES} />
          </Field>

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
        </SectionCard>

        <SectionCard title="Anesthesia">
          <Field label="Anesthesia type">
            <SegmentedGroup
              value={form.anesthesia_type}
              onChange={(v) => set('anesthesia_type', v as CaseInput['anesthesia_type'])}
              options={ANESTHESIA_TYPES}
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
              <Select
                value={form.airway_type}
                onChange={(v) => set('airway_type', v as CaseInput['airway_type'])}
                options={AIRWAY_TYPES}
                placeholder="Select"
              />
            </Field>
            <Field label="Difficulty">
              <Select
                value={form.airway_difficulty}
                onChange={(v) => set('airway_difficulty', v as CaseInput['airway_difficulty'])}
                options={AIRWAY_DIFFICULTIES}
                placeholder="Select"
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
            <div />
          </div>
          <Toggle
            checked={form.video_laryngoscope_used}
            onChange={(v) => set('video_laryngoscope_used', v)}
            label="Video laryngoscope"
          />
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
          <Toggle checked={form.arterial_line} onChange={(v) => set('arterial_line', v)} label="Arterial line placed" />
          {form.arterial_line && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Site">
                <Select
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

          <Toggle checked={form.central_line} onChange={(v) => set('central_line', v)} label="Central line placed" />
          {form.central_line && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Site">
                <Select
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
              <Field label="Notes">
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
        </SectionCard>

        <SectionCard title="Outcome">
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
          <Field label="Complication notes">
            <TextInput value={form.complications} onChange={(v) => set('complications', v)} placeholder="None, or brief description" />
          </Field>

          <SubHeading>Case reflection</SubHeading>
          <Field label="Anesthetic challenges" hint={`${(form.anesthetic_challenges ?? '').length}/400`}>
            <textarea
              value={form.anesthetic_challenges ?? ''}
              onChange={(e) => set('anesthetic_challenges', e.target.value)}
              maxLength={400}
              rows={2}
              className="w-full rounded-xl bg-surface border border-line px-4 py-3.5 text-paper placeholder:text-subtle focus:border-mint focus:ring-1 focus:ring-mint/40 outline-none resize-none transition-colors"
            />
          </Field>
          <Field label="Key learning points" hint={`${(form.key_learning_points ?? '').length}/400`}>
            <textarea
              value={form.key_learning_points ?? ''}
              onChange={(e) => set('key_learning_points', e.target.value)}
              maxLength={400}
              rows={2}
              className="w-full rounded-xl bg-surface border border-line px-4 py-3.5 text-paper placeholder:text-subtle focus:border-mint focus:ring-1 focus:ring-mint/40 outline-none resize-none transition-colors"
            />
          </Field>
          <Field label="What would I do differently?" hint={`${(form.would_do_differently ?? '').length}/400`}>
            <textarea
              value={form.would_do_differently ?? ''}
              onChange={(e) => set('would_do_differently', e.target.value)}
              maxLength={400}
              rows={2}
              className="w-full rounded-xl bg-surface border border-line px-4 py-3.5 text-paper placeholder:text-subtle focus:border-mint focus:ring-1 focus:ring-mint/40 outline-none resize-none transition-colors"
            />
          </Field>
          <Field label="Learning point (legacy)" hint={`${(form.learning_point ?? '').length}/300`}>
            <textarea
              value={form.learning_point ?? ''}
              onChange={(e) => set('learning_point', e.target.value)}
              maxLength={300}
              rows={2}
              className="w-full rounded-xl bg-surface border border-line px-4 py-3.5 text-paper placeholder:text-subtle focus:border-mint focus:ring-1 focus:ring-mint/40 outline-none resize-none transition-colors"
            />
          </Field>
        </SectionCard>

        {error && (
          <p className="text-rose text-sm px-1" role="alert">
            {error}
          </p>
        )}

        <div className="sticky bottom-20 md:bottom-4 pt-2 space-y-2">
          <Button type="submit" disabled={saving} loading={saving} size="lg" className="w-full shadow-raised">
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="lg"
            onClick={() => setConfirmOpen(true)}
            className="w-full"
          >
            Delete case
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete case #${initial.case_number}?`}
        description="This removes the case permanently and cannot be undone."
        confirmLabel="Delete case"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
