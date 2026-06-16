#!/usr/bin/env python3
from string import Formatter

from backlog_tool.resolver import (
    category_options,
    find_option,
    issue_type_options,
    resolve_custom_field_defaults,
    status_options,
)
from backlog_tool.settings import load_project_catalog, load_workflow_config, project_keys
from .resolve_policy import (
    ALWAYS_OVERWRITE_FIELDS,
    GUIDED_FIELDS,
    ONLY_WHEN_EMPTY_FIELDS,
    WORKFLOW_MANAGED_FIELDS,
)
from .ut_bug import merge_bug_defaults


REQUIRED_KEYS = {
    "resolve_bug": {
        "issue_type",
        "excluded_statuses",
        "status",
        "assignee",
        "estimated_hours",
        "actual_hours",
        "due_in_days",
        "qc_activity",
        "cause_category",
        "bug_origin",
        "impacted",
        "resolution",
        "corrective_action",
    },
    "story_task_overview": {
        "issue_types",
        "excluded_statuses",
        "assignee",
        "fields",
    },
    "ut_bug": {
        "issue_type",
        "status",
        "estimated_hours",
        "actual_hours",
        "due_in_days",
        "corrective_action",
        "description_template",
        "custom_fields",
    },
}

STORY_OUTPUT_FIELDS = {
    "issueKey",
    "summary",
    "description",
    "status",
    "dueDate",
    "daysUntilDue",
    "dueAlertLevel",
}

CORRECTIVE_ACTION_PLACEHOLDERS = {"description", "description_lower"}


def template_fields(template):
    return {
        field_name
        for _literal, field_name, _format_spec, _conversion in Formatter().parse(template)
        if field_name
    }


def audit_workflows(config):
    checks = []
    errors = []
    workflows = {
        name: load_workflow_config(name)
        for name in REQUIRED_KEYS
    }

    for name, required_keys in REQUIRED_KEYS.items():
        missing = sorted(required_keys - set(workflows[name]))
        checks.append(f"{name}: required keys")
        if missing:
            errors.append(f"{name} missing required keys: {', '.join(missing)}")

    resolve_workflow = workflows["resolve_bug"]
    field_groups = set(ALWAYS_OVERWRITE_FIELDS) | set(ONLY_WHEN_EMPTY_FIELDS)
    checks.append("resolve_bug: policy field groups")
    if not set(GUIDED_FIELDS).issubset(ONLY_WHEN_EMPTY_FIELDS):
        errors.append("resolve_bug guided fields must be only-when-empty fields")
    if set(WORKFLOW_MANAGED_FIELDS) != set(ALWAYS_OVERWRITE_FIELDS) | {"resolution"}:
        errors.append("resolve_bug workflow-managed fields do not match execution policy")
    missing_field_defaults = sorted(field_groups - set(resolve_workflow))
    if missing_field_defaults:
        errors.append(
            "resolve_bug missing policy field defaults: "
            + ", ".join(missing_field_defaults)
        )

    for workflow_name in ("resolve_bug", "ut_bug"):
        workflow = workflows[workflow_name]
        placeholders = template_fields(workflow["corrective_action"])
        checks.append(f"{workflow_name}: corrective-action template")
        unknown = sorted(placeholders - CORRECTIVE_ACTION_PLACEHOLDERS)
        if unknown:
            errors.append(
                f"{workflow_name} corrective_action has unsupported placeholders: "
                + ", ".join(unknown)
            )

    story_fields = set(workflows["story_task_overview"]["fields"])
    checks.append("story_task_overview: output fields")
    unknown_story_fields = sorted(story_fields - STORY_OUTPUT_FIELDS)
    if unknown_story_fields:
        errors.append(
            "story_task_overview has unsupported fields: "
            + ", ".join(unknown_story_fields)
        )

    for project_key in project_keys(config):
        project = load_project_catalog(project_key)
        checks.append(f"{project_key}: resolve_bug catalog compatibility")
        try:
            project_fields = project.get("bug", {}).get("custom_fields", {})
            required_resolve_fields = (
                set(ALWAYS_OVERWRITE_FIELDS)
                | set(GUIDED_FIELDS)
            )
            missing_resolve_fields = sorted(
                required_resolve_fields - set(project_fields)
            )
            if missing_resolve_fields:
                raise ValueError(
                    "missing required custom fields: "
                    + ", ".join(missing_resolve_fields)
                )
            find_option(
                issue_type_options(project),
                resolve_workflow["issue_type"],
                "issue type",
            )
            find_option(
                status_options(project),
                resolve_workflow["status"],
                "status",
            )
            resolve_custom_field_defaults(
                project,
                {
                    field_key: resolve_workflow[field_key]
                    for field_key in field_groups
                    if field_key != "resolution" or field_key in project_fields
                },
            )
        except ValueError as error:
            errors.append(f"{project_key} resolve_bug: {error}")

        checks.append(f"{project_key}: ut_bug catalog compatibility")
        try:
            ut_defaults = merge_bug_defaults(config, project_key)
            find_option(
                issue_type_options(project),
                ut_defaults["issue_type"],
                "issue type",
            )
            find_option(
                status_options(project),
                ut_defaults["status"],
                "status",
            )
            if ut_defaults.get("category"):
                find_option(
                    category_options(project),
                    ut_defaults["category"],
                    "category",
                )
            resolve_custom_field_defaults(
                project,
                ut_defaults["custom_fields"],
            )
        except ValueError as error:
            errors.append(f"{project_key} ut_bug: {error}")

    if errors:
        raise ValueError("Workflow audit failed: " + " | ".join(errors))
    return {
        "ok": True,
        "checks": checks,
        "workflowCount": len(workflows),
        "projectCount": len(project_keys(config)),
    }
