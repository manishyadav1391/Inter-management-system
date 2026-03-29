import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ChatEntry = {
  id: string;
  role: "user" | "assistant";
  text: string;
  sql?: string;
  columns?: string[];
  results?: Record<string, unknown>[];
  error?: boolean;
};

type ChatSessionState = {
  draft: string;
  messages: ChatEntry[];
};

type ChatState = {
  sessions: Record<string, ChatSessionState>;
};

const initialState: ChatState = {
  sessions: {},
};

function getSession(state: ChatState, scope: string): ChatSessionState {
  if (!state.sessions[scope]) {
    state.sessions[scope] = { draft: "", messages: [] };
  }
  return state.sessions[scope];
}

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setDraft(
      state,
      action: PayloadAction<{ scope: string; draft: string }>
    ) {
      const { scope, draft } = action.payload;
      const session = getSession(state, scope);
      session.draft = draft;
    },
    addMessage(
      state,
      action: PayloadAction<{ scope: string; message: ChatEntry }>
    ) {
      const { scope, message } = action.payload;
      const session = getSession(state, scope);
      session.messages.push(message);
    },
    clearDraft(state, action: PayloadAction<{ scope: string }>) {
      const session = getSession(state, action.payload.scope);
      session.draft = "";
    },
  },
});

export const { setDraft, addMessage, clearDraft } = chatSlice.actions;
export default chatSlice.reducer;
