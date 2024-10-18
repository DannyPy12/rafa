
const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();

// Habilitar CORS
app.use(cors({
    origin: '*', // Cambia esto al dominio donde se hospeda tu frontend
    methods: ['GET', 'POST']
}));
app.use(express.json());

// Conexión a la base de datos
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,  
    database: process.env.DB_NAME
});

// Endpoint de login de administrador
app.post('/api/admin-login', (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM admins WHERE username = ?', [username], (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Error en el servidor.');
        }

        if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'Usuario no encontrado.' });
        }

        const admin = results[0];
        bcrypt.compare(password, admin.password, (err, isMatch) => {
            if (err || !isMatch) {
                return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
            }
            res.json({ success: true });
        });
    });
});

// Endpoint para guardar reportes
app.post('/api/reportes', (req, res) => {
    const { service, date, price, received, change } = req.body;

    // Validar entradas
    if (!service || !date || !price || !received || !change) {
        return res.status(400).json({ success: false, message: 'Faltan datos necesarios.' });
    }

    const query = 'INSERT INTO reportes (service, date, price, received, change) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [service, date, price, received, change], (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Error al guardar el reporte.');
        }
        res.status(201).json({ success: true });
    });
});

// Cerrar la conexión a la base de datos al finalizar el servidor
process.on('SIGINT', () => {
    db.end((err) => {
        if (err) {
            console.error('Error al cerrar la conexión a la base de datos', err);
        } else {
            console.log('Conexión a la base de datos cerrada.');
        }
        process.exit();
    });
});

app.listen(3000, () => {
    console.log('Servidor escuchando en el puerto 3000');
});
