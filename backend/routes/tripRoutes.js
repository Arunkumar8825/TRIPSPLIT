const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');

router.get('/', tripController.getAllTrips);
router.post('/', tripController.createTrip);
router.get('/:id', tripController.getTripById);
router.put('/:id', tripController.updateTrip);
router.delete('/:id', tripController.deleteTrip);

router.post('/:id/members', tripController.addMember);
router.delete('/:id/members/:memberId', tripController.deleteMember);

router.post('/:id/expenses', tripController.addExpense);
router.delete('/:id/expenses/:expenseId', tripController.deleteExpense);

router.post('/:id/photos', tripController.addPhoto);
router.delete('/:id/photos/:photoId', tripController.deletePhoto);

module.exports = router;