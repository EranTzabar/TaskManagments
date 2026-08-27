# Import Tasks JSON Format

Use this JSON structure to import tasks into Tasks Tracker. Import requires an **admin** login session.

Imported tasks are **added** to the board. Each task receives the next available `taskId` automatically.

## Root structure

```json
{
  "tasks": [
    {
      "title": "Task title",
      "priority": "קריטי",
      "details": "Full task description",
      "status": "ממתין להתחלה",
      "notes": ""
    }
  ]
}
```

## Fields

| Field | Required | Type | Values / notes |
|-------|----------|------|----------------|
| `title` | Yes | string | Task name |
| `priority` | Yes | string | `קריטי`, `גבוה`, `בינוני`, or `נמוך` |
| `details` | Yes | string | Full task description |
| `status` | No | string | `ממתין להתחלה`, `בטיפול`, or `הושלם`. Default: `ממתין להתחלה` |
| `notes` | No | string | Personal notes. Default: empty string |
| `subtasks` | No | array | Nested subtasks (one level only). Same fields as a task, without nested `subtasks` |

## Subtasks

Top-level tasks may include a `subtasks` array. Each subtask is a full task linked to its parent. Parent status is automatically derived from subtask statuses after import.

```json
{
  "tasks": [
    {
      "title": "משימה ראשית",
      "priority": "גבוה",
      "details": "תיאור המשימה הראשית",
      "subtasks": [
        {
          "title": "תת-משימה 1",
          "priority": "בינוני",
          "details": "פירוט תת-משימה",
          "status": "ממתין להתחלה"
        }
      ]
    }
  ]
}
```

- Only **one level** of nesting is allowed (subtasks cannot contain their own `subtasks`)
- Parent `taskId` is assigned first, then each subtask receives the next available ID
- If subtasks are included, the parent status is rolled up after import

## Example file

```json
{
  "tasks": [
    {
      "title": "שיפור אחוזי ההצלחה",
      "priority": "קריטי",
      "details": "השגת שיעור הצלחה של 95%+",
      "status": "בטיפול",
      "notes": ""
    },
    {
      "title": "עדכון תיעוד",
      "priority": "בינוני",
      "details": "לעדכן את מסמכי העבודה"
    }
  ]
}
```

## API request (admin only)

When importing from the UI while logged in as admin, the app sends:

```json
{
  "tasks": [ ... ]
}
```

Authentication is via the httpOnly JWT cookie set at login.

Endpoint: `POST /api/tasks/import`

## Validation rules

- `tasks` must be a non-empty array
- Each task must have non-empty `title` and `details`
- Invalid `priority` or `status` values are rejected
- Nested subtasks inside subtasks are rejected
- Non-admin users receive `403 Forbidden`
