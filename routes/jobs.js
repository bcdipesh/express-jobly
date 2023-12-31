"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureIsAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();

/** POST / { job } => { job }
 *
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: admin
 */

router.post(
  "/",
  ensureLoggedIn,
  ensureIsAdmin,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobNewSchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }

      const job = await Job.create(req.body);
      return res.status(201).json({ job });
    } catch (err) {
      next(err);
    }
  }
);

/** GET / =>
 *   { jobs: [ { id, title, salary, equity, companyHandle }, ...] }
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  try {
    let jobs = await Job.findAll();

    // Destructure query parameters from the request
    const { title, minSalary, hasEquity } = req.query;

    // Filter by title
    if (title) {
      jobs = jobs.filter((job) =>
        job.title.toLowerCase().includes(title.toLowerCase())
      );
    }

    // Filter by minSalary
    if (minSalary) {
      jobs = jobs.filter((job) => job.salary >= minSalary);
    }

    if (hasEquity === "true") {
      jobs = jobs.filter((job) => {
        try {
          let equity = Number(job.equity);
          if (equity > 0) {
            return true;
          }
        } catch (err) {
          return false;
        }
      });
    }

    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

/** GET /[id] => { Job }
 *
 *  Job is { id, title, salary, equity, company }
 *   where company is [{ handle, name, description, numEmployees, logoUrl }]
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  try {
    const job = await Job.get(req.params.id);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity }
 *
 * Returns { id, title, salary, equity }
 *
 * Authorization required: admin
 */

router.patch(
  "/:id",
  ensureLoggedIn,
  ensureIsAdmin,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }

      const job = await Job.update(req.params.id, req.body);
      return res.json({ job });
    } catch (err) {
      return next(err);
    }
  }
);

/** DELETE /[id] => { deleted: id }
 *
 * Authorization: admin
 */

router.delete(
  "/:id",
  ensureLoggedIn,
  ensureIsAdmin,
  async function (req, res, next) {
    try {
      await Job.remove(req.params.id);
      return res.json({ deleted: req.params.id });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
