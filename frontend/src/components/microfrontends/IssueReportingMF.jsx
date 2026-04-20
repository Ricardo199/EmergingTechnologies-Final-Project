import { useState } from 'react';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { useNotification } from '../../context/NotificationContext';
import { INPUT_CLASS, LABEL_CLASS, BUTTON_PRIMARY, SELECT_CLASS } from '../../styles/formInputs';
import { STATUS_COLORS, PRIORITY_COLORS } from '../../styles/colors';

/**
 * IssueReportingMF - Issue Reporting Micro-Frontend
 * Allows residents to report community issues and view existing reports
 * 
 * Features:
 * - View all reported issues with filtering by status
 * - Report new issues with photo, location, category, and priority
 * - Geolocation support for automatic location detection
 * - Real-time notifications for submission feedback
 * - Tabbed interface: view issues vs. report new issue
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.user - Current authenticated user
 * @returns {JSX.Element} Issue reporting interface
 */

// GraphQL query: Fetch issues, optionally filtered by status
// Returns issue details including location, category, priority, and reporter
const GET_ISSUES = gql`
  query Issues($status: IssueStatus) {
    issues(status: $status) {
      _id title category status priority createdAt
      location { address }
      reportedBy { username }
    }
  }
`;

// GraphQL mutation: Submit a new issue report
// Accepts location (Point geometry), category, priority, title, description
// Returns created issue with ID and confirmation status
const REPORT_ISSUE = gql`
  mutation ReportIssue($input: ReportIssueInput!) {
    reportIssue(input: $input) {
      _id title status
    }
  }
`;

/**
 * Default form state
 * Used to clear form after successful submission
 */
const BLANK = {
  title: '', 
  description: '', 
  category: 'other', 
  priority: 'medium',
  address: '', 
  lat: '', 
  lng: '', 
  photo: null, 
  photoPreview: null,
};

export default function IssueReportingMF({ user }) {
  // Current active tab: 'list' to view issues, 'report' to submit new
  const [tab, setTab] = useState('list');
  
  // Form state for issue reporting
  const [form, setForm] = useState(BLANK);
  
  // Status filter for issue list ('reported', 'in_progress', 'resolved', 'closed', or '' for all)
  const [statusFilter, setStatusFilter] = useState('');
  
  // Error and success messages
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Notification system for user feedback
  const { showNotification } = useNotification();

  // GraphQL query with optional status filter
  // Refetch can be called after submission to refresh list
  const { data, loading, refetch } = useQuery(GET_ISSUES, {
    variables: statusFilter ? { status: statusFilter } : {},
  });

  // Mutation for submitting new issue
  const [reportIssue, { loading: submitting }] = useMutation(REPORT_ISSUE);

  /**
   * Form field setter factory
   * Creates closures to handle multiple form fields
   * @param {string} k - Form field key
   * @returns {Function} Event handler for input changes
   */
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  /**
   * Handle photo file selection
   * Reads file as data URL for preview display
   * @param {Event} e - File input change event
   */
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((f) => ({
          ...f,
          photo: file,
          photoPreview: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Clear selected photo from form
   */
  const clearPhoto = () => {
    setForm((f) => ({ ...f, photo: null, photoPreview: null }));
  };

  /**
   * Request geolocation from browser
   * Automatically populates lat/lng fields with current position
   */
  const geoLocate = () => {
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      setForm((f) => ({ ...f, lat: coords.latitude.toString(), lng: coords.longitude.toString() }));
    });
  };

  /**
   * Handle issue submission
   * Validates form, submits to GraphQL API, refreshes issue list, notifies user
   * @param {Event} e - Form submit event
   */
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
      showNotification('Issue reported successfully!', 'success', 3000);
      setForm(BLANK);
      refetch();
      setTimeout(() => setTab('list'), 1500);
    } catch (err) {
      setError(err.message);
      showNotification(err.message, 'error');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Tab navigation */}
      <div role="tablist" aria-label="Issue sections" className="flex gap-4 mb-6 border-b pb-3">
        {['list', 'report'].map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            aria-controls={`panel-${t}`}
            id={`tab-${t}`}
            onClick={() => setTab(t)}
            className={`text-sm font-medium pb-1 border-b-2 transition-colors ${
              tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'list' ? 'My Issues' : 'Report Issue'}
          </button>
        ))}
      </div>

      {/* Issue list tab */}
      <div
        id="panel-list"
        role="tabpanel"
        aria-labelledby="tab-list"
        hidden={tab !== 'list'}
      >
        {/* Status filter buttons */}
        <div role="group" aria-label="Filter by status" className="flex gap-2 mb-4 flex-wrap">
          {['', 'reported', 'in_progress', 'resolved', 'closed'].map((s) => (
            <button
              key={s}
              aria-pressed={statusFilter === s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border ${
                statusFilter === s ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:border-indigo-400'
              }`}
            >
              {s ? s.replace('_', ' ') : 'All'}
            </button>
          ))}
        </div>
        
        {/* Issue list display */}
        {loading ? (
          <p className="text-gray-400 text-sm" aria-live="polite">Loading...</p>
        ) : data?.issues?.length === 0 ? (
          <p className="text-gray-400 text-sm">No issues found.</p>
        ) : (
          <ul className="space-y-3" aria-label="Issue list">
            {data?.issues?.map((issue) => (
              <li key={issue._id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {/* Issue title and metadata */}
                    <p className="font-medium text-gray-900 text-sm">{issue.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{issue.location.address} · {issue.category}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      by {issue.reportedBy?.username} · <time dateTime={issue.createdAt}>{new Date(issue.createdAt).toLocaleDateString()}</time>
                    </p>
                  </div>
                  
                  {/* Status and priority badges */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[issue.status]}`}>
                      {issue.status.replace('_', ' ')}
                    </span>
                    <span className={`text-xs font-medium ${PRIORITY_COLORS[issue.priority]}`} aria-label={`Priority: ${issue.priority}`}>
                      {issue.priority}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Issue reporting form tab */}
      <div
        id="panel-report"
        role="tabpanel"
        aria-labelledby="tab-report"
        hidden={tab !== 'report'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg" noValidate aria-describedby={error ? 'report-error' : undefined}>
          {/* Title input */}
          <div>
            <label htmlFor="issue-title" className={LABEL_CLASS}>Title</label>
            <input
              id="issue-title"
              className={INPUT_CLASS}
              placeholder="Brief title of the issue"
              value={form.title}
              onChange={set('title')}
              required
            />
          </div>
          
          {/* Description textarea */}
          <div>
            <label htmlFor="issue-description" className={LABEL_CLASS}>Description</label>
            <textarea
              id="issue-description"
              className={INPUT_CLASS}
              placeholder="Describe the issue in detail"
              rows={3}
              value={form.description}
              onChange={set('description')}
              required
            />
          </div>
          
          {/* Category and priority selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="issue-category" className={LABEL_CLASS}>Category</label>
              <select
                id="issue-category"
                className={SELECT_CLASS}
                value={form.category}
                onChange={set('category')}
              >
                {['pothole', 'streetlight', 'flooding', 'safety', 'other'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="issue-priority" className={LABEL_CLASS}>Priority</label>
              <select
                id="issue-priority"
                className={SELECT_CLASS}
                value={form.priority}
                onChange={set('priority')}
              >
                {['low', 'medium', 'high'].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Address input with geolocation button */}
          <div>
            <label htmlFor="issue-address" className={LABEL_CLASS}>Address</label>
            <div className="flex gap-2">
              <input
                id="issue-address"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                placeholder="Street address or location"
                value={form.address}
                onChange={set('address')}
                required
              />
            </div>
          </div>
          
          {/* Detected coordinates display */}
          {(form.lat || form.lng) && (
            <p className="text-xs text-gray-400" aria-live="polite">
              Location detected: {form.lat}, {form.lng}
            </p>
          )}
          
          {/* Photo upload with preview */}
          <div>
            <label htmlFor="issue-photo" className={LABEL_CLASS}>Photo (Optional)</label>
            <input
              id="issue-photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-medium
                file:bg-indigo-50 file:text-indigo-600
                hover:file:bg-indigo-100"
              aria-describedby={form.photoPreview ? 'photo-preview' : undefined}
            />
            {form.photoPreview && (
              <div id="photo-preview" className="mt-3 relative inline-block">
                <img
                  src={form.photoPreview}
                  alt="Preview of selected issue photo"
                  className="h-24 w-24 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={clearPhoto}
                  aria-label="Remove selected photo"
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}
          </div>
          
          {/* Error and success messages */}
          <div aria-live="polite" aria-atomic="true">
            {error && <p id="report-error" role="alert" className="text-red-600 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm">{success}</p>}
          </div>
          
          {/* Submit button */}
          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Issue'}
          </button>
        </form>
      </div>
    </div>
  );
}
