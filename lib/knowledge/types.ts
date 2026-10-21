export type Agent = {
  id: string;
  name: string;
  description: string;
  topic: string;
  instructions: string;
  color: string;
  icon: string;
  enabled: boolean;
};
export type Chunk = {
  id: string;
  text: string;
  page: number;
  documentId: string;
};
export type KnowledgeDocument = {
  id: string;
  name: string;
  type: string;
  topic: string;
  status: "ready" | "draft";
  createdAt: string;
  size: number;
  chunks: Chunk[];
  key?: string;
  sample?: boolean;
  indexed?: boolean;
  embeddingModel?: string;
};
export type Citation = {
  documentId: string;
  name: string;
  page: number;
  text: string;
  score?: number;
};
export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  mode?: string;
};
export type Conversation = {
  id: string;
  title: string;
  agentId: string;
  messages: Message[];
  updatedAt: string;
};
export type Settings = {
  provider: "demo" | "openai" | "openrouter" | "local";
  model: string;
  temperature: number;
  citations: boolean;
  retrieval: "keyword" | "qdrant";
  localOnly: boolean;
};
export type Workspace = {
  agents: Agent[];
  documents: KnowledgeDocument[];
  conversations: Conversation[];
  settings: Settings;
};
