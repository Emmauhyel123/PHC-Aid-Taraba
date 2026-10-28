import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calculator,
  Volume2,
  BookOpen,
} from 'lucide-react';
import {
  SupportedLanguage,
  TROPICAL_PROTOCOLS,
  TropicalProtocol,
} from '../utils/tarabaData';
import { calculateWeightBasedDosage } from '../utils/triageEngine';

interface DiseaseProtocolsViewProps {
  language: SupportedLanguage;
  onSpeakText: (text: string, lang: SupportedLanguage) => void;
  speakingId: string | null;
}

export const DiseaseProtocolsView: React.FC<DiseaseProtocolsViewProps> = ({
  language,
  onSpeakText,
  speakingId,
}) => {
  const [selectedProtocolId, setSelectedProtocolId] = useState<string>(
    TROPICAL_PROTOCOLS[0].id
  );
  const [calcWeightKg, setCalcWeightKg] = useState<number>(18);
  const [calcAgeYears, setCalcAgeYears] = useState<number>(5);

  const selectedProto: TropicalProtocol =
    TROPICAL_PROTOCOLS.find((p) => p.id === selectedProtocolId) ||
    TROPICAL_PROTOCOLS[0];

  const calculatedDoses = calculateWeightBasedDosage(
    calcWeightKg,
    calcAgeYears,
    selectedProto.id,
    false
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Sidebar: 8 Endemic Tropical Disease Protocols */}
      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <div className="border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-teal-700" />
            <h2 className="text-sm font-semibold text-slate-900">
              Nigeria PHC Standing Orders
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Select a tropical disease protocol for Taraba State PHCs
          </p>
        </div>

        <div className="space-y-1.5">
          {TROPICAL_PROTOCOLS.map((proto) => {
            const isActive = proto.id === selectedProto.id;
            return (
              <button
                key={proto.id}
                type="button"
                onClick={() => setSelectedProtocolId(proto.id)}
                className={`w-full text-left p-3 rounded-md border transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold">
                    {proto.name[language]}
                  </span>
                  <span
                    className={`text-xs font-mono shrink-0 ${
                      isActive
                        ? 'text-slate-300'
                        : proto.acuityDefault === 'EMERGENCY'
                        ? 'text-red-700 font-semibold'
                        : proto.acuityDefault === 'PRIORITY'
                        ? 'text-amber-700 font-semibold'
                        : 'text-emerald-700 font-semibold'
                    }`}
                  >
                    {proto.acuityDefault}
                  </span>
                </div>
                <div
                  className={`text-xs mt-1 ${
                    isActive ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  Hausa: {proto.localTerm.ha} · Jukun: {proto.localTerm.jk}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Detail View: Selected Protocol & Weight-Band Dosage Calculator */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Taraba Epidemiological Standing Order</span>
                <span aria-hidden="true">·</span>
                <span>Hausa: {selectedProto.localTerm.ha}</span>
                <span aria-hidden="true">·</span>
                <span>Jukun: {selectedProto.localTerm.jk}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-1">
                {selectedProto.name[language]}
              </h3>
            </div>

            <div
              className={`px-3 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 shrink-0 ${
                selectedProto.acuityDefault === 'EMERGENCY'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : selectedProto.acuityDefault === 'PRIORITY'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              {selectedProto.acuityDefault === 'EMERGENCY' ? (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              ) : selectedProto.acuityDefault === 'PRIORITY' ? (
                <Clock className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span>Baseline Acuity: {selectedProto.acuityDefault}</span>
            </div>
          </div>

          {/* Endemic Surveillance Context */}
          <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 border border-slate-200 rounded-md p-3.5">
            <strong className="text-slate-900">
              Taraba State Surveillance Context:
            </strong>{' '}
            {selectedProto.endemicNoteTaraba}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-900">
                1. Mandatory Rapid Diagnostic / Lab Checks
              </h4>
              <ul className="text-xs text-slate-700 space-y-1.5 pl-4 list-disc">
                {selectedProto.diagnosticTests.map((test, i) => (
                  <li key={i}>{test}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-red-900 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-700" />
                <span>2. IMCI / Standing Order Danger Signs</span>
              </h4>
              <ul className="text-xs text-red-800 space-y-1.5 pl-4 list-disc">
                {selectedProto.dangerSigns.map((ds, i) => (
                  <li key={i}>{ds}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-100">
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-slate-900">
                3. First-Line Standing Order Regimen
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                {selectedProto.firstLineStandingOrder}
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-slate-900">
                4. Immediate Pre-Referral / PHC Action
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                {selectedProto.preReferralAction}
              </p>
            </div>
          </div>

          {/* Interactive Weight-Band Dosage Calculator */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-teal-700" />
                <h4 className="text-sm font-semibold text-slate-900">
                  Interactive Weight-Based Standing Orders Dosage Calculator
                </h4>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <label
                    htmlFor="proto-calc-weight"
                    className="text-xs font-medium text-slate-700"
                  >
                    Weight (kg):
                  </label>
                  <input
                    id="proto-calc-weight"
                    type="number"
                    min={3}
                    max={140}
                    value={calcWeightKg}
                    onChange={(e) =>
                      setCalcWeightKg(parseFloat(e.target.value) || 10)
                    }
                    className="w-20 px-2.5 py-1 text-xs font-mono tabular-nums bg-slate-50 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <label
                    htmlFor="proto-calc-age"
                    className="text-xs font-medium text-slate-700"
                  >
                    Age (yrs):
                  </label>
                  <input
                    id="proto-calc-age"
                    type="number"
                    min={0.2}
                    max={100}
                    step="any"
                    value={calcAgeYears}
                    onChange={(e) =>
                      setCalcAgeYears(parseFloat(e.target.value) || 1)
                    }
                    className="w-16 px-2.5 py-1 text-xs font-mono tabular-nums bg-slate-50 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-md">
              {calculatedDoses.map((d, i) => (
                <div key={i} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-slate-900">
                      {d.medication}
                    </div>
                    <div className="text-xs text-slate-600">{d.schedule}</div>
                    <div className="text-xs text-slate-500">{d.clinicalNote}</div>
                  </div>
                  <div className="sm:text-right shrink-0">
                    <div className="text-xs font-mono font-bold text-teal-800 tabular-nums">
                      {d.dosePerAdministration}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      Route: {d.route}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trilingual Counseling Comparison */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h4 className="text-xs font-semibold text-slate-900">
              Trilingual Caregiver Counseling (English · Hausa · Jukun Wapan)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(['en', 'ha', 'jk'] as SupportedLanguage[]).map((langKey) => (
                <div
                  key={langKey}
                  className="p-3 rounded-md bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-900 mb-1">
                      {langKey === 'en'
                        ? 'English'
                        : langKey === 'ha'
                        ? 'Hausa (Harshen Hausa)'
                        : 'Jukun (Wapan / Takum)'}
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {selectedProto.counselingSummary[langKey]}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onSpeakText(
                        selectedProto.counselingSummary[langKey],
                        langKey
                      )
                    }
                    className="self-start px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors inline-flex items-center gap-1"
                  >
                    <Volume2 className="w-3 h-3 text-teal-700" />
                    <span>
                      {speakingId ===
                      selectedProto.counselingSummary[langKey].slice(0, 24)
                        ? 'Speaking...'
                        : `Play ${langKey.toUpperCase()}`}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
