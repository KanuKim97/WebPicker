/// <reference path="../types/chrome.d.ts" />

type Locale = "ko" | "en";

type ExtensionRequest =
  | { type: "GET_PAGE_TEXT"; locale: Locale }
  | { type: "GET_SELECTION"; locale: Locale }
  | { type: "CAPTURE_VISIBLE_TAB"; locale: Locale }
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

type CaptureResponse = {
  ok: true;
  dataUrl: string;
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

type RoutedResponse =
  | PageTextResponse
  | SelectionResponse
  | CaptureResponse
  | DomTargetsResponse
  | DomActionResponse;

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => undefined);

chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id }).catch(() => undefined);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const request = message as ExtensionRequest;

  if (request.type === "CAPTURE_VISIBLE_TAB") {
    captureVisibleTab(request.locale).then(sendResponse);
    return true;
  }

  if (
    request.type === "GET_PAGE_TEXT" ||
    request.type === "GET_SELECTION" ||
    request.type === "GET_DOM_TARGETS" ||
    request.type === "EXECUTE_DOM_ACTION"
  ) {
    routeToActiveTab(request).then(sendResponse);
    return true;
  }

  return false;
});

async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function routeToActiveTab(request: ExtensionRequest): Promise<RoutedResponse> {
  const tab = await getActiveTab();
  if (!tab?.id) {
    return { ok: false, error: translate(request.locale, "noActiveTab") };
  }

  return new Promise((resolve) => {
    chrome.tabs.sendMessage<RoutedResponse>(tab.id!, request, (response) => {
      const error = chrome.runtime.lastError?.message;
      if (error) {
        resolve({
          ok: false,
          error: translate(request.locale, "pageAccessFailed"),
        });
        return;
      }

      resolve(
        response ?? {
          ok: false,
          error: translate(request.locale, "noContentResponse"),
        },
      );
    });
  });
}

async function captureVisibleTab(locale: Locale): Promise<CaptureResponse> {
  const tab = await getActiveTab();
  if (!tab?.windowId) {
    return { ok: false, error: translate(locale, "noActiveWindow") };
  }

  return new Promise((resolve) => {
    chrome.tabs.captureVisibleTab(tab.windowId!, { format: "png" }, (dataUrl) => {
      const error = chrome.runtime.lastError?.message;
      if (error || !dataUrl) {
        resolve({
          ok: false,
          error: error ?? translate(locale, "captureFailed"),
        });
        return;
      }

      resolve({ ok: true, dataUrl });
    });
  });
}

type BackgroundMessageKey =
  | "noActiveTab"
  | "pageAccessFailed"
  | "noContentResponse"
  | "noActiveWindow"
  | "captureFailed";

const backgroundMessages: Record<
  Locale,
  Record<BackgroundMessageKey, string>
> = {
  ko: {
    noActiveTab: "현재 활성 탭을 찾을 수 없습니다.",
    pageAccessFailed:
      "현재 페이지에 접근할 수 없습니다. 페이지를 새로고침한 뒤 다시 시도하세요.",
    noContentResponse: "콘텐츠 스크립트 응답이 없습니다.",
    noActiveWindow: "스크린샷을 캡처할 활성 창을 찾을 수 없습니다.",
    captureFailed: "스크린샷 캡처에 실패했습니다.",
  },
  en: {
    noActiveTab: "Unable to find the active tab.",
    pageAccessFailed:
      "Unable to access this page. Reload the page and try again.",
    noContentResponse: "The content script did not respond.",
    noActiveWindow: "Unable to find an active window to capture.",
    captureFailed: "Failed to capture the screenshot.",
  },
};

function translate(locale: Locale, key: BackgroundMessageKey): string {
  return backgroundMessages[locale][key];
}

export {};
