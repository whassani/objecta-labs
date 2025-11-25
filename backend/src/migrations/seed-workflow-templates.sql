-- Seed Workflow Templates

-- Customer Support Automation Template
INSERT INTO workflow_templates (id, name, description, category, definition, icon, is_public, use_count, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'Customer Support Automation',
  'Automatically respond to common customer queries using AI',
  'customer-service',
  '{"nodes":[{"id":"trigger-1","type":"trigger","position":{"x":100,"y":100},"data":{"label":"Webhook Trigger","triggerType":"webhook"}},{"id":"agent-1","type":"action","position":{"x":100,"y":200},"data":{"label":"Support Agent","actionType":"agent","prompt":"Analyze customer query: {{trigger.payload.message}}"}}],"edges":[{"id":"e1","source":"trigger-1","target":"agent-1"}]}',
  '🎧',
  true,
  0,
  NOW(),
  NOW()
);

-- Lead Qualification Template
INSERT INTO workflow_templates (id, name, description, category, definition, icon, is_public, use_count, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'Lead Qualification Pipeline',
  'Score and route leads automatically based on criteria',
  'sales',
  '{"nodes":[{"id":"trigger-1","type":"trigger","position":{"x":100,"y":100},"data":{"label":"Form Submission","triggerType":"webhook"}},{"id":"tool-1","type":"action","position":{"x":100,"y":200},"data":{"label":"Score Lead","actionType":"tool"}},{"id":"condition-1","type":"condition","position":{"x":100,"y":300},"data":{"label":"Qualified?","condition":"stepOutputs[''tool-1''].score > 70"}},{"id":"email-1","type":"action","position":{"x":50,"y":400},"data":{"label":"Notify Sales","actionType":"email","to":"sales@company.com"}},{"id":"email-2","type":"action","position":{"x":200,"y":400},"data":{"label":"Nurture Email","actionType":"email"}}],"edges":[{"id":"e1","source":"trigger-1","target":"tool-1"},{"id":"e2","source":"tool-1","target":"condition-1"},{"id":"e3","source":"condition-1","target":"email-1","sourceHandle":"true"},{"id":"e4","source":"condition-1","target":"email-2","sourceHandle":"false"}]}',
  '📊',
  true,
  0,
  NOW(),
  NOW()
);

-- Daily Report Generation Template
INSERT INTO workflow_templates (id, name, description, category, definition, icon, is_public, use_count, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'Daily Report Generation',
  'Generate and email daily reports automatically',
  'reporting',
  '{"nodes":[{"id":"trigger-1","type":"trigger","position":{"x":100,"y":100},"data":{"label":"Daily at 9 AM","triggerType":"schedule"}},{"id":"http-1","type":"action","position":{"x":100,"y":200},"data":{"label":"Fetch Data","actionType":"http","method":"GET","url":"https://api.example.com/stats"}},{"id":"agent-1","type":"action","position":{"x":100,"y":300},"data":{"label":"Analyze Data","actionType":"agent","prompt":"Summarize this data: {{stepOutputs[''http-1''].data}}"}},{"id":"email-1","type":"action","position":{"x":100,"y":400},"data":{"label":"Send Report","actionType":"email","to":"team@company.com","subject":"Daily Report"}}],"edges":[{"id":"e1","source":"trigger-1","target":"http-1"},{"id":"e2","source":"http-1","target":"agent-1"},{"id":"e3","source":"agent-1","target":"email-1"}]}',
  '📈',
  true,
  0,
  NOW(),
  NOW()
);

-- Data Processing Pipeline Template
INSERT INTO workflow_templates (id, name, description, category, definition, icon, is_public, use_count, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'Data Processing Pipeline',
  'Process and transform data from multiple sources',
  'data-processing',
  '{"nodes":[{"id":"trigger-1","type":"trigger","position":{"x":100,"y":100},"data":{"label":"Scheduled Trigger","triggerType":"schedule"}},{"id":"http-1","type":"action","position":{"x":100,"y":200},"data":{"label":"Fetch Data","actionType":"http"}},{"id":"loop-1","type":"condition","position":{"x":100,"y":300},"data":{"label":"Process Each Item","controlType":"loop"}},{"id":"tool-1","type":"action","position":{"x":100,"y":400},"data":{"label":"Transform Data","actionType":"tool"}},{"id":"http-2","type":"action","position":{"x":100,"y":500},"data":{"label":"Save Results","actionType":"http","method":"POST"}}],"edges":[{"id":"e1","source":"trigger-1","target":"http-1"},{"id":"e2","source":"http-1","target":"loop-1"},{"id":"e3","source":"loop-1","target":"tool-1"},{"id":"e4","source":"tool-1","target":"http-2"}]}',
  '⚙️',
  true,
  0,
  NOW(),
  NOW()
);

-- Onboarding Automation Template
INSERT INTO workflow_templates (id, name, description, category, definition, icon, is_public, use_count, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'User Onboarding Automation',
  'Automate new user onboarding with welcome emails and setup tasks',
  'onboarding',
  '{"nodes":[{"id":"trigger-1","type":"trigger","position":{"x":100,"y":100},"data":{"label":"User Registered","triggerType":"event"}},{"id":"email-1","type":"action","position":{"x":100,"y":200},"data":{"label":"Welcome Email","actionType":"email","subject":"Welcome!"}},{"id":"delay-1","type":"condition","position":{"x":100,"y":300},"data":{"label":"Wait 1 day","controlType":"delay","delay":1,"unit":"d"}},{"id":"email-2","type":"action","position":{"x":100,"y":400},"data":{"label":"Getting Started","actionType":"email","subject":"Getting Started Guide"}}],"edges":[{"id":"e1","source":"trigger-1","target":"email-1"},{"id":"e2","source":"email-1","target":"delay-1"},{"id":"e3","source":"delay-1","target":"email-2"}]}',
  '👋',
  true,
  0,
  NOW(),
  NOW()
);
