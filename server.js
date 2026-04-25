// server.js

const express = require('express');
const xlsx = require('xlsx');
const cors = require('cors');
const path = require('path');
const GeneticAlgorithm = require('./geneticAlgorithm');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static('public')); // للوصول لملفات الواجهة

console.log("جارِ تحميل البيانات إلى الذاكرة (Caching)...");

// دالة لقراءة ملفات الإكسل وتحويلها إلى JSON
const readExcel = (filename) => {
    try {
        const filePath = path.join(__dirname, 'data', filename);
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } catch (error) {
        console.error(`خطأ في قراءة الملف: ${filename}`, error.message);
        return [];
    }
};

// قراءة البيانات الإجبارية
const products = readExcel('products.xlsx');
const behavior = readExcel('behavior.xlsx');
const ratings = readExcel('ratings.xlsx');
const users = readExcel('users.xlsx');

console.log("تم تحميل البيانات بنجاح!");

// واجهة الـ API لاستقبال رقم المستخدم وتشغيل الخوارزمية
app.get('/api/recommend/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);

    // التحقق من وجود المستخدم
    const userExists = users.find(u => parseInt(u.user_id) === userId);
    if (!userExists) {
        return res.status(404).json({ error: "المستخدم غير موجود" });
    }

    // تهيئة وتشغيل الخوارزمية الجينية
    const ga = new GeneticAlgorithm(products, behavior, ratings, userId);
    const bestChromosome = ga.run(); // سيعيد مصفوفة بأرقام أفضل المنتجات

    // جلب التفاصيل الكاملة للمنتجات الفائزة
    const recommendedProducts = bestChromosome.map(prodId => 
        products.find(p => parseInt(p.product_id) === parseInt(prodId))
    ).filter(p => p !== undefined); // فلترة أي قيم فارغة

    res.json({
        user: userExists,
        recommendations: recommendedProducts
    });
});

app.listen(PORT, () => {
    console.log(`🚀 الخادم يعمل بنجاح على الرابط: http://localhost:${PORT}`);
});