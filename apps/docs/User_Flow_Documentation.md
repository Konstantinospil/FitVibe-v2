# FitVibe User Flow Documentation

> **Purpose**: Comprehensive documentation of all pages, user actions, and navigation flows
> **Version**: v1.0
> **Date**: 2025-10-28
> **Status**: Living Document

---

## Table of Contents

1. [Overview](#overview)
2. [Page Inventory](#page-inventory)
3. [Authentication Flows](#authentication-flows)
4. [Main Application Flows](#main-application-flows)
5. [Page Design Templates](#page-design-templates)
6. [Navigation Rules](#navigation-rules)

---

## Overview

This document describes the complete user journey through FitVibe, including:
- **What happens on each page**
- **Actions users can take**
- **Navigation paths between pages**
- **Success/error states**

### Flow Notation

```mermaid
graph LR
    A[Page/State] -->|User Action| B[Next Page/State]
    B -->|Condition| C{Decision Point}
    C -->|Success| D[Success State]
    C -->|Failure| E[Error State]
```

---

## Page Inventory

### Public Pages (No Authentication Required)

| Route | Component | Purpose | Protected |
|-------|-----------|---------|-----------|
| `/` | Home | Landing page with app overview | No |
| `/login` | Login | User authentication | No |
| `/register` | Register | New user registration | No |
| `/forgot-password` | ForgotPassword | Request password reset | No |
| `/reset-password?token=xxx` | ResetPassword | Reset password with token | No |

### Protected Pages (Authentication Required)

| Route | Component | Purpose | Protected |
|-------|-----------|---------|-----------|
| `/dashboard` | Dashboard | User overview & analytics | Yes |
| `/planner` | Planner | Plan workout sessions | Yes |
| `/logger` | Logger | Log workout execution | Yes |
| `/progress` | Progress | View analytics & PRs | Yes |
| `/feed` | Feed | Social feed (if enabled) | Yes |
| `/profile` | Profile | User settings & preferences | Yes |

### Special Pages

| Route | Component | Purpose | Protected |
|-------|-----------|---------|-----------|
| `*` (404) | NotFound | Invalid routes redirect | No |

---

## Authentication Flows

### 1. Registration Flow

```mermaid
graph TD
    Start([User visits app]) --> Home[Home Page]
    Home --> ClickRegister{Clicks 'Register'}
    ClickRegister --> Register[Register Page]

    Register --> FillForm[Fill registration form]
    FillForm --> FormData{Form Data}
    FormData -->|Valid| SubmitReg[Submit Registration]
    FormData -->|Invalid| ShowError[Show validation errors]
    ShowError --> FillForm

    SubmitReg --> APICall{API Response}
    APICall -->|Success| SetTokens[Store auth tokens]
    APICall -->|Error| RegError[Show error message]
    RegError --> FillForm

    SetTokens --> Dashboard[Dashboard Page]

    style Dashboard fill:#90EE90
    style RegError fill:#FFB6C1
```

**Page: Register (`/register`)**

**Purpose**: Create new user account

**Form Fields**:
- Name (display_name)
- Email
- Password (min 12 chars, complexity requirements)

**User Actions**:
1. Enter personal information
2. Click "Create account" button
3. Or click "Already have an account? Log in"

**What Happens**:
- Generate username from email (part before @, sanitized)
- Submit `POST /api/v1/auth/register` with:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePass123!",
    "username": "user",
    "profile": {
      "display_name": "User Name"
    }
  }
  ```
- On success: Store tokens, navigate to `/dashboard`
- On error: Display error message (stays on page)

**Navigation Paths**:
- Success → `/dashboard`
- "Already have account" → `/login`

**Known Issues**:
- Email verification not sent (requires SMTP configuration)
- Currently auto-logs in after registration

---

### 2. Login Flow

```mermaid
graph TD
    Start([User needs to login]) --> Login[Login Page]

    Login --> FillCreds[Enter email & password]
    FillCreds --> Submit[Click 'Sign in']

    Submit --> APICall{API Response}
    APICall -->|Success| SetTokens[Store auth tokens]
    APICall -->|Failure| ShowError[Show error message]
    ShowError --> FillCreds

    SetTokens --> Redirect{Has 'from' state?}
    Redirect -->|Yes| ReturnPage[Return to original page]
    Redirect -->|No| Dashboard[Dashboard Page]

    Login --> ForgotLink{Click 'Forgot password'}
    ForgotLink --> ForgotPage[Forgot Password Page]

    Login --> RegLink{Click 'Create account'}
    RegLink --> RegPage[Register Page]

    style Dashboard fill:#90EE90
    style ReturnPage fill:#90EE90
    style ShowError fill:#FFB6C1
```

**Page: Login (`/login`)**

**Purpose**: Authenticate existing user

**Form Fields**:
- Email
- Password

**User Actions**:
1. Enter credentials
2. Click "Sign in"
3. Click "Forgot password?" → navigate to `/forgot-password`
4. Click "Create account" → navigate to `/register`

**What Happens**:
- Submit `POST /api/v1/auth/login` with credentials
- Receive `{ accessToken, refreshToken }`
- Store tokens in auth store
- Navigate to dashboard or original destination

**Navigation Paths**:
- Success → `/dashboard` (or return URL from protected route redirect)
- "Forgot password" → `/forgot-password`
- "Create account" → `/register`

---

### 3. Password Reset Flow

```mermaid
graph TD
    Start([User forgot password]) --> Login[Login Page]
    Login --> ClickForgot[Click 'Forgot password']
    ClickForgot --> ForgotPage[Forgot Password Page]

    ForgotPage --> EnterEmail[Enter email address]
    EnterEmail --> SubmitEmail[Click 'Send reset link']

    SubmitEmail --> APIReq{API Request}
    APIReq -->|Success| SuccessMsg[Show success message]
    APIReq -->|Error| ErrorMsg[Show error message]
    ErrorMsg --> EnterEmail

    SuccessMsg --> CheckEmail[User checks email]
    CheckEmail --> ClickLink[Click reset link in email]

    ClickLink --> ResetPage[Reset Password Page<br/>with token in URL]

    ResetPage --> EnterNewPass[Enter new password twice]
    EnterNewPass --> SubmitReset[Click 'Reset password']

    SubmitReset --> ValidatePass{Passwords match?}
    ValidatePass -->|No| MatchError[Show mismatch error]
    MatchError --> EnterNewPass

    ValidatePass -->|Yes| APIReset{API Request}
    APIReset -->|Success| ResetSuccess[Show success message]
    APIReset -->|Error| ResetError[Show error message]
    ResetError --> EnterNewPass

    ResetSuccess --> AutoRedirect[Auto-redirect in 2s]
    AutoRedirect --> Login2[Login Page]

    style Login2 fill:#90EE90
    style ErrorMsg fill:#FFB6C1
    style MatchError fill:#FFB6C1
    style ResetError fill:#FFB6C1
```

**Page: Forgot Password (`/forgot-password`)**

**Purpose**: Request password reset email

**Form Fields**:
- Email

**User Actions**:
1. Enter email address
2. Click "Send reset link"
3. Click "Back to login"

**What Happens**:
- Submit `POST /api/v1/auth/password/forgot`
- Show success message (doesn't reveal if email exists)
- User receives email with reset link (requires SMTP)

**Navigation Paths**:
- Success → Show confirmation message (stays on page)
- "Back to login" → `/login`

---

**Page: Reset Password (`/reset-password?token=xxx`)**

**Purpose**: Set new password using reset token

**Form Fields**:
- New password
- Confirm new password

**User Actions**:
1. Enter new password (twice)
2. Click "Reset password"
3. Click "Back to login"

**What Happens**:
- Validate passwords match
- Validate password meets policy (min 12 chars, complexity)
- Submit `POST /api/v1/auth/password/reset` with token and new password
- On success: Show success message, auto-redirect to login after 2 seconds

**Navigation Paths**:
- Success → Auto-redirect to `/login` after 2s
- "Back to login" → `/login`

**Error States**:
- Passwords don't match
- Password doesn't meet requirements
- Token invalid/expired
- Network error

---

## Main Application Flows

### 4. Dashboard Flow

```mermaid
graph TD
    Start([Authenticated user]) --> Dashboard[Dashboard Page]

    Dashboard --> ViewSummary[View summary metrics]
    Dashboard --> ViewPRs[View personal records]
    Dashboard --> ViewChart[View training trends chart]
    Dashboard --> SelectRange[Select time range<br/>4w or 8w]
    Dashboard --> SelectGrain[Select granularity<br/>weekly or monthly]

    SelectRange --> RefreshData[Refresh analytics data]
    SelectGrain --> RefreshData
    RefreshData --> Dashboard

    Dashboard --> NavPlanner{Click 'Planner'}
    Dashboard --> NavLogger{Click 'Logger'}
    Dashboard --> NavProgress{Click 'Progress'}
    Dashboard --> NavFeed{Click 'Feed'}
    Dashboard --> NavProfile{Click 'Profile'}

    NavPlanner --> Planner[Planner Page]
    NavLogger --> Logger[Logger Page]
    NavProgress --> Progress[Progress Page]
    NavFeed --> Feed[Feed Page]
    NavProfile --> Profile[Profile Page]

    style Dashboard fill:#87CEEB
```

**Page: Dashboard (`/dashboard`)**

**Purpose**: Main overview of user's training activity

**Data Displayed**:
- Training streak (current & change)
- Sessions completed (total & change)
- Total volume (total & change)
- Top 3 personal records
- Training trends chart (volume & sessions over time)

**User Actions**:
1. View summary metrics
2. Select time range (4 weeks or 8 weeks)
3. Select data granularity (weekly or monthly)
4. Navigate to other sections via main navigation

**What Happens**:
- Fetch `GET /api/v1/progress/summary?period=30`
- Fetch `GET /api/v1/progress/trends?period=30&group_by=week`
- Display aggregated analytics
- Auto-refresh when range/grain changes

**Navigation Paths**:
- Main nav → `/planner`, `/logger`, `/progress`, `/feed`, `/profile`

---

### 5. Planner Flow

```mermaid
graph TD
    Start([User wants to plan workout]) --> Planner[Planner Page]

    Planner --> ViewPlans[View existing plans]
    Planner --> CreateNew{Click 'Create New Plan'}

    CreateNew --> PlanForm[Plan Creation Form]
    PlanForm --> EnterDetails[Enter plan details]
    EnterDetails --> AddExercises[Add exercises]
    AddExercises --> SetSets[Configure sets/reps]
    SetSets --> SavePlan[Save plan]

    SavePlan --> APICreate{API Request}
    APICreate -->|Success| PlanCreated[Plan created successfully]
    APICreate -->|Error| ShowError[Show error message]
    ShowError --> EnterDetails

    PlanCreated --> Planner

    Planner --> SelectPlan[Select existing plan]
    SelectPlan --> EditPlan[Edit plan]
    SelectPlan --> DeletePlan[Delete plan]
    SelectPlan --> UsePlan[Use for session]

    UsePlan --> Logger[Logger Page<br/>with pre-filled exercises]

    style PlanCreated fill:#90EE90
    style ShowError fill:#FFB6C1
```

**Page: Planner (`/planner`)**

**Purpose**: Create and manage workout plans/templates

**Data Displayed**:
- List of saved plans
- Plan details (exercises, sets, reps)
- Templates library

**User Actions**:
1. View saved plans
2. Create new plan
3. Edit existing plan
4. Delete plan
5. Use plan for today's session

**What Happens**:
- Fetch user's plans
- CRUD operations on plans
- Navigate to Logger with pre-filled template

**Navigation Paths**:
- "Use plan" → `/logger` (with plan data)
- Main nav → other sections

---

### 6. Logger Flow

```mermaid
graph TD
    Start([User ready to log workout]) --> Logger[Logger Page]

    Logger --> ChooseSource{How to start?}
    ChooseSource -->|From scratch| NewSession[Create new session]
    ChooseSource -->|From plan| LoadPlan[Load saved plan]

    NewSession --> AddExercise[Add exercise]
    LoadPlan --> PrefillEx[Pre-filled exercises]

    AddExercise --> LogSets[Log sets]
    PrefillEx --> LogSets

    LogSets --> EnterReps[Enter reps]
    EnterReps --> EnterWeight[Enter weight]
    EnterWeight --> EnterRPE[Enter RPE optional]
    EnterRPE --> NextSet{More sets?}

    NextSet -->|Yes| LogSets
    NextSet -->|No| MoreEx{More exercises?}

    MoreEx -->|Yes| AddExercise
    MoreEx -->|No| Complete[Mark as complete]

    Complete --> SetVisibility[Set visibility<br/>public/followers/link/private]
    SetVisibility --> SaveSession[Save session]

    SaveSession --> APIReq{API Request}
    APIReq -->|Success| ShowPoints[Show points earned<br/>and badges]
    APIReq -->|Error| SaveError[Show error message]
    SaveError --> SaveSession

    ShowPoints --> SharePrompt{Want to share?}
    SharePrompt -->|Yes| ShareOptions[Choose share method]
    SharePrompt -->|No| Dashboard

    ShareOptions --> PublicFeed[Post to public feed]
    ShareOptions --> GenLink[Generate share link]
    ShareOptions --> Dashboard

    PublicFeed --> Dashboard
    GenLink --> Dashboard

    style ShowPoints fill:#90EE90
    style Dashboard fill:#87CEEB
    style SaveError fill:#FFB6C1
```

**Page: Logger (`/logger`)**

**Purpose**: Log workout session execution in real-time

**Data Displayed**:
- Current session details
- Exercise list
- Set-by-set logging interface
- Running totals (volume, duration)

**User Actions**:
1. Create new session or load from plan
2. Add exercises
3. Log each set (reps, weight, RPE, tempo, rest)
4. Mark session as complete
5. Set visibility (private/public/followers/link)
6. Share session (optional)

**What Happens**:
- Create session via `POST /api/v1/sessions`
- Add exercises and sets
- Calculate points based on volume/completion
- Award badges if criteria met
- Optionally post to feed or generate share link

**Navigation Paths**:
- After save → `/dashboard` or `/feed`
- Cancel → `/planner` or `/dashboard`

**Key Features**:
- Idempotency protection (repeated saves don't duplicate)
- Auto-save draft (optional)
- Offline support (future enhancement)

---

### 7. Progress Flow

```mermaid
graph TD
    Start([User wants to review progress]) --> Progress[Progress Page]

    Progress --> SelectPeriod[Select time period<br/>30/60/90 days]
    Progress --> ViewSummary[View summary stats]
    Progress --> ViewTrends[View trend charts]
    Progress --> ViewPRs[View personal records]
    Progress --> ViewExercises[View exercise breakdown]

    SelectPeriod --> RefreshData[Refresh data]
    RefreshData --> Progress

    Progress --> ExportData{Click 'Export'}
    ExportData --> DownloadJSON[Download JSON]
    ExportData --> DownloadCSV[Download CSV]

    DownloadJSON --> Exported[Data exported]
    DownloadCSV --> Exported

    Exported --> Progress

    ViewExercises --> DrillDown[Click on exercise]
    DrillDown --> ExDetails[Exercise detail view]
    ExDetails --> ViewHistory[View lift history]
    ViewHistory --> Progress

    style Exported fill:#90EE90
```

**Page: Progress (`/progress`)**

**Purpose**: View detailed analytics and personal records

**Data Displayed**:
- Total sessions completed
- Total volume lifted
- Current streak
- Personal records (all-time bests)
- Trend charts (volume, sessions, intensity over time)
- Exercise-specific breakdown
- Progress by time period

**User Actions**:
1. Select time period (30/60/90 days or custom)
2. View summary statistics
3. View trend charts
4. Filter by exercise
5. Export data (JSON/CSV)
6. Drill down into specific exercises

**What Happens**:
- Fetch `GET /api/v1/progress/summary?period=X`
- Fetch `GET /api/v1/progress/trends?period=X&group_by=week`
- Fetch `GET /api/v1/progress/exercises?period=X`
- Render charts using Recharts
- Export data via `GET /api/v1/progress/export`

**Navigation Paths**:
- Exercise drill-down → Exercise detail view (modal or separate page)
- Main nav → other sections

---

### 8. Feed Flow (Social Feature)

```mermaid
graph TD
    Start([User wants to see social feed]) --> FeedCheck{Feature enabled?}

    FeedCheck -->|No| FeatureDisabled[Feature not available]
    FeedCheck -->|Yes| Feed[Feed Page]

    Feed --> SelectScope{Select scope}
    SelectScope --> ScopePublic[Public feed<br/>all users]
    SelectScope --> ScopeFollowing[Following feed<br/>people I follow]
    SelectScope --> ScopeMe[My posts]

    ScopePublic --> LoadFeed[Load feed items]
    ScopeFollowing --> LoadFeed
    ScopeMe --> LoadFeed

    LoadFeed --> DisplayItems[Display feed items]

    DisplayItems --> ViewItem[View session details]
    DisplayItems --> LikeItem[Like/unlike]
    DisplayItems --> CommentItem[Add comment]
    DisplayItems --> CloneSession[Clone to my plans]

    LikeItem --> UpdateCount[Update like count]
    UpdateCount --> DisplayItems

    CommentItem --> PostComment[Post comment]
    PostComment --> DisplayItems

    CloneSession --> APIClone{API Request}
    APIClone -->|Success| Cloned[Session cloned]
    APIClone -->|Error| CloneError[Show error]

    Cloned --> NavPlanner[Navigate to Planner]
    CloneError --> DisplayItems

    style Cloned fill:#90EE90
    style CloneError fill:#FFB6C1
    style FeatureDisabled fill:#FFD700
```

**Page: Feed (`/feed`)**

**Purpose**: Social feed to view and interact with other users' sessions

**Feature Flag**: `FEATURE_SOCIAL_FEED` must be enabled

**Data Displayed**:
- Feed items (session summaries)
- User info (username, display name)
- Session details (exercises, volume, notes)
- Like/comment counts
- Visibility indicator

**User Actions**:
1. Select feed scope (public/following/my posts)
2. View session details
3. Like/unlike sessions
4. Add comments
5. Clone session to own plans
6. Scroll to load more (pagination)

**What Happens**:
- Fetch `GET /api/v1/feed?scope=public&limit=20&offset=0`
- Like via `POST /api/v1/feed/item/{id}/like`
- Unlike via `DELETE /api/v1/feed/item/{id}/like`
- Clone via `POST /api/v1/feed/session/{id}/clone`

**Navigation Paths**:
- Clone session → `/planner` (with cloned data)
- View user profile → `/users/{username}` (future)

**Privacy Note**:
- Only sessions with visibility=public or visibility=followers appear in feed
- Private and link-only sessions are excluded

---

### 9. Profile Flow

```mermaid
graph TD
    Start([User wants to edit profile]) --> Profile[Profile Page]

    Profile --> ViewSettings[View current settings]
    Profile --> EditPersonal[Edit personal info]
    Profile --> EditPrefs[Edit preferences]
    Profile --> ChangePassword[Change password]
    Profile --> ManagePrivacy[Manage privacy settings]
    Profile --> ViewSessions[View sessions list]

    EditPersonal --> UpdateName[Update display name]
    UpdateName --> SavePersonal[Save changes]
    SavePersonal --> APIUpdate{API Request}
    APIUpdate -->|Success| Updated[Profile updated]
    APIUpdate -->|Error| UpdateError[Show error]
    Updated --> Profile
    UpdateError --> EditPersonal

    ChangePassword --> EnterCurrent[Enter current password]
    EnterCurrent --> EnterNew[Enter new password]
    EnterNew --> ConfirmNew[Confirm new password]
    ConfirmNew --> SubmitPW[Submit password change]
    SubmitPW --> APIPWChange{API Request}
    APIPWChange -->|Success| PWChanged[Password changed]
    APIPWChange -->|Error| PWError[Show error]
    PWChanged --> Profile
    PWError --> EnterCurrent

    ManagePrivacy --> SetDefaults[Set default visibility]
    ManagePrivacy --> ManageFollowers[Manage followers]
    ManageFollowers --> Profile
    SetDefaults --> Profile

    ViewSessions --> SessionList[List all sessions]
    SessionList --> EditSession[Edit session]
    SessionList --> DeleteSession[Delete session]
    SessionList --> ChangeVis[Change visibility]

    EditSession --> Logger
    DeleteSession --> ConfirmDelete{Confirm delete?}
    ConfirmDelete -->|Yes| APIDelete[Delete session]
    ConfirmDelete -->|No| SessionList
    APIDelete --> SessionList

    Profile --> Logout{Click 'Logout'}
    Logout --> ConfirmLogout{Confirm logout?}
    ConfirmLogout -->|Yes| DoLogout[Revoke tokens]
    ConfirmLogout -->|No| Profile
    DoLogout --> Login

    style Updated fill:#90EE90
    style PWChanged fill:#90EE90
    style UpdateError fill:#FFB6C1
    style PWError fill:#FFB6C1
```

**Page: Profile (`/profile`)**

**Purpose**: Manage user account settings and preferences

**Data Displayed**:
- Personal information (name, email, username)
- Preferences (language, units, theme)
- Privacy settings (default visibility)
- Account statistics
- Session history list

**User Actions**:
1. Edit personal information
2. Change password
3. Update preferences (language, units)
4. Manage privacy settings
5. View/edit/delete sessions
6. Manage followers (if social enabled)
7. Logout

**What Happens**:
- Update profile via `PATCH /api/v1/users/profile`
- Change password via `POST /api/v1/auth/password/change`
- Update preferences via `PATCH /api/v1/users/preferences`
- Logout via token revocation

**Navigation Paths**:
- Logout → `/login`
- Edit session → `/logger`

---

## Page Design Templates

### Template: Standard Page Structure

Every page should follow this structure:

```tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageIntro from "../components/PageIntro";
import { Button } from "../components/ui";

const PageName: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State management
  const [data, setData] = useState<Type>(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Event handlers
  const handleAction = async () => {
    setError(null);
    setIsLoading(true);

    try {
      // API call
      await apiFunction(data);
      // Success handling
      navigate("/next-page");
    } catch (err) {
      // Error handling
      setError("Error message");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageIntro
      eyebrow={t("page.eyebrow")}
      title={t("page.title")}
      description={t("page.description")}
    >
      {/* Page content */}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <Button onClick={handleAction} isLoading={isLoading}>
        {t("page.action")}
      </Button>
    </PageIntro>
  );
};

export default PageName;
```

### Template: Page Design Checklist

When designing a new page, answer these questions:

**1. Purpose**
- [ ] What is the primary goal of this page?
- [ ] What problem does it solve for the user?

**2. User Entry**
- [ ] How does the user arrive at this page?
- [ ] What's their mental state/context?
- [ ] What information do they already have?

**3. Content**
- [ ] What data needs to be displayed?
- [ ] What actions can the user take?
- [ ] What's the visual hierarchy?

**4. Interactions**
- [ ] What can the user click/tap?
- [ ] What forms need to be filled?
- [ ] What validations are required?

**5. States**
- [ ] Loading state (what shows while fetching data?)
- [ ] Success state (what confirms success?)
- [ ] Error state (what shows when things fail?)
- [ ] Empty state (what shows when no data?)

**6. Navigation**
- [ ] Where can the user go next?
- [ ] What triggers navigation?
- [ ] Can they go back? How?

**7. API Integration**
- [ ] What endpoints are called?
- [ ] What data is sent?
- [ ] What data is received?
- [ ] How are errors handled?

**8. Accessibility**
- [ ] Keyboard navigation works?
- [ ] ARIA labels present?
- [ ] Color contrast sufficient?
- [ ] Screen reader friendly?

**9. Responsiveness**
- [ ] Mobile layout defined?
- [ ] Tablet layout defined?
- [ ] Desktop layout defined?

**10. Internationalization**
- [ ] All text in translation files?
- [ ] Date/time formatting locale-aware?
- [ ] Number formatting locale-aware?

---

## Navigation Rules

### Protected Route Behavior

```tsx
// If user tries to access protected route without auth:
<Navigate to="/login" state={{ from: location }} replace />

// After successful login:
const from = location.state?.from?.pathname || "/dashboard";
navigate(from, { replace: true });
```

### Navigation Patterns

**1. Linear Flow** (Registration, Password Reset)
```
Step 1 → Step 2 → Step 3 → Success
```

**2. Hub-and-Spoke** (Dashboard as hub)
```
Dashboard ←→ Planner
Dashboard ←→ Logger
Dashboard ←→ Progress
Dashboard ←→ Feed
Dashboard ←→ Profile
```

**3. Hierarchical** (Drill-down)
```
Progress → Exercise List → Exercise Detail → Session Detail
```

**4. Modal/Overlay** (Non-page navigation)
```
Current Page → Modal (confirmation, details) → Current Page
```

### Back Button Behavior

| Page | Back Button Should |
|------|-------------------|
| Dashboard | Not applicable (home) |
| Planner | Go to Dashboard |
| Logger | Confirm unsaved changes, then go back |
| Progress | Go to Dashboard |
| Feed | Go to Dashboard |
| Profile | Go to Dashboard |
| Login | Go to Home |
| Register | Go to Home |
| Forgot Password | Go to Login |
| Reset Password | Go to Login |

---

## Quick Reference: Complete Flow Map

```mermaid
graph TD
    Home[Home Page] --> Login[Login]
    Home --> Register[Register]

    Login --> ForgotPW[Forgot Password]
    ForgotPW --> ResetPW[Reset Password]
    ResetPW --> Login

    Login -->|Success| Dashboard[Dashboard]
    Register -->|Success| Dashboard

    Dashboard --> Planner[Planner]
    Dashboard --> Logger[Logger]
    Dashboard --> Progress[Progress]
    Dashboard --> Feed[Feed]
    Dashboard --> Profile[Profile]

    Planner --> Logger
    Logger --> Dashboard
    Progress --> Dashboard
    Feed --> Dashboard
    Profile --> Logout[Logout]
    Logout --> Login

    style Dashboard fill:#87CEEB
    style Login fill:#FFE4B5
    style Register fill:#FFE4B5
    style ForgotPW fill:#FFE4B5
    style ResetPW fill:#FFE4B5
```

---

## Appendix: Future Enhancements

### Planned Pages (Not Yet Implemented)

1. **Email Verification Page** (`/verify-email?token=xxx`)
   - Verify email after registration
   - Resend verification email

2. **Exercise Library** (`/exercises`)
   - Browse all exercises
   - Create custom exercises
   - View exercise details

3. **Session Detail View** (`/sessions/{id}`)
   - Full session details
   - Share options
   - Edit/delete actions

4. **User Profile (Public)** (`/users/{username}`)
   - View other user's public profile
   - See their public sessions
   - Follow/unfollow

5. **Coach Dashboard** (`/coach`) - Feature flagged
   - Manage athletes
   - Review programs
   - Track progress

6. **Insights/Analytics** (`/insights`) - Feature flagged
   - Advanced analytics
   - Trend predictions
   - Recommendations

---

## Document Maintenance

**Update this document when**:
- Adding new pages
- Changing navigation flows
- Modifying user actions
- Adding/removing features

**Version History**:
- v1.0 (2025-10-28): Initial documentation with all authentication and main app flows
