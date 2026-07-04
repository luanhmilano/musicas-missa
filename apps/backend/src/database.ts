import mongoose from 'mongoose';
import 'dotenv/config';

const uri = process.env.MONGO_URI || "mongodb://localhost:27017/musicas-missa";
const localFallbackUri = "mongodb://127.0.0.1:27017/musicas-missa";

if (!uri) {
  throw new Error("MONGO_URI is not defined");
}

export async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection.asPromise();
  }

  try {
    const connection = await mongoose.connect(uri, {
      family: 4,
    });
    
    console.log("MongoDB conectado com sucesso via Mongoose.");
    return connection;
  } catch (error) {
    if (uri.startsWith("mongodb+srv://")) {
      console.warn("Falha ao resolver a URI Atlas via SRV. Tentando MongoDB local em fallback...");

      try {
        const fallbackConnection = await mongoose.connect(localFallbackUri);

        console.log("MongoDB local conectado com sucesso via Mongoose.");
        return fallbackConnection;
      } catch (fallbackError) {
        console.error("Falha ao conectar no MongoDB:", fallbackError);
        throw fallbackError;
      }
    }

    console.error("Falha ao conectar no MongoDB:", error);
    throw error;
  }
}