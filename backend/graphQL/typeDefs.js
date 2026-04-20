/**
 * typeDefs.js - GraphQL Schema Definition
 * Defines all types, enums, queries, and mutations for the Civic Issue Tracker API.
 *
 * Enums:   Role, IssueCategory, IssueStatus, IssuePriority
 * Types:   User, Issue, Location, CategoryCount, IssueSummary, AuthPayload
 * Inputs:  LocationInput, ReportIssueInput
 * Queries: me, issue, issues, dashboardSummary, searchIssues, aiSummary, trendInsights, agentAnswer
 * Mutations: signUp, login, reportIssue, updateIssue, assignIssue, resolveIssue, googleSignIn, githubSignIn
 */
import { gql } from 'graphql-tag';

export const typeDefs = gql`
    # --- Enums ---

    # User roles controlling access to staff/advocate features
    enum Role {
        resident
        staff
        advocate
    }

    # Civic issue categories for classification
    enum IssueCategory {
        pothole
        streetlight
        flooding
        safety
        other
    }

    # Lifecycle states of a reported issue
    enum IssueStatus {
        reported
        in_progress
        resolved
        closed
    }

    # Urgency levels for issue triage
    enum IssuePriority {
        low
        medium
        high
    }

    # --- Types ---

    # Authenticated user profile
    type User {
        _id: ID!
        username: String!
        email: String!
        role: Role!
        createdAt: String!
    }

    # GeoJSON Point location with human-readable address
    type Location {
        type: String!
        coordinates: [Float!]!  # [longitude, latitude]
        address: String!
    }

    # A civic issue report
    type Issue {
        _id: ID!
        title: String!
        description: String!
        category: IssueCategory!
        location: Location!
        status: IssueStatus!
        priority: IssuePriority!
        createdAt: String!
        updatedAt: String!
        reportedBy: User
        assignedTo: User
    }

    # Issue count grouped by category (used in dashboard)
    type CategoryCount {
        category: IssueCategory!
        count: Int!
    }

    # Dashboard summary metrics
    type IssueSummary {
        totalOpen: Int!
        totalResolved: Int!
        highPriority: Int!
        byCategory: [CategoryCount!]!
    }

    # Returned by all auth mutations
    type AuthPayload {
        accessToken: String!  # JWT token (7-day expiry)
        user: User!
    }

    # --- Inputs ---

    # GeoJSON Point input for issue location
    input LocationInput {
        type: String!           # Must be "Point"
        coordinates: [Float!]!  # [longitude, latitude]
        address: String!
    }

    # Fields required to submit a new issue report
    input ReportIssueInput {
        title: String!
        description: String!
        category: IssueCategory!
        priority: IssuePriority = medium
        location: LocationInput!
    }

    # --- Queries ---
    type Query {
        me: User                                                              # Current authenticated user
        issue(id: ID!): Issue                                                 # Single issue by ID
        issues(status: IssueStatus, category: IssueCategory, reporterId: ID): [Issue!]!  # Filtered issue list
        dashboardSummary: IssueSummary!                                       # Staff dashboard metrics
        searchIssues(text: String!): [Issue!]!                                # Full-text search
        aiSummary(issueId: ID!): String!                                      # AI-generated issue summary
        trendInsights: [CategoryCount!]!                                      # Category trend data
        agentAnswer(question: String!): String!                               # AI chatbot response
    }

    # --- Mutations ---
    type Mutation {
        signUp(username: String!, email: String!, password: String!, role: Role = resident): AuthPayload!
        login(email: String!, password: String!): AuthPayload!
        reportIssue(input: ReportIssueInput!): Issue!
        updateIssue(
            id: ID!
            status: IssueStatus
            priority: IssuePriority
            category: IssueCategory
            assignedTo: ID
            title: String
            description: String
        ): Issue!
        assignIssue(id: ID!, assignedTo: ID!): Issue!   # Assign issue to staff member
        resolveIssue(id: ID!): Issue!                   # Mark issue as resolved
        googleSignIn(token: String!): AuthPayload!      # Google OAuth sign-in
        githubSignIn(code: String!): AuthPayload!       # GitHub OAuth sign-in
    }
`