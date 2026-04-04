---
name: thought-pattern-analyzer-en
description: Extracts thinking patterns from conversation logs across 9 axes and generates a fingerprint JSON. Proper nouns, technical details, and URLs are not included in output.
trigger: When the user says "analyze my thinking", "analyze this log", "thought analyze", "analyze my thinking patterns". Or "dual analyze", "analyze my thinking and coding direction" (runs dual analysis mode). Or "pair analyze", "analyze including AI responses", "analyze the dialogue loop" (runs pair analysis mode).
---

# Thinking Pattern Analyzer skill v3.0

## Language Rule (Highest Priority)

**Detect the dominant language of the input log and match all output to it.**

| Input log language | Output language (non-JSON) | JSON commentary fields |
|---|---|---|
| Japanese dominant | Japanese | Japanese |
| English dominant | English | English |
| Mixed (~50/50) | Match the language of the trigger | Trigger language |

JSON key names and axis values (e.g., `concrete_to_abstract`) are always English regardless of language.
Only the `commentary` text and `theoretical_references` wording switch language.
**Startup messages, submission prompts, and all conversational text follow the same language rule.**

---

## Startup Message (Always Display)

When this skill is loaded, display the following (do not modify or omit):

---

**Thinking Pattern Analyzer skill v3.0 loaded.**

Paste the conversation log you want to analyze.
(Runs all 3 analyses: thinking patterns, coding direction, and pair analysis)

---

## What This Skill Does and Does Not Do

**Does**
- Extract thinking patterns across 9 axes from user messages only
- Cite theoretical basis (papers, established theory) for each axis
- Output results as JSON (fingerprint) with natural language commentary

**Does not (verifiable against server code)**
- Include proper nouns, names, service names, or URLs in output
- Include source code, API keys, or technical implementation details
- Extract personally identifiable information
- Transmit the full log externally (this skill runs locally)

---

## Theoretical Basis

| Axis | Theory / Research | Reference |
|---|---|---|
| abstraction_direction | Construal Level Theory | Trope & Liberman (2010), *Psychological Review* |
| problem_style | Kirton Adaption-Innovation Inventory (KAI) | Kirton (1976), *Journal of Applied Psychology* |
| perspective_taking | Empathizing-Systemizing Theory | Baron-Cohen (2003), *The Essential Difference* |
| face_strategy | Politeness Theory | Brown & Levinson (1987), *Politeness* |
| concept_distance | Conceptual Blending / Remote Associates | Fauconnier & Turner (2002); Mednick (1962) |
| evaluation_framing | Framing Effect / Prospect Theory | Kahneman & Tversky (1979), *Econometrica* |
| need_for_cognition | Need for Cognition Scale | Cacioppo & Petty (1982), *JPSP* |
| integrative_complexity | Integrative Complexity | Suedfeld & Tetlock (1977) |
| epistemic_curiosity | Epistemic Curiosity (I/D type) | Litman & Spielberger (2003), *Personality and Individual Differences* |

---

## Analysis Procedure

### Step 0: Data Volume Check (Always Run Before Analysis)

Count user messages and total characters in the conversation since this skill was triggered.

| Count | Approx. chars | Judgment |
|---|---|---|
| < 10 | < 300 | **Cannot analyze.** Tell the user: "Not enough data yet. Please continue the conversation and try again (suggested: 50+ messages)." |
| 10–30 | 300–1000 | **Low confidence.** Run analysis but mark all axes `low_confidence` and note this. |
| 30–100 | 1000–5000 | **Standard.** Run analysis normally. |
| 100+ | 5000+ | **High precision.** Note: "Sufficient data for high-precision analysis." |

**Important:** If the user pastes an external log, apply these thresholds to that log's count and character length.

---

### Step 1: Log Preprocessing

Extract only user messages from the input log.
Ignore AI responses, tool outputs, code blocks, and URLs.

### Step 2: Extract 9 Axes

Evaluate each axis using the definitions below.
**Output exactly these 9 axes. Do not add any other information.**

---

#### Axis 1: abstraction_direction
**Theory: Construal Level Theory (Trope & Liberman, 2010)**
Greater psychological distance leads to more abstract, principle-level thinking.

| Value | Definition |
|---|---|
| `concrete_to_abstract` | Starts from concrete events or problems; moves toward concepts and principles |
| `abstract_to_concrete` | Starts from concepts or ideas; descends into implementation and specifics |
| `stays_concrete` | Remains in concrete territory throughout |
| `stays_abstract` | Remains at the conceptual/directional level throughout |

---

#### Axis 2: problem_style
**Theory: Kirton Adaption-Innovation Inventory / KAI (Kirton, 1976)**
Adaptor (modifying within the existing framework) vs. Innovator (changing the framework or seeking alternatives).

| Value | Definition |
|---|---|
| `pivot` | Seeks alternative approaches first (Innovator-leaning) |
| `fix` | Identifies root cause and corrects it (Adaptor-leaning) |
| `delegate` | Defers resolution to others |
| `suspend` | Holds judgment for later |

---

#### Axis 3: perspective_taking
**Theory: Empathizing-Systemizing Theory (Baron-Cohen, 2003)**
Degree of spontaneous attention to others' internal states and perspectives.

| Value | Definition |
|---|---|
| `spontaneous` | Arises naturally without being prompted |
| `reactive` | Emerges when prompted or when a related topic arises |
| `absent` | Rarely appears |

---

#### Axis 4: face_strategy
**Theory: Politeness Theory (Brown & Levinson, 1987)**
Relationship between face management (positive/negative face) and linguistic strategy.

| Value | Definition |
|---|---|
| `high_mitigation` | Frequent use of softening expressions: "maybe", "I wonder if", "would it be okay to" |
| `moderate` | Mix of assertions and hedges |
| `low_mitigation` | Predominantly assertive or imperative |

Also assign a score: 0.0 (low mitigation) – 1.0 (high mitigation)

---

#### Axis 5: concept_distance
**Theory: Conceptual Blending (Fauconnier & Turner, 2002) / Remote Associates (Mednick, 1962)**
Semantic distance and diversity of connected conceptual domains. Indicator of creative and divergent thinking.

Output format:
- `bridges`: list of connected domain pairs (**domain names only, no proper nouns or content**)
- `distance`: `near` / `mid` / `far`
- `count`: number of detected bridges

Example domains: `economics`, `emotion`, `technology`, `literature`, `philosophy`, `design`, `learning`, `memory`, `space`, `time`, `other`, `self`, `numbers`, `metaphysics`, `body`, `habit`, `language`

---

#### Axis 6: evaluation_framing
**Theory: Framing Effect / Prospect Theory (Kahneman & Tversky, 1979)**
How information framing influences judgment. Appears in the order and emphasis of evaluations.

| Value | Definition |
|---|---|
| `gain_first` | Leads with affirmation or confirmation, then adds correction |
| `loss_first` | Leads with problems or concerns |
| `neutral` | Information-first; does not foreground value judgments |
| `mixed` | Varies by context |

---

#### Axis 7: need_for_cognition
**Theory: Need for Cognition Scale (Cacioppo & Petty, 1982)**
Degree of enjoyment in engaging with complex problems and spontaneously generating questions.

| Value | Definition |
|---|---|
| `high` | Spontaneously poses questions and develops complex analyses |
| `moderate` | Thinks deeply when needed, but rarely generates questions spontaneously |
| `low` | Prefers concise answers and clear instructions |

---

#### Axis 8: integrative_complexity
**Theory: Integrative Complexity (Suedfeld & Tetlock, 1977)**
Degree of **differentiation** (seeing multiple dimensions) and **integration** (connecting them).
The only empirically validated measure of cognitive complexity extractable from text.

Score: 1–7
- 1: One-dimensional. Single viewpoint only
- 3: Differentiation present. Recognizes multiple dimensions but does not integrate
- 5: Differentiation + integration. Recognizes multiple dimensions and considers interrelationships
- 7: High-level integration. Constructs multidimensional frameworks

---

#### Axis 9: epistemic_curiosity
**Theory: Epistemic Curiosity I/D types (Litman & Spielberger, 2003)**
Type of drive to explore the unknown.
- **I-type (Interest)**: Pleasure in new information itself
- **D-type (Deprivation)**: Discomfort from knowledge gaps, drive to fill them

| Value | Definition |
|---|---|
| `interest_type` | Motivated by "this seems interesting / I want to try it." Knowing is the goal. |
| `deprivation_type` | Motivated by "I can't move forward until I understand." Gap-closing is the goal. |
| `mixed` | Both motivations coexist |

---

### influence_map Judgment Rules

For each axis, describe the characteristic of the message(s) that most influenced the score in `primary_source`.
Determine `confidence` using:

| confidence | Criteria |
|---|---|
| `high` | Consistent pattern throughout the log; low dependence on any single message |
| `medium` | Readable from multiple messages, but influenced by a specific section or speaking style |
| `low` | Judgment relies on few messages, or log volume is insufficient |

`primary_source` examples:
- `"Consistent throughout. Especially prominent during technical problem framing."`
- `"May be influenced by self-introductory statements at the start."`
- `"Estimated from 2–3 messages in the latter half due to limited data."`

**Note:** `influence_map` is a user-facing transparency field and is not sent to the server.

---

### Step 3: Output Format (Fixed)

```json
{
  "schema_version": "3.0",
  "analysis_type": "thought_pattern",
  "lang": "en",
  "analyzed_at": "YYYY-MM",
  "message_count": N,
  "fingerprint": {
    "abstraction_direction": "...",
    "problem_style": "...",
    "perspective_taking": "...",
    "face_strategy": {
      "value": "...",
      "score": 0.XX
    },
    "concept_distance": {
      "bridges": ["domain A × domain B"],
      "distance": "...",
      "count": N
    },
    "evaluation_framing": "...",
    "need_for_cognition": "...",
    "integrative_complexity": N,
    "epistemic_curiosity": "..."
  },
  "commentary": {
    "summary": "Overall picture in 120 words or fewer",
    "holistic_profile": "400 words or fewer. Natural description of thinking tendencies without using axis names.",
    "strengths": ["..."],
    "blind_spots": ["..."],
    "universality_note": "...",
    "notable": "...",
    "low_confidence": ["(axis names in English)"]
  },
  "influence_map": {
    "abstraction_direction": { "primary_source": "Brief description of messages that most influenced this axis", "confidence": "high|medium|low" },
    "problem_style":         { "primary_source": "...", "confidence": "high|medium|low" },
    "perspective_taking":    { "primary_source": "...", "confidence": "high|medium|low" },
    "face_strategy":         { "primary_source": "...", "confidence": "high|medium|low" },
    "concept_distance":      { "primary_source": "...", "confidence": "high|medium|low" },
    "evaluation_framing":    { "primary_source": "...", "confidence": "high|medium|low" },
    "need_for_cognition":    { "primary_source": "...", "confidence": "high|medium|low" },
    "integrative_complexity":{ "primary_source": "...", "confidence": "high|medium|low" },
    "epistemic_curiosity":   { "primary_source": "...", "confidence": "high|medium|low" }
  },
  "theoretical_references": [
    "Trope & Liberman (2010) Construal Level Theory",
    "Kirton (1976) KAI",
    "Baron-Cohen (2003) E-S Theory",
    "Brown & Levinson (1987) Politeness Theory",
    "Fauconnier & Turner (2002) Conceptual Blending",
    "Kahneman & Tversky (1979) Prospect Theory",
    "Cacioppo & Petty (1982) Need for Cognition",
    "Suedfeld & Tetlock (1977) Integrative Complexity",
    "Litman & Spielberger (2003) Epistemic Curiosity"
  ]
}
```

---

### Step 3.5: AI Personal Feedback

After outputting the JSON, check the following context in priority order before writing the comment.

#### Context Check (Priority Order)

**① Check memory files**
Check whether relevant memory files exist under `memory/` in the current project directory.
- Exist → Reference accumulated context about the user (thinking style, feedback history, project background, past analysis results) when writing the comment.
- Absent or sparse → Use only observations from the current session.

**② Check user_token (personal scale)**
Check whether the user provided a `user_token` in this analysis.
- Token present → Past analyses may be accumulated in the DB. Reference past analysis records saved in `analysis-log.md` if available.
- No token / first time → Treat this as a one-time snapshot.

#### Depth Label (Always State Explicitly)

| Situation | Label |
|---|---|
| Rich memory + past analyses available | `From accumulated context and this session` |
| Memory present, no past analyses | `From context and this session` |
| No memory, session only | `From this session only` |

Always include this label at the start of the comment.

**Privacy note:** This comment must not include proper nouns, code, or URLs. It covers only patterns observed from the analysis results and conversation.

#### Output Format (Display after JSON, before submission prompt)

---

**💬 Personal note from Claude**
*[depth label] / Not included in the analysis JSON*

(150–300 words. Written directly to the user as "you". No axis names. Natural language. Surface patterns, tensions, or growth areas the numbers cannot capture. If memory is sparse, soften assertions: "in this session, it seemed like…")

---

### Step 4: Submission Prompt

After output, display the following (do not modify or omit):

---

**What this JSON contains — and what it does not**

Contains: thinking pattern structure (9 axes), message count, theoretical references, influence_map (source and confidence per axis)
Does not contain: proper nouns, service names, code, URLs, conversation content
※ influence_map stays local only — it is not sent to the server.

---

**About database submission (optional)**

Submitting stores this result (axis values only) anonymously. As data accumulates, comparison with other users (uniqueness score) will become possible. You can use the results on this screen without submitting.

You can verify what is sent via the server code: https://github.com/thought-analyzer/thought-analyzer

---

**Would you like to submit?** Include a token if you want time-series tracking (e.g., `yes mytoken` / `yes` / `no`)

The token links future analyses to you. Only the hash is stored — the original string is never retained.

Wait for the user's response.

- **`yes [token]`** → Process with or without token and submit immediately
- **`yes`** (no token) → Submit without token field
- **`no`** → Display: "Not submitted. Feel free to use the analysis results on this screen."

---

After receiving the user's token response, build the submission JSON (excluding `commentary` and `theoretical_references`) and run it automatically with the Bash tool.

Fields to submit (must fit within 2000 bytes):

```json
{
  "schema_version": "3.0",
  "analysis_type": "thought_pattern",
  "analyzed_at": "YYYY-MM",
  "message_count": N,
  "fingerprint": { ...9 axis values only... },
  "user_token": "(include only if provided; omit the field entirely if skipped)"
}
```

Run with Bash:

```bash
curl -s -X POST https://thought-analyzer.com/collect \
  -H "Content-Type: application/json" \
  -d '{expanded submission JSON here}'
```

After execution, check the response and display:

**Submission successful:**
```
Submitted successfully (payload_size: XX bytes)

record_id: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

Save this ID to retrieve or verify your data later.
```

**Submission failed:** "Submission failed."

---

## Unified Analysis Flow (Always Run After Log Is Received)

After the log is pasted, run all 3 analyses in sequence:

1. **Thinking pattern analysis** (Steps 0–3) → JSON-A (`analysis_type: "thought_pattern"`)
2. **Coding direction analysis** (per coding-direction-skill.md) → JSON-B (`analysis_type: "coding_direction"`)
3. **Pair analysis** (Pair Analysis Mode Steps 1–4) → JSON-C (`analysis_type: "pair_analysis"`)
4. **Step 3.5** (AI personal feedback) → `ai_comment` + `ai_comment_depth`

After displaying all 3 JSONs and the personal comment, ask for submission in one line:

```
All 3 analyses complete. Submit? (both / thinking / coding / none) — include a token if you have one (e.g., "both mytoken")
```

Pair analysis is not submitted (outside current DB schema). "Both" = thinking patterns + coding direction.

On submission, send separate POST requests and report both record_ids:
```
Submitted:
- Thinking patterns  record_id: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
- Coding direction   record_id: yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
```

### Unified HTML (Always auto-generate — no confirmation needed)

Write the unified JSON to `/tmp/unified-result.json`, then run:

```json
{
  "thought": { ...JSON-A full version (with commentary)... },
  "coding": { ...JSON-B full version (with commentary)... },
  "pair": { ...JSON-C full version (with commentary)... },
  "ai_comment": "(Step 3.5 comment text)",
  "ai_comment_depth": "(depth label)"
}
```

```bash
cat > /tmp/unified-result.json << 'ENDJSON'
{ ...unified JSON here... }
ENDJSON

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTFILE="C:/Users/yoshi/Documents/skills/thought-analyzer/result-unified-${TIMESTAMP}.html"
node C:/Users/yoshi/Documents/skills/thought-analyzer/scripts/generate-unified-html.js \
  "$(cat /tmp/unified-result.json)" \
  "$OUTFILE"
start "$OUTFILE"
```

Report: "Opened the unified visualizer in your browser."

---

## Pair Analysis Mode (AI–User Dialogue Loop Analysis)

Runs automatically as part of the unified analysis flow when the log contains AI responses.

**Reads**
- AI responses (used to identify what the user reacted to, not to analyze content)
- User messages (reactions, modifications, rejections)

**Does not read**
- Code block contents, URLs, proper nouns, API keys

Results are not submitted to the server (outside current DB schema).

---

### Step 1: Pair Extraction

Extract (AI response → user reaction) pairs in sequence.

- The user message immediately following an AI response is the "reaction"
- User messages before an AI response (prior instructions) are used as context only
- Record the total number of pairs (`pair_count`)

Format:
```
Human: ... (prior instruction)
Assistant: ... (AI response)
Human: ... (← this is the reaction; the unit of a pair)
```

---

### Step 2: Reaction Classification

Classify each reaction into one of 4 types:

| Reaction | Criteria |
|---|---|
| `adopt` | Moves to the next instruction without referencing the AI output, or accepts with "OK" / "thanks" |
| `modify` | References or quotes the AI output and adds corrections or follow-up instructions |
| `reject` | Explicitly negates or redirects ("that's not it", "different direction") |
| `ignore` | Moves to an unrelated topic regardless of AI output |

---

### Step 3: Extract reaction_patterns

#### `reaction_distribution`
Calculate the distribution of the 4 reaction types as scores from 0.0–1.0 (summing to 1.0).

#### `delegation_boundary`
Record what types of tasks the user delegates to AI and what judgments they retain, using abstract category labels.
- `delegates`: abstract labels for domains where adopt/modify dominate
- `retains`: abstract labels for judgment domains where reject or user-led direction dominates
- Do not include proper nouns, technology names, or service names

Theoretical basis: Risko & Gilbert (2016) Cognitive Offloading

#### `correction_precision`
For pairs classified as `modify`, determine the granularity of correction.

| Value | Definition |
|---|---|
| `surgical` | Precise replacement or addition of a specific word, sentence, or logic |
| `directional` | Broad re-instruction: "go in this direction" or "make it more X" |
| `holistic` | Discards previous output and rebuilds from scratch |

Set to `null` if modify pairs are fewer than 10% of total.

Theoretical basis: Hattie & Timperley (2007) Feedback Processing

#### `blind_spot_patterns`
Record elements in AI output that the user consistently does not react to. Only record if a consistent pattern of 3+ instances is confirmed.

| Value | Definition |
|---|---|
| `alternatives` | Always takes the first option when AI offers multiple choices |
| `caveats` | Consistently skips warnings, limitations, or disclaimers |
| `questions_back` | Consistently ignores AI's counter-questions |
| `summary` | Consistently skips recap or summary sections |

Return `[]` if no pattern is confirmed.

#### `preferred_ai_style`
Infer the AI output style that allows this user to move forward comfortably, from the combination of `blind_spot_patterns` and `reaction_distribution`.

| Value | Definition | Inference basis |
|---|---|---|
| `decisive` | One best option. Assertion over alternatives | `alternatives` consistently appears in blind_spot_patterns |
| `exploratory` | Expand possibilities. Deepen the question | High `modify` rate; user consistently seeks different angles |
| `concise` | Short and direct. Conclusion over detail | User skips AI output tail, or `modify` repeatedly requests condensing |
| `structured` | Step-by-step organization | High `adopt` rate; stable positive reaction to structured output |

**On `ignore`:** ignore can mean "moved to a different topic," but it also occurs when AI output style mismatches the user's expectations. When ignore rate is high and follows a consistent pattern, treat it as a "not satisfied" signal and factor it into `preferred_ai_style`.

Return `null` if inference is difficult.

---

### Step 4: Output Format (Fixed)

```json
{
  "schema_version": "3.0",
  "analysis_type": "pair_analysis",
  "lang": "en",
  "analyzed_at": "YYYY-MM",
  "pair_count": N,
  "reaction_patterns": {
    "reaction_distribution": {
      "adopt": 0.XX,
      "modify": 0.XX,
      "reject": 0.XX,
      "ignore": 0.XX
    },
    "delegation_boundary": {
      "delegates": ["(abstract category label)"],
      "retains": ["(abstract category label)"]
    },
    "correction_precision": "surgical | directional | holistic | null",
    "blind_spot_patterns": ["..."],
    "preferred_ai_style": "decisive | exploratory | concise | structured | null"
  },
  "commentary": {
    "summary": "120 words or fewer",
    "interaction_style": "200 words or fewer. Describe the kind of dialogue this user wants with AI. No axis names, natural language.",
    "prescription": "200 words or fewer. Concrete improvement suggestions based on reaction_patterns. Centered on preferred_ai_style. Format: 'You tend to… Adding X to your prompts would be effective.'"
  },
  "theoretical_references": [
    "Risko & Gilbert (2016) Cognitive Offloading",
    "Hattie & Timperley (2007) Feedback Processing",
    "Parasuraman, Sheridan & Wickens (2000) Levels of Automation"
  ]
}
```

---

### Step 5: Feedback Output

After the JSON, **always display** the `commentary.prescription` in a separate block (embedding it in JSON alone is not sufficient):

---

**📋 Feedback for you**

> (display `commentary.prescription` as-is)

**Interaction style:** (summarize `commentary.interaction_style` in 1–2 sentences)

---

Pair analysis results are not sent to the server (outside current DB schema).
Display: "Pair analysis complete. This result is available locally only."

---

### Step 6: Visualization

**[Under development — skip this step]** The pair analysis HTML visualizer is currently in development and will not be generated.
