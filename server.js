const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const apiRutas = require('../api/rutas');
app.use('/api/v1', apiRutas);

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor unificado corriendo en puerto ${PORT}`);
    console.log(`Tu página visual está en: http://40.233.3.26:${PORT}`);
    console.log(`Tu API de datos está en: http://40.233.3.26:${PORT}/api/v1/atletas`);
});