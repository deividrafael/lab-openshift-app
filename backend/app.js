const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 3001;

// Habilita CORS para permitir o React se comunicar com o backend
app.use(cors());

// Configuração do pool do PostgreSQL
const pool = new Pool({
  user: process.env.,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASS,
  port: process.env.PORT,
  
});

// Rota para obter os dados da tabela
app.get('/api/data', async (req, res) => {
  try {
    const result = await pool.query('SELECT sub,tipo, equipamentos, caminho, descricao, valor, unidade, qualidade FROM dados');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao buscar dados');
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
