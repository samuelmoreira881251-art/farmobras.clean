const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  preco: { type: Number, required: true },
  estoque: { type: Number, default: 0 }
});

module.exports = mongoose.model("Product", ProductSchema);