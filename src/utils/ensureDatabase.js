const { Client } = require("pg");

async function ensureDatabase(config, targetDatabase) {
  const adminConfig = {
    ...config,
    database: config.maintenanceDatabase || "postgres",
  };
  const adminClient = new Client(adminConfig);

  try {
    await adminClient.connect();

    // verify the role has CREATEDB privilege
    const { rows: roleRows } = await adminClient.query(
      `SELECT rolname, rolcreatedb FROM pg_roles WHERE rolname = current_user;`
    );
    const { rolname, rolcreatedb } = roleRows[0] || {};
    if (!rolcreatedb) {
      console.warn(
        `[ensureDatabase] Role "${rolname}" does not have CREATEDB. ` +
          `Ask your DBA to: ALTER ROLE "${rolname}" CREATEDB;`
      );
    }

    // Check if the database already exists
    const { rows } = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1;`,
      [config?.database]
    );

    if (rows.length > 0) {
      console.log(
        `[ensureDatabase] Database "${config?.database}" already exists.`
      );
      return;
    }

    console.log(
      `[ensureDatabase] Database "${config?.database}" does not exist. Creating...`
    );

    await adminClient.query(`CREATE DATABASE "${config?.database}";`);

    console.log(`[ensureDatabase] Database "${config?.database}" created!`);
  } catch (err) {
    // 42P04 = duplicate_database (race: someone else created it between check and create)
    if (err && err.code === "42P04") {
      console.log(
        `[ensureDatabase] Database "${config?.database}" was created by another process. Continuing.`
      );
    } else if (err && err.code === "42501") {
      console.error(
        `[ensureDatabase] Insufficient privilege to create database "${config?.database}". ` +
          `Grant CREATEDB to the role or run as a superuser.`
      );
      throw err;
    } else {
      console.error(`[ensureDatabase] Failed:`, err);
      throw err;
    }
  } finally {
    try {
      await adminClient.end();
    } catch (_) {}
  }
}

module.exports = { ensureDatabase };
