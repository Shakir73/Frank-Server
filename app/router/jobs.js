const express = require("express");
const router = express.Router();

const {
    getJob,
    getJobById,
    addJob,
    updateJob,
    deleteJob,
    // activate
} = require('../controllers/jobs');

// router.post('/activate/:id', activate);

router
  .route('/')
  .get(getJob)
  .post(addJob);

router
  .route('/:id')
  .get(getJobById)
  .post(updateJob)
  .delete(deleteJob)

module.exports = router;