require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const SECRET = "segredo123";

/* CONFIG */
app.use(express.json());
app.use(express.static("public"));

/* BANCO */
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("🔥 Mongo conectado"))
  .catch(err => console.log(err));

/* MODELS */
const User = mongoose.model("User", {
  email: String,
  senha: String,
  admin: { type: Boolean, default: false }
});

const Product = mongoose.model("Product", {
  nome: String,
  preco: Number,
  estoque: Number
});

const Pedido = mongoose.model("Pedido", {
  produto: String,
  quantidade: Number,
  total: Number,
  status: { type: String, default: "pendente" },
  data: { type: Date, default: Date.now }
});

/* AUTH */
function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ erro: "Sem token" });

  try {
    const decoded = jwt.verify(token, SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ erro: "Token inválido" });
  }
}

async function isAdmin(req, res, next) {
  const user = await User.findById(req.userId);
  if (!user || !user.admin) {
    return res.status(403).json({ erro: "Acesso negado" });
  }
  next();
}

/* ROTAS */
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.post("/register", async (req, res) => {
  const { email, senha } = req.body;
  const hash = await bcrypt.hash(senha, 10);
  await User.create({ email, senha: hash });
  res.json({ msg: "Usuário criado!" });
});

app.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.json({ erro: "Usuário não encontrado" });

  const ok = await bcrypt.compare(senha, user.senha);
  if (!ok) return res.json({ erro: "Senha incorreta" });

  const token = jwt.sign({ id: user._id }, SECRET, { expiresIn: "1d" });

  res.json({ token });
});

/* PRODUTOS */
app.post("/produto", auth, isAdmin, async (req, res) => {
  const { nome, preco, estoque } = req.body;
  const p = await Product.create({ nome, preco, estoque });
  res.json(p);
});

app.get("/produtos", async (req, res) => {
  const produtos = await Product.find();
  res.json(produtos);
});

app.delete("/produto/:id", auth, isAdmin, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ msg: "Deletado" });
});

/* PEDIDOS */
app.post("/pedido", async (req, res) => {
  const { produto, quantidade, preco } = req.body;
  const total = preco * quantidade;

  const pedido = await Pedido.create({
    produto,
    quantidade,
    total
  });

  res.json(pedido);
});

/* PIX */
app.post("/pix", async (req, res) => {
  const { valor } = req.body;

  res.json({
    valor,
    pix: "000201FAKEPIX123456",
    status: "aguardando"
  });
});

app.post("/pagar/:id", async (req, res) => {
  await Pedido.findByIdAndUpdate(req.params.id, {
    status: "pago"
  });

  res.json({ msg: "Pago" });
});

/* DASHBOARD */
app.get("/dashboard", async (req, res) => {
  const pedidos = await Pedido.find();

  const total = pedidos.reduce((acc, p) => acc + p.total, 0);

  const status = {
    pago: pedidos.filter(p => p.status === "pago").length,
    pendente: pedidos.filter(p => p.status === "pendente").length
  };

  res.json({
    totalVendas: total,
    pedidos: pedidos.length,
    status
  });
});

/* SERVER */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Rodando na porta", PORT);
});