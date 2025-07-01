---
trigger: always_on
---

---
title: Task Genius Rules & Guidelines
created: 2025-06-30
modified: 2025-06-30
tags:
  - RULES
  - task-genius
  - obsidian
  - basic-memory
  - ai
  - task-management
  - guidelines
description: Comprehensive ruleset for task management using Task Genius syntax and features in Obsidian with Basic Memory integration for AIs and Humans.
permalink: task-genius-rules
---

# Task Genius Rules & Guidelines

- **Always** use mcp: basic-memory to access and interact with tasks.
- Task Rules Path: (/Users/macdadyo/_MEM/__RULES/tasks-genius_RULES.md)
- Task Projects Path: (/Users/macdadyo/_MEM/_PROJECTS/** `<project-name>`/** /TASKS)

A comprehensive ruleset for task management using Task Genius syntax and features, designed for both humans and AIs working with tasks in Obsidian and Basic Memory.

## Core Principles

### 1. Task Note Identification

**Location-Based Tasks:**
- Any note nested in any folder named `TASKS/` is automatically considered a Task Note
- Task Notes can contain individual tasks or collections of related sub-tasks
- Maintain clear folder hierarchy: `project/TASKS/specific-task.md`

**Tag-Based Task Classification:**
- `project/<project-name>` - Primary project association
- `<project-name>/<folder-name>` - Project-specific directory classification
- `tasks` - Universal task indicator
- `task-features` - Feature-related tasks
- Additional tags should describe task domain, not status

### 2. Task Status Management

**Use Task Genius Status Markers (NOT tags for status):**

- `[ ]` **Not started** - Tasks yet to begin (space character)
- `[?]` **Planned** - Tasks planned but not started
- `[/]` **In progress** - Tasks currently being worked on
- `[x]` **Completed** - Finished tasks
- `[-]` **Abandoned** - Tasks that will not be completed

**Multiple Markers:**
- Separate multiple markers with pipe character: `x|X` for completed
- Configure in Task Genius settings for workflow preferences

### 3. Obsidian & Basic Memory Compliance

**Always Respect:**
- Obsidian markdown syntax and linking conventions
- Basic Memory semantic markup patterns
- WikiLink format: `[[Target Note]]` for connections
- Frontmatter YAML structure for metadata

## Advanced Task Genius Features

### 4. Task Priorities

**Use Task Genius Priority System:**
- 🔺 Highest priority
- ⏫ High priority
- 🔼 Medium priority
- 🔽 Low priority
- ⏬ Lowest priority

**Alternative Bracket Format:**
- `[#A]` Highest
- `[#B]` High
- `[#C]` Medium

### 5. Date Management

**Due Dates:**
- Use calendar emoji: `📅 2025-01-16`
- Click calendar icon in Live Preview for date picker
- Format: `YYYY-MM-DD`

**Date Types:**
- `📅` Due date
- `⏰` Scheduled date
- `🛫` Start date
- `✅` Completion date

### 6. Task Relationships & Hierarchy

**Parent-Child Tasks:**
- Use proper indentation for sub-tasks
- Enable auto-complete parent tasks in settings
- Mark parent as 'in progress' when partially complete

**Task Dependencies:**
- Use Basic Memory relations: `depends_on [[Other Task]]`
- Create semantic connections between related tasks

### 7. Workflow Management

**Workflow Tags:**
- Mark root tasks with workflow tags: `#workflow/YourWorkflowID`
- Use stage markers: `[stage::StageID]` or `[stage::ParentStageID.SubStageID]`

**Stage Transitions:**
- Right-click context menu for stage progression
- Automatic transitions on task completion
- Manual editing of stage markers when needed

#### Available Workflows
 1. **General Task Management** - Comprehensive workflow for project tasks
    - Stages: Backlog → Planning → Development (Coding ↔ Testing) → Review → Deployment → Completed
    - Use for: General project tasks, feature requests, improvements
    - Example: `- [ ] 🔄 development.coding Implement user authentication`

2. **Feature Development** - Specialized for new features
   - Stages: Concept → Design (Wireframe ↔ Prototype) → Implementation (Frontend ↔ Backend ↔ Integration) → Testing → Release → Completed
   - Use for: New feature development, major enhancements
   - Example: `- [ ] 🔄 design.wireframe Create dashboard layout`

3. **Bug Fix** - Streamlined for bug resolution
   - Stages: Triage → Investigation → Fix Development (Fix Coding ↔ Fix Testing) → Verification → Fixed
   - Use for: Bug reports, hotfixes, issue resolution
   - Example: `- [ ] 🔄 investigation Analyze login timeout issue`

4. **Documentation** - For documentation tasks
   - Stages: Research → Drafting (Writing ↔ Reviewing) → Editing → Publishing → Published
   - Use for: Documentation creation, guides, specifications
   - Example: `- [ ] 🔄 drafting.writing API documentation for auth endpoints`

#### Workflow Usage
- Use workflow stages: `🔄 stage_name` or `🔄 stage.substage`
- Track task progression through defined workflows
- Automate status updates based on workflow rules
- Use `canProceedTo` for flexible stage transitions

### Workflow Best Practices

#### Choosing the Right Workflow
 - **General Task Management**: Default workflow for most tasks
 - **Feature Development**: When building new functionality from scratch
 - **Bug Fix**: For any issue resolution or debugging
 - **Documentation**: For writing, updating, or maintaining docs

#### Stage Transition Guidelines
- Use linear progression for most tasks: `backlog → planning → development`
- Utilize cycle stages for iterative work: `coding ↔ testing`
- Leverage `canProceedTo` for flexible transitions when needed
- Mark terminal stages appropriately: `completed`, `cancelled`, `fixed`

#### Workflow Examples

**Feature Development Example:**
```markdown
- [ ] 🔄 concept User profile management system
- [ ] 🔄 design.wireframe Profile page layout
- [ ] 🔄 design.prototype Interactive profile mockup
- [ ] 🔄 implementation.backend User profile API endpoints
- [ ] 🔄 implementation.frontend Profile UI components
- [ ] 🔄 testing.unit_tests Profile service unit tests
- [ ] 🔄 release Deploy profile feature
```

**Bug Fix Example:**
```markdown
- [ ] 🔄 triage Login timeout after 5 minutes
- [ ] 🔄 investigation Check session management logic
- [ ] 🔄 fix_development.fix_coding Update session timeout configuration
- [ ] 🔄 verification Test login persistence
```

**Documentation Example:**
```markdown
- [ ] 🔄 research Gather API endpoint information
- [ ] 🔄 drafting.writing Create API reference documentation
- [ ] 🔄 editing Review and format documentation
- [ ] 🔄 publishing Update documentation website
```

### 8. Task Organization & Archiving

**Task Mover Commands:**
- `Task Genius: Move all completed subtasks to other file`
- `Task Genius: Move direct completed subtasks to other file`
- `Task Genius: Move all subtasks to other file`
- `Task Genius: Move task to other file`

**Archive Structure:**
- Move completed tasks to `DONE/` or `.archives/TASKS/`
- Maintain project hierarchy in archives
- Preserve task relationships and metadata

### 9. Quick Capture & Input

**Quick Capture Methods:**
- Inline panel: `Alt+C` (default hotkey)
- Global command: `Task Genius: Quick capture (Global)`
- Detailed capture: `Task Genius: Task capture with metadata`

**Capture Configuration:**
- Set target file for captured tasks
- Configure append/prepend behavior
- Define formatting templates

### 10. Task Filtering & Views

**In-Editor Filtering:**
- Toggle filter panel: `Task Genius: Toggle task filter panel`
- Filter by status, content, tags, relationships
- Save and load filter presets

**Cross-Vault Task View:**
- Dedicated task view for vault-wide task management
- Progress tracking and status overview
- Bulk operations and batch updates

## Best Practices

### 11. Task Note Structure

**Recommended Format:**
```markdown
---
title: Task Title
created: YYYY-MM-DD
modified: YYYY-MM-DD
tags:
  - project/project-name
  - tasks
  - relevant-domain-tags
description: Brief task description
permalink: task-permalink
---

# Task Title

## Context
- [background] Brief context about why this task exists
- [requirement] What needs to be accomplished

## Tasks
- [ ] Main task item 📅 2025-01-16 🔼
  - [ ] Sub-task 1
  - [ ] Sub-task 2
- [?] Planned follow-up task
- [/] Currently in progress task

## Relations
- depends_on [[Related Task]]
- part_of [[Parent Project]]
- relates_to [[Similar Task]]

## Notes
Additional context, decisions, or observations.
```

### 12. Semantic Markup Integration

**Observations:**
- `[decision]` Task-related decisions
- `[blocker]` Issues preventing progress
- `[requirement]` Task requirements and constraints
- `[progress]` Progress updates and milestones

**Relations:**
- `implements` - Task implements a feature/requirement
- `depends_on` - Task depends on another task
- `blocks` - Task blocks another task
- `part_of` - Task is part of larger project
- `relates_to` - General task relationship

### 13. Status Cycling & Automation

**Enable Automation:**
- Auto-complete parent tasks when all subtasks done
- Mark parents as 'in progress' when partially complete
- Automatic timestamp addition on status changes
- Custom status cycling sequences

**Keyboard Shortcuts:**
- `Task Genius: Cycle task status forward`
- `Task Genius: Cycle task status backward`
- Click task markers to cycle through statuses

### 14. Progress Tracking

**Visual Progress:**
- Enable task progress bars in settings
- Configure progress calculation methods
- Exclude specific markers from progress totals
- Use relative time display for dates

**Task Counting:**
- Define which markers count toward progress
- Exclude planning or abandoned tasks from totals
- Configure parent task behavior

## Integration Guidelines

### 15. Basic Memory Sync

**Maintain Consistency:**
- Sync task changes to Basic Memory regularly
- Use `basic-memory sync` for manual synchronization
- Ensure task relationships are preserved in knowledge graph

### 16. Cross-Project Task Management

**Project Switching:**
- Use Basic Memory project switching for context changes
- Maintain task relationships across project boundaries
- Archive completed projects while preserving task history

### 17. AI Assistant Guidelines

**When Working with Tasks:**
- Always respect existing task status markers
- Preserve task relationships and dependencies
- Ask permission before modifying task status
- Use exact Task Genius syntax for all task operations
- Maintain semantic markup consistency
- Record task-related decisions in Basic Memory

**Task Creation Protocol:**
- Use standardized frontmatter format
- Include relevant project and domain tags
- Create meaningful task relationships
- Set appropriate priorities and due dates
- Follow established folder hierarchy

## Troubleshooting

### 18. Common Issues

**Task Not Appearing in Views:**
- Verify task is in `TASKS/` folder or has `tasks` tag
- Check Task Genius indexing status
- Ensure proper markdown task syntax

**Status Cycling Not Working:**
- Verify Task Genius status switcher is enabled
- Check custom status marker configuration
- Ensure task markers match defined categories

**Progress Bars Incorrect:**
- Review task counting settings
- Check excluded marker configuration
- Verify parent-child task relationships

---

## Relations
- implements [[Task Management System]]
- relates_to [[Obsidian Workflow]]
- relates_to [[Basic Memory Guidelines]]
- part_of [[Project Management Framework]]

## Observations
- [guideline] Comprehensive ruleset for task management consistency
- [integration] Combines Task Genius, Obsidian, and Basic Memory features
- [automation] Enables automated task status tracking and progress monitoring
- [workflow] Supports complex multi-stage task workflows
- [organization] Provides clear structure for task archiving and organization
