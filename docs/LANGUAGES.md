# Chinese and English interface

The fixed buttons at the bottom left switch between **中文** and **EN**. A switch updates the existing page without restarting a simulation, clearing model configuration or recalculating results. The browser remembers the choice. An explicit `?lang=en` or `?lang=zh` takes priority over the saved preference.

Direct English demo: https://haoliu9427.github.io/CoralBleach-Agent-demo/?lang=en#overview

The translations cover the risk explorer, Atlas controls, scientific question, virtual wet lab, model library, spatial/chemical research, computed findings and model connection feedback. English model names can be searched in the library. New LLM requests in English mode request English explanations through the same ModelScope transport and scientific tool contract.

`dist/locales/en.js` contains the reviewed local dictionary. `dist/i18n.js` translates display text and accessibility attributes, including dynamic feedback, without sending text to a translation service. Numeric data, model IDs, field names and raw JSON audit records remain unchanged. User-entered questions and already-received LLM answers remain records of their original exchanges. The linked scientific definition documents are currently Chinese and are labeled accordingly.

## Checks

Run `npm test` and `npm run build`. Browser checks cover switching languages after a completed baseline run, preserving paused culture progress, default group names, translated menus, English searches and both research modes. A valid user token is required to verify live provider output; unit tests check the English request contract without consuming quota.
