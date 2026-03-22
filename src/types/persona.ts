export interface AiPersonaProfile {
  id: string;
  name: string;
  ageRange: string;
  styleVibe: string;
  audienceFit: string;
  scenarioExamples: string[];
  status: "Active" | "Inactive";
}

export interface Persona {
  id: string;
  name: string;
  roleLabel: string;
  summary: string;
  tone: string;
  focus: string;
  audience: string;
  status: "Approved" | "Draft";
  pillars: string[];
  visualNotes: string[];
  sampleHook: string;
  usageShare: number;
  recommendedFor: string;
  lastUsed: string;
}
