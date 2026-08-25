const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const productModel = require("./models/product-model");
require("dotenv").config();

const categories = ["T-Shirt", "Shirt", "Women", "Bags", "Shoes", "Watches"];
const ITEMS_PER_CATEGORY = 10;
const uploadDir = path.join(__dirname, "public", "images", "uploads");

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

async function fetchImageBuffer(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch ${url}`);
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        console.error("Error fetching image:", error);
        return null;
    }
}

async function seedDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/scatch");
        console.log("Connected to MongoDB for seeding...");

        // Ensure at least 10 items per category
        for (let category of categories) {
            console.log(`\nChecking category: ${category}`);
            const currentCount = await productModel.countDocuments({ category });
            const needed = Math.max(0, ITEMS_PER_CATEGORY - currentCount);
            
            console.log(`Currently has ${currentCount} products. Need to add ${needed}.`);
            
            for (let i = 0; i < needed; i++) {
                const imageUrl = `https://picsum.photos/400/500?random=${Date.now() + i}`;
                console.log(`Fetching image for ${category} ${i + 1}/${needed}: ${imageUrl}`);
                
                const imageBuffer = await fetchImageBuffer(imageUrl);
                
                if (imageBuffer) {
                    const price = Math.floor(Math.random() * (5000 - 500) + 500);
                    const discount = Math.floor(price * (Math.random() * 0.3)); // up to 30% discount
                    
                    const filename = `seed_${category.toLowerCase()}_${Date.now()}_${i}.jpg`;
                    fs.writeFileSync(path.join(uploadDir, filename), imageBuffer);
                    
                    const newProduct = new productModel({
                        name: `Stylish ${category} ${i + 1}`,
                        price: price,
                        discount: discount,
                        category: category,
                        image: filename,
                        bgcolor: "#" + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
                        panelcolor: "#" + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
                        textcolor: "#ffffff",
                        brand: "Generic",
                        flashSale: Math.random() > 0.7, // 30% chance of being in flash sale
                        collections: Math.random() > 0.5 ? ["flash-deals", "todays-for-you", "elegant-fashion", "similar-items"] : []
                    });
                    
                    await newProduct.save();
                    console.log(`Saved new ${category} product!`);
                } else {
                    console.log(`Failed to save ${category} product due to image fetch error.`);
                }
            }
        }
        
        console.log("\nSeeding complete!");
        mongoose.disconnect();
    } catch (error) {
        console.error("Seeding error:", error);
        mongoose.disconnect();
    }
}

seedDatabase();
