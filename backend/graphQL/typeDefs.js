import { gql } from 'apollo-server-express';

export const typeDefs = gql`
    enum Role {
        resident
        staff
        advocate
    }

    enum IssueCategory {
        pothole
        streetlight
        flooding
        safety
        other
    }

    enum IssueStatus {
        reported
        in_progress
        resolved
        closed
    }

    enum IssuePriority {
        low
        medium
        high
    }

    type User {
        _id: ID!
        username: String!
        email: String!
        role: Role!
        createdAt: String!
    }

    type Location {
        type: String!
        coordinates: [Float!]!
        address: String!
    }

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

    type CategoryCount {
        category: IssueCategory!
        count: Int!
    }

    type IssueSummary {
        totalOpen: Int!
        totalResolved: Int!
        highPriority: Int!
        byCategory: [CategoryCount!]!
    }

    type AuthPayload {
        accessToken: String!
        user: User!
    }

    input LocationInput {
        type: String!
        coordinates: [Float!]!
        address: String!
    }

    input ReportIssueInput {
        title: String!
        description: String!
        category: IssueCategory!
        priority: IssuePriority = medium
        location: LocationInput!
    }

    type Query {
        me: User
        issue(id: ID!): Issue
        issues(status: IssueStatus, category: IssueCategory, reporterId: ID): [Issue!]!
        dashboardSummary: IssueSummary!
        searchIssues(text: String!): [Issue!]!
        aiSummary(issueId: ID!): String!
        trendInsights: [CategoryCount!]!
        agentAnswer(question: String!): String!
    }

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
        assignIssue(id: ID!, assignedTo: ID!): Issue!
        resolveIssue(id: ID!): Issue!
        googleSignIn(token: String!): AuthPayload!
    }
`