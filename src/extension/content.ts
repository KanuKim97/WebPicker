/// <reference path="../types/chrome.d.ts" />

type Locale = "ko" | "en";

type ExtensionRequest =
  | { type: "GET_PAGE_TEXT"; locale: Locale }
  | { type: "GET_SELECTION"; locale: Locale }
  | { type: "GET_DOM_TARGETS"; locale: Locale }
  | { type: "EXECUTE_DOM_ACTION"; locale: Locale; payload: DomAction };

type PageTextResponse = {
  ok: true;
  text: string;
  title: string;
  url: string;
} | {
  ok: false;
  error: string;
};

type SelectionResponse = {
  ok: true;
  text: string;
} | {
  ok: false;
  error: string;
};

type DomTargetsResponse = {
  ok: true;
  targets: DomTarget[];
} | {
  ok: false;
  error: string;
};

type DomActionResponse = {
  ok: true;
  message: string;
} | {
  ok: false;
  error: string;
};

type DomTarget = {
  id: string;
  kind: "input" | "button" | "link";
  label: string;
  text: string;
  href?: string;
};

type DomAction =
  | { action: "fill_input"; targetId: string; value: string }
  | { action: "click_element"; targetId: string }
  | { action: "navigate_to"; url: string };

let lastSelection = "";
let cachedTargets = new Map<string, Element>();

document.addEventListener("mouseup", () => {
  const text = window.getSelection()?.toString().trim() ?? "";
  if (text.length > 0) {
    lastSelection = normalizeWhitespace(text);
    chrome.runtime.sendMessage({ type: "SELECTION_UPDATED", payload: { text: lastSelection } });
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const request = message as ExtensionRequest;

  if (request.type === "GET_PAGE_TEXT") {
    sendResponse(getPageText(request.locale));
    return;
  }

  if (request.type === "GET_SELECTION") {
    sendResponse(getSelectionText(request.locale));
    return;
  }

  if (request.type === "GET_DOM_TARGETS") {
    sendResponse(getDomTargets());
    return;
  }

  if (request.type === "EXECUTE_DOM_ACTION") {
    sendResponse(executeDomAction(request.payload, request.locale));
    return;
  }
});

function getPageText(locale: Locale): PageTextResponse {
  const title = document.title || "Untitled";
  const url = location.href;
  const text = cleanPageText(document.body?.innerText ?? "");

  if (!text) {
    return { ok: false, error: translate(locale, "noPageText") };
  }

  return { ok: true, title, url, text };
}

function getSelectionText(locale: Locale): SelectionResponse {
  const currentSelection = window.getSelection()?.toString().trim() ?? "";
  const text = normalizeWhitespace(currentSelection || lastSelection);

  if (!text) {
    return { ok: false, error: translate(locale, "noSelection") };
  }

  lastSelection = text;
  return { ok: true, text };
}

function getDomTargets(): DomTargetsResponse {
  cachedTargets = new Map();
  const targets: DomTarget[] = [];

  const selectors = [
    "input:not([type='hidden']):not([disabled])",
    "textarea:not([disabled])",
    "button:not([disabled])",
    "a[href]"
  ];

  Array.from(document.querySelectorAll<Element>(selectors.join(",")))
    .filter((element) => isVisible(element))
    .slice(0, 80)
    .forEach((element, index) => {
      const kind = getTargetKind(element);
      if (!kind) return;

      const id = `osa-target-${index}`;
      cachedTargets.set(id, element);
      targets.push({
        id,
        kind,
        label: getAccessibleLabel(element),
        text: normalizeWhitespace(element.textContent ?? ""),
        href: element instanceof HTMLAnchorElement ? element.href : undefined
      });
    });

  return { ok: true, targets };
}

function executeDomAction(
  action: DomAction,
  locale: Locale,
): DomActionResponse {
  if (action.action === "navigate_to") {
    try {
      const nextUrl = new URL(action.url, location.href);
      if (nextUrl.origin !== location.origin) {
        return { ok: false, error: translate(locale, "crossOriginBlocked") };
      }
      location.assign(nextUrl.href);
      return { ok: true, message: translate(locale, "navigating") };
    } catch {
      return { ok: false, error: translate(locale, "invalidUrl") };
    }
  }

  const element = cachedTargets.get(action.targetId);
  if (!element || !isVisible(element)) {
    return { ok: false, error: translate(locale, "targetNotFound") };
  }

  if (action.action === "fill_input") {
    if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
      return { ok: false, error: translate(locale, "notInput") };
    }

    element.focus();
    element.value = action.value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return { ok: true, message: translate(locale, "inputFilled") };
  }

  if (action.action === "click_element") {
    if (!(element instanceof HTMLElement)) {
      return { ok: false, error: translate(locale, "notClickable") };
    }

    element.focus();
    element.click();
    return { ok: true, message: translate(locale, "clicked") };
  }

  return { ok: false, error: translate(locale, "unsupportedAction") };
}

type ContentMessageKey =
  | "noPageText"
  | "noSelection"
  | "crossOriginBlocked"
  | "navigating"
  | "invalidUrl"
  | "targetNotFound"
  | "notInput"
  | "inputFilled"
  | "notClickable"
  | "clicked"
  | "unsupportedAction";

const contentMessages: Record<Locale, Record<ContentMessageKey, string>> = {
  ko: {
    noPageText: "현재 페이지에서 읽을 수 있는 본문을 찾지 못했습니다.",
    noSelection: "선택된 텍스트가 없습니다.",
    crossOriginBlocked:
      "현재 사이트와 다른 origin으로는 이동할 수 없습니다.",
    navigating: "요청한 페이지로 이동합니다.",
    invalidUrl: "유효하지 않은 URL입니다.",
    targetNotFound: "대상 요소를 찾을 수 없습니다. 후보를 다시 불러오세요.",
    notInput: "선택한 대상은 입력 가능한 요소가 아닙니다.",
    inputFilled: "입력값을 채웠습니다.",
    notClickable: "클릭할 수 있는 요소가 아닙니다.",
    clicked: "요소를 클릭했습니다.",
    unsupportedAction: "지원하지 않는 자동화 액션입니다.",
  },
  en: {
    noPageText: "No readable page content was found.",
    noSelection: "No text is selected.",
    crossOriginBlocked: "Navigation to a different origin is not allowed.",
    navigating: "Navigating to the requested page.",
    invalidUrl: "The URL is invalid.",
    targetNotFound: "The target element was not found. Refresh the candidates.",
    notInput: "The selected target is not an input element.",
    inputFilled: "The input value was filled.",
    notClickable: "The selected element is not clickable.",
    clicked: "The element was clicked.",
    unsupportedAction: "This automation action is not supported.",
  },
};

function translate(locale: Locale, key: ContentMessageKey): string {
  return contentMessages[locale][key];
}

function cleanPageText(text: string): string {
  const noisyLinePattern =
    /^(menu|navigation|nav|footer|advertisement|ads?|cookie|privacy policy|terms|subscribe|sign in|log in|로그인|회원가입|구독|광고|쿠키|개인정보|이용약관)$/i;

  return text
    .split(/\n+/)
    .map((line) => normalizeWhitespace(line))
    .filter((line) => line.length > 2)
    .filter((line) => !noisyLinePattern.test(line))
    .filter((line, index, lines) => lines.indexOf(line) === index)
    .join("\n")
    .slice(0, 30000);
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function isVisible(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.visibility !== "hidden" &&
    style.display !== "none" &&
    Number(style.opacity) !== 0
  );
}

function getTargetKind(element: Element): DomTarget["kind"] | null {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) return "input";
  if (element instanceof HTMLButtonElement) return "button";
  if (element instanceof HTMLAnchorElement) return "link";
  return null;
}

function getAccessibleLabel(element: Element): string {
  const aria = element.getAttribute("aria-label");
  const title = element.getAttribute("title");
  const placeholder =
    element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
      ? element.placeholder
      : "";
  const text = normalizeWhitespace(element.textContent ?? "");

  return normalizeWhitespace(aria || title || placeholder || text || element.tagName.toLowerCase()).slice(
    0,
    120
  );
}
