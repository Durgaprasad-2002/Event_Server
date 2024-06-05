const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://durga:Durga%404c3@cluster0.ez5v0e1.mongodb.net/Calender?retryWrites=true&w=majority"
    );
    console.log("MongoDB connected");
  } catch (err) {
    console.error("DB Error :" + err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
