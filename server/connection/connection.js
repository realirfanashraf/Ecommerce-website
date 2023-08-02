// Mongoose Database Connection

const mongoose = require('mongoose');

/**
 * Establishes a connection to the MongoDB database using the provided connection URI.
 * @returns {Promise} A promise that resolves to the database connection.
 */
const connectDB = async () => {
  try {
    // Connect to MongoDB using the provided connection URI
    const connection = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1); // Exit with failure
  }
};

module.exports = connectDB;
