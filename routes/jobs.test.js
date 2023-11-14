"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "new",
    salary: 1000,
    equity: 1,
    companyHandle: "c1",
  };

  test("ok for admins", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toBe(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        ...newJob,
        equity: "1",
      },
    });
  });

  test("unauthorized for non admins", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toBe(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "new",
        salary: 2000,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        ...newJob,
        equity: "1",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "job 1",
          salary: 1000,
          equity: "0",
          companyHandle: "c1",
        },
        {
          id: expect.any(Number),
          title: "job 2",
          salary: 2000,
          equity: "1",
          companyHandle: "c2",
        },
        {
          id: expect.any(Number),
          title: "job 3",
          salary: 3000,
          equity: "1",
          companyHandle: "c2",
        },
      ],
    });
  });

  test("test title filter", async function () {
    const resp = await request(app).get("/jobs?title=job 1");
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "job 1",
          salary: 1000,
          equity: "0",
          companyHandle: "c1",
        },
      ],
    });
  });

  test("test minSalary filter", async function () {
    const resp = await request(app).get("/jobs?minSalary=2000");
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "job 2",
          salary: 2000,
          equity: "1",
          companyHandle: "c2",
        },
        {
          id: expect.any(Number),
          title: "job 3",
          salary: 3000,
          equity: "1",
          companyHandle: "c2",
        },
      ],
    });
  });

  test("list jobs with non-zero equity if hasEquity is true", async function () {
    const resp = await request(app).get("/jobs?hasEquity=true");
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "job 2",
          salary: 2000,
          equity: "1",
          companyHandle: "c2",
        },
        {
          id: expect.any(Number),
          title: "job 3",
          salary: 3000,
          equity: "1",
          companyHandle: "c2",
        },
      ],
    });
  });

  test("list all jobs if hasEquity is false", async function () {
    const resp = await request(app).get("/jobs?hasEquity=false");
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "job 1",
          salary: 1000,
          equity: "0",
          companyHandle: "c1",
        },
        {
          id: expect.any(Number),
          title: "job 2",
          salary: 2000,
          equity: "1",
          companyHandle: "c2",
        },
        {
          id: expect.any(Number),
          title: "job 3",
          salary: 3000,
          equity: "1",
          companyHandle: "c2",
        },
      ],
    });
  });

  test("list all jobs if hasEquity is missing", async function () {
    const resp = await request(app).get("/jobs?");
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "job 1",
          salary: 1000,
          equity: "0",
          companyHandle: "c1",
        },
        {
          id: expect.any(Number),
          title: "job 2",
          salary: 2000,
          equity: "1",
          companyHandle: "c2",
        },
        {
          id: expect.any(Number),
          title: "job 3",
          salary: 3000,
          equity: "1",
          companyHandle: "c2",
        },
      ],
    });
  });

  test("works with all filters combined", async function () {
    const resp = await request(app).get(
      "/jobs?title=job&minSalary=1000&hasEquity=true"
    );
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "job 2",
          salary: 2000,
          equity: "1",
          companyHandle: "c2",
        },
        {
          id: expect.any(Number),
          title: "job 3",
          salary: 3000,
          equity: "1",
          companyHandle: "c2",
        },
      ],
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app).get("/jobs");
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get("/jobs/1");
    expect(resp.body).toEqual({
      job: {
        id: 1,
        title: "job 1",
        salary: 1000,
        equity: "0",
        company: {
          handle: "c1",
          name: "C1",
          numEmployees: 1,
          description: "Desc1",
          logoUrl: "http://c1.img",
        },
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get("/jobs/100");
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admins", async function () {
    const resp = await request(app)
      .patch("/jobs/1")
      .send({
        title: "new job 1",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      job: {
        id: 1,
        title: "new job 1",
        salary: 1000,
        equity: "0",
        companyHandle: "c1",
      },
    });
  });

  test("unauth for non admins", async function () {
    const resp = await request(app)
      .patch("/jobs/1")
      .send({
        title: "new job 1",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).patch("/jobs/1").send({
      title: "new job 1",
    });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
      .patch("/jobs/100")
      .send({
        title: "new job 1",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const resp = await request(app)
      .patch("/jobs/1")
      .send({
        id: 100,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on companyHandle change attempt", async function () {
    const resp = await request(app)
      .patch("/jobs/1")
      .send({
        companyHandle: "c2",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
      .patch("/jobs/1")
      .send({
        salary: "1000",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admins", async function () {
    const resp = await request(app)
      .delete("/jobs/1")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: "1" });
  });

  test("unauth for non admins", async function () {
    const resp = await request(app)
      .delete("/jobs/1")
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).delete("/jobs/1");
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
      .delete("/jobs/100")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
