import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.MONGO_URI;

export const connectDB = async () => {
    try {
        await mongoose.connect(connectionString);
        console.log("MongoDB conectado exitosamente");
        console.log("Base conectada:", mongoose.connection.name);
    } catch (error) {
        console.error('Error conectando a MongoDB:', error.message);
        process.exit(1);
    }
};