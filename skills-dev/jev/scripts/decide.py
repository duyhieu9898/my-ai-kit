#!/usr/bin/env python3
"""Send one categorical decision request to Jev through the OpenRouter Decisions API.

Reads a request file (see references/runner.md), builds the API payload, makes a
single POST without retries, and prints a record with request and source hashes,
the full response, and usage. Standard library only.
"""
import argparse
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

DEFAULT_MODEL = "typesafe/jev-1.13"
DEFAULT_URL = "https://openrouter.ai/api/alpha/decisions"
# OpenRouter lists a 32k context; TypeSafe documents 32k for state plus the longest question.
MAX_PACKET_TOKENS = 32_000
CHARS_PER_TOKEN = 4

EXIT_API_ERROR = 1
EXIT_BAD_INPUT = 2
EXIT_TOO_LARGE = 3
EXIT_MODEL_MISMATCH = 4


class InputError(Exception):
    pass


def sha256(value) -> str:
    data = value if isinstance(value, bytes) else json.dumps(value, sort_keys=True, ensure_ascii=False).encode()
    return f"sha256:{hashlib.sha256(data).hexdigest()}"


def load_request(path: str) -> dict:
    text = sys.stdin.read() if path == "-" else Path(path).read_text(encoding="utf-8")
    try:
        request = json.loads(text)
    except json.JSONDecodeError as error:
        raise InputError(f"request is not valid JSON: {error}") from error
    if not isinstance(request, dict):
        raise InputError("request must be a JSON object")
    return request


def build_state(request: dict) -> dict:
    sources = request.get("sources") or []
    if "context" not in request and not sources:
        raise InputError("supply 'context', 'sources', or both")
    seen = set()
    for source in sources:
        source_id = source.get("id") if isinstance(source, dict) else None
        if not isinstance(source_id, str) or not source_id:
            raise InputError("every source needs a non-empty string 'id'")
        if source_id in seen:
            raise InputError(f"duplicate source id: {source_id}")
        if not isinstance(source.get("text"), str):
            raise InputError(f"source {source_id} needs a string 'text'")
        seen.add(source_id)
    state = {}
    if "context" in request:
        state["context"] = request["context"]
    if sources:
        state["sources"] = [
            {key: source[key] for key in ("id", "location", "text") if key in source} for source in sources
        ]
    return state


def build_questions(request: dict) -> dict:
    questions = request.get("questions")
    if not isinstance(questions, dict) or not questions:
        raise InputError("'questions' must be a non-empty object keyed by question id")
    sources = request.get("sources") or []
    built = {}
    for question_id, question in questions.items():
        if not isinstance(question, dict) or not isinstance(question.get("instructions"), str):
            raise InputError(f"question {question_id} needs string 'instructions'")
        choices = question.get("choices")
        if choices == "sources":
            # Source IDs as choices: describe each by its location so the model can tell them apart.
            choices = {s["id"]: s.get("location") or f"source {s['id']}" for s in sources}
            choices.update(question.get("extra_choices") or {})
        if not isinstance(choices, dict) or len(choices) < 2:
            raise InputError(f"question {question_id} needs at least two named 'choices'")
        if not all(isinstance(k, str) and isinstance(v, str) for k, v in choices.items()):
            raise InputError(f"question {question_id} choices must map string ids to string descriptions")
        built[question_id] = {"type": "choice", "instructions": question["instructions"], "criteria": choices}
    return built


def check_size(state: dict, questions: dict) -> int:
    longest_question = max(len(json.dumps(q, ensure_ascii=False)) for q in questions.values())
    estimate = (len(json.dumps(state, ensure_ascii=False)) + longest_question) // CHARS_PER_TOKEN
    if estimate > MAX_PACKET_TOKENS:
        raise OverflowError(
            f"packet is about {estimate} tokens, over {MAX_PACKET_TOKENS}; split the sources into "
            "several requests instead of truncating them"
        )
    return estimate


def post(url: str, api_key: str, payload: dict, timeout: float) -> dict:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload, ensure_ascii=False).encode(),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode())


def write_record(record: dict, record_dir: str | None) -> None:
    text = json.dumps(record, indent=2, ensure_ascii=False)
    if record_dir:
        directory = Path(record_dir)
        directory.mkdir(parents=True, exist_ok=True)
        name = f"{time.strftime('%Y%m%dT%H%M%S')}-{record['request_sha256'][7:19]}.json"
        (directory / name).write_text(text + "\n", encoding="utf-8")
    print(text)


def main() -> int:
    parser = argparse.ArgumentParser(description="Ask Jev categorical questions over supplied evidence.")
    parser.add_argument("request", help="request JSON file, or - for stdin")
    parser.add_argument("--record-dir", help="also save the record as a JSON file in this directory")
    parser.add_argument("--dry-run", action="store_true", help="print the API payload and size; send nothing")
    parser.add_argument("--timeout", type=float, default=60.0, help="seconds to wait for the response")
    args = parser.parse_args()

    try:
        request = load_request(args.request)
        model = request.get("model", DEFAULT_MODEL)
        payload = {"model": model, "state": build_state(request), "questions": build_questions(request)}
        if request.get("session_id"):
            payload["sessionId"] = request["session_id"]
        estimate = check_size(payload["state"], payload["questions"])
    except InputError as error:
        print(f"error: {error}", file=sys.stderr)
        return EXIT_BAD_INPUT
    except OverflowError as error:
        print(f"error: {error}", file=sys.stderr)
        return EXIT_TOO_LARGE

    if args.dry_run:
        print(json.dumps({"estimated_tokens": estimate, "payload": payload}, indent=2, ensure_ascii=False))
        return 0

    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        print("error: OPENROUTER_API_KEY is not set", file=sys.stderr)
        return EXIT_BAD_INPUT

    record = {
        "recorded_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "request_sha256": sha256(payload),
        "source_sha256": {s["id"]: sha256(s["text"].encode()) for s in payload["state"].get("sources", [])},
        "model_requested": model,
        "estimated_tokens": estimate,
    }
    url = os.environ.get("JEV_DECISIONS_URL", DEFAULT_URL)
    try:
        response = post(url, api_key, payload, args.timeout)
    except urllib.error.HTTPError as error:
        record["error"] = {"status": error.code, "body": error.read().decode(errors="replace")}
        write_record(record, args.record_dir)
        return EXIT_API_ERROR
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
        record["error"] = {"message": str(error)}
        write_record(record, args.record_dir)
        return EXIT_API_ERROR

    returned = response.get("model", "")
    record.update({
        "model_returned": returned,
        "response_id": response.get("id"),
        "answers": response.get("answers"),
        "usage": response.get("usage"),
        "response": response,
    })
    # A pinned model must come back as a dated snapshot of itself; aliases (~...) may resolve freely.
    if not model.startswith("~") and not returned.startswith(model):
        record["error"] = {"message": f"requested {model} but the response came from {returned or 'an unnamed model'}"}
        write_record(record, args.record_dir)
        return EXIT_MODEL_MISMATCH
    write_record(record, args.record_dir)
    return 0


if __name__ == "__main__":
    sys.exit(main())
