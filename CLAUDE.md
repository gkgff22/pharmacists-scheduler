# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run lint` - Run ESLint to check code quality

## Architecture Overview

This is a Next.js 15 application for scheduling pharmacists, built with TypeScript and Tailwind CSS. The application uses React 19 with client-side state management.

### Key Components Structure

**Core Application (`src/app/page.tsx`)**
- Main application logic with scheduling state management
- Handles shift editing, pharmacist name editing, and note management
- Implements validation rules and violation checking
- Provides calendar export (.ics) and image export functionality

**Schedule Management (`src/components/schedule/ScheduleTable.tsx`)**
- Primary UI component for displaying the monthly schedule table
- Handles user interactions for editing shifts and pharmacist names
- Integrates with utility functions for date and shift calculations

**UI Components (`src/components/ui/`)**
- `PharmacistNameEditor.tsx` - Inline editing for pharmacist names
- `ShiftEditor.tsx` - Shift selection interface for each pharmacist/date cell

**Type Definitions (`src/types/schedule.ts`)**
- `Shift` - Union type for shift periods: '早' | '午' | '晚' | '加'
- `Schedule` - Nested structure mapping dates to pharmacists to their shifts
- `RequiredShifts` - Interface defining required staffing per shift period
- `PharmacistStats` - Statistics tracking for workload balancing

**Utility Functions (`src/utils/scheduleUtils.ts`)**
- Date manipulation utilities for monthly calendar operations
- Shift requirement calculation based on day of week
- Statistics calculation for workload balancing
- Business logic for scheduling rules and constraints

### Business Logic

The application implements specific scheduling rules:
- Sundays are rest days (公休)
- Mondays have special constraints (max 2 shifts per person)
- Different shift requirements for weekdays vs weekends
- Automatic violation detection for staffing imbalances
- Statistical tracking to ensure fair distribution of workload

### Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Build Tool**: Turbopack (development)
- **Linting**: ESLint with Next.js config

### Data Flow

State is managed at the root level (`page.tsx`) and passed down through props. The application maintains:
- Current month view
- Pharmacist list (editable)
- Schedule data (date -> pharmacist -> shifts mapping)
- Notes per date
- Validation violations
- Statistics display toggle

All modifications flow back up through callback props to maintain single source of truth.