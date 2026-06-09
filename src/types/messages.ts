export type Locale = "ko" | "en";

export type ExtensionRequest =
  | { type: "GET_PAGE_TEXT"; locale: Locale }
  | { type: "GET_SELECTION"; locale: Locale }
  | { type: "CAPTURE_VISIBLE_TAB"; locale: Locale }
  | { type: "GET_DOM_TARGETS"; locale: Locale }
  | { type: "EXECUTE_DOM_ACTION"; locale: Locale; payload: DomAction };

export type PageTextResponse = {
  ok: true;
  text: string;
  title: string;
  url: string;
} | {
  ok: false;
  error: string;
};

export type SelectionResponse = {
  ok: true;
  text: string;
} | {
  ok: false;
  error: string;
};

export type CaptureResponse = {
  ok: true;
  dataUrl: string;
} | {
  ok: false;
  error: string;
};

export type DomTargetsResponse = {
  ok: true;
  targets: DomTarget[];
} | {
  ok: false;
  error: string;
};

export type DomActionResponse = {
  ok: true;
  message: string;
} | {
  ok: false;
  error: string;
};

export type DomTarget = {
  id: string;
  kind: "input" | "button" | "link";
  label: string;
  text: string;
  href?: string;
};

export type DomAction =
  | { action: "fill_input"; targetId: string; value: string }
  | { action: "click_element"; targetId: string }
  | { action: "navigate_to"; url: string };
