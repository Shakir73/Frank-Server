const router = require("express").Router();

const { adminGuard } = require("../components/guards");
const orderController = include("controllers/orders");

router.get("/all", adminGuard, (req, res, next) => {
  res.json(orderController.getAll(req.user));
});

router.get("/new/:page*?", getNew);
function getNew(req, res, next) {
  res.json(orderController.getNew(req.user, req.params.page));
}

router.get("/newrequest", getNewRequest);
function getNewRequest(req, res, next) {
  res.json(orderController.getNewReqCount(req.user));
}

router.get("/my/:status/:page*?", my);
function my(req, res, next) {
  res.json(
    orderController.getMyRequests(req.user, req.params.status, req.params.page)
  );
}

router.get("/space/:id/:status*?", getBySpace);
function getBySpace(req, res, next) {
  res.json(
    orderController.getBySpace(req.user, req.params.id, req.params.status)
  );
}

router.get("/drivers/:status", getDriversRequests);
function getDriversRequests(req, res, next) {
  res.json(orderController.getDriversRequests(req.user, req.params.status));
}

router.get("/search/:orderNumber", searchByOrderNumber);
function searchByOrderNumber(req, res, next) {
  res.json(
    orderController.searchByOrderNumber(req.user, req.params.orderNumber)
  );
}

router.post("/searchbyplace", searchByPlace);
function searchByPlace(req, res, next) {
  res.json(orderController.searchByPlace(req.user, req.body));
}

router.post("/search-by-places", searchByPlace);
function searchByPlace(req, res, next) {
  res.json(orderController.searchByPlaces(req.user, req.body));
}

router.get("/getbyitemtype/:itemType", getByItemType);
function getByItemType(req, res, next) {
  res.json(orderController.getByItemType(req.user, req.params));
}

router.post("/searchmyorders", searchMyOrders);
function searchMyOrders(req, res, next) {
  res.json(orderController.searchMyOrders(req.user, req.body));
}

router.post("/filter", getByModeOfTransportation);
function getByModeOfTransportation(req, res, next) {
  res.json(orderController.getByModeOfTransportation(req.user, req.body));
}

router.post("/searchdriversorders", searchDriversOrders);
function searchDriversOrders(req, res, next) {
  res.json(orderController.searchDriversOrders(req.user, req.body));
}

router.post("/find", findUnderPolygon);
function findUnderPolygon(req, res, next) {
  res.json(orderController.findUnderPolygon(req.user, req.body));
}

router.get("/user/:status/:id*?", userRequests);
function userRequests(req, res, next) {
  res.json(
    orderController.getUserRequests(req.user, req.params.status, req.params.id)
  );
}

router.get("/bydriver/:driver/:status", getOrdersByDriver);
function getOrdersByDriver(req, res, next) {
  res.json(
    orderController.getOrdersByDriver(
      req.user,
      req.params.driver,
      req.params.status
    )
  );
}

router.get("/get/:id", getById);
function getById(req, res, next) {
  res.json(orderController.getById(req.user, req.params.id));
}

router.get("/changelog/:id/:status", changeLogById);
function changeLogById(req, res, next) {
  res.json(orderController.changeLogById(req.user, req.params));
}

router.get("/track/:orderNumber", trackById);
function trackById(req, res, next) {
  res.json(orderController.trackById(req.params.orderNumber));
}

router.get("/autobreak/:id", autoBreakRouteById);
function autoBreakRouteById(req, res, next) {
  res.json(orderController.autoBreakRouteById(req.user, req.params.id));
}

router.post("/add", addOrder);
function addOrder(req, res, next) {
  res.json(orderController.addOrder(req.user, req.body));
}

router.post("/addEcommerceOrder", addEcommerceOrder);
function addEcommerceOrder(req, res, next) {
  res.json(orderController.addEcommerceOrder(req.user, req.body, res));
}

router.post("/createShipment", createShipment);
function createShipment(req, res, next) {
  res.json(orderController.createShipment(req.user, req.body, res));
}

router.post("/createBulkShipment", createBulkShipment);
function createBulkShipment(req, res, next) {
  console.log(req.body);
  res.json(orderController.createBulkShipment(req.user, req.body, res));
}

router.post("/create-shipments", function (req, res, next) {
  res.json(orderController.createShipments(req.user, req.body));
});

router.post("/addReturnOrder", addReturnOrder);
function addReturnOrder(req, res, next) {
  res.json(orderController.addReturnOrder(req.body));
}

router.post("/rates", getOrderRates);
function getOrderRates(req, res, next) {
  res.json(orderController.getOrderRates(req.user, req.body));
}

router.post("/getestimation", getEstimatesOpen);
function getEstimatesOpen(req, res, next) {
  res.json(orderController.getEstimatesOpen(req.user, req.body));
}

router.post("/updatestatus", updateStatus);
function updateStatus(req, res, next) {
  var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  res.json(orderController.updateStatus(req.user, req.body, ip));
}

router.post("/readyForPickup", readyForPickup);
function readyForPickup(req, res, next) {
  var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  res.json(orderController.readyForPickup(req.user, req.body, ip));
}

router.post("/setPickupDate", setPickupDate);
function setPickupDate(req, res, next) {
  var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  res.json(orderController.updateOrderPickupDate(req.user, req.body, ip));
}

router.post("/cancel", cancel);
function cancel(req, res, next) {
  var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  console.log("user ip =>", ip);
  res.json(orderController.cancel(req.user, req.body, ip));
}

router.post("/updateroute", breakRoutes);
function breakRoutes(req, res, next) {
  res.json(orderController.breakRoutes(req.user, req.body));
}

router.post("/updatebycustomer", updateOrderByCustomer);
function updateOrderByCustomer(req, res, next) {
  res.json(orderController.updateOrderByCustomer(req.user, req.body));
}

router.post("/update", updateOrder);
function updateOrder(req, res, next) {
  res.json(orderController.updateOrder(req.user, req.body));
}

router.post("/edit", updateOrderPublic);
function updateOrderPublic(req, res, next) {
  res.json(orderController.updateOrderPublic(req.body));
}

router.post("/reschedule", requestReschedule);
function requestReschedule(req, res, next) {
  res.json(orderController.requestReschedule(req.user, req.body));
}

router.post("/changelocation", requestLocationChange);
function requestLocationChange(req, res, next) {
  res.json(orderController.requestLocationChange(req.user, req.body));
}

router.post("/confirmupdate", confirmUpdateOrder);
function confirmUpdateOrder(req, res, next) {
  res.json(orderController.confirmUpdateOrder(req.user, req.body));
}

router.post("/rate", rate);
function rate(req, res, next) {
  res.json(orderController.rate(req.user, req.body));
}

router.post("/complain", complain);
function complain(req, res, next) {
  res.json(orderController.complain(req.user, req.body));
}

router.post("/dispute", fileDispute);
function fileDispute(req, res, next) {
  res.json(orderController.fileDispute(req.user, req.body));
}

router.post("/assign", assign);
function assign(req, res, next) {
  res.json(orderController.assign(req.user, req.body));
}

router.post("/requestEditingToken", requestEditingToken);
function requestEditingToken(req, res, next) {
  res.json(orderController.requestEditingToken(res, req.body));
}

router.post("/requestUserLogin", requestUserLoginForTracking);
function requestUserLoginForTracking(req, res, next) {
  res.json(orderController.requestUserLoginForTracking(res, req.body));
}

router.post("/requestReturnToken", requestReturnToken);
function requestReturnToken(req, res, next) {
  res.json(orderController.requestReturnToken(res, req.body));
}

router.get("/getByToken/:token", getByEditingToken);
function getByEditingToken(req, res, next) {
  res.json(orderController.getByEditingToken(req.params.token));
}

router.get("/earningbytransporter/:transporter", getEarningByTransporter);
function getEarningByTransporter(req, res, next) {
  res.json(
    orderController.getEarningByTransporter(req.user, req.params.transporter)
  );
}

router.get("/store/:status?/:type?", function (req, res, next) {
  res.json(
    orderController.getOrderByStatusAndType(
      req.user,
      req.params.status,
      req.params.type
    )
  );
});

router.get("/store/:id/:status/:type/:page*?", getByStore);
function getByStore(req, res, next) {
  res.json(
    orderController.getByStore(
      req.user,
      req.params.id,
      req.params.status,
      req.params.type,
      req.params.page
    )
  );
}

router.get("/stats/:storeId", function (req, res, next) {
  res.json(orderController.stats(req.user, req.params.storeId));
});

router.get("/storeStats/:store", statsByStore);
function statsByStore(req, res, next) {
  res.json(orderController.statsByStore(req.user, req.params.store));
}

router.post("/storeStats", getStatsByStore);
function getStatsByStore(req, res, next) {
  res.json(orderController.getStatsByStore(req.user, req.body));
}

router.get("/orderByStatus", function (req, res, next) {
  res.json(orderController.orderByStatus(req.user));
});

router.get("/getOrdersByTransporter/:id", function (req, res, next) {
  res
    .status(200)
    .json(orderController.getOrdersByTransporter(req.user, req.params.id));
});

router.delete("/:id", function (req, res, next) {
  res.status(200).json(orderController.deleteOrder(req.user, req.params.id));
});

router.get("/orders-stats/:id", function (req, res, next) {
  res.status(200).json(orderController.ordersStats(req.user, req.params.id));
});

router.post("/change-dropoff-date/:orderNumber", function (req, res, next) {
  res
    .status(200)
    .json(
      orderController.changeDropoffDate(
        req.user,
        req.params.orderNumber,
        req.body
      )
    );
});

router.post("/about-address/:orderNumber", function (req, res, next) {
  res
    .status(200)
    .json(
      orderController.aboutToAddress(req.user, req.params.orderNumber, req.body)
    );
});

module.exports = router;
