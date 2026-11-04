# Architecture rules
- Keep the existing Telegram webhook, tool engine and persistence; improve them in place to preserve working behavior.
- Astra tool and multimodal requests use streamed Responses with complete inline tool/reasoning history because Chat Completions does not support Astra tools.
- All Telegram analysis paths use the existing per-chat conversation store; attachment references and extracted text are persisted alongside normal speech so follow-ups share context.
- Store attachment references without bot-token URLs; download image bytes only inside authenticated server processing to keep credentials private.