// const { PrismaClient } = require('@prisma/client');

// const db = new PrismaClient();

// async function removeDuplicates() {
//   try {
//     const categories = await db.category.findMany();
//     const uniqueCategories = new Set();
//     const duplicates = [];

//     for (const category of categories) {
//       if (uniqueCategories.has(category.name)) {
//         duplicates.push(category.id);
//       } else {
//         uniqueCategories.add(category.name);
//       }
//     }

//     await db.category.deleteMany({
//       where: {
//         id: { in: duplicates },
//       },
//     });

//     console.log('Duplicates removed successfully');
//   } catch (error) {
//     console.error('Error removing duplicates:', error);
//   } finally {
//     await db.$disconnect();
//   }
// }

// removeDuplicates();