# AgentForge MVP Specification

## MVP Philosophy

**Goal**: Launch a functional product that validates our core value proposition in 90 days.

**Principle**: "Perfect is the enemy of good" - Ship fast, iterate based on feedback.

---

## MVP Scope

### What's IN the MVP ✅

1. **Agent Creation** (form-based, no visual builder)
2. **Basic Knowledge Base** (document upload + RAG)
3. **Web Chat Widget** (embeddable)
4. **Simple Dashboard** (list agents, view conversations)
5. **User Authentication** (email/password)
6. **One LLM Provider** (OpenAI GPT-4/3.5)
7. **Basic Analytics** (message count, conversation count)
8. **Free Tier + One Paid Plan**

### What's OUT of the MVP ❌

1. Visual flow builder (Phase 2)
2. Multiple LLM providers (Phase 2)
3. Integrations (Slack, Teams, etc.) (Phase 2)
4. Advanced analytics (Phase 2)
5. Team collaboration (Phase 2)
6. Custom branding (Phase 2)
7. API access (Phase 2)
8. Mobile apps (Phase 3+)
9. Voice/video capabilities (Phase 3+)
10. A/B testing (Phase 2)

---

## User Stories

### Priority 1: Core Functionality

**As a user, I want to...**

1. ✅ Create an account with email and password
2. ✅ Log in and log out securely
3. ✅ Reset my password if forgotten
4. ✅ Create a new AI agent with basic configuration
5. ✅ Upload documents to my agent's knowledge base
6. ✅ Test my agent in a chat interface
7. ✅ Embed my agent on my website
8. ✅ View all my agents in a dashboard
9. ✅ View conversation history
10. ✅ Edit my agent's configuration
11. ✅ Delete an agent
12. ✅ See basic usage statistics

### Priority 2: Essential Features

13. ✅ See how many messages I have left (usage limits)
14. ✅ Upgrade to a paid plan
15. ✅ Update my billing information
16. ✅ Cancel my subscription
17. ✅ Customize agent appearance (name, description)
18. ✅ Receive email notifications for important events
19. ✅ Access help documentation
20. ✅ Contact support

---

## Feature Specifications

### 1. User Authentication

#### Registration
**Page**: `/signup`

**Fields**:
- Email (required, validated)
- Password (required, min 8 chars, 1 number, 1 special char)
- Full Name (required)
- Company Name (optional)
- Agree to Terms (checkbox, required)

**Flow**:
1. User enters information
2. Server validates data
3. Email verification sent
4. User clicks verification link
5. Account activated
6. Redirect to onboarding

**Validation**:
- Email format check
- Email uniqueness
- Password strength
- Rate limiting (5 attempts per hour per IP)

#### Login
**Page**: `/login`

**Fields**:
- Email
- Password
- Remember me (checkbox)

**Features**:
- OAuth support (Phase 2)
- 2FA (Phase 2)

#### Password Reset
**Page**: `/forgot-password`

**Flow**:
1. User enters email
2. Reset link sent (expires in 1 hour)
3. User clicks link
4. User enters new password
5. Password updated
6. Confirmation email sent

### 2. Agent Builder

#### Create Agent
**Page**: `/agents/new`

**Form Fields**:

**Basic Information**:
- Agent Name (required, 3-50 chars)
  - Example: "Customer Support Bot"
- Description (optional, 0-200 chars)
  - Example: "Helps customers with common questions"

**Behavior Configuration**:
- Personality/Tone (dropdown)
  - Options: Professional, Friendly, Casual, Technical
  - Default: Professional
  
- System Prompt (textarea, required)
  - Placeholder with example
  - Max 2000 characters
  - Tips/best practices shown
  
- Welcome Message (textarea, optional)
  - What agent says first
  - Example: "Hi! How can I help you today?"

**AI Settings**:
- Model Selection (dropdown)
  - GPT-4 (slower, smarter)
  - GPT-3.5-turbo (faster, cheaper)
  - Default: GPT-3.5-turbo
  
- Temperature (slider, 0-1)
  - 0 = Focused and deterministic
  - 1 = Creative and varied
  - Default: 0.7
  
- Max Response Length (dropdown)
  - Short (256 tokens)
  - Medium (512 tokens)
  - Long (1024 tokens)
  - Default: Medium

**Knowledge Base** (expandable section):
- Upload Documents button
- Drag & drop area
- File list with delete option
- Supported formats: PDF, TXT, MD, DOCX
- Size limit: 10MB per file
- Total limit: 100MB (free), 1GB (paid)

**Actions**:
- Save Draft button
- Create & Test button (primary)
- Cancel button

**Validation**:
- Name required
- System prompt required (min 20 chars)
- At least one document (if knowledge base section opened)

#### Agent List
**Page**: `/agents`

**Layout**: Grid or list view

**Agent Card Shows**:
- Agent name
- Description
- Status (Active/Inactive)
- Created date
- Usage stats (messages this month)
- Actions:
  - Test (opens chat)
  - Edit
  - Deploy (opens embed code)
  - Delete (with confirmation)

**Features**:
- Search/filter agents
- Sort by: name, date, usage
- Create new agent button (prominent)

#### Edit Agent
**Page**: `/agents/:id/edit`

**Same form as Create Agent**

**Additional Features**:
- Version history (view only, revert in Phase 2)
- Last modified timestamp
- Update button

### 3. Knowledge Base Management

#### Upload Documents
**Interface**: Modal or inline

**Upload Methods**:
- File picker
- Drag and drop
- Paste URL (Phase 2)

**Processing**:
1. Upload to S3
2. Queue for processing
3. Extract text
4. Chunk text (512 token chunks, 50 token overlap)
5. Generate embeddings
6. Store in vector DB
7. Mark as "Ready"

**UI States**:
- Uploading (progress bar)
- Processing (spinner)
- Ready (checkmark)
- Error (retry button)

**Document List**:
- Filename
- Size
- Upload date
- Status
- Actions: Preview, Delete

#### RAG Configuration
**Page**: `/agents/:id/knowledge-base`

**Settings** (advanced, collapsible):
- Number of results to retrieve (default: 3)
- Similarity threshold (default: 0.7)
- Include sources in response (checkbox, default: yes)

### 4. Chat Interface

#### Testing Interface
**Page**: `/agents/:id/test`

**Layout**: Full-screen chat

**Features**:
- Chat history
- Message input (textarea)
- Send button
- Clear conversation button
- Conversation context shown
- Typing indicator
- Source citations (if from knowledge base)

**Message Display**:
- User messages (right side, blue)
- Agent messages (left side, gray)
- Timestamp
- Source links (if applicable)

**Debug Panel** (collapsible):
- Raw prompt sent to LLM
- Tokens used
- Response time
- Retrieved documents (if RAG)
- Cost estimate

#### Embedded Widget
**Code**: Generated for each agent

**Customization Options**:
- Widget position (bottom-right, bottom-left)
- Primary color
- Button text
- Initial message

**Code Snippet**:
```html
<script src="https://cdn.agentforge.com/widget.js"></script>
<script>
  AgentForge.init({
    agentId: 'agent_123456',
    position: 'bottom-right',
    primaryColor: '#4F46E5'
  });
</script>
```

**Widget Features**:
- Floating button
- Expandable chat window
- Minimize/maximize
- Mobile responsive
- Conversation persistence (session storage)

### 5. Dashboard

#### Overview Page
**Page**: `/dashboard`

**Metrics** (current month):
- Total conversations
- Total messages
- Active agents
- Messages remaining (free tier)

**Charts**:
- Messages per day (line chart)
- Top agents by usage (bar chart)

**Quick Actions**:
- Create new agent
- View all agents
- View all conversations

**Recent Activity**:
- Latest conversations (5 most recent)
- Latest agents created

### 6. Conversations

#### Conversation List
**Page**: `/conversations`

**Table Columns**:
- Agent name
- Started date
- Messages count
- Last message
- Status (Active, Ended)
- Actions: View

**Filters**:
- By agent
- By date range
- By status

**Search**:
- Search by message content

#### Conversation Detail
**Page**: `/conversations/:id`

**Display**:
- Full conversation transcript
- Timestamps
- Agent used
- User information (if available)
- Metadata (user agent, location, etc.)

**Actions**:
- Export (JSON, CSV)
- Share link
- Delete

### 7. Analytics

#### Basic Analytics Page
**Page**: `/analytics`

**Time Range Selector**:
- Last 7 days
- Last 30 days
- Last 90 days
- Custom range

**Metrics**:
1. **Usage**
   - Total conversations
   - Total messages
   - Unique users
   - Average messages per conversation
   
2. **Performance**
   - Average response time
   - Success rate (completed conversations)
   
3. **Costs**
   - Total tokens used
   - Estimated cost
   - Cost per conversation

**Charts**:
- Usage over time
- Agent comparison
- Hourly distribution

### 8. Billing & Subscription

#### Plans Page
**Page**: `/pricing` (public) or `/settings/billing`

**Plans**:

**Free Forever**:
- 1 active agent
- 1,000 messages/month
- 10 documents (100MB total)
- GPT-3.5-turbo only
- Community support
- AgentForge branding
- Price: $0

**Starter**:
- 3 active agents
- 10,000 messages/month
- 100 documents (1GB total)
- GPT-4 access
- Email support
- Remove branding
- Price: $99/month

**CTA**: "Start Free" or "Upgrade to Starter"

#### Billing Settings
**Page**: `/settings/billing`

**Current Plan**:
- Plan name
- Price
- Billing cycle
- Next billing date
- Usage this month

**Payment Method**:
- Card details (Stripe)
- Update card button

**Billing History**:
- Invoice date
- Amount
- Status
- Download PDF

**Actions**:
- Upgrade/downgrade plan
- Cancel subscription (with retention offer)
- Update payment method

### 9. User Settings

#### Profile Settings
**Page**: `/settings/profile`

**Fields**:
- Full name
- Email (show, cannot change - Phase 2)
- Company name
- Profile picture (Phase 2)
- Timezone

**Password**:
- Change password section
- Current password
- New password
- Confirm password

#### Notification Settings
**Page**: `/settings/notifications`

**Email Notifications**:
- [ ] Agent errors
- [ ] Usage limit warnings (90%, 100%)
- [ ] Monthly summary
- [ ] Product updates
- [ ] Marketing emails (opt-in)

### 10. Help & Support

#### Documentation
**Page**: `/docs`

**Sections**:
- Getting Started
- Creating Your First Agent
- Knowledge Base Setup
- Embedding Widget
- Troubleshooting
- FAQ

#### Support
**Page**: `/support`

**Options**:
- Help Center (link to docs)
- Email support (support@agentforge.com)
- Feature requests (link to feedback board)

**Contact Form**:
- Name
- Email
- Subject
- Message
- Attach screenshot (optional)

---

## Technical Architecture (MVP)

### Frontend
**Tech Stack**:
- Next.js 14
- React 18
- TypeScript
- TailwindCSS
- Shadcn/ui components
- React Query (data fetching)
- Zustand (state management)

**Key Pages**:
```
/                       # Landing page
/signup                 # Registration
/login                  # Login
/dashboard              # Overview
/agents                 # Agent list
/agents/new             # Create agent
/agents/:id/edit        # Edit agent
/agents/:id/test        # Test chat
/agents/:id/deploy      # Deployment options
/conversations          # Conversation list
/conversations/:id      # Conversation detail
/analytics              # Analytics dashboard
/settings/profile       # User settings
/settings/billing       # Billing
/docs                   # Documentation
/support                # Support
```

### Backend
**Tech Stack**:
- Node.js 20 LTS
- NestJS 10+
- TypeORM
- PostgreSQL 15
- Redis 7
- Pinecone (vector DB)
- LangChain.js
- OpenAI API
- Stripe (payments)

**API Endpoints**:
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/reset-password

GET    /api/v1/agents
POST   /api/v1/agents
GET    /api/v1/agents/:id
PUT    /api/v1/agents/:id
DELETE /api/v1/agents/:id

POST   /api/v1/agents/:id/documents
GET    /api/v1/agents/:id/documents
DELETE /api/v1/agents/:id/documents/:docId

POST   /api/v1/agents/:id/chat
GET    /api/v1/agents/:id/conversations
GET    /api/v1/conversations/:id

GET    /api/v1/analytics
GET    /api/v1/analytics/usage

GET    /api/v1/billing/plans
POST   /api/v1/billing/subscribe
POST   /api/v1/billing/cancel
GET    /api/v1/billing/invoices

GET    /api/v1/users/me
PUT    /api/v1/users/me
PUT    /api/v1/users/me/password
```

### Database Schema

**users**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**agents**:
```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  welcome_message TEXT,
  personality VARCHAR(50) DEFAULT 'professional',
  model VARCHAR(50) DEFAULT 'gpt-3.5-turbo',
  temperature DECIMAL(2,1) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 512,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**documents**:
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'processing',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**conversations**:
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP
);
```

**messages**:
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  tokens_used INTEGER,
  sources JSONB, -- Referenced documents
  created_at TIMESTAMP DEFAULT NOW()
);
```

**subscriptions**:
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  plan VARCHAR(50) NOT NULL, -- 'free', 'starter'
  status VARCHAR(50) NOT NULL,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**usage_tracking**:
```sql
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  period_start DATE NOT NULL,
  messages_count INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  UNIQUE(user_id, period_start)
);
```

---

## User Flows

### Flow 1: First-Time User Onboarding

1. **Landing Page** → Click "Start Free"
2. **Sign Up** → Enter email, password, name
3. **Email Verification** → Click link in email
4. **Onboarding Welcome** → "Let's create your first agent"
5. **Guided Agent Creation**:
   - Step 1: Name your agent
   - Step 2: Set personality and prompt
   - Step 3: Upload a document (optional)
6. **Test Agent** → Try it out in chat
7. **Get Embed Code** → Copy widget code
8. **Dashboard** → See your first agent

### Flow 2: Create and Deploy Agent

1. **Dashboard** → Click "Create New Agent"
2. **Agent Builder** → Fill in configuration
3. **Upload Documents** → Add knowledge base
4. **Test Agent** → Verify it works
5. **Deploy** → Get embed code
6. **Copy Code** → Paste on website
7. **Done** → Agent is live!

### Flow 3: Upgrade to Paid Plan

1. **Hit Usage Limit** → Banner shows "90% of messages used"
2. **Click Banner** → Taken to pricing page
3. **Select Plan** → Choose "Starter" plan
4. **Enter Payment** → Stripe checkout
5. **Confirmation** → Plan upgraded
6. **Dashboard** → New limits displayed

---

## Design System (Basic)

### Colors
**Primary**: Indigo (#4F46E5)
**Secondary**: Purple (#7C3AED)
**Success**: Green (#10B981)
**Warning**: Yellow (#F59E0B)
**Error**: Red (#EF4444)
**Neutral**: Gray scale

### Typography
**Font**: Inter (Google Fonts)
**Headings**: Bold, larger sizes
**Body**: Regular, 16px base

### Components
- Buttons (primary, secondary, ghost)
- Inputs (text, textarea, select)
- Cards
- Modals
- Toasts
- Tables
- Charts (Recharts)

---

## MVP Success Metrics

### Product Metrics
- [ ] 100 sign-ups in first month
- [ ] 50 agents created
- [ ] 10,000 messages processed
- [ ] 10% conversion to paid (10 paying customers)

### Quality Metrics
- [ ] <2s average response time
- [ ] >95% uptime
- [ ] <5% error rate
- [ ] NPS > 40

### User Engagement
- [ ] 50% of users create an agent
- [ ] 30% of users deploy an agent
- [ ] 60% of users return after 7 days

---

## Timeline

### Week 1-2: Setup
- Project scaffolding
- Database setup
- Auth implementation
- Basic UI components

### Week 3-4: Core Features
- Agent CRUD
- Document upload
- Chat interface
- Widget embed

### Week 5-6: Polish
- Dashboard
- Analytics
- Billing integration
- Testing

### Week 7-8: Pre-Launch
- Documentation
- Bug fixes
- Performance optimization
- Beta testing

### Week 9: Launch
- Product Hunt launch
- Marketing push
- Monitor and iterate

---

## Out of Scope (Post-MVP)

### Phase 2 (Months 4-6)
- Visual flow builder
- Multiple LLM providers
- Integrations (Slack, Teams)
- Team collaboration
- A/B testing
- Custom branding

### Phase 3 (Months 7-12)
- API access
- Advanced analytics
- Fine-tuning
- Enterprise features
- Mobile apps

---

## Risk Mitigation

### Technical Risks
- **LLM API downtime**: Implement retry logic, status page
- **High costs**: Usage limits, monitoring, alerts
- **Slow responses**: Caching, streaming, optimization

### Product Risks
- **Low adoption**: Strong onboarding, templates, documentation
- **Poor UX**: User testing, feedback loops
- **Feature creep**: Strict scope, say no to extras

### Business Risks
- **Low conversion**: Clear value prop, easy upgrade path
- **High churn**: Customer success, product improvements
- **Competition**: Move fast, differentiate

---

## Launch Checklist

**Pre-Launch**:
- [ ] All MVP features complete
- [ ] 10 beta testers providing feedback
- [ ] Documentation complete
- [ ] Legal documents (ToS, Privacy)
- [ ] Analytics tracking setup
- [ ] Error monitoring (Sentry)
- [ ] Email setup (SendGrid)
- [ ] Payment processing tested (Stripe)
- [ ] Performance tested
- [ ] Security audit

**Launch Day**:
- [ ] Product Hunt submission
- [ ] Social media announcements
- [ ] Email to waitlist
- [ ] Monitor for issues
- [ ] Respond to feedback
- [ ] Fix critical bugs immediately

**Post-Launch (Week 1)**:
- [ ] Daily user feedback review
- [ ] Quick bug fixes
- [ ] Performance monitoring
- [ ] Customer support
- [ ] Iterate based on feedback
