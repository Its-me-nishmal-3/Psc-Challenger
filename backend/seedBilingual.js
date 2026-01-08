const mongoose = require('mongoose');
require('dotenv').config();
const Question = require('./models/Question');
const DailyQuiz = require('./models/DailyQuiz');
const Attempt = require('./models/Attempt');

const questions = [
    {
        question: { en: "What is the capital of India?", ml: "ഇന്ത്യയുടെ തലസ്ഥാനം ഏതാണ്?" },
        options: [
            { en: "Mumbai", ml: "മുംബൈ" },
            { en: "New Delhi", ml: "ന്യൂ ഡൽഹി" },
            { en: "Chennai", ml: "ചെന്നൈ" },
            { en: "Kolkata", ml: "കൊൽക്കത്ത" }
        ],
        correctAnswerIndex: 1,
        topic: "GK",
        difficulty: "easy",
        gradeLevel: 5
    },
    {
        question: { en: "Who is the Father of the Nation in India?", ml: "ഇന്ത്യയുടെ രാഷ്ട്രപിതാവ് ആരാണ്?" },
        options: [
            { en: "Nehru", ml: "നെഹ്റു" },
            { en: "Gandhi", ml: "ഗാന്ധിജി" },
            { en: "Patel", ml: "പട്ടേൽ" },
            { en: "Ambedkar", ml: "അംബേദ്കർ" }
        ],
        correctAnswerIndex: 1,
        topic: "History",
        difficulty: "easy",
        gradeLevel: 6
    },
    {
        question: { en: "What is the formula for water?", ml: "വെള്ളത്തിന്റെ രാസസൂത്രം എന്താണ്?" },
        options: [
            { en: "CO2", ml: "CO2" },
            { en: "H2O", ml: "H2O" },
            { en: "O2", ml: "O2" },
            { en: "NaCl", ml: "NaCl" }
        ],
        correctAnswerIndex: 1,
        topic: "Science",
        difficulty: "medium",
        gradeLevel: 8
    },
    {
        question: { en: "Which planet is known as the Red Planet?", ml: "ചുവന്ന ഗ്രഹം എന്നറിയപ്പെടുന്നത് ഏതാണ്?" },
        options: [
            { en: "Venus", ml: "ശുക്രൻ" },
            { en: "Mars", ml: "ചൊവ്വ" },
            { en: "Jupiter", ml: "വ്യാഴം" },
            { en: "Saturn", ml: "ശനി" }
        ],
        correctAnswerIndex: 1,
        topic: "Science",
        difficulty: "medium",
        gradeLevel: 7
    },
    {
        question: { en: "Who wrote the Indian National Anthem?", ml: "ഇന്ത്യൻ ദേശീയഗാനം രചിച്ചത് ആര്?" },
        options: [
            { en: "Tagore", ml: "ടാഗോർ" },
            { en: "Bankim Chandra", ml: "ബങ്കിം ചന്ദ്ര" },
            { en: "Sarojini Naidu", ml: "സരോജിനി നായിഡു" },
            { en: "Premchand", ml: "പ്രേംചന്ദ്" }
        ],
        correctAnswerIndex: 0,
        topic: "GK",
        difficulty: "easy",
        gradeLevel: 6
    },
    {
        question: { en: "What is the square root of 64?", ml: "64 ന്റെ വർഗ്ഗമൂലം എത്ര?" },
        options: [
            { en: "6", ml: "6" },
            { en: "7", ml: "7" },
            { en: "8", ml: "8" },
            { en: "9", ml: "9" }
        ],
        correctAnswerIndex: 2,
        topic: "Math",
        difficulty: "medium",
        gradeLevel: 9
    },
    {
        question: { en: "Which is the largest organ in the human body?", ml: "മനുഷ്യ ശരീരത്തിലെ ഏറ്റവും വലിയ അവയവം ഏതാണ്?" },
        options: [
            { en: "Liver", ml: "കരൾ" },
            { en: "Skin", ml: "തൊലി" },
            { en: "Heart", ml: "ഹൃദയം" },
            { en: "Lungs", ml: "ശ്വാസകോശം" }
        ],
        correctAnswerIndex: 1,
        topic: "Biology",
        difficulty: "hard",
        gradeLevel: 10
    },
    {
        question: { en: "In which year did India get independence?", ml: "ഇന്ത്യക്ക് സ്വാതന്ത്ര്യം ലഭിച്ച വർഷം ഏത്?" },
        options: [
            { en: "1945", ml: "1945" },
            { en: "1947", ml: "1947" },
            { en: "1950", ml: "1950" },
            { en: "1952", ml: "1952" }
        ],
        correctAnswerIndex: 1,
        topic: "History",
        difficulty: "easy",
        gradeLevel: 5
    },
    {
        question: { en: "What is the currency of Japan?", ml: "ജപ്പാന്റെ കറൻസി ഏതാണ്?" },
        options: [
            { en: "Yen", ml: "യെൻ" },
            { en: "Dollar", ml: "ഡോളർ" },
            { en: "Euro", ml: "യൂറോ" },
            { en: "Rupee", ml: "രൂപ" }
        ],
        correctAnswerIndex: 0,
        topic: "GK",
        difficulty: "medium",
        gradeLevel: 9
    },
    {
        question: { en: "Who invented the computer?", ml: "കമ്പ്യൂട്ടർ കണ്ടുപിടിച്ചത് ആര്?" },
        options: [
            { en: "Charles Babbage", ml: "ചാൾസ് ബാബേജ്" },
            { en: "Alan Turing", ml: "അലൻ ടൂറിംഗ്" },
            { en: "Bill Gates", ml: "ബിൽ ഗേറ്റ്സ്" },
            { en: "Steve Jobs", ml: "സ്റ്റീവ് ജോബ്സ്" }
        ],
        correctAnswerIndex: 0,
        topic: "IT",
        difficulty: "medium",
        gradeLevel: 8
    }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // CLEAR OLD DATA because schema changed incompatible
        await Question.deleteMany({});
        await DailyQuiz.deleteMany({});
        await Attempt.deleteMany({});
        console.log('Cleared old data');



        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
