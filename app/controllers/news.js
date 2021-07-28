const News = require('./../models/news');

class newsController {
    async getNews(req, res, next) {
        try {
            const news = await News.find().sort({ createdAt: -1 });
            res.status(200).json({ data: { news } });
        } catch (error) {
            res.status(404).json({
                status: 'fial',
                message: error
            });
        }
    }
    async getNewsById(req, res, next) {
        try {
            const news = await News.findById(req.params.id);
            res.status(200).json({ data: { news } });
        } catch (error) {
            res.status(404).json({
                status: 'fail',
                message: error
            });
        }
    }
    async addNews(req, res, next) {
        try {
            const data = await News.create(req.body);
            res.status(201).json({ data });
        } catch (error) {
            res.status(400).json({
                status: 'fail',
                message: error
            });
        }
    }
    async updateNews(req, res, next) {
        try {
            const news = await News.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
            res.status(200).json({ news });
        } catch (error) {
            res.status(404).json({
                status: 'fail',
                message: error
            });
        }
    }

    async deleteNews(req, res, next) {
        try {
            await News.findByIdAndDelete(req.params.id);
            res.status(200).json({ message: 'News Deleted Successfully' });
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

            const client = await News.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
            res.status(200).json({ client });

        } catch (error) {
            res.status(404).json({
                status: 'fail',
                message: error
            });
        }
    }
}

module.exports = new newsController();