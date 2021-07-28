const Policy = include("models/policy");

class PolicyController {
    async create(user, data) {
        const policy = await Policy.create(data);
        return { status: 201, data: policy };
    }

    async getAll(user, data) {
        const policies = await Policy.find();
        return { status: 200, count: policies.length, data: policies };
    }

    async get(user, id) {
        const policies = await Policy.find({ _id: id });
        return { status: 200, count: policies.length, data: policies };
    }

    async update(user, data, id) {
        const update = await Policy.findByIdAndUpdate(id, data, { runValidators: true, new: true });
        return { status: 200, data: update };
    }

    async deleteAll (user) {
        await Policy.deleteMany();
        return { status: 200, message: 'Policy deleted successfully.' };
    }
}

module.exports = new PolicyController();