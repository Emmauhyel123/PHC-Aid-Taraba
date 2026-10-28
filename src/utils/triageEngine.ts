import {
  AcuityLevel,
  SupportedLanguage,
  SYMPTOM_CHIPS,
  TARABA_FACILITIES,
  TROPICAL_PROTOCOLS,
} from './tarabaData';

export interface PatientIntake {
  patientName: string;
  ageYears: number;
  sex: 'F' | 'M';
  weightKg: number;
  tempC: number;
  muacCm?: number;
  isPregnant?: boolean;
  facilityId: string;
  selectedSymptoms: string[];
  freeTextSymptoms: string;
}

export interface DosageRecommendation {
  medication: string;
  dosePerAdministration: string;
  schedule: string;
  route: 'Oral' | 'IM/IV Pre-Referral' | 'Supportive';
  clinicalNote: string;
}

export interface DifferentialDiagnosis {
  protocolId: string;
  conditionName: string;
  localNameHa: string;
  localNameJk: string;
  confidencePct: number;
  rationale: string;
  requiredRdtOrLab: string;
}

export interface TriageAssessmentResult {
  id: string;
  timestampIso: string;
  acuity: AcuityLevel;
  acuityScore: number;
  primaryDiagnosis: DifferentialDiagnosis;
  differentials: DifferentialDiagnosis[];
  dangerSigns: string[];
  dosagePlan: DosageRecommendation[];
  immediateStandingOrders: string[];
  referralRequired: boolean;
  referralHospital: string;
  referralDistanceKm: number;
  counselingTrilingual: Record<SupportedLanguage, string>;
  assistantReply: string;
  engineSource: 'offline-standing-orders' | 'gemini-hybrid';
}

export interface PatientRecord {
  id: string;
  timestampIso: string;
  patientName: string;
  ageYears: number;
  sex: 'F' | 'M';
  weightKg: number;
  tempC: number;
  facilityId: string;
  lgaName: string;
  acuity: AcuityLevel;
  primaryCondition: string;
  localSummaryJk: string;
  referralRequired: boolean;
  syncStatus: 'Cached Offline' | 'Synced to DHIS2/PHC';
  intake: PatientIntake;
  assessment: TriageAssessmentResult;
}

/**
 * Pure weight-based dosage calculator following Nigeria National Standing Orders
 * & WHO IMCI guidelines for Primary Health Centers.
 */
export function calculateWeightBasedDosage(
  weightKg: number,
  ageYears: number,
  protocolId: string,
  isPregnant = false
): DosageRecommendation[] {
  const safeWeight = Math.max(2.5, Math.min(150, Number(weightKg) || 15));
  const paracetamolMg = Math.min(1000, Math.round(safeWeight * 15));
  const recommendations: DosageRecommendation[] = [];

  if (protocolId === 'uncomplicated_malaria') {
    if (safeWeight < 5) {
      recommendations.push({
        medication: 'Oral Artesunate + Amodiaquine / Specialist Infant Regimen',
        dosePerAdministration: `Weight ${safeWeight} kg (< 5 kg threshold)`,
        schedule: 'Refer to Medical Officer / Pediatric unit for infant < 5 kg',
        route: 'Oral',
        clinicalNote:
          'Infants < 5 kg require supervised pediatric antimalarial dosing after mRDT confirmation.',
      });
    } else {
      let tabletsPerDose = 1;
      let totalTablets = 6;
      if (safeWeight >= 5 && safeWeight < 15) {
        tabletsPerDose = 1;
        totalTablets = 6;
      } else if (safeWeight >= 15 && safeWeight < 25) {
        tabletsPerDose = 2;
        totalTablets = 12;
      } else if (safeWeight >= 25 && safeWeight < 35) {
        tabletsPerDose = 3;
        totalTablets = 18;
      } else {
        tabletsPerDose = 4;
        totalTablets = 24;
      }

      recommendations.push({
        medication: 'Artemether-Lumefantrine (ACT 20mg/120mg)',
        dosePerAdministration: `${tabletsPerDose} tablet${tabletsPerDose > 1 ? 's' : ''} (${tabletsPerDose * 20}mg / ${tabletsPerDose * 120}mg)`,
        schedule: `Twice daily for 3 days (0h, 8h, 24h, 36h, 48h, 60h — Total ${totalTablets} tabs)`,
        route: 'Oral',
        clinicalNote: isPregnant
          ? 'Safe in 2nd/3rd trimester; in 1st trimester verify current NMEP ACT/Quinine guidance.'
          : 'Administer first dose at PHC under Direct Observation (DOT) with milk or food.',
      });
    }

    recommendations.push({
      medication: 'Paracetamol (Acetaminophen)',
      dosePerAdministration: `${paracetamolMg} mg`,
      schedule: 'Every 6 to 8 hours when axillary temp >= 38.5°C',
      route: 'Oral',
      clinicalNote: `Calculated at 15 mg/kg for ${safeWeight} kg body weight. Tepid sponge if fever persists.`,
    });
  } else if (protocolId === 'severe_malaria') {
    const mgPerKg = safeWeight < 20 ? 3.0 : 2.4;
    const artesunateMg = Number((safeWeight * mgPerKg).toFixed(1));
    recommendations.push({
      medication: 'Injectable Artesunate (Pre-Referral Stat Dose)',
      dosePerAdministration: `${artesunateMg} mg (${mgPerKg} mg/kg)`,
      schedule: 'IM (anterior thigh) or slow IV stat at 0h, 12h, 24h before/during referral',
      route: 'IM/IV Pre-Referral',
      clinicalNote:
        safeWeight < 20
          ? 'Children < 20 kg require 3.0 mg/kg per dose to achieve therapeutic exposure.'
          : 'Patients >= 20 kg receive 2.4 mg/kg per dose.',
    });

    if (ageYears < 6) {
      const rectalMg = Math.round(safeWeight * 10);
      recommendations.push({
        medication: 'Rectal Artesunate Suppository (If IM/IV unavailable)',
        dosePerAdministration: `${rectalMg} mg (~10 mg/kg)`,
        schedule: 'Single pre-referral rectal insertion; hold buttocks together for 10 mins',
        route: 'IM/IV Pre-Referral',
        clinicalNote: 'Use only when injectable Artesunate cannot be given immediately.',
      });
    }

    recommendations.push({
      medication: '10% Dextrose Bolus (Hypoglycemia Prevention)',
      dosePerAdministration: `${Math.round(safeWeight * 5)} mL IV (5 mL/kg)`,
      schedule: 'Stat if blood glucose < 2.5 mmol/L or patient is comatose/convulsing',
      route: 'IM/IV Pre-Referral',
      clinicalNote: 'Sublingual sugar water may be used while securing IV access.',
    });
  } else if (protocolId === 'cholera_awd') {
    const orsFourHourMl = Math.round(safeWeight * 75);
    const zincMg = ageYears < 0.5 ? 10 : 20;
    recommendations.push({
      medication: 'Low-Osmolarity Oral Rehydration Salts (WHO Plan B)',
      dosePerAdministration: `${orsFourHourMl} mL over first 4 hours`,
      schedule: `75 mL/kg over 4 hours, plus ${safeWeight < 10 ? '50–100 mL' : '100–200 mL'} after every loose stool`,
      route: 'Oral',
      clinicalNote: 'If vomiting occurs, wait 10 minutes then resume ORS slowly by spoon.',
    });
    recommendations.push({
      medication: 'Oral Zinc Sulfate Dispersible Tablet',
      dosePerAdministration: `${zincMg} mg`,
      schedule: 'Once daily for 10 to 14 consecutive days',
      route: 'Oral',
      clinicalNote: 'Reduces diarrhea duration and prevents recurrence for 2–3 months.',
    });
    const rlTotalMl = Math.round(safeWeight * 100);
    recommendations.push({
      medication: 'Ringer’s Lactate IV (WHO Plan C if Severe Dehydration)',
      dosePerAdministration: `${rlTotalMl} mL total (100 mL/kg)`,
      schedule:
        ageYears < 1
          ? '30 mL/kg in 1 hour, then 70 mL/kg over 5 hours'
          : '30 mL/kg in 30 mins, then 70 mL/kg over 2.5 hours',
      route: 'IM/IV Pre-Referral',
      clinicalNote: 'Monitor radial pulse and respiratory rate every 15–30 minutes.',
    });
  } else if (protocolId === 'typhoid_fever') {
    if (isPregnant || ageYears < 12) {
      const azithroMg = Math.min(500, Math.round(safeWeight * 20));
      recommendations.push({
        medication: 'Oral Azithromycin',
        dosePerAdministration: `${azithroMg} mg (20 mg/kg, max 500 mg)`,
        schedule: 'Once daily for 7 days',
        route: 'Oral',
        clinicalNote: 'Preferred in pregnancy and young children per Standing Orders.',
      });
    } else {
      const ciproMg = Math.min(500, Math.round(safeWeight * 15));
      recommendations.push({
        medication: 'Oral Ciprofloxacin',
        dosePerAdministration: `${ciproMg} mg (15 mg/kg, max 500 mg)`,
        schedule: 'Twice daily (every 12 hours) for 7 to 10 days',
        route: 'Oral',
        clinicalNote: 'Ensure negative mRDT or treat co-existing Malaria concurrently if mRDT+.',
      });
    }
    recommendations.push({
      medication: 'Paracetamol (Acetaminophen)',
      dosePerAdministration: `${paracetamolMg} mg`,
      schedule: 'Every 6 to 8 hours for fever and headache',
      route: 'Oral',
      clinicalNote: 'Avoid NSAIDs (Ibuprofen/Diclofenac) due to gastric bleeding/perforation risk.',
    });
  } else if (protocolId === 'meningitis_csm') {
    const ceftriaxoneMg = Math.min(2000, Math.round(safeWeight * 100));
    recommendations.push({
      medication: 'Pre-Referral Injectable Ceftriaxone',
      dosePerAdministration: `${ceftriaxoneMg} mg (100 mg/kg, max 2000 mg)`,
      schedule: 'Single deep IM or slow IV stat dose prior to immediate hospital transfer',
      route: 'IM/IV Pre-Referral',
      clinicalNote: 'Do not delay antibiotic injection while awaiting transport.',
    });
  } else if (protocolId === 'snakebite_envenomation') {
    recommendations.push({
      medication: 'Polyvalent / Monovalent EchiTAb Antivenom (At Referral Hospital)',
      dosePerAdministration: '10–20 mL IV per Referral Hospital 20WBCT Protocol',
      schedule: 'Immediate transfer required; repeat 20WBCT every 6 hours at hospital',
      route: 'IM/IV Pre-Referral',
      clinicalNote:
        'At PHC: Immobilize limb with splint, give Paracetamol (NO Aspirin/Ibuprofen), NO tourniquet.',
    });
    recommendations.push({
      medication: 'Paracetamol (Analgesia)',
      dosePerAdministration: `${paracetamolMg} mg`,
      schedule: 'Every 6 hours for severe bite pain',
      route: 'Oral',
      clinicalNote: 'Strictly avoid Aspirin or Diclofenac as they worsen carpet viper bleeding.',
    });
  } else if (protocolId === 'lassa_fever') {
    const ribavirinLoadMg = Math.min(2000, Math.round(safeWeight * 33));
    recommendations.push({
      medication: 'Strict Barrier Nursing + IV Ribavirin (At FMC Jalingo Isolation Unit)',
      dosePerAdministration: `Loading dose ~${ribavirinLoadMg} mg (33 mg/kg) at Treatment Center`,
      schedule: 'Immediate isolation and DSNO ambulance transfer to FMC Jalingo',
      route: 'IM/IV Pre-Referral',
      clinicalNote:
        'Do NOT give IM injections if bleeding is active; maintain oral/IV hydration with full PPE.',
    });
  } else {
    const praziMg = Math.round(safeWeight * 40);
    const praziTabs = Math.max(1, Math.round((praziMg / 600) * 2) / 2);
    recommendations.push({
      medication: 'Oral Praziquantel (600mg scored tablets)',
      dosePerAdministration: `${praziMg} mg (~${praziTabs} tablet${praziTabs > 1 ? 's' : ''} of 600mg)`,
      schedule: 'Single oral dose taken immediately after a full meal',
      route: 'Oral',
      clinicalNote: 'Calculated at 40 mg/kg for Schistosoma haematobium / mansoni.',
    });
  }

  return recommendations;
}

/**
 * Pure clinical triage evaluation engine operating 100% offline using
 * Nigeria National Standing Orders & WHO IMCI decision trees.
 */
export function evaluateOfflineTriage(
  intake: PatientIntake,
  language: SupportedLanguage
): TriageAssessmentResult {
  const textLower = (intake.freeTextSymptoms || '').toLowerCase();
  const chips = new Set(intake.selectedSymptoms);

  // Keyword detection across English, Hausa, and Jukun
  const hasFever =
    chips.has('high_fever') ||
    chips.has('chills_rigors') ||
    chips.has('stepwise_fever_abdominal') ||
    intake.tempC >= 37.8 ||
    /fever|hot|zazzabi|apyi fye|chills|sanyi|rigor|malaria|sauro/.test(textLower);

  const hasConvulsions =
    chips.has('convulsions') ||
    (!/no convuls|without convuls|ba farfadiya|babu farfadiya|ba gba apyi/.test(textLower) &&
      /convuls|fit|seizure|farfadiya|jijjiga|gba apyi|unconscious|coma|suma/.test(textLower));

  const hasVomitingEverything =
    chips.has('persistent_vomiting') ||
    (!/no vomit|without vomit|ba amai|babu amai|ba kwe/.test(textLower) &&
      /vomit|amai|kwe/.test(textLower));

  const hasBleeding =
    chips.has('unexplained_bleeding') ||
    (!/no bleed|without bleed|ba zubar jini|babu zubar jini|ba asa furu/.test(textLower) &&
      /bleed|blood from gum|nosebleed|zubar jini|asa furu|lassa|beraye|hemorrhag/.test(textLower));

  const hasWateryDiarrhea =
    chips.has('watery_diarrhea') ||
    /diarrh|gudawa|sa afu|rice water|cholera|kwalara|stool/.test(textLower);

  const hasDehydration =
    chips.has('sunken_eyes_thirst') ||
    /sunken|dehydrat|kishirwa|ayin gbari|letharg/.test(textLower);

  const hasStiffNeck =
    chips.has('stiff_neck_photophobia') ||
    /stiff neck|meningit|sankarau|taurin wuya|kpakpa akyo|fontanelle/.test(textLower);

  const hasSnakebite =
    chips.has('snakebite_fang_swelling') ||
    /snake|maciji|nyiokwu|viper|fang|bite|kububuwa/.test(textLower);

  const hasHematuria =
    chips.has('blood_in_urine') ||
    /urine|hematuria|fitsarin jini|tsargiya|asa mbyen|bilharz|schisto/.test(textLower);

  const hasProlongedFeverAbdominal =
    chips.has('stepwise_fever_abdominal') ||
    /typhoid|taifod|stomach pain|abdominal|ciwon ciki|tswen afu/.test(textLower);

  // Collect Danger Signs
  const dangerSigns: string[] = [];
  if (hasConvulsions) {
    dangerSigns.push('IMCI General Danger Sign: Convulsions / altered consciousness');
  }
  if (hasVomitingEverything) {
    dangerSigns.push('IMCI General Danger Sign: Persistent vomiting / unable to retain oral meds');
  }
  if (hasBleeding) {
    dangerSigns.push('VHF / Coagulopathy Red Flag: Unexplained mucosal or GI bleeding');
  }
  if (hasStiffNeck) {
    dangerSigns.push('Neurological Emergency: Neck stiffness / suspected Meningitis (Sankarau)');
  }
  if (hasSnakebite) {
    dangerSigns.push('Envenomation Red Flag: Suspected Carpet Viper (Echis ocellatus) bite');
  }
  if (hasDehydration) {
    dangerSigns.push('Severe Dehydration Red Flag: Sunken eyes / delayed skin pinch');
  }
  if (intake.tempC >= 39.5) {
    dangerSigns.push(`Hyperpyrexia Alert: Axillary temperature ${intake.tempC.toFixed(1)}°C (>= 39.5°C)`);
  }
  if (intake.muacCm !== undefined && intake.muacCm > 0 && intake.muacCm < 11.5 && intake.ageYears <= 5) {
    dangerSigns.push(`Severe Acute Malnutrition (SAM): MUAC ${intake.muacCm} cm (< 11.5 cm)`);
  }
  if (intake.isPregnant && (hasFever || hasBleeding || hasConvulsions)) {
    dangerSigns.push('High-Risk Obstetric Alert: Febrile or hemorrhagic illness in pregnancy');
  }

  // Score candidate protocols
  let primaryProtocolId = 'uncomplicated_malaria';
  const scored: { id: string; score: number; rationale: string }[] = [];

  if (hasSnakebite) {
    scored.push({
      id: 'snakebite_envenomation',
      score: 96,
      rationale:
        'History of snakebite with local swelling/bleeding in the Benue–Taraba valley strongly indicates Echis ocellatus (carpet viper) envenomation.',
    });
  }

  if (hasBleeding && hasFever && !hasSnakebite) {
    scored.push({
      id: 'lassa_fever',
      score: 94,
      rationale:
        'Fever accompanied by mucosal/GI bleeding in a Lassa-endemic Taraba LGA triggers immediate NCDC viral hemorrhagic fever isolation.',
    });
  }

  if (hasStiffNeck) {
    scored.push({
      id: 'meningitis_csm',
      score: 93,
      rationale:
        'Acute fever with neck stiffness (Taurin Wuya / Kpakpa Akyo) indicates suspected Acute Bacterial Meningitis.',
    });
  }

  if (hasFever && (hasConvulsions || intake.tempC >= 39.5 || (hasVomitingEverything && !hasWateryDiarrhea))) {
    scored.push({
      id: 'severe_malaria',
      score: 91,
      rationale:
        'Acute febrile illness complicated by IMCI general danger signs (convulsions, hyperpyrexia, or intractable vomiting) requires emergency parenteral Artesunate.',
    });
  }

  if (hasWateryDiarrhea) {
    scored.push({
      id: 'cholera_awd',
      score: hasDehydration ? 90 : 84,
      rationale:
        'Profuse acute watery diarrhea requires immediate WHO Plan B/C rehydration and cholera surveillance in riverine Taraba wards.',
    });
  }

  if (hasProlongedFeverAbdominal) {
    scored.push({
      id: 'typhoid_fever',
      score: 82,
      rationale:
        'Prolonged stepwise fever with abdominal pain suggests Enteric (Typhoid) Fever; always run mRDT concurrently to exclude malaria co-infection.',
    });
  }

  if (hasHematuria && !hasFever) {
    scored.push({
      id: 'schistosomiasis',
      score: 86,
      rationale:
        'Terminal hematuria (Fitsarin Jini / Asa Mbyen) without acute systemic danger signs is classic for urinary Schistosoma haematobium.',
    });
  }

  if (hasFever || scored.length === 0) {
    scored.push({
      id: 'uncomplicated_malaria',
      score: dangerSigns.length === 0 ? 88 : 72,
      rationale:
        'Fever, chills, headache, or bitter taste without general danger signs warrants immediate mRDT testing and weight-based ACT per Standing Orders.',
    });
    if (!hasProlongedFeverAbdominal) {
      scored.push({
        id: 'typhoid_fever',
        score: 54,
        rationale: 'Consider Enteric Fever if mRDT is negative or fever persists beyond 72 hours of ACT.',
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  primaryProtocolId = scored[0].id;

  // Determine Acuity Level
  let acuity: AcuityLevel = 'ROUTINE';
  let acuityScore = 32;

  if (
    dangerSigns.length > 0 ||
    primaryProtocolId === 'severe_malaria' ||
    primaryProtocolId === 'lassa_fever' ||
    primaryProtocolId === 'meningitis_csm' ||
    primaryProtocolId === 'snakebite_envenomation' ||
    (primaryProtocolId === 'cholera_awd' && hasDehydration)
  ) {
    acuity = 'EMERGENCY';
    acuityScore = Math.min(99, 82 + dangerSigns.length * 5);
  } else if (
    primaryProtocolId === 'cholera_awd' ||
    primaryProtocolId === 'typhoid_fever' ||
    intake.tempC >= 38.5 ||
    intake.isPregnant ||
    intake.ageYears < 2
  ) {
    acuity = 'PRIORITY';
    acuityScore = 64;
  }

  const differentials: DifferentialDiagnosis[] = scored.slice(0, 3).map((item) => {
    const proto =
      TROPICAL_PROTOCOLS.find((p) => p.id === item.id) || TROPICAL_PROTOCOLS[0];
    return {
      protocolId: proto.id,
      conditionName: proto.name.en,
      localNameHa: proto.localTerm.ha,
      localNameJk: proto.localTerm.jk,
      confidencePct: item.score,
      rationale: item.rationale,
      requiredRdtOrLab: proto.diagnosticTests[0],
    };
  });

  const primaryProto =
    TROPICAL_PROTOCOLS.find((p) => p.id === primaryProtocolId) || TROPICAL_PROTOCOLS[0];

  const facility =
    TARABA_FACILITIES.find((f) => f.id === intake.facilityId) || TARABA_FACILITIES[0];

  const dosagePlan = calculateWeightBasedDosage(
    intake.weightKg,
    intake.ageYears,
    primaryProtocolId,
    intake.isPregnant
  );

  const referralRequired = acuity === 'EMERGENCY';

  const immediateStandingOrders: string[] = [
    ...primaryProto.diagnosticTests,
    primaryProto.preReferralAction,
  ];

  // Build conversational reply in the active language
  let assistantReply = '';
  if (language === 'ha') {
    assistantReply = `Bisa ga bayanan **${intake.patientName || 'Mara Lafiya'}** (${intake.ageYears} shekaru, ${intake.weightKg} kg, zafin jiki ${intake.tempC}°C): Matsayin tantancewa shi ne **${acuity}** (${primaryProto.name.ha}).\n\n• **Gwajin Farko:** ${primaryProto.diagnosticTests[0]}\n• **Matakin Gaggawa:** ${primaryProto.preReferralAction}\n• **Shawarar Jinya:** ${primaryProto.counselingSummary.ha}`;
  } else if (language === 'jk') {
    assistantReply = `Bisa bayanin **${intake.patientName || 'Mara Lafiya'}** (${intake.ageYears} shekaru, nauyin apyi ${intake.weightKg} kg, zafin apyi ${intake.tempC}°C): Matsayin tantancewa shi ne **${acuity}** — **${primaryProto.name.jk}**.\n\n• **Gwajin Farko:** ${primaryProto.diagnosticTests[0]}\n• **Umarnin Akyen:** ${dosagePlan[0]?.medication}: ${dosagePlan[0]?.dosePerAdministration} (${dosagePlan[0]?.schedule})\n• **Shawarar Jukun (Wapan):** ${primaryProto.counselingSummary.jk}`;
  } else {
    assistantReply = `Triage assessment for **${intake.patientName || 'Patient'}** (${intake.ageYears} yrs, ${intake.weightKg} kg, ${intake.tempC}°C) at **${facility.name}**: Classified as **${acuity}** with primary suspicion of **${primaryProto.name.en}** (${primaryProto.localTerm.ha} / ${primaryProto.localTerm.jk}).\n\n• **Point-of-Care Test:** ${primaryProto.diagnosticTests[0]}\n• **Standing Order Action:** ${primaryProto.preReferralAction}\n• **Primary Regimen:** ${dosagePlan[0]?.medication} — ${dosagePlan[0]?.dosePerAdministration} (${dosagePlan[0]?.schedule}).`;
  }

  return {
    id: `triage-${Date.now()}`,
    timestampIso: new Date().toISOString(),
    acuity,
    acuityScore,
    primaryDiagnosis: differentials[0],
    differentials,
    dangerSigns,
    dosagePlan,
    immediateStandingOrders,
    referralRequired,
    referralHospital: facility.referralHospital,
    referralDistanceKm: facility.referralDistanceKm,
    counselingTrilingual: primaryProto.counselingSummary,
    assistantReply,
    engineSource: 'offline-standing-orders',
  };
}

export interface PresetScenario {
  id: string;
  title: Record<SupportedLanguage, string>;
  badge: AcuityLevel;
  intake: PatientIntake;
}

export const PRESET_CLINICAL_SCENARIOS: PresetScenario[] = [
  {
    id: 'case-malaria-wukari',
    title: {
      en: '6yo Child — Uncomplicated Malaria (Wukari)',
      ha: 'Yaro dan shekara 6 — Zazzabin Sauro (Wukari)',
      jk: 'Angwu shekara 6 — Apyi Fye Afin (Wukari)',
    },
    badge: 'ROUTINE',
    intake: {
      patientName: 'Aku Adi-Agbu',
      ageYears: 6,
      sex: 'M',
      weightKg: 19,
      tempC: 38.4,
      muacCm: 14.2,
      isPregnant: false,
      facilityId: 'phc-wukari',
      selectedSymptoms: ['high_fever', 'chills_rigors', 'headache_joint', 'bitter_mouth'],
      freeTextSymptoms:
        'Apyi fye kwana biyu, ciwon kai da dacin baki. Yana iya shan ruwa ba amai.',
    },
  },
  {
    id: 'case-severe-malaria-takum',
    title: {
      en: '3yo Toddler — Severe Malaria + Convulsions (Takum)',
      ha: 'Yarinya shekara 3 — Zazzabi Mai Farfadiya (Takum)',
      jk: 'Angwu shekara 3 — Apyi Fye ba Gba Apyi (Takum)',
    },
    badge: 'EMERGENCY',
    intake: {
      patientName: 'Blessing Nyako',
      ageYears: 3,
      sex: 'F',
      weightKg: 13,
      tempC: 39.8,
      muacCm: 12.6,
      isPregnant: false,
      facilityId: 'phc-takum',
      selectedSymptoms: ['high_fever', 'convulsions', 'persistent_vomiting'],
      freeTextSymptoms:
        'High fever since yesterday with two episodes of generalized convulsions (gba apyi / farfadiya) and vomiting everything.',
    },
  },
  {
    id: 'case-lassa-jalingo',
    title: {
      en: '28yo Farmer — Suspected Lassa Fever (Jalingo)',
      ha: 'Manomi shekara 28 — Zargin Zazzabin Lassa (Jalingo)',
      jk: 'Mutum shekara 28 — Zargin Lassa ba Asa Furu (Jalingo)',
    },
    badge: 'EMERGENCY',
    intake: {
      patientName: 'Suleiman Danjuma',
      ageYears: 28,
      sex: 'M',
      weightKg: 64,
      tempC: 39.4,
      isPregnant: false,
      facilityId: 'phc-jalingo',
      selectedSymptoms: ['high_fever', 'unexplained_bleeding', 'headache_joint'],
      freeTextSymptoms:
        'Zazzabi mai zafi na kwana 6 wanda bai sauka da maganin sauro ba, tare da zubar jini daga dasashi da hanci (bleeding gums and epistaxis).',
    },
  },
  {
    id: 'case-snakebite-bali',
    title: {
      en: '34yo Herder — Carpet Viper Snakebite (Bali)',
      ha: 'Shekara 34 — Cizon Macijin Kasa (Bali)',
      jk: 'Shekara 34 — Nyiokwu Cizo a Doru (Bali)',
    },
    badge: 'EMERGENCY',
    intake: {
      patientName: 'Musa Bako',
      ageYears: 34,
      sex: 'M',
      weightKg: 68,
      tempC: 37.4,
      isPregnant: false,
      facilityId: 'phc-bali',
      selectedSymptoms: ['snakebite_fang_swelling', 'unexplained_bleeding'],
      freeTextSymptoms:
        'Bitten on right ankle by carpet viper (macijin kasa / nyiokwu) on farm 2 hours ago; progressive leg swelling and oozing blood from fang marks.',
    },
  },
  {
    id: 'case-cholera-donga',
    title: {
      en: '9yo Child — Acute Watery Diarrhea (Donga)',
      ha: 'Shekara 9 — Gudawa Mai Ruwa / Kwalara (Donga)',
      jk: 'Angwu shekara 9 — Sa Afu Zapen (Donga)',
    },
    badge: 'PRIORITY',
    intake: {
      patientName: 'Hauwa Wakili',
      ageYears: 9,
      sex: 'F',
      weightKg: 26,
      tempC: 37.2,
      isPregnant: false,
      facilityId: 'phc-donga',
      selectedSymptoms: ['watery_diarrhea'],
      freeTextSymptoms:
        'Five episodes of profuse watery diarrhea since morning after drinking stream water; thirsty but restless.',
    },
  },
];

export function createInitialPatientRegister(): PatientRecord[] {
  return PRESET_CLINICAL_SCENARIOS.slice(0, 4).map((scenario, idx) => {
    const assessment = evaluateOfflineTriage(scenario.intake, 'en');
    const facility =
      TARABA_FACILITIES.find((f) => f.id === scenario.intake.facilityId) ||
      TARABA_FACILITIES[0];
    const timestamp = new Date(Date.now() - (idx + 1) * 45 * 60 * 1000).toISOString();
    return {
      id: `reg-seed-${idx + 1}`,
      timestampIso: timestamp,
      patientName: scenario.intake.patientName,
      ageYears: scenario.intake.ageYears,
      sex: scenario.intake.sex,
      weightKg: scenario.intake.weightKg,
      tempC: scenario.intake.tempC,
      facilityId: facility.id,
      lgaName: facility.lga,
      acuity: assessment.acuity,
      primaryCondition: assessment.primaryDiagnosis.conditionName,
      localSummaryJk: assessment.primaryDiagnosis.localNameJk,
      referralRequired: assessment.referralRequired,
      syncStatus: idx % 2 === 0 ? 'Cached Offline' : 'Synced to DHIS2/PHC',
      intake: scenario.intake,
      assessment: {
        ...assessment,
        timestampIso: timestamp,
      },
    };
  });
}

export function getSymptomLabels(symptomIds: string[], lang: SupportedLanguage): string[] {
  return symptomIds
    .map((id) => SYMPTOM_CHIPS.find((c) => c.id === id)?.label[lang])
    .filter((v): v is string => Boolean(v));
}

export interface VoiceQuickPrompt {
  id: string;
  label: Record<SupportedLanguage, string>;
  spokenText: Record<SupportedLanguage, string>;
}

export const VOICE_QUICK_PROMPTS: VoiceQuickPrompt[] = [
  {
    id: 'voice-fever-child',
    label: {
      en: 'Speak: Child with Fever & Chills (16 kg)',
      ha: 'Murya: Yaro Mai Zazzabi da Sanyi (16 kg)',
      jk: 'Murya: Angwu Mai Apyi Fye (16 kg)',
    },
    spokenText: {
      en: 'My 5 year old child weighs 16 kg with temperature 38.7 degrees, high fever, chills, and headache since yesterday, no vomiting.',
      ha: 'Yaro dan shekara 5 mai nauyin kilo 16 yana da zazzabi mai zafi da rawar dare da ciwon kai, yana shan ruwa ba amai.',
      jk: 'Angwu shekara 5 nauyin apyi kilo 16 yana da apyi fye, kyon apyi da tswen achu, ba kwe.',
    },
  },
  {
    id: 'voice-danger-convulsion',
    label: {
      en: 'Speak: Emergency Convulsions (12 kg)',
      ha: 'Murya: Gaggawar Farfadiya (12 kg)',
      jk: 'Murya: Gaggawa Gba Apyi (12 kg)',
    },
    spokenText: {
      en: 'Emergency! 2 year old child weighing 12 kg has 39.9 degree fever, convulsions, and vomiting everything.',
      ha: 'Gaggawa! Yarinya shekara 2 mai nauyin kilo 12 tana zazzabi 39.9 da farfadiya da yawan amai.',
      jk: 'Gaggawa! Angwu shekara 2 nauyin kilo 12 yana da apyi fye 39.9 da gba apyi da kwe kwarai.',
    },
  },
  {
    id: 'voice-cholera-rehydration',
    label: {
      en: 'Speak: Watery Diarrhea ORS Check (22 kg)',
      ha: 'Murya: Gudawa Mai Ruwa / ORS (22 kg)',
      jk: 'Murya: Sa Afu Zapen / ORS (22 kg)',
    },
    spokenText: {
      en: '7 year old child weighing 22 kg has profuse watery diarrhea and sunken eyes. How much ORS and Zinc should we give?',
      ha: 'Yaro dan shekara 7 mai nauyin kilo 22 yana gudawa mai ruwa sosai da kishirwa. Nawa ne ruwan ORS da Zinc?',
      jk: 'Angwu shekara 7 nauyin kilo 22 yana sa afu zapen da ayin gbari. Nawa ne zapen ORS ba Zinc?',
    },
  },
];

/**
 * Extracts structured patient vitals (age, weight, temperature) and symptom chips
 * from a natural voice transcript in English, Hausa, or Jukun.
 */
export function parseSpokenSymptomTranscript(
  transcript: string,
  currentIntake: PatientIntake
): PatientIntake {
  const lower = transcript.toLowerCase();
  const next: PatientIntake = {
    ...currentIntake,
    selectedSymptoms: [...currentIntake.selectedSymptoms],
    freeTextSymptoms: transcript.trim(),
  };

  // Parse Weight in kg (e.g., "16 kg", "16kg", "kilo 16", "nauyin kilo 12")
  const weightMatch =
    lower.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilograms?)/) ||
    lower.match(/(?:kilo|nauyin(?:\s+apyi)?(?:\s+kilo)?)\s*(\d+(?:\.\d+)?)/);
  if (weightMatch) {
    const parsedW = parseFloat(weightMatch[1]);
    if (parsedW >= 2 && parsedW <= 180) {
      next.weightKg = parsedW;
    }
  }

  // Parse Age in years (e.g., "5 year old", "5 yrs", "shekara 5")
  const ageMatch =
    lower.match(/(\d+(?:\.\d+)?)\s*(?:year|yr|years|yrs)/) ||
    lower.match(/shekara\s*(\d+(?:\.\d+)?)/);
  if (ageMatch) {
    const parsedAge = parseFloat(ageMatch[1]);
    if (parsedAge > 0 && parsedAge <= 110) {
      next.ageYears = parsedAge;
    }
  }

  // Parse Temperature in °C (e.g., "38.7 degrees", "39.9°c", "zazzabi 39.9")
  const tempMatch = lower.match(/(3[5-9](?:\.\d+)?|4[0-2](?:\.\d+)?)\s*(?:°c|degrees?|c\b)?/);
  if (tempMatch) {
    const parsedTemp = parseFloat(tempMatch[1]);
    if (parsedTemp >= 35 && parsedTemp <= 42.5) {
      next.tempC = parsedTemp;
    }
  }

  const detectedChips = new Set<string>();
  if (/fever|hot|zazzabi|apyi fye/.test(lower)) {
    detectedChips.add('high_fever');
  }
  if (/chill|shiver|rawar dare|sanyi|kyon apyi/.test(lower)) {
    detectedChips.add('chills_rigors');
  }
  if (/headache|body pain|ciwon kai|tswen achu/.test(lower)) {
    detectedChips.add('headache_joint');
  }
  if (
    !/no vomit|without vomit|ba amai|babu amai|ba kwe/.test(lower) &&
    /vomit|amai|kwe/.test(lower)
  ) {
    detectedChips.add('persistent_vomiting');
  }
  if (
    !/no convuls|without convuls|ba farfadiya|ba gba apyi/.test(lower) &&
    /convuls|fit|seizure|farfadiya|gba apyi/.test(lower)
  ) {
    detectedChips.add('convulsions');
  }
  if (/diarrh|gudawa|sa afu|cholera|kwalara/.test(lower)) {
    detectedChips.add('watery_diarrhea');
  }
  if (/sunken|dehydrat|kishirwa|ayin gbari/.test(lower)) {
    detectedChips.add('sunken_eyes_thirst');
  }
  if (
    !/no bleed|without bleed|ba zubar jini|ba asa furu/.test(lower) &&
    /bleed|zubar jini|asa furu|lassa/.test(lower)
  ) {
    detectedChips.add('unexplained_bleeding');
  }
  if (/snake|maciji|nyiokwu|viper/.test(lower)) {
    detectedChips.add('snakebite_fang_swelling');
  }
  if (/stiff neck|meningit|sankarau|taurin wuya|kpakpa akyo/.test(lower)) {
    detectedChips.add('stiff_neck_photophobia');
  }

  if (detectedChips.size > 0) {
    next.selectedSymptoms = Array.from(detectedChips);
  }

  return next;
}

