import urllib.request
import xml.etree.ElementTree as ET
import json
import time
import re
from datetime import datetime, timedelta
import html

# --- Configuration ---
FEEDS = [
    "https://www.reddit.com/r/virtuallearning/.rss",
    "https://www.reddit.com/r/OnlineEducation/.rss",
    "https://www.reddit.com/r/k12education/.rss",
    "https://www.reddit.com/r/Teachers/.rss",
    "https://www.reddit.com/r/teaching/.rss",
    "https://www.reddit.com/r/EducationalTechnology/.rss",
    "https://www.reddit.com/r/AlternativeEducation/.rss",
    "https://www.reddit.com/r/HomeschoolRecovery/.rss",
    "https://www.reddit.com/r/edtech/.rss",
    "https://www.reddit.com/r/OnlineTeaching/.rss"
]

KEYWORDS = [
    "hybrid learning", "blended learning", "virtual school",
    "attendance", "engagement metrics",
    "iep", "504", "special education",
    "canvas", "schoology", "google classroom", "lms",
    "synchronous", "asynchronous",
    "professional development", "pd",
    "parent communication", "family engagement",
    "assessment", "grading",
    "ferpa", "data privacy", "compliance",
    "alternative education", "non-traditional"
]

NOISE_KEYWORDS = [
    "homework help", "marketing", "promotion", "buy my", "discount"
]

OUTPUT_FILE = "reddit_posts.json"
WINDOW_HOURS = 72

# --- Helpers ---

def clean_html(raw_html):
    if not raw_html: return ""
    cleanr = re.compile('<.*?>')
    cleantext = re.sub(cleanr, '', raw_html)
    return html.unescape(cleantext)

def parse_date(date_str):
    # Reddit RSS date format: 2023-10-27T10:00:00+00:00
    # or sometimes diff formats. Handling ISO 8601.
    try:
        if "+" in date_str:
            date_str = date_str.split("+")[0] # Strip timezone for simplicity if needed, or parse properly
        return datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%S")
    except Exception as e:
        return datetime.now() # Fallback

def get_signal_score(post):
    score = 0
    text = (post.get('post_title', '') + " " + post.get('post_content', '')).lower()
    
    # 1. Relevance (Max 3)
    keyword_hits = 0
    for kw in KEYWORDS:
        if kw in text:
            keyword_hits += 1
    score += min(3, keyword_hits)
    
    # 2. Concrete Details (Max 2)
    # Heuristic: look for numbers, specific tool names (already covered in keywords? separate list?)
    details = 0
    if re.search(r'\d+%', text) or re.search(r'\d+ students', text):
        details += 1
    if any(tool in text for tool in ["canvas", "zoom", "teams", "schoology"]):
        details += 1
    score += min(2, details)
    
    # 3. Content Quality (Max 1)
    word_count = len(text.split())
    if word_count > 200:
        score += 1
        
    # 4. Engagement (Max 2)
    # RSS often doesn't have live score. We check what we have.
    # Logic: If we can't see it, assume 0.
    # Note: Automation of this part is limited by RSS data richness.
    
    # 5. Actionable Insights (Max 2)
    # Very hard to detect. Giving default 0 or heuristic.
    if "how to" in text or "guide" in text or "solution" in text:
        score += 1

    return score

def fetch_feed(url):
    try:
        # Reddit requires a custom User-Agent, not a generic browser one.
        req = urllib.request.Request(url, headers={'User-Agent': 'python:education-monitor:v1.0 (by /u/student)'})
        with urllib.request.urlopen(req) as response:
            return response.read()
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

# --- Main Logic ---

def main():
    all_posts = []
    seen_urls = set()
    cutoff_time = datetime.now() - timedelta(hours=WINDOW_HOURS)

    print(f"Collecting posts from {len(FEEDS)} feeds...")
    
    for feed_url in FEEDS:
        xml_data = fetch_feed(feed_url)
        if not xml_data: continue
        
        try:
            root = ET.fromstring(xml_data)
            # Atom namespace usually
            ns = {'atom': 'http://www.w3.org/2005/Atom'}
            
            for entry in root.findall('atom:entry', ns):
                # Extract fields
                title = entry.find('atom:title', ns).text
                link = entry.find('atom:link', ns).attrib['href']
                updated_str = entry.find('atom:updated', ns).text
                updated_dt = parse_date(updated_str)
                
                content_elem = entry.find('atom:content', ns)
                content_html = content_elem.text if content_elem is not None else ""
                content_text = clean_html(content_html)
                
                author_elem = entry.find('atom:author', ns)
                author = author_elem.find('atom:name', ns).text if author_elem is not None else "unknown"
                
                # Dedupe
                if link in seen_urls: continue
                seen_urls.add(link)
                
                # Filter Time
                if updated_dt < cutoff_time: continue
                
                # Normalize
                post = {
                    "id": link,
                    "post_title": title,
                    "post_url": link,
                    "post_date": updated_dt.isoformat(),
                    "post_content": content_text,
                    "source_community": feed_url.split('/r/')[-1].split('/')[0],
                    "post_author": author,
                    # RSS doesn't give these usually, defaulting
                    "score": 0, 
                    "comment_count": 0 
                }
                
                # Score
                post['signal_score'] = get_signal_score(post)
                
                all_posts.append(post)
                
        except Exception as e:
            print(f"Error parsing feed {feed_url}: {e}")

    print(f"Collected {len(all_posts)} unique posts.")
    
    # Sort by score desc, then date desc
    all_posts.sort(key=lambda x: (x['signal_score'], x['post_date']), reverse=True)
    
    # Save
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(all_posts, f, indent=2)
    print(f"Saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
