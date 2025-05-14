// models/Avis.js
import mongoose from 'mongoose';

const avisSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    note: { type: Number, required: true },
    commentaire: { type: String, required: true },
    date: { type: Date, default: Date.now },
    image: String
});

export default mongoose.model('Avis', avisSchema);  // Export ES6