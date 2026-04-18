import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';

const GET_ISSUES = gql`
  query Issues($status: IssueStatus) {
    issues(status: $status) {
      _id title category status priority createdAt
      location { address }
      reportedBy { username }
    }
  }
`;

const REPORT_ISSUE = gql`
  mutation ReportIssue($input: ReportIssueInput!) {
    reportIssue(input: $input) {
      _id title status
    }
  }
`;

const STATUS_COLORS = {
  reported: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

const PRIORITY_COLORS = {
  low: 'text-gray-500',
  medium: 'text-yellow-600',
  high: 'text-red-600',
};

const BLANK = {
  title: '', description: '', category: 'other', priority: 'medium',
  address: '', lat: '', lng: '',
};

export default function IssueReportingMF({ user }) {
  const [tab, setTab] = useState('list');
  const [form, setForm] = useState(BLANK);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data, loading, refetch } = useQuery(GET_ISSUES, {
    variables: statusFilter ? { status: statusFilter } : {},
  });

  const [reportIssue, { loading: submitting }] = useMutation(REPORT_ISSUE);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const geoLocate = () => {
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      setForm((f) => ({ ...f, lat: coords.latitude.toString(), lng: coords.longitude.toString() }));
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await reportIssue({
        variables: {
          input: {
            title: form.title,
            description: form.description,
            category: form.category,
            priority: form.priority,
            location: {
              type: 'Point',
              coordinates: [parseFloat(form.lng) || 0, parseFloat(form.lat) || 0],
              address: form.address,
            },
          },
        },
      });
      setSuccess('Issue reported successfully!');
      setForm(BLANK);
      refetch();
      setTimeout(() => setTab('list'), 1500);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex gap-4 mb-6 border-b pb-3">
        {['list', 'report'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-sm font-medium pb-1 border-b-2 transition-colors ${
              tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'list' ? 'My Issues' : 'Report Issue'}
          </button>
        ))}
      </div>

      {tab === 'list' && (
        <div>
          <div className="flex gap-2 mb-4 flex-wrap">
            {['', 'reported', 'in_progress', 'resolved', 'closed'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  statusFilter === s ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:border-indigo-400'
                }`}
              >
                {s || 'All'}
              </button>
            ))}
          </div>
          {loading ? (
            <p className="text-gray-400 text-sm">Loading...</p>
          ) : data?.issues?.length === 0 ? (
            <p className="text-gray-400 text-sm">No issues found.</p>
          ) : (
            <ul className="space-y-3">
              {data?.issues?.map((issue) => (
                <li key={issue._id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{issue.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{issue.location.address} · {issue.category}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        by {issue.reportedBy?.username} · {new Date(issue.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[issue.status]}`}>
                        {issue.status.replace('_', ' ')}
                      </span>
                      <span className={`text-xs font-medium ${PRIORITY_COLORS[issue.priority]}`}>
                        {issue.priority}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'report' && (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Title"
            value={form.title}
            onChange={set('title')}
            required
          />
          <textarea
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Description"
            rows={3}
            value={form.description}
            onChange={set('description')}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.category}
              onChange={set('category')}
            >
              {['pothole', 'streetlight', 'flooding', 'safety', 'other'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.priority}
              onChange={set('priority')}
            >
              {['low', 'medium', 'high'].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Address"
              value={form.address}
              onChange={set('address')}
              required
            />
            <button type="button" onClick={geoLocate} className="px-3 py-2 border rounded-lg text-sm text-indigo-600 hover:bg-indigo-50">
              📍
            </button>
          </div>
          {(form.lat || form.lng) && (
            <p className="text-xs text-gray-400">Coords: {form.lat}, {form.lng}</p>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Issue'}
          </button>
        </form>
      )}
    </div>
  );
}
