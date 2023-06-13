const nedb = require('nedb-promise');
const menuDB = new nedb({ filename: 'menu.db', autoload: true });
const { createDB } = require('../createDB.js');

createDB('/menu/menu.json', menuDB);

async function getMenu() {
    const menu = await menuDB.find({});
    return menu;
}

async function findMenuItem(id) {
    return await menuDB.findOne({ id: id });
}

async function addMenuItem(item) {
    try {
      return await menuDB.insert(item);
    } catch (error) {
      console.error('Error when adding menu item:', error);
      throw error;
    }
  }

async function deleteMenuItem(id) {
    return await menuDB.remove({ id: id }, {})

}

async function changeMenuItem(id, updatedAttributes) {
    const updatedCount = await menuDB.update({ id: id }, updatedAttributes);

    if (updatedCount === 0) {
        return { itemFound: false, updatedItem: null };
    }

    const updatedItem = await menuDB.find({ id: id });
    return { itemFound: true, updatedItem: updatedItem };
}

module.exports = {
    getMenu,
    findMenuItem,
    addMenuItem,
    deleteMenuItem,
    changeMenuItem
}