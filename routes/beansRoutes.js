const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getMenu, addMenuItem, deleteMenuItem, changeMenuItem } = require('../menu/menu.js');
const { checkProperty, plannedDelivery, isDelivered, checkDelivery, orderValidation, createNewItem, uppdateItem, isAuthenticated } = require('../utils.js');
const { updateUserOrders, findUsers } = require('../users/users.js');
const router = express.Router();


router.get('/api/beans', async (req, res) => {
    try {
        const menu = await getMenu();
        return res.json(menu);
    } catch (error) {
        return res.status(500).json({ message: 'Server error.' })
    }
});

//Lägga till en ny produkt i menyn

router.post(
    '/api/beans/add', isAuthenticated,
    async (req, res) => {
      const { error, newItem } = createNewItem(req.body);
  
      if (error) {
        return res.status(400).json({ message: error });
      }
  
      const menu = await getMenu();
  
      let responseObj = {
        success: true,
        message: 'New item added to menu.',
      };
  
      menu.forEach((item) => {
        if (item.title === newItem.title) {
          responseObj.success = false;
          responseObj.message = 'Item already exists.';
        }
      });
  
      if (responseObj.success) {
        try {
          await addMenuItem(newItem);
          res.status(201).json(responseObj);
        } catch (error) {
          console.error('Error when adding menu item:', error);
          res.status(500).json({ message: 'Error when adding menu item.' });
        }
      } else {
        res.status(400).json(responseObj);
      }
    }
  );

// ta bort item från menyn 

router.delete('/api/beans/:id', async (req, res) => {
    const responseObj = {
        message: 'item deleted',
    }
    try {
        const id = req.params.id;
        const updatedMenu = await deleteMenuItem(id);
        return res.json(responseObj);
    } catch (error) {
        return res.status(500).json({ message: 'Server error.' })
    }
});

// uppdatera item i menyn 

router.put('/api/beans/:id', 
async (req, res) => {
    const id = req.params.id;
    const { error, itemFound, updatedItem } = await changeMenuItem(id, req.body);
  
    if (error) {
        return res.status(400).json({ message: error });
    }

    if (!itemFound) {
        return res.status(404).json({ message: 'Item not found with the given ID.' });
    }

    return res.json({message: 'Item updated!'});
});


// Skicka order
router.post('/api/beans/order', checkProperty('userID'), checkProperty('order'), orderValidation, async (req, res) => {
    const userID = req.body.userID;
    const date = new Date().toLocaleString();
    const newOrder = {
        orderNumber: uuidv4(),
        timeOfOrder: date,
        delivery: plannedDelivery(),
        order: req.body.order,
        totalPrice: res.locals.totalPrice
    }

    const [ user ] = await findUsers('_id', userID);

    if (user) {
        if (req.body.order.length > 0) {
            updateUserOrders(userID, newOrder);
            return res.json(newOrder);
        } else {
            return res.status(400).json({ message: 'Cannot place an empty order.'});
        }
    } else {
        return res.status(404).json({ message: 'User not found.'});
    }

});

// Hämta status för order
router.get('/api/beans/order/status', checkProperty('userID'), checkProperty('orderNumber'), async (req, res) => {
    const userID = req.body.userID;
    const orderNumber = req.body.orderNumber;
    const [ user ] = await findUsers('_id', userID);
    let status = { message: 'No orders.' };

    // Kolla om user och user.orders finns
    if (user && user.orders) {
        user.orders.forEach(order => {
            if (order.orderNumber === orderNumber) {
                status.delivered = isDelivered(order);
                status.message = 'Order has been delivered.';
                
                if (!status.delivered) {
                    const minutes = checkDelivery(order);
                    status.message = `Will be delivered in ${minutes} min.`;
                }

            } else {
                status.message = 'The ordernumber does not exists.';
            }
        });
    } else {
        status.message = 'This user does not exists.';
    }
    
    return res.json(status);
});

module.exports = router;