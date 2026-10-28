export type SupportedLanguage = 'en' | 'ha' | 'jk';

export type AcuityLevel = 'EMERGENCY' | 'PRIORITY' | 'ROUTINE';

export interface TarabaFacility {
  id: string;
  name: string;
  lga: string;
  senatorialZone: 'Northern' | 'Central' | 'Southern';
  referralHospital: string;
  referralDistanceKm: number;
  dominantLanguages: string[];
}

export const TARABA_FACILITIES: TarabaFacility[] = [
  {
    id: 'phc-wukari',
    name: 'PHC Wukari Town Ward',
    lga: 'Wukari',
    senatorialZone: 'Southern',
    referralHospital: 'Federal University Teaching Hospital (FUTH) Wukari',
    referralDistanceKm: 4.2,
    dominantLanguages: ['Jukun (Wapan)', 'Hausa', 'English'],
  },
  {
    id: 'phc-takum',
    name: 'PHC Kashimbila / Takum',
    lga: 'Takum',
    senatorialZone: 'Southern',
    referralHospital: 'General Hospital Takum',
    referralDistanceKm: 18.5,
    dominantLanguages: ['Jukun (Jibu/Wapan)', 'Hausa', 'English'],
  },
  {
    id: 'phc-jalingo',
    name: 'PHC Kona / Jalingo Rural',
    lga: 'Jalingo',
    senatorialZone: 'Northern',
    referralHospital: 'Federal Medical Centre (FMC) Jalingo',
    referralDistanceKm: 8.0,
    dominantLanguages: ['Hausa', 'Jukun (Kona)', 'Mumuye', 'English'],
  },
  {
    id: 'phc-sardauna',
    name: 'PHC Mayo-Ndaga (Mambilla Plateau)',
    lga: 'Sardauna (Gembu)',
    senatorialZone: 'Central',
    referralHospital: 'General Hospital Gembu',
    referralDistanceKm: 27.4,
    dominantLanguages: ['Hausa', 'Fulfulde', 'Mambila', 'English'],
  },
  {
    id: 'phc-bali',
    name: 'PHC Garba Chede',
    lga: 'Bali',
    senatorialZone: 'Central',
    referralHospital: 'General Hospital Bali / FMC Jalingo',
    referralDistanceKm: 32.0,
    dominantLanguages: ['Hausa', 'Jukun (Jibu)', 'Tiv', 'English'],
  },
  {
    id: 'phc-donga',
    name: 'PHC Mararraba Donga',
    lga: 'Donga',
    senatorialZone: 'Southern',
    referralHospital: 'First Referral Hospital Donga',
    referralDistanceKm: 14.6,
    dominantLanguages: ['Jukun (Chamba/Wapan)', 'Hausa', 'English'],
  },
];

export interface SymptomChip {
  id: string;
  category: 'fever' | 'danger' | 'gi' | 'neuro' | 'envenomation' | 'urinary';
  isRedFlag: boolean;
  label: Record<SupportedLanguage, string>;
}

export const SYMPTOM_CHIPS: SymptomChip[] = [
  {
    id: 'high_fever',
    category: 'fever',
    isRedFlag: false,
    label: {
      en: 'High Fever / Hot Body',
      ha: 'Zazzabi Mai Zafi',
      jk: 'Apyi Fye (Jiki Mai Zafi)',
    },
  },
  {
    id: 'chills_rigors',
    category: 'fever',
    isRedFlag: false,
    label: {
      en: 'Chills & Shivering',
      ha: 'Rawar Dare / Sanyi',
      jk: 'Kyon Apyi (Sanyi da Rawar Jiki)',
    },
  },
  {
    id: 'headache_joint',
    category: 'fever',
    isRedFlag: false,
    label: {
      en: 'Headache & Body Pains',
      ha: 'Ciwon Kai da Gabobi',
      jk: 'Tswen Achu ba Apyi',
    },
  },
  {
    id: 'bitter_mouth',
    category: 'fever',
    isRedFlag: false,
    label: {
      en: 'Bitter Taste / Loss of Appetite',
      ha: 'Dacin Baki / Rashin Cin Abinci',
      jk: 'Anyin Dandan / Kîn Abyen',
    },
  },
  {
    id: 'persistent_vomiting',
    category: 'danger',
    isRedFlag: true,
    label: {
      en: 'Vomiting Everything',
      ha: 'Yawan Amai BabuTsayawa',
      jk: 'Kwe Kwarai (Amai Sosai)',
    },
  },
  {
    id: 'convulsions',
    category: 'danger',
    isRedFlag: true,
    label: {
      en: 'Convulsions / Fits',
      ha: 'Farfadiya / Jijjiga',
      jk: 'Gba Apyi (Farfadiya)',
    },
  },
  {
    id: 'unexplained_bleeding',
    category: 'danger',
    isRedFlag: true,
    label: {
      en: 'Bleeding (Gums, Nose, Stool)',
      ha: 'Zubar Jini (Hanci, Baki, Bahaya)',
      jk: 'Asa Furu (Zubar Jini)',
    },
  },
  {
    id: 'watery_diarrhea',
    category: 'gi',
    isRedFlag: false,
    label: {
      en: 'Profuse Watery Diarrhea',
      ha: 'Gudawa Mai Ruwa Sosai',
      jk: 'Sa Afu Zapen (Gudawa Ruwa)',
    },
  },
  {
    id: 'sunken_eyes_thirst',
    category: 'danger',
    isRedFlag: true,
    label: {
      en: 'Sunken Eyes / Severe Dehydration',
      ha: 'Idanu Sun Zurma / Kishirwa',
      jk: 'Ayin Gbari / Kishi Zapen',
    },
  },
  {
    id: 'stepwise_fever_abdominal',
    category: 'gi',
    isRedFlag: false,
    label: {
      en: 'Prolonged Fever >5d + Stomach Pain',
      ha: 'Zazzabi Mai Dadewa + Ciwon Ciki',
      jk: 'Apyi Fye Dade + Tswen Afu',
    },
  },
  {
    id: 'stiff_neck_photophobia',
    category: 'neuro',
    isRedFlag: true,
    label: {
      en: 'Stiff Neck / Bulging Fontanelle',
      ha: 'Taurin Wuya / Sankarau',
      jk: 'Kpakpa Akyo (Taurin Wuya)',
    },
  },
  {
    id: 'snakebite_fang_swelling',
    category: 'envenomation',
    isRedFlag: true,
    label: {
      en: 'Snakebite + Limb Swelling / Bleeding',
      ha: 'Cizon Maciji + Kumburin Kafa',
      jk: 'Nyiokwu Cizo (Cizon Maciji)',
    },
  },
  {
    id: 'blood_in_urine',
    category: 'urinary',
    isRedFlag: false,
    label: {
      en: 'Terminal Hematuria (Blood in Urine)',
      ha: 'Fitsarin Jini (Tsargiya)',
      jk: 'Asa Mbyen (Fitsarin Jini)',
    },
  },
];

export interface TropicalProtocol {
  id: string;
  name: Record<SupportedLanguage, string>;
  localTerm: {
    ha: string;
    jk: string;
  };
  acuityDefault: AcuityLevel;
  endemicNoteTaraba: string;
  diagnosticTests: string[];
  firstLineStandingOrder: string;
  preReferralAction: string;
  dangerSigns: string[];
  counselingSummary: Record<SupportedLanguage, string>;
}

export const TROPICAL_PROTOCOLS: TropicalProtocol[] = [
  {
    id: 'uncomplicated_malaria',
    name: {
      en: 'Uncomplicated Plasmodium falciparum Malaria',
      ha: 'Zazzabin Cizon Sauro (Mara Tsanani)',
      jk: 'Apyi Fye Afin (Zazzabin Sauro)',
    },
    localTerm: {
      ha: 'Zazzabin Cizon Sauro / Maleriya',
      jk: 'Apyi Fye Afin / Tswen Achu',
    },
    acuityDefault: 'ROUTINE',
    endemicNoteTaraba:
      'Hyper-endemic across all 16 LGAs of Taraba State; peak transmission May–November along the Benue and Taraba river basins.',
    diagnosticTests: [
      'Malaria Rapid Diagnostic Test (mRDT - HRP2/pLDH) — Mandatory before ACT',
      'Blood Film Microscopy (Thick & Thin Smear) if available',
      'Packed Cell Volume (PCV) / Hemoglobin check if palmar pallor present',
    ],
    firstLineStandingOrder:
      'Artemether-Lumefantrine (AL 20mg/120mg) orally twice daily for 3 days (6 doses at 0, 8, 24, 36, 48, 60 hrs) + Paracetamol 15mg/kg every 6–8 hrs for fever >= 38.5°C.',
    preReferralAction:
      'Confirm negative danger signs. Administer first dose of ACT under direct observation (DOT) at the PHC with fatty meal or milk.',
    dangerSigns: [
      'Inability to drink or breastfeed',
      'Repeated vomiting of all oral intake',
      'Recent history of convulsions',
      'Lethargy, drowsiness, or unconsciousness',
      'Dark/cola-colored urine or severe palmar pallor',
    ],
    counselingSummary: {
      en: 'Complete all 6 doses of ACT over 3 days with food, even if fever stops early. Sleep under an insecticide-treated net (LLIN) every night and return immediately if vomiting or weakness worsens.',
      ha: 'A shanye dukkan maganin ACT na kwana 3 tare da abinci ko madara, ko da zazzabin ya sauka. A kwana a cikin gidan sauro mai magani (LLIN) kuma a dawo asibiti nan take idan amai ko jiri ya karu.',
      jk: 'Wa akyen ACT duka kwana tara (3) ba abyen, ko apyi fye ya sauka. Da nu gidan sauro, ku ba asibiti nuzun idan kwe (amai) ko gba apyi ya samu.',
    },
  },
  {
    id: 'severe_malaria',
    name: {
      en: 'Severe Malaria (Medical Emergency)',
      ha: 'Zazzabin Sauro Mai Tsanani (Gaggawa)',
      jk: 'Apyi Fye Afin Ukwu (Gaggawa)',
    },
    localTerm: {
      ha: 'Zazzabin Sauro Mai Farfadiya / Suma',
      jk: 'Apyi Fye Gba Apyi',
    },
    acuityDefault: 'EMERGENCY',
    endemicNoteTaraba:
      'Leading cause of under-5 mortality in remote wards of Karin-Lamido, Bali, Gashaka, and Wukari when referral is delayed.',
    diagnosticTests: [
      'Immediate mRDT + Random Blood Glucose (rule out hypoglycemia < 2.5 mmol/L)',
      'Urgent PCV / Hemoglobin estimation',
    ],
    firstLineStandingOrder:
      'Pre-referral Injectable Artesunate: 3.0 mg/kg IM/IV stat for children < 20kg; 2.4 mg/kg IM/IV stat for patients >= 20kg (or Rectal Artesunate 10mg/kg in children < 6 yrs if injection unavailable).',
    preReferralAction:
      'Stabilize airway, correct hypoglycemia with 10% Dextrose 5mL/kg IV or sublingual sugar water, give stat IM Artesunate into anterior thigh, and refer urgently.',
    dangerSigns: [
      'Multiple convulsions (>2 in 24 hours)',
      'Prostration or coma (Blantyre/GCS depression)',
      'Severe anemia (Hb < 5 g/dL or PCV < 15%)',
      'Respiratory distress / acidotic breathing',
      'Hypoglycemia or circulatory shock',
    ],
    counselingSummary: {
      en: 'EMERGENCY: The patient has life-threatening severe malaria. We have given an emergency injection of Artesunate. Proceed immediately to the Referral Hospital for IV treatment and blood monitoring.',
      ha: 'GAGGAWA: Wannan zazzabin sauro ya tsananta sosai. Mun yi allurar gaggawa ta Artesunate. Ku wuce babban asibiti yanzu-yanzu domin karin ruwa da kulawar likita.',
      jk: 'GAGGAWA: Apyi fye afin ne ya tsananta. Mun ba allura gaggawa Artesunate. Ya nu asibiti ukwu nuzun-nuzun domin karin zapen da jini.',
    },
  },
  {
    id: 'lassa_fever',
    name: {
      en: 'Suspected Lassa Fever (Viral Hemorrhagic Fever)',
      ha: 'Zargin Zazzabin Lassa (Zubar Jini)',
      jk: 'Apyi Fye Lassa (Asa Furu)',
    },
    localTerm: {
      ha: 'Zazzabin Lassa (Zazzabin Beraye)',
      jk: 'Apyi Fye Ayi / Asa Furu',
    },
    acuityDefault: 'EMERGENCY',
    endemicNoteTaraba:
      'Taraba State (especially Jalingo, Ardo-Kola, Gassol, Bali, and Wukari LGAs) is a high-burden NCDC Lassa fever belt, peaking during dry season (Nov–April).',
    diagnosticTests: [
      'Strict IPC Isolation first! Do NOT perform routine invasive procedures without full PPE',
      'Notify LGA Disease Surveillance and Notification Officer (DSNO) immediately',
      'Lassa Virus RT-PCR blood sample collection in triple packaging to NCDC Reference Lab / FMC Jalingo',
    ],
    firstLineStandingOrder:
      'Isolate patient in designated holding area. Initiate supportive fluid balance and IV Ribavirin protocol at FMC Jalingo Treatment Center.',
    preReferralAction:
      'Put on gloves, gown, mask, and eye protection. Isolate patient, log close contacts, call Taraba State Epidemiologist / LGA DSNO for ambulance transfer.',
    dangerSigns: [
      'Unexplained fever unresponsive to antimalarials and antibiotics after 48–72 hours',
      'Mucosal bleeding (gums, nose, conjunctiva, vaginal, or GI tract)',
      'Facial or neck swelling, retrosternal chest pain, sore throat',
      'History of contact with multimammate rat (Mastomys natalensis) excreta or confirmed Lassa case',
    ],
    counselingSummary: {
      en: 'STRICT ISOLATION & REFERRAL: Symptoms require immediate testing for Lassa fever at FMC Jalingo. Avoid direct contact with body fluids; our team is contacting the LGA Surveillance Officer for safe transport.',
      ha: 'KEBEWA DA GAGGAWA: Alamomin na nuna bukatar gwajin Zazzabin Lassa a FMC Jalingo. Kada a taba jini ko amai hannu-da-hannu; muna kiran jami’in lafiya (DSNO) don daukar mara lafiya.',
      jk: 'KEBEWA GAGGAWA: Alamomi na nuna bukatar gwajin Lassa a asibiti ukwu. Kada ku taba asa (jini) ko kwe; muna kiran motar asibiti ukwu nuzun.',
    },
  },
  {
    id: 'cholera_awd',
    name: {
      en: 'Acute Watery Diarrhea / Suspected Cholera',
      ha: 'Kwalara / Gudawa Mai Ruwa Mai Tsanani',
      jk: 'Sa Afu Zapen Ukwu (Kwalara)',
    },
    localTerm: {
      ha: 'Kwalara / Amai da Gudawa',
      jk: 'Sa Afu ba Kwe',
    },
    acuityDefault: 'PRIORITY',
    endemicNoteTaraba:
      'Seasonal outbreaks occur in riverine communities (Ibi, Lau, Karim-Lamido, Wukari, Donga) during flooding or dry-season water scarcity.',
    diagnosticTests: [
      'Cholera Rapid Diagnostic Test (Crystal VC RDT) on fresh rice-water stool',
      'Clinical Dehydration Assessment (Skin pinch, eye sunkenness, radial pulse, sensorium)',
    ],
    firstLineStandingOrder:
      'WHO Plan B/C Rehydration: Low-Osmolarity ORS (75 mL/kg over 4 hours) + Zinc Sulfate 20mg daily for 10 days (10mg if <6m). If Severe Dehydration: Ringer’s Lactate IV 100 mL/kg + Oral Doxycycline / Azithromycin per NCDC guidelines.',
    preReferralAction:
      'Start ORS sips immediately or establish wide-bore IV line with Ringer’s Lactate before transfer. Disinfect vomitus/stool with 0.5% chlorine.',
    dangerSigns: [
      'Lethargic or unconscious patient',
      'Sunken eyes and skin pinch goes back very slowly (>2 seconds)',
      'Unable to drink or drinking poorly',
      'Profuse "rice-water" stools (>3 per hour) with weak/absent radial pulse',
    ],
    counselingSummary: {
      en: 'Drink Oral Rehydration Solution (ORS) after every loose stool. Give Zinc tablets daily for 10 full days. Boil or chlorinate all drinking water and wash hands with soap and ash/water.',
      ha: 'A ba mara lafiya ruwan gishiri da sukari (ORS) bayan kowane bahaya. A shanye kwayoyin Zinc na kwana 10. A tafasa ruwan sha kuma a wanke hannu da sabulu.',
      jk: 'Wa zapen ORS bayan kowane sa afu. Wa kwayar Zinc kwana dwe (10). Tafasa zapen sha ku wanke avo ba sabulu.',
    },
  },
  {
    id: 'typhoid_fever',
    name: {
      en: 'Enteric (Typhoid) Fever',
      ha: 'Zazzabin Taifod (Ciwon Hanji)',
      jk: 'Apyi Fye Taifod (Tswen Afu)',
    },
    localTerm: {
      ha: 'Taifod / Zazzabin Ciki',
      jk: 'Tswen Afu Apyi Fye',
    },
    acuityDefault: 'PRIORITY',
    endemicNoteTaraba:
      'Frequently co-exists or is misdiagnosed with malaria in rural PHCs lacking clean borehole water.',
    diagnosticTests: [
      'Always perform mRDT first to rule out malaria co-infection',
      'Typhoid IgM/IgG Rapid Test or Stool/Blood Culture at referral lab (avoid relying on single Widal titer alone)',
    ],
    firstLineStandingOrder:
      'Oral Ciprofloxacin 15 mg/kg twice daily for 7–10 days (or Oral Azithromycin 20 mg/kg once daily for 7 days in children/pregnant women per NCDC/Standing Orders) + Paracetamol + Oral fluids.',
    preReferralAction:
      'Examine abdomen carefully for guarding, rigidity, or rebound tenderness (signs of ileal perforation). Refer immediately if acute abdomen suspected.',
    dangerSigns: [
      'Severe abdominal distension, rigidity, or sudden sharp abdominal pain (perforation)',
      'Gastrointestinal bleeding (black tarry stools or fresh blood)',
      'Delirium, confusion, or typhoid psychosis',
      'Persistent fever > 7 days despite oral therapy',
    ],
    counselingSummary: {
      en: 'Take the full antibiotic course for 7 to 10 days even after fever clears. Avoid street-vended unboiled water and raw unwashed food; return immediately if severe stomach pain develops.',
      ha: 'A shanye maganin kwayoyin cuta na kwana 7 zuwa 10 gaba daya. A guji shan ruwa mara tsafta; a garzaya asibiti idan ciwon ciki ya tsananta.',
      jk: 'Wa akyen duka kwana atsumpyi (7) zuwa dwe (10). Guji zapen mara tsafta; ba asibiti nuzun idan tswen afu ya karu.',
    },
  },
  {
    id: 'snakebite_envenomation',
    name: {
      en: 'Snakebite Envenomation (Carpet Viper — Echis ocellatus)',
      ha: 'Cizon Maciji (Kasa /Kububuwa)',
      jk: 'Nyiokwu Cizo (Cizon Maciji)',
    },
    localTerm: {
      ha: 'Cizon Macijin Kasa',
      jk: 'Nyiokwu / Kpakpando',
    },
    acuityDefault: 'EMERGENCY',
    endemicNoteTaraba:
      'The Benue–Taraba river valley (Wukari, Karin-Lamido, Lau, Ibi, Gassol, Bali) has one of West Africa’s highest incidences of Echis ocellatus (saw-scaled carpet viper) bites among farmers.',
    diagnosticTests: [
      '20-Minute Whole Blood Clotting Test (20WBCT) in a clean, dry, new glass tube',
      'Inspect fang marks, progressive limb edema, and gingival sulci for oozing blood',
    ],
    firstLineStandingOrder:
      'Immobilize bitten limb with splint. Do NOT apply tourniquet or incised cuts. Refer urgently for Polyvalent/Monovalent EchiTAb-Plus-ICP Antivenom.',
    preReferralAction:
      'Reassure patient, remove rings/tight clothing, immobilize limb at heart level, give Paracetamol (NEVER give Aspirin/NSAIDs due to bleeding risk), and transport immediately.',
    dangerSigns: [
      'Incoagulable blood on 20-Minute Whole Blood Clotting Test (20WBCT)',
      'Spontaneous bleeding from gums, nose, venipuncture sites, or fang wounds',
      'Rapidly ascending limb swelling or blistering',
      'Ptosis, difficulty swallowing, or respiratory muscle weakness (neurotoxic)',
    ],
    counselingSummary: {
      en: 'EMERGENCY: Keep the bitten leg/arm completely still. Do NOT tie a tight tourniquet, do NOT cut the wound, and do NOT apply black stone or herbs. Go immediately to the hospital for Antivenom.',
      ha: 'GAGGAWA: A bar kafar ko hannun a natse ba motsi. KADA a daure da igiya mai matse jini, KADA a tsaga ciwon, kuma KADA a saka gadali. A wuce babban asibiti don allurar Antivenom.',
      jk: 'GAGGAWA: Bar avo ko aben a natse. KADA ku daure igiya, KADA ku yanka ciwon. Ya nu asibiti ukwu nuzun domin allurar Antivenom.',
    },
  },
  {
    id: 'meningitis_csm',
    name: {
      en: 'Suspected Acute Bacterial Meningitis (CSM)',
      ha: 'Cututtukan Sankarau (Taurin Wuya)',
      jk: 'Kpakpa Akyo (Sankarau)',
    },
    localTerm: {
      ha: 'Sankarau / Ciwon Wuya',
      jk: 'Tswen Achu ba Kpakpa Akyo',
    },
    acuityDefault: 'EMERGENCY',
    endemicNoteTaraba:
      'Northern and Central Taraba LGAs lie within the African Meningitis Belt with peak dry Harmattan outbreaks (December–May).',
    diagnosticTests: [
      'Clinical check for neck stiffness, Kernig/Brudzinski signs, or bulging fontanelle in infants',
      'Lumbar Puncture & CSF Pastorex RDT at Referral Hospital + Immediate DSNO Notification',
    ],
    firstLineStandingOrder:
      'Pre-referral Ceftriaxone 100 mg/kg IM/IV stat (max 2g) prior to urgent transfer to Referral Hospital.',
    preReferralAction:
      'Administer stat IM Ceftriaxone, manage convulsions with Diazepam if active, maintain airway, and notify LGA DSNO.',
    dangerSigns: [
      'Neck stiffness or inability to flex chin to chest',
      'Bulging anterior fontanelle or high-pitched cry in infants',
      'Petechial/purpuric rash, photophobia, or altered consciousness',
    ],
    counselingSummary: {
      en: 'EMERGENCY: High suspicion of Meningitis (Sankarau). We have given a pre-referral antibiotic injection. Transfer immediately to the General/Teaching Hospital.',
      ha: 'GAGGAWA: Ana zargin cutar Sankarau. Mun yi allurar rigakafin farko ta Ceftriaxone. Ku tafi babban asibiti nan take.',
      jk: 'GAGGAWA: Ana zargin cutar Sankarau (Kpakpa Akyo). Mun yi allura Ceftriaxone. Ya nu asibiti ukwu nuzun.',
    },
  },
  {
    id: 'schistosomiasis',
    name: {
      en: 'Urinary / Intestinal Schistosomiasis (Bilharzia)',
      ha: 'Fitsarin Jini (Tsargiya)',
      jk: 'Asa Mbyen (Tsargiya)',
    },
    localTerm: {
      ha: 'Tsargiya / Fitsarin Jini',
      jk: 'Asa Mbyen',
    },
    acuityDefault: 'ROUTINE',
    endemicNoteTaraba:
      'High prevalence in school-age children swimming or fishing in ponds and tributaries in Ibi, Wukari, Lau, Karin-Lamido, and Zing.',
    diagnosticTests: [
      'Urine dipstick for hematuria & Urine filtration microscopy for S. haematobium ova',
    ],
    firstLineStandingOrder:
      'Praziquantel 40 mg/kg orally as a single dose (measured by weight or WHO dose pole) after a meal.',
    preReferralAction:
      'Give single-dose Praziquantel with food at the PHC and counsel against wading in snail-infested stagnant water.',
    dangerSigns: [
      'Gross clots causing acute urinary retention',
      'Severe anemia or flank pain suggesting obstructive uropathy',
    ],
    counselingSummary: {
      en: 'Swallow Praziquantel tablets after eating food to reduce dizziness. Avoid swimming or wading in stagnant ponds and streams.',
      ha: 'A sha maganin Praziquantel bayan an ci abinci. A daina wanka ko shiga kududdufi da rafi.',
      jk: 'Wa akyen Praziquantel bayan cin abyen. Daina shiga zapen kududdufi.',
    },
  },
];

export interface PhrasebookEntry {
  id: string;
  category: 'greeting' | 'symptoms' | 'danger' | 'counseling';
  en: string;
  ha: string;
  jk: string;
  jkPhonetic: string;
  clinicalContext: string;
}

export const PHRASEBOOK_ENTRIES: PhrasebookEntry[] = [
  {
    id: 'ph-1',
    category: 'greeting',
    en: 'Welcome to the Primary Health Center. How is your body feeling today?',
    ha: 'Barka da zuwa cibiyar lafiya. Yaya jikin naku yake yau?',
    jk: 'Aba nu asibiti. Adiri bu le nyunu?',
    jkPhonetic: 'Ah-bah noo ah-see-bee-tee. Ah-dee-ree boo leh nyoo-noo?',
    clinicalContext: 'Initial patient reception & rapport building',
  },
  {
    id: 'ph-2',
    category: 'symptoms',
    en: 'How many days has the fever and headache lasted?',
    ha: 'Kwana nawa kenan ana wannan zazzabi da ciwon kai?',
    jk: 'Apyi fye ba tswen achu ne ya yi kwana nawa?',
    jkPhonetic: 'Ah-pyee fyeh bah tswen ah-choo neh yah yee kwah-nah nah-wah?',
    clinicalContext: 'Fever duration history (Malaria vs Typhoid/Lassa triage)',
  },
  {
    id: 'ph-3',
    category: 'danger',
    en: 'Is the child able to drink water or breastfeed, or are they vomiting everything?',
    ha: 'Yaron yana iya shan ruwa ko nono, ko kuwa yana amayar da komai?',
    jk: 'Angwu ne yana iya wa zapen ko abyen-nyo, ko yana kwe duka?',
    jkPhonetic: 'Ahn-gwoo neh yah-nah ee-yah wah zah-pen koh ah-byen-nyoh, koh yah-nah kweh doo-kah?',
    clinicalContext: 'WHO IMCI General Danger Sign check',
  },
  {
    id: 'ph-4',
    category: 'danger',
    en: 'Has there been any bleeding from the gums, nose, or in the stool?',
    ha: 'Akwai zubar jini daga dasashi, hanci, ko a cikin bahaya?',
    jk: 'Akwai asa furu daga anyin, awin, ko a sa afu?',
    jkPhonetic: 'Ah-kwai ah-sah foo-roo dah-gah ah-nyin, ah-win, koh ah sah ah-foo?',
    clinicalContext: 'Lassa Fever & Carpet Viper coagulopathy screening',
  },
  {
    id: 'ph-5',
    category: 'danger',
    en: 'Did the child have convulsions or stiffness of the neck?',
    ha: 'Yaron ya yi farfadiya ko taurin wuya?',
    jk: 'Angwu ne ya yi gba apyi ko kpakpa akyo?',
    jkPhonetic: 'Ahn-gwoo neh yah yee gbah ah-pyee koh kpah-kpah ah-kyoh?',
    clinicalContext: 'Cerebral malaria & Meningitis screening',
  },
  {
    id: 'ph-6',
    category: 'symptoms',
    en: 'Were you bitten by a snake on the farm? Which part of the leg or hand?',
    ha: 'Maciji ya sare ka a gona ne? Wane bangare na kafa ko hannu?',
    jk: 'Nyiokwu ya cizo u a doru? Wane waje na aben ko avo?',
    jkPhonetic: 'Nyee-oh-kwoo yah chee-zoh oo ah doh-roo? Wah-neh wah-jeh nah ah-ben koh ah-voh?',
    clinicalContext: 'Echis ocellatus snakebite intake in Benue/Taraba valley',
  },
  {
    id: 'ph-7',
    category: 'counseling',
    en: 'Take this malaria medicine twice a day for three days after eating food.',
    ha: 'A sha wannan maganin zazzabin sauro sau biyu a rana na tsawon kwana uku bayan cin abinci.',
    jk: 'Wa akyen apyi fye ne sau pini a rana kwana tara (3) bayan cin abyen.',
    jkPhonetic: 'Wah ah-kyen ah-pyee fyeh neh sau pee-nee ah rah-nah kwah-nah tah-rah bah-yan chin ah-byen.',
    clinicalContext: 'Artemether-Lumefantrine (ACT) adherence counseling',
  },
  {
    id: 'ph-8',
    category: 'counseling',
    en: 'Give small sips of ORS solution after every watery stool to replace lost water.',
    ha: 'A rika ba shi ruwan ORS kadan-kadan bayan kowane bahaya domin mayar da ruwan jiki.',
    jk: 'Ba angwu zapen ORS kadan-kadan bayan kowane sa afu.',
    jkPhonetic: 'Bah ahn-gwoo zah-pen ORS kah-dan kah-dan bah-yan koh-wah-neh sah ah-foo.',
    clinicalContext: 'Oral rehydration therapy counseling',
  },
  {
    id: 'ph-9',
    category: 'counseling',
    en: 'This condition is an emergency. Go immediately to the Referral Hospital with this slip.',
    ha: 'Wannan matsalar gaggawa ce. Ku wuce babban asibiti nan take da wannan takardar.',
    jk: 'Matsala ne gaggawa. Ya nu asibiti ukwu nuzun ba takarda ne.',
    jkPhonetic: 'Maht-sah-lah neh gahg-gah-wah. Yah noo ah-see-bee-tee oo-kwoo noo-zoon bah tah-kar-dah neh.',
    clinicalContext: 'Urgent hospital referral instruction',
  },
];

export const UI_TRANSLATIONS: Record<
  SupportedLanguage,
  {
    appSubtitle: string;
    navTriage: string;
    navRegister: string;
    navProtocols: string;
    navPhrasebook: string;
    newTriageCta: string;
    patientIntakeTitle: string;
    patientNameLabel: string;
    ageYearsLabel: string;
    weightKgLabel: string;
    tempCLabel: string;
    muacCmLabel: string;
    pregnantLabel: string;
    symptomChecklistTitle: string;
    chatInputPlaceholder: string;
    runTriageBtn: string;
    saveToRegisterBtn: string;
    savedConfirmation: string;
    clinicalDecisionTitle: string;
    dosageStandingOrderTitle: string;
    patientCounselingTitle: string;
    referralNoteTitle: string;
    presetScenariosLabel: string;
    offlineEngineBadge: string;
    onlineAiBadge: string;
  }
> = {
  en: {
    appSubtitle: 'Taraba State Primary Health Care Clinical Triage & Standing Orders Assistant',
    navTriage: 'Triage Assistant',
    navRegister: 'Patient Register',
    navProtocols: 'Disease Protocols',
    navPhrasebook: 'Trilingual Phrasebook',
    newTriageCta: 'New Patient Triage',
    patientIntakeTitle: 'Patient Vitals & Intake',
    patientNameLabel: 'Patient Full Name',
    ageYearsLabel: 'Age (Years)',
    weightKgLabel: 'Weight (kg)',
    tempCLabel: 'Axillary Temp (°C)',
    muacCmLabel: 'Pediatric MUAC (cm)',
    pregnantLabel: 'Pregnant',
    symptomChecklistTitle: 'Presenting Symptoms & IMCI Danger Signs',
    chatInputPlaceholder: 'Describe patient symptoms in English, Hausa, or Jukun...',
    runTriageBtn: 'Run Clinical Triage',
    saveToRegisterBtn: 'Save Case to PHC Register',
    savedConfirmation: 'Saved to Register',
    clinicalDecisionTitle: 'Clinical Triage & Standing Order Output',
    dosageStandingOrderTitle: 'Weight-Adjusted Standing Orders Regimen',
    patientCounselingTitle: 'Trilingual Patient Counseling Script (EN / HA / JK)',
    referralNoteTitle: 'Referral & Surveillance Pathway',
    presetScenariosLabel: 'Load Clinical Field Case:',
    offlineEngineBadge: 'Offline Standing Orders Engine',
    onlineAiBadge: 'Hybrid Gemini AI + Standing Orders',
  },
  ha: {
    appSubtitle: 'Mataimakin Tantance Marasa Lafiya na Cibiyoyin PHC a Jihar Taraba',
    navTriage: 'Tantance Mara Lafiya',
    navRegister: 'Rijistar Marasa Lafiya',
    navProtocols: 'Ka’idojin Jinya',
    navPhrasebook: 'Kalmomin Hausa/Jukun',
    newTriageCta: 'Sabon Mara Lafiya',
    patientIntakeTitle: 'Bayanan Mara Lafiya da Gwaje-gwaje',
    patientNameLabel: 'Cikakken Sunan Mara Lafiya',
    ageYearsLabel: 'Shekaru',
    weightKgLabel: 'Nauyi (kg)',
    tempCLabel: 'Zafin Jiki (°C)',
    muacCmLabel: 'Kaurin Damtse MUAC (cm)',
    pregnantLabel: 'Mai Juna Biyu',
    symptomChecklistTitle: 'Alamomin Cuta da Alamomin Hatsari',
    chatInputPlaceholder: 'Rubuta alamomin rashin lafiya da Hausa, Turanci ko Jukun...',
    runTriageBtn: 'Fara Tantance Lafiya',
    saveToRegisterBtn: 'Ajiye a Rijistar PHC',
    savedConfirmation: 'An Ajiye a Rijista',
    clinicalDecisionTitle: 'Sakamakon Tantancewa da Umarnin Jinya',
    dosageStandingOrderTitle: 'Ma’aunin Magani Bisa Nauyin Jiki',
    patientCounselingTitle: 'Shawarwarin Jinya a Harsuna 3 (EN / HA / JK)',
    referralNoteTitle: 'Turawa Babban Asibiti (Referral)',
    presetScenariosLabel: 'Gwada Misalin Mara Lafiya:',
    offlineEngineBadge: 'Injin Tantancewa Mara Intanet (Offline)',
    onlineAiBadge: 'Haɗin Gemini AI + Standing Orders',
  },
  jk: {
    appSubtitle: 'Mataimakin PHC na Jihar Taraba (Turanci, Hausa, Jukun Wapan)',
    navTriage: 'Tantance Apyi (Triage)',
    navRegister: 'Rijistar Asibiti',
    navProtocols: 'Dokokin Akyen',
    navPhrasebook: 'Kalmomin Jukun/Hausa',
    newTriageCta: 'Sabon Mara Lafiya',
    patientIntakeTitle: 'Bayanan Mara Lafiya (Vitals)',
    patientNameLabel: 'Sunan Mara Lafiya',
    ageYearsLabel: 'Shekaru (Age)',
    weightKgLabel: 'Nauyin Apyi (kg)',
    tempCLabel: 'Zafin Apyi (°C)',
    muacCmLabel: 'MUAC na Angwu (cm)',
    pregnantLabel: 'Mai Ciki',
    symptomChecklistTitle: 'Alamomin Tswen Apyi da Hatsari',
    chatInputPlaceholder: 'Rubuta bayanin tswen apyi da Jukun, Hausa ko Turanci...',
    runTriageBtn: 'Tantance Mara Lafiya',
    saveToRegisterBtn: 'Ajiye a Rijistar PHC',
    savedConfirmation: 'An Ajiye',
    clinicalDecisionTitle: 'Sakamakon Tantancewa (Standing Orders)',
    dosageStandingOrderTitle: 'Yawan Akyen Bisa Nauyin Apyi',
    patientCounselingTitle: 'Shawarwari da Jukun, Hausa da Turanci',
    referralNoteTitle: 'Turawa Asibiti Ukwu (Referral)',
    presetScenariosLabel: 'Zabi Misalin Mara Lafiya:',
    offlineEngineBadge: 'Offline PHC Triage Engine',
    onlineAiBadge: 'Hybrid Gemini AI + Offline Engine',
  },
};
