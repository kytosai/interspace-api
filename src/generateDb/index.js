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
  products: [],
  categories: [],
  categories_tree: [],
  sticky_categories: [], // sticky category
  departments: [],
  filters: [],
  keywords: [],
};

const generateStaticProductImageUrl = () => {
  const randNumber = _.random(1, 17);
  return `${BASE_URL}/images/products/p-${randNumber}.jpg`;
};

/*
  Generate products
*/
let productId = 1;
let manufacture = new Set();
const generateProducts = (total = 12, categoryId = 1) => {
  const products = [];

  for (let i = 1; i <= total; i++) {
    const yearOfManuacturing = _.random(2009, 2022);
    manufacture.add(yearOfManuacturing);

    const productName =
      faker.commerce.productName() + ' ' + faker.lorem.words(_.random(2, 8));

    const productItem = {
      id: productId,
      product_name: productName,
      product_slug: slugify(productName, { lower: true }),
      product_descriptions: faker.lorem.words(_.random(2, 14)),
      product_tag: Array.from(new Array(_.random(0, 3))).map(() => {
        return faker.commerce.department();
      }),
      product_price: Number(_.random(10, 120, true).toFixed(2)),
      product_vote: Number(_.random(2, 5, true).toFixed(2)),
      product_image: generateStaticProductImageUrl(),
      year_of_manufacture: yearOfManuacturing,
      created_at: new Date(faker.date.recent(10)).getTime(),
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
let dbCategories = [];
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
    dbCategories.push(category);
    categoryId++;
  }

  return categories;
};

(() => {
  let dbCategoriesTree = generateCategories(12);
  let dbStickyCategories = [];
  let dbProducts = [];

  for (let i = 0; i < dbCategoriesTree.length; i++) {
    let randNumberChildTotalCate = _.random(2, 6);
    if (i === 0) {
      randNumberChildTotalCate = 1;
    }

    const childCategoriesLv2 = generateCategories(
      randNumberChildTotalCate,
      dbCategoriesTree[i].id,
    );

    for (let j = 0; j < childCategoriesLv2.length; j++) {
      let randNumberChildTotalCate = _.random(3, 6);

      if (i === 0 && j === 0) {
        randNumberChildTotalCate = 6;
      }

      const childCategoriesLv3 = generateCategories(
        randNumberChildTotalCate,
        childCategoriesLv2[j].id,
      );

      dbStickyCategories = dbStickyCategories.concat(childCategoriesLv3);

      for (let k = 0; k < childCategoriesLv3.length; k++) {
        // Create product for child lv3
        let randomProduct = 0;

        if (i === 0 && j === 0 && k < childCategoriesLv3.length - 2) {
          randomProduct = _.random(10, 30);
        }

        dbProducts = dbProducts.concat(
          generateProducts(randomProduct, childCategoriesLv3[k].id),
        );
      }

      childCategoriesLv2[j].childrens = childCategoriesLv3;
    }

    dbCategoriesTree[i].childrens = childCategoriesLv2;
  } // end for

  db.categories_tree = dbCategoriesTree;
  db.sticky_categories = dbStickyCategories;
  db.sticky_categories.length = 12;
  db.products = dbProducts;
})();

/*
  Generate filters
*/
(() => {
  const dbFilters = [];

  dbFilters.push({
    key: 'brand',
    name: 'Brand',
    list: [
      {
        key: 'samsung',
        name: 'Samsung',
      },
      {
        key: 'apple',
        name: 'Apple',
      },
      {
        key: 'sony',
        name: 'Sony',
      },
      {
        key: 'sony',
        name: 'Sony',
      },
    ],
  });

  dbFilters.push({
    key: 'year_of_manufacture',
    name: 'Year of manufacture',
    list: (() => {
      let list = [];

      for (item of manufacture) {
        list.push({
          key: item + '',
          name: item + '',
        });
      }

      list = list.sort((item1, item2) => {
        return Number(item1.name) - Number(item2.name);
      });

      return list;
    })(),
  });

  db.filters = dbFilters;
})();

/*
  Generate departments
*/
let departmentId = 1;
const generateDepartments = (total = 30, parentId = 0) => {
  const departments = [];

  for (let i = 1; i <= total; i++) {
    const departmentName = faker.commerce.department();

    const category = {
      id: departmentId,
      department_name: departmentName,
      department_slug: slugify(departmentName, { lower: true }),
      department_description: faker.lorem.lines(1),
      icon_url: generateStaticCategoryIconUrl(),
      parent_id: parentId,
      childrens: [],
    };

    departments.push(category);
    departmentId++;
  }

  return departments;
};

const departments = generateDepartments(8);
for (let i = 0; i < departments.length; i++) {
  departments[i].childrens = generateDepartments(_.random(4, 10), departments[i].id);
}
db.departments = departments;

/*
  Generate keywords
*/
(() => {
  const dbKeywords = [];

  for (let i = 1; i <= 200; i++) {
    const random = _.random(1, 4);
    const keyword = (() => {
      if (random === 1) {
        return faker.commerce.department();
      }

      return faker.commerce.productName();
    })();

    dbKeywords.push({
      keyword,
    });
  }

  db.keywords = dbKeywords;
})();

/*
  Setup all catregories
*/
db.categories = dbCategories;

try {
  const writeFilePath = path.resolve(__dirname, '../../db/db.json');
  fs.writeFileSync(writeFilePath, JSON.stringify(db));
  console.log(`Generated db success at: ${writeFilePath}`);
} catch (error) {
  console.log('Cannot generate db file!');
  console.log(error);
}
