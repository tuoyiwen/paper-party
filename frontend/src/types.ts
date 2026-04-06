export interface ResearchQuestion {
  question: string;
  description: string;
  keywords: string[];
}

export interface LiteratureReference {
  title: string;
  authors: string;
  year: string | null;
  key_argument: string;
  stance: string;
  summary: string;
  abstract: string | null;
  citation_count: number | null;
  url: string | null;
  s2_id: string | null;
  authors_full: string | null;
  tldr: string | null;
  journal: string | null;
  is_top_tier: boolean | null;
}

export interface Table {
  id: string;
  name: string;
  topic: string;
  description: string;
  key_debate: string;
  references: LiteratureReference[];
  consensus: string | null;
  differences: string | null;
}

export interface PartyAnalysis {
  paper_title: string;
  broad_question: ResearchQuestion;
  paper_contribution: string;
  tables: Table[];
}

export interface DialogueMessage {
  role: string;
  content: string;
}

export interface DialogueResponse {
  messages: DialogueMessage[];
}

export interface AlignmentItem {
  table_name: string;
  relationship: string;
  explanation: string;
}

export interface PositionAnalysis {
  position_summary: string;
  alignment: AlignmentItem[];
  gaps_and_opportunities: string[];
  suggested_next_readings: string[];
}
