const express = require("express");
const router = express.Router();

const {
    getPrices,
    getPriceById,
    updatePrice,
    deletePrice,
    addPrice,
    getPrice,
    findByService,
    addPolicy,
    getPriceEcommerce,
    getPolicyByStore,
    getPolicyByStores,
    addMultiplePoliciesForStore,
    addSinglePolicyForStore,
    singlePolicyForStore,
    search
} = require('../controllers/prices');

router.post('/get-price/:id', getPrice);
router.post('/get-price-ecommerce/:id', getPriceEcommerce);
router.post('/add-policy', addPolicy);
router.post('/add-multiple-policies-store', addMultiplePoliciesForStore);
router.post('/add-single-policy-store', addSinglePolicyForStore);
router.post('/add-single-policy-store/:id', singlePolicyForStore); // Inheritance from created Policies (is to applied in free time)
router.get('/get-by-service', findByService);

router.get('/get-policy-by-store/:id', getPolicyByStore);
router.get('/get-policy-by-stores', getPolicyByStores);

router.post('/search', search);

router
  .route('/')
  .get(getPrices)
  .post(addPrice)

router
  .route('/:id')
  .get(getPriceById)
  .post(updatePrice)
  .delete(deletePrice)

module.exports = router;