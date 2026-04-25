const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth.middleware");
const { getAllData, deleteUser, updateUserPassword, deleteRestaurant, updateRestaurant } = require("../controllers/editoradmin.controller");

router.use(protect, authorize("editoradmin"));

router.get("/data", getAllData);
router.delete("/user/:id", deleteUser);
router.put("/user/:id/password", updateUserPassword);
router.delete("/restaurant/:id", deleteRestaurant);
router.put("/restaurant/:id", updateRestaurant);

module.exports = router;
