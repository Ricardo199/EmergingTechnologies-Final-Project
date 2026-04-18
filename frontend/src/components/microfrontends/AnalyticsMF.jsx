import { useState } from 'react';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

const DASHBOARD = gql`
  query Dashboard {
    dashboardSummary {
      totalOpen totalResolved highPriority
      byCategory { category count }
    }
    trendInsights { category count }
  }
`;

const GET_ISSUES = gql`
  query AllIssues {
    issues {
      _id title category status priority createdAt
      location { address }
      reportedBy { username }
      assignedTo { username }
    }
  }
`;

const UPDATE_ISSUE = gql`
  mutation UpdateIssue($id: ID!, $status: IssueStatus, $priority: IssuePriority) {
    updateIssue(id: $id, status: $status, priority: $priority) {
      _id status priority
    }
  }
`;

const RESOLVE_ISSUE = gql`
  mutation ResolveIssue($id: ID!) {
    resolveIssue(id: $id) { _id status }
  }
`;

const STATUS_COLORS = {
  reported: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

export default function AnalyticsMF({ user }) {
  const [tab, setTab] = useState('overview');
  const { data: dash, loading: dashLoading } = useQuery(DASHBOARD);
  const { data: issuesData, loading: issuesLoading, refetch } = useQuery(GET_ISSUES);
  const [updateIssue] = useMutation(UPDATE_ISSUE);
  const [resolveIssue] = useMutation(RESOLVE_ISSUE);

  const handleStatus = async (id, status) => {
    await updateIssue({ variables: { id, status } });
    refetch();
  };

  const handleResolve = async (id) => {
    await resolveIssue({ variables: { id } });
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b pb-3">
        {['overview', 'manage'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-sm font-medium pb-1 border-b-2 transition-colors ${
              tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'overview' ? 'Overview' : 'Manage Issues'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          {dashLoading ? (
            <p className="text-gray-400 text-sm">Loading...</p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard label="Open Issues" value={dash?.dashboardSummary.totalOpen} color="text-yellow-600" />
                <StatCard label="Resolved" value={dash?.dashboardSummary.totalResolved} color="text-green-600" />
                <StatCard label="High Priority" value={dash?.dashboardSummary.highPriority} color="text-red-600" />
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Issues by Category</h3>
                <div className="space-y-2">
                  {dash?.dashboardSummary.byCategory.map(({ category, count }) => {
                    const total = dash.dashboardSummary.byCategory.reduce((s, c) => s + c.count, 0);
                    const pct = total ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={category}>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span className="capitalize">{category}</span>
                          <span>{count} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">AI Trend Insights</h3>
                <div className="flex flex-wrap gap-2">
                  {dash?.trendInsights.map(({ category, count }) => (
                    <span key={category} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                      {category}: {count}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'manage' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {issuesLoading ? (
            <p className="text-gray-400 text-sm p-4">Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    {['Title', 'Category', 'Reporter', 'Status', 'Priority', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {issuesData?.issues?.map((issue) => (
                    <tr key={issue._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-[180px] truncate">{issue.title}</td>
                      <td className="px-4 py-3 text-gray-500 capitalize">{issue.category}</td>
                      <td className="px-4 py-3 text-gray-500">{issue.reportedBy?.username}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[issue.status]}`}>
                          {issue.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="text-xs border rounded px-1 py-0.5"
                          value={issue.priority}
                          onChange={(e) => updateIssue({ variables: { id: issue._id, priority: e.target.value } }).then(refetch)}
                        >
                          {['low', 'medium', 'high'].map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {issue.status !== 'in_progress' && issue.status !== 'resolved' && (
                            <button
                              onClick={() => handleStatus(issue._id, 'in_progress')}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Start
                            </button>
                          )}
                          {issue.status !== 'resolved' && (
                            <button
                              onClick={() => handleResolve(issue._id)}
                              className="text-xs text-green-600 hover:underline"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
