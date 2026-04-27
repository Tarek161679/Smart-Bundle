// geneticAlgorithm.js

class GeneticAlgorithm {
    constructor(products, behavior, ratings, userId) {
        this.products = products;
        this.behavior = behavior.filter(b => b.user_id === userId);
        this.ratings = ratings.filter(r => r.user_id === userId);
        this.userId = userId;
        
        // إعدادات الخوارزمية
        this.populationSize = 20; // عدد الكروموسومات في الجيل الواحد
        this.generations = 50;    // عدد الأجيال
        this.mutationRate = 0.1;  // نسبة الطفرة 10%
        this.chromosomeLength = 5;// كل كروموسوم يحتوي على 5 منتجات (باقة)
    }

    // 1. توليد مجتمع أولي عشوائي
    initPopulation() {
        let population = [];
        for (let i = 0; i < this.populationSize; i++) {
            let chromosome = [];
            for (let j = 0; j < this.chromosomeLength; j++) {
                let randomProduct = this.products[Math.floor(Math.random() * this.products.length)];
                chromosome.push(randomProduct.product_id);
            }
            population.push(chromosome);
        }
        return population;
    }

    // 2. دالة الكفاءة متعددة الأهداف (Multi-Objective Fitness)
    calculateFitness(chromosome) {
        let score = 0;
        let categories = new Set();

        chromosome.forEach(prodId => {
            // الهدف الأول: التفاعل (سلوك المستخدم)
            let prodBehavior = this.behavior.find(b => parseInt(b.product_id) === parseInt(prodId));
            if (prodBehavior) {
                if (prodBehavior.viewed) score += 1;
                if (prodBehavior.clicked) score += 3;
                if (prodBehavior.purchased) score += 10;
            }

            // الهدف الثاني: التقييمات العالية
            let prodRating = this.ratings.find(r => parseInt(r.product_id) === parseInt(prodId));
            if (prodRating) {
                score += (prodRating.rating * 2); // مضاعفة وزن التقييم
            }

            // جمع الفئات لحساب التنوع
            let productDef = this.products.find(p => parseInt(p.product_id) === parseInt(prodId));
            if (productDef) {
                categories.add(productDef.category);
            }
        });

        // الهدف الثالث: التنوع (Diversity) - مكافأة إذا كانت المنتجات من فئات مختلفة
        score += (categories.size * 5);

        // عقوبة خفيفة في حال تكرار نفس المنتج داخل نفس الباقة
        let uniqueProducts = new Set(chromosome);
        if (uniqueProducts.size < this.chromosomeLength) {
            score -= 15; 
        }

        return score;
    }

    // 3. التزاوج (Crossover)
    crossover(parent1, parent2) {
        let crossoverPoint = Math.floor(this.chromosomeLength / 2);
        let child1 = parent1.slice(0, crossoverPoint).concat(parent2.slice(crossoverPoint));
        let child2 = parent2.slice(0, crossoverPoint).concat(parent1.slice(crossoverPoint));
        return [child1, child2];
    }

    // 4. الطفرة (Mutation)
    mutate(chromosome) {
        if (Math.random() < this.mutationRate) {
            let mutationPoint = Math.floor(Math.random() * this.chromosomeLength);
            let randomProduct = this.products[Math.floor(Math.random() * this.products.length)];
            chromosome[mutationPoint] = randomProduct.product_id;
        }
        return chromosome;
    }

    // تشغيل الخوارزمية (Evolution)
    run() {
        let population = this.initPopulation();

        for (let g = 0; g < this.generations; g++) {
            // تقييم المجتمع الحالي
            let fitnessScores = population.map(chromosome => ({
                chromosome: chromosome,
                fitness: this.calculateFitness(chromosome)
            }));

            // ترتيب تنازلي لاختيار الأقوى
            fitnessScores.sort((a, b) => b.fitness - a.fitness);

            let newPopulation = [];
            // الاحتفاظ بأفضل حلين (Elitism)
            newPopulation.push(fitnessScores[0].chromosome);
            newPopulation.push(fitnessScores[1].chromosome);

            // توليد باقي الجيل الجديد
            while (newPopulation.length < this.populationSize) {
                // اختيار عشوائي من النصف الأفضل للتزاوج
                let parent1 = fitnessScores[Math.floor(Math.random() * (this.populationSize / 2))].chromosome;
                let parent2 = fitnessScores[Math.floor(Math.random() * (this.populationSize / 2))].chromosome;
                
                let children = this.crossover(parent1, parent2);
                newPopulation.push(this.mutate(children[0]));
                if (newPopulation.length < this.populationSize) {
                    newPopulation.push(this.mutate(children[1]));
                }
            }
            population = newPopulation;
        }

        // إرجاع أفضل كروموسوم في الجيل الأخير
        let finalScores = population.map(chromosome => ({
            chromosome: chromosome,
            fitness: this.calculateFitness(chromosome)
        })).sort((a, b) => b.fitness - a.fitness);

        return finalScores[0].chromosome;
    }
}

module.exports = GeneticAlgorithm;