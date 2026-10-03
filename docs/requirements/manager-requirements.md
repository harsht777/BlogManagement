# Manager Requirements

## Source
Manager-provided project requirement screenshots (Image 1 and Image 2).

---

## 1. Project Objective
Build a **Blog Management Admin Panel** where an administrator can upload a `DOC`/`DOCX` file containing a blog's content and structure. The system parses the document, extracts semantic structure, and creates a web-ready blog rendered via a reusable website template while preserving supported formatting.

---

## 2. Required Technology Stack
As specified in the manager requirements and document notes:
- **Frontend:** Next.js (React, TypeScript)
- **Backend:** Node.js (TypeScript)
- **API Protocol:** GraphQL API (Apollo Server)
- **Database:** PostgreSQL
- **ORM:** TypeScript ORM (Prisma)
- **Document Parsing:** Backend DOCX parser (Investigation into Mammoth.js or equivalent)
- **Styling / UI Reference:** Predefined web components aligned with the official Figma design

---

## 3. Required Processing Flow & Workflow
The manager defined the end-to-end processing lifecycle:
$$\text{DOCX} \longrightarrow \text{Upload API} \longrightarrow \text{Document Parser} \longrightarrow \text{Extract Structure \& Content} \longrightarrow \text{Store Structured Blog Data} \longrightarrow \text{Render Using Blog Template} \longrightarrow \text{Preview} \longrightarrow \text{Publish}$$

### Suggested System Architecture
$$\text{Admin Panel} \longrightarrow \text{Backend API} \longrightarrow \text{DOCX Parser} \longrightarrow \text{Structured Blog JSON + Images} \longrightarrow \text{Database / Object Storage} \longrightarrow \text{Blog Renderer} \longrightarrow \text{Public Blog Page}$$

---

## 4. Functional Requirements

### Admin Panel Features
| Feature | Manager Requirement Description |
| :--- | :--- |
| **Blog List** | View all blogs displaying title, status, author, and dates. |
| **Create / Upload** | Upload a `.doc` / `.docx` file to initiate a new blog. |
| **Edit** | Edit extracted blog content, metadata, and sections prior to publishing. |
| **Preview** | Preview the final web-rendered version before publishing. |
| **Publish / Unpublish** | Control whether a blog is publicly visible or saved as a draft. |
| **Delete** | Delete blogs that are no longer required. |

### Actions on Processed Blogs
- **Save Draft:** Save current progress without making the post public.
- **Preview:** Inspect the rendered template preview.
- **Publish:** Make the blog publicly live on the website.

---

## 5. Data / Content Requirements

### Supported DOCX Content Elements
The system must parse semantic structures rather than reducing documents to plain text:
- Blog title and headings / subheadings (H1, H2, H3, etc.)
- Paragraphs
- Bold and italic inline text styling
- Ordered and unordered lists
- Embedded images
- Hyperlinks
- Blockquotes or callout sections
- Tables (where applicable)
- Document section layout

### Reusable Frontend Blog Template Structure
The website controls layout and styling; the document supplies content and semantics.
Example structural hierarchy:
1. Featured Image
2. Blog Title
3. Author & Publication Date
4. Content Sections (Body, Headings, Lists, Images)
5. Callouts / Blockquotes
6. Conclusion
7. Related Blogs

> **Key Rule:** Do not copy arbitrary Word CSS directly into the website. Map document semantics (headings, paragraphs, lists, images, quotes) to predefined web components.

---

## 6. Deliverables Specified by Manager
1. Admin Panel
2. Blog CRUD APIs (GraphQL)
3. DOCX upload functionality
4. DOCX-to-structured-blog conversion engine
5. Image extraction and storage mechanism
6. Blog preview component/page
7. Publish / unpublish functionality
8. Frontend reusable blog template
9. Database schema (PostgreSQL / Prisma)
10. Technical documentation & README
11. Sample DOCX files for validation and testing

---

## 7. Constraints
- Must use TypeScript across both frontend and backend.
- Must use GraphQL API rather than standard REST or Next.js route handlers.
- Document styling must adhere to predefined design components (matching the provided Figma specification).
- Docker containerization is deferred to the final project stage.

---

## 8. Figma Design Reference
- **Figma Design URL:** `https://www.figma.com/design/HqCscPf3wIWd3Op0sSr0lQ/Kofuku-Pre-launch-Readiness-%25E2%2580%2593-Pending-To%25E2%2580%259do-List?node-id=9091-477270&t=xPiSGTuTolvgAvyL-0`

---

## 9. Future Requirements (Intentionally Deferred Beyond Phase 1)
- DOCX file upload API & parser integration (Mammoth.js evaluation).
- Image extraction from DOCX and local/cloud storage mapping.
- Structured Blog JSON schema design and storage.
- Full Admin Panel UI, blog editor, and Figma template implementation.
- Public blog viewing page and routing.
- Docker configuration and production deployment.

---

## 10. Ambiguities / Items Requiring Confirmation
- **DOCX parser selection:** Mammoth.js vs. alternatives (e.g. `docx`, `adm-zip` for raw XML extraction) will be evaluated in Phase 2 during Technical Investigation.
- **Image Storage Strategy:** Local filesystem for development vs. S3/Cloud Storage for production.
- **Authentication/Role-Based Access:** Not specified in the provided manager requirements. Assumed for future consideration.
