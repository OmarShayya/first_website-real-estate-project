const mongoose = require("mongoose");

const landsschema = new mongoose.Schema({
ownerid:Number,
  Title: String,
  Description: String,
  location: String,
  Price: Number,
  image: {
    data: Buffer,
    contentType: String,
  },
  Bedrooms: Number,
  Bathrooms: Number,
  SquareFt: Number,
  Type: String,
});

module.exports = new mongoose.model("Land", landsschema);
