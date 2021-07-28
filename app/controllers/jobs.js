const Job = require('./../models/job');

class jobsController {
    async getJob(req, res, next) {
        try {
            const jobs = await Job.find().sort({ createdAt: -1 });
            res.status(200).json({ data: { jobs } });
        } catch (error) {
            res.status(404).json({
                status: 'fial',
                message: error
            });
        }
    }
    async getJobById(req, res, next) {
        try {
            const job = await Job.findById(req.params.id);
            res.status(200).json({ data: { job } });
        } catch (error) {
            res.status(404).json({
                status: 'fail',
                message: error
            });
        }
    }
    async addJob(req, res, next) {
        try {
            const data = await Job.create(req.body);
            res.status(201).json({ data });
        } catch (error) {
            res.status(400).json({
                status: 'fail',
                message: error
            });
        }
    }
    async updateJob(req, res, next) {
        try {
            const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
            res.status(200).json({ job });
        } catch (error) {
            res.status(404).json({
                status: 'fail',
                message: error
            });
        }
    }

    async deleteJob(req, res, next) {
        try {
            await Job.findByIdAndDelete(req.params.id);
            res.status(200).json({ message: 'Job Deleted Successfully' });
        } catch (error) {
            res.status(404).json({
                status: 'fail',
                message: error
            });
        }
    }

    // async activate(req, res, next) {
    //     try {
    //         if (!req.body.active) {
    //             return res.status(400).json({ status: 'fail', message: 'parameter missing' });
    //         }
    //         if (!req.params.id) {
    //             return res.status(400).json({ status: 'fail', message: 'id is missing' });
    //         }

    //         const client = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    //         res.status(200).json({ client });

    //     } catch (error) {
    //         res.status(404).json({
    //             status: 'fail',
    //             message: error
    //         });
    //     }
    // }
}

module.exports = new jobsController();