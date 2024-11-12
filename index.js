const express = require('express');
const mysql = require('mysql');
const multer = require('multer');
const cors = require('cors');
const app = express();
const port = 3000;
app.use(cors());
const storage = multer.memoryStorage(); // Configuramos multer para almacenar el archivo en memoria
const upload = multer({ storage: storage });

const db = mysql.createConnection({
  host: '65.109.88.87', // Corrige "locahost" a "localhost"
  user: 'guaterep_dieg_admin',
  password: 'ZXzavvY]Wo(l',
  database: 'guaterep_bodascarlette'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Conexión establecida con la base de datos MySQL');
});

app.use(express.json());
app.get('/api/invitado/:codigo_invitado', (req, res) => {
    const codigoInvitado = req.params.codigo_invitado;
    db.query('SELECT * FROM invitado WHERE codigo_invitacion = ?', codigoInvitado, (error, results) => {
      if (error) {
        console.log(error);
        res.status(500).send('Error al obtener el invitado.');
      } else if (results.length === 0) {
        res.status(404).send('El invitado no existe.');
      } else {
        res.send(results[0]);
      }
    });
  });
  app.put('/api/invitadoPut', (req, res) => {
    const { codigoInvitacion, cantidadConfirmado } = req.body;
    const sql = 'UPDATE invitado SET confirmacion = 1, confirmacion_cantidad = ? WHERE codigo_invitacion = ?';
    const values = [cantidadConfirmado, codigoInvitacion];
    
    db.query(sql, values, (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send('Error al actualizar la tabla invitado');
      } else {
        res.json({ id: codigoInvitacion });
      }
    });
  });
app.get('/api/invitados', (req, res) => {
    db.query('SELECT * FROM invitado', (error, results, fields) => {
      if (error) {
        console.error(error);
        res.status(500).send('Error interno del servidor');
      } else {
        res.status(200).json(results);
      }
    });
  });
app.post('/api/invitado', (req, res) => {
  const { cantidadInvitado,nombre } = req.body;
console.log(cantidadInvitado,nombre,"a");
  function generarCodigoInvitacion(callback) {
    const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let codigo = "";
    for (let i = 0; i < 8; i++) {
      codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    const query = "SELECT codigo_invitacion FROM invitado WHERE codigo_invitacion = ?";
    const values = [codigo];
    db.query(query, values, (err, result) => {
      if (err) throw err;
      if (result.length === 0) {
        // El código no existe en la tabla, es único
        callback(codigo);
      } else {
        // El código ya existe en la tabla, generamos otro código
        generarCodigoInvitacion(callback);
      }
    });
  }

  
  generarCodigoInvitacion((codigoInvitacion) => {
    const query = "INSERT INTO invitado (cantidad_invitado,nombre, codigo_invitacion) VALUES (?,?, ?)";
    const values = [cantidadInvitado,nombre, codigoInvitacion];
    db.query(query, values, (err, result) => {
      if (err) throw err;
      console.log(`Se ha insertado un nuevo registro con código de invitación ${codigoInvitacion}`);
      res.status(201).json({
        message: `Se ha insertado un nuevo registro con código de invitación ${codigoInvitacion}`,
        codigoInvitacion:codigoInvitacion
      });
    });
  });
});
app.post('/api/mensaje', upload.single('file'), (req, res) => {
  const { nombre, informacion, mensaje } = req.body;
  console.log(req.file);
  const imagen = req.file ? req.file.buffer  : null;
  const sql = `INSERT INTO mensaje (nombre, imagen_invitado, informacion, mensaje) VALUES (?, ?, ?, ?)`;
  const values = [nombre, imagen, informacion, mensaje];

  db.query(sql, values, (err, result) => {
    if (err) throw err;
    console.log(`Mensaje creado con ID ${result.insertId}`);
    res.json({ id: result.insertId });
  });  
});
app.get('/api/mensajes', (req, res) => {
        db.query('SELECT * FROM mensaje', (error, results) => {
          if (error) {
            console.log(error);
            res.status(500).send('Error al obtener los mensajes.');
          } else {
            res.json({ id: results });
          }
        });
      });
      
app.listen(port, () => {
  console.log(`Servidor iniciado en http://localhost:${port}`);
});
