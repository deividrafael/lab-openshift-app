const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3001;

// Chave secreta para o JWT
const JWT_SECRET = 'sua_chave_secreta';

// Habilita CORS e suporte a JSON
app.use(cors());
app.use(express.json());

// Configuração do pool do PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASS,
  port: process.env.PORT,
  
});


// Função para gerar JWT
const generateToken = (user) => {
  return jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });
};

// Rota para registrar um novo usuário
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  // Verifica se o usuário já existe
  const userExists = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username]);
  if (userExists.rows.length > 0) {
    return res.status(400).json({ error: 'Usuário já existe' });
  }

  // Hash da senha
  const hashedPassword = await bcrypt.hash(password, 10);

  // Inserir o novo usuário no banco de dados
  await pool.query(
    'INSERT INTO usuarios (username, password) VALUES ($1, $2)', 
    [username, hashedPassword]
  );

  // Gerar token JWT para o novo usuário
  const token = generateToken({ username });

  return res.status(201).json({ token });
});

// Rota para login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  // Verificar se o usuário existe
  const user = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username]);
  if (user.rows.length === 0) {
    return res.status(400).json({ error: 'Usuário ou senha incorretos' });
  }

  // Comparar senha
  const validPassword = await bcrypt.compare(password, user.rows[0].password);
  if (!validPassword) {
    return res.status(400).json({ error: 'Usuário ou senha incorretos' });
  }

  // Gerar token JWT
  const token = generateToken({ username });

  return res.json({ token });
});

// Middleware para verificar o token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Rota protegida para buscar os dados
app.get('/api/data', async (req, res) => {
  const data = await pool.query('SELECT sub,tipo, equipamentos, caminho, descricao, valor, unidade, qualidade FROM dados');
  res.json(data.rows);
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});