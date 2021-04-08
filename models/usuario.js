var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var usuario = new Schema({

    nombre: { type: Schema.Types.String },
    tel: { type: Schema.Types.String },
    email: { type: Schema.Types.String }

}, { collection: 'usuarios' });

module.exports = mongoose.model('Usuario', usuario);