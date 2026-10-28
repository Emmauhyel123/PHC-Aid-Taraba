/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  SupportedLanguage,
  TARABA_FACILITIES,
  UI_TRANSLATIONS,
} from './utils/tarabaData';
import {
  PatientIntake,
  PatientRecord,
  TriageAssessmentResult,
  PRESET_CLINICAL_SCENARIOS,
  evaluateOfflineTriage,
  createInitialPatientRegister,
} from './utils/triageEngine';
import { TriageWorkspace, ChatTurn } from './components/TriageWorkspace';
import { PatientRegisterView } from './components/PatientRegisterView';
import { DiseaseProtocolsView } from './components/DiseaseProtocolsView';
import { PhrasebookView } from './components/PhrasebookView';
import { MapPin, Wifi, WifiOff } from 'lucide-react';

type ActiveTab = 'triage' | 'register' | 'protocols' | 'phrasebook';

const REGISTER_STORAGE_KEY = 'phc_aid_taraba_register_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('triage');
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [offlineMode, setOfflineMode] = useState<boolean>(false);

  const [intake, setIntake] = useState<PatientIntake>(
    PRESET_CLINICAL_SCENARIOS[0].intake
  );

  const [assessment, setAssessment] = useState<TriageAssessmentResult>(() =>
    evaluateOfflineTriage(PRESET_CLINICAL_SCENARIOS[0].intake, 'en')
  );

  const [patientRecords, setPatientRecords] = useState<PatientRecord[]>(() => {
    try {
      const raw = localStorage.getItem(REGISTER_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (_e) {
      // Ignore storage error
    }
    return createInitialPatientRegister();
  });

  const [chatHistory, setChatHistory] = useState<ChatTurn[]>(() => {
    const initialEval = evaluateOfflineTriage(
      PRESET_CLINICAL_SCENARIOS[0].intake,
      'en'
    );
    return [
      {
        id: 'turn-welcome',
        sender: 'assistant',
        text: 'Aba / Barka da zuwa PHC-Aid Taraba. Select presenting symptoms or type patient complaints in English, Hausa, or Jukun (Wapan) to compute Nigeria PHC Standing Orders triage and weight-based drug dosages.',
        timestamp: '08:00',
        language: 'en',
      },
      {
        id: 'turn-init-case',
        sender: 'assistant',
        text: initialEval.assistantReply,
        timestamp: '08:01',
        language: 'en',
      },
    ];
  });

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isCurrentSaved, setIsCurrentSaved] = useState<boolean>(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(
        REGISTER_STORAGE_KEY,
        JSON.stringify(patientRecords)
      );
    } catch (_e) {
      // Ignore storage quota error
    }
  }, [patientRecords]);

  // Re-evaluate baseline assessment whenever intake weight/age/symptoms/language change
  const handleUpdateIntake = (nextIntake: PatientIntake) => {
    setIntake(nextIntake);
    setIsCurrentSaved(false);
    const localUpdated = evaluateOfflineTriage(nextIntake, language);
    setAssessment(localUpdated);
  };

  const handleLanguageChange = (nextLang: SupportedLanguage) => {
    setLanguage(nextLang);
    const updatedEval = evaluateOfflineTriage(intake, nextLang);
    setAssessment(updatedEval);
  };

  const formatNowTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
  };

  const handleRunTriage = async (customIntake?: PatientIntake) => {
    const targetIntake = customIntake || intake;
    setIsProcessing(true);
    setIsCurrentSaved(false);

    // Immediate offline calculation for zero-latency responsiveness
    const offlineResult = evaluateOfflineTriage(targetIntake, language);
    setAssessment(offlineResult);

    if (offlineMode) {
      setChatHistory((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          sender: 'user',
          text: `Triage intake: ${targetIntake.patientName} (${targetIntake.ageYears}y, ${targetIntake.weightKg}kg, ${targetIntake.tempC}°C) — ${targetIntake.freeTextSymptoms || 'Selected clinical symptoms'}`,
          timestamp: formatNowTime(),
          language,
        },
        {
          id: `asst-${Date.now() + 1}`,
          sender: 'assistant',
          text: offlineResult.assistantReply,
          timestamp: formatNowTime(),
          language,
          source: 'offline-standing-orders',
        },
      ]);
      setIsProcessing(false);
      return;
    }

    try {
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intake: targetIntake,
          language,
          offlineMode,
        }),
      });

      if (response.ok) {
        const data: TriageAssessmentResult = await response.json();
        setAssessment(data);
        setChatHistory((prev) => [
          ...prev,
          {
            id: `user-${Date.now()}`,
            sender: 'user',
            text: `Triage intake: ${targetIntake.patientName} (${targetIntake.ageYears}y, ${targetIntake.weightKg}kg, ${targetIntake.tempC}°C) — ${targetIntake.freeTextSymptoms || 'Selected clinical symptoms'}`,
            timestamp: formatNowTime(),
            language,
          },
          {
            id: `asst-${Date.now() + 1}`,
            sender: 'assistant',
            text: data.assistantReply,
            timestamp: formatNowTime(),
            language,
            source: data.engineSource,
          },
        ]);
      } else {
        setChatHistory((prev) => [
          ...prev,
          {
            id: `asst-${Date.now() + 1}`,
            sender: 'assistant',
            text: offlineResult.assistantReply,
            timestamp: formatNowTime(),
            language,
            source: 'offline-standing-orders',
          },
        ]);
      }
    } catch (_err) {
      setChatHistory((prev) => [
        ...prev,
        {
          id: `asst-${Date.now() + 1}`,
          sender: 'assistant',
          text: offlineResult.assistantReply,
          timestamp: formatNowTime(),
          language,
          source: 'offline-standing-orders',
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_e) {
        // Ignore
      }
    }
    setSpeakingId(null);
  };

  const handleSpeakText = async (text: string, lang: SupportedLanguage) => {
    const cleanText = text.replace(/\*\*/g, '');
    const key = text.slice(0, 24);
    setSpeakingId(key);

    if (!offlineMode) {
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: cleanText }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.audioBase64) {
            const audio = new Audio(
              `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`
            );
            audio.onended = () => setSpeakingId(null);
            audio.onerror = () => setSpeakingId(null);
            await audio.play();
            return;
          }
        }
      } catch (_e) {
        // Fall through to browser Web Speech API
      }
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = lang === 'ha' ? 'ha-NG' : 'en-NG';
        utterance.rate = 0.95;
        utterance.onend = () => setSpeakingId(null);
        utterance.onerror = () => setSpeakingId(null);
        window.speechSynthesis.speak(utterance);
        return;
      } catch (_e) {
        // Ignore speech synthesis error
      }
    }

    setTimeout(() => setSpeakingId(null), 1500);
  };

  const handleSendChatMessage = async (
    messageText: string,
    autoSpeak = false,
    isVoice = false,
    overrideIntake?: PatientIntake
  ) => {
    const activeIntake = overrideIntake || intake;
    const userTurn: ChatTurn = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: messageText,
      timestamp: formatNowTime(),
      language,
      isVoice,
    };
    setChatHistory((prev) => [...prev, userTurn]);
    setIsProcessing(true);

    try {
      if (offlineMode) {
        const updatedIntake: PatientIntake = {
          ...activeIntake,
          freeTextSymptoms: `${activeIntake.freeTextSymptoms} ${messageText}`.trim(),
        };
        const localEval = evaluateOfflineTriage(updatedIntake, language);
        setAssessment(localEval);
        setChatHistory((prev) => [
          ...prev,
          {
            id: `asst-${Date.now() + 1}`,
            sender: 'assistant',
            text: localEval.assistantReply,
            timestamp: formatNowTime(),
            language,
            source: 'offline-standing-orders',
          },
        ]);
        if (autoSpeak) {
          handleSpeakText(localEval.assistantReply, language);
        }
        return;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          language,
          intake: activeIntake,
          offlineMode,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.assessment) {
          setAssessment(data.assessment);
        }
        setChatHistory((prev) => [
          ...prev,
          {
            id: `asst-${Date.now() + 1}`,
            sender: 'assistant',
            text: data.reply,
            timestamp: formatNowTime(),
            language,
            source: data.source,
          },
        ]);
        if (autoSpeak) {
          handleSpeakText(data.reply, language);
        }
      } else {
        const fallbackEval = evaluateOfflineTriage(
          {
            ...activeIntake,
            freeTextSymptoms: `${activeIntake.freeTextSymptoms} ${messageText}`,
          },
          language
        );
        setAssessment(fallbackEval);
        setChatHistory((prev) => [
          ...prev,
          {
            id: `asst-${Date.now() + 1}`,
            sender: 'assistant',
            text: fallbackEval.assistantReply,
            timestamp: formatNowTime(),
            language,
            source: 'offline-standing-orders',
          },
        ]);
        if (autoSpeak) {
          handleSpeakText(fallbackEval.assistantReply, language);
        }
      }
    } catch (_e) {
      const fallbackEval = evaluateOfflineTriage(
        {
          ...activeIntake,
          freeTextSymptoms: `${activeIntake.freeTextSymptoms} ${messageText}`,
        },
        language
      );
      setAssessment(fallbackEval);
      setChatHistory((prev) => [
        ...prev,
        {
          id: `asst-${Date.now() + 1}`,
          sender: 'assistant',
          text: fallbackEval.assistantReply,
          timestamp: formatNowTime(),
          language,
          source: 'offline-standing-orders',
        },
      ]);
      if (autoSpeak) {
        handleSpeakText(fallbackEval.assistantReply, language);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceTranscriptComplete = async (
    transcript: string,
    updatedIntake: PatientIntake,
    autoSpeakReply: boolean
  ) => {
    setIntake(updatedIntake);
    setIsCurrentSaved(false);
    const localUpdated = evaluateOfflineTriage(updatedIntake, language);
    setAssessment(localUpdated);
    await handleSendChatMessage(
      transcript,
      autoSpeakReply,
      true,
      updatedIntake
    );
  };

  const handleSaveToRegister = () => {
    const facility =
      TARABA_FACILITIES.find((f) => f.id === intake.facilityId) ||
      TARABA_FACILITIES[0];
    const newRecord: PatientRecord = {
      id: `reg-${Date.now()}`,
      timestampIso: new Date().toISOString(),
      patientName: intake.patientName.trim() || 'Unnamed Patient',
      ageYears: intake.ageYears,
      sex: intake.sex,
      weightKg: intake.weightKg,
      tempC: intake.tempC,
      facilityId: facility.id,
      lgaName: facility.lga,
      acuity: assessment.acuity,
      primaryCondition: assessment.primaryDiagnosis.conditionName,
      localSummaryJk: assessment.primaryDiagnosis.localNameJk,
      referralRequired: assessment.referralRequired,
      syncStatus: offlineMode ? 'Cached Offline' : 'Synced to DHIS2/PHC',
      intake: { ...intake },
      assessment: { ...assessment },
    };

    setPatientRecords((prev) => [newRecord, ...prev]);
    setIsCurrentSaved(true);
  };

  const handleStartNewTriage = () => {
    const blankIntake: PatientIntake = {
      patientName: '',
      ageYears: 8,
      sex: 'F',
      weightKg: 24,
      tempC: 38.5,
      muacCm: 14.5,
      isPregnant: false,
      facilityId: intake.facilityId,
      selectedSymptoms: ['high_fever'],
      freeTextSymptoms: '',
    };
    setIntake(blankIntake);
    setAssessment(evaluateOfflineTriage(blankIntake, language));
    setIsCurrentSaved(false);
    setActiveTab('triage');
  };

  const t = UI_TRANSLATIONS[language];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#triage"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('triage');
            }}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            PHC-Aid Taraba
          </a>

          {/* Zone 2: 4 concise single-line text navigation links */}
          <nav
            aria-label="Primary Navigation"
            className="flex items-center gap-6 text-sm font-medium text-slate-600 overflow-x-auto"
          >
            <button
              type="button"
              onClick={() => setActiveTab('triage')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'triage'
                  ? 'border-teal-700 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {t.navTriage}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'register'
                  ? 'border-teal-700 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {t.navRegister} ({patientRecords.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('protocols')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'protocols'
                  ? 'border-teal-700 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {t.navProtocols}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('phrasebook')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'phrasebook'
                  ? 'border-teal-700 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {t.navPhrasebook}
            </button>
          </nav>

          {/* Zone 3: 1 primary action button */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={handleStartNewTriage}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0"
            >
              {t.newTriageCta}
            </button>
          </div>
        </div>
      </header>

      {/* Contextual Clinical Workspace Toolbar (Below Top Bar) */}
      <div className="bg-slate-900 text-slate-100 border-b border-slate-800 px-6 py-2.5">
        <div className="max-w-[1360px] mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Active Taraba PHC Facility Selector */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <label htmlFor="facility-select" className="font-medium">
                Active PHC Facility:
              </label>
            </div>
            <select
              id="facility-select"
              value={intake.facilityId}
              onChange={(e) =>
                handleUpdateIntake({ ...intake, facilityId: e.target.value })
              }
              className="bg-slate-800 text-white text-xs font-medium px-2.5 py-1.5 rounded border border-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-400"
            >
              {TARABA_FACILITIES.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.name} ({fac.lga} LGA)
                </option>
              ))}
            </select>
          </div>

          {/* Language Switcher (English, Hausa, Jukun) & Offline Engine Mode Toggle */}
          <div className="flex flex-wrap items-center gap-4">
            <div
              role="group"
              aria-label="Clinical Interface Language"
              className="flex items-center gap-1 p-0.5 bg-slate-800 rounded-md border border-slate-700"
            >
              {(
                [
                  { code: 'en', label: 'English (EN)' },
                  { code: 'ha', label: 'Hausa (HA)' },
                  { code: 'jk', label: 'Jukun Wapan (JK)' },
                ] as const
              ).map((langOpt) => (
                <button
                  key={langOpt.code}
                  type="button"
                  onClick={() => handleLanguageChange(langOpt.code)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                    language === langOpt.code
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {langOpt.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setOfflineMode((prev) => !prev)}
              className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                offlineMode
                  ? 'bg-amber-950/80 text-amber-200 border-amber-700'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {offlineMode ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>Strict Offline Mode Active</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-teal-400" />
                  <span>Hybrid AI + Offline Standing Orders</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-6 py-6">
        {activeTab === 'triage' && (
          <TriageWorkspace
            language={language}
            intake={intake}
            onUpdateIntake={handleUpdateIntake}
            assessment={assessment}
            onRunTriage={handleRunTriage}
            onSendChatMessage={handleSendChatMessage}
            onVoiceTranscriptComplete={handleVoiceTranscriptComplete}
            chatHistory={chatHistory}
            isProcessing={isProcessing}
            onSaveToRegister={handleSaveToRegister}
            isCurrentSaved={isCurrentSaved}
            onSpeakText={handleSpeakText}
            onStopSpeaking={handleStopSpeaking}
            speakingId={speakingId}
          />
        )}

        {activeTab === 'register' && (
          <PatientRegisterView
            language={language}
            records={patientRecords}
            onSelectRecord={(rec) => {
              setIntake(rec.intake);
              setAssessment(rec.assessment);
              setIsCurrentSaved(true);
              setActiveTab('triage');
            }}
            onDeleteRecord={(id) =>
              setPatientRecords((prev) => prev.filter((r) => r.id !== id))
            }
            onSyncAllOffline={() =>
              setPatientRecords((prev) =>
                prev.map((r) => ({
                  ...r,
                  syncStatus: 'Synced to DHIS2/PHC',
                }))
              )
            }
            onStartNewTriage={handleStartNewTriage}
          />
        )}

        {activeTab === 'protocols' && (
          <DiseaseProtocolsView
            language={language}
            onSpeakText={handleSpeakText}
            speakingId={speakingId}
          />
        )}

        {activeTab === 'phrasebook' && (
          <PhrasebookView
            language={language}
            onSpeakText={handleSpeakText}
            speakingId={speakingId}
            onUsePhraseInChat={(phraseText) => {
              setActiveTab('triage');
              handleSendChatMessage(phraseText);
            }}
          />
        )}
      </main>

      {/* Quiet Clinical Footer */}
      <footer className="bg-white border-t border-slate-200 px-6 py-4 mt-8">
        <div className="max-w-[1360px] mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            PHC-Aid Taraba · Aligned with Nigeria National Standing Orders for
            Community Health Officers / CHEWs & WHO IMCI Guidelines
          </div>
          <div>
            Supported Languages: English · Hausa (Harshen Hausa) · Jukun (Wapan /
            Takum / Wukari)
          </div>
        </div>
      </footer>
    </div>
  );
}
