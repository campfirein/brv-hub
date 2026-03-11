# REST API Kickstart

This bundle provides the core principles, patterns, and boundaries for designing and implementing REST APIs. It is language-agnostic and should be used to guide the generation of API endpoints, error handling, and testing strategies.

## Table of Contents

1. [Core Principles](#1-core-principles)
2. [URI Structure](#2-uri-structure)
3. [HTTP Methods](#3-http-methods)
4. [Error Handling (RFC 7807)](#4-error-handling-rfc-7807)
5. [Performance & Data Representation](#5-performance--data-representation)
6. [Design for Testability](#6-design-for-testability)
7. [Testing Requirements](#7-testing-requirements)

---

## 1. Core Principles

**[REST-01] Resource-Oriented**
Design APIs around resources (nouns) rather than actions (verbs).
- **Good:** `POST /orders` (create an order)
- **Bad:** `POST /createOrder` or `GET /getAllUsers`

**[REST-02] Language Agnostic**
These rules apply to any tech stack (Go, TypeScript, Python, etc.). Focus on the standard HTTP contracts.
- **Good:** Documenting a rule using a raw `curl` command:
  ```bash
  curl -X GET https://api.example.com/users/42
  ```
- **Bad:** Documenting a rule tied to a specific framework:
  ```javascript
  // Don't do this in a language-agnostic bundle
  app.get('/users/:id', (req, res) => { ... });
  ```

---

## 2. URI Structure

**[URI-01] Plural Nouns**
Always use plural nouns for collections.
- **Good:** `/users`, `/orders/123/items`
- **Bad:** `/user`, `/get-orders`, `/create_item`

**[URI-02] Nested Resources**
Use nesting to show relationships, but limit depth to avoid overly complex URLs. Prefer top-level resources if the relationship isn't strict.
- **Good:** `/orders/123/items` (items belong to an order)
- **Bad:** `/users/1/orders/123/items/456/reviews` (too deep, flatten instead: `/reviews?item_id=456`)

---

## 3. HTTP Methods

**[METH-01] Standard Semantics**
Use HTTP methods according to their standard definitions:
- **GET:** Retrieve a resource or collection (Idempotent, Safe).
- **POST:** Create a new resource or trigger an action.
- **PUT:** Replace a resource entirely (Idempotent).
- **PATCH:** Partially update a resource.
- **DELETE:** Remove a resource (Idempotent).

**[Good] Correct method usage:**
```
GET    /users/42          # Retrieve user 42
POST   /users             # Create a new user
PUT    /users/42          # Replace user 42 entirely
PATCH  /users/42          # Update user 42's email only
DELETE /users/42          # Delete user 42
```

**[Bad] Incorrect method usage:**
```
GET    /users/42/delete   # Using GET for a destructive action
POST   /users/42          # Using POST to update (use PUT or PATCH)
GET    /createUser?name=A # Using GET with side effects
```

---

## 4. Error Handling (RFC 7807)

**[ERR-01] Problem Details Format**
All API errors MUST comply with RFC 7807 (Problem Details for HTTP APIs). Never return custom or ad-hoc error structures.

The standard JSON response MUST include:
- `title`: A short, human-readable summary of the problem type.
- `status`: The HTTP status code.
- `detail`: A human-readable explanation specific to this occurrence of the problem.
- (Optional) `type`: A URI reference that identifies the problem type.
- (Optional) `instance`: A URI reference that identifies the specific occurrence of the problem.

**[Good] Example of RFC 7807 Response:**
```json
{
  "type": "https://example.com/probs/validation-error",
  "title": "Your request parameters didn't validate.",
  "status": 400,
  "detail": "The 'age' parameter must be a positive integer.",
  "instance": "/users/123",
  "invalidParams": [
    {
      "name": "age",
      "reason": "must be a positive integer"
    }
  ]
}
```

**[Bad] Ad-hoc or inconsistent error formats:**
```json
// Bad: Plain string message
{ "error": "Not Found" }

// Bad: Inconsistent structure
{ "code": 404, "message": "Item not found" }

// Bad: Leaking stack traces to the client
{ "error": "NullPointerException at UserService.java:42" }
```

**[ERR-02] Specific Status Codes**
Use specific 4xx codes to communicate exact failure modes:
- `400 Bad Request`: Validation failures.
- `401 Unauthorized`: Missing or invalid authentication.
- `403 Forbidden`: Authenticated, but lacking permissions.
- `404 Not Found`: Resource does not exist.
- `409 Conflict`: Business rule violation or resource conflict (e.g., duplicate email).
- `415 Unsupported Media Type`: Invalid `Content-Type`.
- `422 Unprocessable Entity`: Semantic errors in the payload (often used interchangeably with 400 for validation).

**[Good] Choosing the right status code:**
```
POST /users {"email": "already@exists.com"}
-> 409 Conflict  ("A user with this email already exists.")

GET /users/99999
-> 404 Not Found ("User with id 99999 does not exist.")

PATCH /users/42 {"age": "abc"}
-> 422 Unprocessable Entity ("'age' must be a positive integer.")
```

**[Bad] Lazy status code usage:**
```
POST /users {"email": "already@exists.com"}
-> 500 Internal Server Error ("Something went wrong")  # Hides the real cause

GET /users/99999
-> 200 OK {"data": null}  # Silently swallows a missing resource
```

---

## 5. Performance & Data Representation

**[PERF-01] Mandatory Pagination**
All `GET` endpoints returning collections MUST implement pagination by default. Never return unbounded collections (e.g., `db.collection.find({})`).

- **Offset-based:** For general use (`?limit=20&offset=0`).
- **Cursor-based / Keyset:** For high-performance, large datasets, or time-series data.

**[Good] Paginated collection response:**
```json
GET /users?limit=2&offset=0

{
  "data": [
    { "id": 1, "name": "Alice" },
    { "id": 2, "name": "Bob" }
  ],
  "pagination": {
    "total": 150,
    "limit": 2,
    "offset": 0,
    "has_more": true
  }
}
```

**[Bad] Unbounded collection response:**
```json
GET /users

// Returns all 150,000 users in a single response -> OOM risk
[
  { "id": 1, "name": "Alice" },
  ...
]
```

**[PERF-02] Data Transfer Objects (DTOs)**
API endpoints MUST use DTOs (or Views) to format the response payload.
- Never expose internal database models directly.
- Strip sensitive data (e.g., passwords, internal IDs) before serialization.

**[Good] Using a DTO to shape the response:**
```json
GET /users/42

{
  "id": 42,
  "name": "Alice",
  "email": "alice@example.com",
  "role": "admin"
}
```

**[Bad] Exposing the raw database model:**
```json
GET /users/42

{
  "_id": "ObjectId('6a2f...')",
  "name": "Alice",
  "email": "alice@example.com",
  "password_hash": "$2b$12$LJ3...",
  "internal_flags": 7,
  "__v": 3
}
```

**[PERF-03] N+1 Query Warning**
**CRITICAL WARNING:** When serializing DTOs with nested relationships, explicitly check for N+1 query problems. Use Eager Loading (e.g., SQL `JOIN`s, `Preload` in GORM, or DataLoaders) to fetch related data in a single query rather than looping in the application layer.

**[Good] Eager loading related data:**
```
// 1 query to fetch orders + 1 query to fetch all related items
SELECT * FROM orders WHERE user_id = 42;
SELECT * FROM order_items WHERE order_id IN (1, 2, 3);
```

**[Bad] N+1 query pattern (loading in a loop):**
```
SELECT * FROM orders WHERE user_id = 42;  -- returns 100 orders
-- Then for EACH order:
SELECT * FROM order_items WHERE order_id = 1;
SELECT * FROM order_items WHERE order_id = 2;
...  -- 100 extra queries!
SELECT * FROM order_items WHERE order_id = 100;
```

---

## 6. Design for Testability

**[ARCH-01] Boundary Separation**
Implement a strict separation of concerns to allow unit testing without spinning up the network layer.

- **Controller / Route Handler:** Exclusively handles HTTP parsing, request validation, and formatting the response (DTO mapping). Contains NO business logic.
- **Service Layer:** Contains all business logic. Does NOT know about HTTP `Request` or `Response` objects. This is where the core unit tests live.
- **Repository / Data Layer:** Handles database interactions.

**[Good] Clean separation — Controller delegates to Service:**
```
// Controller: only parses HTTP, calls service, formats response
func CreateUserHandler(req, res) {
  body = parseJSON(req.body)
  validate(body)                     // HTTP concern
  user = userService.Create(body)    // Delegates to service
  res.status(201).json(toDTO(user))  // Formats response
}

// Service: pure business logic, no HTTP awareness
func (s *UserService) Create(input) {
  if s.repo.ExistsByEmail(input.email) {
    return ConflictError("Email already exists")
  }
  return s.repo.Insert(input)
}
```

**[Bad] Fat controller — business logic mixed with HTTP handling:**
```
// Controller does EVERYTHING: validation, DB queries, business rules
func CreateUserHandler(req, res) {
  body = parseJSON(req.body)
  existingUser = db.query("SELECT * FROM users WHERE email = ?", body.email)
  if existingUser != nil {
    res.status(409).json({"error": "Email exists"})  // Business logic in controller
  }
  hashedPw = bcrypt.hash(body.password)
  db.query("INSERT INTO users ...", body.name, body.email, hashedPw)
  res.status(201).json(body)  // Leaks raw input back
}
// This is impossible to unit test without a real database.
```

---

## 7. Testing Requirements

**[TEST-01] Mandatory Edge Case Coverage**
When generating or reviewing tests for APIs, the following scenarios MUST be covered. Do not only test the "Happy Path" (200 OK).

1. **Validation Failures:** Test missing required fields, invalid data types, and empty payloads (Expect `400` or `422`).
2. **Authentication/Authorization:** Test missing tokens, expired tokens, and insufficient roles (Expect `401` or `403`).
3. **Content Negotiation:** Test requests with invalid `Accept` or `Content-Type` headers (Expect `415` or `406`).
4. **Pagination Edge Cases:** Test requesting pages beyond the total count, negative limits, or invalid cursors.
5. **Business Logic Conflicts:** Test duplicate entries or invalid state transitions (Expect `409`).

**[Good] Comprehensive test plan for `POST /users`:**
```
# Happy Path
POST /users {"name": "Alice", "email": "a@b.com"} -> 201 Created

# Validation Failures
POST /users {}                                    -> 400 (missing required fields)
POST /users {"name": "", "email": "not-an-email"} -> 422 (invalid values)
POST /users (empty body)                          -> 400 (empty payload)

# Auth
POST /users (no Authorization header)             -> 401 Unauthorized
POST /users (expired token)                       -> 401 Unauthorized
POST /users (valid token, role=viewer)             -> 403 Forbidden

# Content Negotiation
POST /users Content-Type: text/xml                -> 415 Unsupported Media Type

# Business Conflict
POST /users {"email": "already@exists.com"}       -> 409 Conflict
```

**[Bad] Incomplete test plan — only tests the happy path:**
```
# This is NOT enough!
POST /users {"name": "Alice", "email": "a@b.com"} -> 201 Created
# No validation, auth, conflict, or edge case tests at all.
```
