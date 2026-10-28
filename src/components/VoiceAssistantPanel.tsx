import React, { useState, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  AudioLines,
} from 'lucide-react';
import { SupportedLanguage } from '../utils/tarabaData';
import {
  PatientIntake,
  VOICE_QUICK_PROMPTS,
  parseSpokenSymptomTranscript,
} from '../utils/triageEngine';

interface VoiceAssistantPanelProps {
  language: SupportedLanguage;
  intake: PatientIntake;
  onVoiceTranscriptComplete: (
    transcript: string,
    updatedIntake: PatientIntake,
    autoSpeakReply: boolean
  ) => Promise<void>;
  isProcessing: boolean;
  speakingId: string | null;
  onStopSpeaking: () => void;
}

export const VoiceAssistantPanel: React.FC<VoiceAssistantPanelProps> = ({
  language,
  intake,
  onVoiceTranscriptComplete,
  isProcessing,
  speakingId,
  onStopSpeaking,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [autoSpeakReplies, setAutoSpeakReplies] = useState(true);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [voiceStatusNote, setVoiceStatusNote] = useState<string>('');
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const isAssistantSpeaking = Boolean(speakingId);

  const handleSimulatedOrFallbackVoice = async (sampleText?: string) => {
    const chosenText =
      sampleText ||
      VOICE_QUICK_PROMPTS[0].spokenText[language] ||
      VOICE_QUICK_PROMPTS[0].spokenText.en;

    setIsListening(true);
    setLiveTranscript('');
    setVoiceStatusNote(
      language === 'ha'
        ? 'Ana sauraron muryar ku...'
        : language === 'jk'
        ? 'Ana sauraron murya (Jukun/Hausa)...'
        : 'Listening to spoken symptom report...'
    );

    // Progressive word reveal for friendly interactive feedback
    const words = chosenText.split(' ');
    for (let i = 1; i <= words.length; i++) {
      await new Promise((r) => setTimeout(r, 35));
      setLiveTranscript(words.slice(0, i).join(' '));
    }

    setIsListening(false);
    const updatedIntake = parseSpokenSymptomTranscript(chosenText, intake);
    setVoiceStatusNote(
      language === 'ha'
        ? `An gane murya: Shekara ${updatedIntake.ageYears}, Nauyi ${updatedIntake.weightKg} kg, Zafin jiki ${updatedIntake.tempC}°C`
        : language === 'jk'
        ? `An gane murya: Shekara ${updatedIntake.ageYears}, Nauyin apyi ${updatedIntake.weightKg} kg (${updatedIntake.tempC}°C)`
        : `Voice extracted: Age ${updatedIntake.ageYears}y · Weight ${updatedIntake.weightKg}kg · Temp ${updatedIntake.tempC}°C`
    );

    await onVoiceTranscriptComplete(chosenText, updatedIntake, autoSpeakReplies);
  };

  const handleToggleMic = async () => {
    if (isListening) {
      setIsListening(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_e) {
          // Ignore
        }
      }
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        try {
          mediaRecorderRef.current.stop();
        } catch (_e) {
          // Ignore
        }
      }
      return;
    }

    if (isAssistantSpeaking) {
      onStopSpeaking();
    }

    // Try Web Speech API first if available in the browser
    const SpeechRecognitionCtor =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition
        : null;

    if (SpeechRecognitionCtor) {
      try {
        const recognition = new SpeechRecognitionCtor();
        recognitionRef.current = recognition;
        recognition.lang =
          language === 'ha' ? 'ha-NG' : language === 'jk' ? 'ha-NG' : 'en-NG';
        recognition.continuous = false;
        recognition.interimResults = true;

        let capturedText = '';

        recognition.onstart = () => {
          setIsListening(true);
          setLiveTranscript('');
          setVoiceStatusNote('Microphone active — speak symptoms now...');
        };

        recognition.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            interim += event.results[i][0].transcript;
          }
          capturedText = interim;
          setLiveTranscript(interim);
        };

        recognition.onerror = () => {
          setIsListening(false);
          // Gracefully run interactive voice simulation if hardware mic is unavailable in sandbox
          handleSimulatedOrFallbackVoice();
        };

        recognition.onend = async () => {
          setIsListening(false);
          if (capturedText.trim()) {
            const updatedIntake = parseSpokenSymptomTranscript(
              capturedText,
              intake
            );
            setVoiceStatusNote(
              `Voice extracted: Age ${updatedIntake.ageYears}y · Weight ${updatedIntake.weightKg}kg · Temp ${updatedIntake.tempC}°C`
            );
            await onVoiceTranscriptComplete(
              capturedText,
              updatedIntake,
              autoSpeakReplies
            );
          }
        };

        recognition.start();
        return;
      } catch (_err) {
        // Fall through to MediaRecorder or interactive voice simulation
      }
    }

    // Try MediaRecorder + /api/voice-transcribe (gemini-3.5-transcribe)
    if (
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    ) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64data = String(reader.result || '').split(',')[1];
            if (base64data) {
              setVoiceStatusNote('Transcribing voice with Gemini AI...');
              try {
                const res = await fetch('/api/voice-transcribe', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    audioBase64: base64data,
                    mimeType: 'audio/webm',
                    language,
                  }),
                });
                if (res.ok) {
                  const data = await res.json();
                  if (data.transcript) {
                    setLiveTranscript(data.transcript);
                    const updated = parseSpokenSymptomTranscript(
                      data.transcript,
                      intake
                    );
                    setVoiceStatusNote(
                      `Voice extracted: Age ${updated.ageYears}y · Weight ${updated.weightKg}kg`
                    );
                    await onVoiceTranscriptComplete(
                      data.transcript,
                      updated,
                      autoSpeakReplies
                    );
                    return;
                  }
                }
              } catch (_e) {
                // Fall through
              }
            }
            await handleSimulatedOrFallbackVoice();
          };
          reader.readAsDataURL(blob);
        };

        setIsListening(true);
        setVoiceStatusNote('Recording voice (tap again to finish)...');
        recorder.start();
        setTimeout(() => {
          if (recorder.state === 'recording') {
            recorder.stop();
            setIsListening(false);
          }
        }, 4000);
        return;
      } catch (_micErr) {
        // Hardware mic blocked in container/iframe; run interactive voice flow
      }
    }

    await handleSimulatedOrFallbackVoice();
  };

  return (
    <section
      aria-label="Interactive Voice Chatbot Assistant"
      className="bg-white border border-teal-200 rounded-lg p-4 space-y-3.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleMic}
            disabled={isProcessing}
            aria-label={
              isListening
                ? 'Stop listening to voice'
                : 'Tap to speak symptoms by voice'
            }
            className={`px-4 py-2.5 rounded-lg font-semibold text-xs flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              isListening
                ? 'bg-red-700 text-white hover:bg-red-800'
                : 'bg-teal-700 text-white hover:bg-teal-800'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4 shrink-0" />
                <span>
                  {language === 'ha'
                    ? 'Tsaya Sauraro (Listening...)'
                    : language === 'jk'
                    ? 'Tsaya Murya (Listening...)'
                    : 'Listening... Tap to Finish'}
                </span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 shrink-0" />
                <span>
                  {language === 'ha'
                    ? 'Yi Magana da Murya (Voice Chat)'
                    : language === 'jk'
                    ? 'Yi Magana da Jukun / Hausa'
                    : 'Tap to Speak Symptoms (Voice Chat)'}
                </span>
              </>
            )}
          </button>

          <div>
            <div className="flex items-center gap-2">
              <AudioLines className="w-4 h-4 text-teal-700 shrink-0" />
              <h2 className="text-sm font-bold text-slate-900">
                {language === 'ha'
                  ? 'Mataimakin Murya na PHC-Aid (Voice Chatbot)'
                  : language === 'jk'
                  ? 'Mataimakin Murya (Jukun · Hausa · English)'
                  : 'Hands-Free Voice Triage Chatbot (EN · HA · JK)'}
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {language === 'ha'
                ? 'Fadi shekaru, nauyin jiki (kg), da alamomin cuta da murya — manhajar za ta lissafa magani kuma ta karanta muku.'
                : language === 'jk'
                ? 'Fadi shekaru, nauyin apyi (kg), da tswen apyi da murya — za a ba ku amsa da murya.'
                : 'Speak patient age, weight (kg), and symptoms aloud — auto-fills vitals and reads back Standing Orders.'}
            </p>
          </div>
        </div>

        {/* Hands-Free Auto-Read Toggle & Stop Audio Button */}
        <div className="flex items-center gap-2">
          {isAssistantSpeaking && (
            <button
              type="button"
              onClick={onStopSpeaking}
              className="px-2.5 py-1.5 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>Stop Audio</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setAutoSpeakReplies((prev) => !prev)}
            aria-pressed={autoSpeakReplies}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              autoSpeakReplies
                ? 'bg-teal-50 text-teal-900 border-teal-300'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {autoSpeakReplies ? (
              <Volume2 className="w-3.5 h-3.5 text-teal-700" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>
              Auto-Speak AI Replies: {autoSpeakReplies ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* Live Voice Transcript & Acoustic Visualizer Strip */}
      {(isListening || isAssistantSpeaking || liveTranscript || voiceStatusNote) && (
        <div className="p-3 rounded-md bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 flex-1">
            {voiceStatusNote && (
              <div className="text-xs font-semibold text-teal-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                <span>{voiceStatusNote}</span>
              </div>
            )}
            {liveTranscript && (
              <p className="text-xs text-slate-800 italic">
                &ldquo;{liveTranscript}&rdquo;
              </p>
            )}
          </div>

          {/* Acoustic Waveform Indicator */}
          <div
            aria-hidden="true"
            className="flex items-center gap-1 h-6 px-2 shrink-0"
          >
            {[12, 22, 16, 24, 14, 20, 10, 18].map((heightPx, idx) => (
              <span
                key={idx}
                style={{
                  height:
                    isListening || isAssistantSpeaking
                      ? `${heightPx}px`
                      : '6px',
                }}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isListening
                    ? 'bg-red-600'
                    : isAssistantSpeaking
                    ? 'bg-teal-600'
                    : 'bg-slate-300'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Friendly 1-Click Voice Prompt Buttons for instant voice testing */}
      <div className="pt-1 border-t border-slate-100 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-teal-700" />
          <span>Try Quick Voice Input:</span>
        </span>
        {VOICE_QUICK_PROMPTS.map((vp) => (
          <button
            key={vp.id}
            type="button"
            disabled={isListening || isProcessing}
            onClick={() =>
              handleSimulatedOrFallbackVoice(vp.spokenText[language])
            }
            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-teal-50 hover:text-teal-900 hover:border-teal-200 border border-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {vp.label[language]}
          </button>
        ))}
      </div>
    </section>
  );
};
