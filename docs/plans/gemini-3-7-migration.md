# Gemini 3.7 Flash migration

## Goal

Move VenturAssist's primary inference workload from Gemini 2.5 Flash to the stable Gemini 3.7 Flash model without breaking live competitor and market research.

## Scope

- Use Gemini 3.7 Flash for document extraction, structured analysis, RedLens synthesis, competitor synthesis, and chat.
- Keep Google Search grounding on a separately configurable model.
- Remove sampling parameters that Gemini 3.7 no longer supports.
- Verify structured output and Google Search grounding with the configured API key.

## Chosen architecture

`src/lib/ai-models.ts` owns the model selection boundary. `GEMINI_MODEL` defaults to `gemini-3.7-flash`. `GEMINI_SEARCH_MODEL` defaults to `gemini-2.5-flash` because the current key can use Google Search grounding with 2.5, while 3.7 grounding currently returns a quota error.

This keeps all generation on Gemini and lets operators move search grounding to 3.7 later through configuration rather than another code change.

## Non-goals

- Migrating to Nebius or DeepSeek.
- Rewriting prompts or analysis schemas.
- Changing queue, database, authentication, or storage behavior.

## Validation

- TypeScript typecheck.
- Production Next.js build.
- Live structured-output probe against Gemini 3.7 Flash.
- Live Google Search grounding probe against the configured search model.
- Coolify deployment and worker readiness checks.

## Status

Complete. Commit `755c94a` is deployed to `venturassist.sdey.me`; the web app and all three workers passed readiness checks.
