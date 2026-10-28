import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateWeightBasedDosage,
  evaluateOfflineTriage,
  createInitialPatientRegister,
  parseSpokenSymptomTranscript,
  PRESET_CLINICAL_SCENARIOS,
} from './triageEngine';

test('ACT weight-based dosing matches Nigeria National Standing Orders across weight bands', () => {
  const band1 = calculateWeightBasedDosage(10, 2, 'uncomplicated_malaria');
  assert.ok(band1[0].dosePerAdministration.includes('1 tablet (20mg / 120mg)'));

  const band2 = calculateWeightBasedDosage(19, 6, 'uncomplicated_malaria');
  assert.ok(band2[0].dosePerAdministration.includes('2 tablets (40mg / 240mg)'));

  const band3 = calculateWeightBasedDosage(28, 10, 'uncomplicated_malaria');
  assert.ok(band3[0].dosePerAdministration.includes('3 tablets (60mg / 360mg)'));

  const band4 = calculateWeightBasedDosage(60, 29, 'uncomplicated_malaria');
  assert.ok(band4[0].dosePerAdministration.includes('4 tablets (80mg / 480mg)'));
});

test('Pre-referral Injectable Artesunate differentiates <20kg (3.0 mg/kg) vs >=20kg (2.4 mg/kg)', () => {
  const child = calculateWeightBasedDosage(13, 3, 'severe_malaria');
  assert.ok(child[0].dosePerAdministration.includes('39 mg (3 mg/kg)'));

  const adult = calculateWeightBasedDosage(50, 25, 'severe_malaria');
  assert.ok(adult[0].dosePerAdministration.includes('120 mg (2.4 mg/kg)'));
});

test('ORS Plan B fluid calculation computes 75 mL/kg over 4 hours', () => {
  const choleraDosing = calculateWeightBasedDosage(20, 7, 'cholera_awd');
  assert.ok(choleraDosing[0].dosePerAdministration.includes('1500 mL over first 4 hours'));
  assert.ok(choleraDosing[1].dosePerAdministration.includes('20 mg'));
});

test('evaluateOfflineTriage classifies convulsions + high fever as EMERGENCY Severe Malaria', () => {
  const res = evaluateOfflineTriage(
    {
      patientName: 'Blessing Nyako',
      ageYears: 3,
      sex: 'F',
      weightKg: 13,
      tempC: 39.8,
      muacCm: 12.6,
      facilityId: 'phc-takum',
      selectedSymptoms: ['high_fever', 'convulsions'],
      freeTextSymptoms: 'Child has apyi fye and gba apyi (convulsions)',
    },
    'jk'
  );

  assert.equal(res.acuity, 'EMERGENCY');
  assert.equal(res.primaryDiagnosis.protocolId, 'severe_malaria');
  assert.equal(res.referralRequired, true);
  assert.ok(res.dangerSigns.length >= 2);
  assert.ok(res.assistantReply.includes('Apyi Fye Afin Ukwu'));
});

test('evaluateOfflineTriage detects suspected Lassa Fever from fever + mucosal bleeding in Jalingo', () => {
  const res = evaluateOfflineTriage(
    {
      patientName: 'Suleiman Danjuma',
      ageYears: 28,
      sex: 'M',
      weightKg: 64,
      tempC: 39.2,
      facilityId: 'phc-jalingo',
      selectedSymptoms: ['high_fever', 'unexplained_bleeding'],
      freeTextSymptoms: 'Zazzabi da zubar jini daga hanci',
    },
    'ha'
  );

  assert.equal(res.acuity, 'EMERGENCY');
  assert.equal(res.primaryDiagnosis.protocolId, 'lassa_fever');
  assert.ok(res.referralHospital.includes('FMC') || res.referralHospital.includes('Jalingo'));
});

test('createInitialPatientRegister populates 4 seeded Taraba PHC patient records and handles Hausa negation (ba amai)', () => {
  const records = createInitialPatientRegister();
  assert.equal(records.length, 4);
  assert.equal(records[0].lgaName, 'Wukari');
  assert.equal(records[0].patientName, 'Aku Adi-Agbu');
  assert.equal(records[0].acuity, 'ROUTINE');
  assert.equal(records[0].assessment.primaryDiagnosis.protocolId, 'uncomplicated_malaria');
  assert.equal(records[0].assessment.dangerSigns.length, 0);
});

test('parseSpokenSymptomTranscript extracts age, weight, temperature, and symptoms from Hausa/Jukun/English speech', () => {
  const base = PRESET_CLINICAL_SCENARIOS[0].intake;
  const parsed = parseSpokenSymptomTranscript(
    'Gaggawa! Angwu shekara 2 nauyin kilo 12 yana da apyi fye 39.9 da gba apyi da kwe kwarai.',
    base
  );
  assert.equal(parsed.ageYears, 2);
  assert.equal(parsed.weightKg, 12);
  assert.equal(parsed.tempC, 39.9);
  assert.ok(parsed.selectedSymptoms.includes('convulsions'));
  assert.ok(parsed.selectedSymptoms.includes('persistent_vomiting'));
});
