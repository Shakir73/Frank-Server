const express = require("express");
const router = express.Router();

const {
    getContacts,
    getContactById,
    addContact,
    deleteContact
} = require('../controllers/contacts');

router
  .route('/')
  .get(getContacts)
  .post(addContact);

router
  .route('/:id')
  .get(getContactById)
  .delete(deleteContact)

module.exports = router;