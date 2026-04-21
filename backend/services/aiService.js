import dotenv from 'dotenv';

dotenv.config();

class AIService {
    constructor() {
        this.geminiApiKey = process.env.GEMINI_API_KEY;
        this.geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent';

        this.categoryKeywords = {
            pothole: ['pothole', 'road', 'asphalt', 'crack', 'sinkhole'],
            streetlight: ['streetlight', 'light', 'lamp', 'dark', 'bulb', 'fixture'],
            flooding: ['flood', 'water', 'drain', 'storm', 'overflow', 'ponding'],
            safety: ['danger', 'hazard', 'unsafe', 'accident', 'collision', 'visibility'],
            other: ['other', 'misc', 'general'],
        };

        this.priorityKeywords = {
            high: ['urgent', 'critical', 'danger', 'emergency', 'collapse', 'hole'],
            medium: ['important', 'priority', 'needs attention', 'repair'],
            low: ['cosmetic', 'minor', 'low', 'non-urgent', 'nuisance'],
        };
    }

    async summarizeIssue(issue) {
        if (!issue) return 'No issue data available.';

        const title = issue.title || 'Unnamed issue';
        const category = issue.category || 'unknown';
        const status = issue.status || 'unknown';
        const priority = issue.priority || 'medium';
        const location = issue.location || 'unknown location';

        if (this.geminiApiKey) {
            try {
                const prompt = `Summarize this civic issue in one concise sentence:
                Title: ${title}
                Category: ${category}
                Description: ${issue.description || ''}
                Location: ${location}
                Status: ${status}
                Priority: ${priority}`;

                const response = await this.callGeminiAPI(prompt);
                return response || `Summary: ${title} (${category}) at ${location}. Status: ${status}. Priority: ${priority}.`;
            } catch (error) {
                console.error('Gemini API error, falling back to basic summary:', error.message);
            }
        }

        return `Summary: ${title} (${category}) at ${location}. Status: ${status}. Priority: ${priority}.`;
    }

    classifyIssue(text) {
        if (typeof text !== 'string' || !text.trim()) {
            return { category: 'other', priority: 'medium', note: 'Cannot classify empty text.' };
        }

        if (this.geminiApiKey) {
            try {
                const prompt = `Classify this civic issue report into one of these categories: pothole, streetlight, flooding, safety, other.
                Also determine priority: low, medium, high.
                
                Issue text: ${text}
                Respond with JSON format: {"category": "category_name", "priority": "priority_level", "confidence": 0.95}`;

                const lower = text.toLowerCase();
                const category = Object.keys(this.categoryKeywords).find((key) =>
                    this.categoryKeywords[key].some((term) => lower.includes(term))
                ) || 'other';

                const priority = Object.keys(this.priorityKeywords).find((key) =>
                    this.priorityKeywords[key].some((term) => lower.includes(term))
                ) || 'medium';

                return {
                    category,
                    priority,
                    note: `Classified as ${category} with ${priority} priority.`,
                };
            } catch (error) {
                console.error('AI classification error:', error.message);
            }
        }

        const lower = text.toLowerCase();
        const category = Object.keys(this.categoryKeywords).find((key) =>
            this.categoryKeywords[key].some((term) => lower.includes(term))
        ) || 'other';

        const priority = Object.keys(this.priorityKeywords).find((key) =>
            this.priorityKeywords[key].some((term) => lower.includes(term))
        ) || 'medium';

        return {
            category,
            priority,
            note: `Classified as ${category} with ${priority} priority.`,
        };
    }

    detectTrends(issues = []) {
        const summary = { total: issues.length, byCategory: {}, urgent: 0, recentTrends: [] };

        for (const issue of issues) {
            const category = issue.category || 'other';
            summary.byCategory[category] = (summary.byCategory[category] || 0) + 1;
            if (issue.priority === 'high' || issue.status === 'reported') {
                summary.urgent += 1;
            }
        }

        const sortedCategories = Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1]);

        if (sortedCategories.length > 0) {
            summary.recentTrends = sortedCategories.slice(0, 3).map(([category, count]) => ({
                category,
                count,
                percentage: Math.round((count / issues.length) * 100)
            }));
        }

        return summary;
    }

    async generateInsight(issues = []) {
        if (!issues || issues.length === 0) {
            return 'No issues data available for analysis.';
        }

        if (this.geminiApiKey) {
            try {
                const categoryCounts = {};
                const statusCounts = {};
                const recentIssues = [];

                issues.forEach(issue => {
                    categoryCounts[issue.category] = (categoryCounts[issue.category] || 0) + 1;
                    statusCounts[issue.status] = (statusCounts[issue.status] || 0) + 1;

                    if (recentIssues.length < 5) {
                        recentIssues.push({
                            title: issue.title,
                            category: issue.category,
                            status: issue.status,
                            priority: issue.priority
                        });
                    }
                });

                const dataSummary = `
Total Issues: ${issues.length}
By Category: ${JSON.stringify(categoryCounts)}
By Status: ${JSON.stringify(statusCounts)}
Recent Issues: ${JSON.stringify(recentIssues)}
`;

                const prompt = `Analyze these civic issue statistics and provide actionable insights:

${dataSummary}

Provide a brief analysis (2-3 sentences) about:
1. Which category has the most issues
2. What percentage are resolved vs open
3. One specific recommendation for the city

Be concise and actionable.`;

                const response = await this.callGeminiAPI(prompt);
                if (response) return response;
            } catch (error) {
                console.error('Gemini API error in generateInsight, using fallback:', error.message);
            }
        }

        const categoryCounts = {};
        issues.forEach(issue => {
            categoryCounts[issue.category] = (categoryCounts[issue.category] || 0) + 1;
        });

        const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];
        return `Based on ${issues.length} total issues: "${topCategory[0]}" is the most reported category with ${topCategory[1]} reports.`;
    }

    async answerQuestion(question, issues = []) {
            if (typeof question !== 'string' || !question.trim()) {
                return 'Ask a question about open issues, trends, or safety alerts.';
            }

            if (this.geminiApiKey) {
                try {
                    const trendData = this.detectTrends(issues);
                    const context = `
                    Total issues: ${issues.length}
                    Open issues: ${issues.filter(i => ['reported', 'in_progress'].includes(i.status)).length}
                    Resolved issues: ${issues.filter(i => i.status === 'resolved').length}
                    High priority: ${issues.filter(i => i.priority === 'high').length}
                    Top categories: ${JSON.stringify(trendData.byCategory)}
                `;

                    const prompt = `You are a civic issue tracking assistant. Answer this question based on the data:
                
                Context: ${context}
                Question: ${question}
                
                Provide a helpful, concise response.`;

                    const response = await this.callGeminiAPI(prompt);
                    if (response) return response;
                } catch (error) {
                    console.error('Gemini API error, using basic responses:', error.message);
                }
            }

            const lower = question.toLowerCase();
            const trend = this.detectTrends(issues);

            if (lower.includes('open') || lower.includes('reported') || lower.includes('backlog')) {
                const open = issues.filter((issue) => ['reported', 'in_progress'].includes(issue.status)).length;
                return `There are ${open} active issues in the backlog.`;
            }

            if (lower.includes('resolved') || lower.includes('closed')) {
                const resolved = issues.filter((issue) => issue.status === 'resolved').length;
                return `There are ${resolved} resolved issues.`;
            }

            if (lower.includes('trend') || lower.includes('pattern')) {
                const top = Object.entries(trend.byCategory).sort((a, b) => b[1] - a[1])[0];
                return top ? `Top trend: ${top[0]} with ${top[1]} reports. Urgent issues: ${trend.urgent}.` : 'No clear trends yet.';
            }

            if (lower.includes('safety') || lower.includes('hazard') || lower.includes('danger')) {
                const hazards = issues.filter((issue) => issue.category === 'safety' || issue.priority === 'high');
                return hazards.length ? `Safety alert: ${hazards.length} high-priority/hazard issues need review.` : 'No active safety hazards were found.';
            }

            if (lower.includes('total') || lower.includes('how many')) {
                return `Total issues in the system: ${issues.length}. Open: ${issues.filter(i => ['reported', 'in_progress'].includes(i.status)).length}, Resolved: ${issues.filter(i => i.status === 'resolved').length}.`;
            }

            if (lower.includes('describe') || lower.includes('details') || lower.includes('example')) {
                if (issues.length === 0) return 'No issues have been reported yet.';
                const example = issues[0];
                return `Example issue: "${example.title}" in category "${example.category}" with status "${example.status}" and priority "${example.priority}".`;
            }

            if (lower.includes('priority') || lower.includes('urgent') || lower.includes('high')) {
                const highPriority = issues.filter(i => i.priority === 'high').length;
                return `There are ${highPriority} high-priority issues that may require immediate attention.`;
            }

            if (lower.includes('category') || lower.includes('type') || lower.includes('most common')) {
                const topCategory = Object.entries(trend.byCategory).sort((a, b) => b[1] - a[1])[0];
                return topCategory ? `The most common category is "${topCategory[0]}" with ${topCategory[1]} reports.` : 'No categories have been reported yet.';
            }

            if (lower.includes('solution') || lower.includes('fix') || lower.includes('recommendation')) {
                return 'For specific solutions, please ask for recommendations based on current trends and issue data.';
            }

            if (lower.includes('what') || lower.includes('list') || lower.includes('raised') || lower.includes('reported')) {
                if (issues.length === 0) return 'No issues have been reported yet.';
                const summary = issues.slice(0, 5).map(i => `"${i.title}" (${i.category}, ${i.status})`).join(', ');
                return `${issues.length} issue(s) reported: ${summary}${issues.length > 5 ? `, and ${issues.length - 5} more.` : '.'}`;
        }

        if (lower.includes('prioritiq') || lower.includes('urgent') || lower.includes('high')) {
            const highPriority = issues.filter(i => i.priority === 'high').length;
            return `There are ${highPriority} high-priority issues that may require immediate attention.`;
        }

        return 'I can answer questions about issue status, trends, and safety. Try asking about open issues, resolved issues, trends, or safety hazards.';
    }

    async callGeminiAPI(prompt) {
        if (!this.geminiApiKey) {
            throw new Error('Gemini API key not configured');
        }

        try {
            const response = await fetch(`${this.geminiApiUrl}?key=${this.geminiApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                    }
                })
            });

            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                return data.candidates[0].content.parts[0].text;
            }
            
            return null;
        } catch (error) {
            console.error('Error calling Gemini API:', error.message);
            return null;
        }
    }

    async processAgentQuery(question, issues = []) {
        const trend = this.detectTrends(issues);
        const lower = question.toLowerCase();
        
        if (lower.includes('recommend') || lower.includes('suggest')) {
            return this.generateRecommendations(issues, trend);
        }
        if (lower.includes('predict') || lower.includes('forecast')) {
            return this.generatePredictions(issues, trend);
        }
        if (lower.includes('alert') || lower.includes('urgent')) {
            return this.generateAlerts(issues);
        }
        
        return this.answerQuestion(question, issues);
    }

    generateRecommendations(issues, trend) {
        const openCount = issues.filter(i => ['reported', 'in_progress'].includes(i.status)).length;
        const highPriorityCount = issues.filter(i => i.priority === 'high').length;
        let recommendations = [];
        
        if (highPriorityCount > 5) {
            recommendations.push(`High priority: ${highPriorityCount} urgent issues need immediate attention.`);
        }
        if (trend.recentTrends.length > 0) {
            const topCategory = trend.recentTrends[0];
            recommendations.push(`Focus on ${topCategory.category} issues (${topCategory.count} reports, ${topCategory.percentage}% of total).`);
        }
        if (openCount > 10) {
            recommendations.push(`Consider allocating more resources - ${openCount} issues are still open.`);
        }
        
        return recommendations.length > 0 ? `Recommendations: ${recommendations.join(' ')}` : 'No specific recommendations at this time. All metrics appear normal.';
    }

    generatePredictions(issues, trend) {
        if (issues.length < 5) {
            return 'Not enough data to make predictions. Need at least 5 issues for trend analysis.';
        }

        // Last 10 issues
        const recentIssues = issues.slice(-10);
        const recentTrends = this.detectTrends(recentIssues);
        let predictions = [];
        
        if (recentTrends.urgent > 3) {
            predictions.push('Urgent issues are increasing - expect higher workload.');
        }
        
        const topCategory = Object.entries(recentTrends.byCategory).sort((a, b) => b[1] - a[1])[0];
        if (topCategory) {
            predictions.push(`${topCategory[0]} issues may continue to rise based on recent patterns.`);
        }
        
        return predictions.length > 0 ? `Predictions: ${predictions.join(' ')}` : 'Current trends appear stable. No significant changes expected.';
    }

    generateAlerts(issues) {
        const hazards = issues.filter(i => i.category === 'safety' || i.priority === 'high');
        const flooding = issues.filter(i => i.category === 'flooding');
        const oldOpen = issues.filter(i => {
            const daysOpen = (Date.now() - new Date(i.createdAt).getTime()) / (1000 * 60 * 60 * 24);
            return ['reported', 'in_progress'].includes(i.status) && daysOpen > 7;
        });
        
        let alerts = [];
        
        if (hazards.length > 0) {
            alerts.push(`${hazards.length} safety/high-priority issues require immediate attention.`);
        }
        if (flooding.length > 2) {
            alerts.push(`${flooding.length} flooding reports - check drainage systems.`);
        }
        if (oldOpen.length > 5) {
            alerts.push(`${oldOpen.length} issues open for over a week - review backlog.`);
        }
        
        return alerts.length > 0
            ? alerts.join(' ') : 'No critical alerts at this time.';
    }
}

export default new AIService();