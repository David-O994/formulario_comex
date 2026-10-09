import mongoose from 'mongoose';

async function connectDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/cintac');
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    process.exit(1);
  }
}

export default connectDB;
