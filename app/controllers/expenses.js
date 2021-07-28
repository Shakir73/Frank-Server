"use strict";

const Expense = include("models/expense");

class ExpensesController {
  findAll() {
    return Expense.find().exec();
  }

  async add(user, data) {
    if (!data.order || !data.amount) {
      return { status: 422, message: "Parameters missing" };
    }
    try {
      let expense = new Expense(data);
      expense.transporter = user._id;
      await expense.save();
      return { status: 200, data: expense };
    } catch (error) {
      return { status: 400, error };
    }
  }

  async findByTransporter(user, contractorId) {
    let data = await Expense.findByTransporter(contractorId);
    return { status: 200, data };
  }

  async findByOrder(user, id) {
    let data = await Expense.findByOrder(id);
    return { status: 200, data };
  }

  findByUser(user, contractorId) {
    console.log("=>", contractorId);
    return Expense.findByUser(contractorId);
  }

  findForToday() {
    var date = (new Date() / 1000) * 1000 - 96 * 60 * 60 * 1000;
    return Expense.findAfterTime(date);
  }
}

var exports = (module.exports = new ExpensesController());
