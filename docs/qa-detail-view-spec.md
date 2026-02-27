# QA Command Center — Project Detail View Design Spec

**Version:** 1.0  
**Date:** 2026-02-27  
**Author:** Elisa (UI/UX Design)  
**Status:** Ready for Implementation

---

## 1. Overview

### Current State
The QA Command Center shows a global overview of all projects, but clicking on a project row does nothing. Users cannot drill down into individual project details.

### Goal
Enable users to click any project row and view detailed quality metrics, test history, coverage trends, and CI logs for that specific project.

---

## 2. Information Architecture

### Navigation Structure
```
/qa/dashboard
    └── Global overview (current view)
    └── Click project row
        └── /qa/:projectId
            └── Project detail view (new)
                ├── Overview Tab
                ├── Test History Tab
                ├── Coverage Tab
                └── Logs Tab
```

### Route Configuration
```jsx
<Route path="/qa/dashboard" element={<QAGlobalDashboard />} />
<Route path="/qa/:projectId" element={<QAProjectDetail />} />
```

---

## 3. Global Dashboard Updates

### 3.1 Project Row Click Handler

**Current Issue:** Using query param `?project=` which doesn't change the view.

**Fix:** Navigate to route with project ID:
```jsx
<TableRow 
  onClick={() => navigate(`/qa/${project.id}`)}
  className="cursor-pointer hover:bg-gray-50 transition-colors group"
>
  {/* Row cells */}
  <ChevronRightIcon className="opacity-0 group-hover:opacity-100 transition-opacity" />
</TableRow>
```

### 3.2 Row Hover States
- Background: `hover:bg-gray-50`
- Cursor: `cursor-pointer`
- Chevron icon appears on right side
- Transition: `transition-colors duration-150`

### 3.3 Severity Indicators Fix

**Current Issue:** Health Score 75% shows "Failing" (incorrect).

**Correct Thresholds:**

| Metric | Pass (Green) | Warning (Amber) | Fail (Red) |
|--------|--------------|-----------------|------------|
| Health Score | ≥90% | 60-89% | <60% |
| Lint Errors | 0 | 1-5 | >5 |
| Build Status | All passing | Some failing | All failing |
| Test Pass Rate | ≥90% | 70-89% | <70% |
| Coverage | ≥80% | 60-79% | <60% |

### 3.4 Critical Project Escalation

For projects with multiple consecutive failures (e.g., dante.id Platform CI with 12 failures):

```jsx
<TableRow className="bg-red-50 border-l-4 border-red-500">
  <AlertIcon size="lg" color="red" />
  <ProjectName>{project.name}</ProjectName>
  <Badge color="red">12 consecutive failures</Badge>
  <Button size="sm" color="red">Debug Now</Button>
</TableRow>
```

---

## 4. Project Detail View

### 4.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Breadcrumb: QA Dashboard / {Project Name}                   │
├─────────────────────────────────────────────────────────────┤
│ Status Badge (large)  Project Name              [Actions]   │
│ Last run: 2 hours ago • 12 total runs                       │
├─────────────────────────────────────────────────────────────┤
│ [Overview] [Test History] [Coverage] [Logs]               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ TAB CONTENT AREA                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Header Section

**Components:**
- Breadcrumb navigation with back link
- Large status badge (48px)
- Project name (24px, bold)
- Metadata: Last run time, total runs
- Action buttons:
  - "View PR" (outline style)
  - "Re-run CI" (primary)
  - "Download Logs" (ghost)

**Code Structure:**
```jsx
<DetailHeader>
  <Breadcrumb>
    <Link to="/qa/dashboard">QA Dashboard</Link>
    <ChevronRightIcon />
    <span>{project.name}</span>
  </Breadcrumb>
  
  <HeaderContent>
    <StatusBadge size="lg" status={project.status} />
    <H1>{project.name}</H1>
    <Meta>
      Last run: {formatTime(project.lastRun)} • {project.runs} runs total
    </Meta>
    
    <ActionBar>
      <Button variant="outline" leftIcon={<GitHubIcon />}>
        View PR
      </Button>
      <Button leftIcon={<RefreshIcon />}>
        Re-run CI
      </Button>
      <Button variant="ghost" leftIcon={<DownloadIcon />}>
        Logs
      </Button>
    </ActionBar>
  </HeaderContent>
</DetailHeader>
```

### 4.3 Tabs Interface

**Tab Labels:**
1. Overview
2. Test History
3. Coverage
4. Logs

**Tab Styling:**
- Active tab: `border-b-2 border-purple-500 text-purple-600`
- Inactive tab: `text-gray-500 hover:text-gray-700`
- Container: `border-b border-gray-200`

---

## 5. Tab Content Specifications

### 5.1 Overview Tab

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ METRIC CARDS (4 cards in a row)                             │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│ │ Build    │ │ Lint     │ │ Tests    │ │ Coverage │         │
│ │ Status   │ │ Errors   │ │ Pass Rate│ │ 86.3%    │         │
│ │          │ │          │ │          │ │          │         │
│ │ [spark]  │ │ [spark]  │ │ [spark]  │ │ [spark]  │         │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
├─────────────────────────────────────────────────────────────┤
│ RECENT RUNS                                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Run ID    Date      Status    Tests    Duration  Logs   │ │
│ │ #128      2h ago    ✅ Pass   8/8      2m 34s    View   │ │
│ │ #127      5h ago    ✅ Pass   8/8      2m 12s    View   │ │
│ │ #126      8h ago    ❌ Fail   6/8      1m 45s    View   │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ ALERTS (if any)                                             │
│ 🚨 Coverage dropped 12% in last 3 runs                      │
└─────────────────────────────────────────────────────────────┘
```

**Metric Cards:**
- Card background: `bg-white`
- Border: `border border-gray-200 rounded-lg`
- Padding: `p-6`
- Title: `text-sm font-medium text-gray-500 uppercase`
- Value: `text-3xl font-bold text-gray-900`
- Sparkline: Mini chart showing 30-day trend

**Recent Runs Table Columns:**
1. Run ID (link to GitHub)
2. Date/Time
3. Status badge
4. Tests (passed/total)
5. Duration
6. Actions (view logs, re-run)

### 5.2 Test History Tab

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ FILTERS: [All ▼] [Status: All ▼] [Date Range ▼]               │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ▶ Run #128    2h ago     ✅ Pass    8/8 tests   2m 34s │ │
│ │   ├─ test/auth.test.js .......................... Pass  │ │
│ │   ├─ test/api.test.js .......................... Pass  │ │
│ │   └─ test/db.test.js ........................... Pass  │ │
│ │                                                         │ │
│ │ ▶ Run #127    5h ago     ✅ Pass    8/8 tests   2m 12s │ │
│ │ ▶ Run #126    8h ago     ❌ Fail    6/8 tests   1m 45s │ │
│ │   ├─ test/auth.test.js .......................... Pass  │ │
│ │   ├─ test/api.test.js .......................... Fail  │ │
│ │   │   AssertionError: expected 200, got 401          │ │
│ │   └─ test/db.test.js ........................... Pass  │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Expandable rows for failed tests
- Show error messages inline
- Filter by status (all, passing, failing)
- Filter by date range

### 5.3 Coverage Tab

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ 30-DAY COVERAGE TREND                                       │
│ [Line chart showing coverage % over time]                   │
├─────────────────────────────────────────────────────────────┤
│ CURRENT: 86.3% (▲ 2.1% from last week)                     │
├─────────────────────────────────────────────────────────────┤
│ FILE BREAKDOWN                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ File                  Coverage  Status    Trend          │ │
│ │ auth.js               91.2%     ✅ Good   →              │ │
│ │ api.js                88.5%     ✅ Good   ↑              │ │
│ │ utils.js              72.3%     ⚠️ Warning ↓              │ │
│ │ db.js                 45.0%     ❌ Poor    ↓↓             │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ RECOMMENDATION                                              │
│ Focus on db.js — only 45% coverage, critical for stability  │
└─────────────────────────────────────────────────────────────┘
```

**Coverage Chart:**
- Type: Area chart
- X-axis: Last 30 days
- Y-axis: Coverage % (0-100)
- Line color: Green if >80%, amber if 60-80%, red if <60%
- Fill: Light color below line

### 5.4 Logs Tab

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ [Search logs...]                    [Copy] [Download]       │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ $ npm test                                              │ │
│ │                                                         │ │
│ │ > dante-id@1.0.0 test                                 │ │
│ │ > jest                                                  │ │
│ │                                                         │ │
│ │ PASS  test/auth.test.js (2.234s)                        │ │
│ │ PASS  test/api.test.js (1.456s)                         │ │
│ │ FAIL  test/db.test.js                                   │ │
│ │   ● Database Connection                                 │ │
│ │     Connection timeout after 5000ms                     │ │
│ │                                                         │ │
│ │     at Connection.<anonymous> (src/db.js:45:11)         │ │
│ │                                                         │ │
│ │ Test Suites: 1 failed, 2 passed (3 total)               │ │
│ │ Tests:       1 failed, 7 passed (8 total)               │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Terminal Styling:**
- Background: `bg-gray-900`
- Text: `text-gray-100 font-mono text-sm`
- Pass: `text-green-400`
- Fail: `text-red-400`
- Error messages: `bg-red-900/30 text-red-200`
- Line numbers: `text-gray-500`

---

## 6. API Endpoints Required

### 6.1 Project Detail
```bash
GET /api/qa/projects/:projectId/detail

Response:
{
  "id": "dante-id-platform",
  "name": "dante.id Platform CI",
  "status": "failing",
  "lastRun": "2026-02-27T09:23:00Z",
  "runs": 12,
  "metrics": {
    "healthScore": 75,
    "lintErrors": 2,
    "buildsPassing": "3/4",
    "testPassRate": 61,
    "coverage": 86.3
  },
  "trends": {
    "dates": ["2026-01-28", "2026-01-29", ...],
    "coverage": [82, 83, 85, 86, 86.3],
    "testPassRate": [75, 78, 80, 79, 86],
    "lintErrors": [6, 4, 3, 2, 2]
  }
}
```

### 6.2 Test History
```bash
GET /api/qa/projects/:projectId/runs?limit=50&offset=0

Response:
{
  "runs": [
    {
      "id": "run-128",
      "runNumber": 128,
      "status": "success",
      "startedAt": "2026-02-27T07:23:00Z",
      "duration": 154000,
      "tests": {
        "passed": 8,
        "failed": 0,
        "total": 8
      },
      "commit": {
        "sha": "abc123",
        "message": "Fix auth bug",
        "author": "Neo"
      }
    }
  ],
  "total": 128
}
```

### 6.3 Coverage Files
```bash
GET /api/qa/projects/:projectId/coverage

Response:
{
  "overall": 86.3,
  "files": [
    {
      "path": "src/auth.js",
      "coverage": 91.2,
      "lines": { "total": 100, "covered": 91 },
      "functions": { "total": 10, "covered": 9 }
    }
  ]
}
```

### 6.4 Logs
```bash
GET /api/qa/projects/:projectId/runs/:runId/logs

Response:
{
  "logs": "full terminal output as string"
}
```

---

## 7. Component Specifications

### 7.1 StatusBadge

```jsx
<StatusBadge 
  status="passing" // passing | failing | warning
  size="sm" | "md" | "lg"
/>
```

**Sizes:**
- sm: 16px icon + 12px text
- md: 20px icon + 14px text
- lg: 24px icon + 16px text

**Colors:**
- passing: Green-500 background, white text
- failing: Red-500 background, white text
- warning: Amber-500 background, white text

### 7.2 TrendSparkline

```jsx
<TrendSparkline 
  data={[70, 72, 75, 78, 75]}
  width={100}
  height={30}
  color="green"
/>
```

**Requirements:**
- SVG-based
- No dependencies (or use lightweight chart lib)
- Smooth line
- Optional: show current value on hover

### 7.3 TerminalOutput

```jsx
<TerminalOutput 
  logs={logsString}
  highlightErrors={true}
  searchable={true}
/>
```

**Features:**
- Syntax highlighting for errors
- Search/filter
- Copy to clipboard
- Download as .txt

---

## 8. Implementation Priority

### Phase 1: MVP (Ship This First)
- [ ] Fix route navigation (`/qa/:projectId`)
- [ ] Add click handler to table rows
- [ ] Create ProjectDetail page shell with header
- [ ] Overview tab with metric cards (no sparklines)
- [ ] Fix severity thresholds (pass/warning/fail)

### Phase 2: Detail Views
- [ ] Test History tab
- [ ] Coverage tab with chart
- [ ] Logs tab
- [ ] Add trend sparklines

### Phase 3: Polish
- [ ] Search/filter in logs
- [ ] Keyboard shortcuts (Esc to close, arrow keys for tabs)
- [ ] Mobile responsive
- [ ] Loading skeletons

---

## 9. Design Principles Applied

From `ui-ux-design` skill:

1. **Visual Hierarchy** — Clear breadcrumb → title → tabs → content
2. **Whitespace** — 24px gaps between sections, 16px padding in cards
3. **Consistency** — Same color system as global dashboard
4. **Feedback** — Hover states, loading indicators, clear status badges
5. **Actionability** — Every failure has a "Debug Now" action

---

## 10. Open Questions

1. Should failed test logs be truncated or show full output?
2. How far back should test history go? (30 days? 90 days?)
3. Should users be able to compare two runs side-by-side?
4. Do we need email alerts for failing projects?

---

**Next Steps:**
1. Neo implements Phase 1 (MVP)
2. Test with real data
3. Gather feedback
4. Iterate on Phase 2+ features

**Contact:** Elisa for design questions, Neo for implementation.