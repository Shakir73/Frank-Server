const BankAccount = include("models/bank");
const Transporter = include("models/transporter");
const User = include('models/user');

class BanksController {
  
  async add(user, data) {
    data.user = user._id;
    let accounts = await BankAccount.findByUser(data.user);
    if (accounts.length == 0) {
      data.defaultAccount = true;
    }
    const bank = new BankAccount(data);
    await bank.save();
    if (data.defaultAccount) {
      await Transporter.updateTransporter(user._id, {
        bankInfo: bank._id
      });
    }

    const transporter = await Transporter.findById(user._id);
    return { status: 200, data: transporter };
  }
  async changeActiveStatus(user, data) {
    await BankAccount.markInactiveByUser(user._id);
    await BankAccount.markActiveById(data._id);
    await Transporter.updateTransporter(user._id, {
      bankInfo: data._id
    });
    const transporter = await Transporter.findById(user._id);
    return { status: 200, data: transporter };
  }

  async getByUser(user) {
    console.log(user);
    let accounts = await BankAccount.findByUser(user._id);
    return { status: 200, data: accounts };
  }

  async getAll() {
    let accounts = await BankAccount.find().sort({ defaultAccount: -1 });
    return { status: 200, count: accounts.length, data: accounts };
  }

  async getAccount(user, id) {
    let account = await BankAccount.findById(id);
    return { status: 200, data: account };
  }

  async deleteAccount(id) {
    await BankAccount.findByIdAndDelete(id);
    return { status: 202, message: 'Deleted successfully' };
  }

  async updateAccount(id, data, user) {
    console.log(user);
    if (data.defaultAccount === true) {
      let account = await BankAccount.find({ user: user._id || data.user, defaultAccount: true });
      for (let index = 0; index < account.length; index++) {
        const element = account[index];
        await BankAccount.findOneAndUpdate({ _id: element._id }, { defaultAccount: false });
      }
    }
    const bank = await BankAccount.findByIdAndUpdate(id, data, { runValidators: true, new: true });
      return { status: 200, data: bank };
  }
}
module.exports = new BanksController();
