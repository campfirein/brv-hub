# REST API Kickstart

This bundle provides core principles and best practices for designing robust, testable, and performant REST APIs. It is designed to be language-agnostic and enforces strict conventions like RFC 7807 for error handling, explicit DTOs for performance, and a clear separation between network and business logic.

## When to use this bundle

Feed this bundle to your AI coding agents when:
- Bootstrapping a new REST API service (in any language).
- Refactoring an existing API layer for better performance or consistency.
- Writing test cases for API endpoints to ensure edge cases are covered.
- Conducting a code review on a pull request involving HTTP handlers or routes.

## What it covers

- **Core Principles:** Language-agnostic, explicit rules with good/bad examples.
- **URI & HTTP:** Standard methods and semantic URL structuring.
- **Error Handling:** Strict adherence to RFC 7807 (Problem Details).
- **Performance:** Mandatory pagination and DTO mapping to prevent N+1 and over-fetching issues.
- **Testability:** Clear boundary separation (Controller vs Service) and explicit edge cases.

## Usage

Reference this context when prompting your AI:

```markdown
Review the proposed API changes using the `rest-api-kickstart` bundle conventions. Focus especially on the RFC 7807 error format and DTO usage.
```
