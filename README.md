# WebPicker / Ollama Sidebar Agent

Chrome Manifest V3 side panel extension that talks only to a local Ollama instance.

## Development

```bash
npm install
npm run typecheck
npm run build
```

Load the generated `dist/` folder from `chrome://extensions` with **Load unpacked**.

## Ollama

Install Ollama, download at least one model, and keep the Ollama app running.

```bash
ollama pull gemma3:4b
```

WebPicker removes the `Origin` header only from requests to the local Ollama
endpoint with a scoped Chrome declarative network rule. Users do not need to
configure `OLLAMA_ORIGINS`, and rebooting does not require additional setup.

The side panel reads models from `http://localhost:11434/api/tags` and streams chat responses from `http://localhost:11434/api/chat`.

## Features

WebPicker uses one active Ollama model for chat and every command. Type `/` in
the composer to open the command palette.

- `/요약` or `/summary`: summarize the active page.
- `/번역` or `/translate`: translate selected text or the active page.
- `/스크린샷` or `/screenshot`: capture the visible tab and ask the active model to analyze it.
- `/자동화` or `/automation`: propose one DOM action and execute it only after explicit approval.
- `/모델` or `/model`: search and select an installed Ollama model.
- `/컨텍스트` or `/context`: include or exclude the active page from regular chat.
- `/언어` or `/language`: switch the interface and AI response language.
- `/새대화`or `/new`: clear the current conversation and task results.
- `/새로고침`or `/refresh`: reload the WebPicker extension after confirmation.
