export type CollegeSummary = {
  code: string;
  displayName: string;
  existingNumber: string;
  localNumber: string;
  callCount24h: number;
  voicemailCount24h: number;
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
};

export type LumiereOverview = {
  kpis: {
    totalCalls24h: number;
    totalVoicemails24h: number;
    collegesWithActivity24h: number;
  };
  colleges: CollegeSummary[];
  recentVoicemails: LumiereVoicemail[];
  recentCalls: LumiereCall[];
  generatedAt: string;
};
