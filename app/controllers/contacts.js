const Contact = require('./../models/contact');

class contactsController {
    async getContacts(req, res, next) {
        try {
            const contacts = await Contact.find().sort({ createdAt: -1 });
            res.status(200).json({ data: { contacts } });
        } catch (error) {
            res.status(404).json({
                status: 'fial',
                message: error
            });
        }
    }
    async getContactById(req, res, next) {
        try {
            const contact = await Contact.findById(req.params.id);
            res.status(200).json({ data: { contact } });
        } catch (error) {
            res.status(404).json({
                status: 'fail',
                message: error
            });
        }
    }
    async addContact(req, res, next) {
        try {
            const data = await Contact.create(req.body);
            res.status(201).json({ data });
        } catch (error) {
            res.status(400).json({
                status: 'fail',
                message: error
            });
        }
    }

    async deleteContact(req, res, next) {
        try {
            await Contact.findByIdAndDelete(req.params.id);
            res.status(200).json({ message: 'Contact Deleted Successfully' });
        } catch (error) {
            res.status(404).json({
                status: 'fail',
                message: error
            });
        }
    }
}

module.exports = new contactsController();