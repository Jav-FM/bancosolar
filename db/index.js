const { Pool } = require("pg");
const moment = require("moment");
require("dotenv").config();

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
  const query = {
    text: "delete from usuarios where id=$1 RETURNING *",
    values: id,
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

const transferirSaldo = async (emisor, receptor, monto) => {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const descontarSaldo = {
      text: "update usuarios set balance = (balance - $1) where nombre = $2",
      values: [monto, emisor],
    };
    await client.query(descontarSaldo);

    const aumentarSaldo = {
      text: "update usuarios set balance = (balance + $1) where nombre = $2",
      values: [monto, receptor],
    };
    await client.query(aumentarSaldo);

    const traerIdEmisor = {
      text: "select * from usuarios where nombre = $1",
      values: [emisor],
    };
    const idEmisor = await client.query(traerIdEmisor);

    const traerIdReceptor = {
      text: "select * from usuarios where nombre = $1",
      values: [receptor],
    };
    const idReceptor = await client.query(traerIdReceptor);

    const registrarTransferencia = {
      text: "insert into transferencias (emisor, receptor, monto, fecha) values ($1, $2, $3, $4)",
      values: [
        idEmisor.rows[0].id,
        idReceptor.rows[0].id,
        monto,
        moment().format("YYYY-MM-DD HH:mm:ss"),
      ],
    };

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
    text: "select t.id, ue.nombre, ur.nombre, t.monto, t.fecha from transferencias t join usuarios ue on t.emisor = ue.id join usuarios ur on t.receptor = ur.id;",
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
