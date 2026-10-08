export type CollegeSummary = {
  code: string;
  displayName: string;
  existingNumber: string;
  localNumber: string;
  callCount: number;
  voicemailCount: number;
  lastActivityAt: string | null;
};

export type LumiereVoicemail = {
  id: string;
  collegeCode: string | null;
  collegeName: string;
  fromNumber: string | null;
  receivedAt: string;
  durationSeconds: number;
  transcription: string | null;
  recordingUrl: string | null;
};

export type LumiereCall = {
  id: string;
  collegeCode: string | null;
  collegeName: string;
  fromNumber: string | null;
  direction: string | null;
  status: string | null;
  startedAt: string | null;
  durationSeconds: number;
  recordingUrl: string | null;
};

export type CallVolumeBucket = {
  key: string;
  label: string;
  answered: number;
  voicemail: number;
  abandoned: number;
};

export type CollegeAnswerRate = {
  code: string;
  displayName: string;
  totalCalls: number;
  answered: number;
  answerRatePct: number;
};

export type HeatmapCell = {
  dayOfWeek: number;
  hour: number;
  count: number;
};

export type LumiereAnalytics = {
  callVolume: CallVolumeBucket[];
  collegeAnswerRates: CollegeAnswerRate[];
  heatmap: HeatmapCell[];
  avgAnsweredDurationSeconds: number;
  answerRatePct: number;
  previousPeriod: {
    totalCalls: number;
    totalVoicemails: number;
    answerRatePct: number;
  } | null;
};

export type RangePreset = "24h" | "7d" | "30d";

export type LumiereOverview = {
  kpis: {
    totalCalls: number;
    totalVoicemails: number;
    collegesWithActivity: number;
  };
  colleges: CollegeSummary[];
  recentVoicemails: LumiereVoicemail[];
  recentCalls: LumiereCall[];
  recentVoicemailsTruncated: boolean;
  recentCallsTruncated: boolean;
  analytics: LumiereAnalytics;
  rangeLabel: string;
  generatedAt: string;
};
