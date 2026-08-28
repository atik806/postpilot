# POSTPILOT — MASTER UI/UX DESIGN PROMPT

You are a world-class SaaS product designer and frontend UI engineer.

Design and build the complete frontend UI for a modern social-media management SaaS called **PostPilot**.

## PRODUCT

**Name:** PostPilot  
**Tagline:** Create Once. Publish Everywhere.

PostPilot allows users to create one piece of content and publish it across multiple social-media platforms from a single dashboard.

The product should feel like a **premium, modern, intelligent SaaS platform** used by creators, startups, businesses, marketers, and agencies.

Do NOT make it look like a generic admin dashboard.

---

# 1. DESIGN DIRECTION

Create a visual identity that feels:

- Premium
- Modern
- Minimal
- Intelligent
- Fast
- Professional
- Slightly futuristic
- Trustworthy
- Clean
- Highly usable

The UI should communicate:

> "This tool makes managing social media dramatically easier."

Take inspiration from the quality and simplicity of modern products such as Linear, Vercel, Notion, Stripe, Raycast, and modern AI SaaS products—but do NOT copy their designs.

Create a unique PostPilot identity.

---

# 2. BRANDING

Brand:

**PostPilot**

Logo concept:

A minimal combination of:

- Paper plane
- Send icon
- Orbit/flow
- Social publishing concept

The logo should be simple enough to work as:

- Desktop logo
- Mobile icon
- Browser favicon
- App icon

Primary tagline:

**Create Once. Publish Everywhere.**

Supporting message:

**One post. Every platform. Zero repetitive work.**

---

# 3. COLOR SYSTEM

Use a sophisticated SaaS color palette.

Primary:

- Deep dark/navy tone
- Electric purple/indigo accent

Supporting:

- White
- Soft gray
- Slate
- Subtle borders

Use gradients sparingly.

Avoid:

- Excessive neon
- Rainbow gradients
- Overly saturated backgrounds
- Cheap-looking glassmorphism

The interface should have strong contrast and excellent readability.

Support both:

### Light Mode

Bright, clean, professional.

### Dark Mode

Deep background, subtle borders, excellent contrast, premium developer/SaaS aesthetic.

Allow the user to switch between light and dark mode.

---

# 4. TYPOGRAPHY

Use a modern sans-serif font such as:

**Inter**

or another highly readable modern UI font.

Typography hierarchy:

```text
Hero
48–64px

Page heading
28–36px

Section heading
20–24px

Body
14–16px

Secondary
12–14px
```

Use font weight carefully.

Avoid excessive bold text.

---

# 5. GLOBAL LAYOUT

Desktop layout:

```text
┌──────────────────────────────────────────────────────────────┐
│ Logo                         Search      🔔   Help   Avatar   │
├───────────────┬──────────────────────────────────────────────┤
│               │                                              │
│ Dashboard     │                                              │
│               │                                              │
│ Create Post   │              Main Content                    │
│               │                                              │
│ Calendar      │                                              │
│ Posts         │                                              │
│ Campaigns     │                                              │
│ Analytics     │                                              │
│               │                                              │
│ AI Studio     │                                              │
│ Social        │                                              │
│ Accounts      │                                              │
│               │                                              │
│ Team          │                                              │
│ Billing       │                                              │
│ Settings      │                                              │
│               │                                              │
└───────────────┴──────────────────────────────────────────────┘
```

Sidebar:

- Collapsible
- Icons + labels
- Active state
- Workspace selector
- User profile at bottom

On mobile:

- Bottom navigation or slide-out navigation
- Responsive cards
- Full-screen composer
- Touch-friendly controls

---

# 6. DASHBOARD

Create a premium dashboard.

Header:

```text
Good afternoon, Atik 👋

Here's what's happening with your social media today.
```

Primary CTA:

**+ Create Post**

Stats:

```text
┌──────────────┐
│ Published    │
│ 128          │
│ ↑ 12.4%      │
└──────────────┘

┌──────────────┐
│ Scheduled    │
│ 24           │
│ Next: 8 PM   │
└──────────────┘

┌──────────────┐
│ Engagement   │
│ 8.7%         │
│ ↑ 2.1%       │
└──────────────┘

┌──────────────┐
│ Reach        │
│ 125.4K       │
│ ↑ 18.2%      │
└──────────────┘
```

Below:

### Upcoming Posts

Show cards with:

- Thumbnail
- Caption preview
- Platform icons
- Scheduled time
- Status

### Recent Performance

Interactive chart.

### Connected Accounts

Show:

```text
Facebook       ● Connected
Instagram      ● Connected
LinkedIn       ● Connected
X              ● Connected
YouTube        ● Connected
```

---

# 7. CREATE POST PAGE

This is the most important screen.

Make it visually excellent.

Layout:

```text
┌─────────────────────────────────────────────────────────────┐
│ Create Post                              Save Draft         │
├──────────────────────────────┬──────────────────────────────┤
│                              │                              │
│ Content                      │ Preview                      │
│                              │                              │
│ ┌──────────────────────────┐ │ ┌──────────────────────────┐ │
│ │ What's on your mind?     │ │ │ Instagram                │ │
│ │                          │ │ │                          │ │
│ │ Write something...       │ │ │ [IMAGE]                  │ │
│ │                          │ │ │                          │ │
│ └──────────────────────────┘ │ │ Caption...               │ │
│                              │ └──────────────────────────┘ │
│ Media                        │                              │
│ [ + Upload Media ]           │                              │
│                              │                              │
│ Platforms                    │                              │
│ ☑ Facebook                   │                              │
│ ☑ Instagram                  │                              │
│ ☑ LinkedIn                   │                              │
│ ☑ X                          │                              │
│ ☐ YouTube                    │                              │
│                              │                              │
│ AI Assistant                 │                              │
│ [✨ Generate Caption]        │                              │
│                              │                              │
│ [Schedule]       [Publish]   │                              │
└──────────────────────────────┴──────────────────────────────┘
```

---

# 8. POST COMPOSER FEATURES

Include:

### Text editor

- Character counter
- Formatting
- Emoji picker
- Mention support where applicable
- Hashtag support
- Link preview

### Media

Support:

- Drag & drop
- Image upload
- Video upload
- Multiple images
- Remove media
- Reorder media

Show upload progress.

### Platform selection

Each platform should have its own selectable card.

Example:

```text
┌────────────────────────────┐
│ ✓  Instagram               │
│    @vibeflow               │
└────────────────────────────┘
```

---

# 9. PLATFORM PREVIEW

Create a preview switcher:

```text
Facebook | Instagram | LinkedIn | X | YouTube
```

When the user clicks a platform, show a realistic preview.

Example Instagram preview:

```text
┌─────────────────────────────┐
│ ○ VibeFlow             ⋯    │
│                             │
│       [ IMAGE ]             │
│                             │
│ ♡  💬  ↗                    │
│                             │
│ VibeFlow                    │
│ 🚀 Something exciting...    │
│                             │
│ #AI #Technology             │
└─────────────────────────────┘
```

The previews should visually resemble real social-media layouts without copying proprietary UI exactly.

---

# 10. AI ASSISTANT

Create a beautiful AI assistant panel.

Button:

**✨ AI Assist**

Opening it shows:

```text
AI Content Assistant

What would you like to do?

[ Generate Caption ]

[ Rewrite ]

[ Make Shorter ]

[ Make More Professional ]

[ Make More Engaging ]

[ Generate Hashtags ]

[ Generate CTA ]
```

Include:

```text
Tone

○ Professional
○ Casual
○ Funny
○ Inspirational
○ Promotional
```

The AI interface should feel integrated into the product—not like a separate chatbot.

---

# 11. CONTENT CALENDAR

Create a sophisticated calendar.

Top:

```text
Content Calendar

< August 2026 >

[Month] [Week] [Day]

                    + Create Post
```

Calendar cards should show:

- Thumbnail
- Platform icons
- Post title
- Scheduled time
- Status

Example:

```text
28

┌─────────────────────┐
│ 📸 Product Launch   │
│ 8:00 PM             │
│ IG  FB  LI          │
└─────────────────────┘
```

Support drag-and-drop rescheduling visually.

---

# 12. POSTS PAGE

Create a searchable post management page.

Filters:

```text
All
Drafts
Scheduled
Published
Failed
```

Search:

```text
🔍 Search posts...
```

Table/list:

```text
Post
Platforms
Status
Scheduled
Created
Actions
```

Each post should have:

- Thumbnail
- Caption
- Platform icons
- Status badge
- Date
- Dropdown actions

Actions:

- Edit
- Duplicate
- Reschedule
- View
- Delete

---

# 13. SOCIAL ACCOUNTS

Create an attractive account-management page.

Header:

```text
Social Accounts

Connect your social platforms and manage everything from one place.

[ + Connect Account ]
```

Cards:

```text
┌────────────────────────────────────┐
│ Facebook                            │
│                                    │
│ ✓ VibeFlow                         │
│   Connected                        │
│                                    │
│ Last synced: 2 minutes ago         │
│                                    │
│ [Manage] [Disconnect]              │
└────────────────────────────────────┘
```

For disconnected accounts:

```text
⚠ Reauthorization required

[Reconnect]
```

Use recognizable platform icons.

---

# 14. ANALYTICS

Create a premium analytics dashboard.

Header:

```text
Analytics

Track your social performance across every platform.

[ Last 30 Days ▼ ]
```

Metrics:

```text
Reach
125.4K

Engagement
8.7%

Likes
24.8K

Comments
3.2K

Shares
5.4K
```

Charts:

### Reach Over Time

Line chart.

### Engagement By Platform

Bar chart.

### Top Performing Posts

Cards with:

- Thumbnail
- Platform
- Engagement
- Reach

Add platform filtering.

---

# 15. CAMPAIGNS

Campaign page:

```text
Campaigns

Create and manage multi-day social campaigns.

[ + New Campaign ]
```

Campaign card:

```text
┌─────────────────────────────────────┐
│ 🚀 Website Launch                   │
│                                     │
│ 7 posts                             │
│ 5 platforms                         │
│                                     │
│ ███████████████░░░ 75%              │
│                                     │
│ Active                              │
│                                     │
│ [View Campaign]                     │
└─────────────────────────────────────┘
```

---

# 16. AI CAMPAIGN GENERATOR

Create a visually impressive AI campaign wizard.

Step 1:

```text
What are you promoting?

┌──────────────────────────────────────┐
│ Our new website                      │
└──────────────────────────────────────┘
```

Step 2:

```text
Campaign duration

[ 7 days ]
```

Step 3:

```text
Platforms

☑ Instagram
☑ Facebook
☑ LinkedIn
☑ X
```

Step 4:

```text
AI generates:

Day 1 — Announcement
Day 2 — Features
Day 3 — Benefits
Day 4 — Behind the Scenes
Day 5 — Social Proof
Day 6 — Reminder
Day 7 — Final CTA
```

Allow users to edit every generated post before scheduling.

---

# 17. PUBLISHING STATUS

Create a beautiful publishing-progress modal.

```text
Publishing your post...

✓ Facebook
  Published

✓ Instagram
  Published

⏳ LinkedIn
  Publishing...

○ X
  Waiting...

○ YouTube
  Waiting...
```

When finished:

```text
🎉 Your post has been published!

5/5 platforms successful.

[View Posts]
```

For failure:

```text
Some platforms couldn't publish your post.

✓ Facebook
✓ Instagram
✕ LinkedIn

LinkedIn requires reauthorization.

[Reconnect LinkedIn]
[Retry]
```

---

# 18. NOTIFICATIONS

Notification center:

```text
Notifications

✓ Post published successfully
  Instagram • 2 minutes ago

⚠ LinkedIn needs reauthorization
  15 minutes ago

📅 Post scheduled
  Tomorrow at 8:00 PM
```

Use clean notification cards.

---

# 19. WORKSPACE / TEAM

Create team management UI.

```text
Workspace

VibeFlow

Members

Atik
Owner

Rahim
Admin

Sakib
Editor

[ + Invite Member ]
```

Role selector:

```text
Owner
Admin
Editor
Viewer
```

---

# 20. SETTINGS

Settings sidebar:

```text
General
Profile
Workspace
Social Accounts
Notifications
Security
Billing
Appearance
```

Include:

- Profile settings
- Workspace settings
- Password/security
- Notification preferences
- Theme selector
- Connected accounts
- Subscription

---

# 21. BILLING

Create a modern SaaS pricing/billing page.

Plans:

```text
FREE
$0

STARTER
$9/month

PRO
$29/month

AGENCY
$79/month
```

Highlight Pro as recommended.

Show:

- Current plan
- Usage
- Social account count
- Posts used
- AI usage
- Upgrade button

---

# 22. EMPTY STATES

Every page must have polished empty states.

Example:

```text
                 ✨

            No posts yet

Create your first post and publish
it across all your social platforms.

           [Create Post]
```

Do not leave blank screens.

---

# 23. LOADING STATES

Use skeleton loaders instead of generic "Loading..." text.

Examples:

- Dashboard skeleton
- Post card skeleton
- Analytics skeleton
- Calendar skeleton
- Account skeleton

---

# 24. MICRO-INTERACTIONS

Add subtle animations:

- Button hover
- Card hover
- Sidebar transitions
- Modal entrance
- Toast notifications
- Progress animations
- AI generation animation
- Publishing status transitions
- Drag/drop feedback

Animations should be subtle and fast.

Avoid excessive animations.

---

# 25. RESPONSIVE DESIGN

The application must work beautifully on:

- Desktop
- Laptop
- Tablet
- Mobile

Desktop:

```text
Sidebar + content
```

Tablet:

```text
Collapsed sidebar + content
```

Mobile:

```text
Top bar
Content
Bottom navigation
```

The post composer should become a full-screen mobile experience.

---

# 26. ACCESSIBILITY

Follow good accessibility practices.

Include:

- Keyboard navigation
- Visible focus states
- Proper labels
- ARIA where appropriate
- Good color contrast
- Accessible modals
- Screen-reader-friendly buttons
- Touch targets of appropriate size

---

# 27. COMPONENT SYSTEM

Build reusable components.

Examples:

```text
Button
Card
Badge
Avatar
Dropdown
Modal
Drawer
Tabs
Tooltip
Toast
Input
Textarea
Select
DatePicker
Calendar
Chart
PlatformIcon
PostCard
SocialAccountCard
StatusBadge
MetricCard
```

Create a consistent design system.

Do not duplicate UI code unnecessarily.

---

# 28. DESIGN TOKENS

Define consistent:

```text
Spacing
Border radius
Typography
Shadows
Borders
Transitions
Colors
```

Use CSS variables/design tokens so the entire UI can be changed centrally.

---

# 29. ICONS

Use a consistent icon library such as Lucide.

Social platforms should have recognizable icons.

Do not mix random icon styles.

---

# 30. DATA VISUALIZATION

Use clean charts.

Charts should:

- Have clear labels
- Have useful tooltips
- Avoid visual clutter
- Work in dark/light mode
- Be responsive

Do not use charts merely for decoration.

---

# 31. TOAST SYSTEM

Examples:

Success:

```text
✓ Post published successfully
```

Error:

```text
✕ Instagram couldn't publish your post.
```

Warning:

```text
⚠ Your LinkedIn account needs attention.
```

Info:

```text
Post scheduled for tomorrow at 8:00 PM.
```

---

# 32. GLOBAL SEARCH

Add a command/search interface.

Shortcut:

```text
⌘ K / Ctrl K
```

Search:

```text
Search PostPilot...

Posts
Campaigns
Social Accounts
Settings
```

This should feel like a modern SaaS command palette.

---

# 33. ONBOARDING

Create a first-time onboarding flow.

Step 1:

```text
Welcome to PostPilot 👋

Let's get your workspace ready.
```

Step 2:

```text
What's your workspace name?
```

Step 3:

```text
Connect your social accounts.

[ Facebook ]
[ Instagram ]
[ LinkedIn ]
[ X ]
[ YouTube ]
```

Step 4:

```text
You're ready!

Create your first post.

[ Create Post ]
```

Keep onboarding short.

---

# 34. LANDING PAGE

Also design a marketing landing page.

Hero:

```text
Create Once.
Publish Everywhere.

The AI-powered social media command center
for creators, businesses, and teams.

[ Start Free ]

[ See How It Works ]
```

Hero visual should show the PostPilot dashboard with multiple social platforms connected.

Sections:

1. Hero
2. Trusted by / social proof
3. How it works
4. Multi-platform publishing
5. AI content creation
6. Scheduling
7. Analytics
8. Campaigns
9. Team collaboration
10. Pricing
11. FAQ
12. Final CTA
13. Footer

---

# 35. LANDING PAGE — HOW IT WORKS

Create three steps:

```text
01
Create

Write your content once.

        ↓

02
Customize

AI adapts it for every platform.

        ↓

03
Publish

Schedule or publish everywhere.
```

Make this visually strong.

---

# 36. HERO DASHBOARD VISUAL

The landing-page hero should contain a realistic product preview.

Show:

```text
PostPilot

Create Post

"Introducing our newest product 🚀"

Instagram ✓
Facebook ✓
LinkedIn ✓
X ✓

AI optimized ✓

Scheduled for 8:00 PM
```

This should immediately communicate what the product does.

---

# 37. DESIGN PRINCIPLES

Follow these principles:

### 1. Clarity over decoration

Every element should have a purpose.

### 2. One primary action per screen

Do not overwhelm the user with buttons.

### 3. Progressive disclosure

Show advanced controls only when needed.

### 4. Consistency

Same interaction patterns everywhere.

### 5. Feedback

Every important action should provide feedback.

### 6. Trust

Publishing social content is high-impact.

Clearly show:

- What account will publish
- Which platforms
- When it will publish
- What content will be published

---

# 38. IMPORTANT

Do NOT:

- Use generic Bootstrap-looking layouts
- Build a boring admin dashboard
- Overuse gradients
- Overuse glassmorphism
- Use huge unnecessary cards
- Make everything rounded
- Fill empty space with meaningless graphics
- Use fake analytics as if they are real
- Create inaccessible controls
- Make the UI visually noisy

The interface should feel like a product people would actually pay for.

---

# 39. FRONTEND IMPLEMENTATION

Use:

```text
Next.js
TypeScript
Tailwind CSS
shadcn/ui
Lucide icons
TanStack Query
```

Use reusable components and feature-based architecture.

Suggested structure:

```text
src/
├── app/
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── charts/
│   └── social/
│
├── features/
│   ├── dashboard/
│   ├── posts/
│   ├── calendar/
│   ├── analytics/
│   ├── campaigns/
│   ├── social-accounts/
│   ├── ai/
│   ├── team/
│   └── billing/
│
├── hooks/
├── lib/
├── stores/
└── types/
```

---

# 40. FINAL UI GOAL

When a user opens PostPilot, they should immediately understand:

> "I can manage all my social media from here."

The primary experience should be:

```text
IDEA
 ↓
CREATE
 ↓
AI OPTIMIZE
 ↓
PREVIEW
 ↓
SELECT PLATFORMS
 ↓
SCHEDULE
 ↓
PUBLISH
 ↓
ANALYZE
```

The interface should make this workflow feel effortless.

## Final Brand Statement

**PostPilot**

**Create Once. Publish Everywhere.**

Build the UI as if PostPilot is a real venture-backed SaaS product preparing for public launch—not a student dashboard or prototype.