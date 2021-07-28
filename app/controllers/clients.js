const Client = include("models/client");

class clientController {
    async getClients(req, res, next) {
        try {
            const clients = await Client.find();
            res.status(200).json({ data: { clients } });
        } catch (error) {
            res.status(404).json({ status: 'fial', message: error });
        }
        
    }
    async getClient(req, res, next) {
        try {
            const client = await Client.findById(req.params.id);
            res.status(200).json({ data: { client } });
        } catch (error) {
            res.status(404).json({
                status: 'fail',
                message: error
            });
        }
    }
    async addClient(req, res, next) {
        try {
            const data = await Client.create(req.body);
            res.status(201).json({ data });
        } catch (error) {
            res.status(400).json({
                status: 'fial',
                message: error
            });
        }
    }
    async updateClient(req, res, next) {
        try {
            const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
            res.status(200).json({ client });
        } catch (error) {
            res.status(404).json({
                status: 'fail',
                message: error
            });
        }
    }
    async deleteClient(req, res, next) {
        try {
            await Client.findByIdAndDelete(req.params.id);
            res.status(200).json({ message: 'Client deleted successfully!' });
        } catch (error) {
            res.status(404).json({
                status: 'fail',
                message: error
            });
        }
    }

    async activate(req, res, next) {
        try {
            if (!req.body.active) {
                return res.status(400).json({ status: 'fail', message: 'parameter missing' });
            }
            if (!req.params.id) {
                return res.status(400).json({ status: 'fail', message: 'id is missing' });
            }

            const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
            res.status(200).json({ client });

        } catch (error) {
            res.status(404).json({
                status: 'fail',
                message: error
            });
        }
    }
}

module.exports = new clientController();