const express = require("express");
const router = express.Router();

const {
    getClients,
    getClient,
    addClient,
    updateClient,
    deleteClient,
    activate
} = require('../controllers/clients');

router.post('/activate/:id', activate);

router
  .route('/')
  .get(getClients)
  .post(addClient);

router
  .route('/:id')
  .get(getClient)
  .post(updateClient)
  .delete(deleteClient);

module.exports = router;
