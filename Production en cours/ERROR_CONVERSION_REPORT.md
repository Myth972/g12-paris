# Error Conversion Report: `Error` → `TRPCError`

## Mission: Complete ✅

Convert all `throw new Error()` statements to `TRPCError` with appropriate error codes across the entire codebase.

---

## Summary

**Total Errors Converted:** 73  
**Files Modified:** 11  
**TypeScript Validation:** ✅ PASSED  
\*\*Remaining `throw new Error()`: 0

---

## Conversion Details by File

### 1. **server/db.ts** (27 errors)

- **Added import:** `import { TRPCError } from "@trpc/server";`
- **Error types converted:**
  - `"User openId is required for upsert"` → `BAD_REQUEST`
  - `"Database not available"` (26 instances) → `INTERNAL_SERVER_ERROR`

**Affected functions:** `upsertUser()`, `createArticle()`, `updateArticle()`, `deleteArticle()`, `getArticleById()`, `getArticleBySlug()`, `listPublishedArticles()`, `countPublishedArticles()`, `listAllArticles()`, `countAllArticles()`, `createNotification()`, `deleteNotification()`, `listNotifications()`, `countNotifications()`, `getUserNotifications()`, `countUnreadNotifications()`, `markNotificationAsRead()`, `markAllNotificationsAsRead()`, `listGalleries()`, `createGalleryItem()`, `deleteGalleryItem()`, `listPublications()`, `createPublicationItem()`, `deletePublicationItem()`, `getPageBySlug()`, `upsertPage()`, `listPages()`

---

### 2. **server/personalization.router.ts** (11 errors)

- **Added import:** `import { TRPCError } from "@trpc/server";`
- **Error types converted:**
  - `"User ID not found"` (10 instances) → `UNAUTHORIZED`
  - `"Template not found"` → `NOT_FOUND`

**Affected procedures:** `getProfile`, `updatePreferences`, `trackActivity`, `getRecommendations`, `getLayouts`, `getActiveLayout`, `createLayout`, `setActiveLayout`, `deleteLayout`, `applyTemplate`

---

### 3. **server/\_core/personalization/layout-manager.ts** (13 errors)

- **Added import:** `import { TRPCError } from "@trpc/server";`
- **Error types converted:**
  - `"Database not available"` (10 instances) → `INTERNAL_SERVER_ERROR`
  - `"Layout not found"` (2 instances) → `NOT_FOUND`
  - `"Cannot delete active or default layout"` → `CONFLICT`

**Affected classes:**

- `LayoutManager`: `createLayout()`, `updateLayout()`, `setActiveLayout()`, `setDefaultLayout()`, `getLayout()`, `getUserLayouts()`, `getActiveLayout()`, `deleteLayout()`
- `LayoutTemplateManager`: `getTemplates()`, `getTemplate()`, `createTemplateFromLayout()`

---

### 4. **server/\_core/personalization/profile-manager.ts** (7 errors)

- **Added import:** `import { TRPCError } from "@trpc/server";`
- **Error types converted:**
  - `"Database not available"` (7 instances) → `INTERNAL_SERVER_ERROR`

**Affected classes:**

- `ProfileManager`: `getOrCreateProfile()`, `updatePreferences()`, `getPreferences()`
- `ActivityTracker`: `trackActivity()`, `updateCategoryScore()`, `getUserActivities()`, `getCategoryScores()`

---

### 5. **server/\_core/personalization/score-calculator.ts** (1 error)

- **Added import:** `import { TRPCError } from "@trpc/server";`
- **Error types converted:**
  - `"Database not available"` → `INTERNAL_SERVER_ERROR`

**Affected class:** `ScoreCalculator.calculateRecommendations()`

---

### 6. **server/\_core/llm.ts** (6 errors)

- **Added import:** `import { TRPCError } from "@trpc/server";`
- **Error types converted:**
  - `"Unsupported message content part"` → `BAD_REQUEST`
  - `"tool_choice 'required' was provided but no tools were configured"` → `BAD_REQUEST`
  - `"tool_choice 'required' needs a single tool or specify the tool name explicitly"` → `BAD_REQUEST`
  - `"responseFormat json_schema requires a defined schema object"` → `BAD_REQUEST`
  - `"outputSchema requires both name and schema"` → `BAD_REQUEST`
  - `"AI API Key (Forge or Google) is not configured"` → `INTERNAL_SERVER_ERROR`
  - `"LLM invoke failed"` → `INTERNAL_SERVER_ERROR`

**Affected functions:** `normalizeContentPart()`, `normalizeToolChoice()`, `assertApiKey()`, `normalizeResponseFormat()`, `invokeLLM()`

---

### 7. **server/\_core/dataApi.ts** (3 errors)

- **Added import:** `import { TRPCError } from "@trpc/server";`
- **Error types converted:**
  - `"BUILT_IN_FORGE_API_URL is not configured"` → `INTERNAL_SERVER_ERROR`
  - `"BUILT_IN_FORGE_API_KEY is not configured"` → `INTERNAL_SERVER_ERROR`
  - `"Data API request failed"` → `INTERNAL_SERVER_ERROR`

**Affected function:** `callDataApi()`

---

### 8. **server/\_core/imageGeneration.ts** (3 errors)

- **Added import:** `import { TRPCError } from "@trpc/server";`
- **Error types converted:**
  - `"BUILT_IN_FORGE_API_URL is not configured"` → `INTERNAL_SERVER_ERROR`
  - `"BUILT_IN_FORGE_API_KEY is not configured"` → `INTERNAL_SERVER_ERROR`
  - `"Image generation request failed"` → `INTERNAL_SERVER_ERROR`

**Affected function:** `generateImage()`

---

### 9. **server/\_core/map.ts** (2 errors)

- **Added import:** `import { TRPCError } from "@trpc/server";`
- **Error types converted:**
  - `"Google Maps proxy credentials missing"` → `INTERNAL_SERVER_ERROR`
  - `"Google Maps API request failed"` → `INTERNAL_SERVER_ERROR`

**Affected functions:** `getMapsConfig()`, `makeRequest<T>()`

---

### 10. **server/\_core/index.ts** (1 error)

- **Added import:** `import { TRPCError } from "@trpc/server";`
- **Error types converted:**
  - `"No available port found starting from ${startPort}"` → `INTERNAL_SERVER_ERROR`

**Affected function:** `findAvailablePort()`

---

### 11. **server/storage.ts** (1 error)

- **Added import:** `import { TRPCError } from "@trpc/server";`
- **Error types converted:**
  - `"Storage upload failed"` → `INTERNAL_SERVER_ERROR`

**Affected function:** `storagePut()`

---

## Error Code Mapping

| Code                      | Usage                                                         | Count  |
| ------------------------- | ------------------------------------------------------------- | ------ |
| **UNAUTHORIZED**          | Missing authentication (User ID not found)                    | 10     |
| **NOT_FOUND**             | Resource not found (Template, Layout)                         | 3      |
| **CONFLICT**              | State conflict (Cannot delete active layout)                  | 1      |
| **BAD_REQUEST**           | Invalid input/validation (Unsupported content, schema errors) | 6      |
| **INTERNAL_SERVER_ERROR** | Database, API, Config errors                                  | 53     |
| **Total**                 |                                                               | **73** |

---

## Validation Results

✅ **TypeScript Compilation:** PASSED  
✅ **No remaining `throw new Error()` statements**  
✅ **All imports properly added**  
✅ **Error codes semantically correct**

---

## Commit Information

**Commit Hash:** 75e566b  
**Message:** refactor: Convert all Error throws to TRPCError with appropriate codes

---

## Benefits

1. **Better Error Handling:** Structured error responses with proper HTTP status codes
2. **Consistency:** All server errors now follow tRPC standard error format
3. **Client-Friendly:** Clients receive semantic error codes (UNAUTHORIZED, NOT_FOUND, etc.)
4. **Type Safety:** Full TypeScript support for error handling
5. **Maintainability:** Clear error semantics across all server functions
