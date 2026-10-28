import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Volume2,
  Send,
  BookmarkCheck,
  BookmarkPlus,
  Stethoscope,
  Calculator,
  Building2,
  Check,
  FileText,
  UserCheck,
} from 'lucide-react';
import {
  SupportedLanguage,
  SYMPTOM_CHIPS,
  TARABA_FACILITIES,
  UI_TRANSLATIONS,
} from '../utils/tarabaData';
import {
  PatientIntake,
  TriageAssessmentResult,
  PRESET_CLINICAL_SCENARIOS,
} from '../utils/triageEngine';
import { VoiceAssistantPanel } from './VoiceAssistantPanel';

export interface ChatTurn {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  language: SupportedLanguage;
  source?: string;
  isVoice?: boolean;
}

interface TriageWorkspaceProps {
  language: SupportedLanguage;
  intake: PatientIntake;
  onUpdateIntake: (next: PatientIntake) => void;
  assessment: TriageAssessmentResult;
  onRunTriage: (customIntake?: PatientIntake) => Promise<void>;
  onSendChatMessage: (text: string, autoSpeak?: boolean) => Promise<void>;
  onVoiceTranscriptComplete: (
    transcript: string,
    updatedIntake: PatientIntake,
    autoSpeakReply: boolean
  ) => Promise<void>;
  chatHistory: ChatTurn[];
  isProcessing: boolean;
  onSaveToRegister: () => void;
  isCurrentSaved: boolean;
  onSpeakText: (text: string, lang: SupportedLanguage) => void;
  onStopSpeaking: () => void;
  speakingId: string | null;
}

const FRIENDLY_PATIENT_PROFILES = [
  {
    id: 'infant',
    label: { en: 'Infant (8m · 7.5 kg)', ha: 'Jariri (7.5 kg)', jk: 'Jariri (7.5 kg)' },
    ageYears: 0.7,
    weightKg: 7.5,
    sex: 'F' as const,
    isPregnant: false,
  },
  {
    id: 'toddler',
    label: { en: 'Toddler (3y · 13 kg)', ha: 'Yaro Karami (13 kg)', jk: 'Angwu Karami (13 kg)' },
    ageYears: 3,
    weightKg: 13,
    sex: 'F' as const,
    isPregnant: false,
  },
  {
    id: 'child',
    label: { en: 'School Child (7y · 22 kg)', ha: 'Yaro (22 kg)', jk: 'Angwu (22 kg)' },
    ageYears: 7,
    weightKg: 22,
    sex: 'M' as const,
    isPregnant: false,
  },
  {
    id: 'adult',
    label: { en: 'Adult (30y · 64 kg)', ha: 'Babba (64 kg)', jk: 'Mutum Ukwu (64 kg)' },
    ageYears: 30,
    weightKg: 64,
    sex: 'M' as const,
    isPregnant: false,
  },
  {
    id: 'maternal',
    label: { en: 'Pregnant Mother (25y · 58 kg)', ha: 'Mai Juna Biyu (58 kg)', jk: 'Mai Ciki (58 kg)' },
    ageYears: 25,
    weightKg: 58,
    sex: 'F' as const,
    isPregnant: true,
  },
];

export const TriageWorkspace: React.FC<TriageWorkspaceProps> = ({
  language,
  intake,
  onUpdateIntake,
  assessment,
  onRunTriage,
  onSendChatMessage,
  onVoiceTranscriptComplete,
  chatHistory,
  isProcessing,
  onSaveToRegister,
  isCurrentSaved,
  onSpeakText,
  onStopSpeaking,
  speakingId,
}) => {
  const t = UI_TRANSLATIONS[language];
  const [chatInput, setChatInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [activeCounselingLang, setActiveCounselingLang] =
    useState<SupportedLanguage>(language);
  const chatContainerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setActiveCounselingLang(language);
  }, [language]);

  React.useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const activeFacility =
    TARABA_FACILITIES.find((f) => f.id === intake.facilityId) ||
    TARABA_FACILITIES[0];

  const handleToggleSymptom = (symptomId: string) => {
    const exists = intake.selectedSymptoms.includes(symptomId);
    const updated = exists
      ? intake.selectedSymptoms.filter((id) => id !== symptomId)
      : [...intake.selectedSymptoms, symptomId];
    const nextIntake = { ...intake, selectedSymptoms: updated };
    onUpdateIntake(nextIntake);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intake.patientName.trim()) {
      setValidationError(
        language === 'ha'
          ? 'Da fatan a shigar da sunan mara lafiya.'
          : language === 'jk'
          ? 'Shigar da sunan mara lafiya tukuna.'
          : 'Please enter the patient full name before running triage.'
      );
      return;
    }
    if (
      Number.isNaN(intake.weightKg) ||
      intake.weightKg <= 0 ||
      intake.weightKg > 200
    ) {
      setValidationError(
        'Please enter a valid patient body weight in kg (1 – 200 kg).'
      );
      return;
    }
    setValidationError(null);
    await onRunTriage();
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isProcessing) return;
    const messageToSend = chatInput.trim();
    setChatInput('');
    await onSendChatMessage(messageToSend, false);
  };

  const handleCopyReferral = () => {
    const referralText = [
      `TARABA STATE PRIMARY HEALTH CARE DEVELOPMENT AGENCY — REFERRAL SLIP`,
      `From Facility: ${activeFacility.name} (${activeFacility.lga} LGA)`,
      `To Referral Center: ${assessment.referralHospital} (${assessment.referralDistanceKm} km)`,
      `Patient: ${intake.patientName} | Age: ${intake.ageYears}y | Sex: ${intake.sex} | Weight: ${intake.weightKg}kg | Temp: ${intake.tempC}°C`,
      `Triage Acuity: ${assessment.acuity} (Risk Score: ${assessment.acuityScore}/100)`,
      `Suspected Condition: ${assessment.primaryDiagnosis.conditionName} (${assessment.primaryDiagnosis.localNameHa} / ${assessment.primaryDiagnosis.localNameJk})`,
      `Danger Signs: ${assessment.dangerSigns.length > 0 ? assessment.dangerSigns.join('; ') : 'None detected'}`,
      `Pre-Referral Standing Order Administered: ${assessment.dosagePlan.map((d) => `${d.medication} ${d.dosePerAdministration}`).join(' + ')}`,
    ].join('\n');

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(referralText).catch(() => {});
    }
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2500);
  };

  return (
    <div className="space-y-5">
      {/* Friendly Hands-Free Voice Chatbot Bar */}
      <VoiceAssistantPanel
        language={language}
        intake={intake}
        onVoiceTranscriptComplete={onVoiceTranscriptComplete}
        isProcessing={isProcessing}
        speakingId={speakingId}
        onStopSpeaking={onStopSpeaking}
      />

      {/* Preset Clinical Scenarios Bar for rapid field simulation */}
      <section
        aria-label="Clinical Field Case Presets"
        className="bg-white border border-slate-200 rounded-lg p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
          <div>
            <h2 className="text-xs font-semibold text-slate-900">
              {t.presetScenariosLabel}
            </h2>
            <p className="text-xs text-slate-500">
              {activeFacility.name} · {activeFacility.lga} LGA · Referral:{' '}
              {activeFacility.referralHospital} (
              <span className="tabular-nums">
                {activeFacility.referralDistanceKm} km
              </span>
              )
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {assessment.engineSource === 'gemini-hybrid'
              ? t.onlineAiBadge
              : t.offlineEngineBadge}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {PRESET_CLINICAL_SCENARIOS.map((scenario) => {
            const isSelected =
              intake.patientName === scenario.intake.patientName &&
              intake.facilityId === scenario.intake.facilityId;
            return (
              <button
                key={scenario.id}
                type="button"
                onClick={() => {
                  setValidationError(null);
                  onUpdateIntake(scenario.intake);
                  onRunTriage(scenario.intake);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {scenario.title[language]}
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Two-Column Clinical Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Trilingual AI Triage Chatbot + Friendly Guided Patient Intake */}
        <div className="lg:col-span-7 space-y-5">
          {/* Interactive Trilingual Clinical AI Triage Chatbot */}
          <section
            aria-label="Trilingual Clinical Triage Assistant Chat"
            className="bg-white border border-slate-200 rounded-lg p-4 space-y-3.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Interactive Clinical Triage Assistant Dialogue (EN · HA · JK)
                </h2>
                <p className="text-xs text-slate-500">
                  Type or speak in English, Hausa, or Jukun Wapan — click Audio on any message to hear it read aloud
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onSendChatMessage(
                      language === 'ha'
                        ? 'Yaya za a ba da maganin ACT da Paracetamol ga wannan mara lafiya?'
                        : language === 'jk'
                        ? 'Yaya za a ba akyen ACT ba Paracetamol ga angwu ne?'
                        : 'Explain the exact weight-based dosage schedule and danger signs to watch.',
                      true
                    )
                  }
                  className="px-2.5 py-1 text-xs font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 rounded border border-teal-200 transition-colors whitespace-nowrap shrink-0"
                >
                  {language === 'ha'
                    ? 'Tambayi Ma’aunin Magani'
                    : language === 'jk'
                    ? 'Tambayi Yawan Akyen'
                    : 'Ask Dosage Schedule'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onSendChatMessage(
                      'Translate the caregiver home care instructions into Hausa and Jukun Wapan.',
                      true
                    )
                  }
                  className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors whitespace-nowrap shrink-0"
                >
                  Translate to Hausa & Jukun
                </button>
              </div>
            </div>

            {/* Chat Messages Scroll Container */}
            <div
              ref={chatContainerRef}
              className="space-y-2.5 max-h-64 overflow-y-auto pr-1"
            >
              {chatHistory.map((turn) => (
                <div
                  key={turn.id}
                  className={`p-3 rounded-lg text-xs leading-relaxed ${
                    turn.sender === 'user'
                      ? 'bg-slate-900 text-white ml-8'
                      : 'bg-slate-50 text-slate-800 border border-slate-200 mr-4'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1 opacity-75">
                    <span className="font-semibold">
                      {turn.sender === 'user'
                        ? turn.isVoice
                          ? 'Spoken Voice Input (CHEW / Patient)'
                          : 'Health Worker (CHEW / Nurse)'
                        : 'PHC-Aid Taraba Clinical Assistant'}
                    </span>
                    <div className="flex items-center gap-2 font-mono tabular-nums">
                      <span>{turn.timestamp}</span>
                      {turn.sender === 'assistant' && (
                        <button
                          type="button"
                          onClick={() =>
                            onSpeakText(turn.text, turn.language || language)
                          }
                          aria-label="Read clinical response aloud"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200 hover:bg-teal-50 hover:border-teal-300 text-xs font-sans font-medium"
                        >
                          <Volume2 className="w-3 h-3 text-teal-700" />
                          <span>
                            {speakingId === turn.text.slice(0, 24)
                              ? 'Speaking...'
                              : 'Listen'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="whitespace-pre-line">
                    {turn.text.split(/(\*\*[^*]+\*\*)/g).map((part, idx) =>
                      part.startsWith('**') && part.endsWith('**') ? (
                        <strong key={idx} className="font-semibold">
                          {part.slice(2, -2)}
                        </strong>
                      ) : (
                        <React.Fragment key={idx}>{part}</React.Fragment>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleChatSubmit} className="flex gap-2 pt-1">
              <label htmlFor="chat-prompt-input" className="sr-only">
                {t.chatInputPlaceholder}
              </label>
              <input
                id="chat-prompt-input"
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={t.chatInputPlaceholder}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
              <button
                type="submit"
                disabled={isProcessing || !chatInput.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </section>

          {/* Friendly Guided Patient Intake & Vitals Form */}
          <form
            onSubmit={handleFormSubmit}
            className="bg-white border border-slate-200 rounded-lg p-4 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-teal-700 shrink-0" />
                <h2 className="text-sm font-semibold text-slate-900">
                  {t.patientIntakeTitle}
                </h2>
              </div>
              <span className="text-xs text-slate-500">
                1-Tap Patient Group or Custom Vitals
              </span>
            </div>

            {/* Friendly 1-Tap Patient Age/Weight Group Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <UserCheck className="w-3.5 h-3.5 text-teal-700" />
                <span>Quick Patient Profile Selector:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {FRIENDLY_PATIENT_PROFILES.map((prof) => {
                  const isActiveProf =
                    Math.abs(intake.weightKg - prof.weightKg) < 1 &&
                    Boolean(intake.isPregnant) === prof.isPregnant;
                  return (
                    <button
                      key={prof.id}
                      type="button"
                      onClick={() =>
                        onUpdateIntake({
                          ...intake,
                          ageYears: prof.ageYears,
                          weightKg: prof.weightKg,
                          sex: prof.sex,
                          isPregnant: prof.isPregnant,
                        })
                      }
                      className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isActiveProf
                          ? 'bg-teal-700 text-white border-teal-700'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {prof.label[language]}
                    </button>
                  );
                })}
              </div>
            </div>

            {validationError && (
              <div
                role="alert"
                className="p-3 rounded-md bg-red-50 border border-red-200 text-xs font-medium text-red-800 flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
              <div className="sm:col-span-3">
                <label
                  htmlFor="patient-name-input"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  {t.patientNameLabel}
                </label>
                <input
                  id="patient-name-input"
                  type="text"
                  value={intake.patientName}
                  onChange={(e) =>
                    onUpdateIntake({ ...intake, patientName: e.target.value })
                  }
                  placeholder="e.g. Aku Adi-Agbu"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-1">
                <label
                  htmlFor="patient-sex-select"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Sex
                </label>
                <select
                  id="patient-sex-select"
                  value={intake.sex}
                  onChange={(e) =>
                    onUpdateIntake({
                      ...intake,
                      sex: e.target.value as 'F' | 'M',
                      isPregnant:
                        e.target.value === 'M' ? false : intake.isPregnant,
                    })
                  }
                  className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  <option value="F">Female</option>
                  <option value="M">Male</option>
                </select>
              </div>

              <div className="sm:col-span-1">
                <label
                  htmlFor="patient-age-input"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  {t.ageYearsLabel}
                </label>
                <input
                  id="patient-age-input"
                  type="number"
                  min={0.1}
                  max={110}
                  step="any"
                  value={intake.ageYears}
                  onChange={(e) =>
                    onUpdateIntake({
                      ...intake,
                      ageYears: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="sm:col-span-1">
                <label
                  htmlFor="patient-weight-input"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  {t.weightKgLabel}
                </label>
                <input
                  id="patient-weight-input"
                  type="number"
                  min={1}
                  max={200}
                  step="any"
                  value={intake.weightKg}
                  onChange={(e) =>
                    onUpdateIntake({
                      ...intake,
                      weightKg: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            {/* Interactive Sliders for Weight & Axillary Temp for fast touch adjustment */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center bg-slate-50/70 p-3 rounded-md border border-slate-100">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label
                    htmlFor="patient-temp-input"
                    className="font-medium text-slate-700"
                  >
                    {t.tempCLabel}
                  </label>
                  <span
                    className={`font-mono font-bold tabular-nums ${
                      intake.tempC >= 39.5
                        ? 'text-red-700'
                        : intake.tempC >= 37.8
                        ? 'text-amber-700'
                        : 'text-slate-800'
                    }`}
                  >
                    {intake.tempC.toFixed(1)}°C
                  </span>
                </div>
                <input
                  id="patient-temp-input"
                  type="range"
                  min={35.5}
                  max={41.5}
                  step={0.1}
                  value={intake.tempC}
                  onChange={(e) =>
                    onUpdateIntake({
                      ...intake,
                      tempC: parseFloat(e.target.value) || 37.0,
                    })
                  }
                  className="w-full accent-teal-700 cursor-pointer"
                />
              </div>

              <div>
                <label
                  htmlFor="patient-muac-input"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  {t.muacCmLabel}
                </label>
                <input
                  id="patient-muac-input"
                  type="number"
                  min={7}
                  max={35}
                  step={0.1}
                  value={intake.muacCm ?? 14.0}
                  onChange={(e) =>
                    onUpdateIntake({
                      ...intake,
                      muacCm: parseFloat(e.target.value) || 14.0,
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="flex items-center pt-3">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(intake.isPregnant)}
                    disabled={intake.sex === 'M' || intake.ageYears < 12}
                    onChange={(e) =>
                      onUpdateIntake({
                        ...intake,
                        isPregnant: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                  />
                  <span>{t.pregnantLabel}</span>
                </label>
              </div>
            </div>

            {/* Interactive Symptom & Danger Sign Filter Buttons */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-800">
                  {t.symptomChecklistTitle}
                </span>
                <span className="text-xs text-slate-500 font-mono tabular-nums">
                  {intake.selectedSymptoms.length} selected
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {SYMPTOM_CHIPS.map((chip) => {
                  const active = intake.selectedSymptoms.includes(chip.id);
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => handleToggleSymptom(chip.id)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                        active
                          ? chip.isRedFlag
                            ? 'bg-red-700 text-white border-red-700'
                            : 'bg-teal-700 text-white border-teal-700'
                          : chip.isRedFlag
                          ? 'bg-white text-red-800 border-red-200 hover:bg-red-50'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {chip.isRedFlag && (
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>{chip.label[language]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Weight-band dosing auto-recalculates for{' '}
                <span className="font-mono font-semibold text-slate-800 tabular-nums">
                  {intake.weightKg} kg
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onSaveToRegister}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-md border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    isCurrentSaved
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {isCurrentSaved ? (
                    <>
                      <BookmarkCheck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{t.savedConfirmation}</span>
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="w-3.5 h-3.5" />
                      <span>{t.saveToRegisterBtn}</span>
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-700 rounded-md hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0 disabled:opacity-60"
                >
                  {isProcessing ? 'Evaluating...' : t.runTriageBtn}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column (5 cols): Live Structured Clinical Decision Support Card */}
        <div className="lg:col-span-5 space-y-6">
          <section
            aria-label="Clinical Triage Decision Output"
            className="bg-white border border-slate-200 rounded-lg p-5 space-y-5"
          >
            {/* Acuity Header Banner */}
            <div
              className={`p-4 rounded-lg border ${
                assessment.acuity === 'EMERGENCY'
                  ? 'bg-red-50 border-red-200 text-red-950'
                  : assessment.acuity === 'PRIORITY'
                  ? 'bg-amber-50 border-amber-200 text-amber-950'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-950'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  {assessment.acuity === 'EMERGENCY' ? (
                    <AlertTriangle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                  ) : assessment.acuity === 'PRIORITY' ? (
                    <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="text-xs font-bold tracking-wide">
                      {assessment.acuity === 'EMERGENCY'
                        ? 'EMERGENCY TRIAGE — IMMEDIATE PRE-REFERRAL & TRANSFER'
                        : assessment.acuity === 'PRIORITY'
                        ? 'PRIORITY TRIAGE — RAPID DIAGNOSTIC & OBSERVATION'
                        : 'ROUTINE TRIAGE — OUTPATIENT PHC STANDING ORDERS'}
                    </div>
                    <h3 className="text-base font-bold mt-1">
                      {assessment.primaryDiagnosis.conditionName}
                    </h3>
                    <p className="text-xs mt-1 opacity-90">
                      Hausa: {assessment.primaryDiagnosis.localNameHa} · Jukun:{' '}
                      {assessment.primaryDiagnosis.localNameJk}
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono tabular-nums shrink-0">
                  <div className="text-xs opacity-75">Acuity Index</div>
                  <div className="text-lg font-bold">
                    {assessment.acuityScore}/100
                  </div>
                </div>
              </div>
            </div>

            {/* Danger Signs Detected */}
            {assessment.dangerSigns.length > 0 && (
              <div className="p-3.5 rounded-md bg-red-50/70 border border-red-200 space-y-1.5">
                <div className="text-xs font-semibold text-red-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-700 shrink-0" />
                  <span>
                    Red-Flag Danger Signs Detected ({assessment.dangerSigns.length})
                  </span>
                </div>
                <ul className="text-xs text-red-800 space-y-1 pl-5 list-disc">
                  {assessment.dangerSigns.map((sign, i) => (
                    <li key={i}>{sign}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Differential Diagnoses & Mandatory RDTs */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-900">
                  Differential Diagnosis & Mandatory Point-of-Care Tests
                </h4>
                <span className="text-xs text-slate-500">Confidence</span>
              </div>

              <div className="divide-y divide-slate-200 border border-slate-200 rounded-md">
                {assessment.differentials.map((diff) => (
                  <div key={diff.protocolId} className="p-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900">
                        {diff.conditionName}
                      </span>
                      <span className="text-xs font-mono font-semibold text-teal-800 tabular-nums">
                        {diff.confidencePct}% match
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Hausa: {diff.localNameHa} · Jukun: {diff.localNameJk}
                    </div>
                    <p className="text-xs text-slate-700">{diff.rationale}</p>
                    <div className="text-xs font-medium text-slate-800 pt-1">
                      Required Test: {diff.requiredRdtOrLab}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weight-Adjusted Standing Orders Drug Dosage Table */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-teal-700" />
                  <h4 className="text-xs font-semibold text-slate-900">
                    {t.dosageStandingOrderTitle}
                  </h4>
                </div>
                <span className="text-xs font-mono text-slate-600 tabular-nums">
                  {intake.weightKg} kg · {intake.ageYears} yrs
                </span>
              </div>

              <div className="divide-y divide-slate-200 border border-slate-200 rounded-md">
                {assessment.dosagePlan.map((dose, idx) => (
                  <div key={idx} className="p-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900">
                        {dose.medication}
                      </span>
                      <span className="text-xs font-mono text-slate-600">
                        {dose.route}
                      </span>
                    </div>
                    <div className="text-xs font-mono font-semibold text-teal-800 tabular-nums">
                      Dose: {dose.dosePerAdministration}
                    </div>
                    <div className="text-xs text-slate-700">
                      Schedule: {dose.schedule}
                    </div>
                    <div className="text-xs text-slate-500">
                      {dose.clinicalNote}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trilingual Patient Counseling Script with Voice Readout */}
            <div className="space-y-2.5 pt-1 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-semibold text-slate-900">
                  {t.patientCounselingTitle}
                </h4>

                <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-md">
                  {(['en', 'ha', 'jk'] as SupportedLanguage[]).map((langKey) => (
                    <button
                      key={langKey}
                      type="button"
                      onClick={() => setActiveCounselingLang(langKey)}
                      className={`px-2 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                        activeCounselingLang === langKey
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {langKey === 'en'
                        ? 'English'
                        : langKey === 'ha'
                        ? 'Hausa'
                        : 'Jukun (Wapan)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-2.5">
                <p className="text-xs text-slate-800 leading-relaxed">
                  {assessment.counselingTrilingual[activeCounselingLang]}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-500">
                    Spoken audio for patient / caregiver counseling
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onSpeakText(
                        assessment.counselingTrilingual[activeCounselingLang],
                        activeCounselingLang
                      )
                    }
                    className="px-2.5 py-1 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-teal-700" />
                    <span>
                      {speakingId ===
                      assessment.counselingTrilingual[
                        activeCounselingLang
                      ].slice(0, 24)
                        ? 'Playing Audio...'
                        : `Speak (${activeCounselingLang.toUpperCase()})`}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Referral Pathway & Copyable Slip */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                <span>
                  Referral Center: <strong>{assessment.referralHospital}</strong>{' '}
                  (<span className="tabular-nums">{assessment.referralDistanceKm} km</span>)
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyReferral}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                {copiedReferral ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Referral Slip Copied</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5" />
                    <span>Copy Referral Note</span>
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
