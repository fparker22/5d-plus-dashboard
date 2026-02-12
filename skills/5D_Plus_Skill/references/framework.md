# 5D+ Framework Reference

## Dimensions & Subdimensions

### P - Purpose
- **P1**: Learning Target clarity and alignment
- **P2**: Success Criteria (co-constructed when possible)
- **P3**: Relevance and real-world connection

### SE - Student Engagement
- **SE1**: Student discourse and thinking made visible
- **SE2**: Student ownership and metacognition
- **SE3**: Productive struggle and peer interaction

### CP - Curriculum & Pedagogy
- **CP1**: Content accuracy and depth
- **CP2**: Instructional strategies and differentiation
- **CP3**: Modeling and scaffolding

### A - Assessment
- **A1**: Checks for understanding (CFU) frequency and quality
- **A2**: Feedback (timely, specific, actionable)
- **A3**: Student self-assessment and goal-setting

### CEC - Culturally & Emotionally Responsive Climate
- **CEC1**: Relationships and belonging
- **CEC2**: Cultural relevance and asset-based language
- **CEC3**: Access and accommodations for all learners

## Additional Tags
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

## JSON Schema (for programmatic use)

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
