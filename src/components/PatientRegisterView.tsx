import React, { useState } from 'react';
import {
  Search,
  Download,
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Trash2,
  ArrowUpRight,
  Plus,
} from 'lucide-react';
import { AcuityLevel, SupportedLanguage } from '../utils/tarabaData';
import { PatientRecord } from '../utils/triageEngine';

interface PatientRegisterViewProps {
  language: SupportedLanguage;
  records: PatientRecord[];
  onSelectRecord: (record: PatientRecord) => void;
  onDeleteRecord: (id: string) => void;
  onSyncAllOffline: () => void;
  onStartNewTriage: () => void;
}

export const PatientRegisterView: React.FC<PatientRegisterViewProps> = ({
  records,
  onSelectRecord,
  onDeleteRecord,
  onSyncAllOffline,
  onStartNewTriage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [acuityFilter, setAcuityFilter] = useState<'ALL' | AcuityLevel>('ALL');
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const filteredRecords = records.filter((rec) => {
    const matchesAcuity =
      acuityFilter === 'ALL' || rec.acuity === acuityFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      rec.patientName.toLowerCase().includes(q) ||
      rec.primaryCondition.toLowerCase().includes(q) ||
      rec.lgaName.toLowerCase().includes(q) ||
      rec.localSummaryJk.toLowerCase().includes(q);
    return matchesAcuity && matchesSearch;
  });

  const emergencyCount = records.filter((r) => r.acuity === 'EMERGENCY').length;
  const cachedOfflineCount = records.filter(
    (r) => r.syncStatus === 'Cached Offline'
  ).length;

  const handleSyncClick = () => {
    onSyncAllOffline();
    setSyncNotice(
      'All locally cached PHC triage records synchronized with Taraba State DHIS2 buffer.'
    );
    setTimeout(() => setSyncNotice(null), 3500);
  };

  const handleExportCsv = () => {
    const headers = [
      'RecordID',
      'Timestamp',
      'PatientName',
      'AgeYears',
      'Sex',
      'WeightKg',
      'TempC',
      'LGA',
      'Acuity',
      'PrimarySuspect',
      'ReferralRequired',
      'SyncStatus',
    ];
    const rows = filteredRecords.map((r) => [
      r.id,
      r.timestampIso,
      `"${r.patientName.replace(/"/g, '""')}"`,
      r.ageYears,
      r.sex,
      r.weightKg,
      r.tempC,
      `"${r.lgaName}"`,
      r.acuity,
      `"${r.primaryCondition}"`,
      r.referralRequired ? 'YES' : 'NO',
      `"${r.syncStatus}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join(
      '\n'
    );
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `phc-aid-taraba-register.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white border border-slate-200 rounded-lg p-5">
        <div className="sm:border-r border-slate-100 sm:pr-4">
          <div className="text-xs text-slate-500">Total Triaged Patients</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {records.length}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Stored in offline-first browser storage
          </div>
        </div>

        <div className="sm:border-r border-slate-100 sm:pr-4">
          <div className="text-xs text-slate-500">Emergency Referrals</div>
          <div className="text-2xl font-bold text-red-700 font-mono tabular-nums mt-1">
            {emergencyCount}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Immediate hospital transfer required
          </div>
        </div>

        <div className="sm:border-r border-slate-100 sm:pr-4">
          <div className="text-xs text-slate-500">Pending Offline Sync</div>
          <div className="text-2xl font-bold text-amber-700 font-mono tabular-nums mt-1">
            {cachedOfflineCount}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Ready for DHIS2 / LGA DSNO upload
          </div>
        </div>

        <div className="flex flex-col justify-between items-start sm:items-end">
          <div className="text-xs text-slate-500">Surveillance Export</div>
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={handleSyncClick}
              disabled={cachedOfflineCount === 0}
              className="px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Offline Queue ({cachedOfflineCount})</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>
      </div>

      {syncNotice && (
        <div
          role="status"
          className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-900 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <label htmlFor="register-search-input" className="sr-only">
              Search patient name, LGA, or condition
            </label>
            <input
              id="register-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by patient name, Taraba LGA (e.g. Wukari, Jalingo), or diagnosis..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['ALL', 'EMERGENCY', 'PRIORITY', 'ROUTINE'] as const).map(
              (level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setAcuityFilter(level)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    acuityFilter === level
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {level === 'ALL' ? 'All Cases' : level}
                </button>
              )
            )}
          </div>
        </div>

        {/* High-Density Clinical Table or Empty State */}
        {filteredRecords.length === 0 ? (
          <div className="py-12 text-center space-y-3 border-t border-slate-100">
            <p className="text-sm font-medium text-slate-800">
              No matching patient triage records found
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Once you evaluate and save a patient case in the Triage Assistant,
              their weight-based standing orders and referral status will appear here.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setAcuityFilter('ALL');
                  onStartNewTriage();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Log First Entry</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-md">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-2.5 px-3">Patient</th>
                  <th className="py-2.5 px-3">LGA / Facility</th>
                  <th className="py-2.5 px-3 text-right">Age / Wt / Temp</th>
                  <th className="py-2.5 px-3">Acuity</th>
                  <th className="py-2.5 px-3">Suspected Condition (EN / JK)</th>
                  <th className="py-2.5 px-3">Offline Queue Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredRecords.map((rec) => (
                  <tr
                    key={rec.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {rec.patientName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {rec.lgaName} LGA
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                      {rec.ageYears}y · {rec.sex} · {rec.weightKg}kg ·{' '}
                      {rec.tempC.toFixed(1)}°C
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          rec.acuity === 'EMERGENCY'
                            ? 'text-red-700'
                            : rec.acuity === 'PRIORITY'
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {rec.acuity === 'EMERGENCY' ? (
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        ) : rec.acuity === 'PRIORITY' ? (
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>{rec.acuity}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-900">
                        {rec.primaryCondition}
                      </div>
                      <div className="text-slate-500">
                        Jukun: {rec.localSummaryJk}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {rec.syncStatus}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectRecord(rec)}
                          aria-label={`Open triage assessment for ${rec.patientName}`}
                          className="px-2.5 py-1 text-xs font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 rounded border border-teal-200 transition-colors inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                        >
                          <span>Load Case</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteRecord(rec.id)}
                          aria-label={`Delete record for ${rec.patientName}`}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
