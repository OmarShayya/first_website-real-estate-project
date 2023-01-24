var mongoose = require('mongoose');
var Schema = mongoose.Schema;

userSchema = new Schema( {
	
	unique_id: Number,
	email: String,
	username: String,
	password: String,
	passwordConf: String,
	isAdmin: {
		type: Boolean,
		default: false
	},
	// pp: {
    //     data: Buffer,
    //     contentType: String
    // }
}),
user = mongoose.model('user', userSchema);

module.exports = user;