import React, { useState } from 'react';
import { Search, Volume2, MessageSquarePlus, Languages } from 'lucide-react';
import {
  PHRASEBOOK_ENTRIES,
  PhrasebookEntry,
  SupportedLanguage,
} from '../utils/tarabaData';

interface PhrasebookViewProps {
  language: SupportedLanguage;
  onSpeakText: (text: string, lang: SupportedLanguage) => void;
  speakingId: string | null;
  onUsePhraseInChat: (phraseText: string) => void;
}

export const PhrasebookView: React.FC<PhrasebookViewProps> = ({
  onSpeakText,
  speakingId,
  onUsePhraseInChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<
    'ALL' | PhrasebookEntry['category']
  >('ALL');

  const filteredPhrases = PHRASEBOOK_ENTRIES.filter((entry) => {
    const matchesCat =
      categoryFilter === 'ALL' || entry.category === categoryFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      entry.en.toLowerCase().includes(q) ||
      entry.ha.toLowerCase().includes(q) ||
      entry.jk.toLowerCase().includes(q) ||
      entry.clinicalContext.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <Languages className="w-5 h-5 text-teal-700 shrink-0" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                English · Hausa · Jukun (Wapan) Clinical Triage Phrasebook
              </h2>
              <p className="text-xs text-slate-500">
                Field-tested medical communication phrases for non-indigenous or visiting health workers in Taraba State PHCs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                { id: 'ALL', label: 'All Phrases' },
                { id: 'greeting', label: 'Intake & Greeting' },
                { id: 'symptoms', label: 'Symptom History' },
                { id: 'danger', label: 'IMCI Danger Signs' },
                { id: 'counseling', label: 'Dosage & Referral' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  categoryFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <label htmlFor="phrasebook-search-input" className="sr-only">
            Search English, Hausa, or Jukun clinical phrases
          </label>
          <input
            id="phrasebook-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search phrases in English, Hausa (e.g. zazzabi, amai), or Jukun (e.g. apyi fye, kwe, nyiokwu)..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
          />
        </div>

        <div className="divide-y divide-slate-200 border border-slate-200 rounded-md">
          {filteredPhrases.map((entry) => (
            <div key={entry.id} className="p-4 space-y-3 hover:bg-slate-50/60">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-slate-500">
                  <span>{entry.clinicalContext}</span>
                  <span aria-hidden="true"> · </span>
                  <span>Category: {entry.category}</span>
                </div>

                <button
                  type="button"
                  onClick={() => onUsePhraseInChat(entry.jk)}
                  className="px-2.5 py-1 text-xs font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 rounded border border-teal-200 transition-colors inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                  <span>Send to Triage Chat</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* English */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      English
                    </span>
                    <button
                      type="button"
                      onClick={() => onSpeakText(entry.en, 'en')}
                      aria-label={`Speak English phrase: ${entry.en}`}
                      className="text-xs text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-teal-700" />
                      <span>
                        {speakingId === entry.en.slice(0, 24)
                          ? 'Playing'
                          : 'Audio'}
                      </span>
                    </button>
                  </div>
                  <p className="text-sm font-medium text-slate-900">
                    {entry.en}
                  </p>
                </div>

                {/* Hausa */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      Hausa (Harshen Hausa)
                    </span>
                    <button
                      type="button"
                      onClick={() => onSpeakText(entry.ha, 'ha')}
                      aria-label={`Speak Hausa phrase: ${entry.ha}`}
                      className="text-xs text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-teal-700" />
                      <span>
                        {speakingId === entry.ha.slice(0, 24)
                          ? 'Playing'
                          : 'Audio'}
                      </span>
                    </button>
                  </div>
                  <p className="text-sm font-medium text-slate-900">
                    {entry.ha}
                  </p>
                </div>

                {/* Jukun (Wapan) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-teal-800">
                      Jukun (Wapan / Takum)
                    </span>
                    <button
                      type="button"
                      onClick={() => onSpeakText(entry.jk, 'jk')}
                      aria-label={`Speak Jukun phrase: ${entry.jk}`}
                      className="text-xs text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-teal-700" />
                      <span>
                        {speakingId === entry.jk.slice(0, 24)
                          ? 'Playing'
                          : 'Audio'}
                      </span>
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-teal-950">
                    {entry.jk}
                  </p>
                  <p className="text-xs font-mono text-slate-500">
                    Pronunciation: [{entry.jkPhonetic}]
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
