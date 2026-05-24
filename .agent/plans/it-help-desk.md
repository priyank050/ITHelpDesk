# IT Help Desk Application

A modern IT support ticket management system for tracking, assigning, and resolving IT issues across an organization.

## Overview

Employees submit IT support tickets, IT staff manage and resolve them, and admins oversee the entire system. The app tracks SLAs, enables collaboration through comments, and provides dashboards for visibility.

## Roles

- **Employee**: Submit tickets, track their own tickets, add comments
- **IT Support**: View assigned tickets, update status, resolve issues, add internal notes
- **Admin**: Full access to all tickets, assign tickets, manage priorities, view analytics

## Pages

1. **Dashboard** — Ticket counts by status/priority, overdue SLA alerts, quick stats
2. **Create Ticket** — Form with title, description, category, priority, attachments
3. **My Tickets** — Employee view of their submitted tickets with filters
4. **All Tickets** — Admin/IT view with search, filters, bulk actions
5. **Ticket Details** — Full ticket view with status updates, comments, history, assignment

## Features

- Create, edit, and track support tickets
- Filter by status (Open, In Progress, Resolved, Closed), priority, category, assignee
- Search across ticket title and description
- Assign tickets to IT staff members
- Comment system for ticket collaboration
- SLA tracking with visual indicators (overdue = red highlight)
- File attachments on tickets
- Ticket history/audit trail
- Role-based views (employees see only their tickets, IT/Admin see all)

## Data Entities

- **Ticket** — Core ticket record with all fields (ID, title, description, priority, category, status, dates, assignee, creator)
- **Comment** — Linked to tickets for threaded discussion
- **Attachment** — File references linked to tickets

## Design Direction

- **Aesthetic**: Clean, professional, enterprise-grade with a tech/IT feel
- **Color coding**: 
  - Critical = Red
  - High = Orange  
  - Medium = Yellow/Amber
  - Low = Green
- **Status indicators**: Visual badges with distinct colors per status
- **SLA alerts**: Overdue tickets highlighted prominently
- **Layout**: Card-based ticket displays, data tables for list views, responsive design
