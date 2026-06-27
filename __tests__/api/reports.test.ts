import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { Session } from "next-auth";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    missingReport: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    foundReport: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    location: { create: vi.fn() },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { POST as postMissing } from "@/app/api/reports/missing/route";
import { POST as postFound } from "@/app/api/reports/found/route";
import { GET as getReports } from "@/app/api/reports/route";
import {
  GET as getById,
  PATCH as patchById,
  DELETE as deleteById,
} from "@/app/api/reports/[id]/route";

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma, true);

function session(id: string, role: "USER" | "MANAGEMENT"): Session {
  return { user: { id, role, name: null, email: null, image: null }, expires: "" };
}

function req(
  url: string,
  method: string,
  body?: unknown,
): NextRequest {
  return new NextRequest(`http://localhost${url}`, {
    method,
    ...(body !== undefined
      ? {
          body: JSON.stringify(body),
          headers: { "content-type": "application/json" },
        }
      : {}),
  });
}

function idReq(id: string, method: string, body?: unknown) {
  return [req(`/api/reports/${id}`, method, body), { params: Promise.resolve({ id }) }] as const;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── POST /api/reports/missing ─────────────────────────────────────────────────

describe("POST /api/reports/missing", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await postMissing(req("/api/reports/missing", "POST", { personName: "Test" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when personName is missing", async () => {
    mockAuth.mockResolvedValueOnce(session("u1", "USER"));
    const res = await postMissing(req("/api/reports/missing", "POST", {}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/personName/);
  });

  it("returns 400 for invalid gender", async () => {
    mockAuth.mockResolvedValueOnce(session("u1", "USER"));
    const res = await postMissing(
      req("/api/reports/missing", "POST", { personName: "Amir", gender: "ALIEN" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for out-of-range age", async () => {
    mockAuth.mockResolvedValueOnce(session("u1", "USER"));
    const res = await postMissing(
      req("/api/reports/missing", "POST", { personName: "Amir", age: 200 }),
    );
    expect(res.status).toBe(400);
  });

  it("creates a report without location", async () => {
    mockAuth.mockResolvedValueOnce(session("u1", "USER"));
    const created = { id: "r1", personName: "Amir Khan", reporterId: "u1", location: null, createdAt: new Date(), updatedAt: new Date() };
    mockPrisma.missingReport.create.mockResolvedValueOnce(created as never);

    const res = await postMissing(
      req("/api/reports/missing", "POST", { personName: "Amir Khan", age: 14 }),
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.reportType).toBe("missing");
    expect(json.data.personName).toBe("Amir Khan");
  });

  it("creates a location then a report when location is provided", async () => {
    mockAuth.mockResolvedValueOnce(session("u1", "USER"));
    mockPrisma.location.create.mockResolvedValueOnce({ id: "loc1" } as never);
    const created = { id: "r1", personName: "Amir", reporterId: "u1", locationId: "loc1", location: { id: "loc1" }, createdAt: new Date(), updatedAt: new Date() };
    mockPrisma.missingReport.create.mockResolvedValueOnce(created as never);

    const res = await postMissing(
      req("/api/reports/missing", "POST", {
        personName: "Amir",
        location: { city: "Srinagar", country: "India" },
      }),
    );
    expect(res.status).toBe(201);
    expect(mockPrisma.location.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.missingReport.create.mock.calls[0][0].data.locationId).toBe("loc1");
  });
});

// ── POST /api/reports/found ───────────────────────────────────────────────────

describe("POST /api/reports/found", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await postFound(req("/api/reports/found", "POST", {}));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid gender", async () => {
    mockAuth.mockResolvedValueOnce(session("u1", "USER"));
    const res = await postFound(req("/api/reports/found", "POST", { gender: "ROBOT" }));
    expect(res.status).toBe(400);
  });

  it("creates a found report", async () => {
    mockAuth.mockResolvedValueOnce(session("u1", "USER"));
    const created = { id: "f1", reporterId: "u1", gender: "MALE", location: null, createdAt: new Date(), updatedAt: new Date() };
    mockPrisma.foundReport.create.mockResolvedValueOnce(created as never);

    const res = await postFound(
      req("/api/reports/found", "POST", { gender: "MALE", description: "Young boy" }),
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.reportType).toBe("found");
  });
});

// ── GET /api/reports ──────────────────────────────────────────────────────────

describe("GET /api/reports", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await getReports(req("/api/reports", "GET"));
    expect(res.status).toBe(401);
  });

  it("USER only sees own reports (reporterId filter applied)", async () => {
    mockAuth.mockResolvedValueOnce(session("u1", "USER"));
    mockPrisma.missingReport.findMany.mockResolvedValueOnce([] as never);
    mockPrisma.missingReport.count.mockResolvedValueOnce(0 as never);
    mockPrisma.foundReport.findMany.mockResolvedValueOnce([] as never);
    mockPrisma.foundReport.count.mockResolvedValueOnce(0 as never);

    await getReports(req("/api/reports", "GET"));

    const missingWhere = mockPrisma.missingReport.findMany.mock.calls[0][0].where;
    expect(missingWhere).toMatchObject({ reporterId: "u1" });
  });

  it("MANAGEMENT sees all reports (no reporterId filter)", async () => {
    mockAuth.mockResolvedValueOnce(session("mgr", "MANAGEMENT"));
    mockPrisma.missingReport.findMany.mockResolvedValueOnce([] as never);
    mockPrisma.missingReport.count.mockResolvedValueOnce(0 as never);
    mockPrisma.foundReport.findMany.mockResolvedValueOnce([] as never);
    mockPrisma.foundReport.count.mockResolvedValueOnce(0 as never);

    await getReports(req("/api/reports", "GET"));

    const missingWhere = mockPrisma.missingReport.findMany.mock.calls[0][0].where;
    expect(missingWhere).not.toHaveProperty("reporterId");
  });

  it("filters by type=missing (only queries missingReport)", async () => {
    mockAuth.mockResolvedValueOnce(session("u1", "USER"));
    mockPrisma.missingReport.findMany.mockResolvedValueOnce([] as never);
    mockPrisma.missingReport.count.mockResolvedValueOnce(0 as never);

    await getReports(req("/api/reports?type=missing", "GET"));

    expect(mockPrisma.missingReport.findMany).toHaveBeenCalledTimes(1);
    expect(mockPrisma.foundReport.findMany).not.toHaveBeenCalled();
  });

  it("filters by type=found (only queries foundReport)", async () => {
    mockAuth.mockResolvedValueOnce(session("u1", "USER"));
    mockPrisma.foundReport.findMany.mockResolvedValueOnce([] as never);
    mockPrisma.foundReport.count.mockResolvedValueOnce(0 as never);

    await getReports(req("/api/reports?type=found", "GET"));

    expect(mockPrisma.foundReport.findMany).toHaveBeenCalledTimes(1);
    expect(mockPrisma.missingReport.findMany).not.toHaveBeenCalled();
  });

  it("returns paginated response", async () => {
    mockAuth.mockResolvedValueOnce(session("u1", "USER"));
    const row = { id: "r1", reporterId: "u1", createdAt: new Date(), updatedAt: new Date() };
    mockPrisma.missingReport.findMany.mockResolvedValueOnce([row] as never);
    mockPrisma.missingReport.count.mockResolvedValueOnce(1 as never);
    mockPrisma.foundReport.findMany.mockResolvedValueOnce([] as never);
    mockPrisma.foundReport.count.mockResolvedValueOnce(0 as never);

    const res = await getReports(req("/api/reports?type=all&page=1&limit=10", "GET"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.pagination).toMatchObject({ page: 1, limit: 10 });
    expect(json.data[0].reportType).toBe("missing");
  });
});

// ── GET /api/reports/:id ──────────────────────────────────────────────────────

describe("GET /api/reports/:id", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const [r, p] = idReq("r1", "GET");
    const res = await getById(r, p);
    expect(res.status).toBe(401);
  });

  it("returns 404 when report does not exist", async () => {
    mockAuth.mockResolvedValueOnce(session("u1", "USER"));
    mockPrisma.missingReport.findUnique.mockResolvedValueOnce(null as never);
    mockPrisma.foundReport.findUnique.mockResolvedValueOnce(null as never);

    const [r, p] = idReq("nonexistent", "GET");
    const res = await getById(r, p);
    expect(res.status).toBe(404);
  });

  it("returns 403 when USER tries to view another user's report", async () => {
    mockAuth.mockResolvedValueOnce(session("u2", "USER"));
    mockPrisma.missingReport.findUnique.mockResolvedValueOnce({
      id: "r1", reporterId: "u1", location: null, createdAt: new Date(), updatedAt: new Date(),
    } as never);

    const [r, p] = idReq("r1", "GET");
    const res = await getById(r, p);
    expect(res.status).toBe(403);
  });

  it("returns 200 when USER views their own report", async () => {
    mockAuth.mockResolvedValueOnce(session("u1", "USER"));
    mockPrisma.missingReport.findUnique.mockResolvedValueOnce({
      id: "r1", reporterId: "u1", personName: "Amir", location: null, createdAt: new Date(), updatedAt: new Date(),
    } as never);

    const [r, p] = idReq("r1", "GET");
    const res = await getById(r, p);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.reportType).toBe("missing");
  });

  it("returns 200 when MANAGEMENT views any report", async () => {
    mockAuth.mockResolvedValueOnce(session("mgr", "MANAGEMENT"));
    mockPrisma.missingReport.findUnique.mockResolvedValueOnce({
      id: "r1", reporterId: "u1", location: null, createdAt: new Date(), updatedAt: new Date(),
    } as never);

    const [r, p] = idReq("r1", "GET");
    const res = await getById(r, p);
    expect(res.status).toBe(200);
  });
});

// ── PATCH /api/reports/:id ────────────────────────────────────────────────────

describe("PATCH /api/reports/:id", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const [r, p] = idReq("r1", "PATCH", {});
    const res = await patchById(r, p);
    expect(res.status).toBe(401);
  });

  it("returns 404 when report not found", async () => {
    mockAuth.mockResolvedValueOnce(session("u1", "USER"));
    mockPrisma.missingReport.findUnique.mockResolvedValueOnce(null as never);
    mockPrisma.foundReport.findUnique.mockResolvedValueOnce(null as never);

    const [r, p] = idReq("nonexistent", "PATCH", {});
    const res = await patchById(r, p);
    expect(res.status).toBe(404);
  });

  it("returns 403 when USER tries to update another user's report", async () => {
    mockAuth.mockResolvedValueOnce(session("u2", "USER"));
    mockPrisma.missingReport.findUnique.mockResolvedValueOnce({
      id: "r1", reporterId: "u1", location: null, createdAt: new Date(), updatedAt: new Date(),
    } as never);

    const [r, p] = idReq("r1", "PATCH", { personName: "New Name" });
    const res = await patchById(r, p);
    expect(res.status).toBe(403);
  });

  it("returns 403 when USER tries to change status", async () => {
    mockAuth.mockResolvedValueOnce(session("u1", "USER"));
    mockPrisma.missingReport.findUnique.mockResolvedValueOnce({
      id: "r1", reporterId: "u1", location: null, createdAt: new Date(), updatedAt: new Date(),
    } as never);

    const [r, p] = idReq("r1", "PATCH", { status: "RESOLVED" });
    const res = await patchById(r, p);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/MANAGEMENT/);
  });

  it("allows USER to update their own report fields", async () => {
    mockAuth.mockResolvedValueOnce(session("u1", "USER"));
    mockPrisma.missingReport.findUnique.mockResolvedValueOnce({
      id: "r1", reporterId: "u1", location: null, createdAt: new Date(), updatedAt: new Date(),
    } as never);
    mockPrisma.missingReport.update.mockResolvedValueOnce({
      id: "r1", reporterId: "u1", personName: "Updated", location: null, createdAt: new Date(), updatedAt: new Date(),
    } as never);

    const [r, p] = idReq("r1", "PATCH", { personName: "Updated" });
    const res = await patchById(r, p);
    expect(res.status).toBe(200);
  });

  it("allows MANAGEMENT to change status", async () => {
    mockAuth.mockResolvedValueOnce(session("mgr", "MANAGEMENT"));
    mockPrisma.missingReport.findUnique.mockResolvedValueOnce({
      id: "r1", reporterId: "u1", location: null, createdAt: new Date(), updatedAt: new Date(),
    } as never);
    mockPrisma.missingReport.update.mockResolvedValueOnce({
      id: "r1", reporterId: "u1", status: "RESOLVED", location: null, createdAt: new Date(), updatedAt: new Date(),
    } as never);

    const [r, p] = idReq("r1", "PATCH", { status: "RESOLVED" });
    const res = await patchById(r, p);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.status).toBe("RESOLVED");
  });
});

// ── DELETE /api/reports/:id ───────────────────────────────────────────────────

describe("DELETE /api/reports/:id", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const [r, p] = idReq("r1", "DELETE");
    const res = await deleteById(r, p);
    expect(res.status).toBe(401);
  });

  it("returns 403 when USER tries to delete", async () => {
    mockAuth.mockResolvedValueOnce(session("u1", "USER"));
    const [r, p] = idReq("r1", "DELETE");
    const res = await deleteById(r, p);
    expect(res.status).toBe(403);
  });

  it("returns 404 when MANAGEMENT tries to delete nonexistent report", async () => {
    mockAuth.mockResolvedValueOnce(session("mgr", "MANAGEMENT"));
    mockPrisma.missingReport.findUnique.mockResolvedValueOnce(null as never);
    mockPrisma.foundReport.findUnique.mockResolvedValueOnce(null as never);

    const [r, p] = idReq("nonexistent", "DELETE");
    const res = await deleteById(r, p);
    expect(res.status).toBe(404);
  });

  it("deletes a missing report as MANAGEMENT", async () => {
    mockAuth.mockResolvedValueOnce(session("mgr", "MANAGEMENT"));
    mockPrisma.missingReport.findUnique.mockResolvedValueOnce({
      id: "r1", reporterId: "u1", location: null, createdAt: new Date(), updatedAt: new Date(),
    } as never);
    mockPrisma.missingReport.delete.mockResolvedValueOnce({ id: "r1" } as never);

    const [r, p] = idReq("r1", "DELETE");
    const res = await deleteById(r, p);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual({ id: "r1", deleted: true });
  });

  it("deletes a found report as MANAGEMENT", async () => {
    mockAuth.mockResolvedValueOnce(session("mgr", "MANAGEMENT"));
    mockPrisma.missingReport.findUnique.mockResolvedValueOnce(null as never);
    mockPrisma.foundReport.findUnique.mockResolvedValueOnce({
      id: "f1", reporterId: "u1", location: null, createdAt: new Date(), updatedAt: new Date(),
    } as never);
    mockPrisma.foundReport.delete.mockResolvedValueOnce({ id: "f1" } as never);

    const [r, p] = idReq("f1", "DELETE");
    const res = await deleteById(r, p);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual({ id: "f1", deleted: true });
  });
});
