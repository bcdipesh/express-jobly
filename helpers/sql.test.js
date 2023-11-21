"use strict";

const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

describe("sqlForPartialUpdate", function () {
  test("create and return a sql update statement", function () {
    const { setCols, values } = sqlForPartialUpdate(
      { name: "Test", email: "Test@email.com" },
      { name: "username", email: "email" }
    );

    expect(setCols).toBe(`"username"=$1, "email"=$2`);
    expect(values).toEqual(["Test", "Test@email.com"]);
  });

  test("bad request with no update data", function () {
    try {
      sqlForPartialUpdate({}, { name: "username", email: "email" });
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});
