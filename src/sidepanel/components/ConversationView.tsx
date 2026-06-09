import { Bot, Check, Loader2, Sparkles, X } from "lucide-react";
import type { RefObject } from "react";
import type { Translator } from "../i18n";
import type { ConversationEntry } from "../types/ConversationEntry";
import type { ProposedAction } from "../types/ProposedAction";

type ConversationViewProps = {
  entries: ConversationEntry[];
  busy: boolean;
  modelError: string;
  proposedAction: ProposedAction | null;
  actionStatus: string;
  t: Translator;
  endRef: RefObject<HTMLDivElement | null>;
  onStop: () => void;
  onExecuteAction: () => void;
  onDismissAction: () => void;
};

export function ConversationView({
  entries,
  busy,
  modelError,
  proposedAction,
  actionStatus,
  t,
  endRef,
  onStop,
  onExecuteAction,
  onDismissAction,
}: ConversationViewProps) {
  return (
    <section className="conversation-view" aria-live="polite">
      {modelError && (
        <div className="connection-notice">
          <strong>{modelError}</strong>
          <span>{t("ollamaRunHint")}</span>
        </div>
      )}

      {entries.length === 0 && (
        <div className="conversation-empty">
          <div className="empty-mark">
            <Sparkles size={24} />
          </div>
          <h2>{t("emptyTitle")}</h2>
          <p>{t("emptyDescription")}</p>
        </div>
      )}

      <div className="conversation-list">
        {entries.map((entry) => (
          <article
            key={entry.id}
            className={`conversation-entry ${entry.role}`}
          >
            {entry.role === "assistant" && (
              <div className="entry-avatar">
                <Bot size={15} />
              </div>
            )}
            <div className="entry-body">
              {entry.title && <strong className="entry-title">{entry.title}</strong>}
              {entry.imageUrl && (
                <img
                  className="conversation-image"
                  src={entry.imageUrl}
                  alt={t("screenshotAlt")}
                />
              )}
              <pre>
                {entry.content ||
                  (entry.pending ? t("generating") : "")}
              </pre>
              {entry.pending && <Loader2 className="spin entry-loader" size={15} />}
            </div>
          </article>
        ))}

        {proposedAction && (
          <article className="approval-card">
            <strong>{t("approvalTitle")}</strong>
            <p>{proposedAction.explanation}</p>
            <code>{JSON.stringify(proposedAction.action, null, 2)}</code>
            <div className="approval-actions">
              <button className="primary-button" onClick={onExecuteAction}>
                <Check size={16} />
                {t("execute")}
              </button>
              <button className="secondary-button" onClick={onDismissAction}>
                {t("cancel")}
              </button>
            </div>
          </article>
        )}

        {actionStatus && <p className="action-status">{actionStatus}</p>}
        <div ref={endRef} />
      </div>

      {busy && (
        <button className="stop-button" onClick={onStop}>
          <X size={15} />
          {t("stopGenerating")}
        </button>
      )}
    </section>
  );
}
