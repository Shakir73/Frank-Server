const express = require("express");
const router = express.Router();

const {
    getNews,
    getNewsById,
    addNews,
    updateNews,
    deleteNews,
    activate
} = require('../controllers/news');

router.post('/activate/:id', activate);

router
  .route('/')
  .get(getNews)
  .post(addNews);

router
  .route('/:id')
  .get(getNewsById)
  .post(updateNews)
  .delete(deleteNews)

module.exports = router;