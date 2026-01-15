# Content Author Brief: WordUp Puzzle Game

## Overview

WordUp is a Bonza-style drag-and-drop word puzzle game for educational content. Players drag word fragments to assemble complete words, learning educational facts upon completion.

**Your role:** Create new puzzles by supplying a single JSON file (`puzzle.json`) per puzzle.

---

## Deliverable Format

For each puzzle, you must provide a **`puzzle.json`** file with the following structure:

```json
{
  "title": "Your Puzzle Title Here",
  "description": "A short description of what the puzzle teaches (1 sentence)",
  "words": [
    {
      "word": "EXAMPLE",
      "fragments": ["EXAM", "PLE"],
      "orientation": "vertical",
      "fact": "Your educational fact about this word. This appears when the player completes the puzzle."
    }
  ]
}
```

---

## Field Specifications

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Puzzle name, typically framed as a question (e.g., "What are GAAP Principles?") |
| `description` | string | One-sentence summary of the learning objective |
| `words` | array | Array of 5-8 word objects (see below) |

### Word Object Fields (all required)

| Field | Type | Description |
|-------|------|-------------|
| `word` | string | The complete word in **UPPERCASE** |
| `fragments` | string[] | Array of 2-4 text pieces that split the word |
| `orientation` | string | Either `"vertical"` or `"horizontal"` |
| `fact` | string | Educational fact (50-150 words). Displayed in victory modal. |

---

## Critical Rules & Invariants

### 1. Fragment Concatenation Rule (CRITICAL)

**All fragments MUST concatenate exactly to form the word.**

```
Good: "ACCOUNTING" -> ["ACCOU", "NTING"]     (ACCOU + NTING = ACCOUNTING)
Good: "ACCOUNTING" -> ["ACCOUNT", "ING"]     (ACCOUNT + ING = ACCOUNTING)
Bad:  "ACCOUNTING" -> ["ACCOUN", "TING"]     (ACCOUN + TING = ACCOUNTING) - Extra 'C'!
```

**Test this manually:** Join your fragments together - they must spell the word exactly.

### 2. Word Count Guidelines

- **Minimum:** 5 words per puzzle
- **Recommended:** 6-8 words per puzzle
- **Maximum:** 10 words (more becomes cramped on mobile)

### 3. Fragment Count Guidelines

- **Minimum:** 2 fragments per word
- **Recommended:** 2-3 fragments per word
- **Maximum:** 4 fragments (more becomes too easy)

### 4. Word Length Guidelines

- **Minimum:** 4 characters (shorter words are too easy)
- **Recommended:** 6-12 characters
- **Maximum:** 15 characters (longer words may not fit on mobile screens)

### 5. Case Sensitivity

- `word` field: **UPPERCASE** (e.g., `"RELEVANCE"`)
- `fragments` field: **UPPERCASE** (e.g., `["RELEV", "ANCE"]`)

### 6. Orientation Mix

For visual variety, use a mix of orientations:
- Aim for approximately 50/50 split between `"vertical"` and `"horizontal"`
- All vertical or all horizontal is acceptable but less visually interesting

### 7. Educational Facts

- Length: 50-150 words per fact
- Tone: Informative, professional
- HTML allowed: You can use `<strong>`, `<em>` for emphasis
- Avoid: Marketing language, opinions, first-person

---

## Example: Complete puzzle.json

```json
{
  "title": "What are Prioritization Methods?",
  "description": "Master the frameworks used to prioritize features and make trade-off decisions",
  "words": [
    {
      "word": "RICE",
      "fragments": ["RI", "CE"],
      "orientation": "vertical",
      "fact": "RICE is a prioritization framework that scores features based on four factors: Reach (how many people), Impact (how much effect), Confidence (how certain), and Effort (time required). The score is calculated as (Reach x Impact x Confidence) / Effort."
    },
    {
      "word": "KANO",
      "fragments": ["KA", "NO"],
      "orientation": "vertical",
      "fact": "The Kano Model categorizes features into five types based on customer satisfaction: Basic (must-haves), Performance (more is better), Excitement (delighters), Indifferent (don't care), and Reverse (satisfaction decreases)."
    },
    {
      "word": "IMPACT",
      "fragments": ["IMPA", "CT"],
      "orientation": "horizontal",
      "fact": "Impact measures the degree of positive effect a feature will have on the desired outcome, typically rated on a scale. High-impact features significantly move key metrics like conversion, retention, or revenue."
    },
    {
      "word": "VALUE",
      "fragments": ["VAL", "UE"],
      "orientation": "horizontal",
      "fact": "Value represents the benefit a feature provides to users or the business. It can be measured as revenue generated, cost saved, problems solved, or user satisfaction gained."
    },
    {
      "word": "EFFORT",
      "fragments": ["EFF", "ORT"],
      "orientation": "vertical",
      "fact": "Effort estimation measures the resources (time, people, complexity) required to complete a feature. It's often expressed in story points, person-hours, or t-shirt sizes (S/M/L/XL)."
    },
    {
      "word": "URGENT",
      "fragments": ["URG", "ENT"],
      "orientation": "horizontal",
      "fact": "The Urgent vs Important matrix helps distinguish between tasks requiring immediate attention and those contributing to long-term goals. Effective product managers balance urgent issues while maintaining focus on important strategic initiatives."
    }
  ]
}
```

---

## Existing Categories

Puzzles are organized into these categories. Please specify which category each puzzle belongs to:

| Category | Topics | Example Puzzles |
|----------|--------|-----------------|
| **Accounting/Finance** | GAAP, financial statements, ratios, equations | accounting-principles, accounting-equation |
| **Product Management** | Frameworks, metrics, methodologies, prioritization | pm-frameworks, pm-prioritization |
| **Cybersecurity** | Security concepts, threats, cryptography, compliance | cybersec-fundamentals, analyst-cryptography |
| **DevOps** | CI/CD, containers, infrastructure, monitoring | devops-cicd-basics, devops-containers |
| **Physiotherapy** | Anatomy, treatments, conditions, rehabilitation | physio-anatomy, physio-conditions |

---

## Submission Checklist

Before submitting each puzzle, verify:

- [ ] `title` is a clear question or topic statement
- [ ] `description` is one sentence summarizing the learning goal
- [ ] 5-8 words included
- [ ] Each word has 2-4 fragments
- [ ] **CRITICAL:** Each word's fragments concatenate exactly to spell the word
- [ ] All words and fragments are UPPERCASE
- [ ] Mix of vertical and horizontal orientations
- [ ] Each fact is 50-150 words and educational
- [ ] JSON is valid (test at jsonlint.com)
- [ ] Category specified for the puzzle

---

## Common Mistakes to Avoid

1. **Fragment mismatch** - Double-check concatenation: `["EXAM", "PLE"]` = "EXAMPLE"
2. **Missing facts** - Every word needs a `fact` field
3. **Lowercase text** - Use UPPERCASE for words and fragments
4. **Too many words** - Stick to 6-8; more crowds the screen
5. **Single fragments** - Each word needs at least 2 fragments
6. **Invalid JSON** - Missing commas, extra commas, unquoted strings

---

## File Naming Convention

Name the puzzle folder using kebab-case:
- `category-topic-name`
- Examples: `accounting-ratios`, `pm-okr-basics`, `cybersec-threat-models`

---

## Questions?

When in doubt about word selection or facts, prioritize:
1. Educational accuracy
2. Industry-standard terminology
3. Words that are interesting to assemble (varied lengths, not all short)
