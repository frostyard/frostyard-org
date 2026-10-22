# Write docs for the person at the keyboard

**When it applies:** Any change to a page under `src/content/docs/`, and any
component text that renders on those pages (for example
`src/components/ExtensionSnapshot.astro`). It binds people, agents, and
subagents alike.

**The reader:** someone who runs a Frostyard machine and wants to do one
thing: install, enable, update, remove, or fix. They did not read the source
and do not want to. Write the page they can follow with one hand on the
keyboard. [Bluefin's NVIDIA sysext page](https://docs.projectbluefin.io/server/nvidia-sysext/)
is the model.

## Rules

1. **Talk to the reader.** Use "you" and imperative steps: "Enable the
   extension:", then the command. Never "the operator" or "the user".
2. **Task first.** Open with one to three sentences: what this is and who
   needs it. Then the steps. Reference material (what ships, file paths,
   package lists) goes after the steps.
3. **Say what to run and what they see.** Every step has a command, and the
   next line says what success looks like, or what to check.
4. **Sources go in the Sources footer only.** The body states facts. It does
   not say where a fact came from. No "the pinned source defines", "the
   sources do not state", "the build configuration says", "source-backed",
   or "evidence". Links in the body are for the reader's next step (another
   guide, the installer), not for proof.
5. **State a real limit once, plainly.** "Not tested on Snowfield hardware."
   "Updex v2.0.3 does not refuse this." One sentence, in the place the reader
   needs it. Do not repeat it in every section, and do not hedge facts that
   are not limits.
6. **Short sentences, plain words.** One idea in each sentence. Prefer
   "use" to "utilize", "check" to "verify that it is the case that". Cut
   every word that does not help the reader act.
7. **No filler.** No intro that restates the title. No summary paragraph.
   No closing line ("With this, you are ready to…"). Stop when the task is
   done.
8. **Keep every checked fact.** A voice pass changes how a fact is said,
   never whether it is said. If a fact only explains where another fact came
   from, it moves to Sources.

## Tells of machine-written prose

Wikipedia's editors keep a field guide, "Signs of AI writing". These are the
habits from it that show up in technical docs. Avoid all of them:

- **Inflated words.** delve, robust, seamless, comprehensive, leverage,
  crucial, pivotal, intricate, meticulous, showcase, underscore, foster,
  landscape, realm, testament, tapestry, empower, unlock, elevate. Each one
  sounds important and says nothing. Use the plain word or drop it.
- **Throat-clearing.** "It is important to note that", "It is worth
  noting", "Note that". If it matters, the sentence says it without the
  wrapper.
- **"Ensure".** Say what to check, or state the result.
- **Connector padding.** Furthermore, moreover, additionally, notably.
  Start the next sentence instead.
- **Triplets by reflex.** Lists of exactly three adjectives or clauses
  ("fast, reliable, and secure") when the facts do not come in threes.
- **"Not only … but also", "It's not X, it's Y".** Two plain sentences.
- **Em-dash chains.** Use a full stop, a colon, or a comma. Pages carry no
  em dashes at all.
- **Trailing "-ing" clauses** that add a vague effect: ", ensuring
  reliability", ", highlighting the need for".
- **Summaries and sign-offs.** "In summary", "Overall", "With these steps
  you can confidently…".
- **Hedge stacks.** "may potentially", "can help to", "in many cases".
- **Bold everywhere, headings in Title Case, emoji.** Bold only a term the
  reader must not miss. Headings in sentence case.

## The banned-phrase check

`npm run check:prose` (part of `npm run ci`) runs `scripts/check-prose.mjs`.
It reads the one list in `scripts/prose-rules.json` and fails on any match
in `src/content/docs/**`, with the file, the line, the phrase, and a
replacement hint. It skips code blocks, inline code, link targets, and the
Sources section.

To ban a phrase, add it to `scripts/prose-rules.json`. Do not keep a second
list here. The check cannot catch triplets, "not X but Y", or a page that
reads like an audit: you still have to read the page as the reader would.

## Before and after (from the Docker page)

**Before:**
> The pinned sources do not contain a per-product live test record for this
> extension. Verify it on a non-critical host before you depend on it.

**After:**
> Docker has no published test results on Frostyard images yet. Try it on a
> machine you can spare first.

**Before** (a table column heading):
> What the pinned source defines

**After:**
> What you get

**Before:**
> The source's required-path check fails a build that loses the engine, CLI,
> containerd, the service unit, or the activation drop-in. It does not prove
> that the published artifact has the same contents as the current checkout.

**After:**
> Each build checks that the engine, the CLI, containerd, the service unit,
> and the activation drop-in are present. A build that is missing one fails.

**Before:**
> If `enable --now` reports a refresh failure (`refresh_error` in JSON),
> Updex reports the completed steps, but the final refresh failed. Treat the
> merge state as unproven.

**After:**
> If `enable --now` exits with a refresh error (`refresh_error` in JSON), the
> download worked but the merge did not. Run `sudo systemd-sysext refresh`,
> or reboot.

**Learned from:** the Starlight docs pilot (frostyard/frostyard-org#12).
Brian found the first draft "so deeply AI written it's almost unreadable":
the facts were right, but every paragraph argued with its sources instead of
helping the reader.
