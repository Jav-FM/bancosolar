const { Pool } = require("pg");
const moment = require("moment");
require('dotenv').config()

const pool = new Pool({
  user: process.env.USER,
  host: "localhost",
  password: process.env.PASSWORD,
  database: process.env.DBNAME,
  port: process.env.PORT,
});

const consultarUsuarios = async () => {
  const client = await pool.connect();
  try {
    const result = await client.query("select * from usuarios");
    return {
      ok: true,
      data: result.rows,
    };
  } catch (err) {
    return {
      ok: false,
      data: "Error Database: " + err,
    };
  } finally {
    client.release();
  }
};

const crearUsuario = async (datos) => {
  const client = await pool.connect();
  const query = {
    text: "insert into usuarios (nombre, balance) values ($1, $2) RETURNING *",
    values: datos,
  };
  try {
    const result = await client.query(query);
    return {
      ok: true,
      data: result.rows,
    };
  } catch (err) {
    return {
      ok: false,
      data: "Error Database: " + err,
    };
  } finally {
    client.release();
  }
};

const editarUsuario = async (datos) => {
  const client = await pool.connect();
  const query = {
    text: "update usuarios set nombre=$2, balance=$3 where id=$1 RETURNING *",
    values: datos,
  };
  try {
    const result = await client.query(query);
    return {
      ok: true,
      data: result.rows,
    };
  } catch (err) {
    return {
      ok: false,
      data: "Error Database: " + err,
    };
  } finally {
    client.release();
  }
};

const eliminarUsuario = async (id) => {
  const client = await pool.connect();
  const query = `delete from usuarios where id=${id} RETURNING *`;
  try {
    const result = await client.query(query);
    return {
      ok: true,
      data: result.rows,
    };
  } catch (err) {
    return {
      ok: false,
      data: "Error Database: " + err,
    };
  } finally {
    client.release();
  }
};

const transferirSaldo = async (datos) => {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const descontarSaldo = `update usuarios set balance = (balance - ${+datos[2]}) where nombre = '${
      datos[0]
    }'`;
    await client.query(descontarSaldo);

    const aumentarSaldo = `update usuarios set balance = (balance + ${+datos[2]}) where nombre = '${
      datos[1]
    }'`;
    await client.query(aumentarSaldo);

    const traerIdEmisor = `select * from usuarios where nombre = '${datos[0]}'`;
    const idEmisor = await client.query(traerIdEmisor);

    const traerIdReceptor = `select * from usuarios where nombre = '${datos[1]}'`;
    const idReceptor = await client.query(traerIdReceptor);

    const registrarTransferencia = `insert into transferencias (emisor, receptor, monto, fecha) values (${
      idEmisor.rows[0].id
    }, ${idReceptor.rows[0].id}, ${+datos[2]}, '${moment().format(
      "YYYY-MM-DD HH:mm:ss)"
    )}')`;
    await client.query(registrarTransferencia);

    await client.query("COMMIT");
    return {
      ok: true,
      data: "Transferencia realizada con éxito",
    };
  } catch (err) {
    await client.query("ROLLBACK");
    return {
      ok: false,
      data: "Error Database: " + err,
    };
  }
};

const consultarTransferencias = async () => {
  const client = await pool.connect();
  const query = {
    rowMode: "array",
    text: "select * from transferencias",
  };
  try {
    const result = await client.query(query);
    return {
      ok: true,
      data: result.rows,
    };
  } catch (err) {
    return {
      ok: false,
      data: "Error Database: " + err,
    };
  } finally {
    client.release();
  }
};

module.exports = {
  consultarUsuarios,
  crearUsuario,
  editarUsuario,
  eliminarUsuario,
  transferirSaldo,
  consultarTransferencias,
};
