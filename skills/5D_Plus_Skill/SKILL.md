---
name: 5D+ Teacher Evaluation
description: Comprehensive teacher evaluation processing using the 5D+ framework. Use when Claude needs to process observation transcripts, generate coded evidence, create Pivot-ready narratives, or analyze teaching practice against 5D+ dimensions (Purpose, Student Engagement, Curriculum & Pedagogy, Assessment, Culture). Handles pre-conference planning, observation coding, and post-conference goal setting.
---

# 5D+ Teacher Evaluation Skill

## Overview

This skill enables comprehensive teacher evaluation processing using the 5D+ framework for SCMV and SCMV Options. It processes observation transcripts, generates coded evidence, produces analysis artifacts, and creates Pivot-ready documentation.

### Purpose
Transform classroom observation transcripts into actionable, evidence-based evaluation documents that:
- Align with 5D+ instructional framework
- Meet Michigan Department of Education evaluation requirements
- Protect student privacy (FERPA-compliant)
- Produce artifacts ready for Pivot platform upload
- Support meaningful post-conference conversations

## When to Use This Skill

Invoke this skill whenever the user:
- Uploads or references a classroom observation transcript
- Requests teacher evaluation coding or analysis
- Asks for pre-conference, observation, or post-conference documentation
- Needs 5D+ dimension analysis
- Wants to generate Pivot-ready narratives
- Requests evaluation artifacts (scripted notes, evidence matrices, glows/grows)
- Mentions "teacher evaluation," "5D+," "observation," or "SCMV evaluation"

## Component Reference

This skill is modular. Refer to the following files for detailed guidance:

- **[Framework & Definitions](references/framework.md)**: 
  - Detailed breakdown of all Dimensions (P, SE, CP, A, CEC) and Subdimensions
  - Evidence Line Schema and JSON Schema
- **[Output Templates](references/templates.md)**: 
  - Scripted Notes, Evidence Matrix, Smart Goals, Email Summaries
  - File naming conventions and directory structure
- **[Coaching Resources](references/coaching.md)**: 
  - Specific coaching moves, talk routines, and engagement strategies
- **[Privacy & Compliance](references/privacy.md)**: 
  - Critical PII redaction rules, edge cases (virtual, short observations), and QA checklist

## Processing Workflow

### Phase 1: Intake & Setup
1. **Identify evaluation stage** (pre-conference, observation, post-conference, summative)
2. **Extract metadata** (Teacher, Date, Course, Observer, School)
3. **Determine focus dimensions**
4. **Note special contexts** (IEP/504, ELL, Virtual)

### Phase 2: Transcript Processing
1. **Parse transcript** with timestamps
2. **Identify actors** (T, S, etc.)
3. **Code significantly moments** using [Framework](references/framework.md)
4. **Redact PII** (See [Privacy](references/privacy.md))
5. **Build evidence matrix**

### Phase 3: Pattern Analysis
1. **Calculate student talk ratio** (Teacher vs Student talk time)
2. **Identify CFU frequency** (Interval of A1 checks)
3. **Equity scan** (Distribution of questions/feedback)
4. **Document trends** across dimensions

### Phase 4: Analysis Generation
Using the [Templates](references/templates.md):
1. **Noticings** (Evidence-based observations)
2. **Wonderings** (Coaching questions)
3. **Glows** (Strengths with 5D+ alignment)
4. **Grows** (Growth areas with actionable nudges)

### Phase 5: Goal Setting
1. **Draft SMART goal** specific to one dimension
2. **Define evidence collection** plan
3. **Create action steps** with owners and dates

### Phase 6: Document Creation
Generate the required artifacts as specified in [Templates](references/templates.md).

## Integration

### Transcript Sources
- **Fireflies.ai / Otter.ai**
- **Zoom / Google Meet captions**
- **Manual notes**
- **Audio files** (converted to text)

### Output Destinations
- **Google Drive** (Primary storage)
- **Pivot Platform** (Evaluation forms)
- **Email** (Teacher summary)
