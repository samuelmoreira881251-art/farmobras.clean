const mongoose = require("mongoose");

const PedidoSchema = new mongoose.Schema({
  nome: String,
  produto: String,
  quantidade: Number,
  data: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Pedido", PedidoSchema);