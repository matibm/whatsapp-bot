var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var subscripcion = new Schema({

    fecha_creacion: { type: Schema.Types.Number, default: Date.now() },
    producto: { type: Schema.Types.ObjectId, ref: 'Producto' },
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario' },
    activo: { type: Schema.Types.Boolean, default: false },
    eliminado: { type: Schema.Types.Boolean, default: false },
    pendiente_pago: { type: Schema.Types.Boolean, default: false },

}, { collection: 'subscripciones' });

module.exports = mongoose.model('Subscripcion', subscripcion);