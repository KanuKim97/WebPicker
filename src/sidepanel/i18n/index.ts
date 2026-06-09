export type Locale = "ko" | "en";

const ko = {
  modelChecking: "모델 확인 중",
  noModel: "모델 없음",
  ollamaResponseError: "Ollama 응답 오류: {status}",
  unknownError: "알 수 없는 오류가 발생했습니다.",
  ollamaUnavailable: "로컬 Ollama에 연결할 수 없습니다.",
  selectModelFirst: "먼저 /모델에서 사용할 Ollama 모델을 선택해 주세요.",
  unknownCommand: "알 수 없는 명령어입니다: {command}",
  automationRequiresInstruction: "/자동화 뒤에 수행할 작업을 입력해 주세요.",
  selectCommandFromPalette: "/{command} 명령은 추천 창에서 선택해 주세요.",
  answerTitle: "답변",
  pageSummaryTitle: "페이지 요약",
  translationTitle: "번역",
  screenshotAnalysisTitle: "스크린샷 분석",
  automationPlanTitle: "자동화 계획",
  pageContext:
    "현재 페이지 컨텍스트입니다. 필요한 경우에만 참조하세요.\n제목: {title}\nURL: {url}\n본문:\n{body}",
  chatSystem:
    "당신은 로컬 Ollama로 실행되는 브라우저 사이드바 AI 에이전트입니다. 한국어로 간결하고 실용적으로 답하세요.",
  additionalRequest: "\n추가 요청: {instruction}",
  summarySystem:
    "당신은 전문 요약가입니다. 제공된 웹페이지를 한국어로 핵심 위주로 정리하세요. 마크다운으로 작성하고 3줄 요약과 액션 아이템을 포함하세요.",
  pageContent: "제목: {title}\nURL: {url}\n\n본문:\n{body}",
  naturalTranslation: "한국어로 자연스럽게",
  translationSystem:
    "당신은 맥락을 살리는 전문 번역가입니다. 원문의 의도와 톤을 보존하고 설명 없이 번역문만 출력하세요.",
  translationRequest: "번역 요청: {instruction}\n\n원문:\n{source}",
  screenshotDefault: "이 화면을 분석하고 중요한 문제나 다음 행동을 알려줘.",
  imageSupportHint: "선택한 모델이 이미지 입력을 지원하는지도 확인해 주세요.",
  pageUnavailable: "페이지 본문을 가져오지 못했습니다.",
  automationSystem:
    "당신은 브라우저 DOM 자동화 플래너입니다. 안전한 단일 액션만 제안하세요. 한국어 설명 뒤 마지막 줄에 ACTION_JSON: {\"action\":\"...\"} 형식의 JSON 하나를 포함하세요. 가능한 action은 fill_input, click_element, navigate_to 입니다. targetId는 제공된 후보에서만 고르고 navigate_to는 현재 사이트 내부 URL만 제안하세요.",
  automationRequest:
    "사용자 요청: {request}\n\n페이지 요약:\n{summary}\n\nDOM 후보:\n{targets}",
  noCandidates: "후보 없음",
  noActionFound:
    "실행 가능한 액션을 찾지 못했습니다. 요청을 더 구체적으로 입력해 주세요.",
  actionExecuting: "액션 실행 중...",
  chromeOnly: "이 작업은 Chrome 확장 프로그램에서 실행해 주세요.",
  proposedActionFallback: "제안된 액션을 실행할 수 있습니다.",
  clippedText: "[본문이 길어 {limit}자까지만 포함했습니다.]",
  requestStopped: "요청을 중지했습니다.",
  ollamaRunHint: "Ollama가 localhost:11434에서 실행 중인지 확인해 주세요.",
  emptyTitle: "무엇을 도와드릴까요?",
  emptyDescription: "질문을 입력하거나 /를 눌러 페이지 작업을 시작하세요.",
  screenshotAlt: "현재 탭 스크린샷",
  generating: "응답을 생성하고 있습니다...",
  approvalTitle: "자동화 실행 승인",
  execute: "실행",
  cancel: "취소",
  stopGenerating: "생성 중지",
  chooseModel: "모델 선택",
  searchModels: "설치된 모델 검색",
  noInstalledModels: "설치된 모델을 찾지 못했습니다.",
  pageContextTitle: "페이지 컨텍스트",
  includePage: "현재 페이지 포함",
  includePageDescription:
    "질문할 때 현재 페이지의 제목, URL, 본문을 함께 전달합니다.",
  excludePage: "현재 페이지 제외",
  excludePageDescription: "일반 대화만 모델에 전달합니다.",
  newChatQuestion: "새 대화를 시작할까요?",
  newChatDescription: "현재 대화와 작업 결과가 모두 삭제됩니다.",
  newChat: "새 대화",
  reloadQuestion: "WebPicker를 새로고침할까요?",
  reloadDescription:
    "진행 중인 응답이 중단되고 확장 프로그램이 다시 로드됩니다.",
  reload: "새로고침",
  openCommands: "명령어 열기",
  inputLabel: "질문 또는 명령어 입력",
  inputPlaceholder: "질문하거나 / 명령어 입력",
  send: "보내기",
  noMatchingCommands: "일치하는 명령어가 없습니다.",
  backToCommands: "명령어 목록으로",
  languageLabel: "화면 언어",
  chooseLanguage: "언어 설정",
  languageKorean: "한국어",
  languageKoreanDescription: "화면과 AI 응답을 한국어로 표시합니다.",
  languageEnglish: "English",
  languageEnglishDescription: "화면과 AI 응답을 영어로 표시합니다.",
  groupTask: "작업",
  groupSettings: "설정",
  groupManagement: "관리",
} as const;

type TranslationKey = keyof typeof ko;

const en: Record<TranslationKey, string> = {
  modelChecking: "Checking model",
  noModel: "No model",
  ollamaResponseError: "Ollama response error: {status}",
  unknownError: "An unknown error occurred.",
  ollamaUnavailable: "Unable to connect to local Ollama.",
  selectModelFirst: "Select an Ollama model from /model first.",
  unknownCommand: "Unknown command: {command}",
  automationRequiresInstruction: "Enter a task after /automation.",
  selectCommandFromPalette: "Select /{command} from the command palette.",
  answerTitle: "Answer",
  pageSummaryTitle: "Page summary",
  translationTitle: "Translation",
  screenshotAnalysisTitle: "Screenshot analysis",
  automationPlanTitle: "Automation plan",
  pageContext:
    "Here is the current page context. Refer to it only when needed.\nTitle: {title}\nURL: {url}\nContent:\n{body}",
  chatSystem:
    "You are a browser sidebar AI agent running on local Ollama. Respond concisely and practically in English.",
  additionalRequest: "\nAdditional request: {instruction}",
  summarySystem:
    "You are a professional summarizer. Summarize the provided web page in English, focusing on its key points. Use Markdown and include a three-line summary and action items.",
  pageContent: "Title: {title}\nURL: {url}\n\nContent:\n{body}",
  naturalTranslation: "Translate naturally into English",
  translationSystem:
    "You are a professional translator who preserves context. Preserve the source intent and tone, and output only the translation without commentary.",
  translationRequest: "Translation request: {instruction}\n\nSource:\n{source}",
  screenshotDefault:
    "Analyze this screen and identify important issues or next actions.",
  imageSupportHint:
    "Also check whether the selected model supports image input.",
  pageUnavailable: "Unable to retrieve the page content.",
  automationSystem:
    "You are a browser DOM automation planner. Propose only one safe action. After an English explanation, include exactly one JSON object on the final line in the form ACTION_JSON: {\"action\":\"...\"}. Allowed actions are fill_input, click_element, and navigate_to. Choose targetId only from the provided candidates, and propose navigate_to only for URLs within the current site.",
  automationRequest:
    "User request: {request}\n\nPage summary:\n{summary}\n\nDOM candidates:\n{targets}",
  noCandidates: "No candidates",
  noActionFound:
    "No executable action was found. Please make the request more specific.",
  actionExecuting: "Executing action...",
  chromeOnly: "Run this action from the Chrome extension.",
  proposedActionFallback: "The proposed action is ready to run.",
  clippedText: "[The content was truncated to {limit} characters.]",
  requestStopped: "The request was stopped.",
  ollamaRunHint: "Make sure Ollama is running at localhost:11434.",
  emptyTitle: "How can I help?",
  emptyDescription: "Ask a question or press / to start a page task.",
  screenshotAlt: "Current tab screenshot",
  generating: "Generating a response...",
  approvalTitle: "Approve automation action",
  execute: "Run",
  cancel: "Cancel",
  stopGenerating: "Stop generating",
  chooseModel: "Choose model",
  searchModels: "Search installed models",
  noInstalledModels: "No installed models found.",
  pageContextTitle: "Page context",
  includePage: "Include current page",
  includePageDescription:
    "Send the current page title, URL, and content with your questions.",
  excludePage: "Exclude current page",
  excludePageDescription: "Send only the conversation to the model.",
  newChatQuestion: "Start a new chat?",
  newChatDescription: "The current conversation and task results will be deleted.",
  newChat: "New chat",
  reloadQuestion: "Reload WebPicker?",
  reloadDescription:
    "The current response will stop and the extension will reload.",
  reload: "Reload",
  openCommands: "Open commands",
  inputLabel: "Enter a question or command",
  inputPlaceholder: "Ask a question or enter a / command",
  send: "Send",
  noMatchingCommands: "No matching commands.",
  backToCommands: "Back to commands",
  languageLabel: "Display language",
  chooseLanguage: "Language",
  languageKorean: "한국어",
  languageKoreanDescription: "Display the interface and AI responses in Korean.",
  languageEnglish: "English",
  languageEnglishDescription:
    "Display the interface and AI responses in English.",
  groupTask: "TASKS",
  groupSettings: "SETTINGS",
  groupManagement: "MANAGEMENT",
};

const dictionaries = { ko, en };

export type Translator = (
  key: TranslationKey,
  values?: Record<string, string | number>,
) => string;

export function createTranslator(locale: Locale): Translator {
  return (key, values = {}) =>
    dictionaries[locale][key].replace(/\{(\w+)\}/g, (placeholder, name) =>
      name in values ? String(values[name]) : placeholder,
    );
}

export function isLocale(value: unknown): value is Locale {
  return value === "ko" || value === "en";
}
