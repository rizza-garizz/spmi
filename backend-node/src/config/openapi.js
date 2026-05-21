module.exports = {
  openapi: "3.0.3",
  info: {
    title: "SPMI Command Center API",
    version: "1.0.0",
    description:
      "Backend API resmi untuk SPMI Command Center. Mendukung mode local_mock untuk demo cepat dan mode database untuk integrasi PostgreSQL + Prisma.",
  },
  servers: [
    {
      url: "http://localhost:4000",
      description: "Local development",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ApiEnvelope: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { type: "object", nullable: true },
          message: { type: "string", example: "OK" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["System"],
        summary: "Health check backend",
        responses: {
          200: { description: "Service is healthy" },
        },
      },
    },
    "/system/status": {
      get: {
        tags: ["System"],
        summary: "Status runtime backend",
        responses: {
          200: { description: "Runtime status and mode" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login user and issue token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "admin@spmi.local" },
                  password: { type: "string", example: "Password123!" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Login successful" },
          401: { description: "Invalid credentials" },
        },
      },
    },
    "/security/audit-trail": {
      get: {
        tags: ["Security"],
        summary: "List user activity audit trail",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "actor", in: "query", required: false, schema: { type: "string" } },
          { name: "action", in: "query", required: false, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Audit trail entries" },
          403: { description: "Admin role required" },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current authenticated user",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Current profile" },
          401: { description: "Invalid token" },
        },
      },
    },
    "/dashboard/summary": {
      get: {
        tags: ["Dashboard"],
        summary: "Get dashboard KPI trend snapshot with faculty study-program year and standard filters",
        parameters: [
          { name: "fakultas", in: "query", required: false, schema: { type: "string" } },
          { name: "prodi", in: "query", required: false, schema: { type: "string" } },
          { name: "tahun", in: "query", required: false, schema: { type: "string" } },
          { name: "standar", in: "query", required: false, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Dashboard summary" },
        },
      },
    },
    "/dashboard/export": {
      get: {
        tags: ["Dashboard"],
        summary: "Export dashboard KPI data as CSV or PDF-ready HTML",
        parameters: [
          { name: "format", in: "query", required: false, schema: { type: "string", enum: ["excel", "pdf"] } },
          { name: "fakultas", in: "query", required: false, schema: { type: "string" } },
          { name: "prodi", in: "query", required: false, schema: { type: "string" } },
          { name: "tahun", in: "query", required: false, schema: { type: "string" } },
          { name: "standar", in: "query", required: false, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Dashboard export file" },
        },
      },
    },
    "/performance/report": {
      get: {
        tags: ["Performance"],
        summary: "Inspect dashboard loading document pagination multi-user and organization scale readiness",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Performance readiness report" },
          403: { description: "Admin role required" },
        },
      },
    },
    "/catalog": {
      get: {
        tags: ["Catalog"],
        summary: "Get complete frontend catalog snapshot",
        responses: {
          200: { description: "Catalog snapshot" },
        },
      },
    },
    "/standards": {
      get: {
        tags: ["Standards"],
        summary: "List quality standards",
        responses: {
          200: { description: "List of standards" },
        },
      },
      post: {
        tags: ["Standards"],
        summary: "Create a standard in current runtime mode",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "category"],
                properties: {
                  title: { type: "string", example: "Standar Evaluasi Pembelajaran" },
                  category: { type: "string", example: "pendidikan" },
                  description: { type: "string", example: "Ringkasan standar" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Standard created" },
        },
      },
    },
    "/standards/{id}": {
      put: {
        tags: ["Standards"],
        summary: "Update a standard and append revision history",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Standard updated" },
          404: { description: "Standard not found" },
        },
      },
      delete: {
        tags: ["Standards"],
        summary: "Soft-delete a standard and keep revision history",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Standard deleted" },
          404: { description: "Standard not found" },
        },
      },
    },
    "/standards/{id}/revisions": {
      get: {
        tags: ["Standards"],
        summary: "List standard revision history",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Revision history" },
          404: { description: "Standard not found" },
        },
      },
    },
    "/documents": {
      get: {
        tags: ["Documents"],
        summary: "List documents",
        responses: {
          200: { description: "Document repository" },
        },
      },
      post: {
        tags: ["Documents"],
        summary: "Create/upload a document in current runtime mode",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  code: { type: "string" },
                  title: { type: "string" },
                  type: { type: "string" },
                  document_date: { type: "string", format: "date" },
                  category: { type: "string" },
                  owner: { type: "string" },
                  org_unit_code: { type: "string" },
                  file: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Document created" },
          403: { description: "Forbidden by document scope" },
          409: { description: "Duplicate file rejected" },
        },
      },
    },
    "/documents/{id}/versions": {
      post: {
        tags: ["Documents"],
        summary: "Upload a new validated version for an existing document",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: { type: "string", format: "binary" },
                  file_name: { type: "string" },
                  file_size: { type: "number" },
                  mime_type: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Document version created" },
          403: { description: "Forbidden by document scope" },
          404: { description: "Document not found" },
          409: { description: "Duplicate file rejected" },
        },
      },
    },
    "/documents/versions/{versionId}": {
      get: {
        tags: ["Documents"],
        summary: "Get document version metadata with preview and download URLs",
        parameters: [
          {
            name: "versionId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Version metadata payload" },
          403: { description: "Forbidden by document scope" },
          404: { description: "Version not found" },
        },
      },
    },
    "/documents/versions/{versionId}/download": {
      get: {
        tags: ["Documents"],
        summary: "Download a scoped document version",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "versionId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Download payload or storage URL" },
          403: { description: "Forbidden by document scope" },
          404: { description: "Version not found" },
        },
      },
    },
    "/documents/versions/{versionId}/preview": {
      get: {
        tags: ["Documents"],
        summary: "Preview a scoped document version",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "versionId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Preview payload or storage URL" },
          403: { description: "Forbidden by document scope" },
          404: { description: "Version not found" },
        },
      },
    },
    "/imports/aoa/preview": {
      post: {
        tags: ["Imports"],
        summary: "Preview migrasi AOA sebelum commit",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  entity: { type: "string", example: "standards" },
                  file: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Preview migrasi tersedia" },
          422: { description: "File atau data migrasi tidak valid" },
        },
      },
    },
    "/imports/aoa/commit": {
      post: {
        tags: ["Imports"],
        summary: "Commit migrasi AOA setelah preview aman",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  entity: { type: "string", example: "standards" },
                  strategy: {
                    type: "string",
                    enum: ["skip_duplicates", "overwrite_duplicates"],
                    example: "skip_duplicates",
                  },
                  file: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Migrasi AOA berhasil dieksekusi" },
          422: { description: "Tidak ada data aman yang bisa dimigrasikan" },
        },
      },
    },
    "/ppepp/cycles": {
      get: {
        tags: ["PPEPP"],
        summary: "List PPEPP cycles",
        responses: {
          200: { description: "PPEPP cycles" },
        },
      },
      post: {
        tags: ["PPEPP"],
        summary: "Create a PPEPP cycle",
        security: [{ bearerAuth: [] }],
        responses: {
          201: { description: "PPEPP cycle created" },
        },
      },
    },
    "/ppepp/cycles/{id}/stages/{stage}": {
      patch: {
        tags: ["PPEPP"],
        summary: "Update one PPEPP stage status, progress, due date, and notes",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "stage", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "PPEPP stage updated" },
          404: { description: "PPEPP cycle or stage not found" },
        },
      },
    },
    "/ppepp/cycles/{id}/stages/{stage}/evidence": {
      post: {
        tags: ["PPEPP"],
        summary: "Upload evidence for one PPEPP stage",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "stage", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          201: { description: "PPEPP evidence uploaded" },
          404: { description: "PPEPP cycle or stage not found" },
        },
      },
    },
    "/ami/audits": {
      get: {
        tags: ["AMI"],
        summary: "List internal audits",
        responses: {
          200: { description: "AMI audits" },
        },
      },
      post: {
        tags: ["AMI"],
        summary: "Create an internal audit",
        security: [{ bearerAuth: [] }],
        responses: {
          201: { description: "AMI audit created" },
        },
      },
    },
    "/ami/audits/{id}/findings": {
      post: {
        tags: ["AMI"],
        summary: "Create a finding for an audit",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          201: { description: "Finding created" },
        },
      },
    },
    "/ami/audits/{id}/assignment": {
      patch: {
        tags: ["AMI"],
        summary: "Update audit schedule and auditor assignment",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Audit assignment updated" },
          404: { description: "Audit not found" },
        },
      },
    },
    "/ami/audits/{id}/instruments/{instrumentId}": {
      patch: {
        tags: ["AMI"],
        summary: "Update audit instrument result",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "instrumentId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Audit instrument updated" },
          404: { description: "Audit or instrument not found" },
        },
      },
    },
    "/ami/audits/{id}/findings/{findingId}/follow-up": {
      patch: {
        tags: ["AMI"],
        summary: "Update finding follow-up progress",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "findingId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Finding follow-up updated" },
          404: { description: "Audit or finding not found" },
        },
      },
    },
    "/ami/audits/{id}/findings/{findingId}/verification": {
      patch: {
        tags: ["AMI"],
        summary: "Verify finding correction",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "findingId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Finding correction verified" },
          404: { description: "Audit or finding not found" },
        },
      },
    },
    "/ami/audits/{id}/summary": {
      get: {
        tags: ["AMI"],
        summary: "Get automatic audit summary",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Audit summary" },
          404: { description: "Audit not found" },
        },
      },
    },
    "/rtm/meetings": {
      get: {
        tags: ["RTM"],
        summary: "List RTM meetings",
        responses: {
          200: { description: "RTM meetings" },
        },
      },
      post: {
        tags: ["RTM"],
        summary: "Create an RTM meeting",
        security: [{ bearerAuth: [] }],
        responses: {
          201: { description: "RTM meeting created" },
        },
      },
    },
    "/indicators": {
      get: {
        tags: ["Indicators"],
        summary: "List indicators and latest values",
        responses: {
          200: { description: "Indicator list" },
        },
      },
      post: {
        tags: ["Indicators"],
        summary: "Create a new indicator",
        security: [{ bearerAuth: [] }],
        responses: {
          201: { description: "Indicator created" },
        },
      },
    },
    "/indicators/{id}/values": {
      post: {
        tags: ["Indicators"],
        summary: "Create a new indicator value",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          201: { description: "Indicator value created" },
          404: { description: "Indicator not found" },
        },
      },
    },
    "/ami/audits/{id}/report": {
      get: {
        tags: ["AMI"],
        summary: "Generate printable AMI report",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "AMI report HTML" },
          403: { description: "Forbidden by audit scope" },
          404: { description: "Audit not found" },
        },
      },
    },
    "/org-units": {
      get: {
        tags: ["Organization"],
        summary: "List organization units",
        responses: {
          200: { description: "Org units" },
        },
      },
    },
    "/integrations": {
      get: {
        tags: ["Integration"],
        summary: "List integration sources",
        responses: {
          200: { description: "Integration list" },
        },
      },
    },
    "/integrations/readiness": {
      get: {
        tags: ["Integration"],
        summary: "Inspect readiness for SIAKAD SIMPEG finance repository PDDIKTI and SSO/IAM",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Integration readiness report" },
          403: { description: "Admin role required" },
        },
      },
    },
    "/integrations/logs": {
      get: {
        tags: ["Integration"],
        summary: "List integration logs",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "service", in: "query", required: false, schema: { type: "string" } }],
        responses: {
          200: { description: "Integration logs" },
          403: { description: "Admin role required" },
        },
      },
    },
    "/integrations/{key}/check": {
      post: {
        tags: ["Integration"],
        summary: "Run duplicate master-data API error and logging readiness checks",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "key", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Connector readiness check" },
          403: { description: "Admin role required" },
          404: { description: "Connector not found" },
        },
      },
    },
    "/integrations/{key}/sync": {
      post: {
        tags: ["Integration"],
        summary: "Run a guarded integration sync and write integration log",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "key", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          201: { description: "Integration sync finished" },
          403: { description: "Admin role required" },
          404: { description: "Connector not found" },
        },
      },
    },
    "/imports": {
      get: {
        tags: ["Import"],
        summary: "List import jobs",
        responses: {
          200: { description: "Import jobs" },
        },
      },
    },
    "/surveys": {
      get: {
        tags: ["Surveys"],
        summary: "List survey definitions",
        responses: {
          200: { description: "Survey list" },
        },
      },
    },
  },
};
