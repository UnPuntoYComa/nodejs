const express = require('express');
const mysql = require('mysql');
const multer = require('multer');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Configuración de multer para almacenar archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Configuración de la base de datos
const db = mysql.createConnection({
  host: '65.109.88.87',
  user: 'guaterep_dieg_admin',
  password: 'ZXzavvY]Wo(l',
  database: 'guaterep_bodascarlette'
});

// Conectar a la base de datos
db.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos: ', err);
    process.exit(1);
  }
  console.log('Conexión establecida con la base de datos MySQL');
});

// Reintentar conexión en caso de error
db.on('error', (err) => {
  if (err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
    console.log('Reintentando la conexión a la base de datos...');
    db.connect((err) => {
      if (err) {
        console.error('Error al reconectar:', err);
      } else {
        console.log('Conexión restaurada');
      }
    });
  }
});

// Endpoints API

// Obtener invitado por código
app.get('/api/invitado/:codigo_invitado', (req, res) => {
  const codigoInvitado = req.params.codigo_invitado;
  db.query('SELECT * FROM invitado WHERE codigo_invitacion = ?', [codigoInvitado], (error, results) => {
    if (error) {
      console.error('Error al obtener el invitado: ', error);
      return res.status(500).send('Error al obtener el invitado.');
    } 
    if (results.length === 0) {
      return res.status(404).send('El invitado no existe.');
    }
    res.send(results[0]);
  });
});

// Actualizar la confirmación de un invitado
app.put('/api/invitadoPut', (req, res) => {
  const { codigoInvitacion, cantidadConfirmado } = req.body;
  const sql = 'UPDATE invitado SET confirmacion = 1, confirmacion_cantidad = ? WHERE codigo_invitacion = ?';
  const values = [cantidadConfirmado, codigoInvitacion];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error al actualizar el invitado: ', err);
      return res.status(500).send('Error al actualizar la tabla invitado');
    }
    res.json({ id: codigoInvitacion });
  });
});

// Obtener todos los invitados
app.get('/api/invitados', (req, res) => {
  db.query('SELECT * FROM invitado', (error, results) => {
    if (error) {
      console.error('Error al obtener los invitados: ', error);
      return res.status(500).send('Error interno del servidor');
    }
    res.status(200).json({ data: results });
  });
});

// Crear un nuevo invitado
app.post('/api/invitado', (req, res) => {
  const { cantidadInvitado, nombre } = req.body;

  if (!cantidadInvitado || !nombre) {
    return res.status(400).send('Faltan datos requeridos');
  }

  function generarCodigoInvitacion(callback) {
    const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let codigo = "";
    for (let i = 0; i < 8; i++) {
      codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    const query = "SELECT codigo_invitacion FROM invitado WHERE codigo_invitacion = ?";
    db.query(query, [codigo], (err, result) => {
      if (err) throw err;
      if (result.length === 0) {
        callback(codigo);
      } else {
        generarCodigoInvitacion(callback);
      }
    });
  }

  generarCodigoInvitacion((codigoInvitacion) => {
    const query = "INSERT INTO invitado (cantidad_invitado, nombre, codigo_invitacion) VALUES (?, ?, ?)";
    db.query(query, [cantidadInvitado, nombre, codigoInvitacion], (err, result) => {
      if (err) {
        console.error('Error al insertar el invitado: ', err);
        return res.status(500).send('Error al insertar el invitado');
      }
      console.log(`Se ha insertado un nuevo registro con código de invitación ${codigoInvitacion}`);
      res.status(201).json({
        message: `Se ha insertado un nuevo registro con código de invitación ${codigoInvitacion}`,
        codigoInvitacion
      });
    });
  });
});

// Crear un mensaje con un archivo adjunto
app.post('/api/mensaje', upload.single('file'), (req, res) => {
  const { nombre, informacion, mensaje } = req.body;
  
  if (!req.file) {
    return res.status(400).send('No se ha subido ningún archivo');
  }

  const imagen = req.file.buffer;
  const sql = `INSERT INTO mensaje (nombre, imagen_invitado, informacion, mensaje) VALUES (?, ?, ?, ?)`;
  db.query(sql, [nombre, imagen, informacion, mensaje], (err, result) => {
    if (err) {
      console.error('Error al insertar el mensaje: ', err);
      return res.status(500).send('Error al insertar el mensaje');
    }
    console.log(`Mensaje creado con ID ${result.insertId}`);
    res.json({ id: result.insertId });
  });
});

// Obtener todos los mensajes
app.get('/api/mensajes', (req, res) => {
  db.query('SELECT * FROM mensaje', (error, results) => {
    if (error) {
      console.error('Error al obtener los mensajes: ', error);
      return res.status(500).send('Error al obtener los mensajes');
    }
    res.json({ id: results });
  });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor iniciado en http://localhost:${port}`);
});