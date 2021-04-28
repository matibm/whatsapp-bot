var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var producto = new Schema({

    tipo: { type: Schema.Types.String },
    marca: { type: Schema.Types.String },
    precio: { type: Schema.Types.Number },
    email: { type: Schema.Types.String },
    pass: { type: Schema.Types.String },
    cantidad: { type: Schema.Types.Number, default: 0 }


}, { collection: 'productos' });

module.exports = mongoose.model('Producto', producto);