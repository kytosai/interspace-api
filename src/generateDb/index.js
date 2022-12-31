const path = require('path');
const { faker } = require('@faker-js/faker');
const slugify = require('slugify');
const _ = require('lodash');
const fs = require('fs');
const argv = require('yargs').argv;

const ENV_PRODUCTION = 'production';
const ENV_DEVELOPMENT = 'development';
const APP_ENV = argv.APP_ENV ? argv.APP_ENV : ENV_PRODUCTION;

const BASE_URL = (() => {
  if (APP_ENV === ENV_PRODUCTION) {
    return `https://interspace-api.kytosai.com`;
  }

  return `http://localhost:9050`;
})();

const db = {
  categories: [],
  sticky_categories: [], // sticky category
  departments: [],
  filters: [],
  products: [],
};

/*
  Generate products
*/
let productId = 1;
const generateProducts = (total = 12, categoryId = 1) => {
  const products = [];

  for (let i = 1; i <= total; i++) {
    const productItem = {
      id: productId,
      product_name: faker.commerce.productName(),
      product_descriptions: faker.commerce.productDescription(),
      product_tag: Array.from(new Array(_.random(0, 3))).map(() => {
        return faker.commerce.department();
      }),
      product_price: Number(faker.commerce.price()),
      product_vote: Number(_.random(0, 5, true).toPrecision(2)),
      product_image: faker.image.fashion(512, 512),
      year_of_manufacture: _.random(2019, 2022),
      created_at: faker.date.recent(10),
      category_id: categoryId,
    };

    products.push(productItem);
    productId++;
  }

  return products;
};

/*
  Generate icon static url
*/
const generateStaticCategoryIconUrl = () => {
  const randNumber = _.random(1, 12);
  return `${BASE_URL}/images/icons/cate-${randNumber}.svg`;
};

/*
  Generate category & products
*/
let categoryId = 1;
const generateCategories = (total = 30, parentId = 0) => {
  const categories = [];

  for (let i = 1; i <= total; i++) {
    const categoryName = faker.commerce.department();

    const category = {
      id: categoryId,
      category_name: categoryName,
      category_slug: slugify(categoryName, { lower: true }),
      category_description: faker.lorem.lines(1),
      icon_url: generateStaticCategoryIconUrl(),
      parent_id: parentId,
      childrens: [],
    };

    categories.push(category);
    categoryId++;
  }

  return categories;
};

(() => {
  let dbCategories = generateCategories(12);
  let dbStickyCategories = [];
  let dbProducts = [];

  for (let i = 0; i < dbCategories.length; i++) {
    let randNumberChildTotalCate = _.random(2, 6);
    if (i === 0) {
      randNumberChildTotalCate = 1;
    }

    const childCategoriesLv2 = generateCategories(
      randNumberChildTotalCate,
      dbCategories[i].id,
    );

    for (let j = 0; j < childCategoriesLv2.length; j++) {
      let randNumberChildTotalCate = _.random(3, 6);

      if (i === 0 && j === 0) {
        randNumberChildTotalCate = 6;
      }

      const childCategoriesLv3 = generateCategories(randNumberChildTotalCate, childCategoriesLv2[j].id);

      dbStickyCategories = dbStickyCategories.concat(childCategoriesLv3);

      for (let k = 0; k < childCategoriesLv3.length; k++) {
        // Create product for child lv3
        let randomProduct = 0;

        if (i === 0 && j === 0 && k < childCategoriesLv3.length - 2) {
          randomProduct = _.random(10, 30);
        }

        dbProducts = dbProducts.concat(generateProducts(randomProduct, childCategoriesLv3[k].id));
      }

      childCategoriesLv2[j].childrens = childCategoriesLv3;
    }

    dbCategories[i].childrens = childCategoriesLv2;
  } // end for

  db.categories = dbCategories;
  db.sticky_categories = dbStickyCategories;
  db.sticky_categories.length = 12;
  db.products = dbProducts;
})();

/*
  Generate filters
*/
const filters = [];

/*
  Generate departments
*/
const departments = generateCategories(8);
for (let i = 0; i < departments.length; i++) {
  departments[i].childrens = generateCategories(_.random(4, 10), departments[i].id);
}
db.departments = departments;

try {
  const writeFilePath = path.resolve(__dirname, '../../db/db.json');
  fs.writeFileSync(writeFilePath, JSON.stringify(db));
  console.log(`Generated db success at: ${writeFilePath}`);
} catch (error) {
  console.log('Cannot generate db file!');
  console.log(error);
}
