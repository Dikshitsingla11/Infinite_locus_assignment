const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');

router.get('/', auth, async (req, res) => {
    try {
        const events = await Event.find().populate('organizer', 'username');
        res.json(events);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const { name, description, date, location } = req.body;
        const organizer = await User.findById(req.user.id);
        if (organizer.role !== 'ORGANIZER') {
            return res.status(401).json({ msg: 'User not authorized' });
        }
        const newEvent = new Event({
            name,
            description,
            date,
            location,
            organizer: req.user.id
        });
        const event = await newEvent.save();
        res.json(event);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/:id/register', auth, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }
        const registration = new Registration({
            user: req.user.id,
            event: req.params.id
        });
        await registration.save();
        const registrationCount = await Registration.countDocuments({ event: req.params.id });
        req.app.get('io').emit('registrations', { eventId: req.params.id, count: registrationCount });
        res.json({ msg: 'Registered successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
