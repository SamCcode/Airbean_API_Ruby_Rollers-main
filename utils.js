const { findMenuItem } = require('./menu/menu.js')
const Joi = require('joi');
const jwt = require('jsonwebtoken');
require('dotenv').config();
   

function checkProperty(property) {
    return function(req, res, next) {
        if (req.body.hasOwnProperty(property)) {
            next();
        } else {
            return res.status(400).json({ success: false, error: `Must have ${property} data.` });
        }
    }
}

async function orderValidation(req, res, next) {
    let orderItems = req.body.order;
    let totalPrice = 0;

    // Hämta alla items i db
    orderItems = await Promise.all(orderItems.map(async item => {
        return await findMenuItem(item.id);
    }));        

    // Summera pris om item finns, annars returnera felmeddelande
    for (const item of orderItems) {
        if (item && item.price) {
            totalPrice = totalPrice + item.price;
        } else {
            return res.status(400).json({ success: false, error: 'One or more order item does not exist.' });
        }
    }

    res.locals.totalPrice = totalPrice;
    next();
}

// Kollar hur lång tid det är kvar
function checkDelivery(order) {
    const timestamp = order.delivery;

    const milliseconds = Date.parse(timestamp) - Date.now();
    const minutes = Math.floor(milliseconds / 60000);

    return minutes;
}

// Kollar diff mellan leveranstid och nu
function isDelivered(order) {
    const diff = Date.parse(order.delivery) - Date.now();
    if (diff > 0) {
        return false;
    } else {
        return true;
    }
}

// Skapar leveranstid
function plannedDelivery() {
    const delivery = new Date(Date.now() + (20 * 60 * 1000)).toLocaleString();
    return delivery;
}

// validera och skapa nytt objekt i menyn

function createNewItem(reqBody) {
    const date = new Date().toLocaleString();
    const newItem = {
      id: reqBody.id,
      title: reqBody.title,
      desc: reqBody.title,
      price: reqBody.price,
      createdAt: date,
    };
  
    const newItemSchema = Joi.object({
      id: Joi.string().required(),
      title: Joi.string().required(),
      desc: Joi.string().required(),
      price: Joi.number().required(),
    }).unknown(false);
  
    const { error } = newItemSchema.validate(reqBody);
  
    if (error) {
      return { error: error.details[0].message };
    }
  
    return { newItem };
  };
  

  // uppdatera item i menyn

  function uppdateItem(reqBody) {
    const date = new Date().toLocaleString();
    const newItem = {
      id: reqBody.id,
      title: reqBody.title,
      desc: reqBody.title,
      price: reqBody.price,
      uppdatedAt: date,
    };
  
    const newItemSchema = Joi.object({
      id: Joi.string().required(),
      title: Joi.string().required(),
      desc: Joi.string().required(),
      price: Joi.number().required(),
    }).unknown(false);
  
    const { error } = newItemSchema.validate(reqBody);
  
    if (error) {
      return { error: error.details[0].message };
    }
  
    return { newItem };
  };

  const secret = process.env.TOKEN_SECRET || 'your_secret_key';

  function signToken(user) {
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role 
    };
  
    return jwt.sign(payload, process.env.TOKEN_SECRET, { expiresIn: '1h' });
  }

function verifyAdminToken(req, res, next) {
  const token = req.header('auth-token');
  if (!token) return res.status(401).send('Access Denied');

  try {
    const verified = jwt.verify(token, secret);
    if (verified.role === 'admin') {
      req.user = verified;
      next();
    } else {
      res.status(403).send('Forbidden');
    }
  } catch (err) {
    res.status(400).send('Invalid Token');
  }
}

// skapa kampanjerbjudanden 

module.exports = { signToken };


module.exports = {
    checkProperty,
    checkDelivery,
    plannedDelivery,
    isDelivered,
    orderValidation,
    createNewItem,
    uppdateItem,
    signToken,
    verifyAdminToken
}