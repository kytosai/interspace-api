const path = require('path');
const { faker } = require('@faker-js/faker');
const _ = require('lodash');
const fs = require('fs');

const db = {
  category: [], // sticky category
  departments: [],
  products: [],
  filters: [],
};

/*
  Generate products
*/
let productId = 1;
const generateProducts = (total = 30) => {
  const products = [];

  for (let i = 1; i <= total; i++) {
    const productItem = {
      id: productId,
      product_name: faker.commerce.productName(),
      product_descriptions: faker.commerce.productDescription(),
      product_tab: [],
      product_price: Number(faker.commerce.price()),
      product_vote: _.random(0.0, 5.0),
    };

    products.push(productItem);
    productId++;
  }

  return products;
};

db.products = generateProducts(30);

try {
  const writeFilePath = path.resolve(__dirname, '../../db/db.json');
  fs.writeFileSync(writeFilePath, JSON.stringify(db));
  console.log(`Generated db success at: ${writeFilePath}`);
} catch (error) {
  console.log('Cannot generate db file!');
  console.log(error);
}
