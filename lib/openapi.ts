export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "KHUMMELA Reports API",
    description:
      "REST API for managing missing and found person reports on the KHUMMELA platform.",
    version: "1.0.0",
  },
  servers: [{ url: "/api", description: "Current server" }],
  tags: [
    { name: "Missing Reports", description: "Reports for missing persons" },
    { name: "Found Reports", description: "Reports for found persons" },
    { name: "Reports", description: "Cross-type report operations" },
  ],
  components: {
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "authjs.session-token",
        description: "NextAuth.js session cookie",
      },
    },
    schemas: {
      Location: {
        type: "object",
        properties: {
          latitude: { type: "number", example: 34.0837 },
          longitude: { type: "number", example: 74.7973 },
          address: { type: "string", example: "Lal Chowk" },
          city: { type: "string", example: "Srinagar" },
          state: { type: "string", example: "Jammu & Kashmir" },
          country: { type: "string", example: "India" },
          postalCode: { type: "string", example: "190001" },
        },
      },
      MissingReportInput: {
        type: "object",
        required: ["personName"],
        properties: {
          personName: { type: "string", example: "Amir Khan" },
          age: { type: "integer", minimum: 0, maximum: 150, example: 14 },
          gender: {
            type: "string",
            enum: ["MALE", "FEMALE", "OTHER", "UNKNOWN"],
            default: "UNKNOWN",
          },
          description: {
            type: "string",
            example: "Last seen wearing blue school uniform",
          },
          lastSeenAt: {
            type: "string",
            format: "date-time",
            example: "2026-06-20T08:30:00Z",
          },
          location: { $ref: "#/components/schemas/Location" },
          contactName: { type: "string", example: "Fatima Khan" },
          contactPhone: { type: "string", example: "+919876543210" },
          contactEmail: { type: "string", format: "email" },
        },
      },
      FoundReportInput: {
        type: "object",
        properties: {
          age: { type: "integer", minimum: 0, maximum: 150, example: 13 },
          gender: {
            type: "string",
            enum: ["MALE", "FEMALE", "OTHER", "UNKNOWN"],
            default: "UNKNOWN",
          },
          description: {
            type: "string",
            example: "Young boy found near Hazratbal mosque",
          },
          foundAt: {
            type: "string",
            format: "date-time",
            example: "2026-06-21T14:00:00Z",
          },
          location: { $ref: "#/components/schemas/Location" },
          contactName: { type: "string" },
          contactPhone: { type: "string" },
          contactEmail: { type: "string", format: "email" },
        },
      },
      ReportPatchInput: {
        type: "object",
        properties: {
          personName: { type: "string" },
          age: { type: "integer", minimum: 0, maximum: 150 },
          gender: {
            type: "string",
            enum: ["MALE", "FEMALE", "OTHER", "UNKNOWN"],
          },
          description: { type: "string", nullable: true },
          lastSeenAt: { type: "string", format: "date-time", nullable: true },
          foundAt: { type: "string", format: "date-time", nullable: true },
          status: {
            type: "string",
            enum: ["OPEN", "INVESTIGATING", "RESOLVED", "CLOSED"],
            description: "MANAGEMENT role required to change status",
          },
          location: {
            oneOf: [
              { $ref: "#/components/schemas/Location" },
              { type: "null" },
            ],
          },
          contactName: { type: "string", nullable: true },
          contactPhone: { type: "string", nullable: true },
          contactEmail: { type: "string", format: "email", nullable: true },
        },
      },
      ReportResponse: {
        type: "object",
        properties: {
          id: { type: "string" },
          reportType: { type: "string", enum: ["missing", "found"] },
          reporterId: { type: "string" },
          status: {
            type: "string",
            enum: ["OPEN", "INVESTIGATING", "RESOLVED", "CLOSED"],
          },
          gender: { type: "string", enum: ["MALE", "FEMALE", "OTHER", "UNKNOWN"] },
          age: { type: "integer", nullable: true },
          description: { type: "string", nullable: true },
          location: { allOf: [{ $ref: "#/components/schemas/Location" }], nullable: true },
          contactName: { type: "string", nullable: true },
          contactPhone: { type: "string", nullable: true },
          contactEmail: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Error: {
        type: "object",
        properties: { error: { type: "string" } },
      },
    },
  },
  security: [{ sessionCookie: [] }],
  paths: {
    "/reports/missing": {
      post: {
        tags: ["Missing Reports"],
        summary: "Create a missing person report",
        description: "Any authenticated user (USER or MANAGEMENT) may create a report.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MissingReportInput" },
            },
          },
        },
        responses: {
          "201": {
            description: "Report created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { $ref: "#/components/schemas/ReportResponse" } },
                },
              },
            },
          },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "401": { description: "Unauthenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/reports/found": {
      post: {
        tags: ["Found Reports"],
        summary: "Create a found person report",
        description: "Any authenticated user may create a report.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/FoundReportInput" },
            },
          },
        },
        responses: {
          "201": {
            description: "Report created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { $ref: "#/components/schemas/ReportResponse" } },
                },
              },
            },
          },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "401": { description: "Unauthenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/reports": {
      get: {
        tags: ["Reports"],
        summary: "List reports",
        description:
          "USER sees only their own reports. MANAGEMENT sees all reports.",
        parameters: [
          {
            name: "type",
            in: "query",
            schema: { type: "string", enum: ["missing", "found", "all"], default: "all" },
            description: "Filter by report type",
          },
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["OPEN", "INVESTIGATING", "RESOLVED", "CLOSED"] },
          },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1, minimum: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20, minimum: 1, maximum: 100 },
          },
        ],
        responses: {
          "200": {
            description: "Paginated list of reports",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/ReportResponse" } },
                    pagination: {
                      type: "object",
                      properties: {
                        page: { type: "integer" },
                        limit: { type: "integer" },
                        total: { type: "integer" },
                        totalPages: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/reports/{id}": {
      get: {
        tags: ["Reports"],
        summary: "Get a report by ID",
        description: "USER can only fetch their own reports. MANAGEMENT can fetch any.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Report",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { $ref: "#/components/schemas/ReportResponse" } },
                },
              },
            },
          },
          "401": { description: "Unauthenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "403": { description: "Forbidden", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      patch: {
        tags: ["Reports"],
        summary: "Update a report",
        description:
          "USER can update their own reports but cannot change status. MANAGEMENT can update any report including status.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ReportPatchInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated report",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { $ref: "#/components/schemas/ReportResponse" } },
                },
              },
            },
          },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "401": { description: "Unauthenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "403": { description: "Forbidden", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      delete: {
        tags: ["Reports"],
        summary: "Delete a report",
        description: "MANAGEMENT role required.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        deleted: { type: "boolean" },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "403": { description: "Forbidden", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
  },
} as const;
