# Directive: Monitor K-12 Education Trends on Reddit

## Goal
Collect, analyze, and summarize discussions from key education subreddits to identify trends in K-12 hybrid, virtual, and alternative education.

## Frequency
- **Schedule**: Every 6 hours (4x daily)
- **Time Window**: Rolling 72-hour window

## Input Data (RSS Feeds)
- r/virtuallearning: `https://www.reddit.com/r/virtuallearning/.rss`
- r/OnlineEducation: `https://www.reddit.com/r/OnlineEducation/.rss`
- r/k12education: `https://www.reddit.com/r/k12education/.rss`
- r/Teachers: `https://www.reddit.com/r/Teachers/.rss`
- r/teaching: `https://www.reddit.com/r/teaching/.rss`
- r/EducationalTechnology: `https://www.reddit.com/r/EducationalTechnology/.rss`
- r/AlternativeEducation: `https://www.reddit.com/r/AlternativeEducation/.rss`
- r/HomeschoolRecovery: `https://www.reddit.com/r/HomeschoolRecovery/.rss`
- r/edtech: `https://www.reddit.com/r/edtech/.rss`
- r/OnlineTeaching: `https://www.reddit.com/r/OnlineTeaching/.rss`

## Workflow

### 1. Collect & Clean (Execution Script)
**Tool**: `execution/collect_reddit_posts.py`
- Fetch RSS feeds.
- Normalize data fields (title, url, date, content, score, comments, subreddit, author).
- Remove duplicates (URL, Title+Author).
- Validations:
    - Within 72 hours.
    - Not deleted/removed.
    - Not spam/AutoMod.

### 2. Evaluate (Execution Script + Orchestrator)
**Tool**: `execution/collect_reddit_posts.py` (scoring)
- **Scoring Rubric** (0-10 points):
    - **Relevance (3pts)**: Keywords (Hybrid, virtual, IEP, LMS, etc.).
    - **Engagement (2pts)**: >10 upvotes, >5 comments.
    - **Quality (1pt)**: Length > 200 words.
    - **Concrete Details (2pts)**: (Subjective - handled by Orchestrator or approximated by heuristic).
    - **Actionable Insights (2pts)**: (Subjective - handled by Orchestrator).
- **Classifications**:
    - **Strong Signal** (8-10)
    - **Moderate Signal** (5-7)
    - **Weak/Noise** (<5)

### 3. Summarize (Orchestrator)
- The Orchestrator reads the filtered/scored JSON output.
- For each "Strong" and "Moderate" signal post:
    - Generate a 50-75 word summary.
    - Highlight main issue, key details, and relevance.
- Group into themes (Technology, Attendance, Special Ed, etc.).
- Generate "Key Takeaways".

### 4. Distribute (Orchestrator)
- Generate a Daily Digest text file: `k12_hybrid_digest_YYYY-MM-DD.txt`.
- Save to `deliverables/` (or root if not specified).

## Output Format (Digest)
```markdown
# K-12 Hybrid/Virtual Education - Daily Digest
## [Date]

### TOP SIGNALS
...
### NOTABLE DISCUSSIONS
...
### EMERGING THEMES
...
### KEY TAKEAWAYS
...
```
