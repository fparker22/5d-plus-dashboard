# 5D+ Teacher Evaluation Skill

## Overview
This skill enables comprehensive teacher evaluation processing using the 5D+ framework for SCMV (South Central Michigan Virtual) and SCMV Options. It processes observation transcripts, generates coded evidence, produces analysis artifacts, and creates Pivot-ready documentation—all locally on your computer.

## Purpose
Transform classroom observation transcripts into actionable, evidence-based evaluation documents that:
- Align with 5D+ instructional framework (Purpose, Student Engagement, Curriculum & Pedagogy, Assessment, Culturally & Emotionally Responsive Climate)
- Meet Michigan Department of Education evaluation requirements
- Protect student privacy (FERPA-compliant)
- Produce artifacts ready for Pivot platform upload
- Support meaningful post-conference conversations

## When to Use This Skill
Claude should invoke this skill whenever the user:
- Uploads or references a classroom observation transcript
- Requests teacher evaluation coding or analysis
- Asks for pre-conference, observation, or post-conference documentation
- Needs 5D+ dimension analysis
- Wants to generate Pivot-ready narratives
- Requests evaluation artifacts (scripted notes, evidence matrices, glows/grows)
- Mentions "teacher evaluation," "5D+," "observation," or "SCMV evaluation"

## Core Capabilities

### 1. Pre-Conference Processing
**Input:** Teacher-provided lesson plan, learning targets, student context
**Output:** 
- Summarized lesson goals with explicit learning targets (LT) and success criteria (SC)
- Student context summary (groups, accommodations—PII redacted)
- Anticipated instructional moves mapped to 5D+ dimensions
- Expected evidence of learning
- Focus dimensions for observation
- 4-6 clarifying questions for discussion

### 2. Transcript Coding & Analysis
**Input:** Classroom transcript (audio-to-text or manual notes) with timestamps
**Output:**
- Timestamped scripted observation notes
- 5D+ coded evidence matrix
- Student talk ratio estimates
- Check-for-understanding (CFU) frequency analysis
- Equity and access summary
- Pattern identification

### 3. Evidence Analysis
**Input:** Coded observation data
**Output:**
- Noticings (evidence-based observations linked to timestamps)
- Wonderings (coaching questions for growth)
- Glows (strengths with 5D+ alignment)
- Grows (growth areas with specific dimensions)
- All tied to student learning impact

### 4. Post-Conference Synthesis
**Input:** Observation data + teacher reflection
**Output:**
- Conference summary
- SMART goal (aligned to 5D+ focus areas)
- Action plan with owners and deadlines
- Evidence collection plan
- Support resources needed

### 5. Summative Documentation
**Input:** Multiple observations + growth data
**Output:**
- Dimension-by-dimension narrative (Pivot-ready)
- Overall performance synthesis
- Progress on goals
- Recommendations for continued growth

### 6. Communication Artifacts
**Output:**
- Professional email summaries
- Concise bullet-point highlights
- Next-step action items with dates
- Links to supporting documents

## 5D+ Framework Reference

### Dimensions & Subdimensions

**P - Purpose**
- P1: Learning Target clarity and alignment
- P2: Success Criteria (co-constructed when possible)
- P3: Relevance and real-world connection

**SE - Student Engagement**
- SE1: Student discourse and thinking made visible
- SE2: Student ownership and metacognition
- SE3: Productive struggle and peer interaction

**CP - Curriculum & Pedagogy**
- CP1: Content accuracy and depth
- CP2: Instructional strategies and differentiation
- CP3: Modeling and scaffolding

**A - Assessment**
- A1: Checks for understanding (CFU) frequency and quality
- A2: Feedback (timely, specific, actionable)
- A3: Student self-assessment and goal-setting

**CEC - Culturally & Emotionally Responsive Climate**
- CEC1: Relationships and belonging
- CEC2: Cultural relevance and asset-based language
- CEC3: Access and accommodations for all learners

### Additional Tags
- `[LT]` - Explicit reference to learning target
- `[SC]` - Success criteria visible/used
- `[FA]` - Formative assessment moment
- `[EQUITY]` - Equity or access consideration
- `[REDACT]` - Contains PII that must be anonymized
- `[Virtual]` - Virtual/hybrid-specific interaction (chat, poll, etc.)

## Evidence Line Schema

Every coded observation moment follows this structure:
```json
{
  "timestamp": "mm:ss",
  "actor": "T|S|S-Group|S-[Initial]",
  "utterance_or_action": "Exact quote or precise description",
  "dimension": "P|SE|CP|A|CEC",
  "subdimension": "P1|P2|P3|SE1|SE2|SE3|CP1|CP2|CP3|A1|A2|A3|CEC1|CEC2|CEC3",
  "tags": ["LT", "FA", "EQUITY", "Virtual"],
  "impact_on_learning": "How this move affected student thinking/access",
  "confidence": 0.0-1.0
}
```

## Processing Workflow

### Phase 1: Intake & Setup
1. **Identify the evaluation stage** (pre-conference, observation, post-conference, summative)
2. **Extract metadata:**
   - Teacher name (Last, First)
   - Date (YYYY-MM-DD)
   - Course/grade level
   - Observer name
   - School (SCMV or SCMV Options)
3. **Determine focus dimensions** (if specified in pre-conference)
4. **Note any special contexts** (IEP/504 students, ELL, virtual/hybrid format)

### Phase 2: Transcript Processing (for observations)
1. **Parse transcript** with timestamps
2. **Identify actors** (Teacher, Students, Groups)
3. **Code each significant moment:**
   - Apply 5D+ dimension/subdimension
   - Add relevant tags
   - Note impact on learning
4. **Redact PII:** Replace student names with role codes (S-A, S-B, etc.)
5. **Build evidence matrix** organizing by dimension

### Phase 3: Pattern Analysis
1. **Calculate student talk ratio:**
   - Sample 3-5 representative minutes
   - Count T vs S speaking time
   - Report percentage ± margin
2. **Identify CFU frequency:**
   - Mark all A1-tagged moments
   - Calculate average interval
3. **Equity scan:**
   - Track which students receive questions/feedback
   - Note accommodations in use
   - Identify participation patterns
4. **Document trends** across dimensions

### Phase 4: Analysis Generation
1. **Noticings** (3-5):
   - Evidence-based observations
   - Linked to specific timestamps
   - Tied to student learning impact
   - Neutral, factual tone
2. **Wonderings** (2-4):
   - Open-ended coaching questions
   - Prompt teacher reflection
   - Suggest exploration areas
3. **Glows** (2-3):
   - Strengths with clear 5D+ alignment
   - Supported by multiple evidence points
   - Explain why it matters for students
4. **Grows** (2-3):
   - Growth areas with specific dimensions
   - Evidence-based, non-judgmental
   - Include actionable nudges

### Phase 5: Goal Setting & Action Planning
1. **Draft SMART goal:**
   - Specific to one dimension/subdimension
   - Measurable with concrete metrics
   - Achievable within 2-4 weeks
   - Relevant to student learning
   - Time-bound with check-in date
2. **Define evidence collection:**
   - What artifacts to gather
   - How often to document
   - Who reviews/supports
3. **Create action steps:**
   - Owner assigned
   - Due date specified
   - Resources/supports identified

### Phase 6: Document Creation
1. **Scripted Observation Notes** (Word doc format)
2. **Coded Evidence Matrix** (table by dimension)
3. **Analysis Memo** (Noticings, Wonderings, Glows, Grows)
4. **Post-Conference Summary** with SMART goal
5. **Pivot Narrative** (dimension-by-dimension + overall)
6. **Email Summary** (concise, professional)
7. **JSON Export** (structured data for records)

## Output Templates

### Scripted Observation Notes
```
SCMV 5D+ Classroom Observation
Teacher: [Last, First]
Course: [Course Name]
Grade: [Grade Level]
Date: [YYYY-MM-DD]
Observer: [Observer Name]
Learning Target: [LT text or "See timestamp XX:XX"]
Success Criteria: [SC text or "Not explicitly visible"]
Focus Dimensions: [P, SE, CP, A, CEC]

─────────────────────────────────────────────────────────────
SCRIPTED NOTES (Timestamped Evidence)
─────────────────────────────────────────────────────────────

00:45 – T: "Today we're determining if relationships are proportional by 
analyzing tables and graphs." [P1, LT]

03:12 – T: Posts success criteria on slide: "I can explain why a relationship 
is or isn't proportional using at least two pieces of evidence." [P2, SC]

07:30 – S-A: "The ratio between y and x is always 3, so it's proportional." [SE1]

07:45 – T: "Say more about that—why does a constant ratio matter?" [SE1, A1]

08:02 – S-A: "Because that means the unit rate doesn't change." [SE1]

[Continue with all significant moments...]
```

### Evidence Matrix
```
5D+ CODED EVIDENCE MATRIX
─────────────────────────────────────────────────────────────
PURPOSE (P)
  P1 - Learning Target: 00:45, 12:30, 18:15
  P2 - Success Criteria: 03:12 (explicit), 24:00 (referenced)
  P3 - Relevance: 15:45 (real-world connection to phone plans)

STUDENT ENGAGEMENT (SE)
  SE1 - Discourse: 07:30, 08:02, 13:45, 19:20, 22:10
  SE2 - Ownership: 16:30 (self-assessment), 23:00 (peer feedback)
  SE3 - Peer Interaction: 10:15-12:00 (pair work), 20:30 (group)

[Continue for CP, A, CEC...]
```

### Noticings & Wonderings
```
NOTICINGS (Evidence-Based Observations)

1. [SE1, SE3 | 10:15-12:00, 19:20-21:30]
   During pair work, 8 of 12 students verbally justified their reasoning 
   using mathematical vocabulary ("unit rate," "constant ratio"). Students 
   built on each other's ideas, particularly when analyzing the non-proportional 
   example at 19:20.

2. [A1 | 07:45, 11:20, 16:00, 23:45]
   Teacher used strategic questioning to probe student thinking four times, 
   with follow-ups like "Why does that matter?" and "How do you know?" These 
   checks revealed misconceptions about proportional vs. linear relationships.

3. [CEC3 | 03:30, 15:00]
   Visual supports (color-coded table headers, sentence stems) were visible 
   and referenced by 3 students during explanations, lowering language barriers.

WONDERINGS (Coaching Questions)

1. [P2] Success criteria were posted but not co-constructed or revisited 
   mid-lesson. What might happen if students helped generate or self-assess 
   against the criteria at the 15-minute mark?

2. [A2] Several students received verbal affirmation ("good") but limited 
   specific feedback on their reasoning. How might you make feedback more 
   actionable, perhaps naming the specific mathematical move they made?

3. [SE2] What routine could help students track their own progress toward 
   the learning target during the lesson?
```

### Glows & Grows
```
GLOWS (Strengths Aligned to 5D+)

✓ SE1, SE3 [10:15-12:00, 19:20-21:30]
  Structured talk routines (Think-Pair-Share, accountable talk stems) 
  created space for 8 unique student voices to explain mathematical reasoning. 
  This made student thinking visible and built collective understanding.
  WHY IT MATTERS: Students constructed meaning together rather than relying 
  solely on teacher explanation.

✓ CP3 [05:15-06:45]
  Teacher modeled a complete worked example ("I do") with think-aloud before 
  releasing students to try. The model explicitly connected unit rate to 
  proportionality.
  WHY IT MATTERS: Clear modeling reduced cognitive load and gave students 
  a mental schema to apply.

✓ A1 [throughout]
  CFU checks every 6-8 minutes prevented students from practicing errors 
  and allowed real-time instructional pivots.

GROWS (Growth Areas with Actionable Nudges)

↑ P2 [03:12, not revisited]
  Success criteria were teacher-created and not referenced after posting. 
  NUDGE: Co-construct criteria with students OR pause at 15 minutes to have 
  students self-assess against them using color cards (red/yellow/green).

↑ A2 [multiple moments]
  Feedback was encouraging but often general ("Good job," "Nice"). 
  NUDGE: Name the specific move ("You used the unit rate to compare—that's 
  exactly what mathematicians do") or pose a pressing question to extend thinking.

↑ SE2 [limited evidence]
  Few opportunities for students to self-assess or set personal goals.
  NUDGE: Add a 2-minute reflection prompt tied to the success criteria 
  (e.g., "Which part of today's SC do you feel strongest about? Where do you 
  need more practice?").
```

### SMART Goal Template
```
SMART GOAL

GOAL STATEMENT:
By [Date, 2-4 weeks out], during [lesson type/content], [specific measurable 
outcome] will increase from [baseline] to [target] as measured by [evidence type].

EXAMPLE:
By December 15, 2025, during problem-solving lessons, student-to-student 
discourse will increase from ~30% to ≥50% of class time as measured by two 
10-minute talk tallies per week in at least 3 lessons.

MEASUREMENT:
- Teacher will tally teacher vs. student talk during 2 ten-minute segments 
  per week
- Collect 2 student artifacts (written explanations or recordings) showing 
  peer-to-peer interaction
- Student survey: "How often do you explain your thinking to classmates?"

EVIDENCE COLLECTION SCHEDULE:
- Week 1: Baseline tally + introduce talk moves
- Week 2: Mid-point tally + student artifact #1
- Week 3: Tally + student artifact #2
- Week 4: Final tally + student survey

SUPPORTS NEEDED:
- Talk moves reference card (observer will provide)
- Peer observation of colleague using accountable talk structures
- 10-minute check-in on [Date] to troubleshoot

ACTION STEPS:
┌─────────┬──────────────────────────────────────────────┬─────────────┐
│ OWNER   │ ACTION                                        │ DUE DATE    │
├─────────┼──────────────────────────────────────────────┼─────────────┤
│ Teacher │ Implement Think-Pair-Share in 3 lessons/week │ Ongoing     │
│ Teacher │ Post talk moves stems visibly                │ [Date]      │
│ Teacher │ Collect tally data (10 min, 2x/week)        │ Weekly      │
│ Teacher │ Submit 2 student artifacts                   │ [Date]      │
│ Observer│ Provide talk moves card & sample lesson      │ [Date]      │
│ Observer│ Schedule 10-min check-in                     │ [Date]      │
│ Both    │ Review progress at post-conference           │ [Date]      │
└─────────┴──────────────────────────────────────────────┴─────────────┘
```

### Email Summary Template
```
Subject: 5D+ Observation Summary — [Teacher Last Name] ([MM/DD/YYYY])

Hello [First Name],

Thank you for welcoming me into your [Course] class today. It was energizing 
to see students [brief highlight—one sentence]. Below are key takeaways and 
our next steps.

GLOWS ✓
• [Dimension]: [One-sentence evidence-based strength]
• [Dimension]: [One-sentence evidence-based strength]
• [Dimension]: [One-sentence evidence-based strength]

GROWS ↑
• [Dimension]: [One-sentence growth area with actionable nudge]
• [Dimension]: [One-sentence growth area with actionable nudge]
• [Dimension]: [One-sentence growth area with actionable nudge]

NEXT STEPS
• [Owner]: [Action] by [Date]
• [Owner]: [Action] by [Date]
• [Owner]: [Action] by [Date]

All artifacts (scripted notes, analysis, SMART goal) are saved here: 
[Link to Google Drive folder]

I'll stop by on [Date] for a quick 10-minute check-in focused on [focus area]. 
Looking forward to seeing the progress!

Best,
[Observer Name]
```

## File Naming & Organization

### Directory Structure
```
/Teacher_Evals/
  /2024-2025/
    /SCMV/
      /LastFirst/
        /2024-11-03_Observation/
          - SCMV_PreConf_LastFirst_2024-11-03.docx
          - SCMV_Observation_LastFirst_2024-11-03_Transcript.txt
          - SCMV_Observation_LastFirst_2024-11-03_ScriptedNotes.docx
          - SCMV_Observation_LastFirst_2024-11-03_Matrix.docx
          - SCMV_Observation_LastFirst_2024-11-03_Analysis.docx
          - SCMV_PostConf_LastFirst_2024-11-03.docx
          - SCMV_5DPlus_JSON_LastFirst_2024-11-03.json
        /2024-12-10_Observation/
          [same structure]
        - SCMV_SummativeEval_LastFirst_2024-2025.docx
```

### Naming Convention
- **Pre-Conference:** `SCMV_PreConf_[LastFirst]_[YYYY-MM-DD].docx`
- **Transcript:** `SCMV_Observation_[LastFirst]_[YYYY-MM-DD]_Transcript.txt`
- **Scripted Notes:** `SCMV_Observation_[LastFirst]_[YYYY-MM-DD]_ScriptedNotes.docx`
- **Evidence Matrix:** `SCMV_Observation_[LastFirst]_[YYYY-MM-DD]_Matrix.docx`
- **Analysis:** `SCMV_Observation_[LastFirst]_[YYYY-MM-DD]_Analysis.docx`
- **Post-Conference:** `SCMV_PostConf_[LastFirst]_[YYYY-MM-DD].docx`
- **JSON Export:** `SCMV_5DPlus_JSON_[LastFirst]_[YYYY-MM-DD].json`
- **Summative:** `SCMV_SummativeEval_[LastFirst]_[SY].docx`

## Privacy & Compliance Requirements

### Student PII Redaction
**ALWAYS redact:**
- Full student names → Use role codes (S-A, S-B, S-Group)
- Student IDs, addresses, phone numbers
- Sensitive health information
- Behavioral incident details that could identify individuals

**Example:**
- Original: "Maria raised her hand and explained..."
- Redacted: "S-A raised her hand and explained..."

### Legal Compliance
- **FERPA:** Protect all student education records
- **IDEA:** Reference accommodations generically ("student with IEP received visual support") without diagnosis
- **Section 504:** Note access strategies without revealing disability
- **Michigan Teacher Evaluation Law:** Ensure evaluations are evidence-based, tied to student growth, and follow district timelines

### Data Security
- Store all files in secure district-approved locations
- Use encrypted email for transmission
- Include only aggregate data (no individual student scores) in written artifacts
- Mark evaluation documents as "Confidential Personnel Record"

## Edge Cases & Special Situations

### Virtual/Hybrid Observations
- **Tag virtual interactions:** `[Virtual]` for chat, polls, breakout rooms
- **Count chat as discourse:** SE1 evidence includes typed responses
- **Note accessibility:** Are closed captions, screen reader compatibility, and visual supports enabled?
- **Two-way interaction requirement:** Michigan virtual law requires documented student-teacher interaction

### Short/Partial Observations (<15 minutes)
- Produce **mini-packet**: Scripted notes, 1 glow, 1 grow, 1 wondering
- Label scope clearly: "15-minute segment focused on [activity]"
- Note what was NOT observed
- Avoid broad claims; focus on what was visible

### Missing Data
- **No explicit LT/SC:** Infer cautiously, mark `(inferred from lesson content)`, add to clarifying questions
- **Audio gaps:** Mark span `[Audio gap 12:30-14:15]` and continue
- **Unclear dimension:** Code with lower confidence score, add note

### Equity Concerns
- **Identify pattern neutrally:** "3 of 5 higher-order questions directed to students in front rows"
- **Suggest mitigation:** "Consider randomizer or popsicle sticks for equitable distribution"
- **Never attribute intent:** Focus on observable impact, not assumed motivation
- **Connect to CEC dimension:** Frame as growth opportunity in CEC1 or CEC3

### Emergency/Crisis Observations
- If observation reveals **immediate safety concern** (abuse, threat, severe distress), PAUSE coding
- Notify administrator immediately per district protocol
- Do NOT include concerning details in written observation notes
- Complete incident report through proper channels separately

## Quality Assurance Checklist

Before finalizing any evaluation artifact, verify:

**Evidence Quality**
- [ ] Every claim is tied to specific timestamp or artifact
- [ ] Student names are redacted (S-A, S-B format)
- [ ] Quotes are verbatim or marked as paraphrased
- [ ] No value-laden adjectives ("great," "poor," "lazy")
- [ ] Impact on student learning is explicit

**5D+ Coding Accuracy**
- [ ] Every significant moment has dimension + subdimension
- [ ] Tags (LT, FA, EQUITY, Virtual) are used appropriately
- [ ] Confidence scores reflect certainty (use <0.7 when ambiguous)
- [ ] Matrix organizes evidence logically by dimension

**Analysis Depth**
- [ ] Noticings are factual, not interpretive
- [ ] Wonderings are open-ended, coaching-oriented
- [ ] Glows explain WHY the move mattered for students
- [ ] Grows include specific, actionable nudges
- [ ] All linked to evidence timestamps

**SMART Goal Criteria**
- [ ] Specific to one dimension/subdimension
- [ ] Measurable with concrete metrics
- [ ] Achievable in 2-4 week timeframe
- [ ] Relevant to student learning (not just teacher behavior)
- [ ] Time-bound with check-in date
- [ ] Includes evidence collection plan
- [ ] Lists supports and resources

**Document Completeness**
- [ ] Header metadata complete (teacher, date, course, observer)
- [ ] File names follow convention
- [ ] All cross-references are accurate
- [ ] Email summary is concise (fits in one screen)
- [ ] JSON export validates against schema

## Integration with Other Tools

### Transcript Sources
This skill can process transcripts from:
- **Fireflies.ai** (meeting bot transcripts)
- **Otter.ai** (live transcription)
- **Zoom/Google Meet** (auto-generated captions)
- **Manual notes** (typed during observation)
- **Audio files** (if converted to text first)

### Output Destinations
- **Google Drive** (primary storage per file structure)
- **Pivot Platform** (copy/paste narratives into evaluation forms)
- **Email** (Gmail summary to teacher)
- **District LMS** (Schoology, Canvas—attach artifacts)
- **Local computer** (Word, PDF, JSON formats)

### Data Flow (Recommended)
1. Record observation (Fireflies, Zoom, in-person notes)
2. Upload transcript to Claude with metadata
3. Claude generates all artifacts locally
4. Save to Google Drive in proper folder structure
5. Email summary to teacher
6. Copy Pivot narrative to evaluation platform
7. Store JSON in district archive

## Usage Examples

### Example 1: Processing a Transcript
**User Input:**
"Here's the transcript from Jane Doe's 8th grade math class on November 3, 2024. Focus on Student Engagement and Assessment dimensions."

**Claude's Process:**
1. Read the SKILL.md file
2. Extract metadata (teacher, date, course, grade)
3. Parse transcript for timestamps and actors
4. Code evidence with SE and A focus
5. Build matrix and calculate patterns
6. Generate analysis (noticings, wonderings, glows, grows)
7. Create SMART goal focused on SE/A
8. Produce all artifacts (notes, matrix, analysis, email, JSON)
9. Save to `/Teacher_Evals/2024-2025/SCMV/DoeJane/2024-11-03_Observation/`

### Example 2: Pre-Conference Summary
**User Input:**
"Summarize this pre-conference form from John Smith for his 10th grade ELA lesson."

**Claude's Process:**
1. Read SKILL.md
2. Extract: LT, SC, student context, anticipated moves
3. Map anticipated moves to 5D+ dimensions
4. Identify focus dimensions
5. Generate 4-6 clarifying questions
6. Create pre-conference memo
7. Save as `SCMV_PreConf_SmithJohn_[DATE].docx`

### Example 3: Post-Conference with SMART Goal
**User Input:**
"Create post-conference summary and SMART goal based on the observation data for Maria Garcia. She wants to improve student discourse."

**Claude's Process:**
1. Read SKILL.md and observation data
2. Synthesize teacher reflection with evidence
3. Calculate baseline (student talk %)
4. Draft SMART goal for SE1/SE3
5. Define measurement and evidence collection
6. Create action plan with supports
7. Generate post-conference summary
8. Save as `SCMV_PostConf_GarciaMaria_[DATE].docx`

## Coaching Resources (One-Page Menu)

### Talk Routines to Boost SE1/SE3
- **Think-Pair-Share:** Individual think (30 sec) → Pair discuss (2 min) → Share out
- **Turn and Talk:** Quick partner exchange (60-90 sec) with prompt
- **Accountable Talk Stems:** "I agree with ___ because..." "I respectfully disagree because..." "Can you say more about...?"
- **Talking Points:** Small groups discuss 3-4 statements, must reach consensus
- **Numbered Heads Together:** Groups discuss, teacher calls random number, that person reports
- **String-of-Talk:** Record conversation with yarn/string to visualize who talks

### Feedback Routines to Boost A2
- **Stars & Steps:** "One thing you did well (star)..." "One next step (step)..."
- **Two Stars and a Wish:** Written peer feedback template
- **Gallery Walk with Stickies:** Students leave specific feedback on posted work
- **Whole-Class Annotate:** Project one sample, annotate together using success criteria
- **Color-Coded Feedback:** Highlight strengths (green), areas to improve (yellow), errors (red)

### CFU Tools to Boost A1
- **Mini Whiteboards:** Students write answer, show on signal—instant visual data
- **Fist-to-Five:** Show fingers (0=lost, 5=got it) for quick confidence check
- **Exit Tickets:** 1-3 questions tied directly to LT/SC, collected at door
- **Four Corners:** Students move to corner based on answer choice
- **Digital Polls:** Google Forms, Kahoot, Mentimeter for real-time data
- **Thumbs Up/Down/Sideways:** Quick self-assessment of understanding

### Modeling Techniques to Boost CP3
- **I Do, We Do, You Do:** Gradual release from full model → guided practice → independent
- **Worked Example:** Complete problem with think-aloud narration
- **Partial Example:** Provide start, students complete
- **Error Analysis:** Deliberately incorrect example, students find and fix
- **Dual Coding:** Model verbally PLUS visual representation simultaneously

### Access Strategies to Boost CEC3
- **Sentence Stems:** Posted visibly, referenced explicitly
- **Vocabulary Pre-Teaching:** Introduce tier 2/3 words before lesson
- **Visual Supports:** Icons, graphic organizers, color-coding
- **Chunk Complex Tasks:** Break into 3-4 steps with check-ins between
- **Multiple Means of Representation:** Text + audio + visual + kinesthetic
- **Strategic Grouping:** Pair ELL with patient peer, vary by task

## Technical Notes

### JSON Schema (for programmatic use)
```json
{
  "observation_package": {
    "header": {
      "teacher": "Last, First",
      "date": "YYYY-MM-DD",
      "course": "string",
      "grade": "string",
      "observer": "string",
      "school": "SCMV | SCMV Options",
      "learning_target": "string or null",
      "success_criteria": "string or null",
      "focus_dimensions": ["P", "SE", "CP", "A", "CEC"]
    },
    "scripted_notes": [
      {
        "timestamp": "mm:ss",
        "actor": "T|S|S-Group|S-[Initial]",
        "utterance_or_action": "string",
        "dimension": "P|SE|CP|A|CEC",
        "subdimension": "P1|P2|P3|SE1|SE2|SE3|CP1|CP2|CP3|A1|A2|A3|CEC1|CEC2|CEC3",
        "tags": ["LT", "FA", "EQUITY", "Virtual", "REDACT"],
        "impact_on_learning": "string",
        "confidence": 0.0
      }
    ],
    "matrix": {
      "P": {"P1": [timestamps], "P2": [], "P3": []},
      "SE": {"SE1": [], "SE2": [], "SE3": []},
      "CP": {"CP1": [], "CP2": [], "CP3": []},
      "A": {"A1": [], "A2": [], "A3": []},
      "CEC": {"CEC1": [], "CEC2": [], "CEC3": []}
    },
    "patterns": {
      "student_talk_ratio_est": "X%",
      "cfu_frequency": "every X min",
      "equity_notes": ["string"]
    },
    "analysis": {
      "noticings": [
        {
          "evidence_ids": [timestamps],
          "dimensions": ["SE1"],
          "insight": "string"
        }
      ],
      "wonderings": [
        {
          "prompt": "string",
          "linked_evidence": [timestamps],
          "dimension": "P2"
        }
      ],
      "glows": [
        {
          "dimension": "SE3",
          "evidence_ids": [timestamps],
          "strength": "string",
          "why_it_matters": "string"
        }
      ],
      "grows": [
        {
          "dimension": "A1",
          "evidence_ids": [timestamps],
          "growth_area": "string",
          "actionable_nudge": "string"
        }
      ]
    },
    "post_conference": {
      "summary": "string",
      "smart_goal": {
        "statement": "string",
        "measure": "string",
        "baseline": "string",
        "target": "string",
        "timeline": "YYYY-MM-DD",
        "evidence_collection": "string",
        "supports": ["string"]
      },
      "next_steps": [
        {
          "owner": "Teacher | Observer | Both",
          "task": "string",
          "due_date": "YYYY-MM-DD"
        }
      ]
    },
    "pivot_narrative": {
      "P": "paragraph",
      "SE": "paragraph",
      "CP": "paragraph",
      "A": "paragraph",
      "CEC": "paragraph",
      "overall": "synthesis paragraph"
    },
    "email_summary": {
      "subject": "string",
      "body": "string with bullets"
    }
  }
}
```

### Processing Tips
- **Timestamp precision:** Use MM:SS format consistently
- **Actor codes:** T=Teacher, S=Student (generic), S-A/S-B/S-C (specific anonymized), S-Group
- **Confidence scoring:** 1.0 = certain, 0.7-0.9 = likely, <0.7 = ambiguous (flag for review)
- **Evidence linking:** Always provide timestamp range for multi-moment patterns
- **PII replacement:** Use find/replace to catch all instances of student names

## Final Reminders

**Always prioritize:**
1. **Evidence over inference** - What did you SEE/HEAR, not what you think it meant
2. **Student learning impact** - So what? How did this move affect student thinking/access?
3. **Actionable feedback** - Grows must be specific enough to guide improvement
4. **Privacy protection** - Redact all student PII without exception
5. **Coaching stance** - Wonderings > directives; support > evaluate

**Common pitfalls to avoid:**
- ❌ Value judgments ("excellent," "poor," "lazy")
- ❌ Overgeneralizing from limited evidence ("Students always...")
- ❌ Assuming intent ("Teacher wanted students to...")
- ❌ Unfair comparisons ("Unlike other teachers...")
- ❌ Vague feedback ("Be more engaging")
- ❌ Using student names in written artifacts
- ❌ Missing timestamps for evidence claims

**Success indicators:**
- ✓ Any evaluator could find the evidence you cite
- ✓ Teacher recognizes moments from the lesson
- ✓ SMART goal feels achievable and meaningful
- ✓ Grows are received as helpful, not punitive
- ✓ All artifacts are Pivot-ready without additional editing
- ✓ Email summary takes <2 minutes to read

---

## Contact & Support
For questions about this skill or 5D+ evaluation implementation:
- **SCMV Administrator:** [Your contact info]
- **District Evaluation Coordinator:** [Contact info]
- **5D+ Framework Resources:** [Link to district 5D+ resources]

Last updated: 2024-11-03
Version: 1.0
