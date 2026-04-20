import aiService from '../services/aiService.js';

describe('classifyIssue', () => {
  test('returns other/medium for empty string', () => {
    const r = aiService.classifyIssue('');
    expect(r.category).toBe('other');
    expect(r.priority).toBe('medium');
  });

  test('returns other/medium for non-string', () => {
    const r = aiService.classifyIssue(null);
    expect(r.category).toBe('other');
  });

  test('classifies pothole', () => {
    expect(aiService.classifyIssue('big pothole on road').category).toBe('pothole');
  });

  test('classifies streetlight', () => {
    expect(aiService.classifyIssue('streetlight is out').category).toBe('streetlight');
  });

  test('classifies flooding', () => {
    expect(aiService.classifyIssue('water overflow near drain').category).toBe('flooding');
  });

  test('classifies safety', () => {
    expect(aiService.classifyIssue('dangerous hazard here').category).toBe('safety');
  });

  test('detects high priority', () => {
    expect(aiService.classifyIssue('urgent collapse').priority).toBe('high');
  });

  test('defaults to other for unknown text', () => {
    expect(aiService.classifyIssue('something unrelated xyz').category).toBe('other');
  });
});

describe('detectTrends', () => {
  test('empty array returns zero totals', () => {
    const r = aiService.detectTrends([]);
    expect(r.total).toBe(0);
    expect(r.urgent).toBe(0);
    expect(r.recentTrends).toHaveLength(0);
  });

  test('counts categories correctly', () => {
    const issues = [
      { category: 'pothole', priority: 'low', status: 'resolved' },
      { category: 'pothole', priority: 'low', status: 'resolved' },
      { category: 'flooding', priority: 'low', status: 'resolved' },
    ];
    const r = aiService.detectTrends(issues);
    expect(r.byCategory.pothole).toBe(2);
    expect(r.byCategory.flooding).toBe(1);
  });

  test('counts urgent (high priority or reported status)', () => {
    const issues = [
      { category: 'pothole', priority: 'high', status: 'resolved' },
      { category: 'flooding', priority: 'low', status: 'reported' },
      { category: 'other', priority: 'low', status: 'resolved' },
    ];
    expect(aiService.detectTrends(issues).urgent).toBe(2);
  });

  test('recentTrends has at most 3 entries', () => {
    const issues = ['pothole', 'streetlight', 'flooding', 'safety', 'other'].map(c => ({
      category: c, priority: 'low', status: 'resolved',
    }));
    expect(aiService.detectTrends(issues).recentTrends.length).toBeLessThanOrEqual(3);
  });
});

describe('answerQuestion (no Gemini key)', () => {
  const issues = [
    { category: 'pothole', priority: 'low', status: 'reported' },
    { category: 'flooding', priority: 'high', status: 'resolved' },
    { category: 'safety', priority: 'high', status: 'in_progress' },
  ];

  test('returns string for empty question', async () => {
    const r = await aiService.answerQuestion('', issues);
    expect(typeof r).toBe('string');
    expect(r.length).toBeGreaterThan(0);
  });

  test('answers open/backlog question', async () => {
    const r = await aiService.answerQuestion('how many open issues', issues);
    expect(r).toMatch(/\d+/);
  });

  test('answers resolved question', async () => {
    const r = await aiService.answerQuestion('how many resolved', issues);
    expect(r).toMatch(/\d+/);
  });

  test('answers total question', async () => {
    const r = await aiService.answerQuestion('how many total issues', issues);
    expect(r).toMatch(/3/);
  });

  test('answers safety question', async () => {
    const r = await aiService.answerQuestion('any safety hazards?', issues);
    expect(typeof r).toBe('string');
  });
});

describe('generateAlerts', () => {
  test('no alerts for empty issues', () => {
    expect(aiService.generateAlerts([])).toBe('No critical alerts at this time.');
  });

  test('alerts on high-priority issues', () => {
    const issues = [{ category: 'safety', priority: 'high', status: 'reported', createdAt: new Date() }];
    expect(aiService.generateAlerts(issues)).toMatch(/safety/i);
  });
});

describe('summarizeIssue', () => {
  test('returns fallback for null', async () => {
    expect(await aiService.summarizeIssue(null)).toBe('No issue data available.');
  });

  test('returns string containing category', async () => {
    const issue = {
      title: 'Broken light',
      category: 'streetlight',
      status: 'reported',
      priority: 'medium',
      location: { address: '123 Main St' },
    };
    const r = await aiService.summarizeIssue(issue);
    expect(typeof r).toBe('string');
    expect(r).toMatch(/streetlight/i);
  });
});
