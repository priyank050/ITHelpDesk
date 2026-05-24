# IT Help Desk

A modern IT support ticket management system for tracking, assigning, and resolving IT issues across an organization.

## Overview

Employees submit IT support tickets when they encounter technical issues. IT Support staff manage and resolve these tickets while tracking SLAs. Administrators oversee the entire system with full visibility and control.

## Roles

### Employee
- Submit new support tickets with descriptions, categories, and priorities
- Track the status of their own submitted tickets
- Add comments for additional context or follow-up questions
- Attach files to support their requests

### IT Support
- View and work on assigned tickets
- Update ticket status as work progresses
- Add internal notes and comments
- Resolve and close tickets

### Admin
- Full access to all tickets in the system
- Assign tickets to IT support staff
- Manage ticket priorities and escalations
- View dashboard analytics and SLA compliance

## Key Scenarios

1. **Employee submits a ticket**: Employee experiences a software crash, creates a ticket with description and screenshots, selects "Software" category and "High" priority

2. **IT Support resolves a ticket**: Support agent sees assigned ticket, investigates the issue, adds progress comments, changes status to "In Progress" then "Resolved"

3. **Admin monitors SLA compliance**: Admin views dashboard showing overdue tickets highlighted in red, reassigns tickets from overloaded agents, escalates critical issues

4. **Collaboration on complex issues**: Multiple team members add comments to a ticket, share findings, and coordinate resolution

## Design Direction

- **Aesthetic**: Clean, professional enterprise interface with a technical/IT feel
- **Typography**: Modern sans-serif with clear hierarchy
- **Priority Color Coding**:
  - Critical: Red (#EF4444)
  - High: Orange (#F97316)
  - Medium: Amber (#F59E0B)
  - Low: Green (#22C55E)
- **Layout**: Card-based ticket displays, data tables for list views, responsive sidebar navigation
- **SLA Indicators**: Overdue tickets prominently highlighted with red borders/badges
